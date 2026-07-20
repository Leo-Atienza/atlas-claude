#!/usr/bin/env node
/**
 * validate-cross-listed-skills.js
 *
 * Verifies that no skill ID appears in BOTH skills/ACTIVE-DIRECTORY.md
 * AND skills/ARCHIVE-DIRECTORY.md. The intersection MUST be empty.
 *
 * A skill that is "active" cannot also be "archived" — duplicate
 * status creates routing ambiguity for the Skill tool and confuses
 * Claude during lookup.
 *
 * Exit 0 = clean, intersection is empty.
 * Exit 1 = drift found. Stdout prints JSON { intersection: [...], counts: {...} }.
 *
 * Wired into /system-doctor (Wave 5) and the weekly-validator-sweep
 * scheduled task. Surfaced as a drift-proposer channel.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(require('os').homedir(), '.claude', 'skills');
const ACTIVE_FILE = path.join(SKILLS_DIR, 'ACTIVE-DIRECTORY.md');
const ARCHIVE_FILE = path.join(SKILLS_DIR, 'ARCHIVE-DIRECTORY.md');

function extractIds(text) {
  // Match `| SK-NNN |` or `| FS-NNN |` etc — leftmost cell of a markdown table row
  const ids = new Set();
  const ROW_RE = /^\|\s*((?:SK|FS|CE|SC|DV|CP)-[\d–\-A-Za-z*]+)\s*\|/gm;
  let m;
  while ((m = ROW_RE.exec(text)) !== null) {
    ids.add(m[1].trim());
  }
  return ids;
}

function main() {
  if (!fs.existsSync(ACTIVE_FILE) || !fs.existsSync(ARCHIVE_FILE)) {
    process.stderr.write(`missing source: ${ACTIVE_FILE} or ${ARCHIVE_FILE}\n`);
    process.exit(2);
  }
  const activeText = fs.readFileSync(ACTIVE_FILE, 'utf8');
  const archiveText = fs.readFileSync(ARCHIVE_FILE, 'utf8');

  const activeIds = extractIds(activeText);
  const archiveIds = extractIds(archiveText);
  const intersection = [...activeIds].filter(id => archiveIds.has(id));

  const result = {
    ok: intersection.length === 0,
    intersection,
    counts: { active: activeIds.size, archive: archiveIds.size, conflicting: intersection.length },
    sources: { active: ACTIVE_FILE, archive: ARCHIVE_FILE },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();