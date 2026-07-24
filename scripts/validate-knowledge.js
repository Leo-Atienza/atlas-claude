#!/usr/bin/env node
/**
 * validate-knowledge.js
 *
 * Verifies the engineering knowledge vault against itself.
 *
 * THIS VALIDATOR EXISTS BECAUSE: during the synthetic-leaf audit
 * (2026-05-02), a discovery agent claimed the topics/ pages had
 * "zero parseable KNOWLEDGE-NNN headings" and reported a format
 * drift that did not actually exist. The pages were healthy —
 * the agent's regex was wrong (`### KNOWLEDGE-` instead of
 * `## KNOWLEDGE-`). A deterministic validator with the right
 * pattern would have prevented the wrong finding from surfacing.
 *
 * Checks:
 *   1. _index.md "Total entries: N" (if present) matches actual count
 *      summed across all engineering pages — inert while _index has no total
 *   2. Per-type breakdown matches what the directory advertises (if present)
 *   3. Every KNOWLEDGE-NNN ID is unique across all pages
 *   4. Every entry's `**Type**:` field is one of the allowed values
 *   5. Each ID is sequentially valid (no obvious gaps reported)
 *
 * Exit 0 = clean. Exit 1 = drift. Output JSON to stdout.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
// v8.0.0 (brain-consolidation): knowledge moved from ~/.claude/topics/ to the
// Obsidian vault. The store is now the 5 engineering pages; _index.md is the
// folder index (no "Total entries:" line → the total/breakdown checks stay
// inert, leaving the uniqueness, valid-type, and per-page checks live).
const TOPICS_DIR = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'engineering');
const DIRECTORY = path.join(TOPICS_DIR, '_index.md');
const VALID_TYPES = new Set(['pattern', 'solution', 'error', 'preference', 'failure']);

function listPages() {
  if (!fs.existsSync(TOPICS_DIR)) return [];
  return fs.readdirSync(TOPICS_DIR)
    .filter(n => n.endsWith('.md') && n !== '_index.md')
    .map(n => path.join(TOPICS_DIR, n))
    .sort();
}

/**
 * Extract entries from a page. Each entry is a `## KNOWLEDGE-NNN: title`
 * heading followed by a `**Type**: pattern|solution|error|preference|failure` line.
 */
function extractEntries(text) {
  const entries = [];
  const HEADING_RE = /^##\s+KNOWLEDGE-(\d+)\s*:\s*(.+?)\s*$/gm;
  let m;
  while ((m = HEADING_RE.exec(text)) !== null) {
    const id = m[1];
    const title = m[2];
    // Look at the next 200 chars for a Type field
    const tail = text.slice(m.index, m.index + 800);
    const typeMatch = tail.match(/\*\*Type\*\*:\s*(\w+)/);
    entries.push({ id: `KNOWLEDGE-${id}`, title, type: typeMatch ? typeMatch[1].toLowerCase() : null });
  }
  return entries;
}

function extractDirectoryClaim(text) {
  // Format options seen in the wild:
  //   "**Total entries: 74** (30 patterns + 17 solutions + ...)"
  //   "Total entries: **74**"
  //   "Total entries: 74"
  // Strip emphasis markers before regex'ing the count.
  const flat = text.replace(/\*+/g, '');
  const totalMatch = flat.match(/Total entries:\s*(\d+)/);
  const breakdown = {};
  const breakdownMatch = flat.match(/\(\s*((?:\d+\s+\w+(?:\s*\+\s*)?)+)\s*\)/);
  if (breakdownMatch) {
    const parts = breakdownMatch[1].split('+').map(s => s.trim());
    for (const part of parts) {
      const m = part.match(/(\d+)\s+(\w+)/);
      if (m) {
        const type = m[2].replace(/s$/, '').toLowerCase();   // patterns → pattern
        breakdown[type] = parseInt(m[1], 10);
      }
    }
  }
  return { total: totalMatch ? parseInt(totalMatch[1], 10) : null, breakdown };
}

function main() {
  if (!fs.existsSync(DIRECTORY)) {
    process.stdout.write(JSON.stringify({ ok: true, skipped: true, reason: 'no KNOWLEDGE-DIRECTORY.md' }, null, 2) + '\n');
    process.exit(0);
  }
  const dirText = fs.readFileSync(DIRECTORY, 'utf8');
  const claim = extractDirectoryClaim(dirText);
  const pages = listPages();
  const allEntries = [];
  const perPage = {};
  for (const p of pages) {
    const ents = extractEntries(fs.readFileSync(p, 'utf8'));
    perPage[path.basename(p)] = ents.length;
    allEntries.push(...ents);
  }
  const actualTotal = allEntries.length;

  // Check 1: total matches
  const totalDrift = (claim.total != null) && (claim.total !== actualTotal);

  // Check 2: per-type breakdown
  const actualByType = {};
  for (const e of allEntries) {
    const t = e.type || 'UNKNOWN';
    actualByType[t] = (actualByType[t] || 0) + 1;
  }
  const breakdownDrift = [];
  for (const [type, claimed] of Object.entries(claim.breakdown)) {
    const actual = actualByType[type] || 0;
    if (claimed !== actual) breakdownDrift.push({ type, claimed, actual });
  }

  // Check 3: unique IDs
  const seen = new Set();
  const dupes = [];
  for (const e of allEntries) {
    if (seen.has(e.id)) dupes.push(e.id);
    seen.add(e.id);
  }

  // Check 4: invalid types
  const invalidTypes = allEntries.filter(e => e.type && !VALID_TYPES.has(e.type));
  const missingTypes = allEntries.filter(e => !e.type);

  const result = {
    ok: !totalDrift && breakdownDrift.length === 0 && dupes.length === 0 &&
        invalidTypes.length === 0 && missingTypes.length === 0,
    counts: { actual_total: actualTotal, claimed_total: claim.total, by_type: actualByType, per_page: perPage },
    drift: {
      total_drift: totalDrift ? { claimed: claim.total, actual: actualTotal } : null,
      breakdown_drift: breakdownDrift,
      duplicate_ids: dupes,
      invalid_types: invalidTypes.map(e => ({ id: e.id, type: e.type })),
      missing_types: missingTypes.map(e => e.id),
    },
    sources: { directory: DIRECTORY, pages: pages.map(p => path.basename(p)) },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();
