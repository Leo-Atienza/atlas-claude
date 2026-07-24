#!/usr/bin/env node
/**
 * validate-brain-coverage.js
 *
 * Capability-brain asset REACHABILITY validator. The other validators answer
 * "does every reference resolve?" (no ghosts). This answers the mirror question
 * the system was structurally blind to: "is every asset reachable?" — i.e. does
 * anything actually ROUTE to each page/reference/script a brain owns.
 *
 * The failure class: a page is written into a brain and nothing points at it.
 * Every validator stays green (it breaks no reference, it IS the reference), the
 * file is perfectly good, and it is never loaded during a build. The knowledge is
 * paid for and never spent. Found live on 2026-07-23 in web-dev: a scroll-scrub
 * video engine with runnable code, an asset-pipelines page, and a fresh react-bits
 * catalog were all unreachable from the skill surface that builds sites.
 *
 * SCOPE — capability brains only (a vault namespace paired with the skill that
 * consumes it). Generalized from web-dev to app-dev on 2026-07-23.
 *
 * Deliberately NOT applied to the knowledge namespaces (engineering, concept,
 * entity, source, synthesis, personal): those are reached by /recall semantic
 * search and by explicit enumeration in CLAUDE.md, NOT by link-routing. Demanding
 * an inbound link there would manufacture false orphans and force an allowlist so
 * long the check would rot into a no-op — the exact trap this validator exists to
 * avoid. Add a brain below only when a SKILL loads its pages by name.
 *
 * Auto-generated indices (_index.md, hot.md) are EXCLUDED as routing surfaces:
 * they list every sibling by construction, which would make every asset trivially
 * "reachable" and render the check meaningless.
 *
 * Matching is on `<basename>.<ext>` or `[[basename]]` — never the bare stem, so a
 * reference file named `craft.md` isn't counted reachable by the English word
 * "craft" appearing in prose.
 *
 * Reachability is TRANSITIVE to a fixpoint: an asset linked from an already-reachable
 * asset counts (that is how scrub-engine-template.html is reached, via its own .md).
 *
 * Exit 0 = every asset reachable (or intentionally allowlisted). Exit 1 = orphans.
 * Exit 0 + {skipped:true} when the vault is absent (graceful degradation).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const ROOT = path.join(HOME, '.claude');
const VAULT_ROOT = path.join(HOME, 'Documents', 'Wiki', 'wiki');

/**
 * The capability brains. Each pairs a vault namespace with the skill that loads it.
 * `allowlist` entries are assets deliberately not routed from the build surface —
 * keep each SHORT and justified; it is the escape hatch that would otherwise let
 * this check rot into a no-op.
 */
const BRAINS = [
  {
    id: 'web-dev',
    vault: 'web-dev',
    skill: 'impeccable',
    allowlist: {
      'cook-log.md': 'build journal — entered via the CLAUDE.md existing-site door, not a capability',
      'pending-design-brief-deltas.md': 'staging page for un-vetted deltas — routing it would inject unreviewed material into builds',
      'web-dev-system.md': 'the constitution that INVOKES the skill — outer layer, not loaded by it',
      '_index.md': 'auto-generated folder index',
    },
  },
  {
    id: 'app-dev',
    vault: 'app-dev',
    skill: 'tactile',
    allowlist: {
      'cook-log.md': 'build journal — the existing-app door, not a capability',
      'app-dev-system.md': 'the constitution that INVOKES the skill — outer layer, not loaded by it',
      '_index.md': 'auto-generated folder index',
    },
  },
];

// Files that list every sibling by construction — excluded as routing surfaces.
const INDEX_FILES = new Set(['_index.md', 'hot.md']);

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function listFiles(dir, rel = '') {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(abs, r));
    else out.push({ abs, rel: r, base: e.name });
  }
  return out;
}

/**
 * Does `text` route to `base` (a filename like "craft.md")? Accepts the filename
 * with extension, or the Obsidian wikilink form [[stem]]. Deliberately refuses to
 * match the bare stem, which produces false "reachable" on common words.
 */
function mentions(text, base) {
  if (text.includes(base)) return true;
  const stem = base.replace(/\.[^.]+$/, '');
  return new RegExp(`\\[\\[${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[|#\\]])`).test(text);
}

function collectAssets(brain) {
  const assets = [];
  const skillDir = path.join(ROOT, 'skills', brain.skill);
  for (const f of listFiles(path.join(VAULT_ROOT, brain.vault))) {
    if (/\.(md|js|html|css|ts)$/.test(f.base)) assets.push({ ...f, group: `wiki/${brain.vault}` });
  }
  for (const f of listFiles(path.join(skillDir, 'reference'))) {
    if (f.base.endsWith('.md')) assets.push({ ...f, group: `${brain.skill}/reference` });
  }
  for (const f of listFiles(path.join(skillDir, 'scripts'))) {
    if (f.base.endsWith('.mjs')) assets.push({ ...f, group: `${brain.skill}/scripts` });
  }
  return assets;
}

function collectSurfaces(brain) {
  const surfaces = [];
  const skillDir = path.join(ROOT, 'skills', brain.skill);
  const push = (abs) => {
    const text = read(abs);
    if (text) surfaces.push({ base: path.basename(abs), text });
  };
  push(path.join(skillDir, 'SKILL.md'));
  for (const f of listFiles(path.join(skillDir, 'reference'))) push(f.abs);
  for (const f of listFiles(path.join(VAULT_ROOT, brain.vault))) {
    if (f.base.endsWith('.md') && !INDEX_FILES.has(f.base)) push(f.abs);
  }
  push(path.join(ROOT, 'CLAUDE.md'));
  push(path.join(ROOT, 'REFERENCE.md'));
  for (const f of listFiles(path.join(ROOT, 'commands'))) {
    if (f.base.endsWith('.md')) push(f.abs);
  }
  return surfaces;
}

function auditBrain(brain) {
  const assets = collectAssets(brain);
  if (!assets.length) return { id: brain.id, skipped: true, reason: 'no assets found' };

  const surfaces = collectSurfaces(brain);

  // Seed: assets named by any routing surface that is not the asset itself.
  const reachable = new Set();
  for (const a of assets) {
    for (const s of surfaces) {
      if (s.base === a.base) continue; // a file never routes to itself
      if (mentions(s.text, a.base)) { reachable.add(a.base); break; }
    }
  }

  // Transitive closure: anything an already-reachable asset links to is reached.
  let grew = true;
  while (grew) {
    grew = false;
    for (const a of assets) {
      if (reachable.has(a.base)) continue;
      for (const r of assets) {
        if (!reachable.has(r.base) || r.base === a.base) continue;
        if (mentions(read(r.abs), a.base)) { reachable.add(a.base); grew = true; break; }
      }
    }
  }

  const unreachable = assets
    .filter((a) => !reachable.has(a.base) && !brain.allowlist[a.base])
    .map((a) => ({ asset: a.rel, group: a.group }));

  return {
    id: brain.id,
    skill: brain.skill,
    counts: {
      assets: assets.length,
      reachable: reachable.size,
      allowlisted: assets.filter((a) => brain.allowlist[a.base]).length,
      unreachable: unreachable.length,
      surfaces: surfaces.length,
    },
    unreachable,
    allowlist: brain.allowlist,
  };
}

function main() {
  if (!fs.existsSync(VAULT_ROOT)) {
    process.stdout.write(JSON.stringify({
      ok: true, skipped: true, reason: 'vault absent (Documents/Wiki/wiki not found)',
    }, null, 2) + '\n');
    process.exit(0);
  }

  const brains = BRAINS.map(auditBrain);
  const audited = brains.filter((b) => !b.skipped);
  const totals = audited.reduce((acc, b) => ({
    assets: acc.assets + b.counts.assets,
    unreachable: acc.unreachable + b.counts.unreachable,
    allowlisted: acc.allowlisted + b.counts.allowlisted,
  }), { assets: 0, unreachable: 0, allowlisted: 0 });

  const result = {
    ok: totals.unreachable === 0,
    counts: { ...totals, brains: audited.length },
    brains,
    source: 'capability brains (vault namespace + its skill) vs SKILL/reference/wiki/CLAUDE/commands surfaces',
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) main();

// Pure functions exported for the validator self-test harness (scripts/test-validators.js)
module.exports = { mentions };
