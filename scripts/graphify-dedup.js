#!/usr/bin/env node
/**
 * graphify-dedup.js — merge duplicate-label nodes in the graphify graph.
 *
 * graphify's chunked LLM extraction emits the SAME concept as several nodes
 * with different ids (e.g. "Agentic Patterns" as both `agentic_patterns` and
 * `concept_agentic_patterns`), often in different communities. ~25% of the
 * vault graph is these duplicates. They inflate `/graphify query` results and
 * double-count in the atlas-kg bridge layer (which matches by label).
 *
 * This is a DECOUPLED post-process on the OUTPUT (graphify-out/graph.json) —
 * robust to graphify package updates, unlike editing its pipeline. It runs as
 * the last step of weekly-graph-sync (after graphify regenerates the graph,
 * before atlas-kg-sync reads it), and standalone on demand.
 *
 * Scope: the DATA layer (graph.json) only — the consumers that matter (query +
 * bridges). The Obsidian viz artifacts (graph/graph.canvas, per-node notes,
 * graphify-out/graph.html) are graphify's to render and are left as-is; their
 * cosmetic duplicates can only be fixed upstream in graphify's extraction. The
 * json is the authoritative data layer; the canvas is a separate view.
 *
 * Merge rule: group nodes by normalized label; the canonical node is the one
 * whose id equals the label slug (else the shortest id). All links are
 * redirected to canonical ids, self-loops dropped, and links de-duped by
 * (source, target, relation). Zero deps. Fail-open. Idempotent.
 *
 * Usage:
 *   node scripts/graphify-dedup.js          # dedup graph.json in place
 *   node scripts/graphify-dedup.js --dry    # report the merge plan, write nothing
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || process.env.USERPROFILE;
const VAULT = process.env.ATLAS_VAULT || path.join(HOME, 'Documents', 'Wiki', 'wiki');
const GRAPH = process.argv.find((a) => a.endsWith('.json') && !a.startsWith('--')) ||
  path.join(VAULT, 'graphify-out', 'graph.json');

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function main() {
  const dry = process.argv.includes('--dry') || process.argv.includes('--dry-run');

  let g;
  try {
    g = JSON.parse(fs.readFileSync(GRAPH, 'utf8'));
  } catch (err) {
    console.error(`[graphify-dedup] cannot read ${GRAPH}: ${err.message}`);
    process.exit(0); // fail-open
  }
  const nodes = Array.isArray(g.nodes) ? g.nodes : [];
  const links = Array.isArray(g.links) ? g.links : (Array.isArray(g.edges) ? g.edges : []);
  const linkKey = g.links ? 'links' : (g.edges ? 'edges' : 'links');

  // Group by normalized label.
  const groups = new Map();
  for (const n of nodes) {
    const k = norm(n.label);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(n);
  }

  // Build id -> canonical-id map for duplicate groups.
  const idMap = new Map();
  const dropIds = new Set();
  let mergedGroups = 0;
  const plan = [];
  for (const [k, group] of groups) {
    if (group.length < 2) continue;
    mergedGroups++;
    const wantSlug = slug(group[0].label);
    let canonical = group.find((n) => n.id === wantSlug);
    if (!canonical) canonical = group.slice().sort((a, b) => String(a.id).length - String(b.id).length)[0];
    for (const n of group) {
      if (n.id !== canonical.id) { idMap.set(n.id, canonical.id); dropIds.add(n.id); }
    }
    plan.push(`  "${group[0].label}": keep ${canonical.id}, merge [${group.filter((n) => n.id !== canonical.id).map((n) => n.id).join(', ')}]`);
  }

  const map = (id) => (idMap.has(id) ? idMap.get(id) : id);

  // Redirect links, drop self-loops, dedupe by (source,target,relation).
  const seen = new Set();
  const newLinks = [];
  let droppedSelf = 0, droppedDup = 0;
  for (const l of links) {
    const out = { ...l };
    if ('source' in out) out.source = map(out.source);
    if ('target' in out) out.target = map(out.target);
    if ('_src' in out) out._src = map(out._src);
    if ('_tgt' in out) out._tgt = map(out._tgt);
    const s = out.source ?? out._src, t = out.target ?? out._tgt;
    if (s != null && t != null && s === t) { droppedSelf++; continue; }
    const key = `${s}|${t}|${out.relation || out.label || ''}`;
    if (seen.has(key)) { droppedDup++; continue; }
    seen.add(key);
    newLinks.push(out);
  }

  const newNodes = nodes.filter((n) => !dropIds.has(n.id));

  // Report.
  console.log(`graphify-dedup (${GRAPH})`);
  console.log(`  nodes: ${nodes.length} -> ${newNodes.length}  (merged ${dropIds.size} dup node(s) across ${mergedGroups} label-group(s))`);
  console.log(`  ${linkKey}: ${links.length} -> ${newLinks.length}  (dropped ${droppedSelf} self-loop(s), ${droppedDup} duplicate(s))`);
  if (dropIds.size === 0) { console.log('  already clean — nothing to do.'); return; }
  if (plan.length) { console.log('  merge plan:'); console.log(plan.slice(0, 12).join('\n')); if (plan.length > 12) console.log(`  ... (+${plan.length - 12} more groups)`); }

  if (dry) { console.log('  [dry-run] graph.json NOT modified.'); return; }

  g.nodes = newNodes;
  g[linkKey] = newLinks;
  try {
    const tmp = GRAPH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(g, null, 2));
    fs.renameSync(tmp, GRAPH);
    console.log(`  written: ${GRAPH}`);
  } catch (err) {
    console.error(`[graphify-dedup] write failed: ${err.message}`);
    process.exit(1);
  }
}

main();
