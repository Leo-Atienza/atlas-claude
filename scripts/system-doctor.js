#!/usr/bin/env node
/**
 * system-doctor.js
 *
 * Unified validator runner. Executes every `scripts/validate-*.js`
 * and aggregates JSON results into a single markdown scoreboard.
 *
 * Exit code:
 *   0 — all validators returned ok=true
 *   1 — one or more returned ok=false (drift)
 *   2 — internal error launching validators
 *
 * Flags:
 *   --json     emit structured { generated_at, results: [...] } instead of markdown
 *   --strict   exit non-zero on warnings too (default: only on drift)
 *
 * Wired into:
 *   - /system-doctor slash command (commands/system-doctor.md)
 *   - weekly-validator-sweep scheduled task
 *   - SessionStart surfacing via hooks/system-doctor-advisory.js (snapshot-driven; ATLAS_HEALTH_BLOCK retired v8.14)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = require('os').homedir();
const SCRIPTS_DIR = path.join(HOME, '.claude', 'scripts');

// Validator list is shared with system-snapshot.js — single source of truth.
const VALIDATORS = require('./lib/validators');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');

function runValidator(v) {
  const fullPath = path.join(SCRIPTS_DIR, v.file);
  if (!fs.existsSync(fullPath)) {
    return { id: v.id, ok: false, error: 'validator missing', path: fullPath };
  }
  const r = spawnSync('node', [fullPath, ...(v.args || [])], { encoding: 'utf8', timeout: 30000 });
  if (r.error)        return { id: v.id, ok: false, error: r.error.message };
  if (r.status === 2) return { id: v.id, ok: false, error: 'config error', stderr: (r.stderr || '').slice(0, 200) };
  // Validators emit JSON to stdout; parse it for richer reporting
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* fall through */ }
  return {
    id: v.id,
    ok: r.status === 0,
    exitCode: r.status,
    summary: parsed,
    stderr: r.stderr ? r.stderr.slice(0, 200) : undefined,
  };
}

function summaryLine(r) {
  if (!r.summary) return r.ok ? 'clean' : `exit ${r.exitCode}`;
  const s = r.summary;
  if (r.id === 'cross-listed-skills') return `active ∩ archive = ${s.counts?.conflicting ?? '?'}`;
  if (r.id === 'archive-counts')      return `fs=${s.counts?.fs_dirs ?? '?'} doc=${s.counts?.doc_list ?? '?'} orphans=${(s.orphan_dirs || []).length}`;
  if (r.id === 'symlinks')            return s.skipped ? 'skipped (no SYMLINKS.md)' : `broken=${(s.broken || []).length}/${s.counts?.listed ?? '?'}`;
  if (r.id === 'archive-manifest')    return s.skipped ? 'skipped (empty manifest)' : `missing=${(s.missing || []).length}/${s.counts?.manifest ?? '?'}`;
  if (r.id === 'commands')            return `ghosts=${s.counts?.ghosts ?? '?'} undocumented=${s.counts?.undocumented ?? '?'}`;
  if (r.id === 'hooks')               return `orphans=${s.counts?.orphans ?? '?'}/${s.counts?.hooks ?? '?'}`;
  if (r.id === 'knowledge')           return s.skipped ? 'skipped' : `total=${s.counts?.actual_total ?? '?'} drift=${s.drift?.total_drift ? 'yes' : 'no'}`;
  if (r.id === 'skill-counts')        return s.system_version ? `${s.system_version} active (fs ${s.filesystem_unlimited?.total ?? '?'}, unregistered=${s.registry_reconciliation?.unregistered?.length ?? 0})` : 'parsed';
  if (r.id === 'skill-collisions')    return `conformance=${s.counts?.conformance_errors ?? '?'} collisions=${s.counts?.collisions ?? '?'} broad=${s.counts?.broad_scope ?? '?'}`;
  if (r.id === 'references')           return `broken=${s.counts?.broken ?? '?'}/${s.counts?.checked ?? '?'}`;
  if (r.id === 'systems')             return s.skipped ? 'skipped (no systems/)' : `systems=${s.counts?.active ?? '?'}/${s.counts?.systems ?? '?'} dangling=${s.counts?.dangling_refs ?? '?'} drift=${s.counts?.registry_drift ?? '?'}`;
  if (r.id === 'brain-coverage')      return s.skipped ? 'skipped (no vault)' : `unreachable=${s.counts?.unreachable ?? '?'}/${s.counts?.assets ?? '?'} brains=${s.counts?.brains ?? '?'} allowlisted=${s.counts?.allowlisted ?? '?'}`;
  return r.ok ? 'ok' : 'fail';
}

function main() {
  const results = VALIDATORS.map(runValidator);
  const failures = results.filter(r => !r.ok);
  const warnings = results.filter(r => r.ok && r.summary?.warnings);

  const exitOk = failures.length === 0 && (!STRICT || warnings.length === 0);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      generated_at: new Date().toISOString(),
      ok: exitOk,
      strict: STRICT,
      counts: { total: results.length, failures: failures.length, warnings: warnings.length },
      results,
    }, null, 2) + '\n');
    process.exit(exitOk ? 0 : 1);
  }

  // Markdown scoreboard
  const lines = [
    `# /system-doctor — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    '',
    `**Status:** ${exitOk ? '✓ all green' : '✗ drift detected'}  ·  ${failures.length} failures, ${warnings.length} warnings, ${results.length} validators`,
    '',
    '| Validator | Status | Summary |',
    '|---|---|---|',
  ];
  for (const r of results) {
    const status = r.ok ? '✓' : (r.error ? '⚠ error' : '✗');
    lines.push(`| \`${r.id}\` | ${status} | ${r.error ? r.error.slice(0, 80) : summaryLine(r)} |`);
  }
  if (failures.length) {
    lines.push('');
    lines.push('## Failures');
    for (const r of failures) {
      lines.push(`- **${r.id}**: ${r.error || 'drift'} ${r.summary ? '— see JSON for detail' : ''}`);
    }
  }
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(exitOk ? 0 : 1);
}

main();
