#!/usr/bin/env node
/**
 * ATLAS v7.0 cleanup rule — keep last 20 failure timestamps per tool.
 * Extracted from session-start.sh §7a2.
 *
 * Usage: node prune-tool-health.js <CLAUDE_DIR> [--dry-run]
 * Emits JSON summary to stdout for cleanup-runner consumption.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = process.argv[2] || path.resolve(__dirname, '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const TH_FILE = path.join(CLAUDE_DIR, 'logs', 'tool-health.json');
const CAP = 20;

// Fossil aging (v10.3.0): a tool entry whose LAST failure is >90d old is a
// fossil — renamed/retired tools (e.g. mcp__Claude_Preview__*) otherwise sit
// in the file forever and weekly-mcp-health has to re-explain their frozen
// streaks every week. Successes reset streaks live (post-tool-monitor), so a
// 90d-quiet entry carries no signal worth keeping.
const FOSSIL_MS = 90 * 24 * 3600 * 1000;

try {
  const h = JSON.parse(fs.readFileSync(TH_FILE, 'utf8'));
  let pruned_tools = 0, pruned_entries = 0, dropped_fossils = 0;
  if (h.tools) {
    const now = Date.now();
    for (const [name, v] of Object.entries(h.tools)) {
      const last = Date.parse(v.last_failure || 0) || 0;
      if (last && now - last > FOSSIL_MS) {
        dropped_fossils++;
        if (!DRY_RUN) delete h.tools[name];
        continue;
      }
      if (Array.isArray(v.failures) && v.failures.length > CAP) {
        pruned_entries += v.failures.length - CAP;
        if (!DRY_RUN) v.failures = v.failures.slice(-CAP);
        pruned_tools++;
      }
    }
    if (!DRY_RUN) fs.writeFileSync(TH_FILE, JSON.stringify(h));
  }
  process.stdout.write(JSON.stringify({ pruned_tools, pruned_entries, dropped_fossils }));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
