#!/usr/bin/env node
// system-detect.js — SessionStart Capability System proposer (never auto-activates).
//
// Scans the session CWD against each active system's detect signals
// (systems/registry.json) and prints at most ONE non-blocking proposal line:
//   SYSTEM: detected <domain> project → /system activate <name> (matched: ...)
// Distinct greppable prefix — deliberately NOT "DRIFT:" and never written to
// cache/last-drift-proposal.json (separate advisory channel from drift-proposer).
//
// Ordered cheap exits keep the steady state <100ms / ≤3 file reads:
//   1. profile gate  2. active marker exists  3. throttle fresh (<24h)
//   4. registry read (+ mtime staleness guard → inline regen)  5. bounded scoring
//
// Bounded detection (no unbounded traversal inside a SessionStart hook):
//   - literal detect_files → one existsSync each
//   - '**' patterns → manual walk, max depth 3, ignore-set, first match wins
//   - global budget ~200 fs ops per run, per-system short-circuit at 2 signals
//
// --explain: verbose CLI mode for /system detect — ignores marker/throttle,
// prints every system's score. Fail-open everywhere; always exits 0.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { isHookEnabled } = require('./lib');
const { cwdSlug } = require('./lib/slug');

const ROOT = path.join(os.homedir(), '.claude');
const CACHE = path.join(ROOT, 'cache');
const EXPLAIN = process.argv.includes('--explain');

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'vendor']);
const MAX_DEPTH = 3;
const FS_BUDGET = 200;
const THRESHOLD = 2;
const THROTTLE_HOURS = 24;

let fsOps = 0;

function statSafe(p) { fsOps++; try { return fs.statSync(p); } catch { return null; } }
function existsSafe(p) { fsOps++; try { return fs.existsSync(p); } catch { return false; } }

// Match one '**' glob (e.g. "app/**/page.tsx") via a bounded walk: resolve the
// literal prefix, then search for the trailing basename pattern to MAX_DEPTH.
function globMatch(cwd, pattern) {
  const starIdx = pattern.indexOf('**');
  const prefix = pattern.slice(0, starIdx).replace(/\/$/, '');
  const suffix = pattern.slice(starIdx + 2).replace(/^\//, ''); // e.g. "page.tsx"
  const base = prefix ? path.join(cwd, prefix) : cwd;
  const st = statSafe(base);
  if (!st || !st.isDirectory()) return false;

  const suffixRe = new RegExp('^' + suffix.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/\\\\]*') + '$', 'i');
  const queue = [{ dir: base, depth: 0 }];
  while (queue.length) {
    if (fsOps > FS_BUDGET) return false;
    const { dir, depth } = queue.shift();
    let entries;
    fsOps++;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isFile() && suffixRe.test(e.name)) return true;
      if (e.isDirectory() && depth < MAX_DEPTH && !IGNORE_DIRS.has(e.name)) {
        queue.push({ dir: path.join(dir, e.name), depth: depth + 1 });
      }
    }
  }
  return false;
}

function readPackages(cwd) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]);
  } catch { return new Set(); }
}

function scoreSystem(cwd, sys, packages) {
  const matched = [];
  for (const f of sys.detect_files || []) {
    if (fsOps > FS_BUDGET || matched.length >= THRESHOLD) break;
    const hit = f.includes('**') ? globMatch(cwd, f)
      : /[*?[]/.test(f) ? false // non-** wildcards unsupported by design — keep patterns literal or '**'
      : existsSafe(path.join(cwd, f));
    if (hit) matched.push(f);
  }
  if (matched.length < THRESHOLD) {
    for (const p of sys.detect_packages || []) {
      if (matched.length >= THRESHOLD + 1) break;
      const hit = p.endsWith('*')
        ? [...packages].some(k => k.startsWith(p.slice(0, -1)))
        : packages.has(p);
      if (hit) matched.push(`package.json:${p}`);
    }
  }
  return matched;
}

function main() {
  if (!isHookEnabled('system-detect')) return;

  let input = {};
  if (!EXPLAIN && !process.stdin.isTTY) {
    try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* fail-open */ }
  }
  const cwd = input.cwd || process.cwd();
  const slug = cwdSlug(cwd);
  const markerFile = path.join(CACHE, `active-system-${slug}.json`);
  const throttleFile = path.join(CACHE, `system-detect-${slug}.json`);

  if (!EXPLAIN) {
    // Cheap exit 2: already activated for this CWD.
    if (existsSafe(markerFile)) return;
    // Cheap exit 3: throttled — skip ALL scoring, not just the message.
    const st = statSafe(throttleFile);
    if (st && (Date.now() - st.mtimeMs) < THROTTLE_HOURS * 3600 * 1000) return;
  }

  const registryFile = path.join(ROOT, 'systems', 'registry.json');
  let registry;
  try { registry = JSON.parse(fs.readFileSync(registryFile, 'utf8')); } catch { return; }

  // Staleness guard: any SYSTEM.md newer than registry.json → regenerate inline.
  try {
    const regMtime = fs.statSync(registryFile).mtimeMs;
    const sysDir = path.join(ROOT, 'systems');
    let stale = false;
    for (const entry of fs.readdirSync(sysDir)) {
      const mf = path.join(sysDir, entry, 'SYSTEM.md');
      const st = statSafe(mf);
      if (st && st.mtimeMs > regMtime) { stale = true; break; }
    }
    if (stale) {
      const { loadSystems, deriveRegistry, writeRegistry } = require(path.join(ROOT, 'scripts', 'lib', 'system-manifest.js'));
      registry = deriveRegistry(loadSystems().systems);
      writeRegistry(registry);
    }
  } catch { /* fail-open: score whatever registry we have */ }

  const systems = Object.entries(registry.systems || {})
    .filter(([, s]) => s.status === 'active')
    .map(([id, s]) => ({ id, ...s }));
  if (!systems.length) return;

  const packages = readPackages(cwd);
  const scored = systems
    .map(s => ({ s, matched: scoreSystem(cwd, s, packages) }))
    .sort((a, b) => (b.matched.length - a.matched.length) || ((b.s.priority || 0) - (a.s.priority || 0)));

  if (EXPLAIN) {
    for (const { s, matched } of scored) {
      process.stdout.write(`${s.name} (${s.id}, domain:${s.domain || '—'}): score=${matched.length}${matched.length ? ' — ' + matched.join(', ') : ''}\n`);
    }
    return;
  }

  const best = scored[0];
  // Persist scan result either way — the throttle file is the once-per-24h gate
  // AND a recoverable proposal for /system detect / /system activate.
  try {
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(throttleFile, JSON.stringify({
      ts: new Date().toISOString(),
      cwd,
      proposed: best && best.matched.length >= THRESHOLD ? best.s.name : null,
      system_id: best && best.matched.length >= THRESHOLD ? best.s.id : null,
      matched: best ? best.matched : [],
    }, null, 2) + '\n');
  } catch { /* fail-open */ }

  if (best && best.matched.length >= THRESHOLD) {
    process.stdout.write(`SYSTEM: detected ${best.s.domain || best.s.name} project → /system activate ${best.s.name} (matched: ${best.matched.join(', ')})\n`);
  }
}

try { main(); } catch { /* fail-open — a broken detector must never block a session */ }
process.exit(0);
