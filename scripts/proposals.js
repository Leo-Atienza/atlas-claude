#!/usr/bin/env node
/**
 * proposals.js — A4 (ATLAS v9 Wave 4). The ONE self-modification path. Everything
 * self-generated that would change behavior lands here as a reviewable proposal;
 * nothing is auto-applied. Generalizes the drift-proposer into the system-wide
 * governance primitive. Reviewed via /review-proposals (with the user).
 *
 * Proposal files: ~/.claude/proposals/YYYY-MM-DD-<slug>.md
 *   frontmatter: {type, status, created, expires(+30d), evidence, rollback,
 *                 manual_spec}  — proposals touching CLAUDE.md/hooks are SPECS
 *                 (manual_spec:true), applied by a session with the user, never scripted.
 *
 * Guardrails: hard cap 5 OPEN (oldest auto-expires); per-type acceptance tracked in
 * cache/proposal-stats.json — a type under 30% acceptance (min 4 resolved) is MUTED
 * (stops generating). Approve/reject/defer all leave an audit trail.
 *
 *   node proposals.js add <type> "<title>" "<spec>" [--manual] [--evidence "..."] [--rollback "..."]
 *   node proposals.js list [--all]
 *   node proposals.js resolve <slug> approve|reject|defer ["reason"]
 *   node proposals.js expire
 *   node proposals.js stats
 * Exported: addProposal() for other sous-chef scripts.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const DIR = process.env.PROPOSALS_DIR || path.join(HOME, '.claude', 'proposals');
const STATS = process.env.PROPOSAL_STATS || path.join(HOME, '.claude', 'cache', 'proposal-stats.json');
const CAP_OPEN = 5, EXPIRE_DAYS = 30, MUTE_BELOW = 0.30, MUTE_MIN_RESOLVED = 4;
const TODAY = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);
const MANUAL_TYPES = new Set(['rule-change', 'hook-change']); // touch CLAUDE.md/hooks → spec-only

function addDays(d, n) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'proposal'; }
function ensureDir() { fs.mkdirSync(DIR, { recursive: true }); }

function list(all = false) {
  ensureDir();
  const out = [];
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
    const fm = {}; const m = raw.match(/^---\n([\s\S]*?)\n---/); if (m) for (const l of m[1].split('\n')) { const mm = l.match(/^([a-z_]+):\s*(.*)$/i); if (mm) fm[mm[1]] = mm[2]; }
    if (all || fm.status === 'open') out.push({ file: path.join(DIR, f), slug: f.replace(/\.md$/, ''), fm, raw });
  }
  return out.sort((a, b) => (a.fm.created || '').localeCompare(b.fm.created || ''));
}

function loadStats() { try { return JSON.parse(fs.readFileSync(STATS, 'utf8')); } catch { return {}; } }
function saveStats(s) { try { fs.mkdirSync(path.dirname(STATS), { recursive: true }); fs.writeFileSync(STATS, JSON.stringify(s, null, 2)); } catch {} }
function isMuted(type) { const s = loadStats()[type]; if (!s) return false; const resolved = s.approved + s.rejected; return resolved >= MUTE_MIN_RESOLVED && s.approved / resolved < MUTE_BELOW; }

function addProposal(type, title, spec, opts = {}) {
  ensureDir();
  if (isMuted(type)) return { ok: false, reason: `type '${type}' is muted (acceptance < ${MUTE_BELOW * 100}%)` };
  const open = list();
  // dedup by title
  if (open.some((p) => (p.fm.title || '') === title)) return { ok: false, reason: 'duplicate open proposal' };
  if (open.length >= CAP_OPEN) {
    // expire the oldest to make room
    const oldest = open[0];
    setStatus(oldest, 'expired', 'auto-expired: queue cap reached');
  }
  const slug = `${TODAY}-${slugify(title)}`;
  const manual = opts.manual || MANUAL_TYPES.has(type);
  const body = `---
type: ${type}
status: open
created: ${TODAY}
expires: ${addDays(TODAY, EXPIRE_DAYS)}
manual_spec: ${manual}${opts.target ? `\ntarget: ${opts.target}` : ''}
evidence: ${JSON.stringify(opts.evidence ? [opts.evidence] : [])}
rollback: "${(opts.rollback || 'n/a').replace(/"/g, "'")}"
tags: [proposal, sous-chef]
---

## Proposal: ${title}

**Type:** ${type}${manual ? '  ·  ⚠ MANUAL SPEC — applied by a session with the user present, never scripted (touches CLAUDE.md/hooks).' : ''}

${spec}

**Evidence:** ${opts.evidence || '(none)'}
**Rollback:** ${opts.rollback || 'n/a'}

> Review with \`/review-proposals\` → approve / reject / defer. Auto-expires ${addDays(TODAY, EXPIRE_DAYS)}.
`;
  fs.writeFileSync(path.join(DIR, `${slug}.md`), body);
  return { ok: true, slug };
}

function setStatus(p, status, reason) {
  const raw = fs.readFileSync(p.file, 'utf8').replace(/^status:\s*.*$/m, `status: ${status}`);
  const withNote = reason ? raw.replace(/(\n> Review with[\s\S]*)$/, `\n**Resolution (${TODAY}):** ${status} — ${reason}\n$1`) : raw;
  fs.writeFileSync(p.file, withNote);
}

function resolve(slug, action, reason) {
  const all = list(true);
  const p = all.find((x) => x.slug === slug || x.slug.endsWith(slug));
  if (!p) return { ok: false, reason: 'not found' };
  const status = { approve: 'approved', reject: 'rejected', defer: 'open' }[action];
  if (!status) return { ok: false, reason: 'action must be approve|reject|defer' };
  setStatus(p, action === 'defer' ? 'open' : status, reason || (action === 'defer' ? 'deferred' : ''));
  if (action !== 'defer') {
    const s = loadStats(); const t = p.fm.type || 'unknown'; s[t] = s[t] || { approved: 0, rejected: 0 };
    s[t][action === 'approve' ? 'approved' : 'rejected']++;
    // Per-target decline-memory (v10 U1-3, KNOWLEDGE-144): a rejected proposal
    // with a `target:` records it so detectors never re-propose the same thing.
    if (action === 'reject' && p.fm.target) {
      s.declined_targets = s.declined_targets || [];
      if (!s.declined_targets.some((d) => d.target === p.fm.target)) {
        s.declined_targets.push({ target: p.fm.target, type: t, ts: TODAY });
      }
    }
    saveStats(s);
  }
  return { ok: true, status, manual: p.fm.manual_spec === 'true' };
}

function expire() {
  let n = 0;
  for (const p of list()) if ((p.fm.expires || '9999') < TODAY) { setStatus(p, 'expired', 'past expiry'); n++; }
  return n;
}

if (require.main === module) {
  const args = process.argv.slice(2); const cmd = args[0];
  const flag = (name) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : null; };
  if (cmd === 'add') { const r = addProposal(args[1], args[2], args[3] || '', { manual: args.includes('--manual'), evidence: flag('--evidence'), rollback: flag('--rollback'), target: flag('--target') }); console.log(r.ok ? `added ${r.slug}` : `not added: ${r.reason}`); }
  else if (cmd === 'list') { const ps = list(args.includes('--all')); if (!ps.length) console.log('(no open proposals)'); ps.forEach((p) => console.log(`- [${p.fm.status}] ${p.slug}  (${p.fm.type}${p.fm.manual_spec === 'true' ? ', manual-spec' : ''}, expires ${p.fm.expires})\n    ${(p.fm.title || (p.raw.match(/## Proposal: (.+)/) || [])[1] || '').slice(0, 80)}`)); }
  else if (cmd === 'resolve') { const r = resolve(args[1], args[2], args.slice(3).join(' ')); console.log(r.ok ? `${args[1]} → ${r.status}${r.manual ? ' (MANUAL SPEC — apply with the user)' : ''}` : `error: ${r.reason}`); }
  else if (cmd === 'expire') { console.log(`expired ${expire()} proposal(s)`); }
  else if (cmd === 'stats') { const s = loadStats(); for (const [t, v] of Object.entries(s)) { const res = v.approved + v.rejected; console.log(`${t}: ${v.approved}/${res} approved (${res ? Math.round(v.approved / res * 100) : 0}%)${isMuted(t) ? ' — MUTED' : ''}`); } if (!Object.keys(s).length) console.log('(no resolved proposals yet)'); }
  else { console.error('usage: proposals.js add|list|resolve|expire|stats'); process.exit(1); }
}

module.exports = { addProposal, list, resolve, expire, isMuted };
