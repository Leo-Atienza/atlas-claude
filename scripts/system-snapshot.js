#!/usr/bin/env node
/**
 * system-snapshot.js
 *
 * Produces a single canonical "ground truth" snapshot of the ATLAS
 * system state, written to `cache/system-ground-truth.json`.
 *
 * THIS EXISTS BECAUSE: discovery agents auditing the system tend to
 * re-derive every count by hand with grep, then make small mistakes
 * (wrong regex, truncated reads, sampling bias). A canonical snapshot
 * gives them a deterministic source they can read in one tool call
 * instead of running dozens of error-prone searches.
 *
 * Audit-mode protocol (CLAUDE.md):
 *   1. Run `node scripts/system-snapshot.js` (or rely on the Stop hook
 *      to keep it fresh)
 *   2. Read `cache/system-ground-truth.json`
 *   3. Use those numbers as authoritative — only re-derive if you
 *      suspect the snapshot is stale (mtime > 24h) or contradicts
 *      what you observe.
 *
 * Snapshot contents:
 *   - skills (active, archive, depth-unlimited filesystem, cross-listed)
 *   - knowledge (total, per-type, drift)
 *   - hooks (total, wired, indirect, orphans)
 *   - commands (total, ghosts, undocumented, plugin-namespaced)
 *   - skill_collisions (frontmatter conformance + routing collisions)
 *   - mcp (visible config files, server names)
 *   - scheduled_tasks (count, names)
 *   - plugins (enabled count + names)
 *   - overall (each validator's ok flag + pass/total)
 *
 * The validator list is shared with system-doctor.js via
 * `scripts/lib/validators.js` — the single source of truth. Add new
 * validators THERE only; this script iterates whatever it exports, so the
 * two can never drift apart.
 *
 * Exit 0 always. The snapshot is informational; failures inside
 * validators are surfaced via per-validator ok flags.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const VALIDATORS = require('./lib/validators');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');
const CACHE_DIR = path.join(ROOT, 'cache');
const OUT_FILE = path.join(CACHE_DIR, 'system-ground-truth.json');

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function runValidator(v) {
  const p = path.join(ROOT, 'scripts', v.file);
  if (!fs.existsSync(p)) return { id: v.id, ok: false, error: 'missing' };
  const r = spawnSync('node', [p, ...(v.args || [])], { encoding: 'utf8', timeout: 30000 });
  if (r.status === 2) return { id: v.id, ok: false, error: 'config error', stderr: (r.stderr || '').slice(0, 200) };
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* fall through */ }
  return { id: v.id, ok: r.status === 0, summary: parsed };
}

function snapshotHooks() {
  const hooksDir = path.join(ROOT, 'hooks');
  const all = safe(
    () => fs.readdirSync(hooksDir).filter(f => f.endsWith('.js') && !f.startsWith('lib')),
    []
  );
  return { total: all.length, names: all.sort() };
}

function snapshotMcp() {
  const rootMcp = safe(() => JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8')), {});
  const servers = Object.keys(rootMcp.mcpServers || {});
  return { root_mcp_servers: servers };
}

function snapshotScheduledTasks() {
  const dir = path.join(ROOT, 'scheduled-tasks');
  const tasks = safe(
    () => fs.readdirSync(dir).filter(n => fs.statSync(path.join(dir, n)).isDirectory()),
    []
  );
  return { count: tasks.length, names: tasks.sort() };
}

function snapshotPlugins() {
  const settings = safe(() => JSON.parse(fs.readFileSync(path.join(ROOT, 'settings.json'), 'utf8')), {});
  const enabled = Object.keys(settings.enabledPlugins || {}).filter(k => settings.enabledPlugins[k]);
  return { enabled_count: enabled.length, enabled };
}

function main() {
  // Run every validator from the shared manifest (single source of truth).
  const results = VALIDATORS.map(runValidator);
  const byId = Object.fromEntries(results.map(r => [r.id, r]));
  const sum = id => byId[id]?.summary || null;

  const snapshot = {
    generated_at: new Date().toISOString(),
    schema_version: 2,
    skills: {
      from_validator:   sum('skill-counts'),
      cross_listed:     sum('cross-listed-skills'),
      archive_counts:   sum('archive-counts'),
      symlinks:         sum('symlinks'),
      archive_manifest: sum('archive-manifest'),
    },
    knowledge: sum('knowledge'),
    hooks_dir: snapshotHooks(),
    hooks_validation: sum('hooks'),
    commands: sum('commands'),
    skill_collisions: sum('skill-collisions'),
    systems: sum('systems'),
    mcp: snapshotMcp(),
    scheduled_tasks: snapshotScheduledTasks(),
    plugins: snapshotPlugins(),
    overall: {
      validators_passing: results.filter(r => r.ok).length,
      validators_total: results.length,
      validators_status: Object.fromEntries(results.map(r => [r.id, r.ok])),
    },
  };

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n');

  // Tiny human-readable summary on stdout
  const v = snapshot.overall;
  process.stdout.write(
    `system-snapshot written to ${OUT_FILE}\n` +
    `  validators: ${v.validators_passing}/${v.validators_total} passing\n` +
    `  knowledge:  ${snapshot.knowledge?.counts?.actual_total ?? '?'} entries\n` +
    `  hooks:      ${snapshot.hooks_dir.total} files\n` +
    `  commands:   ${snapshot.commands?.counts?.fs_commands ?? '?'} files\n` +
    `  scheduled:  ${snapshot.scheduled_tasks.count} tasks\n` +
    `  plugins:    ${snapshot.plugins.enabled_count} enabled\n` +
    `  systems:    ${snapshot.systems?.skipped ? 'none (skipped)' : `${snapshot.systems?.counts?.active ?? '?'} active`}\n`
  );
  process.exit(0);
}

main();
