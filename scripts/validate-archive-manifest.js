#!/usr/bin/env node
/**
 * validate-archive-manifest.js
 *
 * For each detection pattern in skills/archived-skills-manifest.json,
 * verify the corresponding `_archived/<slug>/` dir actually exists.
 * Catches drift when the manifest references a skill that has been
 * fully removed (not just archived) or renamed.
 *
 * Manifest schema (current):
 *   { "skills": [{ "slug": "<name>", "patterns": [...], ...}, ...] }
 *
 * Exit 0 = clean. Exit 1 = manifest references missing dirs.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const SKILLS_DIR = path.join(HOME, '.claude', 'skills');
const MANIFEST = path.join(SKILLS_DIR, 'archived-skills-manifest.json');
const ARCHIVED_DIR = path.join(SKILLS_DIR, '_archived');

function main() {
  if (!fs.existsSync(MANIFEST)) {
    process.stdout.write(JSON.stringify({ ok: true, skipped: true, reason: 'no manifest', source: MANIFEST }, null, 2) + '\n');
    process.exit(0);
  }
  let raw;
  try { raw = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) {
    process.stderr.write(`manifest parse failed: ${e.message}\n`);
    process.exit(2);
  }
  const skills = Array.isArray(raw.skills) ? raw.skills :
                 Array.isArray(raw)        ? raw         : [];
  const missing = [];
  const checked = [];
  for (const s of skills) {
    const slug = s.slug || s.name || s.id;
    if (!slug) continue;
    const dir = path.join(ARCHIVED_DIR, slug);
    const exists = fs.existsSync(dir);
    checked.push({ slug, exists });
    if (!exists) missing.push(slug);
  }

  const result = {
    ok: missing.length === 0,
    counts: { manifest: skills.length, missing: missing.length },
    missing,
    source: MANIFEST,
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();