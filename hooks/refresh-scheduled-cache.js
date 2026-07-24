#!/usr/bin/env node
/**
 * ATLAS v8.2.0 — Scheduled-tasks cache refresher (self-healing).
 *
 * Runs as a §8·pre step in hooks/session-start.sh, BEFORE drift-proposer.js.
 *
 * THIS EXISTS BECAUSE: `cache/scheduled-tasks-latest.json` is read by
 * drift-proposer.js (scheduled_task_drift channel) and observability.js
 * (dashboard section 4), but its auto-writer was retired in v8.0.0. Left
 * unrefreshed the cache goes stale, and stale `lastRunAt` values make
 * on-time tasks look hundreds of hours late → chronic false-alarm advisories.
 *
 * The live scheduler state lives on disk (the `mcp__scheduled-tasks__*` MCP
 * tools are in-session only and unavailable to hooks):
 *   ~/AppData/Roaming/Claude/claude-code-sessions/{account}/{workspace}/scheduled-tasks.json
 * This reads it headlessly and rewrites the cache in the shape the consumers
 * expect: { refreshed_at, tasks: [{ taskId, cronExpression, enabled, lastRunAt, fireAt }] }.
 *
 * Path discovery is dynamic (no hardcoded account/workspace IDs): it scans the
 * sessions base and prefers the state file whose tasks target ~/.claude, else
 * the most-recently-modified one.
 *
 * Fail-open: any error (base dir absent, file moved, unparseable JSON) leaves
 * the existing cache untouched and exits 0. Never throws, never blocks startup.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const ROOT = path.join(HOME, '.claude');
const CACHE_DIR = path.join(ROOT, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'scheduled-tasks-latest.json');
const SESSIONS_BASE = path.join(HOME, 'AppData', 'Roaming', 'Claude', 'claude-code-sessions');

function norm(p) {
  if (!p || typeof p !== 'string') return '';
  try { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }
  catch { return p.replace(/\\/g, '/').toLowerCase(); }
}
const ROOT_NORM = norm(ROOT);

// Find every scheduled-tasks.json two levels under the sessions base.
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

// Parse candidates and pick the best: prefer one whose tasks target ~/.claude,
// then the most recently modified.
function pickBest(files) {
  const parsed = [];
  for (const f of files) {
    try {
      const json = JSON.parse(fs.readFileSync(f, 'utf8'));
      const tasks = Array.isArray(json.scheduledTasks) ? json.scheduledTasks : [];
      const mtime = fs.statSync(f).mtimeMs;
      const matchesRoot = tasks.some(t => norm(t.cwd) === ROOT_NORM);
      parsed.push({ f, tasks, mtime, matchesRoot });
    } catch { /* skip unparseable */ }
  }
  if (!parsed.length) return null;
  parsed.sort((a, b) =>
    (Number(b.matchesRoot) - Number(a.matchesRoot)) || (b.mtime - a.mtime));
  return parsed[0];
}

// Map an on-disk task entry to the cache shape the consumers read.
function mapTask(t) {
  return {
    taskId: t.id,
    cronExpression: t.cronExpression || null,
    fireAt: typeof t.fireAt === 'number'
      ? new Date(t.fireAt).toISOString()
      : (t.fireAt || null),
    enabled: t.enabled !== false,
    lastRunAt: t.lastRunAt || null,
  };
}

function main() {
  const best = pickBest(findStateFiles());
  if (!best) return; // nothing to refresh from → leave existing cache intact

  const out = {
    refreshed_at: new Date().toISOString(),
    source: 'refresh-scheduled-cache.js (on-disk scheduler state)',
    state_file: best.f,
    tasks: best.tasks.map(mapTask),
  };
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(out, null, 2) + '\n');
}

try { main(); } catch { /* fail-open: never block session start */ }
process.exit(0);
