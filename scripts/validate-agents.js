#!/usr/bin/env node
/**
 * validate-agents.js — fs ⇄ registry parity for the agents/ surface (v10 U4-2).
 *
 * agents/ was the last registry-less surface: every agents/**\/*.md loads into
 * every session's Agent roster, with no doc row and no validator (so the
 * Rails-heavy packs sat unnoticed for months). This closes it:
 *
 *   - every .md under agents/ (excl. README/_archived) must appear in
 *     agents/AGENTS.md            → otherwise UNREGISTERED
 *   - every path-like row in AGENTS.md "Active" table must exist on disk
 *     → otherwise GHOST
 *
 * Pattern-copied from validate-archive-counts.js (slug-in-doc matching).
 * Exit 0 = parity. Exit 1 = drift. Stdout prints JSON.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(os.homedir(), '.claude');
const AGENTS_DIR = path.join(ROOT, 'agents');
const REGISTRY = path.join(AGENTS_DIR, 'AGENTS.md');

function listAgentFiles() {
  const out = [];
  const walk = (dir, rel) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.name.startsWith('_')) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (e.name.endsWith('.md') && e.name !== 'AGENTS.md' && e.name.toLowerCase() !== 'readme.md') {
        out.push(r.slice(0, -3)); // path-slug without .md
      }
    }
  };
  walk(AGENTS_DIR, '');
  return out;
}

function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.log(JSON.stringify({ ok: false, error: 'agents/AGENTS.md missing' }));
    process.exit(1);
  }
  const doc = fs.readFileSync(REGISTRY, 'utf8').replace(/\r\n/g, '\n');
  const fsAgents = listAgentFiles();

  // Registered = the path-slug appears in the doc (whole segment match).
  const unregistered = fsAgents.filter(slug => !doc.includes(slug));

  // Ghost rows: "Active" table cells that look like path slugs but have no file.
  const activeSection = doc.split('## Archived')[0];
  const rowSlugs = [...activeSection.matchAll(/^\|\s*([\w/-]+\/[\w-]+)\s*\|/gm)].map(m => m[1]);
  const ghosts = rowSlugs.filter(slug => !fs.existsSync(path.join(AGENTS_DIR, `${slug}.md`)));

  const result = {
    ok: unregistered.length === 0 && ghosts.length === 0,
    counts: { fs_agents: fsAgents.length, active_rows: rowSlugs.length },
    unregistered,
    ghosts,
    sources: { fs: AGENTS_DIR, doc: REGISTRY },
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
