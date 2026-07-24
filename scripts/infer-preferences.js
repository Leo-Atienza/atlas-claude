#!/usr/bin/env node
/**
 * infer-preferences.js — A2 (ATLAS v9 Wave 3). Turn A1's correction candidates into
 * inferred-preference vault pages, with semantic dedup + evidence-counted promotion.
 * This is "learning what the user wants without being told."
 *
 * For each candidate (from cache/behavior-signals.json, buckets preference/error-pattern):
 *   - embed its hypothesis, compare (cosine) to existing inferred pages
 *   - >= SIM_THRESHOLD → UPDATE that page (increment evidence_count, refresh; the
 *     Mem0 reconcile pattern — reinforcement OR contradiction both UPDATE, never a
 *     duplicate ADD). evidence_count >= 3 → promote confidence LOW → MEDIUM.
 *   - otherwise → ADD a new page at confidence LOW.
 * Never deletes; SUPERSEDE is left to human review (flagged, not automatic).
 *
 * Guardrails (§3 A2): inferred prefs are written to wiki/personal/preferences/inferred/
 * ONLY; explicit human feedback (wiki/personal/feedback/) always outranks; LOW prefs
 * are NEVER injected (that gate lives in A3); the monthly report lists all for veto.
 *
 * Usage: node scripts/infer-preferences.js [--dry]
 * Test:  BEHAVIOR_OUT=… INFERRED_DIR=… node scripts/infer-preferences.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ollamaEmbed } = require('../hooks/lib/ollama');
const { runLoop, probeOllama } = require('./lib/loop-guard');
let proposals = null, suggestions = null; // optional — only when the governance layer exists
try { proposals = require('./proposals'); } catch {}
try { suggestions = require('./suggestions'); } catch {}

const HOME = os.homedir();
const SIGNALS = process.env.BEHAVIOR_OUT || path.join(HOME, '.claude', 'cache', 'behavior-signals.json');
const INFERRED_DIR = process.env.INFERRED_DIR || path.join(HOME, 'Documents', 'Wiki', 'wiki', 'personal', 'preferences', 'inferred');
// Idempotency ledger — A1's 28-day window overlaps across weekly runs, so without
// this the SAME correction would be re-counted every week → false promotion.
const LEDGER = process.env.INFER_LEDGER || path.join(HOME, '.claude', 'cache', 'inferred-processed.json');
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return String(h); }
const SIM_THRESHOLD = Number(process.env.INFER_SIM || 0.74); // single-linkage; embeddinggemma paraphrase range
const PROMOTE_AT = 3;
const DRY = process.argv.includes('--dry');
const TODAY = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'pref'; }
function cosine(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na) * Math.sqrt(nb) || 1); }

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = {}; if (!m) return { fm, body: raw };
  for (const line of m[1].split('\n')) { const mm = line.match(/^([a-z_]+):\s*(.*)$/i); if (mm) fm[mm[1]] = mm[2]; }
  return { fm, body: raw.slice(m[0].length) };
}

function loadExisting() {
  const pages = [];
  let files = []; try { files = fs.readdirSync(INFERRED_DIR).filter((f) => f.endsWith('.md')); } catch { return pages; }
  for (const f of files) {
    const full = path.join(INFERRED_DIR, f);
    try { const raw = fs.readFileSync(full, 'utf8'); const { fm } = parseFrontmatter(raw); pages.push({ file: full, name: f.replace(/\.md$/, ''), fm, raw }); } catch {}
  }
  return pages;
}

function renderPage({ title, context, preference, evidence, confidence, sessions, buckets, first_seen, examples }) {
  // normalize: a session entry may be a raw JSON-array string from a prior page's
  // frontmatter (UPDATE path) — flatten it so we don't nest/double-wrap (audit fix).
  const flat = (sessions || []).flatMap((s) => {
    if (typeof s === 'string' && s.trim().startsWith('[')) { try { return JSON.parse(s); } catch { return [s]; } }
    return s == null ? [] : [s];
  }).filter(Boolean);
  const sess = JSON.stringify([...new Set(flat)].slice(0, 8));
  return `---
title: "(inferred) ${title.replace(/"/g, "'")}"
type: inferred-preference
context: ${context || 'general'}
preference: "${preference.replace(/"/g, "'")}"
evidence_count: ${evidence}
confidence: ${confidence}
buckets: [${[...new Set(buckets)].join(', ')}]
source_sessions: ${sess}
first_seen: ${first_seen}
last_updated: ${TODAY}
status: candidate
superseded_by: null
tags: [inferred-preference, sous-chef]
---

**Inferred preference — NOT explicit; pending the user's review.** The sous-chef (A1 behavior-mining) noticed this from ${evidence} correction${evidence === 1 ? '' : 's'}.

> ${preference}

**Evidence examples:**
${examples.slice(0, 3).map((e) => `- "${e.replace(/\n/g, ' ').slice(0, 160)}"`).join('\n')}

> Guardrail: inferred, **never injected below MEDIUM** confidence; explicit [[feedback]] pages outrank this; listed in the monthly evolution report for veto. Promotes to MEDIUM at ${PROMOTE_AT} consistent recurrences. Related: [[behavior-mine]] · [[instincts]] · [[review-proposals]].
`;
}

async function main() {
  const res = await runLoop({
    name: 'infer-preferences',
    costClass: 'local',
    deps: [probeOllama()],
    run: async (ctx) => {
      let signals; try { signals = JSON.parse(fs.readFileSync(SIGNALS, 'utf8')); } catch { console.log('no behavior-signals.json — run behavior-mine first'); return; }
      let ledger = []; try { ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch {}
      const ledgerSet = new Set(ledger);
      const candidates = (signals.candidates || [])
        .filter((c) => c.bucket === 'preference' || c.bucket === 'error-pattern')
        .filter((c) => !ledgerSet.has(hashStr(c.example || c.hypothesis || ''))); // skip already-counted (idempotent across the overlapping 28d window)
      if (!candidates.length) { ctx.report({ checked: 0, found: 0, surfaced: 0, outcome: 'no NEW preference candidates (all already processed)' }); console.log('no new candidates'); return; }

      const existing = loadExisting();
      // embed existing prefs once — each page keeps its member embeddings for
      // single-linkage matching (a candidate joins a page if it's close to ANY member).
      for (const p of existing) {
        const text = (p.fm.preference || p.name).replace(/^"|"$/g, '');
        const v = await ollamaEmbed({ input: [text], timeoutMs: 30000 });
        p.members = v ? [v[0]] : [];
      }

      let added = 0, updated = 0, promoted = 0;
      const actions = [];
      const newlyPromoted = [];
      const processedHashes = []; // only ledger candidates that actually got processed (audit fix: a failed embed must be retryable)
      for (const c of candidates) {
        const hyp = c.hypothesis || c.example;
        if (!hyp) continue;
        const ev = await ollamaEmbed({ input: [hyp], timeoutMs: 30000 });
        if (!ev) continue;                       // embed failed → NOT processed → leave out of the ledger so it retries next run
        processedHashes.push(hashStr(c.example || c.hypothesis || ''));
        const qv = ev[0];
        // single-linkage: best match = highest cosine to ANY member of any page
        let best = null, bestCos = 0;
        for (const p of existing) { for (const m of (p.members || [])) { const cos = cosine(qv, m); if (cos > bestCos) { bestCos = cos; best = p; } } }
        if (best && bestCos >= SIM_THRESHOLD) {
          // UPDATE: increment evidence, maybe promote
          const evCount = (Number(best.fm.evidence_count) || 1) + (c.evidence_count || 1);
          const conf = evCount >= PROMOTE_AT ? 'MEDIUM' : 'LOW';
          if (conf === 'MEDIUM' && best.fm.confidence !== 'MEDIUM') { promoted++; newlyPromoted.push({ rule: (best.fm.preference || hyp).replace(/^"|"$/g, ''), evidence: evCount, slug: best.name }); }
          const buckets = [...new Set([...(best.fm.buckets ? best.fm.buckets.replace(/[\[\]]/g, '').split(',').map((s) => s.trim()) : []), c.bucket])].filter(Boolean);
          const page = renderPage({ title: (best.fm.title || hyp).replace(/^"?\(inferred\)\s*/, '').replace(/^"|"$/g, ''), context: best.fm.context, preference: (best.fm.preference || hyp).replace(/^"|"$/g, ''), evidence: evCount, confidence: conf, sessions: [best.fm.source_sessions, c.session], buckets, first_seen: best.fm.first_seen || TODAY, examples: [c.example] });
          if (!DRY) fs.writeFileSync(best.file, page);
          best.fm.evidence_count = String(evCount); best.fm.confidence = conf; best.members.push(qv); // grow the cluster
          updated++; actions.push(`UPDATE ${best.name} → ev=${evCount} ${conf}`);
        } else {
          // ADD new LOW page
          const slug = slugify(hyp);
          const file = path.join(INFERRED_DIR, `${slug}.md`);
          const evCount = c.evidence_count || 1;
          const conf = evCount >= PROMOTE_AT ? 'MEDIUM' : 'LOW';
          const page = renderPage({ title: hyp, context: c.project ? `seen in ${c.project}` : 'general', preference: hyp, evidence: evCount, confidence: conf, sessions: [c.session], buckets: [c.bucket], first_seen: TODAY, examples: [c.example] });
          if (!DRY) { fs.mkdirSync(INFERRED_DIR, { recursive: true }); fs.writeFileSync(file, page); }
          existing.push({ file, name: slug, fm: { preference: hyp, evidence_count: String(evCount), confidence: conf }, members: [qv] });
          added++; actions.push(`ADD ${slug} (${conf})`);
        }
      }
      // A newly-MEDIUM preference is eligible to become an injected instinct — route
      // it through the ONE governance path (A4) for the user's veto, and note it in the
      // inbox (A7). Both are optional (only when those layers exist).
      if (!DRY) {
        for (const p of newlyPromoted) {
          if (proposals) proposals.addProposal('pref-veto', `Inferred preference reached MEDIUM: ${p.rule.slice(0, 60)}`,
            `The sous-chef inferred this preference from ${p.evidence} of your corrections and it has now recurred enough to promote to MEDIUM.\n\n> ${p.rule}\n\nApprove → it becomes eligible to inject as an instinct (A3). Reject → vetoed (stays LOW, not injected). Source page: personal/preferences/inferred/${p.slug}.md`,
            { evidence: `${p.evidence} corrections`, rollback: 'set the page confidence back to LOW; it will not inject' });
          if (suggestions) suggestions.addSuggestion('inferred preference', `A preference reached MEDIUM: "${p.rule.slice(0, 70)}" — review via /review-proposals`);
        }
        const merged = [...ledgerSet, ...processedHashes];
        try { fs.mkdirSync(path.dirname(LEDGER), { recursive: true }); fs.writeFileSync(LEDGER, JSON.stringify([...new Set(merged)].slice(-500))); } catch {}
      }
      ctx.report({ checked: candidates.length, found: added + updated, surfaced: promoted, outcome: `${added} added, ${updated} updated, ${promoted} promoted→MEDIUM` });
      console.log(`infer-preferences: ${candidates.length} candidates → ${added} ADD, ${updated} UPDATE, ${promoted} promoted to MEDIUM${DRY ? ' (dry-run)' : ''}`);
      actions.forEach((a) => console.log('  ' + a));
    },
  });
  if (res.status === 'skipped') console.log(`infer-preferences skipped: ${res.reason}`);
  process.exit(res.status === 'error' ? 1 : 0);
}

if (require.main === module) main();
module.exports = { slugify };
