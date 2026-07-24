#!/usr/bin/env node
/**
 * validate-skill-counts.js
 *
 * Cross-checks skill counts across the four source-of-truth files that are
 * supposed to agree, AND reports a depth-aware filesystem breakdown so
 * bundle skills (fullstack-dev, compound-engineering, trailofbits-security)
 * at depth ≥ 3 don't disappear from the audit.
 *
 * Sources checked (glob + regex):
 *   1. Filesystem (depth ≤ 2)  — direct SKILL.md (legacy count, kept for back-compat)
 *   2. Filesystem (unlimited)  — every SKILL.md anywhere under skills/, attributed to its top-level dir
 *   3. SYSTEM_VERSION.md  — "Skills (in ACTIVE-DIRECTORY)" row
 *   4. ARCHITECTURE.md    — "N active skill entries"
 *   5. ACTIVE-DIRECTORY.md — "Total active skills: **N**"
 *   6. REFERENCE.md        — "Active skill index (N skills:"
 *   7. README.md          — three human-facing spots that all must agree:
 *                            "N Skills ·" (arch box), "the N active skills" (prose),
 *                            "N active skill entries" (dir-tree comment).
 *                            Added 2026-06-19: README isn't a surface the other tooling
 *                            updates, so its count had silently drifted (48 vs 52).
 *
 * Drift signal: exit non-zero when the DOC sources disagree — the four canonical
 * surfaces PLUS README's three mentions must all share one value. A README spot
 * whose regex no longer matches is also drift (it would otherwise drift silently).
 * Filesystem ≠ doc is informational (bundles are intentional).
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

// ── Registry reconciliation (added 2026-06-25) ──────────────────────────────
// This validator historically checked only that the active-skill *number* agrees
// across docs — never that real authored skills are actually represented in the
// registry. That blind spot silently lost track of satellite skills (real,
// invocable, used, but absent from ACTIVE-*.md). reconcileRegistry() closes it:
// every real (non-symlink) direct skill dir must appear by name in some
// ACTIVE-*.md, OR be listed in INTENTIONALLY_UNROWED with a reason. Symlinked
// ecosystem skills are out of scope (only a curated subset is rowed, by design).
// Heuristic: a distinctive dir-slug appearing NOWHERE in the registry text is
// genuine drift; coincidental substring matches only cause false-negatives (a
// miss), never a false red. The allowlist is the explicit, reviewable escape hatch.
const INTENTIONALLY_UNROWED = new Map([
  // v8.14.0: self-evolve promoted to SK-142 (rowed); canvas-design archived (redundant with anthropic-skills symlink) — both removed from this allowlist.
  // v8.20.0: SK-143 hyperframes bundle — these dirs are LIVE-MANAGED by the upstream CLI
  // (`npx hyperframes init` / `skills update` installs + refreshes them; local edits get overwritten).
  // Only the router `skills/hyperframes/` is rowed (SK-143). Domain skills install with the core set;
  // workflow names are pre-listed so future lazy installs stay green. See INSTALLED.md §v8.20.0.
  ...[
    'hyperframes-core', 'hyperframes-animation', 'hyperframes-keyframes', 'hyperframes-creative',
    'hyperframes-cli', 'hyperframes-registry', 'media-use', 'figma',
    'product-launch-video', 'website-to-video', 'faceless-explainer', 'pr-to-video',
    'embedded-captions', 'talking-head-recut', 'motion-graphics', 'music-to-video',
    'slideshow', 'general-video', 'remotion-to-hyperframes',
  ].map(n => [n, 'SK-143 hyperframes bundle — upstream-CLI-managed, deliberately unrowed (INSTALLED.md §v8.20.0)']),
]);

function reconcileRegistry(skillsDir) {
  let ents = [];
  try { ents = fs.readdirSync(skillsDir, { withFileTypes: true }); } catch {}
  const realDirs = [];
  for (const e of ents) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const full = path.join(skillsDir, e.name);
    let isLink = false;
    try { isLink = fs.lstatSync(full).isSymbolicLink(); } catch {}
    if (isLink) continue;                                       // ecosystem symlink — out of scope
    if (!fs.existsSync(path.join(full, 'SKILL.md'))) continue;
    realDirs.push(e.name);
  }
  let regFiles = [];
  try { regFiles = fs.readdirSync(skillsDir).filter(f => /^ACTIVE-.*\.md$/.test(f)); } catch {}
  const blob = regFiles.map(f => readOrEmpty(path.join(skillsDir, f))).join('\n');
  const unregistered = realDirs
    .filter(n => !blob.includes(n) && !INTENTIONALLY_UNROWED.has(n))
    .sort();
  return {
    real_direct: realDirs.length,
    registered: realDirs.filter(n => blob.includes(n)).length,
    intentionally_unrowed: [...INTENTIONALLY_UNROWED.keys()].filter(n => realDirs.includes(n)),
    unregistered,
  };
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

/**
 * Depth-unlimited walk. Returns { totals: { archive, bundle, direct, total },
 * by_top_level: { <dirname>: <count>, ... } }.
 *
 * Attribution rules:
 *   - skills/_archived/**\/SKILL.md  → archive
 *   - skills/<top>/SKILL.md          → direct
 *   - skills/<top>/**\/SKILL.md      → bundle (deeper than 2)
 */
function walkSkillMdUnlimited(skillsDir) {
  const byTopLevel = {};
  let archive = 0, bundle = 0, direct = 0;
  function walk(d, topLevel, depth) {
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        const newTop = topLevel || (depth === 0 ? e.name : null);
        walk(full, newTop, depth + 1);
      } else if (e.isFile() && e.name === 'SKILL.md') {
        const top = topLevel || 'root';
        byTopLevel[top] = (byTopLevel[top] || 0) + 1;
        if (top === '_archived') archive++;
        else if (depth >= 3) bundle++;
        else direct++;
      }
    }
  }
  walk(skillsDir, null, 0);
  const total = archive + bundle + direct;
  return { totals: { archive, bundle, direct, total }, by_top_level: byTopLevel };
}

function firstMatch(s, re) {
  const m = s.match(re);
  return m ? Number(m[1]) : null;
}

const SKILLS_DIR = path.join(ROOT, 'skills');
const filesystemUnlimited = walkSkillMdUnlimited(SKILLS_DIR);
const registryReconciliation = reconcileRegistry(SKILLS_DIR);
const README_TXT = readOrEmpty(path.join(ROOT, 'README.md'));

const counts = {
  filesystem: countSkillMd(SKILLS_DIR),                                // legacy depth ≤ 2
  filesystem_unlimited: filesystemUnlimited.totals,                    // depth-aware breakdown
  filesystem_by_top_level: filesystemUnlimited.by_top_level,           // per-bundle visibility
  registry_reconciliation: registryReconciliation,                     // on-disk identity vs ACTIVE-*.md (added 2026-06-25)
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
  // README.md carries the active count in three human-facing spots; all three
  // must match the canonical value (see header note — it silently drifted once).
  readme_box:   firstMatch(README_TXT, /\b(\d+)\s+Skills\s*·/),            // arch box:  "52 Skills · 74 Agents"
  readme_prose: firstMatch(README_TXT, /\bthe\s+(\d+)\s+active skills\b/),  // prose:     "the 52 active skills"
  readme_tree:  firstMatch(README_TXT, /\b(\d+)\s+active skill entries\b/), // dir-tree:  "52 active skill entries"
};

const json = process.argv.includes('--json');
if (json) {
  process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
}

// "Active" (in ACTIVE-DIRECTORY) should agree across the canonical docs AND
// README's three human-facing mentions.
const docSources = ['system_version', 'architecture', 'active_directory', 'reference'];
const readmeSources = ['readme_box', 'readme_prose', 'readme_tree'];
const activeSources = [...docSources, ...readmeSources];
const values = activeSources
  .map(k => counts[k])
  .filter(v => typeof v === 'number');

const unique = [...new Set(values)];

// README format-change guard: if the canonical docs parsed a value but a README
// spot's regex no longer matches, the count could silently drift again — so a
// missing README mention is treated as drift, not a tolerated null.
const docValue = docSources.map(k => counts[k]).find(v => typeof v === 'number');
const readmeMissing = typeof docValue === 'number'
  ? readmeSources.filter(k => typeof counts[k] !== 'number')
  : [];

if (!json) {
  console.log('Skill count validation:');
  console.log(`  filesystem (SKILL.md, depth ≤ 2):       ${counts.filesystem}`);
  const fu = counts.filesystem_unlimited;
  console.log(`  filesystem (depth-unlimited):           total=${fu.total}  direct=${fu.direct}  bundle=${fu.bundle}  archive=${fu.archive}`);
  // Surface bundles with notable size to make depth-3+ visible
  const bundleEntries = Object.entries(counts.filesystem_by_top_level)
    .filter(([k, v]) => v > 5 && k !== '_archived')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  if (bundleEntries.length) {
    console.log('  bundles (top 6 by SKILL.md count):');
    for (const [name, n] of bundleEntries) console.log(`    ${name.padEnd(28)} ${n}`);
  }
  console.log(`  SYSTEM_VERSION.md (ACTIVE-DIRECTORY):    ${counts.system_version ?? 'NOT FOUND'}`);
  console.log(`  ARCHITECTURE.md (active entries):        ${counts.architecture ?? 'NOT FOUND'}`);
  console.log(`  ACTIVE-DIRECTORY.md (total active):      ${counts.active_directory ?? 'NOT FOUND'}`);
  console.log(`  REFERENCE.md (key-files row):            ${counts.reference ?? 'NOT FOUND'}`);
  console.log(`  README.md (box / prose / tree):          ${counts.readme_box ?? 'NF'} / ${counts.readme_prose ?? 'NF'} / ${counts.readme_tree ?? 'NF'}`);
  const rr = counts.registry_reconciliation;
  console.log(`  registry reconciliation:                real=${rr.real_direct} registered=${rr.registered} allowlisted=${rr.intentionally_unrowed.length} unregistered=${rr.unregistered.length}`);
}

if (unique.length > 1) {
  if (!json) {
    console.error(`\n✗ DRIFT DETECTED: active-skill counts disagree: ${unique.join(', ')}`);
    const breakdown = activeSources
      .filter(k => typeof counts[k] === 'number')
      .map(k => `${k}=${counts[k]}`)
      .join(', ');
    console.error(`  Sources: ${breakdown}`);
    console.error('  Fix by editing the out-of-sync file(s) to match the authoritative value.');
  }
  process.exit(1);
}

if (unique.length === 0) {
  if (!json) console.error('\n✗ No active-skill counts found — sources may have changed format.');
  process.exit(2);
}

if (readmeMissing.length) {
  if (!json) {
    console.error(`\n✗ README.md count spot(s) not found: ${readmeMissing.join(', ')}`);
    console.error('  README is a validated count surface — its regex no longer matches (format changed?).');
    console.error('  Fix README.md or the pattern in this validator so the count stays checked.');
  }
  process.exit(1);
}

// Registry-reconciliation gate: a real authored skill dir that's absent from the
// registry AND not allowlisted is genuine drift (the satellite-skill failure
// mode). The INTENTIONALLY_UNROWED allowlist makes every false-positive eliminable
// by design, so gating here is safe.
if (counts.registry_reconciliation.unregistered.length) {
  if (!json) {
    const u = counts.registry_reconciliation.unregistered;
    console.error(`\n✗ REGISTRY DRIFT: ${u.length} real skill dir(s) absent from the registry (ACTIVE-*.md) and not allowlisted: ${u.join(', ')}`);
    console.error('  Fix: add the skill to ACTIVE-DIRECTORY.md / ACTIVE-PAGE-*.md, or add it to INTENTIONALLY_UNROWED in this validator with a reason.');
  }
  process.exit(1);
}

if (!json) console.log(`\n✓ All sources agree: ${unique[0]} active skills (4 canonical docs + README ×3); registry reconciliation clean.`);
process.exit(0);
