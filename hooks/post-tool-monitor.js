#!/usr/bin/env node
/**
 * Consolidated PostToolUse monitor — replaces 4 separate hooks:
 *   1. context-monitor    → context usage warnings + auto-continuation
 *   2. mistake-capture    → failure logging + pattern detection
 *   3. hook-health-logger → hook execution time logging
 *   4. tool-efficiency    → tool call counting + efficiency warnings
 *
 * Matcher: Write|Edit|MultiEdit|Bash|Agent
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  paths, loadThresholds, ensureDir, readJsonSafe, writeJsonSafe,
  appendLine, rotateIfLarge, readStdin, injectContext, isHookEnabled,
} = require('./lib');

// Hook profile gate — exit early if disabled by ATLAS_HOOK_PROFILE
if (!isHookEnabled('post-tool-monitor')) process.exit(0);

const hookStart = Date.now();

// ── Config ──────────────────────────────────────────────────────────
const thresholds = loadThresholds();
const HANDOFF_THRESHOLD = thresholds.thresholds.auto_continuation.remaining_pct;
const WARNING_THRESHOLD = thresholds.thresholds.warning.remaining_pct;
const CRITICAL_THRESHOLD = thresholds.thresholds.critical.remaining_pct;
const STALE_SECONDS = thresholds.stale_seconds;
const DEBOUNCE_CALLS = thresholds.debounce_calls;

const EFFICIENCY_WARN_AT = [100, 200];

const ERROR_INDICATORS = [
  'error', 'Error', 'ERROR', 'FAILED', 'failed', 'Traceback', 'Exception',
  'command not found', 'No such file', 'Permission denied', 'exit code',
  'ENOENT', 'EPERM', 'EACCES', 'SyntaxError', 'TypeError', 'ReferenceError',
];

// ── Main ────────────────────────────────────────────────────────────
readStdin((data) => {
  const sessionId = data.session_id || '';
  const toolName = data.tool_name || '';
  const toolInput = data.tool_input || {};
  const toolResponse = data.tool_response || {};
  const messages = [];

  ensureDir(paths.logs);
  ensureDir(paths.cache);

  // ── 1. Tool Efficiency Tracking ─────────────────────────────────
  const counterFile = path.join(paths.cache, `efficiency-${sessionId.substring(0, 16)}.json`);
  const counters = readJsonSafe(counterFile, {
    session_id: sessionId.substring(0, 16),
    started: new Date().toISOString(),
    tools: {},
    total: 0,
  });

  counters.tools[toolName] = (counters.tools[toolName] || 0) + 1;
  counters.total = (counters.total || 0) + 1;
  counters.last_tool = toolName;
  counters.last_ts = new Date().toISOString();
  writeJsonSafe(counterFile, counters);

  if (EFFICIENCY_WARN_AT.includes(counters.total)) {
    const breakdown = Object.entries(counters.tools)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([t, c]) => `${t}:${c}`)
      .join(', ');
    messages.push(`EFFICIENCY NOTE: ${counters.total} tool calls this session. Breakdown: ${breakdown}. Consider if approach can be streamlined.`);
  }

  // ── 2. Mistake Capture ──────────────────────────────────────────
  const isFailure = detectFailure(toolName, toolResponse);

  if (isFailure) {
    logFailure(sessionId, toolName, toolInput, toolResponse, messages);
  } else {
    trackSuccess(toolName, sessionId);
  }

  // ── 3. Context Monitor ──────────────────────────────────────────
  if (sessionId) {
    checkContextUsage(sessionId, data, messages);
  }

  // ── 4. Hook Health Logging ──────────────────────────────────────
  appendLine(
    path.join(paths.logs, 'hook-health.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), hook: 'post-tool-monitor', duration_ms: Date.now() - hookStart, tool: toolName })
  );

  // ── Emit collected messages ─────────────────────────────────────
  if (messages.length > 0) {
    injectContext(messages.join('\n\n'));
  }
});

// ── Failure detection ───────────────────────────────────────────────
function detectFailure(toolName, toolResponse) {
  if (typeof toolResponse === 'object' && toolResponse !== null) {
    if (toolResponse.error) return true;
    const exitCode = toolResponse.exitCode || toolResponse.exit_code || 0;
    if (exitCode && parseInt(exitCode) !== 0) return true;
    const stderr = String(toolResponse.stderr || '');
    if (stderr && ERROR_INDICATORS.some(ind => stderr.includes(ind))) return true;
  } else if (typeof toolResponse === 'string' && ERROR_INDICATORS.some(ind => toolResponse.includes(ind))) {
    return true;
  }

  const output = String(
    (typeof toolResponse === 'object' && toolResponse !== null ? toolResponse.output : toolResponse) || ''
  ).substring(0, 2000);
  if (ERROR_INDICATORS.some(ind => output.includes(ind)) && ['Bash', 'Write', 'Edit', 'MultiEdit'].includes(toolName)) {
    return true;
  }

  return false;
}

// ── Failure logging + pattern detection ─────────────────────────────
function logFailure(sessionId, toolName, toolInput, toolResponse, messages) {
  const errorText = typeof toolResponse === 'object' && toolResponse !== null
    ? String(toolResponse.error || toolResponse.output || '').substring(0, 500)
    : String(toolResponse).substring(0, 500);

  const entry = {
    ts: new Date().toISOString(),
    tool: toolName,
    command: String(toolInput.command || '').substring(0, 300),
    file_path: String(toolInput.file_path || ''),
    error: errorText,
    session: sessionId.substring(0, 16),
  };

  const failuresPath = path.join(paths.logs, 'failures.jsonl');
  appendLine(failuresPath, JSON.stringify(entry));

  // Pattern detection
  const fingerprint = crypto.createHash('md5')
    .update(`${toolName}:${errorText.substring(0, 100)}`)
    .digest('hex')
    .substring(0, 12);

  const patternsPath = path.join(paths.logs, 'error-patterns.json');
  const patterns = readJsonSafe(patternsPath, {});

  if (!patterns[fingerprint]) {
    patterns[fingerprint] = { count: 0, tool: toolName, sample: errorText.substring(0, 100), first_seen: entry.ts };
  }
  patterns[fingerprint].count++;
  patterns[fingerprint].last_seen = entry.ts;
  writeJsonSafe(patternsPath, patterns);

  if (patterns[fingerprint].count >= 3) {
    messages.push(
      `RECURRING FAILURE (${patterns[fingerprint].count}x): ${toolName} — ${errorText.substring(0, 80)}... ` +
      `Consider saving this as a G-ERR entry in the Knowledge Store.`
    );
  }

  rotateIfLarge(failuresPath);
}

// ── Success tracking ────────────────────────────────────────────────
function trackSuccess(toolName, sessionId) {
  // Reset failure streak on success
  if (sessionId) {
    const streakPath = path.join(paths.tmp, `claude-fail-streak-${sessionId}.json`);
    if (fs.existsSync(streakPath)) {
      writeJsonSafe(streakPath, { count: 0, tools: [] });
    }
  }

  // Track tool call counts (flush every 10th call)
  const countsPath = path.join(paths.logs, 'tool-call-counts.json');
  const counts = readJsonSafe(countsPath, {});
  counts[toolName] = (counts[toolName] || 0) + 1;
  if (counts[toolName] % 10 === 0 || counts[toolName] === 1) {
    writeJsonSafe(countsPath, counts);
  }
}

// ── Context usage monitoring ────────────────────────────────────────
function checkContextUsage(sessionId, data, messages) {
  const metricsPath = path.join(paths.tmp, `claude-ctx-${sessionId}.json`);
  const metrics = readJsonSafe(metricsPath, null);
  if (!metrics) return;

  const now = Math.floor(Date.now() / 1000);

  if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
    messages.push(`CONTEXT MONITOR: Metrics stale (>${now - metrics.timestamp}s). Context usage unknown — statusline may not be running.`);
    return;
  }

  const remaining = metrics.remaining_percentage;
  const usedPct = metrics.used_pct;

  if (remaining === undefined || remaining > WARNING_THRESHOLD) return;

  const warnPath = path.join(paths.tmp, `claude-ctx-${sessionId}-warned.json`);
  const warnData = readJsonSafe(warnPath, { callsSinceWarn: 0, lastLevel: null, handoffFired: false });
  const firstWarn = !fs.existsSync(warnPath);
  warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

  // Auto-continuation handoff
  if (remaining <= HANDOFF_THRESHOLD && !warnData.handoffFired) {
    warnData.handoffFired = true;
    writeJsonSafe(warnPath, warnData);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const handoffPath = path.join(paths.claude, 'sessions', `handoff-${timestamp}.md`);
    const cwd = data.cwd || process.cwd();

    const triggerPath = path.join(paths.tmp, `claude-handoff-${sessionId}.trigger`);
    try { fs.writeFileSync(triggerPath, `${handoffPath}\n${cwd}\n0\n`); } catch (_) {}

    messages.push(
      `AUTO-CONTINUATION TRIGGERED: Context at ${usedPct}% (${remaining}% remaining).\n\n` +
      `Write a handoff file to: ${handoffPath}\n\n` +
      `Include: task_description, branch, cwd (${cwd}), modified_files, immediate_next_action, and any context that would be lost.\n\n` +
      `Then say "Continuing in new session..." and STOP.`
    );
    return;
  }

  // Standard warning/critical
  const isCritical = remaining <= CRITICAL_THRESHOLD;
  const currentLevel = isCritical ? 'critical' : 'warning';
  const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';

  if (firstWarn || warnData.callsSinceWarn >= DEBOUNCE_CALLS || severityEscalated) {
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    writeJsonSafe(warnPath, warnData);

    if (isCritical) {
      messages.push(`CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted.`);
    } else {
      messages.push(`CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. Begin wrapping up current task. Do not start new complex work.`);
    }
  } else {
    writeJsonSafe(warnPath, warnData);
  }
}
