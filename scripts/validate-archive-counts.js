#!/usr/bin/env node
/**
 * validate-archive-counts.js
 *
 * Symmetric counterpart to validate-skill-counts.js.
 *
 * Walks `skills/_archived/` filesystem and the wave-1 list inside
 * `skills/ARCHIVE-DIRECTORY.md`, then reports drift:
 *
 *   - dirs on disk with no row in the wave-1 list  (orphan dirs)
 *   - rows in the wave-1 list with no dir on disk  (broken refs)
 *
 * The "ARCHIVE-DIRECTORY rows" (~141 IDs in tables further up the
 * file) are bundle aliases — they don't map 1:1 to filesystem dirs
 * and are intentionally skipped here. Only the wave-1 list at the
 * bottom of the file reflects actual moved-to-_archived dirs.
 *
 * Exit 0 = clean. Exit 1 = drift. Stdout prints JSON.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const ARCHIVED_DIR = path.join(HOME, '.claude', 'skills', '_archived');
const ARCHIVE_DIR_FILE = path.join(HOME, '.claude', 'skills', 'ARCHIVE-DIRECTORY.md');

function listFsDirs() {
  if (!fs.existsSync(ARCHIVED_DIR)) return [];
  return fs.readdirSync(ARCHIVED_DIR)
    .filter(name => {
      const p = path.join(ARCHIVED_DIR, name);
      return fs.statSync(p).isDirectory();
    });
}

function extractWaveOneList(text) {
  // Look for the section "## Wave 1 bulk archive (2026-04-27)" and grab
  // the comma-separated list line (or lines) that follows.
  const headerIdx = text.indexOf('## Wave 1 bulk archive');
  if (headerIdx === -1) return [];
  const after = text.slice(headerIdx);
  // Find first non-empty line that looks like a comma-separated list of slugs
  const lines = after.split('\n');
  let listLine = null;
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('#') || l.startsWith('Active') || l.startsWith('>')) continue;
    if (l.startsWith('Per ') || l.startsWith('-') || l.startsWith('|')) continue;
    if (/^[a-z][\w-]*(\s*,\s*[a-z][\w-]*)+/.test(l)) { listLine = l; break; }
  }
  if (!listLine) return [];
  return listLine.split(',').map(s => s.trim()).filter(Boolean);
}

// Some _archived/ dirs predate the wave-1 list (legacy bundle: docx, pdf, pptx, xlsx,
// remotion, linkedin-poster, brand-guidelines, etc.). They're tracked by ID in the
// upper table (SK-001..SK-008, SK-052) instead of by slug in the wave-1 list.
// A dir is "documented" if its slug appears ANYWHERE in the doc text.
function dirIsDocumented(slug, docText) {
  // Match the slug as a whole word (table cell, comma-list item, etc.)
  const re = new RegExp(`(^|[\\s,|])${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}([\\s,|]|$)`, 'm');
  return re.test(docText);
}

function main() {
  if (!fs.existsSync(ARCHIVE_DIR_FILE)) {
    process.stderr.write(`missing: ${ARCHIVE_DIR_FILE}\n`);
    process.exit(2);
  }
  const text = fs.readFileSync(ARCHIVE_DIR_FILE, 'utf8');
  const fsDirs = new Set(listFsDirs());
  const docList = new Set(extractWaveOneList(text));

  // Orphan = on disk AND not referenced anywhere in the doc (not in wave-1 list, not in upper tables)
  const orphanDirs = [...fsDirs].filter(d => !dirIsDocumented(d, text));
  // Broken ref = in wave-1 list but not on disk (file system source of truth)
  const brokenRefs = [...docList].filter(d => !fsDirs.has(d));

  const result = {
    ok: orphanDirs.length === 0 && brokenRefs.length === 0,
    counts: { fs_dirs: fsDirs.size, doc_list: docList.size },
    orphan_dirs: orphanDirs,
    broken_refs: brokenRefs,
    sources: { fs: ARCHIVED_DIR, doc: ARCHIVE_DIR_FILE },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();
