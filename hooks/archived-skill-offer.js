#!/usr/bin/env node
/**
 * archived-skill-offer.js — SessionStart consumer for archived-skills-manifest.json
 * (v10 U3-8: the manifest existed with 60+ detection patterns but NO consumer —
 * its "_description" named a skill-watcher hook that was never built. This is
 * the minimal real consumer that makes aggressive archiving safe.)
 *
 * Checks the cwd against each archived skill's detect_files (literal paths and
 * simple prefixes only — bounded fs ops) and detect_packages (one package.json
 * read). On the first match, injects ONE advisory naming the archived skill and
 * its restore path. detect_keywords are prompt-time signals — not evaluated
 * here (documented limitation; the ARCHIVE-DIRECTORY router covers those).
 *
 * Throttle: at most one offer per cwd per 24h (cache/archived-offer-<slug>.json).
 * Fail-open: any error → silent exit 0. Disable: ATLAS_DISABLED_HOOKS=archived-skill-offer.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, injectContext, isHookEnabled, paths } = require('./lib');

if (!isHookEnabled('archived-skill-offer')) process.exit(0);

const MANIFEST = path.join(paths.claude, 'skills', 'archived-skills-manifest.json');
const MAX_FS_OPS = 120; // hard budget — SessionStart must stay fast

function cwdSlug(cwd) {
  return String(cwd).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 80);
}

readStdin((data) => {
  const cwd = data.cwd || process.cwd();
  // Never offer inside ~/.claude itself or the archive tree.
  if (/[\\/]\.claude([\\/]|$)/.test(cwd)) process.exit(0);

  const throttlePath = path.join(paths.cache, `archived-offer-${cwdSlug(cwd)}.json`);
  try {
    const t = JSON.parse(fs.readFileSync(throttlePath, 'utf8'));
    if (Date.now() - (t.ts || 0) < 24 * 3600 * 1000) process.exit(0);
  } catch (_) { /* no throttle yet */ }

  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (_) { process.exit(0); }
  const entries = Object.entries(manifest.skills || {});
  if (!entries.length) process.exit(0);

  // One package.json read for detect_packages matching.
  let deps = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    deps = new Set([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ]);
  } catch (_) { /* not a node project — fine */ }

  let ops = 0;
  const exists = (p) => {
    if (ops >= MAX_FS_OPS) return false;
    ops++;
    try { return fs.existsSync(path.join(cwd, p)); } catch (_) { return false; }
  };

  const matchEntry = ([id, e]) => {
    for (const pattern of e.detect_files || []) {
      if (ops >= MAX_FS_OPS) return null;
      if (!/[*?[\]]/.test(pattern)) {
        // literal path (file or dir)
        if (exists(pattern)) return `file ${pattern}`;
      } else {
        // bounded prefix support: "dir/**" → check dir; anything else skipped
        const m = pattern.match(/^([\w.@-]+(?:\/[\w.@-]+)*)\/\*\*$/);
        if (m && exists(m[1])) return `dir ${m[1]}/`;
      }
    }
    if (deps) {
      for (const p of e.detect_packages || []) {
        if (!/[*]/.test(p) && deps.has(p)) return `package ${p}`;
      }
    }
    return null;
  };

  for (const entry of entries) {
    const hit = matchEntry(entry);
    if (!hit) continue;
    const [id, e] = entry;
    try { fs.writeFileSync(throttlePath, JSON.stringify({ ts: Date.now(), id })); } catch (_) { /* fail-open */ }
    injectContext(
      `ARCHIVED SKILL MATCH: this repo matches ${hit} → archived skill "${e.name}" (${id}). ` +
      `If the task needs it, offer the user the restore: see skills/ARCHIVE-DIRECTORY.md (restore = mv skills/_archived/<dir> back` +
      `${e.restore_hint ? `; ${e.restore_hint}` : ''}). Never restore without asking.`
    );
    process.exit(0); // at most one offer
  }
  process.exit(0);
});
