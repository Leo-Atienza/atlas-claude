#!/usr/bin/env node
// PreToolUse Context Guard + Security Gate — merged into single process.
//
// Behavior:
//   1. Security gate (Write/Edit/MultiEdit only):
//      - Blocks sensitive file paths (.env, credentials, keys, etc.)
//      - Blocks content containing secrets (AWS keys, API tokens, private keys, etc.)
//      - Logs bypass events when BYPASS_SAFETY_HOOKS=1
//   2. Context guard (all expensive tools):
//      - Context >= guard_block threshold: blocks expensive tools
//      - Always allows: Read, Glob, Grep, TodoWrite, ToolSearch, etc.

const fs = require('fs');
const path = require('path');
const {
  paths, loadThresholds, readJsonSafe, appendLine, readStdin, blockTool,
  isHookEnabled,
} = require('./lib');

// Hook profile gate — exit early if disabled by ATLAS_HOOK_PROFILE
if (!isHookEnabled('context-guard')) process.exit(0);

const thresholds = loadThresholds();
const GUARD_THRESHOLD = thresholds.thresholds.guard_block.remaining_pct;
const STALE_SECONDS = thresholds.stale_seconds;

// Tools that skip context guard (needed for saving state, reading context)
const ALWAYS_ALLOWED = new Set([
  'Read', 'Glob', 'Grep', 'TodoWrite', 'ToolSearch',
  'AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode',
]);

// Tools that get security gate checks
const SECURITY_CHECKED = new Set(['Write', 'Edit', 'MultiEdit']);

// ── Security Gate: Sensitive file path patterns ─────────────────────
const SENSITIVE_PATH_RE = /\.(env|env\..+)$|credentials|id_rsa|id_ed25519|\.pem$|\.key$|secret|\.keystore$|\.jks$|\.p12$|\.pfx$/i;

// ── Security Gate: Secret content patterns ──────────────────────────
const SECRET_CONTENT_RE = new RegExp([
  'AKIA[0-9A-Z]{16}',                                    // AWS access key
  'sk-[a-zA-Z0-9]{48}',                                  // OpenAI key
  'sk-ant-[a-zA-Z0-9-]{95}',                             // Anthropic key
  'ghp_[a-zA-Z0-9]{36}',                                 // GitHub PAT
  'gho_[a-zA-Z0-9]{36}',                                 // GitHub OAuth
  'github_pat_[a-zA-Z0-9_]{82}',                         // GitHub fine-grained PAT
  'xoxb-[0-9]{10,}-[a-zA-Z0-9-]+',                       // Slack bot token
  "password\\s*[:=]\\s*[\"'][^\"']{8,}",                  // Password assignments
  '(mongodb|postgres|mysql|redis)://[^:]+:[^@]+@',       // DB connection strings
  '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', // Private keys
  "(token|api_key|apikey|secret_key)\\s*[:=]\\s*[\"'][A-Za-z0-9+/=]{40,}", // Generic tokens
].join('|'), 'i');

// ── Helpers ─────────────────────────────────────────────────────────
function extractContent(toolInput) {
  let content = toolInput.content || toolInput.new_string || '';
  if (toolInput.operations && Array.isArray(toolInput.operations)) {
    content += toolInput.operations.map(o => o.new_string || '').join(' ');
  }
  return content;
}

function logBypass(sessionId, toolName) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'bypass',
    hook: 'security-gate',
    session: (sessionId || 'unknown').slice(0, 16),
    tool: toolName || 'unknown',
  });
  appendLine(path.join(paths.logs, 'security-bypass.jsonl'), entry);
}

function logBlock(toolName, remaining) {
  appendLine(
    path.join(paths.logs, 'context-guard.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), tool: toolName, remaining, action: 'blocked' })
  );
}

// ── Main ────────────────────────────────────────────────────────────
readStdin((data) => {
  const sessionId = data.session_id;
  const toolName = data.tool_name;
  const toolInput = data.tool_input || {};

  if (!sessionId || !toolName) {
    process.exit(0);
  }

  // ── 1. Security Gate (Write/Edit/MultiEdit only) ────────────────
  if (SECURITY_CHECKED.has(toolName)) {
    if (process.env.BYPASS_SAFETY_HOOKS === '1') {
      logBypass(sessionId, toolName);
    } else {
      const filePath = toolInput.file_path || '';
      if (filePath && SENSITIVE_PATH_RE.test(filePath)) {
        blockTool(`Sensitive file path detected: ${filePath}`);
        process.exit(0);
        return;
      }

      const content = extractContent(toolInput);
      if (content && SECRET_CONTENT_RE.test(content)) {
        blockTool('Potential secret detected in file content');
        process.exit(0);
        return;
      }
    }
  }

  // ── 2. Context Guard (all expensive tools) ──────────────────────
  if (ALWAYS_ALLOWED.has(toolName)) {
    process.exit(0);
  }

  const metricsPath = path.join(paths.tmp, `claude-ctx-${sessionId}.json`);
  const metrics = readJsonSafe(metricsPath, null);

  if (!metrics) {
    process.exit(0); // No metrics = fresh session, allow everything
  }

  const now = Math.floor(Date.now() / 1000);

  // Stale metrics — warn but don't block
  if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
    process.stdout.write(JSON.stringify({
      additionalContext: `CONTEXT GUARD: Metrics stale (>${STALE_SECONDS}s old). Context usage unknown. Last reading: ${metrics.remaining_percentage || '?'}% remaining.`,
    }));
    process.exit(0);
  }

  const remaining = metrics.remaining_percentage;

  if (remaining > GUARD_THRESHOLD) {
    process.exit(0); // Plenty of context left
  }

  // Context is critical — block expensive tools
  logBlock(toolName, remaining);
  blockTool(
    `CONTEXT GUARD: ${remaining}% context remaining (threshold: ${GUARD_THRESHOLD}%). ` +
    `Tool "${toolName}" blocked to prevent wasted tokens. ` +
    `SAVE STATE NOW: Write a handoff file, update todos, then inform the user. ` +
    `Allowed tools: ${[...ALWAYS_ALLOWED].join(', ')}.`
  );
});
