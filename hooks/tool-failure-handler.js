#!/usr/bin/env node
// PostToolUseFailure hook — handles framework-level tool failures.
//
// Fires ONLY when a tool call itself fails (timeout, permission denied,
// tool not found, etc.) — NOT when a tool succeeds but returns error content.
//
// Behavior:
//   1. Logs failure to logs/tool-failures.jsonl
//   2. Tracks failure streaks — 3+ consecutive triggers circuit breaker warning
//   3. Injects actionable guidance based on failure type
//   4. Maintains persistent per-tool health scores

const fs = require('fs');
const path = require('path');
const {
  paths, ensureDir, readJsonSafe, writeJsonSafe, appendLine,
  rotateIfLarge, readStdin, injectContext, isHookEnabled,
} = require('./lib');

// Hook profile gate — exit early if disabled by ATLAS_HOOK_PROFILE
if (!isHookEnabled('tool-failure-handler')) process.exit(0);

const STREAK_THRESHOLD = 3;

readStdin((data) => {
  const sessionId = data.session_id || '';
  const toolName = data.tool_name || '';
  const toolInput = data.tool_input || {};
  const error = data.tool_response?.error || data.error || '';
  const errorStr = typeof error === 'string' ? error : JSON.stringify(error);

  ensureDir(paths.logs);

  // ── 1. Log failure ──────────────────────────────────────────────
  const logPath = path.join(paths.logs, 'tool-failures.jsonl');
  appendLine(logPath, JSON.stringify({
    ts: new Date().toISOString(),
    tool: toolName,
    error: errorStr.slice(0, 500),
    input_summary: JSON.stringify(toolInput).slice(0, 300),
    session: sessionId.slice(0, 16),
  }));

  // ── 2. Track failure streak ─────────────────────────────────────
  const streakPath = path.join(paths.tmp, `claude-fail-streak-${sessionId}.json`);
  const streak = readJsonSafe(streakPath, { count: 0, tools: [], perTool: {} });
  streak.perTool = streak.perTool || {}; // guard for pre-existing files

  streak.count += 1;
  streak.tools.push(toolName);
  if (streak.tools.length > 10) streak.tools = streak.tools.slice(-10);
  streak.perTool[toolName] = (streak.perTool[toolName] || 0) + 1;
  writeJsonSafe(streakPath, streak);

  // ── 3. Build guidance ───────────────────────────────────────────
  let guidance = classifyFailure(toolName, errorStr);

  if (streak.count >= STREAK_THRESHOLD) {
    guidance = `CIRCUIT BREAKER: ${streak.count} consecutive tool failures (${streak.tools.slice(-3).join(', ')}). ` +
      `STOP and reassess your approach. The current strategy is not working. ` +
      `Consider: (1) different tool/approach, (2) reading the error carefully, (3) asking the user for guidance. ` +
      guidance;
  }

  // injectContext (lib.js) emits hookSpecificOutput.additionalContext with the
  // event name captured from stdin — the previously-noted top-level form was
  // an unrecognized shape the harness dropped (fixed v8.14 audit).
  injectContext(`TOOL FAILURE: ${guidance}`);

  // ── 4. Persistent per-tool health tracking ──────────────────────
  // Per-tool streak, not the session-global count — the global streak powers
  // the circuit breaker above, but writing it into tool-health cross-contaminated
  // unrelated tools (weekly-mcp-health false positives, fixed v10).
  updateToolHealth(toolName, streak.perTool[toolName]);

  rotateIfLarge(logPath);
});

function classifyFailure(toolName, errorStr) {
  const isMcp = /^mcp__/.test(toolName);
  const lower = String(errorStr || '').toLowerCase();

  // High-frequency shell reliability failures
  if (toolName === 'Bash' && /unexpected eof while looking for matching [`'"]|unterminated quoted string/i.test(errorStr)) {
    return `BASH QUOTE MISMATCH: The shell command has unbalanced quotes. Rebuild the command as a single line, balance quotes, and quote any path with spaces.`;
  }
  if (toolName === 'Bash' && /cd: .*No such file or directory|cannot access .*No such file or directory|enoent/i.test(errorStr)) {
    return `BASH PATH FAILURE: Target path/file does not exist from current cwd. Run a directory preflight (ls) first, then use the verified absolute/quoted path.`;
  }

  // Read tool reliability failures
  if (toolName === 'Read' && /File does not exist/i.test(errorStr)) {
    return `READ PATH FAILURE: File not found from current working directory. Verify cwd context and use absolute paths for cross-project files.`;
  }
  if (toolName === 'Read' && /exceeds maximum allowed|exceeds maximum allowed tokens/i.test(errorStr)) {
    return `READ SIZE LIMIT: File is too large for full read. Retry with bounded reads using offset/limit chunks, then summarize incrementally.`;
  }

  // Preview resilience failures
  if (/^mcp__Claude_(Browser|Preview)__/.test(toolName) && /timed out|stuck|hang|unresponsive renderer/i.test(lower)) {
    return `PREVIEW HANG: Run one recovery cycle only (check preview logs/state, refresh or restart preview), then report blocker with evidence instead of repeated retries.`;
  }
  if (/^mcp__Claude_(Browser|Preview)__/.test(toolName) && /inspected target navigated or closed/i.test(lower)) {
    return `PREVIEW TARGET RESET: The page navigated/closed during eval. Reacquire fresh page state (snapshot/screenshot) before the next interaction.`;
  }

  if (isMcp && /ECONNREFUSED|ECONNRESET|EPIPE|connection refused|server disconnected|transport closed|spawn.*ENOENT/i.test(errorStr)) {
    const serverName = toolName.split('__')[1] || 'unknown';
    return `MCP SERVER DOWN: "${serverName}" is not responding. This tool will keep failing until the server is restarted. Consider disabling it in .mcp.json if not needed, or restart the MCP server.`;
  }
  if (isMcp && /timeout|ETIMEDOUT/i.test(errorStr)) {
    const serverName = toolName.split('__')[1] || 'unknown';
    return `MCP SERVER TIMEOUT: "${serverName}" timed out. The server may be overloaded or hanging. Check if the npx process is still running.`;
  }
  if (/timeout/i.test(errorStr)) {
    return `Tool "${toolName}" timed out. Consider: (1) simpler input, (2) breaking the operation into smaller steps, (3) increasing timeout if supported.`;
  }
  if (/permission|denied|blocked/i.test(errorStr)) {
    return `Tool "${toolName}" was blocked. Check if a security hook (context-guard.js, cctools-safety-hooks) is rejecting this operation. Adjust your approach.`;
  }
  if (/not found|unknown tool/i.test(errorStr)) {
    return `Tool "${toolName}" not found. Use ToolSearch to discover available tools, or check if an MCP server needs to be loaded.`;
  }
  return `Tool "${toolName}" failed: ${errorStr.slice(0, 150)}. Diagnose before retrying — don't retry the identical call.`;
}

function updateToolHealth(toolName, streakCount) {
  const healthPath = path.join(paths.logs, 'tool-health.json');
  rotateIfLarge(healthPath, 500_000); // 500KB cap — prevents unbounded growth
  const health = readJsonSafe(healthPath, { tools: {} });
  if (!health.tools) health.tools = {};

  // Cap distinct tool entries to prevent unbounded key growth
  const toolKeys = Object.keys(health.tools);
  if (toolKeys.length > 200 && !health.tools[toolName]) {
    // Evict oldest tool entry
    const oldest = toolKeys.reduce((a, b) =>
      (health.tools[a].last_failure || '') < (health.tools[b].last_failure || '') ? a : b
    );
    delete health.tools[oldest];
  }

  const now = new Date().toISOString();
  const t = health.tools[toolName] || { total_failures: 0, failures: [] };
  t.total_failures = (t.total_failures || 0) + 1;
  t.failures = t.failures || [];
  t.failures.push(now);
  if (t.failures.length > 50) t.failures = t.failures.slice(-50);
  t.last_failure = now;
  t.consecutive_streak = streakCount;
  t.is_mcp = /^mcp__/.test(toolName);
  health.tools[toolName] = t;
  health._meta = { last_updated: now };

  writeJsonSafe(healthPath, health);
}
