#!/usr/bin/env node
/**
 * suggestions.js — A7 (ATLAS v9 Wave 3). The ONE inbox all proactive sous-chef
 * output funnels into: wiki/personal/suggestions.md. Never interrupts; SessionStart
 * shows AT MOST a 1-line pointer. Hard budget: 5 surfaced items/week (overflow is
 * logged, not surfaced). Entries auto-expire after 14 days.
 *
 *   node suggestions.js add "<section>" "<text>"   # append (respects weekly budget)
 *   node suggestions.js pointer                     # 1-line session-start pointer or empty
 *   node suggestions.js expire                       # drop entries older than 14d
 *
 * Also exported as addSuggestion() for other sous-chef scripts to call directly.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const INBOX = process.env.SUGGESTIONS_FILE || path.join(HOME, 'Documents', 'Wiki', 'wiki', 'personal', 'suggestions.md');
const OVERFLOW = path.join(HOME, '.claude', 'cache', 'suggestions-overflow.jsonl');
const WEEK_BUDGET = 5, EXPIRE_DAYS = 14;
const TODAY = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);

function ensureInbox() {
  if (fs.existsSync(INBOX)) return;
  const seed = `---
title: "Suggestions inbox — the sous-chef's ONE proactive surface"
type: inbox
summary: "Everything the sous-chef proactively surfaces lands here (append-only, auto-expire 14d, hard budget 5/week). SessionStart shows at most a 1-line pointer to it — it never interrupts. Review at leisure; acted-on rate is tracked (the inbox must earn attention, not demand it)."
tags: [inbox, sous-chef, suggestions]
updated: ${TODAY}
---

# Suggestions inbox

Append-only. Each entry is dated; entries older than ${EXPIRE_DAYS} days auto-expire. Budget: ${WEEK_BUDGET} surfaced/week (overflow logged, not surfaced). This is a route, not a demand — clear entries as you act on or dismiss them.

## Entries

<!-- managed by scripts/suggestions.js — entries below the marker -->
`;
  fs.mkdirSync(path.dirname(INBOX), { recursive: true });
  fs.writeFileSync(INBOX, seed);
}

function readEntries() {
  ensureInbox();
  const raw = fs.readFileSync(INBOX, 'utf8');
  const idx = raw.indexOf('entries below the marker -->');
  const head = idx > -1 ? raw.slice(0, idx + 'entries below the marker -->'.length) : raw;
  const body = idx > -1 ? raw.slice(idx + 'entries below the marker -->'.length) : '';
  const entries = [];
  for (const block of body.split(/\n(?=- \[)/)) {
    const m = block.match(/^- \[(\d{4}-\d{2}-\d{2})\]\s*\*\*(.+?)\*\*\s*—\s*([\s\S]*)$/);
    if (m) entries.push({ date: m[1], section: m[2], text: m[3].trim() });
  }
  return { head, entries };
}

function writeEntries(head, entries) {
  const body = entries.map((e) => `- [${e.date}] **${e.section}** — ${e.text}`).join('\n\n');
  fs.writeFileSync(INBOX, head + '\n\n' + body + '\n');
}

function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }

function addSuggestion(section, text) {
  const { head, entries } = readEntries();
  const thisWeek = entries.filter((e) => daysBetween(e.date, TODAY) < 7).length;
  if (thisWeek >= WEEK_BUDGET) {
    try { fs.mkdirSync(path.dirname(OVERFLOW), { recursive: true }); fs.appendFileSync(OVERFLOW, JSON.stringify({ ts: new Date().toISOString(), section, text }) + '\n'); } catch {}
    return { surfaced: false, reason: 'weekly budget reached' };
  }
  // dedup: skip if same section+text already present
  if (entries.some((e) => e.section === section && e.text === text)) return { surfaced: false, reason: 'duplicate' };
  entries.push({ date: TODAY, section, text });
  writeEntries(head, entries);
  return { surfaced: true };
}

function expire() {
  const { head, entries } = readEntries();
  const kept = entries.filter((e) => daysBetween(e.date, TODAY) < EXPIRE_DAYS);
  writeEntries(head, kept);
  return entries.length - kept.length;
}

function pointer() {
  const { entries } = readEntries();
  const live = entries.filter((e) => daysBetween(e.date, TODAY) < EXPIRE_DAYS);
  if (!live.length) return '';
  return `sous-chef: ${live.length} suggestion${live.length === 1 ? '' : 's'} waiting — see personal/suggestions.md`;
}

if (require.main === module) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'add') { const r = addSuggestion(a || 'note', b || ''); console.log(r.surfaced ? 'added' : `not surfaced (${r.reason})`); }
  else if (cmd === 'pointer') { const p = pointer(); if (p) console.log(p); }
  else if (cmd === 'expire') { console.log(`expired ${expire()} entries`); }
  else { console.error('usage: suggestions.js add|pointer|expire'); process.exit(1); }
}

module.exports = { addSuggestion, pointer, expire };
