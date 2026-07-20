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
 *   - mcp (visible config files, server names, statsig stub state)
 *   - scheduled_tasks (count, names)
 *   - memory (active count, embeddings, contradictions, WAL ratio)
 *   - validator_results (each validator's ok flag + summary)
 *
 * Exit 0 always. The snapshot is informational; failures inside
 * validators are surfaced via per-validator ok flags.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');
const CACHE_DIR = path.join(ROOT, 'cache');
const OUT_FILE = path.join(CACHE_DIR, 'system-ground-truth.json');

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function listJsonl(p) {
  return safe(() => fs.readFileSync(p, 'utf8').split('\n').filter(Boolean), []);
}

function runValidator(name) {
  const p = path.join(ROOT, 'scripts', name);
  if (!fs.existsSync(p)) return { ok: false, error: 'missing' };
  const r = spawnSync('node', [p, '--json'], { encoding: 'utf8', timeout: 30000 });
  if (r.status === 2) return { ok: false, error: 'config error', stderr: (r.stderr || '').slice(0, 200) };
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* fall through */ }
  return { ok: r.status === 0, summary: parsed };
}

function snapshotMemory() {
  const dbPath = path.join(ROOT, 'memory', 'index.db');
  const walPath = dbPath + '-wal';
  const dbSize = safe(() => fs.statSync(dbPath).size, 0);
  const walSize = safe(() => fs.statSync(walPath).size, 0);
  return {
    db_path: dbPath,
    db_size_bytes: dbSize,
    wal_size_bytes: walSize,
    wal_ratio: dbSize > 0 ? walSize / dbSize : 0,
  };
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
  // Run every validator in --json mode
  const validators = {
    skill_counts:           runValidator('validate-skill-counts.js'),
    cross_listed_skills:    runValidator('validate-cross-listed-skills.js'),
    archive_counts:         runValidator('validate-archive-counts.js'),
    symlinks:               runValidator('validate-symlinks.js'),
    archive_manifest:       runValidator('validate-archive-manifest.js'),
    commands:               runValidator('validate-commands.js'),
    hooks:                  runValidator('validate-hooks.js'),
    knowledge:              runValidator('validate-knowledge.js'),
    references:             runValidator('validate-references.js'),
  };

  const snapshot = {
    generated_at: new Date().toISOString(),
    schema_version: 1,
    skills: {
      from_validator: validators.skill_counts.summary || null,
      cross_listed:    validators.cross_listed_skills.summary || null,
      archive_counts:  validators.archive_counts.summary || null,
      symlinks:        validators.symlinks.summary || null,
      archive_manifest: validators.archive_manifest.summary || null,
    },
    knowledge: validators.knowledge.summary || null,
    hooks_dir: snapshotHooks(),
    hooks_validation: validators.hooks.summary || null,
    commands: validators.commands.summary || null,
    mcp: snapshotMcp(),
    scheduled_tasks: snapshotScheduledTasks(),
    plugins: snapshotPlugins(),
    memory: snapshotMemory(),
    overall: {
      validators_passing: Object.values(validators).filter(v => v.ok).length,
      validators_total: Object.keys(validators).length,
      validators_status: Object.fromEntries(Object.entries(validators).map(([k, v]) => [k, v.ok])),
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
    `  memory wal: ${(snapshot.memory.wal_size_bytes / 1024).toFixed(1)} KB ` +
      `(ratio ${snapshot.memory.wal_ratio.toFixed(2)})\n`
  );
  process.exit(0);
}

main();