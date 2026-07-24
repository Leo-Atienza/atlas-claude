#!/usr/bin/env node
/**
 * Consolidated PostToolUse monitor — six responsibilities:
 *   1. context-monitor    → context usage warnings + auto-continuation
 *   2. mistake-capture    → failure logging + pattern detection
 *   3. hook-health-logger → hook execution time logging
 *   4. tool-efficiency    → tool call counting + efficiency warnings
 *   5. action-graph       → retrieval tracking + reference scanner for usage scoring
 *   6. secret-exposure    → warn (once/session/class) when tool output contains
 *                           credential-shaped values (v10.2.1, from the 07-22 leak)
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

// ── Secret-exposure scan (v10.2.1) ──────────────────────────────────
// The 2026-07-22 session printed a live OAuth token + two client secrets into
// the transcript while inspecting .credentials.json. Transcripts are plaintext
// logs, so credential VALUES in tool output are an exposure. Patterns are
// written so their own source text can't match itself (an audit Reading this
// file must not trip the scanner). Scan is bounded (first 40KB) and warns at
// most once per session per class via the shared session-reminders state file
// (which already has a cleanup rule).
const SECRET_PATTERNS = [
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{16,}/],
  ['generic-sk-key', /\bsk-[A-Za-z0-9]{32,}\b/],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['aws-key-id', /\bAKIA[0-9A-Z]{16}\b/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/],
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['secret-assignment', /(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)["']?\s*[:=]\s*["'][A-Za-z0-9_./+-]{16,}["']/i],
];
const SECRET_SCAN_CAP = 40_000;

function scanForSecrets(toolName, toolResponse, sessionId, messages) {
  if (!sessionId) return;
  try {
    const raw = (typeof toolResponse === 'string' ? toolResponse : JSON.stringify(toolResponse || {}))
      .slice(0, SECRET_SCAN_CAP);
    if (raw.length < 20) return;
    const hits = SECRET_PATTERNS.filter(([, re]) => re.test(raw)).map(([cls]) => cls);
    if (!hits.length) return;

    const statePath = path.join(paths.cache, `session-reminders-${sessionId}.json`);
    const state = readJsonSafe(statePath, {});
    const fresh = hits.filter(cls => !state[`secret-warn-${cls}`]);
    if (!fresh.length) return;
    for (const cls of fresh) state[`secret-warn-${cls}`] = new Date().toISOString();
    writeJsonSafe(statePath, state);

    messages.push(
      `SECRET EXPOSURE WARNING: the last ${toolName} output contains what looks like a live credential (${fresh.join(', ')}). ` +
      `This transcript is stored as plaintext. Do not print secret values — inspect key names/lengths only and redact when quoting. ` +
      `If the value is real, tell the user now and recommend rotating it. (Warned once per session per credential class.)`
    );
  } catch (_) { /* fail-open — never block the monitor */ }
}

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

  // ── 2b. Secret-exposure scan ────────────────────────────────────
  scanForSecrets(toolName, toolResponse, sessionId, messages);

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

  // Unified 2026-06-09: content-level failures (this hook, PostToolUse) and
  // framework-level failures (tool-failure-handler.js, PostToolUseFailure)
  // share ONE log. The old separate 'failures.jsonl' never populated — Bash
  // exit 1/2 is filtered as benign and hard failures route to the other hook —
  // so /health and /analyze-mistakes were always reading an empty file.
  const failuresPath = path.join(paths.logs, 'tool-failures.jsonl');
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
    const recoveryHint = deriveRecoveryHint(toolName, errorText);
    messages.push(
      `RECURRING FAILURE (${patterns[fingerprint].count}x): ${toolName} — ${errorText.substring(0, 80)}... ` +
      `${recoveryHint ? `Recovery hint: ${recoveryHint} ` : ''}` +
      `Consider capturing this via /remember (routes a type:error entry to wiki/engineering/errors.md).`
    );
  }

  rotateIfLarge(failuresPath);
}

function deriveRecoveryHint(toolName, errorText) {
  const lower = String(errorText || '').toLowerCase();

  if (toolName === 'Bash' && /unexpected eof while looking for matching [`'"]|unterminated quoted string/i.test(errorText)) {
    return 'rebalance shell quotes and keep the command single-line.';
  }
  if (toolName === 'Bash' && /no such file or directory|enoent/i.test(lower)) {
    return 'verify cwd and path existence with ls before rerunning.';
  }
  if (toolName === 'Read' && /file does not exist/i.test(lower)) {
    return 'switch to an absolute path or correct the active working directory.';
  }
  if (toolName === 'Read' && /exceeds maximum allowed|maximum allowed tokens/i.test(lower)) {
    return 'use bounded reads (offset/limit) and process in chunks.';
  }
  if (/^mcp__Claude_(Browser|Preview)__/.test(toolName) && /timed out|stuck|unresponsive/i.test(lower)) {
    return 'perform one preview restart/log check cycle, then stop retry loops.';
  }
  return '';
}

// ── Success tracking ────────────────────────────────────────────────
function trackSuccess(toolName, sessionId) {
  // Reset failure streak on success. The global count/tools reset is the
  // circuit-breaker semantic (any success breaks the session streak); the
  // per-tool counters must survive — only the succeeding tool's own streak
  // resets, so tool A's success can't mask tool B's ongoing failures.
  if (sessionId) {
    const streakPath = path.join(paths.tmp, `claude-fail-streak-${sessionId}.json`);
    if (fs.existsSync(streakPath)) {
      const streak = readJsonSafe(streakPath, { count: 0, tools: [], perTool: {} });
      streak.count = 0;
      streak.tools = [];
      if (streak.perTool) streak.perTool[toolName] = 0;
      writeJsonSafe(streakPath, streak);
    }
  }

  // A success also breaks this tool's persistent streak in tool-health.json —
  // otherwise a tool that failed 3× long ago and recovered keeps
  // consecutive_streak ≥ 3 forever, which weekly-mcp-health reads as
  // "currently broken". Write only when there is a nonzero streak to clear.
  const healthPath = path.join(paths.logs, 'tool-health.json');
  const health = readJsonSafe(healthPath, null);
  if (health && health.tools && health.tools[toolName] && health.tools[toolName].consecutive_streak) {
    health.tools[toolName].consecutive_streak = 0;
    writeJsonSafe(healthPath, health);
  }

  // Track cumulative tool call counts (write every call — file is small, ~1KB).
  // _meta.since gives the cumulative counter a clock (v8.5) — the
  // mcp_server_unused drift channel needs to know how old the data is before
  // it can claim a server is unused.
  const countsPath = path.join(paths.logs, 'tool-call-counts.json');
  const counts = readJsonSafe(countsPath, {});
  if (!counts._meta || !counts._meta.since) counts._meta = { since: new Date().toISOString() };
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
