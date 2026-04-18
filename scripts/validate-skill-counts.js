#!/usr/bin/env node
/**
 * validate-skill-counts.js
 *
 * Cross-checks skill counts across the four source-of-truth files that are
 * supposed to agree. Exits non-zero if any two disagree. Invoked by /health.
 *
 * Sources checked (glob + regex):
 *   1. Filesystem  — count SKILL.md files under skills/ (depth ≤ 2)
 *   2. SYSTEM_VERSION.md  — "Skills (in ACTIVE-DIRECTORY)" row
 *   3. ARCHITECTURE.md    — "N active skill entries"
 *   4. ACTIVE-DIRECTORY.md — "Total active skills: **N**"
 *   5. REFERENCE.md        — "Active skill index (N skills:"
 *
 * Usage: node scripts/validate-skill-counts.js [--json]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const ROOT = path.join(HOME, '.claude');

function readOrEmpty(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function countSkillMd(dir) {
  let count = 0;
  function walk(d, depth) {
    if (depth > 2) return;
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.isFile() && e.name === 'SKILL.md') count++;
    }
  }
  walk(dir, 0);
  return count;
}

function firstMatch(s, re) {
  const m = s.match(re);
  return m ? Number(m[1]) : null;
}

const counts = {
  filesystem: countSkillMd(path.join(ROOT, 'skills')),
  system_version: firstMatch(
    readOrEmpty(path.join(ROOT, 'SYSTEM_VERSION.md')),
    /Skills \(in ACTIVE-DIRECTORY\)\s*\|\s*(\d+)/
  ),
  architecture: firstMatch(
    readOrEmpty(path.join(ROOT, 'ARCHITECTURE.md')),
    /\((\d+)\s+active skill entries/
  ),
  active_directory: firstMatch(
    readOrEmpty(path.join(ROOT, 'skills', 'ACTIVE-DIRECTORY.md')),
    /Total active skills:\s*\*\*(\d+)\*\*/
  ),
  reference: firstMatch(
    readOrEmpty(path.join(ROOT, 'REFERENCE.md')),
    /Active skill index\s*\((\d+)\s*skills:/
  ),
};

const json = process.argv.includes('--json');
if (json) {
  process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
}

// "Active" (in ACTIVE-DIRECTORY) should agree across the three docs.
const activeSources = ['system_version', 'architecture', 'active_directory', 'reference'];
const values = activeSources
  .map(k => counts[k])
  .filter(v => typeof v === 'number');

const unique = [...new Set(values)];

if (!json) {
  console.log('Skill count validation:');
  console.log(`  filesystem (SKILL.md files, depth ≤ 2): ${counts.filesystem}`);
  console.log(`  SYSTEM_VERSION.md (ACTIVE-DIRECTORY):    ${counts.system_version ?? 'NOT FOUND'}`);
  console.log(`  ARCHITECTURE.md (active entries):        ${counts.architecture ?? 'NOT FOUND'}`);
  console.log(`  ACTIVE-DIRECTORY.md (total active):      ${counts.active_directory ?? 'NOT FOUND'}`);
  console.log(`  REFERENCE.md (key-files row):            ${counts.reference ?? 'NOT FOUND'}`);
}

if (unique.length > 1) {
  if (!json) {
    console.error(`\n✗ DRIFT DETECTED: active-skill counts disagree: ${unique.join(', ')}`);
    console.error('  Fix by editing the out-of-sync file(s) to match the authoritative value.');
  }
  process.exit(1);
}

if (unique.length === 0) {
  if (!json) console.error('\n✗ No active-skill counts found — sources may have changed format.');
  process.exit(2);
}

if (!json) console.log(`\n✓ All four sources agree: ${unique[0]} active skills.`);
process.exit(0);
