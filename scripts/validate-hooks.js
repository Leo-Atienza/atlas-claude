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

function gatherCorpus() {
  const settings = readIfExists(path.join(ROOT, 'settings.json'));
  const sessionStart = readIfExists(path.join(HOOKS_DIR, 'session-start.sh'));
  const sessionStop = readIfExists(path.join(HOOKS_DIR, 'session-stop.sh'));
  const corpus = [settings, sessionStart, sessionStop];

  // Walk hooks/, scripts/, commands/, scheduled-tasks/ for cross-references
  const SCAN_DIRS = [HOOKS_DIR, path.join(ROOT, 'scripts'), path.join(ROOT, 'commands'), path.join(ROOT, 'scheduled-tasks')];
  for (const d of SCAN_DIRS) {
    walkAndAppend(d, corpus);
  }
  return corpus.join('\n');
}

function walkAndAppend(dir, corpus) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAndAppend(full, corpus);
    else if (entry.isFile() && /\.(js|sh|md|json)$/.test(entry.name)) {
      corpus.push(readIfExists(full));
    }
  }
}

function main() {
  const hooks = listJsFiles(HOOKS_DIR);
  const corpus = gatherCorpus();
  const orphans = [];
  for (const hookPath of hooks) {
    const base = path.basename(hookPath);
    // A hook is "live" if its basename appears in any other config/script/command
    if (!corpus.includes(base)) orphans.push(hookPath);
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