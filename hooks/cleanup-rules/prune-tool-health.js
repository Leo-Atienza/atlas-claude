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

try {
  const h = JSON.parse(fs.readFileSync(TH_FILE, 'utf8'));
  let pruned_tools = 0, pruned_entries = 0;
  if (h.tools) {
    for (const v of Object.values(h.tools)) {
      if (Array.isArray(v.failures) && v.failures.length > CAP) {
        pruned_entries += v.failures.length - CAP;
        if (!DRY_RUN) v.failures = v.failures.slice(-CAP);
        pruned_tools++;
      }
    }
    if (!DRY_RUN) fs.writeFileSync(TH_FILE, JSON.stringify(h));
  }
  process.stdout.write(JSON.stringify({ pruned_tools, pruned_entries }));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message }));
}
