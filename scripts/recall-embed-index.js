#!/usr/bin/env node
/**
 * recall-embed-index.js — build/refresh the semantic index for /recall.
 * ======================================================================
 * Embeds (via local Ollama, embeddinggemma:300m by default — already on disk,
 * revived from the retired v8.0.0 Living Memory stack) a compact text per:
 *   - vault page:    title + summary + keywords + H2 headings  (≤512 chars)
 *   - graphify node: its label (deduped by canonKey)
 * into cache/recall-embeddings.json, which recall.js cosine-ranks at query
 * time (230-ish dot products — sub-millisecond).
 *
 * INCREMENTAL: entries are keyed by vault-relative path (pages) or
 * node:<canonKey> (labels) and stamped with the source mtime — only changed
 * sources re-embed. A no-change rerun embeds nothing and exits fast.
 *
 * Refresh cadence: weekly via the weekly-graph-sync scheduled task (ordered
 * right after graph.json regeneration) + on demand. Deliberately NOT run at
 * session start (violates the startup latency budget).
 *
 * Fail-soft everywhere: Ollama down / model missing → report and exit 0 with
 * the old cache intact; recall.js degrades to lexical ranking.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { canonKey } = require('../hooks/lib/slug');
const { ollamaEmbed, isBreakerOpen, MODELS, OLLAMA_BASE } = require('../hooks/lib/ollama');

const HOME = os.homedir();
const WIKI = path.join(HOME, 'Documents', 'Wiki', 'wiki');
// E2 (v9 Wave 2) coverage: session-log HANDOFF summaries were outside the semantic
// index. Add only `session-log/handoffs` (28 high-signal frontmatter'd summaries) —
// NOT all of session-log (transcripts/ + daily claude/ logs = 200+ noisy files).
const NAMESPACES = ['personal', 'engineering', 'concept', 'entity', 'source', 'synthesis', 'web-dev', 'app-dev', 'session-log/handoffs'];
const GRAPH_JSON = path.join(WIKI, 'graphify-out', 'graph.json');
const CACHE_FILE = path.join(HOME, '.claude', 'cache', 'recall-embeddings.json');

// E1 (v9 Wave 2): raised 512→1500. The model swap to qwen3-embedding was REFUTED
// (embeddinggemma:300m won the canary eval 94% vs 88%), but embeddinggemma's ctx is
// ~2048 tokens (≈8000 chars), so 512 chars was a self-imposed cap forcing summary
// trims (KNOWLEDGE-172 class). 1500 is neutral-or-better on the canary suite and
// removes the trim-to-fit pain. ~375 tokens — well within the model's window.
const TEXT_CAP = 1500;
const BATCH_SIZE = 32;
const ROUND = 1e5; // 5 decimal places

function collectCorpus() {
  const items = []; // { key, target, display, text, mtime }

  const walk = (dir, rel, depth) => {
    if (depth > 3) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === '_index.md') continue;
      const full = path.join(dir, e.name);
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(full, r, depth + 1);
      else if (e.name.endsWith('.md')) {
        try {
          const st = fs.statSync(full);
          const text = pageText(full, r);
          if (text) items.push({ key: r, target: r, display: `[[${r}]]`, text, mtime: Math.round(st.mtimeMs) });
        } catch {
          /* unreadable page — skip */
        }
      }
    }
  };
  for (const ns of NAMESPACES) walk(path.join(WIKI, ns), ns, 0);

  // graphify node labels, deduped by canonKey (post-dedup graph still carries
  // near-duplicate labels from chunked extraction).
  try {
    const st = fs.statSync(GRAPH_JSON);
    const g = JSON.parse(fs.readFileSync(GRAPH_JSON, 'utf8'));
    const seen = new Set();
    for (const n of g.nodes || []) {
      const ck = canonKey(n.label);
      if (!ck || seen.has(ck)) continue;
      seen.add(ck);
      const target = n.source_file ? n.source_file.replace(/\\/g, '/') : `node:${ck}`;
      items.push({
        key: `node:${ck}`,
        target,
        display: n.source_file ? `[[${target}]]` : `graph: ${n.label}`,
        text: n.label,
        mtime: Math.round(st.mtimeMs),
      });
    }
  } catch {
    /* graph absent — vault-only index */
  }
  return items;
}

function pageText(full, rel) {
  const raw = fs.readFileSync(full, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  const fmText = fm ? fm[1] : '';
  const title = (fmText.match(/^title:\s*(.+)$/m) || [])[1] || path.basename(rel, '.md');
  const summary = (fmText.match(/^summary:\s*([\s\S]*?)(?=\n[a-z_-]+:|\n---)/m) || [])[1] || '';
  // keywords: support BOTH YAML forms — list AND inline "[a, b]" (the vault's dominant form,
  // silently dropped by the list-only regex until 2026-07-09).
  const keywords = ((fmText.match(/^keywords:\n((?:- .+\n?)+)/m) || [])[1]
    || (fmText.match(/^keywords:\s*\[([^\]]*)\]/m) || [])[1] || '').replace(/- /g, ' ').replace(/,/g, ' ');
  const body = fm ? raw.slice(fm[0].length) : raw;
  const h2s = (body.match(/^## .+$/gm) || []).join(' ');
  return [title, summary, keywords, h2s].join(' ').replace(/\s+/g, ' ').trim().slice(0, TEXT_CAP);
}

async function main() {
  if (isBreakerOpen(MODELS.embed)) {
    console.log('embed index: Ollama breaker is open for the embed model — skipped (old cache intact).');
    return;
  }
  // Model health probe (1 tiny call) — fail soft with the pull hint.
  const probe = await ollamaEmbed({ input: ['probe'], timeoutMs: 30000 });
  if (!probe) {
    console.log(
      `embed index: cannot embed via ${OLLAMA_BASE} with model ${MODELS.embed} — ` +
        `is Ollama running and the model pulled? (ollama pull ${MODELS.embed}). Old cache intact.`
    );
    return;
  }
  const dims = probe[0].length;

  const corpus = collectCorpus();
  let cache = { model: MODELS.embed, dims, built_at: null, entries: {} };
  try {
    const old = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (old.model === MODELS.embed && old.dims === dims) cache.entries = old.entries || {};
  } catch {
    /* cold build */
  }

  const fresh = {};
  const toEmbed = [];
  for (const item of corpus) {
    const old = cache.entries[item.key];
    if (old && old.mtime === item.mtime && Array.isArray(old.vec)) {
      fresh[item.key] = { ...old, target: item.target, display: item.display };
    } else {
      toEmbed.push(item);
    }
  }

  let embedded = 0;
  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const vecs = await ollamaEmbed({ input: batch.map((b) => b.text), timeoutMs: 60000 });
    if (!vecs) {
      // Fail-soft (v8.14 audit): carry forward the previous vectors for the
      // not-yet-embedded remainder — their old mtime makes the next run retry
      // them. Previously the whole remainder was silently dropped from the
      // cache, contradicting the "old cache intact" contract in the header.
      let carried = 0;
      for (const item of toEmbed.slice(i)) {
        if (cache.entries && cache.entries[item.key]) {
          fresh[item.key] = cache.entries[item.key];
          carried++;
        }
      }
      console.log(`embed index: batch ${i / BATCH_SIZE + 1} failed — keeping ${embedded} new + ${carried} carried-over old entries.`);
      break;
    }
    batch.forEach((item, j) => {
      fresh[item.key] = {
        target: item.target,
        display: item.display,
        mtime: item.mtime,
        vec: vecs[j].map((v) => Math.round(v * ROUND) / ROUND),
      };
      embedded++;
    });
  }

  cache.entries = fresh;
  cache.built_at = new Date().toISOString();
  const tmp = CACHE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache));
  fs.renameSync(tmp, CACHE_FILE);

  const bytes = fs.statSync(CACHE_FILE).size;
  console.log(
    `embed index: ${Object.keys(fresh).length} entries (${embedded} embedded, ` +
      `${Object.keys(fresh).length - embedded} unchanged), model ${MODELS.embed}, ${dims}d, ${(bytes / 1024).toFixed(0)}KB.`
  );
}

main().catch((e) => {
  console.log(`embed index: error — ${e.message}. Old cache intact.`);
  process.exit(0);
});
