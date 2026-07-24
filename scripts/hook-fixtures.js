#!/usr/bin/env node
/**
 * hook-fixtures.js — standing regression check for hook emission contracts.
 * ==========================================================================
 * Born from KNOWLEDGE-162 (v8.14 audit): the harness parses hook stdout as
 * JSON and SILENTLY DROPS unrecognized keys — a wrong emission shape turns a
 * whole hook layer into no-ops with zero errors anywhere. The pre-v8.15 smoke
 * test grepped for loose words ("block|sensitive") that matched broken and
 * fixed shapes alike, so the regression class was invisible to it.
 *
 * This harness pipes canonical payloads through the DETERMINISTIC emitter
 * hooks and asserts the exact hookSpecificOutput envelope the current hooks
 * reference recognizes:
 *   PreToolUse deny:   {hookSpecificOutput:{hookEventName,permissionDecision:"deny",permissionDecisionReason}}
 *   context inject:    {hookSpecificOutput:{hookEventName,additionalContext}}
 * plus negative fixtures (non-matching input MUST stay silent — the opposite
 * regression is context spam), plus two static lints:
 *   - hooks/*.js non-comment lines with bare `additionalContext` / `decision:`
 *     outside a hookSpecificOutput envelope (the exact pre-v8.14 bug shapes;
 *     cctools *python* hooks use their own top-level protocol and are NOT scanned)
 *   - inline hook `command` strings in settings.json / .claude/settings.local.json
 *     that emit additionalContext without a hookSpecificOutput wrapper
 *     (the v8.14 sweep missed exactly this — found by the 8.14.1 triple-check).
 *
 * Stateful hooks (session-reminders, user-rejection-log, tsc-check) are not
 * fixtured — their output depends on session state / compiler presence; they
 * share lib.js injectContext, whose shape IS pinned here via pre-commit-gate.
 *
 * Runs: weekly via smoke-test.sh §11b; on CLI version change via
 * session-start.sh §2 (a harness update is when the contract could move);
 * manually after editing any emitter. Exit 0 = all pass. --summary = one line.
 * Fixture child procs run with CLAUDE_SESSION_ID=fixture so their telemetry
 * rows (hook-health / user-rejections) are identifiable as synthetic.
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
// ATLAS_FIXTURES_HOOKS_DIR: self-test override — point at a sabotaged COPY of
// hooks/ to prove the harness actually fails on the bug shapes (never sabotage
// live hooks). Used by the v8.15 adversarial verification.
const HOOKS_DIR = process.env.ATLAS_FIXTURES_HOOKS_DIR || path.join(CLAUDE_DIR, 'hooks');
const SUMMARY = process.argv.includes('--summary');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail: detail || '' });

function runHook(file, payload) {
  const env = {
    ...process.env,
    ATLAS_HOOK_PROFILE: 'standard',
    ATLAS_DISABLED_HOOKS: '',
    CLAUDE_SESSION_ID: 'fixture',
  };
  const r = spawnSync(process.execPath, [path.join(HOOKS_DIR, file)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env,
    timeout: 10000,
  });
  return { code: r.status, out: (r.stdout || '').trim() };
}

const envelope = (out) => {
  try { return JSON.parse(out).hookSpecificOutput || null; } catch { return null; }
};

// ── Runtime fixtures ─────────────────────────────────────────────────

// 1. context-guard: sensitive-path Write → exact deny envelope
{
  const r = runHook('context-guard.js', {
    hook_event_name: 'PreToolUse', session_id: 'fixture', tool_name: 'Write',
    tool_input: { file_path: '~/project/.env', content: 'X=1' },
  });
  const h = envelope(r.out);
  check('context-guard .env write → PreToolUse permissionDecision:deny + reason',
    !!h && h.hookEventName === 'PreToolUse' && h.permissionDecision === 'deny'
      && typeof h.permissionDecisionReason === 'string' && h.permissionDecisionReason.length > 0,
    r.out.slice(0, 100));
}

// 2. context-guard negative: benign Write → no deny
{
  const r = runHook('context-guard.js', {
    hook_event_name: 'PreToolUse', session_id: 'fixture', tool_name: 'Write',
    tool_input: { file_path: 'C:/tmp/fixture-benign.md', content: 'hello' },
  });
  const h = envelope(r.out);
  check('context-guard benign write → no deny emitted',
    r.code === 0 && (!h || h.permissionDecision !== 'deny'), r.out.slice(0, 100));
}

// 3. pre-commit-gate: git commit command → exact context envelope
{
  const r = runHook('pre-commit-gate.js', {
    hook_event_name: 'PreToolUse', session_id: 'fixture', tool_name: 'Bash',
    tool_input: { command: 'git commit -m test' },
  });
  const h = envelope(r.out);
  check('pre-commit-gate git commit → PreToolUse additionalContext',
    !!h && h.hookEventName === 'PreToolUse'
      && typeof h.additionalContext === 'string' && h.additionalContext.length > 0,
    r.out.slice(0, 100));
}

// 4. pre-commit-gate negative: non-commit command → silence
{
  const r = runHook('pre-commit-gate.js', {
    hook_event_name: 'PreToolUse', session_id: 'fixture', tool_name: 'Bash',
    tool_input: { command: 'echo hello world' },
  });
  check('pre-commit-gate non-commit command → silent', r.code === 0 && r.out === '', r.out.slice(0, 100));
}

// 5. open-ended-scope-guard: vague prompt → exact UserPromptSubmit envelope
{
  const r = runHook('open-ended-scope-guard.js', {
    hook_event_name: 'UserPromptSubmit', session_id: 'fixture',
    prompt: 'finish the app and wrap everything up',
  });
  const h = envelope(r.out);
  check('scope-guard open-ended prompt → UserPromptSubmit additionalContext',
    !!h && h.hookEventName === 'UserPromptSubmit'
      && typeof h.additionalContext === 'string' && h.additionalContext.length > 0,
    r.out.slice(0, 100));
}

// 6. open-ended-scope-guard negative: bounded prompt → silence
{
  const r = runHook('open-ended-scope-guard.js', {
    hook_event_name: 'UserPromptSubmit', session_id: 'fixture',
    prompt: 'fix the typo on line 3 of README.md',
  });
  check('scope-guard bounded prompt → silent', r.code === 0 && r.out === '', r.out.slice(0, 100));
}

// ── Static lint: hooks/*.js dropped shapes ───────────────────────────
{
  const offenders = [];
  for (const f of fs.readdirSync(HOOKS_DIR).filter((n) => n.endsWith('.js'))) {
    const lines = fs.readFileSync(path.join(HOOKS_DIR, f), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return; // comments OK
      if (/["']?additionalContext["']?\s*:/.test(line) && !/hookSpecificOutput/.test(line)) {
        // Envelope-style multi-line objects put additionalContext on its own line
        // UNDER a hookSpecificOutput wrapper — accept if the wrapper appears within
        // the 4 preceding non-empty lines; flag otherwise (the pre-v8.14 bare shape).
        const context = lines.slice(Math.max(0, i - 4), i).join('\n');
        if (!/hookSpecificOutput/.test(context)) offenders.push(`${f}:${i + 1} bare additionalContext`);
      }
      if (/^\s*decision\s*:\s*['"]/.test(line)) offenders.push(`${f}:${i + 1} nested decision: key`);
    });
  }
  check('hooks/*.js: no pre-v8.14 dropped shapes (bare additionalContext / decision:)',
    offenders.length === 0, offenders.slice(0, 3).join('; '));
}

// ── Static lint: inline settings.json hook commands ──────────────────
{
  const offenders = [];
  for (const file of [path.join(CLAUDE_DIR, 'settings.json'), path.join(CLAUDE_DIR, '.claude', 'settings.local.json')]) {
    let cfg;
    try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    for (const [event, groups] of Object.entries(cfg.hooks || {})) {
      for (const g of groups || []) {
        for (const h of g.hooks || []) {
          const cmd = h.command || '';
          if (/additionalContext/.test(cmd) && !/hookSpecificOutput/.test(cmd)) {
            offenders.push(`${path.basename(file)} ${event}(${g.matcher || '*'})`);
          }
        }
      }
    }
  }
  check('settings inline commands: additionalContext always inside hookSpecificOutput',
    offenders.length === 0, offenders.slice(0, 3).join('; '));
}

// ── Report ───────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
if (SUMMARY) {
  console.log(failed.length === 0
    ? `${results.length}/${results.length} emission-contract checks PASS`
    : `${results.length - failed.length}/${results.length} PASS — FAILING: ${failed.map((f) => f.name).join(' | ')}`);
} else {
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.ok || !r.detail ? '' : `\n      got: ${r.detail}`}`);
  }
  console.log(failed.length === 0 ? `\nALL ${results.length} CHECKS PASS` : `\n${failed.length} CHECK(S) FAILING`);
}
process.exit(failed.length === 0 ? 0 : 1);
