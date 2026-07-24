#!/usr/bin/env node
/**
 * recall-canary-check.js — E2(c) (ATLAS v9 Wave 2). Runs the recall canary suite
 * against the LIVE semantic index and records a hit@k metric. This is the weekly
 * recall health-check; its metric feeds the A9 scorecard.
 *
 * Unlike recall-embed-eval.js (which builds a candidate index to compare models),
 * this only READS the live cache/recall-embeddings.json — cheap, safe, weekly.
 *
 * Wired into weekly-maintenance via the F5 loop-guard (cost: local — 0 Claude
 * tokens; skips when Ollama is down). Appends one line to
 * cache/recall-canary-metric.jsonl.
 *
 * Usage: node scripts/recall-canary-check.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ollamaEmbed } = require('../hooks/lib/ollama');
const { runLoop, probeOllama } = require('./lib/loop-guard');

const HOME = os.homedir();
const CACHE = path.join(HOME, '.claude', 'cache', 'recall-embeddings.json');
const CANARY = path.join(HOME, '.claude', 'local-llm', 'evals', 'recall-canary.json');
const METRIC = path.join(HOME, '.claude', 'cache', 'recall-canary-metric.jsonl');

function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function runCanaries() {
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const canary = JSON.parse(fs.readFileSync(CANARY, 'utf8'));
  const K = canary.k || 5;
  const entries = Object.entries(cache.entries || {})
    .filter(([k]) => !k.startsWith('node:'))
    .map(([k, v]) => ({ key: k, vec: v.vec }));

  const perNs = {};
  let hit = 0;
  const misses = [];
  for (const c of canary.cases) {
    perNs[c.ns] = perNs[c.ns] || { hit: 0, n: 0 };
    perNs[c.ns].n++;
    const emb = await ollamaEmbed({ input: [c.query], model: cache.model, timeoutMs: 30000 });
    if (!emb) throw new Error('query embed failed (Ollama?)');
    const top = entries.map((e) => ({ key: e.key, cos: cosine(emb[0], e.vec) })).sort((a, b) => b.cos - a.cos).slice(0, K);
    const ok = top.some((h) => h.key.includes(c.expect));
    if (ok) { hit++; perNs[c.ns].hit++; } else misses.push(c.query.slice(0, 50));
  }
  return { model: cache.model, total: canary.cases.length, hit, rate: hit / canary.cases.length, perNs, misses, K };
}

async function main() {
  const res = await runLoop({
    name: 'recall-canary-check',
    costClass: 'local',
    deps: [probeOllama()],
    run: async (ctx) => {
      const r = await runCanaries();
      const line = { ts: new Date().toISOString(), model: r.model, hit: r.hit, total: r.total, rate: Number(r.rate.toFixed(3)), per_ns: r.perNs, misses: r.misses };
      fs.mkdirSync(path.dirname(METRIC), { recursive: true });
      fs.appendFileSync(METRIC, JSON.stringify(line) + '\n');
      ctx.report({ checked: r.total, found: r.hit, outcome: `recall hit@${r.K} ${r.hit}/${r.total} (${(r.rate * 100).toFixed(0)}%)` });
      // human-readable to stdout
      console.log(`# recall canary — ${r.model}`);
      console.log(`hit@${r.K}: ${r.hit}/${r.total} (${(r.rate * 100).toFixed(0)}%)`);
      for (const [ns, s] of Object.entries(r.perNs)) console.log(`  ${ns.padEnd(12)} ${s.hit}/${s.n}`);
      if (r.misses.length) console.log(`misses: ${r.misses.join(' | ')}`);
    },
  });
  if (res.status === 'skipped') console.log(`recall-canary-check skipped: ${res.reason}`);
  process.exit(res.status === 'error' ? 1 : 0);
}

if (require.main === module) main();
module.exports = { runCanaries };
