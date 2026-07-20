#!/usr/bin/env node
/**
 * ATLAS v7.0 Wave B — Skill-tool usage logger.
 *
 * Wired as a PreToolUse hook matching the `Skill` tool. Reads the hook payload
 * from stdin and appends one JSONL record per invocation to logs/skill-usage.jsonl.
 * Consumed by scripts/observability.js and by monthly skill-usage-audit.
 *
 * Fail-open: any error exits 0 without blocking the tool call.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.resolve(__dirname, '..');
const LOG_PATH = path.join(CLAUDE_DIR, 'logs', 'skill-usage.jsonl');

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = raw ? JSON.parse(raw) : {};
    if (payload.tool_name !== 'Skill') return; // belt-and-braces; matcher should filter
    const skill = (payload.tool_input && payload.tool_input.skill) || 'unknown';
    const record = {
      ts: new Date().toISOString(),
      skill,
      cwd: payload.cwd || process.cwd(),
      session_id: payload.session_id || null,
    };
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(record) + '\n');
  } catch { /* fail-open */ }
});
process.stdin.on('error', () => { /* fail-open */ });
