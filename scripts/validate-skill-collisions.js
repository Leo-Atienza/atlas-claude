#!/usr/bin/env node
/**
 * validate-skill-collisions.js
 *
 * Lints direct personal skills (skills/<name>/SKILL.md) for the failure modes
 * that silently break skill triggering.
 *
 * Frontmatter is read in one of three modes:
 *   'yaml'        — proper --- fence; name/description parsed and checked
 *   'h1-fallback' — no fence, but the first content line is an H1; the client
 *                   falls back to that heading for the catalog description.
 *                   Fine for slash-invoked skills (/audit, /handoff) → info,
 *                   not an error.
 *   'broken'      — no fence and no usable H1, so the client surfaces garbage
 *                   (e.g. an HTML comment "<!--"); the skill won't trigger.
 *
 * Reported as:
 *   1. Conformance (drift → exit 1):
 *        - 'broken' frontmatter, or 'yaml' with: missing name, name ≠ dir,
 *          name not [a-z0-9-]/≤64, missing description, description > 1024,
 *          or an HTML comment inside the fence.
 *   2. Routing collisions (advisory → never fails the build):
 *        - pairwise description token overlap (Jaccard ≥ THRESHOLD)
 *        - superset traps: a broad-scope description ("any / all / regardless")
 *          overlapping a more specific sibling → router coin-flips.
 *   3. Notes (info): skills using the H1 fallback.
 *
 * Collisions never auto-fail — similarity is a judgment call and shared
 * framework vocabulary (several "Next.js 16" skills) inflates the score. They
 * surface as review candidates, mirroring wiki-lint's "report, never fix".
 *
 * Scope: depth-2 direct skills only. Vendored bundles and symlinked ecosystem
 * skills are namespaced and out of scope for v1 — so a cross-set near-duplicate
 * like impeccable ⇄ the vendored frontend-design is NOT caught here; resolve
 * those by stating precedence in the description.
 *
 * Usage: node scripts/validate-skill-collisions.js [--human]
 *   (default output is JSON for the system-doctor runner)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const SKILLS_DIR = path.join(HOME, '.claude', 'skills');

const NAME_MAX = 64;
const DESC_MAX = 1024;
const JACCARD_THRESHOLD = 0.5;  // pair flagged as a potential routing collision

// Intentional, reviewed near-duplicate pairs — the same craft principles applied
// to deliberately different platforms. impeccable (web) and tactile (mobile) share
// design vocabulary by design; tactile's description states it supersedes
// mobile-app-design and loads impeccable's principles, so the overlap is wanted,
// not a routing bug. Suppressed so the advisory list shows only real signal.
// Key is the alphabetically-sorted "a|b" pair.
const ACCEPTED_PAIRS = new Set(['impeccable|tactile']);
const pairKey = (a, b) => [a, b].sort().join('|');
// Scope-claiming phrases that make a skill prone to swallowing more specific
// siblings (the superset trap). High-precision by design: bare "any code" or
// "any project" appear in innocent contexts ("before any code changes"), so we
// only match unambiguous scope claims. This is what would have flagged the old
// "...regardless of folder or project type" personal-style description.
const BROAD_PATTERN = /regardless of|applies to any|for any (code|project|task|file|language|input|deliverable)|works (on|with) any|no matter (the|what|which)/;

// Generic words + this author's name carry no routing signal and would
// otherwise couple unrelated skills (or every the user-* skill) together.
const STOPWORDS = new Set(
  `a an the of to for and or with use used using when whenever this that these those it
   its is are be on in into from as at by his her their the user claude code skill
   user asks ask write writes writing refactor extend create creates creating build
   builds building generate generates generating produce produces run runs review
   reviews via per across over only not also prefer instead first full any all`
    .split(/\s+/)
);

function listSkillDirs(dir) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return ents
    .filter(e => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();
}

/** Pragmatic frontmatter reader — not a full YAML parser, but it detects the
 *  malformations that actually break client-side triggering. */
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  const firstContent = lines.find(l => l.trim() !== '');
  const first = (firstContent || '').trim();

  if (first !== '---') {
    if (/^#\s+/.test(first)) {
      return { mode: 'h1-fallback', errors: [], fields: { description: first.replace(/^#\s+/, '') } };
    }
    return {
      mode: 'broken',
      errors: [`no frontmatter and no usable H1 — client shows "${first.slice(0, 12)}" as the description`],
      fields: {},
    };
  }

  const start = lines.indexOf(firstContent);
  const errors = [];
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { mode: 'yaml', errors: ['unterminated frontmatter (no closing ---)'], fields: {} };

  const fields = {};
  for (let i = start + 1; i < end; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;
    if (line.includes('<!--') || line.includes('-->')) {
      errors.push(`HTML comment inside frontmatter fence: "${line.slice(0, 40)}"`);
      continue;
    }
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (m && !(m[1] in fields)) {
      fields[m[1]] = m[2].replace(/^["']/, '').replace(/["']$/, '');
    }
  }
  return { mode: 'yaml', errors, fields };
}

function tokenize(desc) {
  return new Set(
    (desc || '')
      .toLowerCase()
      .replace(/[`*_()[\]{}.,:;!?"'/\\→—–-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// --- scan -------------------------------------------------------------------
const skills = [];
const conformance = [];
const notes = [];

for (const dir of listSkillDirs(SKILLS_DIR)) {
  const file = path.join(SKILLS_DIR, dir, 'SKILL.md');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

  const { mode, errors: fmErrors, fields } = parseFrontmatter(text);
  const errs = [...fmErrors];
  const desc = fields.description || '';

  if (mode === 'yaml') {
    const name = fields.name;
    if (!name) {
      errs.push('missing name');
    } else {
      if (name !== dir) errs.push(`name "${name}" ≠ directory "${dir}"`);
      if (name.length > NAME_MAX) errs.push(`name ${name.length} > ${NAME_MAX} chars`);
      if (!/^[a-z0-9-]+$/.test(name)) errs.push(`name not [a-z0-9-]: "${name}"`);
    }
    if (!desc) errs.push('missing description');
    else if (desc.length > DESC_MAX) errs.push(`description ${desc.length} > ${DESC_MAX} chars`);
  } else if (mode === 'h1-fallback') {
    notes.push({ skill: dir, note: 'no YAML frontmatter — H1 fallback (ok for slash-invoked skills)' });
  }

  if (errs.length) conformance.push({ skill: dir, errors: errs });

  const tokens = tokenize(desc);
  skills.push({ name: dir, tokens, broad: BROAD_PATTERN.test(desc.toLowerCase()) });
}

// --- collisions -------------------------------------------------------------
const collisions = [];
for (let i = 0; i < skills.length; i++) {
  for (let j = i + 1; j < skills.length; j++) {
    const sim = jaccard(skills[i].tokens, skills[j].tokens);
    if (sim >= JACCARD_THRESHOLD && !ACCEPTED_PAIRS.has(pairKey(skills[i].name, skills[j].name))) {
      collisions.push({
        a: skills[i].name,
        b: skills[j].name,
        similarity: Number(sim.toFixed(2)),
        kind: (skills[i].broad || skills[j].broad) ? 'superset-trap' : 'near-duplicate',
      });
    }
  }
}
collisions.sort((x, y) => y.similarity - x.similarity);

const broadScope = skills.filter(s => s.broad).map(s => s.name);

const result = {
  ok: conformance.length === 0,
  counts: {
    skills: skills.length,
    conformance_errors: conformance.length,
    collisions: collisions.length,
    broad_scope: broadScope.length,
    notes: notes.length,
  },
  conformance,
  collisions,
  broadScope,
  notes,
};

// --- output -----------------------------------------------------------------
if (process.argv.includes('--human')) {
  console.log(`Skill collision lint — ${skills.length} direct skills\n`);
  if (conformance.length) {
    console.log(`✗ Conformance errors (${conformance.length}) — these break triggering:`);
    for (const c of conformance) console.log(`  ${c.skill}: ${c.errors.join('; ')}`);
  } else {
    console.log('✓ Conformance: all pass (name=dir, ≤64, desc ≤1024, valid frontmatter)');
  }
  console.log('');
  if (collisions.length) {
    console.log(`⚠ Potential routing collisions (${collisions.length}, advisory — review, don't auto-fix):`);
    for (const c of collisions) {
      console.log(`  [${c.similarity}] ${c.kind.padEnd(14)} ${c.a}  ⇄  ${c.b}`);
    }
  } else {
    console.log('✓ No description pairs above similarity threshold.');
  }
  if (broadScope.length) {
    console.log(`\n⚠ Broad-scope descriptions (${broadScope.length}, superset-trap risk — may swallow specific siblings):`);
    console.log(`  ${broadScope.join(', ')}`);
  }
  if (notes.length) {
    console.log(`\nℹ Notes (${notes.length}):`);
    for (const n of notes) console.log(`  ${n.skill}: ${n.note}`);
  }
} else {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

process.exit(conformance.length ? 1 : 0);
