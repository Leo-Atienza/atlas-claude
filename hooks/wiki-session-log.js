#!/usr/bin/env node
// hooks/wiki-session-log.js
//
// Stop hook — appends a session entry to
//   <your-vault-path>/wiki/session-log/<project>/<YYYY-MM-DD>.md
// where <project> is the cwd basename (leading dot stripped so Obsidian
// doesn't hide the folder; e.g. `.claude` → `claude`).
//
// Why: the wiki vault is the user's human-readable second brain — and as of
// v8.0.0 (brain-consolidation, 2026-05-14) it's also Claude's only durable
// memory layer. This hook writes the daily-note entry; the companion
// session-transcript-log.py writes the verbatim transcript to session-log/transcripts/.
//
// Pattern: per-project subfolders with daily files inside — gives Obsidian
// users a dropdown per project in the file explorer, plus a per-day view
// within each project. Migrated from flat YYYY-MM-DD.md on 2026-05-14.
//
// Order in the Stop hook chain (per settings.json, current as of v8.15;
// the memory-* hooks this comment once listed were retired in v8.0.0):
//   1. session-stop.sh            — writes handoff file at ~/.claude/handoffs/<slug>.md
//   2. wiki-session-log.js        — THIS HOOK — writes vault daily entry
//   3. session-transcript-log.py  — writes distilled transcript (async since v8.14.1)
//
// Idle skip: no digest, no todos, no commits → silently skip. Same heuristic as
// memory-episodic-write.js. Don't pollute the daily journal with no-op sessions.
//
// Fail-open: errors are written to stderr but NEVER block session shutdown.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
// Session-state readers unified into lib/session (2026-06-09) — this hook,
// session-handoff.js, and recall.js previously carried private copies.
const { readHandoff, readTodos, getDigest } = require('./lib/session');

const HOME = os.homedir();
const VAULT_LOG_DIR = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'session-log');

function readStdinSync() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function parseSessionId() {
  const raw = readStdinSync();
  if (!raw) return '';
  try {
    return JSON.parse(raw).session_id || '';
  } catch {
    const m = raw.match(/"session_id"\s*:\s*"([^"]+)"/);
    return m ? m[1] : '';
  }
}

function escapeMd(s) {
  // Avoid breaking Obsidian rendering on stray pipes/backticks in todo text
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function buildEntry({ sessionId, digest, todos, handoff, time }) {
  // Header omits "in `<cwd>`" — the per-project folder name conveys that now.
  const shortId = sessionId.slice(0, 8);

  const lines = [];
  lines.push(`## Session \`${shortId}\` — ${time}`);
  lines.push('');

  // Meta line
  const meta = [];
  if (handoff?.branch) meta.push(`branch \`${handoff.branch}\``);
  if (handoff?.changes && handoff.changes !== '0') meta.push(`${handoff.changes} uncommitted`);
  if (todos.completed.length) meta.push(`${todos.completed.length} todo${todos.completed.length === 1 ? '' : 's'} done`);
  if (todos.in_progress.length) meta.push(`${todos.in_progress.length} in progress`);
  if (meta.length) {
    lines.push(`_${meta.join(' · ')}_`);
    lines.push('');
  }

  if (handoff?.commits.length) {
    lines.push('**Commits this session:**');
    for (const c of handoff.commits.slice(0, 3)) lines.push(`- ${escapeMd(c)}`);
    lines.push('');
  }

  if (todos.completed.length) {
    lines.push('**Done:**');
    for (const t of todos.completed.slice(0, 8)) lines.push(`- ${escapeMd(t)}`);
    if (todos.completed.length > 8) lines.push(`- _…${todos.completed.length - 8} more_`);
    lines.push('');
  }

  if (todos.in_progress.length) {
    lines.push('**Carrying over:**');
    for (const t of todos.in_progress.slice(0, 5)) lines.push(`- ${escapeMd(t)}`);
    lines.push('');
  }

  if (digest) {
    const hot = (digest.match(/Working set \(([^)]+)\)/) || [])[1];
    if (hot) {
      lines.push(`**Hot files:** ${hot}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

function ensureDailyFile(file, dateStr, project) {
  if (fs.existsSync(file)) return;
  const frontmatter = [
    '---',
    `title: ${project} sessions — ${dateStr}`,
    'type: session-log',
    `date: ${dateStr}`,
    `project: ${project}`,
    'status: auto',
    '---',
    '',
    `# ${project} — ${dateStr}`,
    '',
    '_Auto-appended by `~/.claude/hooks/wiki-session-log.js` at session end. Manual notes can be added by editing this file directly — they survive across new session appends._',
    '',
  ].join('\n');
  fs.writeFileSync(file, frontmatter, 'utf8');
}

// Vault folder names must avoid Obsidian's dotfile hiding. The actual cwd
// basename stays in the entry meta — only the folder we write to is sanitized.
function projectFolderName(cwd) {
  const base = path.basename(cwd) || 'unknown';
  // Strip a single leading dot so `.claude` → `claude` (Obsidian hides dot-folders).
  // Also replace any path-illegal chars.
  const noDot = base.startsWith('.') ? base.slice(1) : base;
  return noDot.replace(/[\\/:*?"<>|]/g, '_') || 'unknown';
}

function main() {
  const sessionId = parseSessionId();
  if (!sessionId) return; // No session context — skip silently

  const cwd = process.cwd();
  const digest = getDigest(sessionId);
  const todos = readTodos();
  const handoff = readHandoff(cwd);

  // Idle skip — same heuristic as memory-episodic-write.js
  const isIdle =
    !digest &&
    todos.completed.length === 0 &&
    todos.in_progress.length === 0 &&
    (!handoff || (!handoff.commits.length && (!handoff.changes || handoff.changes === '0')));
  if (isIdle) return;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5);    // HH:MM

  const project = projectFolderName(cwd);
  const projectDir = path.join(VAULT_LOG_DIR, project);
  fs.mkdirSync(projectDir, { recursive: true });
  const dailyFile = path.join(projectDir, `${dateStr}.md`);
  ensureDailyFile(dailyFile, dateStr, project);

  const entry = buildEntry({ sessionId, digest, todos, handoff, time });
  fs.appendFileSync(dailyFile, entry, 'utf8');

  // Refresh-on-write (v8.15): hot.md's only other refresh runs behind
  // session-start's 24h throttle, so same-day vault writes were invisible to
  // same-day sessions (the v8.14 audit's KNOWLEDGE-162/163 landed at 01:06,
  // 21 minutes after the day's refresh — blind until the next morning).
  // This point is only reached when the session provably did work (idle-skip
  // above), so if hot.md is >2h stale, regenerate it now — detached and
  // fail-open, never blocks Stop. session-start §6a remains the fallback.
  try {
    const hotFile = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'hot.md');
    if (Date.now() - fs.statSync(hotFile).mtimeMs > 2 * 60 * 60 * 1000) {
      const { spawn } = require('child_process');
      spawn(process.execPath, [path.join(HOME, '.claude', 'scripts', 'wiki-hot-refresh.js')],
        { detached: true, stdio: 'ignore' }).unref();
    }
  } catch { /* hot.md absent or unreadable — session-start §6a will handle it */ }
}

try {
  main();
} catch (e) {
  process.stderr.write(`[wiki-session-log] ${e.message}\n`);
  process.exit(0);
}
