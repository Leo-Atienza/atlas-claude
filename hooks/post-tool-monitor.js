#!/usr/bin/env node
/**
 * Consolidated PostToolUse monitor — five responsibilities:
 *   1. context-monitor    → context usage warnings + auto-continuation
 *   2. mistake-capture    → failure logging + pattern detection
 *   3. hook-health-logger → hook execution time logging
 *   4. tool-efficiency    → tool call counting + efficiency warnings
 *   5. action-graph       → retrieval tracking + reference scanner for usage scoring
 *
 * Matcher: Read|Glob|Grep|Write|Edit|MultiEdit|Bash|Agent
 *   - Action-graph logging fires for all matched tools (Read/Glob/Grep → retrievals)
 *   - Efficiency counting stays bounded to the EXPENSIVE set via a guard so
 *     the 100/200-call warning thresholds don't shift under heavy exploration.
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

// Tools that count toward the efficiency-warning thresholds. Kept narrow
// because the 100/200 thresholds were tuned for write/run-heavy work, not
// read-heavy exploration.
const MATCH_EXPENSIVE = new Set(['Write', 'Edit', 'MultiEdit', 'Bash', 'Agent']);

const ERROR_INDICATORS = [
  'error', 'Error', 'ERROR', 'FAILED', 'failed', 'Traceback', 'Exception',
  'command not found', 'No such file', 'Permission denied', 'exit code',
  'ENOENT', 'EPERM', 'EACCES', 'SyntaxError', 'TypeError', 'ReferenceError',
];

// ── Action-graph reference scanner helpers ──────────────────────────
// Flatten an object/array into its string-valued leaves so the reference
// scanner can look for previously-logged target paths inside tool_input.
// Bounded: max depth 3, skips strings > 1KB (those are probably file
// contents, not references).
function flattenStrings(val, depth = 0, out = []) {
  if (depth > 3 || val == null) return out;
  if (typeof val === 'string') {
    if (val.length <= 1024) out.push(val);
  } else if (Array.isArray(val)) {
    for (const v of val) flattenStrings(v, depth + 1, out);
  } else if (typeof val === 'object') {
    for (const v of Object.values(val)) flattenStrings(v, depth + 1, out);
  }
  return out;
}

// Increment values per tool for markUsed scoring. Read/Glob/Grep are
// deliberately absent — their retrieval is already logged separately by
// logRetrieval, so re-referencing a file through another read shouldn't
// double-count. Edits are the strongest signal (the retrieval was
// actually used), Bash/Agent are one tier weaker.
const USAGE_INCREMENT = {
  Write: 2, Edit: 2, MultiEdit: 2,
  Bash: 1, Agent: 1,
};

// ── Main ────────────────────────────────────────────────────────────
readStdin((data) => {
  const sessionId = data.session_id || '';
  const toolName = data.tool_name || '';
  const toolInput = data.tool_input || {};
  const toolResponse = data.tool_response || {};
  const messages = [];

  ensureDir(paths.logs);
  ensureDir(paths.cache);

  const isExpensive = MATCH_EXPENSIVE.has(toolName);

  // ── 1. Tool Efficiency Tracking (expensive tools only) ─────────
  // Read/Glob/Grep are intentionally excluded here so the 100/200 warning
  // thresholds stay meaningful on exploration-heavy sessions.
  if (isExpensive) {
    const counterFile = path.join(paths.cache, `efficiency-${sessionId}.json`);
    const counters = readJsonSafe(counterFile, {
      session_id: sessionId,
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

  // ── 5. Action-Graph Logging + Reference Scanning ────────────────
  // Logs the retrieval for duplicate-read detection + (Tier 2) hot-set
  // survival. If the tool edits or runs things, also scans tool_input for
  // previously-logged target paths and bumps their used_count so priority
  // ranking reflects actual usage, not just retrieval frequency.
  // Fails open on any error — non-critical path.
  try {
    const actionGraph = require('./atlas-action-graph');
    actionGraph.logRetrieval(sessionId, toolName, toolInput, toolResponse);

    const inc = USAGE_INCREMENT[toolName];
    if (inc) {
      for (const val of flattenStrings(toolInput)) {
        actionGraph.markUsed(sessionId, val, inc);
      }
    }
  } catch (_) { /* fail-open */ }

  // ── 6. Subagent Stats Logging (Agent tool only) ─────────────────
  // Appends one line per Agent invocation to logs/subagent-stats.jsonl.
  // Parallels the action-graph stats rollup pattern. Fail-open.
  if (toolName === 'Agent') {
    try {
      const statsFile = path.join(paths.logs, 'subagent-stats.jsonl');
      const responseStr = typeof toolResponse === 'string'
        ? toolResponse
        : JSON.stringify(toolResponse || {});
      appendLine(statsFile, JSON.stringify({
        ts: new Date().toISOString(),
        session_id: sessionId,
        subagent_type: toolInput.subagent_type || 'general-purpose',
        description: (toolInput.description || '').slice(0, 100),
        prompt_len: (toolInput.prompt || '').length,
        response_bytes: responseStr.length,
        is_failure: isFailure,
      }));
      rotateIfLarge(statsFile);
    } catch (_) { /* fail-open */ }
  }

  // ── Emit collected messages ─────────────────────────────────────
  if (messages.length > 0) {
    injectContext(messages.join('\n\n'));
  }
});

// ── Failure detection ───────────────────────────────────────────────
// Exit codes that are normal for specific tools (not real failures):
//   Bash exit 2: grep/find/diff no-match — expected during exploration
//   Bash exit 1: test/grep single-file no-match — often exploratory
// These inflate the health dashboard and train users to ignore real failures.
const BENIGN_EXIT_CODES = { Bash: new Set([1, 2]) };

function detectFailure(toolName, toolResponse) {
  if (typeof toolResponse === 'object' && toolResponse !== null) {
    if (toolResponse.error) return true;
    const exitCode = parseInt(toolResponse.exitCode || toolResponse.exit_code || 0);
    if (exitCode !== 0) {
      // Skip benign exit codes for known tools
      if (BENIGN_EXIT_CODES[toolName]?.has(exitCode)) return false;
      return true;
    }
    const stderr = String(toolResponse.stderr || '');
    if (stderr && ERROR_INDICATORS.some(ind => stderr.includes(ind))) return true;
  } else if (typeof toolResponse === 'string' && ERROR_INDICATORS.some(ind => toolResponse.includes(ind))) {
    return true;
  }

  // Note: stdout/output is NOT scanned for error keywords — successful commands
  // routinely contain words like "error" (e.g., "error handling improved").
  // The checks above (explicit error, non-zero exit, stderr) are sufficient.
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

  // Track cumulative tool call counts (write every call — file is small, ~1KB)
  const countsPath = path.join(paths.logs, 'tool-call-counts.json');
  const counts = readJsonSafe(countsPath, {});
  counts[toolName] = (counts[toolName] || 0) + 1;
  writeJsonSafe(countsPath, counts);
}

// ── Context usage monitoring ────────────────────────────────────────
function checkContextUsage(sessionId, data, messages) {
  const metricsPath = path.join(paths.tmp, `claude-ctx-${sessionId}.json`);
  const metrics = readJsonSafe(metricsPath, null);
  if (!metrics) return;

  const now = Math.floor(Date.now() / 1000);

  if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
    messages.push(`CONTEXT MONITOR: Metrics stale (>${STALE_SECONDS}s old). Context usage unknown — statusline may not be running.`);
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
