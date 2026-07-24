#!/usr/bin/env node
/**
 * recall-embed-eval.js — E1 (ATLAS v9 Wave 2). Compare a CANDIDATE embedding
 * model against the live incumbent on the recall canary suite, WITHOUT touching
 * the live index (cache/recall-embeddings.json is read-only here).
 *
 * Incumbent = the live cache as-is (embeddinggemma:300m @512-char cap).
 * Candidate = built fresh in-memory (default qwen3-embedding:0.6b @2000-char cap).
 *
 * For each canary query it embeds the query with each model, cosine-ranks over
 * that model's PAGE entries, and checks whether the expected page path appears in
 * the top-k. Reports hit@k per namespace + overall, and per-query win/loss.
 *
 * Usage: node scripts/recall-embed-eval.js [candidateModel] [cap]
 *        (defaults: qwen3-embedding:0.6b 2000)
 *
 * Decide with the plan's gate: adopt only if candidate >= incumbent on EVERY
 * namespace. Prints a clear ADOPT / KEEP verdict.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ollamaEmbed } = require('../hooks/lib/ollama');

const HOME = os.homedir();
const WIKI = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const CACHE = path.join(HOME, '.claude', 'cache', 'recall-embeddings.json');
const CANARY = path.join(HOME, '.claude', 'local-llm', 'evals', 'recall-canary.json');
const NAMESPACES = ['personal', 'engineering', 'concept', 'entity', 'source', 'synthesis', 'web-dev', 'app-dev'];

const CAND_MODEL = process.argv[2] || 'qwen3-embedding:0.6b';
const CAND_CAP = Number(process.argv[3] || 2000);

function pageText(full, cap) {
  let raw;
  try { raw = fs.readFileSync(full, 'utf8'); } catch { return ''; }
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  let title = '', summary = '', keywords = '';
  if (fm) {
    const t = fm[1].match(/^title:\s*"?(.+?)"?\s*$/m); if (t) title = t[1];
    const s = fm[1].match(/^summary:\s*"?([\s\S]*?)"?\s*$/m); if (s) summary = s[1].split('\n')[0];
    const k = fm[1].match(/^keywords:\s*\[?([\s\S]*?)\]?\s*$/m); if (k) keywords = k[1].replace(/[\[\]"']/g, ' ');
  }
  const h2s = (raw.match(/^##\s+(.+)$/gm) || []).map((h) => h.replace(/^##\s+/, '')).join(' ');
  return [title, summary, keywords, h2s].join(' ').replace(/\s+/g, ' ').trim().slice(0, cap);
}

function collectPages() {
  const items = [];
  const walk = (dir, rel, depth) => {
    if (depth > 3) return;
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === '_index.md') continue;
      const full = path.join(dir, e.name), r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(full, r, depth + 1);
      else if (e.name.endsWith('.md')) { const text = pageText(full, CAND_CAP); if (text) items.push({ key: r, text }); }
    }
  };
  for (const ns of NAMESPACES) walk(path.join(WIKI, ns), ns, 0);
  return items;
}

function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function topK(qvec, entries, k) {
  return entries.map((e) => ({ key: e.key, cos: cosine(qvec, e.vec) }))
    .sort((a, b) => b.cos - a.cos).slice(0, k);
}

async function embedAll(model, items, batch = 16) {
  const out = [];
  for (let i = 0; i < items.length; i += batch) {
    const b = items.slice(i, i + batch);
    const vecs = await ollamaEmbed({ input: b.map((x) => x.text), model, timeoutMs: 60000 });
    if (!vecs) throw new Error(`embed failed for ${model} at batch ${i}`);
    b.forEach((x, j) => out.push({ key: x.key, vec: vecs[j] }));
    process.stderr.write(`\r  ${model}: embedded ${Math.min(i + batch, items.length)}/${items.length}   `);
  }
  process.stderr.write('\n');
  return out;
}

(async () => {
  const canary = JSON.parse(fs.readFileSync(CANARY, 'utf8'));
  const K = canary.k || 5;

  // Incumbent: live cache, page entries only
  const live = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const incModel = live.model;
  const incEntries = Object.entries(live.entries || {})
    .filter(([k]) => !k.startsWith('node:'))
    .map(([k, v]) => ({ key: k, vec: v.vec }));
  console.log(`incumbent: ${incModel}  (${incEntries.length} page entries, live cache)`);

  // Candidate: build fresh
  const items = collectPages();
  console.log(`candidate: ${CAND_MODEL} @${CAND_CAP}c  (${items.length} pages)`);
  const candEntries = await embedAll(CAND_MODEL, items);

  const score = { inc: {}, cand: {} };
  const bump = (o, ns) => { o[ns] = o[ns] || { hit: 0, n: 0 }; };
  const rows = [];
  for (const c of canary.cases) {
    bump(score.inc, c.ns); bump(score.cand, c.ns);
    score.inc[c.ns].n++; score.cand[c.ns].n++;
    const [iq] = await ollamaEmbed({ input: [c.query], model: incModel, timeoutMs: 30000 });
    const [cq] = await ollamaEmbed({ input: [c.query], model: CAND_MODEL, timeoutMs: 30000 });
    const iHit = topK(iq, incEntries, K).some((h) => h.key.includes(c.expect));
    const cHit = topK(cq, candEntries, K).some((h) => h.key.includes(c.expect));
    if (iHit) score.inc[c.ns].hit++;
    if (cHit) score.cand[c.ns].hit++;
    rows.push({ q: c.query.slice(0, 42), ns: c.ns, inc: iHit ? '✓' : '·', cand: cHit ? '✓' : '·' });
  }

  console.log(`\nper-query (inc=${incModel} | cand=${CAND_MODEL}):`);
  for (const r of rows) console.log(`  ${r.inc} ${r.cand}  [${r.ns}] ${r.q}`);

  const sum = (o) => Object.values(o).reduce((a, b) => ({ hit: a.hit + b.hit, n: a.n + b.n }), { hit: 0, n: 0 });
  const iT = sum(score.inc), cT = sum(score.cand);
  console.log(`\nper-namespace hit@${K}:`);
  let candNeverWorse = true;
  for (const ns of Object.keys(score.inc)) {
    const i = score.inc[ns], c = score.cand[ns];
    if (c.hit < i.hit) candNeverWorse = false;
    console.log(`  ${ns.padEnd(12)} inc ${i.hit}/${i.n}   cand ${c.hit}/${c.n}   ${c.hit < i.hit ? '⚠ worse' : c.hit > i.hit ? '↑ better' : '='}`);
  }
  console.log(`\nOVERALL  inc ${iT.hit}/${iT.n} (${(iT.hit / iT.n * 100).toFixed(0)}%)   cand ${cT.hit}/${cT.n} (${(cT.hit / cT.n * 100).toFixed(0)}%)`);
  const verdict = candNeverWorse && cT.hit >= iT.hit;
  console.log(`\nVERDICT: ${verdict ? `ADOPT ${CAND_MODEL} — >= incumbent on every namespace` : `KEEP ${incModel} — candidate regressed at least one namespace`}`);

  const out = path.join(HOME, '.claude', 'local-llm', 'evals', 'recall-eval-results.json');
  fs.writeFileSync(out, JSON.stringify({ date: process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10), incumbent: incModel, candidate: CAND_MODEL, cap: CAND_CAP, overall: { inc: iT, cand: cT }, per_ns: score, verdict: verdict ? 'ADOPT' : 'KEEP' }, null, 2));
  console.log(`(results → local-llm/evals/recall-eval-results.json)`);
  process.exit(verdict ? 0 : 2);
})().catch((e) => { console.error('E1 EVAL ERROR:', e.message); process.exit(1); });
