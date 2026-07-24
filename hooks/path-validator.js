#!/usr/bin/env node
/**
 * path-validator.js — PreToolUse hook for Read.
 *
 * Two responsibilities (merged 2026-05-15 — absorbed wave-2-contamination-guard.js
 * to save one Node bootstrap per Read):
 *
 *   1. Blind-test contamination guard: blocks Read of `plans/_blind-tests/**`
 *      unless `BLIND_TEST_OPERATOR=1` (legacy `WAVE_2_OPERATOR=1` still works).
 *      Soft-warns when CWD is `~/.claude/` (operator infra repo) — that read is
 *      plausibly operator work so it's allowed, but flagged in case the session
 *      was meant to be the testee.
 *
 *   2. Path-not-found guidance: when the requested file doesn't exist, search
 *      for fuzzy matches by basename (bounded glob, 500-dir cap) and inject
 *      "Did you mean: …" advice. Lets the existing tool-failure-handler.js do
 *      the tracking; this just adds actionable guidance.
 *
 * Why split responsibilities into one hook:
 *   - Both fire on PreToolUse.Read. Separate Node processes cost ~30-50ms cold
 *     per Read. Merging cuts that in half.
 *
 * Order of checks inside the hook:
 *   - Contamination guard runs FIRST and is NOT gated by isHookEnabled — it's
 *     a safety mechanism that must hold even when the path-validator "feature"
 *     is toggled off (`ATLAS_DISABLED_HOOKS=path-validator`).
 *   - Operator-bypass falls through to path-not-found so a typo'd brief path
 *     still gets fuzzy-match guidance.
 *   - Path-not-found is feature-flagged via `isHookEnabled('path-validator')`.
 *
 * Bypass semantics (contamination guard):
 *   - `BLIND_TEST_OPERATOR=1` (or `WAVE_2_OPERATOR=1`) → operator bypass, falls through
 *   - CWD is `~/.claude/` → soft-warn via additionalContext, falls through
 *   - Otherwise → hard block via lib.js `blockTool()` (`permissionDecision: "deny"`)
 *
 * Performance budget: <500ms typical (one stat + bounded glob). Skips obvious
 * binary/cache paths (node_modules/, .git/, .next/, dist/, build/) and paths
 * >200 chars.
 *
 * Wired in settings.json:
 *   - hooks.PreToolUse[matcher=Read] → this script (timeout 5s)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { readStdin, isHookEnabled, blockTool, logDenial } = require('./lib');

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const GUARDED_PREFIX = '/plans/_blind-tests/';

const MAX_FUZZY_MATCHES = 3;
const MAX_PATH_LEN = 200;
const SKIP_SUBSTRINGS = ['node_modules/', '.git/', '/.next/', '/dist/', '/build/'];

// PreToolUse non-blocking context injection. (v8.14 note: this was always the
// correct envelope — the bare {additionalContext} shape other hooks used is
// unrecognized by the harness and was fixed system-wide in the v8.14 audit.)
function injectPreToolContext(message) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: message,
    },
  }));
}

// ── Contamination-guard helpers ───────────────────────────────────────

function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').toLowerCase();
}

function isUnderBlindTestDir(filePath) {
  return normalizePath(filePath).includes(GUARDED_PREFIX);
}

function isClaudeRepoCwd(cwd) {
  if (!cwd) return false;
  return normalizePath(cwd) === normalizePath(CLAUDE_DIR);
}

function isOperatorBypass() {
  return process.env.BLIND_TEST_OPERATOR === '1' || process.env.WAVE_2_OPERATOR === '1';
}

function buildBlockMessage(filePath) {
  return [
    `BLIND TEST CONTAMINATION GUARD: Reading`,
    `  ${filePath}`,
    `from chat would contaminate the blind test by revealing the measured behaviour`,
    `to the testee role.`,
    ``,
    `- If you are the OPERATOR who needs to read this brief: re-launch with`,
    `    BLIND_TEST_OPERATOR=1 claude`,
    `  (legacy WAVE_2_OPERATOR=1 still works for backward-compat)`,
    `  and reading will succeed.`,
    `- If you are the TESTEE: STOP. Tell the user the session is contaminated;`,
    `  the test runs from a separate fresh session at a non-Wiki CWD.`,
    `- If the user said "continue blind test" without specifying a role: ASK`,
    `  which role they want you in (operator-with-brief, or testee-without-brief)`,
    `  before any further action.`,
    ``,
    `See plans/_blind-tests/wave-2-canonical-blind-test.md Step 0 for the role`,
    `discipline. (The guard fires for sub-agents too — propagate the env var if`,
    `you spawn an Agent that needs to read the brief.)`,
  ].join('\n');
}

function buildSoftWarnMessage(filePath) {
  return [
    `BLIND TEST CONTAMINATION ADVISORY: Reading`,
    `  ${filePath}`,
    `in a session at ~/.claude/ is plausible operator work, so this read is`,
    `not blocked. But be aware: if this session was meant to be the test`,
    `session (testee role), reading the brief contaminates the measurement.`,
    `Set BLIND_TEST_OPERATOR=1 (or legacy WAVE_2_OPERATOR=1) to silence this warning.`,
  ].join('\n');
}

// ── Path-not-found helpers ────────────────────────────────────────────

function existsSync(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

// Bounded recursive search for files matching `basename` (case-insensitive).
// Caps total visited directories at 500 to keep p99 latency under budget.
function findFuzzyMatches(rootDir, basename) {
  const target = basename.toLowerCase();
  const matches = [];
  const visited = new Set();
  const queue = [rootDir];
  const VISIT_CAP = 500;

  const targetStem = target.replace(/\.[^.]*$/, '');

  while (queue.length && visited.size < VISIT_CAP) {
    const dir = queue.shift();
    if (visited.has(dir)) continue;
    visited.add(dir);

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
        if (['node_modules', 'dist', 'build', 'target', '.next', 'venv', '__pycache__'].includes(entry.name)) continue;
        queue.push(full);
      } else if (entry.isFile()) {
        const lname = entry.name.toLowerCase();
        const lstem = lname.replace(/\.[^.]*$/, '');
        if (lname === target || lstem === targetStem || lname.includes(targetStem)) {
          matches.push(full.replace(/\\/g, '/'));
          if (matches.length >= MAX_FUZZY_MATCHES * 2) return matches;
        }
      }
    }
  }

  matches.sort((a, b) => {
    const ba = path.basename(a).toLowerCase();
    const bb = path.basename(b).toLowerCase();
    const exactA = ba === target ? 0 : 1;
    const exactB = bb === target ? 0 : 1;
    if (exactA !== exactB) return exactA - exactB;
    return a.length - b.length;
  });

  return matches;
}

// ── Main ──────────────────────────────────────────────────────────────

readStdin((data) => {
  if (data?.tool_name !== 'Read') process.exit(0);

  const filePath = data?.tool_input?.file_path;
  if (!filePath || typeof filePath !== 'string') process.exit(0);

  // 1. Contamination guard — always runs, regardless of isHookEnabled
  if (isUnderBlindTestDir(filePath) && !isOperatorBypass()) {
    const cwd = data.cwd || process.cwd();
    if (isClaudeRepoCwd(cwd)) {
      injectPreToolContext(buildSoftWarnMessage(filePath));
      process.exit(0);
    }
    logDenial('path-validator', data.tool_name, `Blind-test contamination guard blocked: ${filePath}`);
    blockTool(buildBlockMessage(filePath));
    process.exit(0);
  }

  // 2. Path-not-found guidance — feature-flagged
  if (!isHookEnabled('path-validator')) process.exit(0);
  if (filePath.length > MAX_PATH_LEN) process.exit(0);
  if (SKIP_SUBSTRINGS.some(s => normalizePath(filePath).includes(s))) process.exit(0);
  if (existsSync(filePath)) process.exit(0);

  const basename = path.basename(filePath);
  const cwd = process.cwd();
  const matches = findFuzzyMatches(cwd, basename);

  let guidance;
  if (matches.length > 0) {
    const list = matches.slice(0, MAX_FUZZY_MATCHES).map(m => `  • ${m}`).join('\n');
    guidance = [
      `PATH NOT FOUND: ${filePath}`,
      `The Read will fail. ${matches.length} fuzzy match(es) for "${basename}" in ${cwd}:`,
      list,
      `Consider one of these instead. If none match, the file truly doesn't exist — check git history or verify the path before retrying.`,
    ].join('\n');
  } else {
    guidance = [
      `PATH NOT FOUND: ${filePath}`,
      `The Read will fail and no fuzzy matches were found in ${cwd}.`,
      `The file does not exist in this workspace. Verify the path (case-sensitive on Linux/Mac, case-insensitive on Windows), check git history (\`git log --all --follow -- <path>\`), or ask the user where to look. Do not retry with another guess.`,
    ].join('\n');
  }

  injectPreToolContext(guidance);
  process.exit(0);
});
