#!/usr/bin/env node
/**
 * ATLAS v7.0 — Unified cleanup engine.
 *
 * Replaces session-start.sh §7a, §7a2, §7a3, §7b–§7h, §7j, §7k with a single
 * declarative-config-driven loop. Reads hooks/cleanup-config.json.
 *
 * Output contract:
 *   - JSONL records appended to logs/cleanup.jsonl (one line per rule)
 *   - Chat-visible nag messages emitted on stdout (surfaces through SessionStart)
 *   - stderr used only for unexpected exceptions (fail-open — never propagates)
 *
 * Flags:
 *   --dry-run      plan only, no file modifications, human-readable stdout
 *   --json         emit JSONL to stdout (for observability consumer)
 *   --only=<name>  run a single named rule
 *
 * Exits 0 always. Individual rule failures recorded in jsonl, never throw.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const CLAUDE_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'cleanup-config.json');
const LOG_PATH = path.join(CLAUDE_DIR, 'logs', 'cleanup.jsonl');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const JSON_MODE = argv.includes('--json');
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').slice(7) || null;

// ── utilities ───────────────────────────────────────────────────────────

const NOW = Date.now();
const DAY_MS = 86_400_000;

function globToRegex(g) {
  if (!g) return null;
  const esc = g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + esc + '$');
}

function resolvePath(p) {
  if (!p) return CLAUDE_DIR;
  return path.isAbsolute(p) ? p : path.join(CLAUDE_DIR, p);
}

function listEntries(dir, { glob, maxDepth = 1, type = 'f' } = {}) {
  const rx = globToRegex(glob);
  const out = [];
  function walk(d, depth) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      const isDir = ent.isDirectory();
      const isFile = ent.isFile();
      const matchesType = (type === 'f' && isFile) || (type === 'd' && isDir) || (type === 'any');
      const matchesGlob = !rx || rx.test(ent.name);
      if (matchesType && matchesGlob) out.push(full);
      if (isDir && depth < maxDepth) walk(full, depth + 1);
    }
  }
  walk(dir, 1);
  return out;
}

function safeStat(p) { try { return fs.statSync(p); } catch { return null; } }

function olderThan(filepath, days) {
  const st = safeStat(filepath);
  return st && (NOW - st.mtimeMs) > days * DAY_MS;
}

function safeUnlink(p) { try { fs.unlinkSync(p); return true; } catch { return false; } }
function safeRmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); return true; } catch { return false; } }
function safeMv(src, dst) { try { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.renameSync(src, dst); return true; } catch { return false; } }

function appendJsonl(record) {
  try { fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true }); fs.appendFileSync(LOG_PATH, JSON.stringify(record) + '\n'); } catch {}
}

// ── rule handlers ───────────────────────────────────────────────────────

function handleAgePrune(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { deleted: [], skipped: ['no-dir'] };
  const files = listEntries(dir, { glob: rule.glob, maxDepth: rule.max_depth || 1, type: 'f' });
  const victims = files.filter(f => olderThan(f, rule.age_days));
  if (DRY_RUN) return { would_delete: victims.slice(0, 50), total: victims.length };
  const deleted = []; for (const v of victims) if (safeUnlink(v)) deleted.push(v);
  return { deleted_count: deleted.length };
}

function handleAgeAndCount(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { deleted: [], skipped: ['no-dir'] };
  const files = listEntries(dir, { glob: rule.glob, maxDepth: rule.max_depth || 1, type: 'f' });
  const ageVictims = files.filter(f => olderThan(f, rule.age_days));
  const survivors = files.filter(f => !ageVictims.includes(f));
  survivors.sort((a, b) => (safeStat(b)?.mtimeMs || 0) - (safeStat(a)?.mtimeMs || 0));
  const countVictims = survivors.slice(rule.keep_last);
  const victims = [...ageVictims, ...countVictims];
  if (DRY_RUN) return { would_delete: victims.slice(0, 50), total: victims.length, age_prune: ageVictims.length, count_prune: countVictims.length };
  let deleted = 0; for (const v of victims) if (safeUnlink(v)) deleted++;
  return { deleted_count: deleted, age_prune: ageVictims.length, count_prune: countVictims.length };
}

function handleKeepLast(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { deleted: [], skipped: ['no-dir'] };
  const files = listEntries(dir, { glob: rule.glob, maxDepth: rule.max_depth || 1, type: 'f' });
  files.sort((a, b) => (safeStat(b)?.mtimeMs || 0) - (safeStat(a)?.mtimeMs || 0));
  const victims = files.slice(rule.keep_last);
  if (DRY_RUN) return { would_delete: victims, total: victims.length, kept: Math.min(files.length, rule.keep_last) };
  let deleted = 0; for (const v of victims) if (safeUnlink(v)) deleted++;
  return { deleted_count: deleted, kept: Math.min(files.length, rule.keep_last) };
}

function handleDeleteMatchingDirs(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { deleted: [], skipped: ['no-dir'] };
  const victims = listEntries(dir, { maxDepth: 5, type: 'd' }).filter(d => path.basename(d) === rule.dir_name);
  if (DRY_RUN) return { would_delete: victims, total: victims.length };
  let deleted = 0; for (const v of victims) if (safeRmrf(v)) deleted++;
  return { deleted_count: deleted };
}

function handleAgePruneDirs(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { deleted: [], skipped: ['no-dir'] };
  const subs = listEntries(dir, { maxDepth: 1, type: 'd' });
  const victims = subs.filter(s => olderThan(s, rule.age_days));
  if (DRY_RUN) return { would_delete: victims, total: victims.length };
  let deleted = 0; for (const v of victims) if (safeRmrf(v)) deleted++;
  return { deleted_count: deleted };
}

function handleGzipThenTrash(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { skipped: ['no-dir'] };
  const rx = globToRegex(rule.glob);
  const gzRx = globToRegex(rule.glob + '.gz');
  // Walk to the specified depth level finding matching jsonl and jsonl.gz
  const files = [];
  const gzipped = [];
  function walk(d, depth) {
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory() && depth < rule.depth) walk(full, depth + 1);
      else if (ent.isFile() && depth === rule.depth) {
        if (rx && rx.test(ent.name)) files.push(full);
        else if (gzRx && gzRx.test(ent.name)) gzipped.push(full);
      }
    }
  }
  walk(dir, 1);
  const minBytes = rule.gzip_min_size_mb * 1_048_576;
  const gzipCandidates = files.filter(f => {
    const st = safeStat(f);
    return st && (NOW - st.mtimeMs) > rule.gzip_age_days * DAY_MS && st.size > minBytes;
  });
  const trashCandidates = gzipped.filter(f => olderThan(f, rule.trash_age_days));
  if (DRY_RUN) return { would_gzip: gzipCandidates.slice(0, 50), would_trash: trashCandidates.slice(0, 50), gzip_total: gzipCandidates.length, trash_total: trashCandidates.length };
  let gzippedN = 0;
  for (const src of gzipCandidates) {
    try {
      const data = fs.readFileSync(src);
      fs.writeFileSync(src + '.gz', zlib.gzipSync(data));
      fs.unlinkSync(src);
      gzippedN++;
    } catch {}
  }
  let trashedN = 0;
  for (const src of trashCandidates) {
    const dst = path.join(rule.trash_dir, path.basename(src));
    if (safeMv(src, dst)) trashedN++;
  }
  return { gzipped_count: gzippedN, trashed_count: trashedN };
}

function handlePerProjectUuidDirs(rule) {
  const dir = resolvePath(rule.path);
  if (!safeStat(dir)) return { skipped: ['no-dir'] };
  const uuidRx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let ageDeleted = 0, countDeleted = 0, victims = [];
  let projects = [];
  try { projects = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()); } catch {}
  for (const proj of projects) {
    const projPath = path.join(dir, proj.name);
    let sessions = [];
    try { sessions = fs.readdirSync(projPath, { withFileTypes: true }).filter(e => e.isDirectory() && uuidRx.test(e.name)).map(e => path.join(projPath, e.name)); } catch { continue; }
    const ageVictims = sessions.filter(s => olderThan(s, rule.age_days));
    const survivors = sessions.filter(s => !ageVictims.includes(s));
    survivors.sort((a, b) => (safeStat(b)?.mtimeMs || 0) - (safeStat(a)?.mtimeMs || 0));
    const countVictims = survivors.slice(rule.keep_last);
    victims.push(...ageVictims, ...countVictims);
    if (!DRY_RUN) {
      for (const v of ageVictims) if (safeRmrf(v)) ageDeleted++;
      for (const v of countVictims) if (safeRmrf(v)) countDeleted++;
    }
  }
  if (DRY_RUN) return { would_delete: victims.slice(0, 100), total: victims.length };
  return { age_deleted: ageDeleted, count_deleted: countDeleted };
}

function handleWeeklyNag(rule) {
  const stateFile = resolvePath(rule.state);
  let lastNag = 0;
  try { lastNag = parseInt(fs.readFileSync(stateFile, 'utf8'), 10) || 0; } catch {}
  const dueSec = 7 * 86400;
  const nowSec = Math.floor(NOW / 1000);
  if (nowSec - lastNag < dueSec) return { skipped: ['nag-not-due'] };
  // Run the check script; it prints nag text to stdout if it fires, exits 0 in either case.
  const scriptPath = resolvePath(rule.check);
  const res = spawnSync(process.execPath, [scriptPath, CLAUDE_DIR], { encoding: 'utf8' });
  const nag = (res.stdout || '').trim();
  if (nag) {
    process.stdout.write(nag + '\n');
    if (!DRY_RUN) { try { fs.writeFileSync(stateFile, String(nowSec)); } catch {} }
    return { nagged: true, nag_length: nag.length };
  }
  return { nagged: false };
}

function handleCustom(rule) {
  const scriptPath = resolvePath(rule.script);
  const args = DRY_RUN ? [scriptPath, CLAUDE_DIR, '--dry-run'] : [scriptPath, CLAUDE_DIR];
  const res = spawnSync(process.execPath, args, { encoding: 'utf8' });
  try { return JSON.parse(res.stdout || '{}'); }
  catch { return { stdout: (res.stdout || '').slice(0, 500) }; }
}

const HANDLERS = {
  'age-prune': handleAgePrune,
  'age-and-count': handleAgeAndCount,
  'keep-last': handleKeepLast,
  'delete-matching-dirs': handleDeleteMatchingDirs,
  'age-prune-dirs': handleAgePruneDirs,
  'gzip-then-trash': handleGzipThenTrash,
  'per-project-uuid-dirs': handlePerProjectUuidDirs,
  'weekly-nag': handleWeeklyNag,
  'custom': handleCustom,
};

// ── main ────────────────────────────────────────────────────────────────

function main() {
  let config;
  try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch (e) { process.stderr.write(`cleanup-runner: cannot read config: ${e.message}\n`); return; }
  const rules = (config.rules || []).filter(r => !ONLY || r.name === ONLY);
  const sessionId = process.env.CLAUDE_SESSION_ID || `local-${Date.now()}`;
  for (const rule of rules) {
    const handler = HANDLERS[rule.mode];
    const start = Date.now();
    let result;
    if (!handler) { result = { error: `unknown mode: ${rule.mode}` }; }
    else { try { result = handler(rule); } catch (e) { result = { error: e.message }; } }
    const record = { ts: new Date().toISOString(), session_id: sessionId, rule: rule.name, mode: rule.mode, duration_ms: Date.now() - start, dry_run: DRY_RUN, ...result };
    if (JSON_MODE || DRY_RUN) process.stdout.write(JSON.stringify(record) + '\n');
    else appendJsonl(record);
  }
}

main();
