#!/usr/bin/env node
// PreToolUse Context Guard — Proactively blocks expensive tool calls when context is high.
//
// Unlike context-monitor.js (PostToolUse, reactive), this runs BEFORE tool execution
// and prevents wasted tokens. Inspired by oh-my-claudecode's pre-tool-enforcer.
//
// Behavior:
//   - Context >= 72% used: blocks expensive tools (Agent, Bash, Write, Edit, MultiEdit)
//   - Always allows: Read, Glob, Grep, TodoWrite, ToolSearch (state-saving tools)
//   - Reads the same bridge file written by statusline.js
//
// Output: { hookSpecificOutput: { hookEventName: "PreToolUse", decision: "block", reason: "..." } }

const fs = require('fs');
const os = require('os');
const path = require('path');

const GUARD_THRESHOLD = 28; // remaining_percentage <= 28% (72% used) → block expensive tools
const STALE_SECONDS = 120;

// Tools that are always allowed (needed for saving state, reading context)
const ALWAYS_ALLOWED = new Set([
  'Read', 'Glob', 'Grep', 'TodoWrite', 'ToolSearch',
  'AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode',
]);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    const toolName = data.tool_name;

    // Always allow lightweight tools
    if (!sessionId || !toolName || ALWAYS_ALLOWED.has(toolName)) {
      process.exit(0);
    }

    const metricsPath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);

    if (!fs.existsSync(metricsPath)) {
      process.exit(0); // No metrics = fresh session, allow everything
    }

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);

    // Stale metrics — don't block based on old data
    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
      process.exit(0);
    }

    const remaining = metrics.remaining_percentage;

    if (remaining > GUARD_THRESHOLD) {
      process.exit(0); // Plenty of context left
    }

    // Context is critical — block expensive tools
    const output = {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        decision: "block",
        reason: `CONTEXT GUARD: ${remaining}% context remaining (threshold: ${GUARD_THRESHOLD}%). ` +
          `Tool "${toolName}" blocked to prevent wasted tokens. ` +
          `SAVE STATE NOW: Write a handoff file, update todos, then inform the user. ` +
          `Allowed tools: ${[...ALWAYS_ALLOWED].join(', ')}.`
      }
    };
    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail — never block tool execution on hook errors
    process.exit(0);
  }
});
