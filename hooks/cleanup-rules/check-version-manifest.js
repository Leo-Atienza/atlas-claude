#!/usr/bin/env node
/**
 * ATLAS v7.0 cleanup rule — VERSION-MANIFEST staleness nag.
 * Extracted from session-start.sh §7a.
 *
 * Usage: node check-version-manifest.js <CLAUDE_DIR>
 * Prints nag text to stdout when any tool/skill-pack hasn't been checked in 14+ days.
 * Silent exit 0 otherwise. Never throws.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = process.argv[2] || path.resolve(__dirname, '..', '..');
const MANIFEST_FILE = path.join(CLAUDE_DIR, 'skills', 'VERSION-MANIFEST.json');
const CUTOFF_MS = Date.now() - 14 * 86_400_000;

try {
  const m = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  let stale = 0;
  const bins = [m.cli_tools || {}, m.skill_packs || {}];
  for (const bin of bins) {
    for (const v of Object.values(bin)) {
      if (new Date(v.last_checked || 0).getTime() < CUTOFF_MS) stale++;
    }
  }
  if (stale > 0) {
    process.stdout.write(`VERSION CHECK: ${stale} tool(s)/skill pack(s) haven't been checked in 14+ days. Run: node ~/.claude/scripts/health-validator.js --check versions`);
  }
} catch { /* fail-open */ }
