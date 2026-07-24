#!/usr/bin/env node
/**
 * morning-brief.js — A8 (proposal revived + approved 2026-07-16). Daily 07:30 brief
 * written into wiki/personal/suggestions.md as a SELF-REPLACING block between
 * <!-- morning-brief:start/end --> markers, placed ABOVE the suggestions.js-managed
 * marker so inbox rewrites (add/expire) never drop it. One brief exists at a time;
 * it consumes none of the 5/week suggestion budget.
 *
 * Local-LLM only (Ollama, ATLAS_OLLAMA_DEEP_MODEL || qwen2.5:7b). Circuit breaker:
 * any gather/compose failure degrades to a deterministic plain brief — never blocks,
 * never throws, exit 0 unless the inbox itself is unwritable.
 *
 *   node morning-brief.js          # gather -> compose -> write
 *   node morning-brief.js --dry    # print the brief, do not write
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOME = os.homedir();
const INBOX = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'personal', 'suggestions.md');
const TASK_CACHE = path.join(HOME, '.claude', 'cache', 'scheduled-tasks-latest.json');
const HOT = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'hot.md');
const INGEST_SCRIPT = path.join(HOME, '.claude', 'scripts', 'wiki-ingest-pending.js');
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.ATLAS_OLLAMA_DEEP_MODEL || 'qwen2.5:7b';
const DRY = process.argv.includes('--dry');
const START = '<!-- morning-brief:start -->';
const END = '<!-- morning-brief:end -->';
const MANAGED = '<!-- managed by scripts/suggestions.js';
const MAX_LLM_LINES = 14;

function today() { return new Date().toISOString().slice(0, 10); }

function gather() {
  const g = { overnight: [], ingest: 'unknown', openSuggestions: 0, recentWiki: [] };
  try {
    const j = JSON.parse(fs.readFileSync(TASK_CACHE, 'utf8'));
    const cutoff = Date.now() - 24 * 3600 * 1000;
    for (const t of j.tasks || []) {
      if (t.lastRunAt && Date.parse(t.lastRunAt) > cutoff) g.overnight.push(t.taskId);
    }
  } catch {}
  try {
    g.ingest = execFileSync('node', [INGEST_SCRIPT], { timeout: 15000 }).toString().split('\n')[0].trim();
  } catch {}
  try {
    const raw = fs.readFileSync(INBOX, 'utf8');
    const body = raw.slice(raw.indexOf(MANAGED));
    g.openSuggestions = (body.match(/^- \[/gm) || []).length;
  } catch {}
  try {
    g.recentWiki = fs.readFileSync(HOT, 'utf8').split('\n').filter((l) => l.startsWith('| ')).slice(-5);
  } catch {}
  return g;
}

async function composeLLM(g) {
  const prompt = `You are the ATLAS sous-chef writing the user's morning brief. Output PLAIN TEXT bullet lines only ("- " prefix), max ${MAX_LLM_LINES} lines total, no markdown headers, no preamble, no closing line. Three sections in order, each introduced by a single bullet: overnight results, ingest backlog, suggested focus for today (1-2 concrete items inferred from the recent wiki activity). Be terse and specific. Data: ${JSON.stringify(g)}`;
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { temperature: 0.3, num_predict: 320 } }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`ollama http ${res.status}`);
  const text = ((await res.json()).response || '').replace(/—/g, '-').replace(/```[\s\S]*?```/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).slice(0, MAX_LLM_LINES);
  if (!lines.length) throw new Error('empty ollama response');
  return lines;
}

function composeFallback(g) {
  return [
    `- Overnight: ${g.overnight.length ? g.overnight.join(', ') : 'no scheduled tasks ran in the last 24h'}`,
    `- ${g.ingest}`,
    `- Open suggestions in inbox: ${g.openSuggestions}`,
    '- (Ollama unavailable - plain fallback brief)',
  ];
}

function writeBrief(lines) {
  const block = [START, `**Morning brief — ${today()}**`, ...lines, END].join('\n');
  let raw = fs.readFileSync(INBOX, 'utf8');
  const s = raw.indexOf(START), e = raw.indexOf(END);
  if (s > -1 && e > s) raw = raw.slice(0, s) + block + raw.slice(e + END.length);
  else {
    const m = raw.indexOf(MANAGED);
    if (m === -1) throw new Error('suggestions.md managed marker not found');
    raw = raw.slice(0, m) + block + '\n\n' + raw.slice(m);
  }
  fs.writeFileSync(INBOX, raw);
}

(async () => {
  const g = gather();
  let lines, mode = 'ollama';
  try { lines = await composeLLM(g); } catch { lines = composeFallback(g); mode = 'fallback'; }
  if (DRY) { console.log([`**Morning brief — ${today()}** (${mode}, dry run)`, ...lines].join('\n')); return; }
  writeBrief(lines);
  console.log(`brief written (${mode}, ${lines.length} lines)`);
})().catch((e) => { console.error(`morning-brief failed: ${e.message}`); process.exit(1); });
