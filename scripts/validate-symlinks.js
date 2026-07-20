#!/usr/bin/env node
/**
 * validate-symlinks.js
 *
 * Verifies every symlink listed in skills/SYMLINKS.md actually
 * resolves to an existing target. Catches drift when ~/.agents/skills/
 * upstream changes without our SYMLINKS.md catching up.
 *
 * Reads the table inside SYMLINKS.md, extracts each `<name>` row,
 * and confirms `~/.claude/skills/<name>` is a symlink that points
 * to an existing path.
 *
 * Exit 0 = clean. Exit 1 = broken symlinks found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const SKILLS_DIR = path.join(HOME, '.claude', 'skills');
const SYMLINKS_FILE = path.join(SKILLS_DIR, 'SYMLINKS.md');

function extractSymlinkNames(text) {
  // Match table rows of form `| <name> | ... |` where name is a kebab-case slug
  const names = new Set();
  const ROW_RE = /^\|\s*([a-z][a-z0-9-]+)\s*\|/gm;
  let m;
  while ((m = ROW_RE.exec(text)) !== null) {
    const candidate = m[1].trim();
    // Skip table header words
    if (/^(name|skill|target|path|source|description|notes|expo|skill-id)$/i.test(candidate)) continue;
    names.add(candidate);
  }
  return [...names];
}

function checkSymlink(name) {
  const linkPath = path.join(SKILLS_DIR, name);
  let stat = null;
  try { stat = fs.lstatSync(linkPath); } catch { return { name, exists: false, reason: 'no-entry' }; }
  if (!stat.isSymbolicLink()) return { name, exists: true, isSymlink: false, reason: 'not-symlink' };
  let target;
  try { target = fs.readlinkSync(linkPath); } catch { return { name, exists: true, isSymlink: true, broken: true, reason: 'readlink-failed' }; }
  const absTarget = path.isAbsolute(target) ? target : path.resolve(SKILLS_DIR, target);
  const targetExists = fs.existsSync(absTarget);
  return { name, exists: true, isSymlink: true, target: absTarget, targetExists, broken: !targetExists };
}

function main() {
  if (!fs.existsSync(SYMLINKS_FILE)) {
    // SYMLINKS.md may not exist on systems without symlinked skills — soft-pass.
    process.stdout.write(JSON.stringify({ ok: true, skipped: true, reason: 'no SYMLINKS.md', source: SYMLINKS_FILE }, null, 2) + '\n');
    process.exit(0);
  }
  const text = fs.readFileSync(SYMLINKS_FILE, 'utf8');
  const names = extractSymlinkNames(text);
  const results = names.map(checkSymlink);
  const broken = results.filter(r => r.broken || !r.isSymlink || !r.exists);

  const result = {
    ok: broken.length === 0,
    counts: { listed: names.size, broken: broken.length },
    broken,
    source: SYMLINKS_FILE,
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();