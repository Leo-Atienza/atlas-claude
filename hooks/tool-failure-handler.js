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
  const streak = readJsonSafe(streakPath, { count: 0, tools: [] });

  streak.count += 1;
  streak.tools.push(toolName);
  if (streak.tools.length > 10) streak.tools = streak.tools.slice(-10);
  writeJsonSafe(streakPath, streak);

  // ── 3. Build guidance ───────────────────────────────────────────
  let guidance = classifyFailure(toolName, errorStr);

  if (streak.count >= STREAK_THRESHOLD) {
    guidance = `CIRCUIT BREAKER: ${streak.count} consecutive tool failures (${streak.tools.slice(-3).join(', ')}). ` +
      `STOP and reassess your approach. The current strategy is not working. ` +
      `Consider: (1) different tool/approach, (2) reading the error carefully, (3) asking the user for guidance. ` +
      guidance;
  }

  // FIX: Use top-level additionalContext (not nested under hookSpecificOutput)
  injectContext(`TOOL FAILURE: ${guidance}`);

  // ── 4. Persistent per-tool health tracking ──────────────────────
  updateToolHealth(toolName, streak.count);

  rotateIfLarge(logPath);
});

function classifyFailure(toolName, errorStr) {
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
  const health = readJsonSafe(healthPath, { tools: {} });
  if (!health.tools) health.tools = {};

  const now = new Date().toISOString();
  const t = health.tools[toolName] || { total_failures: 0, failures: [] };
  t.total_failures = (t.total_failures || 0) + 1;
  t.failures = t.failures || [];
  t.failures.push(now);
  if (t.failures.length > 50) t.failures = t.failures.slice(-50);
  t.last_failure = now;
  t.consecutive_streak = streakCount;
  health.tools[toolName] = t;
  health._meta = { last_updated: now };

  writeJsonSafe(healthPath, health);
}
