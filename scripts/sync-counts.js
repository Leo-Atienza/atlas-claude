#!/usr/bin/env node
/**
 * sync-counts.js — propagate validator-backed counts from the ground-truth
 * snapshot into the human-facing docs, by anchored-regex replacement.
 * =========================================================================
 * /health §14 used to regenerate cache/system-ground-truth.json and then ask
 * Claude to HAND-EDIT every count table. The same number is mirrored in many
 * places (the active-skill count alone lives in 7 spots across SYSTEM_VERSION,
 * README, ARCHITECTURE, REFERENCE) — re-syncing them by hand every health run
 * is pure toil and drifts silently. This script does the writeback in one shot:
 * it reads the snapshot, finds each count by an anchored regex, and rewrites
 * ONLY the captured number. The four skill-count surfaces reuse the EXACT
 * regexes from validate-skill-counts.js, so writer and validator agree by
 * construction.
 *
 * DESIGN
 *   - Each target is { file, anchors: [{ label, pattern, value }] } where every
 *     pattern has exactly ONE capture group: the number to write.
 *   - Per file: read once, apply every anchor, write atomically (tmp+rename)
 *     ONLY if the content changed. Idempotent: a value already in sync is a
 *     no-op; nothing is written and no date is bumped.
 *   - ANCHOR MISS = LOUD FAILURE, never a silent skip. If an anchor matches 0
 *     or >1 times the doc format has drifted: it is reported and the process
 *     exits non-zero (matching anchors are still written so the rest stays in
 *     sync, but the miss is surfaced for a human to fix). This mirrors the
 *     README format-change guard in validate-skill-counts.js.
 *   - DATES: when SYSTEM_VERSION.md actually changes, bump its `last_updated:`
 *     header and the Metadata `last_health_check` date to today (real Date —
 *     this is a Node script, not a Workflow script). NEVER bump `version:`
 *     (reserved for releases). Per-row "Last Updated" notes in the count tables
 *     are preserved — only the count digit is touched.
 *
 * MODES
 *   (default)   write mode — sync the docs to the snapshot.
 *   --check     dry-run; exit 1 on any drift (doc value != snapshot) or anchor
 *               miss; writes nothing. Used by the weekly-validator-sweep task.
 *   --regen     run system-snapshot.js first, then sync (for standalone use).
 *   --json      emit a machine-readable summary to stdout.
 *
 * SNAPSHOT SOURCE: cache/system-ground-truth.json. /health §14 Step 1 already
 * regenerates it, so /health calls this with no flag. If the snapshot is stale
 * (mtime > 1 day) and --regen was not passed, a warning is printed (sync still
 * proceeds against the on-disk snapshot).
 *
 * OUT OF SCOPE (left manual — matching today's §14 contract; do NOT add anchors
 * for these here):
 *   - ACTIVE-DIRECTORY.md "Total active skills: **52**" — that's the human-curated
 *     SOURCE the validator parses A *from*; this script propagates A *to* the
 *     other surfaces and must never write ACTIVE-DIRECTORY.md.
 *   - SYSTEM_VERSION.md "## Skills counted three ways" prose + the
 *     "116 direct + 194 bundle + 61 archive" breakdown sentence.
 *   - Non-snapshot rows: Agents, Rules, top-level Commands, Vault personal/,
 *     session-log/handoffs, Cleanup rules, Validators, Capability Systems,
 *     Scheduled tasks (enabled recurring / disabled orphans), Hooks (.sh+.py).
 *   - README "74 Agents" / "5 Rule Files"; ARCHITECTURE "(6 Core + 46 Available)".
 *
 * Usage: node scripts/sync-counts.js [--check] [--regen] [--json]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOME = os.homedir();
const ROOT = path.join(HOME, '.claude');
const SNAPSHOT = path.join(ROOT, 'cache', 'system-ground-truth.json');
const SNAPSHOT_SCRIPT = path.join(ROOT, 'scripts', 'system-snapshot.js');

const ARGV = process.argv.slice(2);
const CHECK = ARGV.includes('--check');
const REGEN = ARGV.includes('--regen');
const JSON_OUT = ARGV.includes('--json');

const TODAY = new Date().toISOString().slice(0, 10);

function fail(msg, code) {
  if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: false, error: msg }, null, 2) + '\n');
  else console.error(`✗ ${msg}`);
  process.exit(code);
}

// ── 1. Load the snapshot (optionally regenerate first) ──────────────────────
if (REGEN) {
  const r = spawnSync('node', [SNAPSHOT_SCRIPT], { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) fail(`--regen: system-snapshot.js exited ${r.status}: ${(r.stderr || '').slice(0, 300)}`, 2);
}

let snap;
try {
  snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
} catch (e) {
  fail(`cannot read snapshot ${SNAPSHOT}: ${e.message}. Run with --regen or 'node scripts/system-snapshot.js' first.`, 2);
}

// Staleness warning (informational — sync still proceeds against the on-disk snapshot).
if (!REGEN) {
  try {
    const ageMs = Date.now() - fs.statSync(SNAPSHOT).mtimeMs;
    if (ageMs > 86400000) {
      const ageH = Math.round(ageMs / 3600000);
      console.error(`⚠ snapshot is ${ageH}h old (${SNAPSHOT}). Pass --regen to refresh it first.`);
    }
  } catch { /* ignore */ }
}

// ── 2. Pull every validator-backed count from its exact snapshot field ──────
// Paths confirmed against health.md §14 + the live snapshot schema (v2).
const sv = snap.skills && snap.skills.from_validator;
const A = sv && sv.active_directory;                                   // active skills (canonical)
const B = sv && sv.filesystem_unlimited && sv.filesystem_unlimited.total; // fs total incl. packs+symlinks
const C = snap.hooks_dir && snap.hooks_dir.total;                      // active .js hooks
const D = snap.commands && snap.commands.counts && snap.commands.counts.fs_commands; // commands w/ subdirs
const E = snap.knowledge && snap.knowledge.counts && snap.knowledge.counts.actual_total; // knowledge entries
const byType = (snap.knowledge && snap.knowledge.counts && snap.knowledge.counts.by_type) || {};
const Fp = byType.pattern, Fs = byType.solution, Fe = byType.error, Fpr = byType.preference, Ff = byType.failure;
const G = snap.scheduled_tasks && snap.scheduled_tasks.count;         // scheduled-task fs dirs

// Every needed field must be a non-negative integer, else the snapshot is
// malformed/partial and writing it back would corrupt the docs.
const REQUIRED = { A, B, C, D, E, 'F.pattern': Fp, 'F.solution': Fs, 'F.error': Fe, 'F.preference': Fpr, 'F.failure': Ff, G };
const bad = Object.entries(REQUIRED).filter(([, v]) => !Number.isInteger(v) || v < 0);
if (bad.length) fail(`snapshot missing/invalid fields: ${bad.map(([k]) => k).join(', ')}. Snapshot may be stale or partial — regenerate it.`, 2);

// ── 3. Anchor map (file → anchors). Each pattern has ONE capture group: the
// number. Patterns are single-quoted with \\ escapes so literal backticks (the
// markdown code spans) stay literal. The four skill-count surfaces use the EXACT
// regexes from validate-skill-counts.js — keep them byte-identical so writer and
// validator never disagree.
const TARGETS = [
  {
    file: 'SYSTEM_VERSION.md',
    isSystemVersion: true,
    anchors: [
      { label: 'A active-skills (== validator system_version)', pattern: 'Skills \\(in ACTIVE-DIRECTORY\\)\\s*\\|\\s*(\\d+)', value: A },
      { label: 'B fs-total',          pattern: 'Skills \\(filesystem total incl\\. packs \\+ symlinks\\)\\s*\\|\\s*(\\d+)', value: B },
      { label: 'C hooks',             pattern: 'Hooks \\(active \\.js\\)\\s*\\|\\s*(\\d+)', value: C },
      { label: 'D commands',          pattern: 'Commands \\(with subdirs, excl\\. `_deprecated`\\)\\s*\\|\\s*(\\d+)', value: D },
      { label: 'E knowledge',         pattern: 'Knowledge entries \\(vault `engineering/`\\)\\s*\\|\\s*(\\d+)', value: E },
      { label: 'F patterns',          pattern: 'Patterns \\(type: pattern\\)\\s*\\|\\s*(\\d+)', value: Fp },
      { label: 'F solutions',         pattern: 'Solutions \\(type: solution\\)\\s*\\|\\s*(\\d+)', value: Fs },
      { label: 'F errors',            pattern: 'Errors \\(type: error\\)\\s*\\|\\s*(\\d+)', value: Fe },
      { label: 'F preferences',       pattern: 'Preferences \\(type: preference\\)\\s*\\|\\s*(\\d+)', value: Fpr },
      { label: 'F failures',          pattern: 'Failures \\(type: failure\\)\\s*\\|\\s*(\\d+)', value: Ff },
      { label: 'G scheduled-tasks',   pattern: 'Scheduled tasks \\(filesystem dirs\\)\\s*\\|\\s*(\\d+)', value: G },
    ],
  },
  {
    file: 'ARCHITECTURE.md',
    anchors: [
      { label: 'A active-skills (== validator architecture)', pattern: '\\((\\d+)\\s+active skill entries', value: A },
      { label: 'E knowledge total',   pattern: 'Total\\s+(\\d+)\\s+entries', value: E },
      // Inline knowledge counts on line ~21 read `patterns.md` (64) — note the
      // closing backtick + space before the paren (the plan's \s* form misses it).
      { label: 'F patterns inline',   pattern: 'patterns\\.md` \\((\\d+)\\)', value: Fp },
      { label: 'F solutions inline',  pattern: 'solutions\\.md` \\((\\d+)\\)', value: Fs },
      { label: 'F errors inline',     pattern: 'errors\\.md` \\((\\d+)\\)', value: Fe },
      { label: 'F preferences inline', pattern: 'preferences\\.md` \\((\\d+)\\)', value: Fpr },
      { label: 'F failures inline',   pattern: 'failures\\.md` \\((\\d+)\\)', value: Ff },
    ],
  },
  {
    file: 'REFERENCE.md',
    anchors: [
      { label: 'A active-skills (== validator reference)', pattern: 'Active skill index\\s*\\((\\d+)\\s*skills:', value: A },
    ],
  },
  {
    file: 'README.md',
    anchors: [
      { label: 'A skills badge',       pattern: 'badge/skills-(\\d+)_active', value: A },
      { label: 'A skills box (== validator readme_box)',   pattern: '\\b(\\d+)\\s+Skills\\s*·', value: A },
      { label: 'A skills prose (== validator readme_prose)', pattern: '\\bthe\\s+(\\d+)\\s+active skills\\b', value: A },
      { label: 'A skills tree (== validator readme_tree)',  pattern: '\\b(\\d+)\\s+active skill entries\\b', value: A },
      { label: 'C hooks badge',        pattern: 'badge/hooks-(\\d+)-', value: C },
      { label: 'C hooks box',          pattern: '(\\d+)\\s+Hooks\\s+·', value: C },
      { label: 'D commands badge',     pattern: 'badge/commands-(\\d+)-', value: D },
      { label: 'D commands prose',     pattern: 'or\\s+(\\d+)\\s+commands', value: D },
    ],
  },
];

// Date anchors for SYSTEM_VERSION.md (group 1 = the date token). Applied only
// when the count writeback actually changed the file. NEVER touches `version:`.
const SV_DATE_ANCHORS = [
  { label: 'last_updated header',     pattern: '\\*\\*last_updated:\\s*(\\d{4}-\\d{2}-\\d{2})' },
  { label: 'last_health_check meta',  pattern: 'last_health_check\\s*\\|\\s*(\\d{4}-\\d{2}-\\d{2})' },
];

// ── 4. Single-group span replace. Returns one of:
//   { status: 'miss', count }                — anchor matched ≠ 1 time
//   { status: 'insync' }                     — matched once, value already correct
//   { status: 'changed', text, from, to }    — matched once, value rewritten
function applyAnchor(text, pattern, newVal) {
  const count = (text.match(new RegExp(pattern, 'g')) || []).length;
  if (count !== 1) return { status: 'miss', count };
  const m = new RegExp(pattern, 'd').exec(text);
  const [s, e] = m.indices[1];
  const current = text.slice(s, e);
  if (current === String(newVal)) return { status: 'insync' };
  return { status: 'changed', text: text.slice(0, s) + String(newVal) + text.slice(e), from: current, to: String(newVal) };
}

// ── 5. Process every target ─────────────────────────────────────────────────
const report = { mode: CHECK ? 'check' : 'write', date: TODAY, files: [], changes: [], drift: [], misses: [], wrote: [] };

for (const target of TARGETS) {
  const fp = path.join(ROOT, target.file);
  let text;
  try {
    text = fs.readFileSync(fp, 'utf8');
  } catch (e) {
    report.misses.push({ file: target.file, anchor: '(file)', detail: `unreadable: ${e.message}` });
    continue;
  }
  const original = text;

  for (const a of target.anchors) {
    const res = applyAnchor(text, a.pattern, a.value);
    if (res.status === 'miss') {
      report.misses.push({ file: target.file, anchor: a.label, detail: `matched ${res.count}× (expected 1)`, pattern: a.pattern });
    } else if (res.status === 'changed') {
      // In --check the value differs from the snapshot → drift. In write mode → a change to apply.
      (CHECK ? report.drift : report.changes).push({ file: target.file, anchor: a.label, from: res.from, to: res.to });
      text = res.text;
    }
    // 'insync' → nothing to record
  }

  const contentChanged = text !== original;

  // Bump SYSTEM_VERSION dates only when a count actually changed it.
  if (target.isSystemVersion && contentChanged) {
    for (const d of SV_DATE_ANCHORS) {
      const res = applyAnchor(text, d.pattern, TODAY);
      if (res.status === 'miss') {
        report.misses.push({ file: target.file, anchor: d.label, detail: `matched ${res.count}× (expected 1)`, pattern: d.pattern });
      } else if (res.status === 'changed') {
        report.changes.push({ file: target.file, anchor: d.label, from: res.from, to: res.to });
        text = res.text;
      }
    }
  }

  const finalChanged = text !== original;
  report.files.push({ file: target.file, changed: finalChanged });

  if (finalChanged && !CHECK) {
    const tmp = fp + '.tmp';
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, fp);
    report.wrote.push(target.file);
  }
}

// ── 6. Report + exit ────────────────────────────────────────────────────────
const hasMiss = report.misses.length > 0;

if (JSON_OUT) {
  report.ok = !hasMiss && (CHECK ? report.drift.length === 0 : true);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else if (CHECK) {
  if (report.drift.length === 0 && !hasMiss) {
    console.log('✓ sync-counts --check: all doc counts in sync with the snapshot.');
  } else {
    if (report.drift.length) {
      console.error(`✗ DRIFT: ${report.drift.length} doc count(s) disagree with the snapshot:`);
      for (const d of report.drift) console.error(`    ${d.file}: ${d.anchor}  ${d.from} → should be ${d.to}`);
      console.error('  Run `node scripts/sync-counts.js` (no flag) to write the snapshot values back.');
    }
    if (hasMiss) {
      console.error(`✗ ANCHOR MISS: ${report.misses.length} anchor(s) did not match exactly once (doc format drifted):`);
      for (const m of report.misses) console.error(`    ${m.file}: ${m.anchor} — ${m.detail}`);
      console.error('  Fix the doc text or the anchor in sync-counts.js so the count stays writable.');
    }
  }
} else {
  if (report.wrote.length) {
    console.log(`sync-counts: wrote ${report.wrote.join(', ')} (${report.changes.length} field(s) updated).`);
    for (const c of report.changes) console.log(`    ${c.file}: ${c.anchor}  ${c.from} → ${c.to}`);
  } else {
    console.log('✓ sync-counts: all doc counts already in sync — nothing written.');
  }
  if (hasMiss) {
    console.error(`\n✗ ANCHOR MISS: ${report.misses.length} anchor(s) did not match exactly once (doc format drifted) — these counts were NOT written:`);
    for (const m of report.misses) console.error(`    ${m.file}: ${m.anchor} — ${m.detail}`);
    console.error('  Fix the doc text or the anchor in sync-counts.js so the count stays writable.');
  }
}

// --check: drift OR miss → exit 1. write: miss → exit 1 (loud), else 0.
if (CHECK) process.exit(report.drift.length === 0 && !hasMiss ? 0 : 1);
process.exit(hasMiss ? 1 : 0);
