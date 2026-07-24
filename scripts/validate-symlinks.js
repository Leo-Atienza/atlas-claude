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
  const names = new Set();
  // Primary: the "## Linked Skills" comma-separated prose list (current SYMLINKS.md format).
  const section = text.match(/^## Linked Skills\s*\n([\s\S]*?)(?=\n## |$(?![\s\S]))/m);
  if (section) {
    for (const tok of section[1].split(/[,\n]/)) {
      const candidate = tok.trim();
      if (/^[a-z][a-z0-9-]+$/.test(candidate)) names.add(candidate);
    }
  }
  // Legacy fallback: `| <name> | ... |` table rows — only if the prose list yielded nothing.
  // (v8.14 audit: the file never matched this format, so the validator silently checked an
  // empty set and trivially passed — the names.size-on-Array bug masked the 0 as "?".)
  if (names.size === 0) {
    const ROW_RE = /^\|\s*([a-z][a-z0-9-]+)\s*\|/gm;
    let m;
    while ((m = ROW_RE.exec(text)) !== null) {
      const candidate = m[1].trim();
      if (/^(name|skill|target|path|source|description|notes|expo|skill-id)$/i.test(candidate)) continue;
      names.add(candidate);
    }
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

  // Honesty guard (KNOWLEDGE-144): SYMLINKS.md exists to list links — extracting zero
  // names means parser/format drift, not a clean system. Never trivially pass on ∅.
  const result = {
    ok: broken.length === 0 && names.length > 0,
    counts: { listed: names.length, broken: broken.length },
    broken,
    ...(names.length === 0 ? { reason: 'extracted 0 names from SYMLINKS.md — parser/format drift' } : {}),
    source: SYMLINKS_FILE,
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();
