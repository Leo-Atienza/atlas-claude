#!/usr/bin/env node
/**
 * transcript-distill-weekly.js — "dreaming-lite": make the write-only
 * transcript archive earn its disk space.
 * ====================================================================
 * wiki/session-log/transcripts/ accumulates per-session distillations (72
 * files, 4.1MB as of 2026-06-09) that nothing ever reads back. This script —
 * run weekly by the weekly-maintenance scheduled task — reads the week's
 * transcripts (FRONTMATTER + Summary/Decisions/dead-end sections ONLY, never
 * the verbatim bodies), runs a deterministic keyword tally, then asks the
 * local deep model to cluster recurring themes, repeated mistakes, and emit
 * PROPOSED engineering-vault entries as ready-to-paste blocks.
 *
 * HUMAN-IN-THE-LOOP BY DESIGN: this never writes to the vault. Output goes to
 * stdout (relayed into the weekly report) + cache/weekly-distill-latest.md.
 * The user pastes accepted entries into engineering/{patterns,errors,
 * solutions}.md — or asks Claude to — during weekly review.
 *
 * 100% local (lib/ollama deep model, forceEnglish). Fail-open: Ollama down →
 * prints a skip line and exits 0.
 *
 * Usage: node transcript-distill-weekly.js [--days=7]
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { ollamaGenerate, isBreakerOpen, MODELS } = require('../hooks/lib/ollama');

const HOME = os.homedir();
const TX_DIR = path.join(HOME, 'Documents', 'Wiki', 'wiki', 'session-log', 'transcripts');
const OUT_FILE = path.join(HOME, '.claude', 'cache', 'weekly-distill-latest.md');

const PER_FILE_CAP = 1500; // chars of extracted content per transcript
const TIMEOUT_MS = 90000; // scheduled-task context — generous is fine

function arg(name, dflt) {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  return m ? Number(m.split('=')[1]) : dflt;
}

function collectWeek(days) {
  const cutoff = Date.now() - days * 86400000;
  const out = [];
  let files;
  try {
    files = fs.readdirSync(TX_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return out;
  }
  for (const f of files) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!m || new Date(m[1] + 'T00:00:00Z').getTime() < cutoff) continue;
    let raw;
    try {
      // CRLF normalize (v8.15 double-check): session-transcript-log.py writes
      // Windows \r\n line endings, so every ^…\n anchor below (frontmatter,
      // section(), keywords) matched NOTHING on real files — the weekly
      // distillation had been running on empty extractions since v8.5.
      raw = fs.readFileSync(path.join(TX_DIR, f), 'utf8').replace(/\r\n/g, '\n');
    } catch {
      continue;
    }
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    const fmText = fm ? fm[1] : '';
    const get = (k) => (fmText.match(new RegExp(`^${k}:\\s*([\\s\\S]*?)(?=\\n[a-z_]+:|$(?![\\s\\S]))`, 'm')) || [])[1] || '';
    const section = (name) => {
      const sm = raw.match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=\\n## |\\n---\\n|$(?![\\s\\S]))`, 'm'));
      return sm ? sm[1].trim() : '';
    };
    const text = [
      `### ${f}`,
      `topic: ${get('topic').trim()} | project: ${get('project').trim()} | turns: ${get('turn_count').trim()}`,
      `keywords: ${(fmText.match(/^keywords:\n((?:- .+\n?)+)/m) || ['', ''])[1].replace(/- /g, '').replace(/\n/g, ', ')}`,
      `summary: ${get('summary').replace(/\n\s+/g, ' ').trim()}`,
      section('Decisions') ? `decisions: ${section('Decisions')}` : '',
      section('What didn\'t work / dead ends') ? `dead-ends: ${section('What didn\'t work / dead ends')}` : '',
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, PER_FILE_CAP);
    out.push({ file: f, topic: get('topic').trim(), keywords: text.match(/keywords: (.*)/)?.[1] || '', text });
  }
  return out;
}

// Deterministic pre-pass: tally topics + keywords across the week so the 7B
// model reasons over counted facts instead of free-associating.
function tally(items) {
  const counts = new Map();
  for (const it of items) {
    for (const k of [it.topic, ...it.keywords.split(',').map((s) => s.trim())]) {
      if (!k || k.length < 3) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, n]) => `${k} (${n}x)`)
    .join(', ');
}

async function main() {
  const days = arg('days', 7);
  const items = collectWeek(days);
  if (!items.length) {
    console.log(`Weekly distillation: no transcripts in the last ${days} days — nothing to distill.`);
    return;
  }
  if (isBreakerOpen()) {
    console.log(`Weekly distillation skipped (local LLM breaker open); ${items.length} transcript(s) pending until next run.`);
    return;
  }

  const recurring = tally(items);
  const prompt = [
    `You are reviewing ${items.length} engineering-session distillations from the last ${days} days for one developer's personal system.`,
    `Deterministic keyword tally (appears in ≥2 sessions): ${recurring || '(none repeated)'}`,
    ``,
    `Produce EXACTLY these three markdown sections:`,
    `## Recurring themes`,
    `2-4 bullets. Each: the theme, then which session files evidence it (cite the ### filenames).`,
    `## Repeated mistakes & dead ends`,
    `0-3 bullets drawn ONLY from the dead-ends/decisions lines. If none repeat, write "None repeated this week."`,
    `## Proposed engineering entries`,
    `0-3 blocks. Each block must be ready to paste into <your-vault-path>/wiki/engineering/patterns.md, errors.md, or solutions.md and follow this exact shape:`,
    `TARGET: <patterns|errors|solutions>.md`,
    `## <short title>`,
    `**Date**: <today> | **Type**: <pattern|error|solution> | **Tags**: #... [MEDIUM]`,
    `<2-4 sentence body grounded in the cited sessions>`,
    ``,
    `Only propose an entry when the same lesson appears in 2+ sessions. Be terse and concrete; no preamble.`,
    ``,
    `=== SESSION DISTILLATIONS ===`,
    ...items.map((i) => i.text),
  ].join('\n');

  const result = await ollamaGenerate({ prompt, timeoutMs: TIMEOUT_MS, forceEnglish: true });
  if (!result) {
    console.log(`Weekly distillation skipped (local LLM offline/timeout); ${items.length} transcript(s) pending until next run.`);
    return;
  }

  const header =
    `# Weekly transcript distillation — ${new Date().toISOString().slice(0, 10)}\n\n` +
    `> ${items.length} transcript(s), last ${days}d, model ${MODELS.deep}. ` +
    `PROPOSALS ONLY — nothing was written to the vault. Paste accepted entries into ` +
    `engineering/{patterns,errors,solutions}.md (or ask Claude to).\n\n`;
  const doc = header + result + '\n';

  try {
    fs.writeFileSync(OUT_FILE + '.tmp', doc);
    fs.renameSync(OUT_FILE + '.tmp', OUT_FILE);
  } catch {
    /* cache write failure — stdout still carries the result */
  }
  console.log(doc);
}

main().catch((e) => {
  console.log(`Weekly distillation error: ${e.message} — skipped, will retry next week.`);
  process.exit(0);
});
