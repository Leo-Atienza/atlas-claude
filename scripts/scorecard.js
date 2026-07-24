#!/usr/bin/env node
/**
 * scorecard.js — A9 (ATLAS v9 Wave 3). The weekly "did it get smarter?" scorecard.
 * Script-computed (deterministic) — the SOLE evidence source for A5 autonomy
 * promotions. Reads only files that exist; emits `n/a — lands Wave N` for metrics
 * whose producer doesn't exist yet (never a fabricated zero). EVERY rate is paired
 * with its volume (acceptance-up-volume-down is a regression, not success).
 *
 * Sources: logs/delegations.jsonl (B3), cache/recall-canary-metric.jsonl (E2c),
 * cache/behavior-signals.json (A1), personal/preferences/inferred/ (A2),
 * cache/watcher-log.jsonl (F5), personal/suggestions.md (A7).
 *
 * Writes wiki/personal/scorecard/YYYY-WW.md with 4-week trend arrows (vs prior
 * scorecards). Cost: zero Claude tokens (pure compute). Runs in weekly-maintenance.
 *
 * Usage: node scripts/scorecard.js [--print]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runLoop } = require('./lib/loop-guard');

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');
const VAULT = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const SCOREDIR = process.env.SCORECARD_DIR || path.join(VAULT, 'personal', 'scorecard');
const NOW = process.env.BASELINE_DATE ? new Date(process.env.BASELINE_DATE + 'T12:00:00Z') : new Date();

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - yStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}
function readJsonl(p, sinceMs) {
  try { return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).filter((o) => !sinceMs || !o.ts || Date.parse(o.ts) >= sinceMs); } catch { return []; }
}
function pct(n, d) { return d ? Math.round((n / d) * 100) : null; }

function compute() {
  const since7 = NOW.getTime() - 7 * 86400000;
  const m = {};

  // Delegations (B3)
  const dele = readJsonl(path.join(CLAUDE, 'logs', 'delegations.jsonl'), since7);
  const deleAll = readJsonl(path.join(CLAUDE, 'logs', 'delegations.jsonl'));
  const okDele = dele.filter((d) => d.status === 'ok');
  const escalated = dele.filter((d) => d.escalated).length;               // escalation RATE is over all delegations
  const accepted = okDele.filter((d) => !d.escalated).length;             // acceptance = ok AND not escalated (same population — audit fix)
  const schemaCalls = dele.filter((d) => d.schema_ok !== null && d.schema_ok !== undefined);
  const schemaOk = schemaCalls.filter((d) => d.schema_ok === true).length;
  m.delegations = { volume_7d: dele.length, volume_all: deleAll.length, ok: okDele.length, acceptance_pct: pct(accepted, dele.length), escalation_pct: pct(escalated, dele.length), schema_ok_pct: pct(schemaOk, schemaCalls.length), schema_n: schemaCalls.length };

  // Recall (E2c)
  const recall = readJsonl(path.join(CLAUDE, 'cache', 'recall-canary-metric.jsonl'));
  const lastRecall = recall[recall.length - 1];
  m.recall = lastRecall ? { hit_pct: Math.round(lastRecall.rate * 100), volume: lastRecall.total, model: lastRecall.model } : null;

  // Corrections (A1)
  let sig = null; try { sig = JSON.parse(fs.readFileSync(path.join(CLAUDE, 'cache', 'behavior-signals.json'), 'utf8')); } catch {}
  m.corrections = sig ? { total_window: sig.totals.corrections, window_days: sig.window_days, candidates: (sig.candidates || []).length, reprompts: sig.totals.reprompts } : null;

  // Inferred prefs (A2)
  let inf = { total: 0, medium: 0 };
  try { for (const f of fs.readdirSync(path.join(VAULT, 'personal', 'preferences', 'inferred')).filter((x) => x.endsWith('.md'))) { const r = fs.readFileSync(path.join(VAULT, 'personal', 'preferences', 'inferred', f), 'utf8'); inf.total++; if (/^confidence:\s*MEDIUM/m.test(r)) inf.medium++; } } catch {}
  m.inferred_prefs = inf;

  // Watchers (F5)
  const watch = readJsonl(path.join(CLAUDE, 'cache', 'watcher-log.jsonl'), since7);
  m.watchers = { runs_7d: watch.length, skipped: watch.filter((w) => w.status === 'skipped').length, errors: watch.filter((w) => w.status === 'error').length };

  // Suggestions (A7) — acted-on tracking not built yet
  m.suggestion_acceptance = 'n/a — acted-on tracking lands with A4 /review-proposals (Wave 4)';
  m.time_to_green_templates = 'n/a — lands Wave 5/6 (C8/D8 acceptance runs)';

  return m;
}

function trendArrow(cur, prev) {
  if (cur == null || prev == null) return '';
  if (cur > prev) return ' ↑'; if (cur < prev) return ' ↓'; return ' →';
}

function loadPrior() {
  try { return fs.readdirSync(SCOREDIR).filter((f) => f.endsWith('.md')).sort().slice(-4).map((f) => { const r = fs.readFileSync(path.join(SCOREDIR, f), 'utf8'); const j = r.match(/<!--DATA (.+?)-->/); return j ? JSON.parse(j[1]) : null; }).filter(Boolean); } catch { return []; }
}

function render(week, m, prior) {
  const last = prior[prior.length - 1];
  const d = m.delegations, r = m.recall, c = m.corrections;
  const dAcc = d.acceptance_pct, dAccPrev = last?.delegations?.acceptance_pct;
  const rHit = r?.hit_pct, rHitPrev = last?.recall?.hit_pct;
  const cTot = c?.total_window, cTotPrev = last?.corrections?.total_window;
  return `---
title: "Scorecard ${week} — did the sous-chef get smarter?"
type: scorecard
week: ${week}
updated: ${NOW.toISOString().slice(0, 10)}
tags: [scorecard, sous-chef, metrics]
---

# Scorecard ${week}

Script-computed (A9). Every rate is paired with its volume — an acceptance rate that rises while volume falls is a **regression**, not a win. This file is the sole evidence source for autonomy-ladder (A5) promotions. Trends vs the prior ${prior.length} week(s).

## Delegation (local-LLM offload)
- Volume: **${d.volume_7d}** in 7d (${d.volume_all} all-time)
- Acceptance (ok & not escalated): **${dAcc == null ? 'n/a' : dAcc + '%'}**${trendArrow(dAcc, dAccPrev)}  (n=${d.volume_7d})
- Escalation rate: ${d.escalation_pct == null ? 'n/a' : d.escalation_pct + '%'}  ·  Schema-valid: ${d.schema_ok_pct == null ? 'n/a' : d.schema_ok_pct + '%'} (n=${d.schema_n})

## Recall (canary hit@5)
- ${r ? `**${rHit}%**${trendArrow(rHit, rHitPrev)}  (${r.volume} canaries, ${r.model})` : 'n/a — no recall-canary-metric yet'}

## Corrections (from the user, ${c?.window_days || '?'}d window)
- Corrections observed: **${cTot ?? 'n/a'}**${trendArrow(cTot, cTotPrev)}  ·  re-prompts: ${c?.reprompts ?? 'n/a'}  ·  pref-candidates: ${c?.candidates ?? 'n/a'}
- _(fewer corrections over time = the sous-chef is learning; ↓ is good here)_

## Inferred preferences (A2)
- Total: ${m.inferred_prefs.total}  ·  promoted to MEDIUM (injection-eligible): ${m.inferred_prefs.medium}

## Watchers (F5 loop health)
- Runs (7d): ${m.watchers.runs_7d}  ·  skipped: ${m.watchers.skipped}  ·  errors: ${m.watchers.errors}

## Not yet measurable
- Suggestion acceptance: ${m.suggestion_acceptance}
- Time-to-green on templates: ${m.time_to_green_templates}

<!--DATA ${JSON.stringify(m)}-->
`;
}

async function main() {
  const printOnly = process.argv.includes('--print');
  const res = await runLoop({
    name: 'scorecard',
    costClass: 'zero',
    deps: [],
    run: async (ctx) => {
      const m = compute();
      const week = isoWeek(NOW);
      const prior = loadPrior();
      const md = render(week, m, prior);
      if (printOnly) { console.log(md); }
      else { fs.mkdirSync(SCOREDIR, { recursive: true }); fs.writeFileSync(path.join(SCOREDIR, `${week}.md`), md); console.log(`scorecard ${week} written (delegations ${m.delegations.volume_7d}/7d, recall ${m.recall ? m.recall.hit_pct + '%' : 'n/a'}, corrections ${m.corrections?.total_window ?? 'n/a'})`); }
      ctx.report({ outcome: `scorecard ${week}` });
    },
  });
  process.exit(res.status === 'error' ? 1 : 0);
}
if (require.main === module) main();
module.exports = { compute, isoWeek };
