// Shared hook utilities — single source of truth for common operations.
// All hooks import from here instead of defining their own copies.

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── Standard paths ─────────────────────────────────────────────────
const HOOKS_DIR = __dirname;
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

const paths = {
  hooks: HOOKS_DIR,
  claude: CLAUDE_DIR,
  logs: path.join(CLAUDE_DIR, 'logs'),
  cache: path.join(CLAUDE_DIR, 'cache'),
  tmp: os.tmpdir(),
};

// ── Bootstrap: ensure critical directories exist at module load ────
// All hooks depend on logs/ and cache/ — create once here, not per-hook.
try { fs.mkdirSync(paths.logs, { recursive: true }); } catch (_) {}
try { fs.mkdirSync(paths.cache, { recursive: true }); } catch (_) {}

// ── Hook Profiles ──────────────────────────────────────────────────
// ATLAS_HOOK_PROFILE=minimal|medium|standard (default: standard)
// ATLAS_DISABLED_HOOKS=comma-separated hook identifiers to skip
//
// Profiles control which hooks fire:
//   minimal  — context-guard only (fastest, for trivial tasks)
//   medium   — all hooks EXCEPT tsc-check (skip TS compile overhead in hot loops)
//   standard — all current hooks (default behavior)
// Profile gates: Only JS hooks calling isHookEnabled() respect profiles.
// Bash/Python hooks (session-start/stop, precompact-reflect, auto-formatter,
// cctools-*, claudio) always run regardless of profile setting.
const ALL_HOOKS = ['context-guard', 'post-tool-monitor', 'tool-failure-handler', 'tsc-check', 'pre-commit-gate', 'session-start', 'session-stop', 'precompact-reflect', 'auto-formatter', 'statusline', 'cctools-bash', 'cctools-file-length', 'cctools-env-protection', 'claudio', 'atlas-action-graph', 'local-llm-pre-reader', 'path-validator', 'user-rejection-log', 'session-reminders', 'open-ended-scope-guard', 'preview-health-gate', 'system-detect', 'deletion-guard', 'archived-skill-offer', 'web-intent-router'];
const HOOK_PROFILES = {
  minimal: new Set(['context-guard']),
  medium: new Set(ALL_HOOKS.filter(h => h !== 'tsc-check')),
  standard: new Set(ALL_HOOKS),
};

function getActiveProfile() {
  return (process.env.ATLAS_HOOK_PROFILE || 'standard').toLowerCase();
}

function isHookEnabled(hookId) {
  const profile = getActiveProfile();
  const allowed = HOOK_PROFILES[profile] || HOOK_PROFILES.standard;
  if (!allowed.has(hookId)) return false;

  const disabled = (process.env.ATLAS_DISABLED_HOOKS || '').split(',').map(s => s.trim()).filter(Boolean);
  return !disabled.includes(hookId);
}

// ── Thresholds (cached) ────────────────────────────────────────────
let _thresholdsCache = null;

function loadThresholds() {
  if (!_thresholdsCache) {
    _thresholdsCache = JSON.parse(
      fs.readFileSync(path.join(HOOKS_DIR, 'context-thresholds.json'), 'utf8')
    );
  }
  return _thresholdsCache;
}

// ── File operations ────────────────────────────────────────────────
function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // Permission or disk errors — stderr is the last-resort channel
    process.stderr.write(`[ATLAS] ensureDir failed: ${dir} — ${err.code || err.message}\n`);
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJsonSafe(filePath, data, indent) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, indent));
  } catch (err) {
    // Fail-open: don't crash. Log to stderr (not to logs dir — avoids circular failure)
    process.stderr.write(`[ATLAS] writeJsonSafe failed: ${filePath} — ${err.code || err.message}\n`);
  }
}

function appendLine(filePath, line) {
  try {
    fs.appendFileSync(filePath, line + '\n');
  } catch (err) {
    process.stderr.write(`[ATLAS] appendLine failed: ${filePath} — ${err.code || err.message}\n`);
  }
}

function rotateIfLarge(filePath, maxBytes = 2_000_000) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > maxBytes) {
      fs.renameSync(filePath, filePath + '.bak');
    }
  } catch (err) {
    // Windows EBUSY (file locked) or permission errors — log and continue
    process.stderr.write(`[ATLAS] rotateIfLarge failed: ${filePath} — ${err.code || err.message}\n`);
  }
}

// ── Stdin reader ───────────────────────────────────────────────────
// All hooks read JSON from stdin. This helper collects it and parses.
// Captures hook_event_name so the output helpers below can emit the
// correct hookSpecificOutput envelope without every caller passing it.
let _hookEventName = null;
function readStdin(callback) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      _hookEventName = data.hook_event_name || null;
      callback(data);
    } catch (err) {
      // Fail open — never block on parse errors, but leave a trace for debugging
      process.stderr.write(`[ATLAS] readStdin JSON parse failed: ${err.message} (${input.length} bytes)\n`);
      process.exit(0);
    }
  });
}

// ── Output helpers ─────────────────────────────────────────────────
// v8.14.0 audit fix: both helpers previously emitted shapes the harness
// silently drops — blockTool nested `decision`/`reason` inside
// hookSpecificOutput (only `permissionDecision`/`permissionDecisionReason`
// are recognized there), and injectContext used a bare top-level
// {additionalContext} (unrecognized key). Every block/context message routed
// through them was a no-op. Shapes below match the current hooks reference.

// PreToolUse: deny a tool call
function blockTool(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: _hookEventName || 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

// Any context-capable event (PreToolUse, PostToolUse, PostToolUseFailure,
// UserPromptSubmit, SessionStart, Stop): inject context for the agent.
// Event name is taken from the stdin payload; optional 2nd arg overrides.
function injectContext(message, hookEventName) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: hookEventName || _hookEventName || 'PostToolUse',
      additionalContext: message,
    },
  }));
}

// ── Hook health + denial telemetry ─────────────────────────────────
// instrumentHook: call ONCE at the top of a JS hook. Registers a process-exit
// handler that appends a timing record to hook-health.jsonl — works no matter
// how the hook exits (process.exit() inside a stdin callback, or natural
// event-loop drain). This gives per-hook health for every instrumented hook,
// not just post-tool-monitor.
function instrumentHook(hookId) {
  const start = Date.now();
  process.on('exit', () => {
    try {
      fs.appendFileSync(
        path.join(paths.logs, 'hook-health.jsonl'),
        JSON.stringify({
          ts: new Date().toISOString(),
          hook: hookId,
          duration_ms: Date.now() - start,
          exit_code: process.exitCode || 0,
        }) + '\n'
      );
    } catch (_) { /* non-critical */ }
  });
}

// Auto-instrument: any hook that requires this module gets per-hook health
// timing emitted on exit, keyed by the entry script's basename — zero per-hook
// wiring. post-tool-monitor self-logs with richer per-tool data, so skip it.
(function autoInstrumentHook() {
  try {
    const entry = process.argv[1] || '';
    if (!entry) return;
    // `node -e '<script>' <arg>` puts the ARG in argv[1], not a script path —
    // that wrote junk hook names (session ids, file paths) into hook-health.jsonl.
    // Only instrument real .js entry scripts (v10.2 audit, 2026-07-24).
    if (!entry.endsWith('.js')) return;
    const hookId = path.basename(entry, '.js');
    if (hookId === 'post-tool-monitor' || hookId === 'lib') return;
    instrumentHook(hookId);
  } catch (_) { /* non-critical */ }
})();

// logDenial: record a permission denial to user-rejections.jsonl. Called by
// PreToolUse guard hooks at their block branch — captures denials that never
// reach the PostToolUseFailure path (because the tool never runs).
function logDenial(hookId, tool, reason) {
  appendLine(
    path.join(paths.logs, 'user-rejections.jsonl'),
    JSON.stringify({
      ts: new Date().toISOString(),
      tool: tool || '?',
      session: process.env.CLAUDE_SESSION_ID || null,
      signal: 'pre-hook-deny',
      hook: hookId,
      reason: String(reason || '').slice(0, 200),
    })
  );
}

module.exports = {
  paths,
  loadThresholds,
  ensureDir,
  readJsonSafe,
  writeJsonSafe,
  appendLine,
  rotateIfLarge,
  readStdin,
  blockTool,
  injectContext,
  getActiveProfile,
  isHookEnabled,
  HOOK_PROFILES,
  logDenial,
};
