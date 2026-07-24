#!/usr/bin/env node
/**
 * task-preflight.js — pre-flight guard block for scheduled tasks (v10.3.0).
 *
 * The "self-healing fleet" delta from the 2026-07-24 Insights report: every
 * scheduled task starts by pulling its known failure modes INTO context at run
 * time (same delivery pattern as preview-health-gate — right info, right
 * moment) instead of relying on the task prompt remembering history.
 *
 * Sources (all existing telemetry — this script adds no new state):
 *   - cache/ollama-breaker.json     → open circuit breakers per local model
 *   - logs/error-patterns.json      → recurring tool-error fingerprints (7d TTL)
 *   - logs/cleanup.jsonl            → cleanup-rule errors in the last 7 days
 *   - TASK_GUARDS below             → curated per-task standing guards
 *
 * Usage: node task-preflight.js <task-name>
 * Always exits 0 (advisory — a broken pre-flight must never block the task).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const task = (process.argv[2] || '').trim();

const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return fb; } };

// Curated standing guards — the "permanently patched after first occurrence"
// ledger, distilled from engineering/errors.md + task history. Keep entries
// short; they are injected into the task's context verbatim.
const TASK_GUARDS = {
  'weekly-graph-sync': [
    'cwd MUST be the vault root (<your-vault-path>/wiki) for every graphify command — outputs are cwd-relative.',
    'Semantic/embed layers need Ollama; breaker OPEN → skip-and-flag that layer, never retry-loop.',
  ],
  'atlas-kg-sync': [
    'Extraction uses the local fast model; breaker OPEN → skip-and-flag, never retry-loop.',
  ],
  'weekly-maintenance': [
    'Local-LLM steps (9b/9c) self-skip when Ollama is down — include the skip line and move on.',
    'Counts come from /health sync-counts (canonical snapshot), never hand-rolled ls|wc -l.',
  ],
  'weekly-wiki-lint': [
    'Lint never auto-fixes. Known false-positive classes: CRLF line endings, auto-generated pages, wikilink name-collisions — check engineering/errors.md before flagging.',
  ],
  'weekly-mcp-health': [
    'consecutive_streak >= 3 with 0 failures in 7d = FROZEN streak (tool idle since last failure), not live breakage — verify against raw tool-failures.jsonl.',
  ],
  'weekly-validator-sweep': [],
  'daily-morning-brief': [
    'Read-only brief: report gaps, never rebuild or mutate state to fill them.',
  ],
  'monthly-evolution-report': [
    'Proposals are present-only — never applied without the user (/review-proposals is the gate).',
  ],
};

const lines = [`TASK PRE-FLIGHT — ${task || '(no task name given)'}:`];

// 1. Circuit breakers
const breaker = readJson(path.join(ROOT, 'cache', 'ollama-breaker.json'), null);
if (breaker && breaker.models) {
  const now = Date.now();
  const rows = Object.entries(breaker.models).map(([m, v]) => {
    const open = Number(v.opened_at) > 0;
    const recent = (v.failures || []).filter((t) => now - t < 24 * 3600e3).length;
    return `${m}: ${open ? 'OPEN' : 'closed'}${recent ? ` (${recent} failure(s) in 24h)` : ''}`;
  });
  const anyOpen = rows.some((r) => r.includes('OPEN'));
  lines.push(`  breakers: ${rows.join(' · ')}${anyOpen ? '  ← OPEN = skip that dependency and flag it; never retry-loop' : ''}`);
} else {
  lines.push('  breakers: no breaker state (ollama-breaker.json absent) — treat local-LLM steps as best-effort');
}

// 2. Recurring error patterns (last 7d, count >= 3)
const patterns = readJson(path.join(ROOT, 'logs', 'error-patterns.json'), {});
const hot = Object.values(patterns)
  .filter((e) => (e.count || 0) >= 3)
  .sort((a, b) => (b.count || 0) - (a.count || 0))
  .slice(0, 4);
if (hot.length) {
  lines.push('  recurring errors (7d): ' + hot.map((e) => `${e.tool} ×${e.count} — ${(e.sample || '').slice(0, 60)}`).join(' | '));
}

// 3. Cleanup-rule errors in the last 7 days
try {
  const cutoff = Date.now() - 7 * 24 * 3600e3;
  const errs = {};
  fs.readFileSync(path.join(ROOT, 'logs', 'cleanup.jsonl'), 'utf8').trim().split('\n').forEach((l) => {
    try {
      const r = JSON.parse(l);
      if (r.error && new Date(r.ts).getTime() > cutoff) errs[r.rule || r.id || '?'] = (errs[r.rule || r.id || '?'] || 0) + 1;
    } catch (_) { /* skip bad line */ }
  });
  const bad = Object.entries(errs);
  if (bad.length) lines.push('  cleanup-rule errors (7d): ' + bad.map(([r, n]) => `${r} ×${n}`).join(', '));
} catch (_) { /* no log — fine */ }

// 4. Standing guards for this task
const guards = TASK_GUARDS[task];
if (guards === undefined && task) {
  lines.push(`  guards: (unknown task name "${task}" — no curated guards; check TASK_GUARDS in scripts/task-preflight.js)`);
} else if (guards && guards.length) {
  lines.push('  guards:');
  for (const g of guards) lines.push(`    - ${g}`);
}

if (lines.length === 1) lines.push('  all clear — no open breakers, no recurring errors, no standing guards.');
process.stdout.write(lines.join('\n') + '\n');
process.exit(0);
