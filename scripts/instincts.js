#!/usr/bin/env node
/**
 * instincts.js — A3 (ATLAS v9 Wave 3). Manage + render the capped, decaying
 * behavioral micro-rules in wiki/engineering/instincts.md.
 *
 *   render  — print the top-6 instincts with confidence >= 0.70 as injection lines
 *             (EMPTY when none — so SessionStart footprint is 0 until a rule earns
 *             its place; keeps net context flat vs the F1a baseline).
 *   sync    — pull A2 MEDIUM inferred prefs into the table (add at 0.50, or reinforce
 *             an existing row), then weekly time-decay untouched rows. Rejects any
 *             rule that contradicts a CLAUDE.md invariant (safety/never-delete/etc).
 *
 * Rules are ROUTES not ORDERS: injected as informational one-liners, never as
 * imperatives that could override CLAUDE.md.
 *
 * Usage: node scripts/instincts.js render|sync
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const INSTINCTS = process.env.INSTINCTS_FILE || path.join(HOME, 'Documents', 'Wiki', 'wiki', 'engineering', 'instincts.md');
const INFERRED_DIR = process.env.INFERRED_DIR || path.join(HOME, 'Documents', 'Wiki', 'wiki', 'personal', 'preferences', 'inferred');
const INJECT_FLOOR = 0.70, ADD_AT = 0.50, DROP_BELOW = 0.30, DECAY = 0.93, CAP = 6;
const TODAY = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);

// A rule is rejected if it appears to negate a CLAUDE.md invariant.
const CONTRADICTS_CLAUDE_MD = /\b(delete without|rm -rf|skip (validation|security|accessibility)|push the vault|add a remote|auto-?send|hardcod)/i;

function readRows() {
  let raw = ''; try { raw = fs.readFileSync(INSTINCTS, 'utf8'); } catch { return { raw: '', rows: [] }; }
  const rows = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\|\s*([0-9.]+)\s*\|\s*(\d+)\s*\|\s*([0-9-]+)\s*\|\s*(.+?)\s*\|\s*$/);
    if (m && m[1] !== 'confidence') rows.push({ confidence: Number(m[1]), evidence: Number(m[2]), last_confirmed: m[3], rule: m[4] });
  }
  return { raw, rows };
}

function writeRows(raw, rows) {
  const sorted = rows.filter((r) => r.confidence >= DROP_BELOW).sort((a, b) => b.confidence - a.confidence);
  const table = ['| confidence | evidence | last_confirmed | rule |', '|---|---|---|---|',
    ...sorted.map((r) => `| ${r.confidence.toFixed(2)} | ${r.evidence} | ${r.last_confirmed} | ${r.rule} |`)].join('\n');
  const placeholder = sorted.length ? '' : '\n\n_(none yet — the sous-chef seeds these as it learns the user\'s patterns from real corrections. Starts empty ⇒ zero session-start footprint until a preference earns its place.)_';
  // replace between "## Active instincts" table area and the next "## See also"
  const out = raw.replace(/(<!-- Managed by scripts\/instincts\.js[^>]*>\n)[\s\S]*?(\n## See also)/,
    `$1\n${table}${placeholder}\n$2`);
  fs.writeFileSync(INSTINCTS, out);
}

function loadMediumPrefs() {
  const prefs = [];
  let files = []; try { files = fs.readdirSync(INFERRED_DIR).filter((f) => f.endsWith('.md')); } catch { return prefs; }
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(INFERRED_DIR, f), 'utf8');
      const conf = (raw.match(/^confidence:\s*(\w+)/m) || [])[1];
      const pref = (raw.match(/^preference:\s*"?(.+?)"?\s*$/m) || [])[1];
      const ev = Number((raw.match(/^evidence_count:\s*(\d+)/m) || [])[1] || 0);
      if (conf === 'MEDIUM' && pref) prefs.push({ rule: pref, evidence: ev });
    } catch {}
  }
  return prefs;
}

function cmdRender() {
  const { rows } = readRows();
  const top = rows.filter((r) => r.confidence >= INJECT_FLOOR).sort((a, b) => b.confidence - a.confidence).slice(0, CAP);
  if (!top.length) return; // empty → zero footprint
  console.log('the user INSTINCTS (learned routes, not orders — top ' + top.length + '):');
  for (const r of top) console.log(`  · ${r.rule}  (${r.confidence.toFixed(2)})`);
}

function cmdSync() {
  const { raw, rows } = readRows();
  if (!raw) { console.error('instincts.md not found'); process.exit(1); }
  const byRule = new Map(rows.map((r) => [r.rule.toLowerCase().slice(0, 40), r]));
  let added = 0, reinforced = 0, rejected = 0;
  for (const p of loadMediumPrefs()) {
    if (CONTRADICTS_CLAUDE_MD.test(p.rule)) { rejected++; continue; }
    const key = p.rule.toLowerCase().slice(0, 40);
    const existing = byRule.get(key);
    if (existing) { existing.confidence = Math.min(1, existing.confidence + 0.10); existing.evidence = Math.max(existing.evidence, p.evidence); existing.last_confirmed = TODAY; reinforced++; }
    else { const r = { confidence: ADD_AT, evidence: p.evidence, last_confirmed: TODAY, rule: p.rule }; rows.push(r); byRule.set(key, r); added++; }
  }
  // weekly time-decay for rows not confirmed today
  for (const r of rows) if (r.last_confirmed !== TODAY) r.confidence = Number((r.confidence * DECAY).toFixed(3));
  writeRows(raw, rows);
  console.log(`instincts sync: +${added} new, ${reinforced} reinforced, ${rejected} rejected(CLAUDE.md), ${rows.filter((r) => r.confidence >= INJECT_FLOOR).length} injectable(>=${INJECT_FLOOR})`);
}

const cmd = process.argv[2];
if (cmd === 'render') cmdRender();
else if (cmd === 'sync') cmdSync();
else { console.error('usage: instincts.js render|sync'); process.exit(1); }
