#!/usr/bin/env node
/**
 * auto-link.js — A11 (ATLAS v9 Wave 4, A-MEM minimal form). For each vault page
 * created/modified this week that has no "## See also (auto)" section yet, append
 * up to 3 [[wikilinks]] to its nearest semantic neighbours (from the recall
 * embedding index — reused, no per-page LLM call). Never edits body text.
 *
 * Guardrails: cap 3; only appends its own section; skips pages already linked;
 * wiki-lint reports orphan/low-confidence auto-links for pruning. Runs in
 * weekly-graph-sync (right after the index refresh). Cost: zero Claude tokens.
 *
 * Usage: node scripts/auto-link.js [--days N] [--dry]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runLoop } = require('./lib/loop-guard');

const HOME = os.homedir();
const WIKI = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const CACHE = path.join(HOME, '.claude', 'cache', 'recall-embeddings.json');
const DAYS = (() => { const i = process.argv.indexOf('--days'); return i > -1 ? Number(process.argv[i + 1]) : 7; })();
const DRY = process.argv.includes('--dry');
const MIN_COS = Number(process.env.AUTOLINK_MIN_COS || 0.58);
const CAP = 3;
const MARKER = '## See also (auto)';

function cosine(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na) * Math.sqrt(nb) || 1); }

async function main() {
  const res = await runLoop({
    name: 'auto-link', costClass: 'zero', deps: [],
    run: async (ctx) => {
      let cache; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { console.log('no recall index'); return; }
      const pages = Object.entries(cache.entries || {}).filter(([k]) => !k.startsWith('node:')).map(([k, v]) => ({ key: k, vec: v.vec }));
      const cutoff = Date.now() - DAYS * 86400000;
      let linked = 0, scanned = 0;
      for (const p of pages) {
        const full = path.join(WIKI, p.key);
        let st, raw; try { st = fs.statSync(full); raw = fs.readFileSync(full, 'utf8'); } catch { continue; }
        if (st.mtimeMs < cutoff) continue;
        if (raw.includes(MARKER)) continue;         // already auto-linked
        scanned++;
        const neigh = pages.filter((q) => q.key !== p.key).map((q) => ({ key: q.key, cos: cosine(p.vec, q.vec) }))
          .filter((q) => q.cos >= MIN_COS).sort((a, b) => b.cos - a.cos).slice(0, CAP);
        if (!neigh.length) continue;
        const links = neigh.map((n) => `- [[${n.key.replace(/\.md$/, '')}]] _(${n.cos.toFixed(2)})_`).join('\n');
        const block = `\n\n${MARKER}\n<!-- proposed by scripts/auto-link.js (A11); prune low-confidence ones. -->\n${links}\n`;
        if (!DRY) fs.appendFileSync(full, block);
        linked++;
      }
      ctx.report({ checked: scanned, surfaced: linked, outcome: `${linked}/${scanned} recent pages got auto-links` });
      console.log(`auto-link: ${scanned} recent pages scanned, ${linked} got a "See also (auto)" section${DRY ? ' (dry-run)' : ''}`);
    },
  });
  process.exit(res.status === 'error' ? 1 : 0);
}
if (require.main === module) main();
