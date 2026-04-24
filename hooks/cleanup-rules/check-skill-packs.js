#!/usr/bin/env node
/**
 * ATLAS v7.0 cleanup rule — plugin skill-pack freshness nag.
 * Extracted from session-start.sh §7k.
 *
 * Usage: node check-skill-packs.js <CLAUDE_DIR>
 * Prints nag text to stdout if plugin skill packs haven't been updated in 14+ days.
 * Silent exit 0 otherwise.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = process.argv[2] || path.resolve(__dirname, '..', '..');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins');
const CUTOFF_MS = Date.now() - 14 * 86_400_000;

function findStaleSkillDirs() {
  const stale = [];
  let plugins;
  try { plugins = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }); }
  catch { return stale; }
  for (const p of plugins) {
    if (!p.isDirectory()) continue;
    // Look for skills dirs at depth 2 or 3 (plugins/<plugin>/skills or plugins/<plugin>/<sub>/skills)
    const roots = [path.join(PLUGINS_DIR, p.name)];
    for (const root of roots) {
      let subs;
      try { subs = fs.readdirSync(root, { withFileTypes: true }); } catch { continue; }
      for (const s of subs) {
        if (!s.isDirectory()) continue;
        if (s.name === 'skills') {
          const full = path.join(root, s.name);
          try { if (fs.statSync(full).mtimeMs < CUTOFF_MS) stale.push(full); } catch {}
        } else {
          // depth-3 check
          const nested = path.join(root, s.name, 'skills');
          try { if (fs.statSync(nested).mtimeMs < CUTOFF_MS) stale.push(nested); } catch {}
        }
      }
    }
  }
  return stale.slice(0, 5);
}

const stale = findStaleSkillDirs();
if (stale.length > 0) {
  const lines = [`SKILL-PACK CHECK: ${stale.length} plugin skill pack(s) haven't been updated in 14+ days.`];
  for (const s of stale) lines.push('  ' + s);
  process.stdout.write(lines.join('\n'));
}
