#!/usr/bin/env node
/**
 * ATLAS — Prune dead scheduled tasks from the live scheduler state.
 *
 * A "dead" task is one that is BOTH:
 *   - enabled === false  (paused / never fires), AND
 *   - has no backing definition on disk (its `filePath` SKILL.md is gone)
 *
 * That pair is the precise signature of an orphaned registry entry: a task
 * whose skill dir was removed but whose scheduler-state record persisted. The
 * `mcp__scheduled-tasks__*` tools expose create/update/list but NO delete, so
 * these entries are otherwise unreachable. The criterion can never match a live
 * task (enabled tasks are always kept; disabled-but-defined tasks are kept).
 *
 * Source of truth (same discovery as hooks/refresh-scheduled-cache.js):
 *   ~/AppData/Roaming/Claude/claude-code-sessions/{account}/{workspace}/scheduled-tasks.json
 *   shape: { scheduledTasks: [ { id, enabled, filePath, cwd, ... } ], recordedSkips: {} }
 *
 * Usage:
 *   node scripts/prune-dead-scheduled-tasks.js            # dry-run (default) — prints what it WOULD remove
 *   node scripts/prune-dead-scheduled-tasks.js --apply    # backs up, then rewrites the state file
 *
 * Safety: backs the original up to cache/ before writing; writes valid JSON only;
 * fail-closed on any parse/IO error (never writes a partial/garbage file).
 *
 * NOTE: the Claude app owns this file at runtime. If the app is open it may hold
 * the registry in memory and overwrite this prune on its next state write. For a
 * durable prune, run with --apply while the Claude app is CLOSED.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const ROOT = path.join(HOME, '.claude');
const CACHE_DIR = path.join(ROOT, 'cache');
const SESSIONS_BASE = path.join(HOME, 'AppData', 'Roaming', 'Claude', 'claude-code-sessions');
const APPLY = process.argv.includes('--apply');

function norm(p) {
  if (!p || typeof p !== 'string') return '';
  try { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }
  catch { return p.replace(/\\/g, '/').toLowerCase(); }
}
const ROOT_NORM = norm(ROOT);

function findStateFiles() {
  const out = [];
  let accounts;
  try { accounts = fs.readdirSync(SESSIONS_BASE, { withFileTypes: true }); }
  catch { return out; }
  for (const a of accounts) {
    if (!a.isDirectory()) continue;
    const accDir = path.join(SESSIONS_BASE, a.name);
    let workspaces;
    try { workspaces = fs.readdirSync(accDir, { withFileTypes: true }); }
    catch { continue; }
    for (const w of workspaces) {
      if (!w.isDirectory()) continue;
      const f = path.join(accDir, w.name, 'scheduled-tasks.json');
      if (fs.existsSync(f)) out.push(f);
    }
  }
  return out;
}

function pickBest(files) {
  const parsed = [];
  for (const f of files) {
    try {
      const json = JSON.parse(fs.readFileSync(f, 'utf8'));
      const tasks = Array.isArray(json.scheduledTasks) ? json.scheduledTasks : [];
      const mtime = fs.statSync(f).mtimeMs;
      const matchesRoot = tasks.some(t => norm(t.cwd) === ROOT_NORM);
      parsed.push({ f, json, tasks, mtime, matchesRoot });
    } catch { /* skip unparseable */ }
  }
  if (!parsed.length) return null;
  parsed.sort((a, b) =>
    (Number(b.matchesRoot) - Number(a.matchesRoot)) || (b.mtime - a.mtime));
  return parsed[0];
}

function isDead(t) {
  if (!t || t.enabled !== false) return false;          // keep every enabled task
  const fp = t.filePath;
  if (!fp || typeof fp !== 'string') return true;        // disabled + no path = dead
  return !fs.existsSync(fp);                              // disabled + missing SKILL.md = dead
}

function main() {
  const best = pickBest(findStateFiles());
  if (!best) { console.log('No scheduler state file found — nothing to do.'); return; }

  const { json, tasks, f } = best;
  const dead = tasks.filter(isDead);
  const keep = tasks.filter(t => !isDead(t));

  console.log(`State file: ${f}`);
  console.log(`Total tasks: ${tasks.length}  |  keep: ${keep.length}  |  dead: ${dead.length}`);
  if (!dead.length) { console.log('Already clean — no dead tasks.'); return; }

  console.log('\nWould remove (disabled + no backing SKILL.md):');
  for (const t of dead) {
    const why = !t.filePath ? 'no filePath' : 'SKILL.md missing';
    console.log(`  - ${t.id.padEnd(34)} [${t.cronExpression || (t.fireAt ? 'one-time' : 'ad-hoc')}] (${why})`);
  }

  if (!APPLY) {
    console.log('\nDRY-RUN. Re-run with --apply to back up + rewrite the state file.');
    return;
  }

  // Build pruned object, preserving all other keys and ordering.
  const removedIds = new Set(dead.map(t => t.id));
  const next = { ...json, scheduledTasks: keep };
  if (next.recordedSkips && typeof next.recordedSkips === 'object') {
    for (const id of Object.keys(next.recordedSkips)) {
      if (removedIds.has(id)) delete next.recordedSkips[id];
    }
  }

  // Back up the original before touching it.
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(CACHE_DIR, `scheduled-tasks-state-backup-${stamp}.json`);
  fs.copyFileSync(f, backup);

  fs.writeFileSync(f, JSON.stringify(next, null, 2) + '\n');
  console.log(`\nApplied. Removed ${dead.length} dead task(s).`);
  console.log(`Backup: ${backup}`);
}

try { main(); }
catch (e) { console.error('FAILED (no changes written):', e.message); process.exit(1); }
