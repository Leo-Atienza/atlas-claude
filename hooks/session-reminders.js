#!/usr/bin/env node
/**
 * session-reminders.js — unified session-throttled reminder hook.
 *
 * Replaces (merged 2026-05-15):
 *   - build-ship-verify-reminder.js   → --reminder=build-ship-verify   (PostToolUse Bash)
 *   - ui-edit-design-check-reminder.js → --reminder=ui-edit-design-check (PreToolUse Write|Edit|MultiEdit)
 * Added v10.2 (2026-07-24 audit):
 *   - --reminder=doctrine-changelog (PostToolUse Write|Edit|MultiEdit) — edits to
 *     ~/.claude/ doctrine/system surfaces must land in SYSTEM_CHANGELOG.md +
 *     SYSTEM_VERSION.md the same session (the 07-23 revision skipped both and
 *     left the manifest 6 versions behind).
 *
 * Each reminder fires at most ONCE per session. State stored in a single
 * JSON file per session at `cache/session-reminders-<session_id>.json`,
 * keyed by reminder name → ISO timestamp. Previous per-reminder `.flag`
 * files are obsolete and will age out via cleanup-engine.
 *
 * Usage: `node session-reminders.js --reminder=<name>`
 *
 * Add a new reminder by appending an entry to REMINDERS below with:
 *   { eventType, detect(data), buildMessage() }
 * then wire it in settings.json (PostToolUse or PreToolUse with the right matcher).
 *
 * Fail-open: any error → silent exit 0. Disabled via `ATLAS_DISABLED_HOOKS=session-reminders`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, isHookEnabled, paths } = require('./lib');

function reminderArg() {
  const a = process.argv.find(x => x.startsWith('--reminder='));
  return a ? a.slice('--reminder='.length) : null;
}

const REMINDER = reminderArg();
if (!REMINDER) process.exit(0);
if (!isHookEnabled('session-reminders')) process.exit(0);

// ── Detection helpers ─────────────────────────────────────────────────

const BUILD_PATTERNS = [
  /\bflutter\s+build\b/i,
  /\bgradle(w)?\s+(build|bundle|assemble\w*|packageDebug|packageRelease)/i,
  /\bnpm\s+run\s+build\b/i,
  /\bpnpm\s+(run\s+)?build\b/i,
  /\b(bun|yarn)\s+(run\s+)?build\b/i,
  /\bnext\s+build\b/i,
  /\bvite\s+build\b/i,
  /\bturbo\s+(run\s+)?build\b/i,
  /\bvercel\s+(deploy|--prod)/i,
  /\bnetlify\s+deploy\b/i,
  /\bgh-pages\b/i,
  /\bnpm\s+publish\b/i,
  /\bgh\s+release\s+create\b/i,
  /\beas\s+(build|submit)\b/i,
  /\bxcodebuild\b/i,
];

function matchesBuildCommand(cmd) {
  return BUILD_PATTERNS.some(p => p.test(cmd));
}

const UI_FILE_PATTERNS = [
  /\.(tsx|jsx|vue|svelte|astro)$/i,
  /\.dart$/i,
  /\.swift$/i,
  /\.(kt|java)$/i,
  /[\\/]layouts?[\\/].*\.xml$/i,
];

const UI_DIR_PATTERNS = [
  /[\\/]screens?[\\/]/i,
  /[\\/]components?[\\/]/i,
  /[\\/]pages?[\\/]/i,
  /[\\/]widgets?[\\/]/i,
  /[\\/]views?[\\/]/i,
  /[\\/]app[\\/]\(.*\)[\\/]/i,
  /[\\/]ui[\\/]/i,
];

function isUiFile(filePath) {
  if (!filePath) return false;
  if (UI_FILE_PATTERNS.some(p => p.test(filePath))) return true;
  if (UI_DIR_PATTERNS.some(p => p.test(filePath)) &&
      /\.(js|ts|css|scss|html)$/i.test(filePath)) {
    return true;
  }
  return false;
}

// ── Reminder registry ─────────────────────────────────────────────────

const REMINDERS = {
  'build-ship-verify': {
    eventType: 'PostToolUse',
    detect: (data) => matchesBuildCommand(data?.tool_input?.command || ''),
    buildMessage: () => [
      'SHIP-VERIFY REMINDER: A build/deploy command just ran.',
      '',
      'Before declaring this artifact "shipped" / "deployed" / "done":',
      '  1. Invoke /ship-verify (SK-128) — or follow its checklist manually.',
      '  2. Verify the actual artifact exists at the expected path: `test -f <path>` + `ls -la <path>`.',
      '  3. Verify fresh mtime (last 5 minutes): `find <path> -mmin -5` should return the file.',
      '     Empty output = the build was a NO-OP (UP-TO-DATE lie). Re-run with --no-cache.',
      '  4. Verify the right variant (release vs debug) — distinguish explicitly.',
      '  5. For deploys: curl -sI the live URL, confirm HTTP 200, sha-match against local artifact.',
      '',
      'Never trust "Build successful" or exit-zero alone. The Insights report flagged this exact',
      'pattern multiple times (APK reported UP-TO-DATE despite missing file, wrong folder shipped).',
      '',
      'This reminder fires once per session. Skip steps that don\'t apply to your artifact type.',
    ].join('\n'),
  },

  'ui-edit-design-check': {
    eventType: 'PreToolUse',
    detect: (data) => isUiFile(data?.tool_input?.file_path || data?.tool_input?.path || ''),
    buildMessage: () => [
      'DESIGN-CHECK REMINDER: You are about to edit a UI file.',
      '',
      'If the user provided a design reference earlier this session',
      '(Stitch URL, Figma link, screenshot, mockup, dribbble link):',
      '  → STOP. Invoke /design-check (SK-127) BEFORE writing any code.',
      '    It captures the gap list as a numbered checklist and requires sign-off.',
      '',
      'If there is NO design reference, you can proceed — but:',
      '  → After implementing, use the browser preview (Claude Browser MCP) to screenshot the result.',
      '  → Compare the screenshot to what was requested. List any gaps explicitly.',
      '  → Never claim UI is done without visual verification.',
      '',
      'Why: Insights report flagged multiple sessions where UI was declared "done"',
      'but didn\'t match the design (cartoon icons vs blobs, tab-bar overlap, dark-mode',
      'breaks). Front-loading the diff prevents the rework cycle.',
      '',
      'This reminder fires once per session per UI file edit.',
    ].join('\n'),
  },

  'doctrine-changelog': {
    eventType: 'PostToolUse',
    detect: (data) => {
      const p = String(data?.tool_input?.file_path || '');
      // Global ATLAS doctrine + system-code surfaces only — never project files.
      return /[\\/]\.claude[\\/](CLAUDE\.md|settings(\.local)?\.json|(hooks|scripts|commands|systems|agents|config|skills)[\\/])/i.test(p);
    },
    buildMessage: () => [
      'DOCTRINE/SYSTEM EDIT: a file under ~/.claude/ (CLAUDE.md, settings, hooks/, scripts/, commands/, systems/, skills/, agents/, config/) was just modified.',
      '',
      'ATLAS change discipline — before this session ends:',
      '  1. Add a SYSTEM_CHANGELOG.md entry (what + why, under a version heading).',
      '  2. Doctrine-level change → bump `version:` + `last_updated:` in SYSTEM_VERSION.md.',
      '  3. If the rule also lives on sibling surfaces (CLAUDE.md / SYSTEM.md / wiki pages), sync them in the SAME session — partial propagation is how drift starts.',
      '',
      'Why: the 2026-07-23 revision updated six doctrine surfaces but skipped the changelog and version manifest; the 2026-07-24 audit found SYSTEM_VERSION.md six versions behind. Fires once per session.',
    ].join('\n'),
  },
};

const config = REMINDERS[REMINDER];
if (!config) process.exit(0);

// ── State (single JSON file per session, multi-key) ───────────────────

function statePath(sessionId) {
  return path.join(paths.cache, `session-reminders-${sessionId}.json`);
}

function loadState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(statePath(sessionId), 'utf8'));
  } catch (_) {
    return {};
  }
}

function markShown(sessionId, key) {
  const state = loadState(sessionId);
  state[key] = new Date().toISOString();
  try { fs.writeFileSync(statePath(sessionId), JSON.stringify(state)); } catch (_) { /* fail-open */ }
}

// ── Output ────────────────────────────────────────────────────────────

function emit(eventType, message) {
  // v8.14 audit: the non-PreToolUse branch used a bare {additionalContext}
  // envelope the harness drops — all events use hookSpecificOutput.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventType, additionalContext: message },
  }));
}

// ── Main ──────────────────────────────────────────────────────────────

readStdin((data) => {
  if (!config.detect(data)) process.exit(0);

  const sessionId = data?.session_id || '';
  if (!sessionId) process.exit(0);

  const state = loadState(sessionId);
  if (state[REMINDER]) process.exit(0);

  markShown(sessionId, REMINDER);
  emit(config.eventType, config.buildMessage());
});
