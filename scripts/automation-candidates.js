#!/usr/bin/env node
/**
 * automation-candidates.js — A6 (ATLAS v9 Wave 4). Turn A1's repeated tool
 * sequences into automation PROPOSALS (a skill/hook/alias candidate). Rides on
 * behavior-mine's output + the A4 proposal queue — proposals only, never acts.
 *
 * Emits a proposal for a distinctive sequence (length-3, seen in >=MIN_SESSIONS
 * sessions, involving at least one non-ubiquitous tool). The queue dedups by title
 * and caps at 5, so this is naturally bounded. Cost: zero Claude tokens.
 *
 * Usage: node scripts/automation-candidates.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runLoop } = require('./lib/loop-guard');
let proposals = null; try { proposals = require('./proposals'); } catch {}

const SIGNALS = process.env.BEHAVIOR_OUT || path.join(os.homedir(), '.claude', 'cache', 'behavior-signals.json');
const MIN_SESSIONS = Number(process.env.A6_MIN_SESSIONS || 5);
const UBIQUITOUS = new Set(['Read', 'Bash', 'Edit', 'Write', 'Grep', 'Glob']);

async function main() {
  const res = await runLoop({
    name: 'automation-candidates', costClass: 'zero', deps: [],
    run: async (ctx) => {
      if (!proposals) { console.log('proposals module unavailable — skipping'); return; }
      let sig; try { sig = JSON.parse(fs.readFileSync(SIGNALS, 'utf8')); } catch { console.log('no behavior-signals.json'); return; }
      const grams = (sig.tool_ngrams || [])
        .filter((g) => g.seq.split(' → ').length === 3 && g.sessions >= MIN_SESSIONS)
        // distinctive = at least one tool that isn't a ubiquitous primitive
        .filter((g) => g.seq.split(' → ').some((t) => !UBIQUITOUS.has(t)))
        .sort((a, b) => b.sessions - a.sessions);
      let emitted = 0;
      for (const g of grams.slice(0, 2)) { // at most 2 per run; queue caps at 5 total
        const r = proposals.addProposal('automation', `Recurring workflow: ${g.seq}`,
          `You ran the sequence \`${g.seq}\` in **${g.sessions}** distinct sessions. Worth a skill, hook, or alias to compress it?\n\n- If it's a deterministic multi-step you always run → candidate for a small script/alias.\n- If it needs judgment each time → leave it manual.`,
          { evidence: `${g.sessions} sessions`, rollback: 'none — this is a suggestion only' });
        if (r.ok) emitted++;
      }
      ctx.report({ checked: grams.length, surfaced: emitted, outcome: `${emitted} automation proposal(s) from ${grams.length} distinctive recurring sequences` });
      console.log(`automation-candidates: ${grams.length} distinctive sequences (>=${MIN_SESSIONS} sessions), ${emitted} proposed`);
    },
  });
  process.exit(res.status === 'error' ? 1 : 0);
}
if (require.main === module) main();
