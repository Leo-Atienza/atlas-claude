#!/usr/bin/env node
/**
 * behavior-mine.js — A1 (ATLAS v9 Wave 3). The sous-chef's eyes: mine Claude Code's
 * own transcripts + existing telemetry for IMPLICIT feedback about how the user works,
 * and write conservative CANDIDATES for A2 (inferred prefs) / A6 (automation) to
 * consume. Never writes the vault directly.
 *
 * Signals:
 *   (a) corrections   — a real (origin=human) user message right after an assistant
 *                       delivery, matching a redirect/negation pattern
 *   (b) rejections    — reused from logs/user-rejections.jsonl (no re-parse)
 *   (c) re-prompts    — two human messages back-to-back (first didn't land)
 *   (d) tool n-grams  — 2–3-length tool_use sequences recurring across >=3 sessions
 *   (f) rhythm        — hour-of-day + per-project activity
 *
 * Guardrails (§3 A1): only clusters with >=2 occurrences surface; the local model
 * buckets each correction (preference | error-pattern | one-off | unclear) and
 * "unclear" is dropped; writes cache/behavior-signals.json only. F5 loop-guarded
 * (cost: local — the classify pass is local Ollama; ~0 Claude tokens).
 *
 * Usage: node scripts/behavior-mine.js [--days N] [--no-classify]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { runLoop, probeOllama } = require('./lib/loop-guard');

const HOME = os.homedir();
const PROJECTS = process.env.BEHAVIOR_PROJECTS_DIR || path.join(HOME, '.claude', 'projects');
const OUT = process.env.BEHAVIOR_OUT || path.join(HOME, '.claude', 'cache', 'behavior-signals.json');
const REJECTIONS_LOG = path.join(HOME, '.claude', 'logs', 'user-rejections.jsonl');
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CLASSIFY_MODEL = process.env.ATLAS_OLLAMA_DEEP_MODEL || 'qwen2.5:7b';

const DAYS = (() => { const i = process.argv.indexOf('--days'); return i > -1 ? Number(process.argv[i + 1]) : 28; })();
const NO_CLASSIFY = process.argv.includes('--no-classify');
const MAX_FILE_BYTES = 12 * 1024 * 1024; // skip pathological transcripts

// correction/redirect patterns — kept specific to limit false positives
const STRONG = /\b(no,|nope|don'?t|do not|stop|revert|undo|that'?s (wrong|not right|not what)|not what i|that is wrong|incorrect)\b/i;
const REDIRECT = /\b(actually|instead|rather|i wanted|i asked for|i said|why did you|you (should|shouldn'?t)|please don'?t|make it|change it back|too (much|many|verbose))\b/i;

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((b) => b.type === 'text').map((b) => b.text || '').join(' ');
  return '';
}
function isToolResult(content) { return Array.isArray(content) && content.some((b) => b.type === 'tool_result'); }
function toolUses(content) { return Array.isArray(content) ? content.filter((b) => b.type === 'tool_use').map((b) => b.name) : []; }

async function mineTranscript(file, acc) {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  let prevAssistant = null; // {ts, hadDelivery}
  let prevHuman = null;     // {ts}
  let session = path.basename(file, '.jsonl');
  for await (const line of rl) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    const cwd = o.cwd || 'unknown';
    if (o.type === 'assistant') {
      const c = o.message?.content;
      const tools = toolUses(c);
      if (tools.length) { acc.toolSeqBySession[session] = acc.toolSeqBySession[session] || []; acc.toolSeqBySession[session].push(...tools); }
      const hasText = textOf(c).trim().length > 40;
      prevAssistant = { ts, hadDelivery: hasText || tools.length > 0 };
      prevHuman = null;
      continue;
    }
    if (o.type !== 'user') continue;
    const c = o.message?.content;
    if (isToolResult(c)) continue;               // tool-result carrier, not a real message
    if (o.origin?.kind !== 'human') continue;    // task-notifications etc. are NOT user input
    const txt = textOf(c).trim();
    if (!txt || txt.startsWith('<')) continue;    // skip empty / xml-wrapped injections
    const project = path.basename(cwd);
    // rhythm
    if (ts) { const h = new Date(ts).getHours(); acc.hourHist[h] = (acc.hourHist[h] || 0) + 1; }
    acc.projectActivity[project] = (acc.projectActivity[project] || 0) + 1;
    // re-prompt: two human messages with no assistant delivery between
    if (prevHuman && (!prevAssistant || !prevAssistant.hadDelivery)) acc.reprompts++;
    // correction: after an assistant delivery, short-ish, matches a pattern
    if (prevAssistant && prevAssistant.hadDelivery && txt.length < 600) {
      const strong = STRONG.test(txt), redirect = REDIRECT.test(txt);
      if (strong || redirect) {
        acc.corrections.push({ session, project, ts: o.timestamp || null, text: txt.slice(0, 400), strength: strong ? 'strong' : 'redirect' });
      }
    }
    prevHuman = { ts };
    prevAssistant = null;
  }
}

function ngrams(seq, n) { const out = []; for (let i = 0; i + n <= seq.length; i++) out.push(seq.slice(i, i + n).join(' → ')); return out; }

function buildToolNgrams(toolSeqBySession) {
  const counts = new Map(); // ngram -> Set(sessions)
  for (const [session, seq] of Object.entries(toolSeqBySession)) {
    for (const n of [2, 3]) for (const g of ngrams(seq, n)) {
      if (!counts.has(g)) counts.set(g, new Set());
      counts.get(g).add(session);
    }
  }
  const distinctTools = (g) => new Set(g.split(' → ')).size;
  return [...counts.entries()]
    .map(([seq, sess]) => ({ seq, sessions: sess.size }))
    .filter((x) => x.sessions >= 3 && distinctTools(x.seq) >= 2) // >=3 sessions; drop trivial self-repeats (X→X)
    .sort((a, b) => b.sessions - a.sessions).slice(0, 15);
}

function clusterCorrections(corrections) {
  // group by a coarse signature (strength + first 3 significant words) to find >=2 recurrences
  const groups = new Map();
  for (const c of corrections) {
    const words = c.text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3).slice(0, 4).join(' ');
    const key = c.strength + '|' + words;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return [...groups.values()].map((items) => ({ count: items.length, example: items[0].text, sessions: [...new Set(items.map((i) => i.session))], projects: [...new Set(items.map((i) => i.project))] }));
}

async function classifyCorrection(text) {
  const schema = { type: 'object', additionalProperties: false, required: ['bucket', 'confidence'], properties: { bucket: { type: 'string', enum: ['preference', 'error-pattern', 'one-off', 'unclear'] }, confidence: { type: 'number', minimum: 0, maximum: 1 }, hypothesis: { type: 'string' } } };
  const body = { model: CLASSIFY_MODEL, stream: false, think: false, format: schema, options: { temperature: 0 },
    messages: [
      { role: 'system', content: 'You classify a user correction to an AI assistant into a bucket. Be STRICT:\n- "one-off" = tied to a SPECIFIC project, file, folder, feature, or name (e.g. "put this in the lab6 folder", "name it X", "add feature Y to this app"). Most corrections are one-off. When in doubt, one-off.\n- "preference" = a GENERALIZABLE style/workflow/rule that would apply across DIFFERENT projects (e.g. "keep it simple", "always use my personal-style skill", "don\'t overcomplicate", "prefer OKLCH over hex").\n- "error-pattern" = the assistant made a repeatable MISTAKE the user is catching (e.g. "you edited the wrong file again").\n- "unclear" = cannot tell.\nconfidence is 0.0–1.0. Give a one-line hypothesis of the durable rule ONLY for preference/error-pattern.' },
      { role: 'user', content: `Correction: "${text}"` },
    ] };
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    return JSON.parse(d.message?.content || '{}');
  } catch { return null; }
}

async function main() {
  const res = await runLoop({
    name: 'behavior-mine',
    costClass: 'local',
    deps: NO_CLASSIFY ? [] : [probeOllama()],
    run: async (ctx) => {
      const cutoff = Date.now() - DAYS * 86400000;
      const acc = { corrections: [], reprompts: 0, toolSeqBySession: {}, hourHist: {}, projectActivity: {} };
      let filesScanned = 0;
      let projectDirs = []; try { projectDirs = fs.readdirSync(PROJECTS); } catch {}
      for (const pd of projectDirs) {
        let files = []; try { files = fs.readdirSync(path.join(PROJECTS, pd)).filter((f) => f.endsWith('.jsonl')); } catch { continue; }
        for (const f of files) {
          const full = path.join(PROJECTS, pd, f);
          let st; try { st = fs.statSync(full); } catch { continue; }
          if (st.mtimeMs < cutoff || st.size > MAX_FILE_BYTES) continue;
          filesScanned++;
          try { await mineTranscript(full, acc); } catch { /* skip unreadable */ }
        }
      }
      const clusters = clusterCorrections(acc.corrections).filter((c) => c.count >= 2); // >=2 occurrences only
      const toolNgrams = buildToolNgrams(acc.toolSeqBySession);

      // rejection signal (reuse existing log)
      let rejections = { total: 0, byTool: {} };
      try {
        const lines = fs.readFileSync(REJECTIONS_LOG, 'utf8').trim().split('\n').filter(Boolean);
        for (const l of lines) { try { const o = JSON.parse(l); const t = o.tool || o.toolName || 'unknown'; if (!o.ts || Date.parse(o.ts) >= cutoff) { rejections.total++; rejections.byTool[t] = (rejections.byTool[t] || 0) + 1; } } catch {} }
      } catch {}

      // Classify EACH correction (deduped by exact text) — the local model buckets
      // preference / error-pattern / one-off / unclear. Keep the first two only.
      // Each becomes a LOW hypothesis; A2 does semantic dedup + evidence counting +
      // MEDIUM promotion at 3 recurrences (so the ">=2 to surface" gate lives at the
      // A2/A3 promotion boundary, not here). A cluster with >=2 exact repeats carries
      // its own evidence_count.
      const candidates = [];
      if (!NO_CLASSIFY) {
        const seen = new Set();
        const uniq = acc.corrections.filter((c) => { const k = c.text.trim(); if (seen.has(k)) return false; seen.add(k); return true; });
        const clusterCountFor = (text) => { const g = clusters.find((cl) => cl.example === text); return g ? g.count : 1; };
        for (const c of uniq) {
          const cls = await classifyCorrection(c.text);
          if (!cls || cls.bucket === 'unclear' || cls.bucket === 'one-off') continue;
          candidates.push({ bucket: cls.bucket, confidence: cls.confidence ?? null, hypothesis: cls.hypothesis || null, evidence_count: clusterCountFor(c.text), project: c.project, session: c.session, example: c.text.slice(0, 300) });
        }
      }

      const out = {
        generated_at: new Date().toISOString(),
        window_days: DAYS,
        files_scanned: filesScanned,
        totals: { corrections: acc.corrections.length, correction_clusters_ge2: clusters.length, reprompts: acc.reprompts, tool_ngrams: toolNgrams.length, rejections: rejections.total },
        correction_clusters: clusters,
        recent_corrections: acc.corrections.slice(-30), // raw sample for transparency / A2
        candidates,                 // A2 (prefs) + A6 (automation) read these
        tool_ngrams: toolNgrams,    // A6 automation candidates
        rejections,
        rhythm: { hour_histogram: acc.hourHist, project_activity: acc.projectActivity },
      };
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
      ctx.report({ checked: filesScanned, found: clusters.length, surfaced: candidates.length, outcome: `${acc.corrections.length} corrections → ${clusters.length} clusters(>=2) → ${candidates.length} candidates; ${toolNgrams.length} tool n-grams` });
      console.log(`behavior-mine: ${filesScanned} transcripts, ${acc.corrections.length} corrections, ${clusters.length} clusters(>=2), ${candidates.length} candidates, ${toolNgrams.length} n-grams, ${rejections.total} rejections`);
    },
  });
  if (res.status === 'skipped') console.log(`behavior-mine skipped: ${res.reason}`);
  process.exit(res.status === 'error' ? 1 : 0);
}

if (require.main === module) main();
module.exports = { clusterCorrections, buildToolNgrams };
