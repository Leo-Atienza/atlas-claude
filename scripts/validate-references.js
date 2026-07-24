#!/usr/bin/env node
/**
 * validate-references.js
 *
 * Reference-integrity validator. Confirms that every script/hook a piece of
 * AUTOMATION points at actually exists on disk — the failure class the other
 * validators are structurally blind to. A renamed or deleted script silently
 * breaks a scheduled task, cleanup rule, or session-start step: the cron run
 * just fails (or no-ops) with nothing surfaced. This catches that at /health
 * time instead of in production.
 *
 * Scans the OPERATIONAL reference surfaces (where a path is executed, not just
 * documented):
 *   1. settings.json                    — hook command strings
 *   2. hooks/cleanup-config.json        — rule `check` / `script` targets (structured)
 *   3. scheduled-tasks/{*}/SKILL.md     — `node scripts/x.js` etc. the task runs
 *   4. hooks/session-start.sh + session-stop.sh — `$CLAUDE_DIR/...` invocations
 *   5. CLAUDE.md + REFERENCE.md          — the operator manuals the agent follows
 *
 * Conservative by design: only paths under hooks/ | scripts/ | commands/ ending
 * in .js/.py/.sh are resolved, and extraction rejects ".js"-inside-".json" and
 * mid-word "hooks/" (see extractFromText) — so prose, config filenames, and
 * examples never produce a false positive. Skills are intentionally NOT scanned
 * (they carry many illustrative commands).
 *
 * Exit 0 = every reference resolves. Exit 1 = broken reference(s). JSON to stdout.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// Normalize a raw captured path to an absolute path under ROOT, or null if it
// isn't a resolvable reference into an executable dir (hooks/scripts/commands).
function resolveRef(raw) {
  let s = String(raw).trim().replace(/^["'`]+|["'`]+$/g, '');
  s = s.replace(/[)\]}"',;]+$/, ''); // shed trailing punctuation a regex may grab
  // Map every known base spelling to a ROOT-relative path.
  s = s
    .replace(/^~\/\.claude\//, '')
    .replace(/^\$\{?HOME\}?\/\.claude\//, '')
    .replace(/^\$\{?CLAUDE_DIR\}?\//, '')
    .replace(/^[/]?[cC]:?\/Users\/<user>\/\.claude\//, '')
    .replace(/^\.\//, '');
  // Require the result to land in an executable dir and end in a script ext.
  const m = s.match(/(?:^|\/)((?:hooks|scripts|commands)\/[\w./-]+\.(?:js|py|sh))$/);
  if (!m) return null;
  return path.join(ROOT, m[1]);
}

// Extract candidate references from free text (settings, SKILL.md, .sh).
function extractFromText(text) {
  const out = new Set();
  // a) interpreter-prefixed invocations: node|python3|bash|sh|uv run <path>.
  //    Trailing (?![A-Za-z0-9]) stops the extension matching INSIDE a longer
  //    one — e.g. ".js" inside ".json" — which would otherwise truncate a
  //    real config path into a phantom script and false-flag it.
  const reExec = /(?:node|python3?|bash|sh|uv run)\s+["'`]?([^\s|&;"'`]+\.(?:js|py|sh))(?![A-Za-z0-9])/g;
  // b) explicitly-based paths, OR a bare hooks|scripts|commands/ path. The
  //    (?<![\w-]) before the bare form stops MID-WORD matches like the "hooks/"
  //    inside "cctools-safety-hooks/"; the trailing (?![A-Za-z0-9]) again guards
  //    against ".js"-in-".json". Both guards prevent false RED in system-doctor.
  const reBased =
    /["'`]?((?:(?<![\w-])(?:hooks|scripts|commands)\/|~\/\.claude\/|\$\{?HOME\}?\/\.claude\/|\$\{?CLAUDE_DIR\}?\/|[/]?[cC]:?\/Users\/<user>\/\.claude\/)[\w./-]+\.(?:js|py|sh))(?![A-Za-z0-9])/g;
  let m;
  while ((m = reExec.exec(text))) out.add(m[1]);
  while ((m = reBased.exec(text))) out.add(m[1]);
  return [...out];
}

function addRef(map, raw, source) {
  const resolved = resolveRef(raw);
  if (!resolved) return;
  if (!map.has(resolved)) map.set(resolved, { resolved, raw: raw.trim(), sources: new Set() });
  map.get(resolved).sources.add(source);
}

function listSkillFiles() {
  const dir = path.join(ROOT, 'scheduled-tasks');
  const out = [];
  let names;
  try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of names) {
    if (e.isDirectory()) {
      const f = path.join(dir, e.name, 'SKILL.md');
      if (fs.existsSync(f)) out.push(f);
    }
  }
  return out;
}

function main() {
  const refs = new Map(); // resolved -> { resolved, raw, sources:Set }

  // 1. settings.json (free-text scan of the whole file is fine — only exec-dir
  //    script paths survive resolveRef).
  for (const r of extractFromText(read(path.join(ROOT, 'settings.json')))) {
    addRef(refs, r, 'settings.json');
  }

  // 2. cleanup-config.json — structured: rule.check / rule.script are ROOT-relative.
  try {
    const cfg = JSON.parse(read(path.join(ROOT, 'hooks', 'cleanup-config.json')));
    for (const rule of cfg.rules || []) {
      for (const field of ['check', 'script']) {
        if (rule[field]) addRef(refs, rule[field], `cleanup-config.json:${rule.name || field}`);
      }
    }
  } catch { /* malformed config is the json-validator's concern, not ours */ }

  // 3. scheduled-tasks/{*}/SKILL.md
  for (const f of listSkillFiles()) {
    const rel = 'scheduled-tasks/' + path.basename(path.dirname(f)) + '/SKILL.md';
    for (const r of extractFromText(read(f))) addRef(refs, r, rel);
  }

  // 4. session-start.sh + session-stop.sh
  for (const sh of ['session-start.sh', 'session-stop.sh']) {
    for (const r of extractFromText(read(path.join(ROOT, 'hooks', sh)))) addRef(refs, r, `hooks/${sh}`);
  }

  // 5. operator manuals — CLAUDE.md + REFERENCE.md. The agent executes their
  //    instructions, so a path pointing at a renamed/deleted script silently
  //    misleads it. Safe to scan now that extraction rejects .json + mid-word.
  for (const doc of ['CLAUDE.md', 'REFERENCE.md']) {
    for (const r of extractFromText(read(path.join(ROOT, doc)))) addRef(refs, r, doc);
  }

  const all = [...refs.values()];
  const broken = all
    .filter((r) => !fs.existsSync(r.resolved))
    .map((r) => ({
      ref: r.raw,
      resolved: path.relative(ROOT, r.resolved).replace(/\\/g, '/'),
      sources: [...r.sources],
    }));

  const result = {
    ok: broken.length === 0,
    counts: { checked: all.length, broken: broken.length },
    broken,
    source: 'automation + manual surfaces (settings, cleanup-config, scheduled-tasks, session-*.sh, CLAUDE.md, REFERENCE.md)',
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) main();

// Pure functions exported for the validator self-test harness
// (scripts/test-validators.js), so the regex extraction can be regression-tested
// directly — this is exactly where the .json / mid-word false-positive bugs lived.
module.exports = { extractFromText, resolveRef };
