#!/usr/bin/env node
/**
 * test-validators.js — regression tests for the validators themselves.
 *
 * "Who validates the validators?" system-doctor RUNS them against the live
 * system (hopefully clean), but never checks that their LOGIC is sound or that
 * they correctly DETECT problems. This session, validate-references shipped
 * green with two latent false-positive bugs (`.js` matched inside `.json`;
 * bare `hooks/` matched mid-word inside `cctools-safety-hooks/`) found only by
 * hand. A false-positive validator turns the whole green board into a lie —
 * so the integrity backbone deserves its own tests. This harness provides:
 *
 *   1. Unit tests for validate-references' extraction (extractFromText /
 *      resolveRef) — the regex-heavy logic where those bugs lived. Codifies
 *      the adversarial checks permanently so a future edit can't reintroduce them.
 *   2. Smoke test: spawn every validator in the shared manifest and assert the
 *      real contract — exits 0|1 (not a crash/2) and emits a parseable JSON
 *      object (the `ok` field is the convention 9/10 follow; `skill-counts`
 *      signals only via exit code, so `ok` is checked only when present).
 *      Catches syntax errors, output-shape regressions, and crashes.
 *
 * Zero dependencies. Exit 0 = all pass, 1 = failure(s). Run on demand
 * (`node scripts/test-validators.js`) and weekly by `weekly-validator-sweep`.
 */

'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');
const SCRIPTS = path.join(ROOT, 'scripts');

let pass = 0;
const fails = [];
function check(name, cond) {
  if (cond) pass++;
  else fails.push(name);
}

// ── 1. validate-references extraction logic ──────────────────────────
const { extractFromText, resolveRef } = require('./validate-references.js');
const has = (arr, sub) => arr.some((x) => x.includes(sub));

// Real references MUST be captured (across the spellings automation uses).
check('extract ~/.claude path', has(extractFromText('node ~/.claude/hooks/atlas-kg.js summary'), 'hooks/atlas-kg.js'));
check('extract $CLAUDE_DIR (quoted)', has(extractFromText('node "$CLAUDE_DIR/scripts/atlas-kg-vault-sync.js"'), 'scripts/atlas-kg-vault-sync.js'));
check('extract bare scripts/ (cd then node)', has(extractFromText('cd x && node scripts/wiki-ingest-pending.js --surface'), 'scripts/wiki-ingest-pending.js'));
check('extract deep python path', has(extractFromText('python3 ~/.claude/hooks/cctools-safety-hooks/read_env_protection_hook.py'), 'read_env_protection_hook.py'));
check('extract backtick scripts/', has(extractFromText('`scripts/observability.js`'), 'scripts/observability.js'));

// False positives that MUST be rejected (the bugs that shipped green by luck).
check('reject .js inside .json', extractFromText('see hooks/context-thresholds.json config').length === 0);
check('reject two .json configs', extractFromText('hooks/drift-thresholds.json and hooks/cleanup-config.json').length === 0);
check('reject mid-word hooks/', extractFromText('enforced by cctools-safety-hooks/bash_hook.py here').length === 0);

// resolveRef normalization + gating.
check('resolve ~/.claude -> ROOT', resolveRef('~/.claude/hooks/atlas-kg.js') === path.join(ROOT, 'hooks/atlas-kg.js'));
check('resolve $CLAUDE_DIR -> ROOT', resolveRef('$CLAUDE_DIR/scripts/system-doctor.js') === path.join(ROOT, 'scripts/system-doctor.js'));
check('resolve bare rel -> ROOT', resolveRef('scripts/system-doctor.js') === path.join(ROOT, 'scripts/system-doctor.js'));
check('resolve strips quotes', resolveRef('"$CLAUDE_DIR/scripts/x.js"') === path.join(ROOT, 'scripts/x.js'));
check('resolve non-exec dir -> null', resolveRef('cache/foo.js') === null);
check('resolve .json -> null', resolveRef('hooks/context-thresholds.json') === null);

// validate-brain-coverage `mentions`: the routing-detector. A false POSITIVE here
// is the dangerous direction — it marks an orphan "reachable" and the check silently
// rots into a no-op. Bare-stem matches must never count.
const { mentions } = require('./validate-brain-coverage.js');
check('mentions filename with ext', mentions('see reference/craft.md for the flow', 'craft.md'));
check('mentions wikilink form', mentions('routed via [[react-bits-catalog]] here', 'react-bits-catalog.md'));
check('mentions wikilink with alias', mentions('see [[craft|the craft flow]]', 'craft.md'));
check('mentions .mjs script', mentions('run scripts/web-preflight.mjs before presenting', 'web-preflight.mjs'));
check('reject bare stem in prose', !mentions('apply careful craft to the build', 'craft.md'));
check('reject unrelated text', !mentions('nothing routes here at all', 'asset-pipelines.md'));
check('regex-escapes dotted stems', !mentions('a b c', 'a.b.c.md'));

// web-intent-router `classify`: routes the user's two natural-language web doors. A false
// POSITIVE fires a signpost on ordinary system talk (pure noise); a false NEGATIVE
// loses the whole brain on a real build. Both directions are covered here.
const { classify: webIntent } = require('../hooks/web-intent-router.js');
check('web: new site', webIntent('create a website for my portfolio') === 'new');
check('web: new via indefinite article', webIntent('make me a website') === 'new');
check('web: existing via improve-verb', webIntent('upgrade this website') === 'existing');
check('web: existing via demonstrative', webIntent('make this website better') === 'existing');
check('web: veto system talk', webIntent('make sure the web-dev system is automatic') === null);
check('web: veto meta nouns', webIntent('improve the validator so it catches orphans') === null);
check('web: veto reading a site', webIntent('scan through this website and take what you can') === null);
check('web: silent on unrelated', webIntent('fix the build script') === null);

const unitFails = fails.length;

// ── 2. smoke-test every validator ────────────────────────────────────
const VALIDATORS = require('./lib/validators.js');
for (const v of VALIDATORS) {
  const r = spawnSync('node', [path.join(SCRIPTS, v.file), ...(v.args || [])], { encoding: 'utf8', timeout: 30000 });
  check(`smoke[${v.id}] exits 0|1 (no crash)`, r.status === 0 || r.status === 1);
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* parsed stays null */ }
  check(`smoke[${v.id}] emits a JSON object`, parsed !== null && typeof parsed === 'object');
  check(`smoke[${v.id}] ok is boolean when present`, parsed === null || !('ok' in parsed) || typeof parsed.ok === 'boolean');
}

// ── report ───────────────────────────────────────────────────────────
console.log(
  `validator self-test: ${pass} passed, ${fails.length} failed ` +
  `(${unitFails === 0 ? 'extraction OK' : unitFails + ' extraction fail(s)'}; ${VALIDATORS.length} validators smoke-tested)`
);
if (fails.length) {
  console.log('FAILURES:');
  for (const f of fails) console.log('  - ' + f);
}
process.exit(fails.length ? 1 : 0);
