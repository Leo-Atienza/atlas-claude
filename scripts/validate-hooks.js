#!/usr/bin/env node
/**
 * validate-hooks.js
 *
 * For every `hooks/**\/*.js` file, confirm it is reachable from
 * either:
 *   1. `settings.json` `hooks` block (direct wiring), OR
 *   2. `hooks/session-start.sh` / `hooks/session-stop.sh` (indirect), OR
 *   3. another hook (`require()` reference inside hooks/), OR
 *   4. a slash-command file invoking it (`commands/**\/*.md`), OR
 *   5. a scheduled task (`scheduled-tasks/**\/SKILL.md` frontmatter), OR
 *   6. another script (`scripts/**\/*.js`).
 *
 * Hooks satisfying none of these are ORPHANED — the system spawns them
 * for nobody. They either need to be wired up or moved to scripts/ /
 * archived.
 *
 * lib*.js / *.test.js / *.bak files are excluded (helpers, tests, cruft).
 *
 * Self-reference blind spot (fixed 2026-06-09): the corpus used to include
 * every checked hook's own source, so a hook that named itself in a header
 * comment counted as "wired" — a project-specific ship-guard hook, whose
 * header literally said UNWIRED, passed. Checked hooks are now EXCLUDED from
 * the shared corpus; hook→hook references (case 3) are honored by testing
 * each hook's name against every OTHER hook's source explicitly. (That hook
 * is deliberately NOT named in matchable form here — this file is part of
 * the corpus, and naming it would re-wire it.)
 *
 * Exit 0 = clean. Exit 1 = orphans found. Stdout prints JSON.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');
const HOOKS_DIR = path.join(ROOT, 'hooks');

function listJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && !f.startsWith('lib') && !f.endsWith('.test.js') && !f.endsWith('.bak'))
    .map(f => path.join(dir, f));
}

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function gatherCorpus(excludeSet) {
  const settings = readIfExists(path.join(ROOT, 'settings.json'));
  const corpus = [settings];

  // Walk hooks/ (minus the checked hooks themselves — see header), scripts/,
  // commands/, scheduled-tasks/ for cross-references. session-start.sh /
  // session-stop.sh are .sh files in hooks/, so the walk picks them up.
  const SCAN_DIRS = [HOOKS_DIR, path.join(ROOT, 'scripts'), path.join(ROOT, 'commands'), path.join(ROOT, 'scheduled-tasks')];
  for (const d of SCAN_DIRS) {
    walkAndAppend(d, corpus, excludeSet);
  }
  return corpus.join('\n');
}

function walkAndAppend(dir, corpus, excludeSet) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_archived') || entry.name.startsWith('_retired')) continue; // archived content can't vouch for live hooks
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAndAppend(full, corpus, excludeSet);
    else if (entry.isFile() && /\.(js|sh|md|json)$/.test(entry.name)) {
      if (excludeSet && excludeSet.has(full)) continue;
      corpus.push(readIfExists(full));
    }
  }
}

function main() {
  const hooks = listJsFiles(HOOKS_DIR);
  const corpus = gatherCorpus(new Set(hooks));
  const hookTexts = new Map(hooks.map((h) => [h, readIfExists(h)]));
  const orphans = [];
  for (const hookPath of hooks) {
    const base = path.basename(hookPath);
    // A hook is "live" if its basename appears in any other config/script/command.
    // Word-boundary match (not a bare substring) so a hook whose name is a
    // SUBSTRING of another referenced name (e.g. "kg.js" inside "atlas-kg.js")
    // is not falsely counted as wired. Mirrors the validate-references.js hardening.
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?<![\\w-])' + esc + '(?![\\w])');
    let wired = re.test(corpus);
    if (!wired) {
      // Case 3: another hook references this one (each hook's own source is
      // excluded from the shared corpus, so test the others explicitly).
      for (const [other, text] of hookTexts) {
        if (other === hookPath) continue;
        if (re.test(text)) { wired = true; break; }
      }
    }
    if (!wired) orphans.push(hookPath);
  }

  const result = {
    ok: orphans.length === 0,
    counts: { hooks: hooks.length, orphans: orphans.length },
    orphans,
    source: HOOKS_DIR,
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();
