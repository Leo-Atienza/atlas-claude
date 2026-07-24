#!/usr/bin/env node
/**
 * ATLAS skill/command usage logger (v7.0 Wave B; extended v10 U1-2).
 *
 * Two registrations, one ledger (logs/skill-usage.jsonl):
 *   - PreToolUse matching `Skill`   → {ts, skill, cwd, session_id}
 *   - UserPromptSubmit              → {ts, kind:"slash", name, cwd, session_id}
 *     when the prompt starts with /<known-command> (known = commands/**\/*.md
 *     basenames; subdirs join with ':' — commands/<dir>/<name>.md → dir:name).
 *
 * The slash channel closes the v10 capture gap: slash-expansions never hit the
 * Skill tool, so zero-telemetry looked like zero-use (drift-thresholds note
 * 2026-05-28). Consumed by scripts/usage-report.js + observability.js.
 *
 * Fail-open: any error exits 0 without blocking.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.resolve(__dirname, '..');
const LOG_PATH = path.join(CLAUDE_DIR, 'logs', 'skill-usage.jsonl');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');

function knownCommands() {
  const names = new Set();
  const walk = (dir, prefix) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name), prefix ? `${prefix}:${e.name}` : e.name);
      else if (e.name.endsWith('.md')) {
        const base = e.name.slice(0, -3);
        names.add(prefix ? `${prefix}:${base}` : base);
      }
    }
  };
  walk(COMMANDS_DIR, '');
  return names;
}

function append(record) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(record) + '\n');
}

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = raw ? JSON.parse(raw) : {};

    // Channel 1: explicit Skill-tool invocation (PreToolUse).
    if (payload.tool_name === 'Skill') {
      append({
        ts: new Date().toISOString(),
        skill: (payload.tool_input && payload.tool_input.skill) || 'unknown',
        cwd: payload.cwd || process.cwd(),
        session_id: payload.session_id || null,
      });
      return;
    }

    // Channel 2: slash-command prompt (UserPromptSubmit).
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const m = prompt.match(/^\/([A-Za-z0-9][\w:-]*)/);
    if (!m) return;
    if (!knownCommands().has(m[1])) return; // unknown slash → not ours to log
    append({
      ts: new Date().toISOString(),
      kind: 'slash',
      name: m[1],
      cwd: payload.cwd || process.cwd(),
      session_id: payload.session_id || null,
    });
  } catch { /* fail-open */ }
});
process.stdin.on('error', () => { /* fail-open */ });
