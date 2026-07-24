#!/usr/bin/env node
/**
 * user-rejection-log.js — captures user denials of tool calls.
 *
 * Why: the Claude Code Insights report (2026-05-13) flagged 8 "User Rejected"
 * events over 12 days. These are high-signal moments — the user disagreed with
 * Claude's proposed action — but the signal is currently lost (no log captures
 * them, no weekly review surfaces patterns).
 *
 * Where this fires: settings.json wires this into PostToolUseFailure (denials
 * surfacing as errors) and — once the 2026-06-09 wiring diff is applied — the
 * dedicated PermissionDenied + PermissionRequest events (added to Claude Code
 * in 2026; PermissionDenied fires on auto-mode-classifier denials, the highest-
 * signal rejection class, which never reaches PostToolUseFailure because the
 * tool never executes). For those two events the event itself is the signal —
 * no text matching needed. Non-rejection events pass silently.
 *
 * What gets logged: timestamp, tool name, brief input summary, denial reason
 * (the matched pattern), session id (truncated). Written to
 * `~/.claude/logs/user-rejections.jsonl`. Pattern recognition is intentionally
 * loose — false positives are cheap (one extra log line); false negatives lose
 * the learning signal.
 *
 * Closure: the monthly-evolution-report scheduled task reads this log to
 * propose CLAUDE.md updates when patterns recur (≥3 of the same denial).
 */

const fs = require('fs');
const path = require('path');
const { paths, ensureDir, appendLine, readStdin, rotateIfLarge, isHookEnabled } = require('./lib');

if (!isHookEnabled('user-rejection-log')) process.exit(0);

// Loose detection — any of these patterns indicates a user-driven denial.
// Tuned for Claude Code's various denial surface forms across versions.
const REJECTION_PATTERNS = [
  /user (rejected|denied|cancel(l)?ed|declined)/i,
  /tool (call )?was (rejected|denied|cancelled|blocked by user)/i,
  /permission denied by user/i,
  /operation (cancelled|denied) by (the )?user/i,
  /user did not approve/i,
  /user chose to deny/i,
  /denied by safety hook/i,  // cctools-safety-hooks blocking on user behalf
  /auto[- ]?mode classifier/i,  // Claude Code auto-mode permission classifier denial
];

readStdin((data) => {
  const tool = data?.tool_name || '';
  const sessionId = (data?.session_id || '').slice(0, 16);
  const input = data?.tool_input || {};
  const response = data?.tool_response || {};
  const eventName = data?.hook_event_name || '';
  const errorStr = typeof response.error === 'string'
    ? response.error
    : (typeof data.error === 'string' ? data.error : '');

  // Dedicated permission events (2026 harness): the event IS the signal.
  // PermissionDenied = auto-mode classifier denial (tool never ran).
  // PermissionRequest = a permission dialog was shown — logged as friction
  // signal ("ask"), not a denial; feeds allowlist tuning, not the denial loop.
  const isPermissionEvent = eventName === 'PermissionDenied' || eventName === 'PermissionRequest';

  // Structured-field signals (preferred when present — newer harness versions).
  const structured =
    eventName === 'PermissionDenied' ||
    response.userResponse === 'deny' ||
    response.user_response === 'deny' ||
    data.permission_decision === 'deny' ||
    data.permissionDecision === 'deny' ||
    response.cancelled === true ||
    response.canceled === true;

  // Pattern signal — fall back to text matching for older versions.
  let matchedPattern = null;
  for (const pat of REJECTION_PATTERNS) {
    if (pat.test(errorStr)) {
      matchedPattern = pat.source;
      break;
    }
  }

  if (!structured && !matchedPattern && !isPermissionEvent) {
    // Not a rejection — pass silently. tool-failure-handler.js handles real failures.
    process.exit(0);
  }

  // Log the event.
  ensureDir(paths.logs);
  const logPath = path.join(paths.logs, 'user-rejections.jsonl');
  appendLine(logPath, JSON.stringify({
    ts: new Date().toISOString(),
    tool,
    event: eventName || 'PostToolUse(Failure)',
    kind: eventName === 'PermissionRequest' ? 'ask' : 'deny',
    input_summary: JSON.stringify(input).slice(0, 300),
    session: sessionId,
    signal: isPermissionEvent ? 'event' : structured ? 'structured' : 'pattern',
    pattern: matchedPattern,
    error_excerpt: errorStr.slice(0, 200),
  }));
  rotateIfLarge(logPath);

  // PermissionRequest is friction telemetry only — the user hasn't decided yet,
  // so no behavioral guidance belongs in the conversation. Exit quietly.
  if (eventName === 'PermissionRequest') process.exit(0);

  // Inject guidance — Claude should not retry the rejected call without explicit
  // user direction. This mirrors the tool-failure-handler "circuit breaker"
  // rationale but for user choices rather than system errors.
  const guidance = [
    `USER REJECTED THIS TOOL CALL.`,
    `Tool: ${tool}`,
    `Do NOT retry the same call. The user chose to deny it for a reason.`,
    `Consider: (1) ask what they'd prefer instead, (2) propose an alternative approach, or (3) move on if the action wasn't critical.`,
  ].join(' ');

  // v8.14 audit: structured envelope (bare {additionalContext} is dropped by the
  // harness). PermissionDenied ignores hook stdout entirely per the hooks
  // reference — the guidance only lands on PostToolUseFailure, which is fine.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, additionalContext: guidance },
  }));
  process.exit(0);
});
