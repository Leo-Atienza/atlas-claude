#!/usr/bin/env node
/**
 * web-project-context.js — SessionStart: ambient project-brain signpost (web + app).
 *
 * Why: the web-dev and app-dev systems' brains were opt-in — a session opened in
 * a project only got them if it happened to load a skill or recall fired. This
 * hook makes the brain AMBIENT: a ≤3-line SIGNPOST (never standing orders — the
 * brain routes, the task decides; see wiki feedback webdev-brain-routes-not-mandates).
 * v8.17 web branch; v8.18 (2026-07-05) added the app branch (Expo/RN -> app-dev brain).
 *
 * Detection: package.json in the session cwd. Pure Expo/React-Native (no
 * next/react-dom) -> app-dev signpost; web framework dep -> web-dev signpost.
 *
 * Contract: emits the SessionStart hookSpecificOutput envelope (KNOWLEDGE-162 —
 * bare additionalContext is silently dropped). Fail-open: any error -> exit 0,
 * no output. Cost: one package.json read, no network, <20ms.
 * ponytail: single-package detection — a monorepo root without framework deps
 * won't match; extend to workspace globs if that ever bites.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.resolve(__dirname, '..');
// Web frameworks (order = label preference). react-dom covers CRA/Vite/Remix-style react web apps.
const WEB_DEPS = ['next', 'astro', 'nuxt', '@remix-run/react', 'vue', 'svelte', '@angular/core', 'solid-js', 'react-dom', 'preact'];

function main() {
  let cwd = process.cwd();
  try {
    const stdin = fs.readFileSync(0, 'utf8');
    if (stdin && stdin.trim()) { const p = JSON.parse(stdin); if (p && p.cwd) cwd = p.cwd; }
  } catch { /* no/bad stdin — fall back to process.cwd() */ }

  if (path.resolve(cwd) === CLAUDE_DIR) return; // never fire inside ~/.claude itself

  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')); } catch { return; }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  // Pure mobile (Expo/RN without a web renderer) -> the app-dev brain (tactile system).
  if (('expo' in deps || 'react-native' in deps) && !('next' in deps) && !('react-dom' in deps)) {
    const base = 'expo' in deps ? 'expo' : 'react-native';
    const v = (String(deps[base] || '').match(/\d+[\w.-]*/) || ['?'])[0];
    const appCtx = [
      `APP PROJECT (${base}@${v}). The app-dev brain routes this task: <your-vault-path>/wiki/app-dev/ (capability-map.md = which tool when; stack.md = current SDK pins + the two store-submission mandates).`,
      'Building/beautifying mobile UI -> /tactile craft. Shipping to a store -> app-store-review (SK-135) preflight + ship-verify (SK-128).',
      'Scale to the task — a bugfix or small component needs none of this.',
    ].join('\n');
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: appCtx } }));
    return;
  }

  const hit = WEB_DEPS.find((d) => d in deps);
  if (!hit) return;

  const ver = (String(deps[hit] || '').match(/\d+[\w.-]*/) || ['?'])[0];
  // v8.17.1 (the user feedback): a signpost, not standing orders — the brain routes, the task decides.
  const ctx = [
    `WEB PROJECT (${hit}@${ver}). The web-dev brain routes this task: <your-vault-path>/wiki/web-dev/ (capability-map.md = which tool when; stack.md = current pins).`,
    'Building/beautifying UI -> /impeccable craft. Shipping a site/page -> web-preflight receipt (skills/impeccable/scripts/web-preflight.mjs). Default bar for sites: high-grade professional.',
    'Scale to the task — a bugfix or small component needs none of this.',
  ].join('\n');

  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
}

try { main(); } catch { /* fail-open */ }
process.exit(0);
