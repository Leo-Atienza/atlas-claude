#!/usr/bin/env node
// Claude Code Statusline
// Shows: model | current task | directory | context usage | tool call count

const fs = require('fs');
const path = require('path');
const { paths, loadThresholds, readJsonSafe, writeJsonSafe, readStdin, isHookEnabled } = require('./lib');

// Hook profile gate — exit early if disabled by ATLAS_HOOK_PROFILE
if (!isHookEnabled('statusline')) process.exit(0);

const colors = loadThresholds().statusline_colors;

readStdin((data) => {
  const model = data.model?.display_name || 'Claude';
  const dir = data.workspace?.current_dir || process.cwd();
  const session = data.session_id || '';
  const remaining = data.context_window?.remaining_percentage;

  const ctx = buildContextBar(remaining, session);
  const task = findCurrentTask(session);
  const calls = getCallCount(session);
  const dirname = path.basename(dir);

  if (task) {
    process.stdout.write(`\x1b[2m${model}\x1b[0m \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}${calls}`);
  } else {
    process.stdout.write(`\x1b[2m${model}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}${calls}`);
  }
});

function buildContextBar(remaining, session) {
  if (remaining == null) return '';

  const rem = Math.round(remaining);
  const rawUsed = Math.max(0, Math.min(100, 100 - rem));
  // Scale: 80% real usage = 100% displayed (Claude Code enforces 80% limit)
  const used = Math.min(100, Math.round((rawUsed / 80) * 100));

  // Write bridge file for context-monitor PostToolUse hook
  if (session) {
    const bridgePath = path.join(paths.tmp, `claude-ctx-${session}.json`);
    writeJsonSafe(bridgePath, {
      session_id: session,
      remaining_percentage: remaining,
      used_pct: used,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  const filled = Math.floor(used / 10);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

  if (used < colors.green_below_used) {
    return ` \x1b[32m${bar} ${used}%\x1b[0m`;
  } else if (used < colors.yellow_below_used) {
    return ` \x1b[33m${bar} ${used}%\x1b[0m`;
  } else if (used < colors.orange_below_used) {
    return ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
  }
  return ` \x1b[5;31m${bar} ${used}%\x1b[0m`;
}

function findCurrentTask(session) {
  if (!session) return '';
  const todosDir = path.join(paths.claude, 'todos');
  if (!fs.existsSync(todosDir)) return '';

  try {
    const allFiles = fs.readdirSync(todosDir).filter(f => f.endsWith('.json'));

    // Try strict match first (session prefix + agent pattern)
    let files = allFiles
      .filter(f => f.startsWith(session) && f.includes('-agent-'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    // Fallback: partial session ID match (first 8 chars)
    if (files.length === 0 && session.length >= 8) {
      const prefix = session.substring(0, 8);
      files = allFiles
        .filter(f => f.includes(prefix))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);
    }

    if (files.length === 0) return '';

    const todos = readJsonSafe(path.join(todosDir, files[0].name), []);
    const inProgress = todos.find(t => t.status === 'in_progress');
    return inProgress?.content || '';
  } catch (_) {
    return '';
  }
}

function getCallCount(session) {
  if (!session) return '';
  const counterFile = path.join(paths.cache, `efficiency-${session.substring(0, 16)}.json`);
  const counters = readJsonSafe(counterFile, null);
  if (counters?.total) return ` \x1b[2m${counters.total} calls\x1b[0m`;
  return '';
}
