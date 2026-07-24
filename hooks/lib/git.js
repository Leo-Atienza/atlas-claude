// lib/git.js — single git-state reader for session-end writers and recall.
//
// Extracted from session-handoff.js (which shelled out per field). Callers:
// hooks/session-handoff.js, scripts/recall.js. session-stop.sh keeps its own
// bash git block deliberately (hot Stop path — no node spawn for what bash
// does natively); that duplication is documented there.

'use strict';

const { execSync } = require('child_process');

function sh(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Snapshot of the git state at `cwd`.
 * Returns { isGit, branch, commits[], statusRaw, changedCount } — all fields
 * safe defaults when not a repo or git is unavailable (fail-open).
 */
function getGitState(cwd) {
  const isGit = sh('git rev-parse --is-inside-work-tree', cwd) === 'true';
  if (!isGit) return { isGit: false, branch: '', commits: [], statusRaw: '', changedCount: 0 };
  const branch = sh('git branch --show-current', cwd);
  const commits = sh('git log --oneline -5', cwd).split('\n').filter(Boolean);
  const statusRaw = sh('git status --porcelain', cwd);
  const changedCount = statusRaw ? statusRaw.split('\n').filter(Boolean).length : 0;
  return { isGit, branch, commits, statusRaw, changedCount };
}

module.exports = { getGitState, sh };
