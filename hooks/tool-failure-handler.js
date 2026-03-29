#!/usr/bin/env node
// PostToolUseFailure hook — Dedicated handler for framework-level tool failures.
//
// This fires ONLY when a tool call itself fails at the framework level
// (timeout, permission denied, tool not found, etc.) — NOT when a tool
// succeeds but returns error content (that's handled by mistake-capture.py).
//
// Inspired by oh-my-claudecode's post-tool-use-failure hook.
//
// Behavior:
//   1. Logs the failure to logs/tool-failures.jsonl (separate from failures.jsonl)
//   2. Tracks failure streaks — 3+ consecutive failures triggers a circuit breaker warning
//   3. Injects actionable guidance based on failure type

const fs = require('fs');
const os = require('os');
const path = require('path');

const STREAK_THRESHOLD = 3;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || '';
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const error = data.tool_response?.error || data.error || '';
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);

    // Log to dedicated failure file
    const logDir = path.join(os.homedir(), '.claude', 'logs');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}

    const entry = {
      ts: new Date().toISOString(),
      tool: toolName,
      error: errorStr.slice(0, 500),
      input_summary: JSON.stringify(toolInput).slice(0, 300),
      session: sessionId.slice(0, 16),
    };

    const logPath = path.join(logDir, 'tool-failures.jsonl');
    try {
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (e) {}

    // Track failure streak
    const streakPath = path.join(os.tmpdir(), `claude-fail-streak-${sessionId}.json`);
    let streak = { count: 0, tools: [] };
    try {
      if (fs.existsSync(streakPath)) {
        streak = JSON.parse(fs.readFileSync(streakPath, 'utf8'));
      }
    } catch (e) { streak = { count: 0, tools: [] }; }

    streak.count += 1;
    streak.tools.push(toolName);
    if (streak.tools.length > 10) streak.tools = streak.tools.slice(-10);

    try {
      fs.writeFileSync(streakPath, JSON.stringify(streak));
    } catch (e) {}

    // Build guidance based on failure type
    let guidance = '';

    if (/timeout/i.test(errorStr)) {
      guidance = `Tool "${toolName}" timed out. Consider: (1) simpler input, (2) breaking the operation into smaller steps, (3) increasing timeout if supported.`;
    } else if (/permission|denied|blocked/i.test(errorStr)) {
      guidance = `Tool "${toolName}" was blocked. Check if a security hook (security-gate.sh, cctools-safety-hooks) is rejecting this operation. Adjust your approach.`;
    } else if (/not found|unknown tool/i.test(errorStr)) {
      guidance = `Tool "${toolName}" not found. Use ToolSearch to discover available tools, or check if an MCP server needs to be loaded.`;
    } else {
      guidance = `Tool "${toolName}" failed: ${errorStr.slice(0, 150)}. Diagnose before retrying — don't retry the identical call.`;
    }

    // Circuit breaker on streak
    if (streak.count >= STREAK_THRESHOLD) {
      guidance = `CIRCUIT BREAKER: ${streak.count} consecutive tool failures (${streak.tools.slice(-3).join(', ')}). ` +
        `STOP and reassess your approach. The current strategy is not working. ` +
        `Consider: (1) different tool/approach, (2) reading the error carefully, (3) asking the user for guidance. ` +
        guidance;
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUseFailure",
        additionalContext: `TOOL FAILURE: ${guidance}`
      }
    };
    process.stdout.write(JSON.stringify(output));

    // Persistent per-tool health tracking (EMA failure rates, cross-session)
    const EMA_ALPHA = 0.3;
    const healthPath = path.join(logDir, 'tool-health.json');
    try {
      let health = { tools: {} };
      try { health = JSON.parse(fs.readFileSync(healthPath, 'utf8')); } catch (e) {}
      if (!health.tools) health.tools = {};

      const t = health.tools[toolName] || { total_calls: 0, total_failures: 0, failure_rate_ema: 0 };
      t.total_calls += 1;
      t.total_failures += 1;
      t.failure_rate_ema = EMA_ALPHA * 1.0 + (1 - EMA_ALPHA) * (t.failure_rate_ema || 0);
      t.last_failure = new Date().toISOString();
      t.consecutive_streak = streak.count;
      health.tools[toolName] = t;
      health._meta = { last_updated: new Date().toISOString() };

      fs.writeFileSync(healthPath, JSON.stringify(health, null, 2));
    } catch (e) {}

    // Rotate log if over 2MB
    try {
      if (fs.existsSync(logPath) && fs.statSync(logPath).size > 2_000_000) {
        fs.renameSync(logPath, logPath + '.bak');
      }
    } catch (e) {}

  } catch (e) {
    process.exit(0);
  }
});
