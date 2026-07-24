#!/usr/bin/env node
/**
 * recall.js — unified retrieval router across every ATLAS knowledge layer.
 * ========================================================================
 * One query, five sources, deterministic rank fusion, zero LLM cost:
 *   1. Vault pages    — fs scan of wiki/{personal,engineering,concept,entity,
 *                       source,synthesis} (filename, frontmatter, headings, body)
 *   2. Catalog        — wiki/hot.md rows (recency) + wiki/index.md tables
 *   3. atlas-kg       — entity-name match + current triples (in-process require)
 *   4. graphify       — graphify-out/graph.json label match → source_file pointer
 *   5. action-graph   — current session's hot working set (in-process require)
 *
 * Ranking is deterministic (see SCORING below). The core trick is the merge
 * rule: hits collapse to a canonical target, and a target found by k
 * independent sources gets +1.0×(k−1) — cross-source corroboration replaces an
 * LLM judge. The five sources have independent failure modes, which is what
 * makes counting them meaningful.
 *
 * Semantic layer (Phase 2): cosine fusion over cache/recall-embeddings.json,
 * fail-open to lexical when Ollama/cache is unavailable.
 *
 * Usage:  node recall.js [--json] [--no-semantic|--semantic-only] "<query>"
 * Output: ≤8 targets, compact cited block, hard-capped ~600 tokens (it is
 *         injected into Claude's context by commands/recall.md).
 * Wall guard: 3s total — partial results beat a hung command.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { canonKey } = require('../hooks/lib/slug');

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const WIKI = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const NAMESPACES = ['personal', 'engineering', 'concept', 'entity', 'source', 'synthesis', 'web-dev', 'app-dev'];
const GRAPH_JSON = path.join(WIKI, 'graphify-out', 'graph.json');
const EMBED_CACHE = path.join(CLAUDE_DIR, 'cache', 'recall-embeddings.json');

const MAX_RESULTS = 8;
const WALL_MS = 3000;
const OUTPUT_CHAR_CAP = 2400; // ~600 tokens

// Phase-2 fusion constants — tuned 2026-06-09 against embeddinggemma:300m's
// COMPRESSED similarity distribution on this corpus (3 probe queries:
// p50 ≈ 0.33-0.38, best relevant hits 0.50-0.58, nothing above 0.60).
// Normalization runs floor→ceil rather than floor→1.0 so a real top hit
// (~0.58) earns most of the weight instead of ~30% of it.
const SEM_FLOOR = 0.40; // cosine below this contributes nothing
const SEM_CEIL = 0.65; // treated as a perfect semantic match
const SEM_ENTRY = 0.47; // semantic-only hits must clear this
const SEM_WEIGHT = 3.0; // max additive boost at/above SEM_CEIL
const SEM_ONLY_WEIGHT = 4.0;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'for', 'to', 'with', 'and', 'or', 'is',
  'are', 'was', 'were', 'be', 'what', 'how', 'did', 'do', 'does', 'my', 'i',
  'we', 'you', 'it', 'about', 'that', 'this', 'these', 'from', 'at', 'by', 'me',
]);

function tokenize(q) {
  return canonKey(q)
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t));
}

// matchStrength: 1 = every token present, 0.5 = at least half, 0 otherwise.
// (The half floor stops a single incidental token — e.g. "topic" — from
// scoring a 3-token query against every page summary.)
function matchStrength(tokens, text) {
  if (!tokens.length) return 0;
  const hay = canonKey(text);
  let found = 0;
  for (const t of tokens) if (hay.includes(t)) found++;
  if (found === tokens.length) return 1;
  return found >= tokens.length / 2 && found > 0 ? 0.5 : 0;
}

// ── Hit collection ───────────────────────────────────────────────────
// hit = { target, display, source, score, note }
// target: canonical join key — vault-relative path when known, else kg:<canonKey>

function vaultHits(tokens) {
  const hits = [];
  for (const ns of NAMESPACES) {
    const dir = path.join(WIKI, ns);
    walk(dir, ns, 0, (rel, full) => {
      let text;
      try {
        text = fs.readFileSync(full, 'utf8');
      } catch {
        return;
      }
      const fm = text.match(/^---\n([\s\S]*?)\n---/);
      const fmText = fm ? fm[1] : '';
      const title = (fmText.match(/^title:\s*(.+)$/m) || [])[1] || '';
      const summary = (fmText.match(/^summary:\s*([\s\S]*?)(?=\n[a-z_-]+:|\n---)/m) || [])[1] || '';
      // keywords: support BOTH YAML forms — list ("keywords:\n- a\n- b") and inline ("keywords: [a, b]");
      // the vault predominantly uses inline, which the list-only regex silently dropped (fixed 2026-07-09).
      const keywords = ((fmText.match(/^keywords:\n((?:- .+\n?)+)/m) || [])[1]
        || (fmText.match(/^keywords:\s*\[([^\]]*)\]/m) || [])[1] || '').replace(/- /g, ' ').replace(/,/g, ' ');
      const body = fm ? text.slice(fm[0].length) : text;

      let best = 0;
      let note = '';

      const sTitle = matchStrength(tokens, title) || matchStrength(tokens, path.basename(rel, '.md'));
      if (sTitle) {
        const exact = canonKey(title) === tokens.join(' ') || canonKey(path.basename(rel, '.md')) === tokens.join(' ');
        best = Math.max(best, (exact ? 5.0 : 3.0) * sTitle);
        note = 'title';
      }
      const sMeta = Math.max(matchStrength(tokens, summary), matchStrength(tokens, keywords));
      if (sMeta && 3.0 * sMeta > best) {
        best = 3.0 * sMeta;
        note = 'summary';
      }
      for (const h of body.match(/^#{1,3} .+$/gm) || []) {
        const sH = matchStrength(tokens, h);
        if (sH && 2.5 * sH > best) {
          best = 2.5 * sH;
          note = 'heading';
        }
      }
      // body lines: 1.5 + 0.2/extra matching line, cap +1.0
      let bodyLines = 0;
      let firstLine = '';
      for (const line of body.split('\n')) {
        if (matchStrength(tokens, line) === 1) {
          bodyLines++;
          if (!firstLine) firstLine = line.trim();
          if (bodyLines > 6) break;
        }
      }
      if (bodyLines) {
        const sBody = 1.5 + Math.min(1.0, (bodyLines - 1) * 0.2);
        if (sBody > best) {
          best = sBody;
          note = firstLine.slice(0, 80);
        }
      }
      if (!best) return;

      // namespace prior
      if (/^(engineering|personal|concept)\//.test(rel)) best += 0.25;
      hits.push({ target: rel, display: `[[${rel}]]`, source: 'vault', score: best, note });
    });
  }
  return hits;
}

function walk(dir, rel, depth, cb) {
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
    if (e.isDirectory()) walk(full, r, depth + 1, cb);
    else if (e.name.endsWith('.md')) cb(r, full);
  }
}

function catalogHits(tokens) {
  const hits = [];
  // index.md: | Title | Path | Created | Summary |
  try {
    const idx = fs.readFileSync(path.join(WIKI, 'index.md'), 'utf8');
    for (const m of idx.matchAll(/^\|\s*([^|]+?)\s*\|\s*([a-z-]+\/[^|]+?\.md)\s*\|\s*[^|]*\|\s*([^|]*)\|?\s*$/gm)) {
      const [, title, rel, summary] = m;
      const s = Math.max(matchStrength(tokens, title) * 4.0, matchStrength(tokens, summary) * 3.0);
      if (s) hits.push({ target: rel.trim(), display: `[[${rel.trim()}]]`, source: 'index', score: s, note: title.trim() });
    }
  } catch {
    /* index absent — fine */
  }
  return hits;
}

// hot.md recency map: rel path → days since touch (computed from date strings).
function hotRecency() {
  const map = new Map();
  try {
    const hot = fs.readFileSync(path.join(WIKI, 'hot.md'), 'utf8');
    const now = Date.now();
    for (const m of hot.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/gm)) {
      const days = (now - new Date(m[2] + 'T00:00:00Z').getTime()) / 86400000;
      const prev = map.get(m[1]);
      if (prev === undefined || days < prev) map.set(m[1], days);
    }
  } catch {
    /* hot absent — no recency boosts */
  }
  return map;
}

function kgHits(tokens) {
  const hits = [];
  try {
    const kg = require(path.join(CLAUDE_DIR, 'hooks', 'atlas-kg.js'));
    const entities = JSON.parse(fs.readFileSync(path.join(CLAUDE_DIR, 'atlas-kg', 'entities.json'), 'utf8'));
    for (const v of Object.values(entities)) {
      const s = matchStrength(tokens, v.name);
      if (!s) continue;
      let rels = [];
      try {
        rels = kg.queryEntity(v.name) || [];
      } catch {
        /* entity unreadable — name match still counts */
      }
      const score = 3.0 * s + (rels.length ? 0.5 : 0);
      const note = rels
        .slice(0, 2)
        .map((r) => `${r.predicate}→${r.object_name || r.object}`)
        .join(', ');
      hits.push({
        target: `kg:${canonKey(v.name)}`,
        display: `atlas-kg: ${v.name} (${v.type})`,
        source: 'kg',
        score,
        note,
      });
    }
  } catch {
    /* KG unavailable — other sources carry the query */
  }
  return hits;
}

function graphifyHits(tokens) {
  const hits = [];
  try {
    const g = JSON.parse(fs.readFileSync(GRAPH_JSON, 'utf8'));
    let nodeHits = 0;
    for (const n of g.nodes || []) {
      const s = matchStrength(tokens, n.label);
      if (!s) continue;
      nodeHits++;
      // source_file IS the node→vault bridge: collapse onto the vault target.
      // graph.json sometimes carries Windows separators — normalize so the
      // target merges with the fs-scan's forward-slash form.
      const target = n.source_file ? n.source_file.replace(/\\/g, '/') : `node:${canonKey(n.label)}`;
      hits.push({
        target,
        display: n.source_file ? `[[${target}]]` : `graph: ${n.label}`,
        source: 'graph',
        score: 4.0 * s,
        note: `graph node "${n.label}"${Number.isInteger(n.community) ? ` (community ${n.community})` : ''}`,
      });
    }
    if (nodeHits >= 2) {
      hits.push({
        target: 'graphify-report',
        display: 'wiki/graphify-out/GRAPH_REPORT.md',
        source: 'graph',
        score: 1.0,
        note: `${nodeHits} graph nodes matched — report has clusters + suggested questions`,
      });
    }
  } catch {
    /* graph absent — fine */
  }
  return hits;
}

function actionGraphHits(tokens) {
  const hits = [];
  try {
    const ag = require(path.join(CLAUDE_DIR, 'hooks', 'atlas-action-graph.js'));
    const sessionId = resolveSessionId();
    if (!sessionId) return hits;
    const hot = ag.hotSet(sessionId, 2000);
    for (const item of (hot && hot.items) || []) {
      const target = String(item.target || item.key || '');
      const s = matchStrength(tokens, target);
      if (!s) continue;
      hits.push({
        target: vaultRelative(target) || target,
        display: target,
        source: 'session',
        score: 2.0 * s,
        note: `in this session's working set (priority ${(item.priority || 0).toFixed(2)})`,
      });
    }
  } catch {
    /* per-session state absent — fine */
  }
  return hits;
}

function resolveSessionId() {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  // newest state file for this cwd within 48h
  try {
    const dir = path.join(CLAUDE_DIR, 'atlas-action-graph');
    const cwd = process.cwd().toLowerCase();
    let best = null;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.state.json')) continue;
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      if (Date.now() - st.mtimeMs > 48 * 3600 * 1000) continue;
      if (best && st.mtimeMs <= best.mtimeMs) continue;
      try {
        const state = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (String(state.cwd || '').toLowerCase() === cwd) best = { mtimeMs: st.mtimeMs, session: state.session };
      } catch {
        /* skip corrupt state */
      }
    }
    return best ? best.session : null;
  } catch {
    return null;
  }
}

// Map an absolute file path under the wiki into a vault-relative target.
function vaultRelative(p) {
  const norm = String(p).replace(/\\/g, '/');
  const wikiNorm = WIKI.replace(/\\/g, '/');
  if (norm.toLowerCase().startsWith(wikiNorm.toLowerCase() + '/')) return norm.slice(wikiNorm.length + 1);
  return null;
}

// ── Semantic layer (Phase 2 — fail-open) ─────────────────────────────
async function semanticHits(query, mode) {
  if (mode === 'off') return [];
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(EMBED_CACHE, 'utf8'));
  } catch {
    return []; // no index yet — lexical only
  }
  try {
    const { ollamaEmbed, isBreakerOpen } = require(path.join(CLAUDE_DIR, 'hooks', 'lib', 'ollama.js'));
    if (isBreakerOpen(cache.model)) return []; // per-model: fast-model trips don't block embeds
    const vecs = await ollamaEmbed({ input: [query], model: cache.model, timeoutMs: 2500 });
    if (!vecs || !vecs[0]) return [];
    const q = vecs[0];
    const hits = [];
    for (const [key, entry] of Object.entries(cache.entries || {})) {
      const cos = cosine(q, entry.vec);
      if (cos < SEM_FLOOR) continue;
      hits.push({
        target: entry.target || key,
        display: entry.display || key,
        source: 'semantic',
        score: 0, // fused in mergeRank, not a base score
        cos,
        note: `semantic ${cos.toFixed(2)}`,
      });
    }
    return hits;
  } catch {
    return [];
  }
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

// ── Merge + rank ─────────────────────────────────────────────────────
function mergeRank(allHits, semHits, recency) {
  const byTarget = new Map();
  for (const h of allHits) {
    const cur = byTarget.get(h.target);
    if (!cur) byTarget.set(h.target, { ...h, sources: new Set([h.source]), max: h.score });
    else {
      cur.sources.add(h.source);
      if (h.score > cur.max) {
        cur.max = h.score;
        cur.display = h.display;
        cur.note = h.note;
      }
    }
  }
  // semantic fusion
  for (const sh of semHits) {
    const cur = byTarget.get(sh.target);
    if (cur) {
      cur.semCos = Math.max(cur.semCos || 0, sh.cos);
      cur.sources.add('semantic');
    } else if (sh.cos >= SEM_ENTRY) {
      byTarget.set(sh.target, {
        ...sh,
        sources: new Set(['semantic']),
        // Entry score scaled to the same floor→ceil band as the fusion boost.
        max: SEM_ONLY_WEIGHT * Math.min(1, (sh.cos - SEM_FLOOR) / (SEM_CEIL - SEM_FLOOR)),
        semCos: sh.cos,
      });
    }
  }
  const ranked = [];
  for (const t of byTarget.values()) {
    let final = t.max + 1.0 * (t.sources.size - 1);
    if (t.semCos) final += SEM_WEIGHT * Math.min(1, Math.max(0, (t.semCos - SEM_FLOOR) / (SEM_CEIL - SEM_FLOOR)));
    // hot.md recency boost (vault targets only)
    const days = recency.get(t.target);
    if (days !== undefined) final += days <= 7 ? 1.0 : days <= 30 ? 0.5 : 0;
    ranked.push({ ...t, final });
  }
  ranked.sort((a, b) => b.final - a.final);
  return ranked.slice(0, MAX_RESULTS);
}

// ── Output ───────────────────────────────────────────────────────────
function render(query, ranked, totalHits, asJson) {
  if (asJson) {
    return JSON.stringify(
      {
        query,
        total_hits: totalHits,
        results: ranked.map((r) => ({
          target: r.target,
          display: r.display,
          score: Number(r.final.toFixed(2)),
          sources: [...r.sources],
          note: r.note || '',
        })),
      },
      null,
      2
    );
  }
  if (!ranked.length) {
    return (
      `RECALL: "${query}" — no hits across vault, catalog, atlas-kg, graphify, or session layers.\n` +
      `Try broader terms, /deep-recall for the full-vault semantic tier, or wiki-manage QUERY mode for LLM synthesis.`
    );
  }
  const lines = [`RECALL: "${query}" — ${totalHits} raw hit(s), top ${ranked.length} after fusion:`];
  ranked.forEach((r, i) => {
    const src = [...r.sources].join('+');
    lines.push(`${i + 1}. ${r.display}  ${r.final.toFixed(1)}  (${src})${r.note ? ` — ${String(r.note).slice(0, 90)}` : ''}`);
  });
  lines.push(`Read the top page(s) for detail; wiki-manage QUERY mode for synthesis; /deep-recall if these hits look thin.`);
  let out = lines.join('\n');
  if (out.length > OUTPUT_CHAR_CAP) out = out.slice(0, OUTPUT_CHAR_CAP - 3) + '...';
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const semMode = argv.includes('--no-semantic') ? 'off' : argv.includes('--semantic-only') ? 'only' : 'on';
  const query = argv.filter((a) => !a.startsWith('--')).join(' ').trim();
  if (!query) {
    console.log('usage: recall.js [--json] [--no-semantic|--semantic-only] "<query>"');
    process.exit(0);
  }
  const tokens = tokenize(query);

  // Lexical first, synchronously — it is fast (<100ms) and must NEVER be
  // sacrificed to a slow semantic call. Only the semantic embed (the one
  // network call) runs under the wall guard; on timeout we keep lexical.
  const lexical =
    semMode === 'only'
      ? []
      : [...vaultHits(tokens), ...catalogHits(tokens), ...kgHits(tokens), ...graphifyHits(tokens), ...actionGraphHits(tokens)];
  // unref() so the guard timer can't hold the event loop open — without it
  // every invocation paid the full WALL_MS in wall-clock even after resolving.
  let wallTimer;
  const sem = await Promise.race([
    semanticHits(query, semMode === 'off' ? 'off' : 'on'),
    new Promise((res) => {
      wallTimer = setTimeout(() => res([]), WALL_MS);
      if (wallTimer.unref) wallTimer.unref();
    }),
  ]);
  clearTimeout(wallTimer);

  const ranked = mergeRank(lexical, sem, hotRecency());
  console.log(render(query, ranked, lexical.length + sem.length, asJson));
}

main().catch(() => {
  // Absolute fail-open: a recall error must never break the calling command.
  console.log('RECALL: internal error — fall back to /deep-recall or a direct vault grep.');
  process.exit(0);
});
