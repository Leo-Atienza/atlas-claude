#!/usr/bin/env node
/**
 * deletion-guard.js — advisory PostToolUse guard for symbol deletions (F-13, v10).
 *
 * Fires on Edit|MultiEdit (not Write — no old-content diff there). If an edit's
 * old_string contains a symbol definition the new_string lacks (method,
 * function, toString, CSS class), injects a once-per-file-per-session advisory
 * pointing at the CLAUDE.md deletion protocol — the 2× JavaFX toString()
 * regression (insights 2026-07, facets 21adbe81/4d24238a) had zero
 * grep-visible call sites both times.
 *
 * Advisory only — never blocks. Fail-open: any error → silent exit 0.
 * Disable via ATLAS_DISABLED_HOOKS=deletion-guard.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, injectContext, isHookEnabled, paths } = require('./lib');

if (!isHookEnabled('deletion-guard')) process.exit(0);

// Definition-shaped patterns; each returns the symbol name for the advisory.
const DEF_PATTERNS = [
  { re: /\btoString\s*\(/g, name: () => 'toString()' },
  // Java/C# method signatures: public String toString( / private void doX(
  { re: /\b(?:public|private|protected)\s+(?:static\s+|final\s+)*[\w<>\[\], ]+?\s+(\w+)\s*\(/g, name: m => `${m[1]}()` },
  { re: /\bfunction\s+(\w+)/g, name: m => `${m[1]}()` },
  { re: /\bconst\s+(\w+)\s*=\s*(?:async\s*)?\(/g, name: m => `${m[1]}()` },
  // CSS class selectors: .kpi-value {
  { re: /\.([a-z][\w-]*)\s*\{/g, name: m => `.${m[1]}` },
];

function definedSymbols(text) {
  const out = new Set();
  if (!text) return out;
  for (const p of DEF_PATTERNS) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text)) !== null) out.add(p.name(m));
  }
  return out;
}

function removedSymbols(oldStr, newStr) {
  const before = definedSymbols(oldStr);
  if (!before.size) return [];
  const after = definedSymbols(newStr);
  return [...before].filter(s => !after.has(s));
}

readStdin((data) => {
  const sessionId = data.session_id || '';
  const input = data.tool_input || {};
  const filePath = input.file_path || '';
  if (!sessionId || !filePath) process.exit(0);

  // Edit: single old/new pair. MultiEdit: edits[].
  const pairs = Array.isArray(input.edits)
    ? input.edits.map(e => [e.old_string, e.new_string])
    : [[input.old_string, input.new_string]];

  const removed = new Set();
  for (const [o, n] of pairs) for (const s of removedSymbols(o || '', n || '')) removed.add(s);
  if (!removed.size) process.exit(0);

  // Once per file per session.
  const markerPath = path.join(paths.tmp, `claude-deletion-guard-${sessionId}.json`);
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(markerPath, 'utf8')); } catch (_) { /* first time */ }
  const key = filePath.toLowerCase();
  if (seen[key]) process.exit(0);
  seen[key] = new Date().toISOString();
  try { fs.writeFileSync(markerPath, JSON.stringify(seen)); } catch (_) { /* fail-open */ }

  const list = [...removed].slice(0, 5).join(', ');
  injectContext(
    `DELETION GUARD: this edit removes ${list}. Verify no downstream usages before moving on — ` +
    `grep the project AND check implicit call sites grep can't see (toString/equals/hashCode are invoked by ` +
    `UI renderers like ComboBox/ListView/TableView, serializers, template engines; CSS classes by tests and ` +
    `dynamic classList strings). See the CLAUDE.md deletion protocol. If the removal is intentional and verified, proceed.`
  );
});
