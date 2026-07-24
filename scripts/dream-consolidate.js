#!/usr/bin/env node
/**
 * dream-consolidate.js — A10 (ATLAS v9 Wave 4, Letta sleep-time-compute, weekly).
 * The consolidation pass A2's per-fact reconcile does NOT do:
 *   (1) cross-page near-duplicates (embedding cosine > DUP)
 *   (2) relative dates that should be absolute ("last week", "3 days ago", ...)
 *   (3) stale HIGH-confidence pages (confidence:HIGH & updated > 90d ago)
 *
 * Writes a REPORT to wiki/personal/_dream/YYYY-MM-DD.md (never auto-applies) and
 * emits ONE A4 proposal pointing at it. Any application is manual, via
 * /review-proposals, committed with a `dream:` prefix (revertible). Cost: local
 * (embeddings only). Supersede-not-delete throughout.
 *
 * Usage: node scripts/dream-consolidate.js [--dry]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runLoop, probeOllama } = require('./lib/loop-guard');
let proposals = null; try { proposals = require('./proposals'); } catch {}

const HOME = os.homedir();
const WIKI = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const CACHE = path.join(HOME, '.claude', 'cache', 'recall-embeddings.json');
const DREAM_DIR = process.env.DREAM_DIR || path.join(WIKI, 'personal', '_dream');
const TODAY = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);
const DUP = Number(process.env.DREAM_DUP || 0.90);
const DRY = process.argv.includes('--dry');
const REL_DATE = /\b(last (week|month|year)|next (week|month)|yesterday|tomorrow|recently|a few days ago|\d+ (days?|weeks?|months?) ago)\b/i;

function cosine(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na) * Math.sqrt(nb) || 1); }
function daysSince(dateStr) { const t = Date.parse(dateStr); return isNaN(t) ? null : Math.round((Date.parse(TODAY) - t) / 86400000); }

async function main() {
  const res = await runLoop({
    name: 'dream-consolidate', costClass: 'local', deps: [probeOllama()],
    run: async (ctx) => {
      let cache; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { console.log('no recall index'); return; }
      const pages = Object.entries(cache.entries || {}).filter(([k]) => !k.startsWith('node:')).map(([k, v]) => ({ key: k, vec: v.vec }));

      // (1) near-duplicate pairs
      const dups = [];
      for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
        const c = cosine(pages[i].vec, pages[j].vec);
        if (c >= DUP) dups.push({ a: pages[i].key, b: pages[j].key, cos: Number(c.toFixed(3)) });
      }
      dups.sort((a, b) => b.cos - a.cos);

      // (2) relative dates + (3) stale HIGH — scan page bodies
      const relDates = [], staleHigh = [];
      for (const p of pages) {
        let raw; try { raw = fs.readFileSync(path.join(WIKI, p.key), 'utf8'); } catch { continue; }
        const body = raw.replace(/^---[\s\S]*?---/, '');
        if (REL_DATE.test(body)) { const m = body.match(REL_DATE); relDates.push({ key: p.key, phrase: m[0] }); }
        const conf = (raw.match(/^confidence:\s*(\w+)/m) || [])[1];
        const upd = (raw.match(/^updated:\s*'?(\d{4}-\d{2}-\d{2})/m) || [])[1];
        if (conf === 'HIGH' && upd) { const d = daysSince(upd); if (d != null && d > 90) staleHigh.push({ key: p.key, updated: upd, age_days: d }); }
      }
      staleHigh.sort((a, b) => b.age_days - a.age_days);

      const total = dups.length + relDates.length + staleHigh.length;
      if (!total) { ctx.report({ checked: pages.length, found: 0, outcome: 'vault consolidation: nothing to do' }); console.log('dream: nothing to consolidate'); return; }

      const report = `---
title: "Dream consolidation — ${TODAY}"
type: dream-report
created: ${TODAY}
tags: [dream, consolidation, sous-chef, proposal]
---

# Dream consolidation ${TODAY}

Weekly vault-hygiene scan (A10). **Nothing here is applied** — review via \`/review-proposals\`; apply manually with a \`dream:\` commit (revertible), supersede-not-delete.

## Near-duplicate pages (cosine ≥ ${DUP}) — ${dups.length}
${dups.slice(0, 15).map((d) => `- [[${d.a.replace(/\.md$/, '')}]] ⇔ [[${d.b.replace(/\.md$/, '')}]] _(${d.cos})_ — consider merging or cross-linking`).join('\n') || '_(none)_'}

## Relative dates to make absolute — ${relDates.length}
${relDates.slice(0, 20).map((r) => `- [[${r.key.replace(/\.md$/, '')}]] — "${r.phrase}"`).join('\n') || '_(none)_'}

## Stale HIGH-confidence pages (>90d, re-verify) — ${staleHigh.length}
${staleHigh.slice(0, 20).map((s) => `- [[${s.key.replace(/\.md$/, '')}]] — updated ${s.updated} (${s.age_days}d ago)`).join('\n') || '_(none)_'}

> Bi-temporal note (Zep/Graphiti): new fact-shaped pages should carry \`valid_from\`/\`invalid_at\`/\`invalidated_by\` when facts change over time; wiki-lint validates these keys. Do NOT retrofit the whole vault.
`;
      if (!DRY) { fs.mkdirSync(DREAM_DIR, { recursive: true }); fs.writeFileSync(path.join(DREAM_DIR, `${TODAY}.md`), report); }
      if (!DRY && proposals) proposals.addProposal('consolidation', `Dream consolidation ${TODAY}: ${total} items`,
        `A weekly vault-hygiene scan found ${dups.length} near-duplicate pairs, ${relDates.length} relative-date fixes, ${staleHigh.length} stale HIGH-confidence pages to re-verify. See personal/_dream/${TODAY}.md. Apply selectively, manually, with a \`dream:\` commit.`,
        { evidence: `${total} items`, rollback: 'git revert the dream: commit(s)' });
      ctx.report({ checked: pages.length, found: total, surfaced: 1, outcome: `dream report: ${dups.length} dups, ${relDates.length} rel-dates, ${staleHigh.length} stale-HIGH` });
      console.log(`dream-consolidate: ${dups.length} dups, ${relDates.length} rel-dates, ${staleHigh.length} stale-HIGH → personal/_dream/${TODAY}.md`);
    },
  });
  process.exit(res.status === 'error' ? 1 : 0);
}
if (require.main === module) main();
