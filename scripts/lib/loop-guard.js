// lib/loop-guard.js — F5 (ATLAS v9 Wave 1). The shared safety harness for every
// new scheduled / recurring / loop job (KNOWLEDGE-173: token-cost estimate +
// circuit breaker on every loop).
// ============================================================================
// Four guarantees, all fail-soft (a loop job should degrade, never crash the
// scheduler):
//   (a) COST DECLARATION — every job declares a Claude-token cost class
//       (zero | local | low | medium). Printed into the run log + meant to be
//       echoed in the scheduled-task description field.
//   (b) CIRCUIT BREAKER — probe each declared dependency (Ollama, a file, an
//       HTTP endpoint) BEFORE doing work; if one is down, SKIP-AND-REPORT
//       instead of failing or hanging (modeled on hooks/lib/ollama.js's breaker,
//       which this reuses for the Ollama probe).
//   (c) RUN-LOCK — a lockfile prevents concurrent duplicate runs; stale locks
//       (dead pid or older than maxLockAgeMs) are broken automatically.
//   (d) OUTCOME LOG — one JSONL line per run to cache/watcher-log.jsonl
//       {ts, name, cost_class, status, checked, found, surfaced, outcome,
//        duration_ms}. A9's scorecard reads this; watchers with 0 useful
//       findings over a month get flagged for removal.
//
// Usage (the wrapper form — recommended):
//   const { runLoop, probeOllama, probeFile } = require('./lib/loop-guard');
//   runLoop({
//     name: 'behavior-mine',
//     costClass: 'local',                 // zero|local|low|medium
//     deps: [probeOllama()],              // [] if none
//     run: async (ctx) => {               // ctx.report({checked,found,surfaced,outcome})
//       ... do work ...
//       ctx.report({ checked: 42, found: 3, surfaced: 1, outcome: '3 candidates written' });
//     },
//   });
//
// Or the primitive form (for retrofitting an existing job report-only):
//   const g = require('./lib/loop-guard');
//   if (!g.acquireLock('weekly-maintenance')) process.exit(0);
//   try { ...; g.logOutcome({ name:'weekly-maintenance', costClass:'low', status:'ok', ... }); }
//   finally { g.releaseLock('weekly-maintenance'); }
//
// Self-test:  node scripts/lib/loop-guard.js --selftest
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LOCK_DIR = path.join(CLAUDE_DIR, 'cache', 'locks');
const WATCHER_LOG = path.join(CLAUDE_DIR, 'cache', 'watcher-log.jsonl');

const COST_CLASSES = {
  zero: 'no Claude tokens (pure file/compute)',
  local: 'local-LLM only — ~0 Claude tokens',
  low: 'small Claude usage (a few short calls)',
  medium: 'moderate Claude usage (a bounded agent/session)',
};

function nowMs() {
  // Date is available in normal node scripts (unlike the Workflow sandbox).
  return Date.now();
}
function iso() {
  return new Date().toISOString();
}

// ── (c) RUN-LOCK ──────────────────────────────────────────────────────────────
function pidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e && e.code === 'EPERM'; }
}

/**
 * Try to acquire an exclusive lock for `name`. Returns true on success.
 * Breaks a stale lock (dead pid, or older than maxLockAgeMs).
 */
function acquireLock(name, maxLockAgeMs = 30 * 60 * 1000) {
  try { fs.mkdirSync(LOCK_DIR, { recursive: true }); } catch { /* ignore */ }
  const lockFile = path.join(LOCK_DIR, `${name}.lock`);
  const payload = JSON.stringify({ pid: process.pid, started_at: iso(), started_ms: nowMs(), name });
  try {
    const fd = fs.openSync(lockFile, 'wx'); // atomic: fails if exists
    fs.writeSync(fd, payload);
    fs.closeSync(fd);
    return true;
  } catch (e) {
    if (e.code !== 'EEXIST') return false; // unexpected fs error → don't run
  }
  // Lock exists — inspect for staleness
  try {
    const cur = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    const stale = (nowMs() - (cur.started_ms || 0)) > maxLockAgeMs || !pidAlive(cur.pid);
    if (stale) {
      fs.writeFileSync(lockFile, payload); // steal it
      return true;
    }
  } catch {
    // Corrupt lock → steal it
    try { fs.writeFileSync(lockFile, payload); return true; } catch { return false; }
  }
  return false; // a live, fresh lock is held by another run
}

function releaseLock(name) {
  const lockFile = path.join(LOCK_DIR, `${name}.lock`);
  try { fs.unlinkSync(lockFile); } catch { /* already gone */ }
}

// ── (b) CIRCUIT BREAKER / dependency probes ───────────────────────────────────
// A probe is { name, check: async () => boolean }. `check` true = dependency UP.
function probeFile(p, label) {
  return { name: label || `file:${path.basename(p)}`, check: async () => { try { fs.accessSync(p); return true; } catch { return false; } } };
}
function probeHttp(url, timeoutMs = 3000) {
  return {
    name: `http:${url}`,
    check: async () => {
      if (typeof fetch !== 'function') return false;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try { const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(t); return r.ok; }
      catch { clearTimeout(t); return false; }
    },
  };
}
function probeOllama(model) {
  const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  return {
    name: 'ollama',
    check: async () => {
      // reuse the shared per-model breaker (hooks/lib/ollama.js), then a live ping.
      // (audit fix: was './ollama' — a non-existent path that threw before the
      // breaker check ran, making this branch dead code.)
      try {
        const { isBreakerOpen } = require('../../hooks/lib/ollama');
        if (model && isBreakerOpen(model)) return false;
      } catch { /* ollama lib optional */ }
      const p = probeHttp(`${base}/api/version`, 3000);
      return p.check();
    },
  };
}

async function checkDeps(deps = []) {
  const down = [];
  for (const d of deps) {
    let ok = false;
    try { ok = await d.check(); } catch { ok = false; }
    if (!ok) down.push(d.name);
  }
  return down; // empty = all up
}

// ── (d) OUTCOME LOG ───────────────────────────────────────────────────────────
function logOutcome(entry) {
  const line = JSON.stringify({
    ts: iso(),
    name: entry.name,
    cost_class: entry.costClass || 'unknown',
    status: entry.status || 'ok', // ok | skipped | error
    checked: entry.checked ?? null,
    found: entry.found ?? null,
    surfaced: entry.surfaced ?? null,
    outcome: entry.outcome ?? null,
    duration_ms: entry.duration_ms ?? null,
    ...(entry.reason ? { reason: entry.reason } : {}),
  });
  try {
    fs.mkdirSync(path.dirname(WATCHER_LOG), { recursive: true });
    fs.appendFileSync(WATCHER_LOG, line + '\n');
  } catch { /* non-critical */ }
}

// ── (a)+wrapper: runLoop ──────────────────────────────────────────────────────
/**
 * Run a loop job under all four guarantees.
 * @returns {Promise<{status, ...}>}
 */
async function runLoop({ name, costClass = 'zero', deps = [], run, maxLockAgeMs }) {
  if (!name || typeof run !== 'function') throw new Error('runLoop requires {name, run}');
  if (!COST_CLASSES[costClass]) costClass = 'unknown';

  if (!acquireLock(name, maxLockAgeMs)) {
    logOutcome({ name, costClass, status: 'skipped', reason: 'lock held (concurrent run)' });
    return { status: 'skipped', reason: 'lock held' };
  }
  const t0 = nowMs();
  try {
    const down = await checkDeps(deps);
    if (down.length) {
      logOutcome({ name, costClass, status: 'skipped', reason: `dependency down: ${down.join(', ')}`, duration_ms: nowMs() - t0 });
      return { status: 'skipped', reason: `dependency down: ${down.join(', ')}` };
    }
    let report = {};
    const ctx = { report: (r) => { report = { ...report, ...r }; } };
    await run(ctx);
    logOutcome({ name, costClass, status: 'ok', duration_ms: nowMs() - t0, ...report });
    return { status: 'ok', duration_ms: nowMs() - t0, ...report };
  } catch (e) {
    logOutcome({ name, costClass, status: 'error', reason: (e && e.message) || String(e), duration_ms: nowMs() - t0 });
    return { status: 'error', reason: (e && e.message) || String(e) };
  } finally {
    releaseLock(name);
  }
}

function costLine(costClass) {
  return `cost: ${costClass} — ${COST_CLASSES[costClass] || 'unknown'}`;
}

module.exports = {
  runLoop, acquireLock, releaseLock, checkDeps, logOutcome, costLine,
  probeFile, probeHttp, probeOllama, pidAlive,
  COST_CLASSES, WATCHER_LOG, LOCK_DIR,
};

// ── self-test ─────────────────────────────────────────────────────────────────
if (require.main === module && process.argv[2] === '--selftest') {
  (async () => {
    let pass = 0, fail = 0;
    const assert = (c, m) => { if (c) { pass++; } else { fail++; console.error('FAIL:', m); } };

    // lock acquire/re-acquire/release
    const n = '__selftest_loop__';
    releaseLock(n);
    assert(acquireLock(n) === true, 'first acquire succeeds');
    assert(acquireLock(n) === false, 'second acquire (same live pid via fresh lock) is blocked');
    releaseLock(n);
    assert(acquireLock(n) === true, 'acquire after release succeeds');
    releaseLock(n);

    // dep probe: a definitely-down http endpoint skips
    const down = await checkDeps([probeHttp('http://127.0.0.1:1/nope', 500)]);
    assert(down.length === 1, 'down dependency detected');

    // runLoop skip-on-dep-down
    const r1 = await runLoop({ name: '__selftest_dep__', costClass: 'zero', deps: [probeFile('/no/such/file/xyz')], run: async () => { throw new Error('should not run'); } });
    assert(r1.status === 'skipped', 'runLoop skips when dependency down');

    // runLoop happy path + report
    const r2 = await runLoop({ name: '__selftest_ok__', costClass: 'zero', deps: [], run: async (ctx) => ctx.report({ checked: 5, found: 2, surfaced: 1, outcome: 'ok' }) });
    assert(r2.status === 'ok' && r2.found === 2, 'runLoop happy path reports findings');

    // pidAlive: this process is alive; a huge pid is not
    assert(pidAlive(process.pid) === true, 'current pid alive');
    assert(pidAlive(2147480000) === false, 'bogus pid not alive');

    console.log(`loop-guard self-test: ${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  })();
}
