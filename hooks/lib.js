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
// ATLAS_HOOK_PROFILE=minimal|standard (default: standard)
// ATLAS_DISABLED_HOOKS=comma-separated hook identifiers to skip
//
// Profiles control which hooks fire:
//   minimal  — context-guard only (fastest, for trivial tasks)
//   standard — all current hooks (default behavior)
// Profile gates: Only JS hooks calling isHookEnabled() respect profiles.
// Bash/Python hooks (session-start/stop, precompact-reflect, auto-formatter,
// cctools-*, claudio) always run regardless of profile setting.
const ALL_HOOKS = ['context-guard', 'post-tool-monitor', 'tool-failure-handler', 'session-start', 'session-stop', 'precompact-reflect', 'auto-formatter', 'statusline', 'cctools-bash', 'cctools-file-length', 'cctools-env-protection', 'claudio'];
const HOOK_PROFILES = {
  minimal: new Set(['context-guard']),
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
function readStdin(callback) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    try {
      callback(JSON.parse(input));
    } catch (err) {
      // Fail open — never block on parse errors, but leave a trace for debugging
      process.stderr.write(`[ATLAS] readStdin JSON parse failed: ${err.message} (${input.length} bytes)\n`);
      process.exit(0);
    }
  });
}

// ── Output helpers ─────────────────────────────────────────────────
// PreToolUse: block a tool call
function blockTool(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      decision: 'block',
      reason,
    },
  }));
}

// PostToolUse / PostToolUseFailure: inject context for the agent
function injectContext(message) {
  process.stdout.write(JSON.stringify({ additionalContext: message }));
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
};
