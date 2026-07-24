// lib/session.js — shared session-state readers for the session-end writers.
//
// Lifted verbatim from wiki-session-log.js (which had the best implementations)
// so the four continuity writers stop carrying private copies. The writers stay
// SEPARATE processes (different events, timeout budgets, fail-open domains) —
// only the duplicated plumbing is unified here.
//
// Callers: hooks/wiki-session-log.js, hooks/session-handoff.js, scripts/recall.js

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { cwdSlug } = require('./slug');

const HOME = os.homedir();
const HANDOFFS_DIR = path.join(HOME, '.claude', 'handoffs');
const TODOS_DIR = path.join(HOME, '.claude', 'todos');
const ACTION_GRAPH = path.join(HOME, '.claude', 'hooks', 'atlas-action-graph.js');

/**
 * Parse the per-CWD overwriting handoff written by session-stop.sh §1.
 * Returns { branch, changes, commits[] } or null when absent/unreadable.
 */
function readHandoff(cwd) {
  const slug = cwdSlug(cwd);
  const file = path.join(HANDOFFS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const branch = (content.match(/^branch:\s*(.+)$/m) || [])[1] || '';
    const changes = (content.match(/^uncommitted_changes:\s*(\d+)$/m) || [])[1] || '';
    const commits = [];
    const cMatch = content.match(/recent_commits:\n([\s\S]*?)(?=\n\S|\n$|$)/);
    if (cMatch) {
      for (const line of cMatch[1].split('\n')) {
        const t = line.trim();
        if (t) commits.push(t);
      }
    }
    return { branch: branch.trim(), changes: changes.trim(), commits };
  } catch {
    return null;
  }
}

/**
 * Read the most recent todo file and classify by status.
 * Returns { in_progress: [], pending: [], completed: [] } (always — fail-open).
 */
function readTodos() {
  const result = { in_progress: [], pending: [], completed: [] };
  if (!fs.existsSync(TODOS_DIR)) return result;
  try {
    const files = fs.readdirSync(TODOS_DIR).filter((f) => f.endsWith('.json'));
    if (files.length === 0) return result;
    const sorted = files
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(TODOS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    const latest = JSON.parse(fs.readFileSync(path.join(TODOS_DIR, sorted[0].name), 'utf8'));
    if (!Array.isArray(latest)) return result;
    for (const t of latest) {
      const list = result[t.status];
      if (list) list.push(t.content || t.text || '');
    }
  } catch {
    // ignore — empty classification is the fail-open answer
  }
  return result;
}

/**
 * Action-graph working-set digest for a session ('' when empty/unavailable).
 */
function getDigest(sessionId, budget = 300) {
  if (!fs.existsSync(ACTION_GRAPH)) return '';
  try {
    const out = execFileSync('node', [ACTION_GRAPH, 'digest', sessionId, `--budget=${budget}`], {
      encoding: 'utf8',
      timeout: 4000,
    });
    const trimmed = out.trim();
    if (!trimmed || trimmed === 'Action graph empty.') return '';
    return trimmed;
  } catch {
    return '';
  }
}

module.exports = { cwdSlug, readHandoff, readTodos, getDigest, HANDOFFS_DIR, TODOS_DIR };
