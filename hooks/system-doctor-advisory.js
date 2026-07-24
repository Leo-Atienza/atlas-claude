#!/usr/bin/env node
/**
 * hooks/system-doctor-advisory.js
 *
 * SessionStart hook. Reads the most recent system-doctor result from
 * cache/system-ground-truth.json and surfaces a one-line DRIFT
 * advisory if any validator is currently red, OR if the snapshot is
 * stale (mtime > 7 days old).
 *
 * This replaces the narrower hooks/detect-orphan-hooks.js with a
 * surface that catches drift across ALL 9 validators (skill-counts,
 * cross-listed-skills, archive-counts, symlinks, archive-manifest,
 * commands, hooks, knowledge, skill-collisions) — not just orphan hooks.
 *
 * Why read the snapshot instead of re-running the validators here?
 *   - Cheap: one file read (~5ms) vs spawning 8 child processes (~2s)
 *   - Deterministic: snapshot is the canonical ground truth (per
 *     CLAUDE.md "Auditing the ATLAS system itself" protocol)
 *   - The weekly-validator-sweep cron is INTENDED to keep the snapshot fresh,
 *     but as of 2026-05-16 it is defined on disk only (SKILL.md present) and
 *     not registered in the scheduled-tasks plugin. Until the user registers
 *     it interactively, the snapshot only refreshes on demand via
 *     `node scripts/system-snapshot.js`.
 *
 * If the snapshot is stale (>7d) the user gets a hint to refresh.
 * Fail-open: any error → silent exit 0.
 *
 * Output via stdout JSON: { additionalContext: "..." } consumed by
 * Claude Code's SessionStart additionalContext mechanism.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const SNAPSHOT = path.join(HOME, '.claude', 'cache', 'system-ground-truth.json');
const STALE_MS = 7 * 24 * 3600 * 1000;

function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    // No snapshot ever generated — softly nudge but don't spam
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: 'NOTE: system-snapshot.json not found. Run `node scripts/system-snapshot.js` once to enable SessionStart drift detection.',
      },
    }) + '\n');
    process.exit(0);
  }

  let stat, snap;
  try {
    stat = fs.statSync(SNAPSHOT);
    snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  } catch (_) { process.exit(0); }   // unreadable / corrupt — fail-open silent

  // Stale check
  const age = Date.now() - stat.mtimeMs;
  if (age > STALE_MS) {
    const days = Math.round(age / (24 * 3600 * 1000));
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `NOTE: system-doctor snapshot is ${days}d old — run \`/system-doctor\` (or \`node scripts/system-snapshot.js\`) for a current view.`,
      },
    }) + '\n');
    process.exit(0);
  }

  // Surface failures from the most recent run
  const status = snap?.overall?.validators_status || {};
  const failed = Object.entries(status).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length === 0) process.exit(0);   // all green — silent

  const list = failed.slice(0, 4).join(', ');
  const more = failed.length > 4 ? ` (+${failed.length - 4} more)` : '';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `DRIFT: /system-doctor reports ${failed.length} red validator(s) — ${list}${more}. Run \`/system-doctor\` for the full report.`,
    },
  }) + '\n');
  process.exit(0);
}

main();
