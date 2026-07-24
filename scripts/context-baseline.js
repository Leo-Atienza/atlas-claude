#!/usr/bin/env node
/**
 * context-baseline.js — F1a (ATLAS v9 Wave 1).
 * ============================================================================
 * A STABLE YARDSTICK for the "session-start / always-in-context overhead" that
 * every later "net context must not grow" check (A3 instincts, A7 inbox, the
 * §11 standing gate, F1b cut pass) measures against.
 *
 * It measures a FIXED, well-defined set of file-backed inputs so deltas across
 * runs are meaningful. Absolute token counts are chars/4 estimates — the point
 * is the DELTA, not a perfect token count.
 *
 * Components measured (each: bytes + est_tokens):
 *   1. CLAUDE.md                      — always in the system prompt
 *   2. session-start injection        — the hook's file-backed pieces, honoring
 *      the hook's own caps (vault orientation 2000c, system digest 2500c):
 *        - SESSION HOT CACHE (per-CWD L1)   cache/session-hot/<cwd-slug>.md
 *        - WIKI HOT CACHE (hot.md last 5 table rows)
 *        - VAULT ORIENTATION (personal/_index.md body, capped 2000c)
 *        - active-system digest (capped 2500c) — measured generically if present
 *   3. skills metadata surface        — count + total `description:` chars across
 *      top-level skills SKILL.md files (the description is ALWAYS in context; the
 *      body loads on demand — long descriptions are the tax F1b targets)
 *   4. MCP surface                    — enabled server count (proxy for tool-list
 *      weight; exact schema bytes aren't script-visible)
 *
 * Writes cache/context-baseline.json (a dated ARRAY — appends a new snapshot each
 * run so the trend is visible) and prints a human summary.
 *
 * Usage:  node scripts/context-baseline.js            # measure + append snapshot
 *         node scripts/context-baseline.js --print    # show latest, don't append
 *         node scripts/context-baseline.js --compare  # latest vs first, delta table
 *
 * Fail-soft: a missing source contributes 0 and is noted, never throws.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const VAULT = path.join(HOME, 'Documents', 'Wiki', 'wiki');
const OUT = path.join(CLAUDE_DIR, 'cache', 'context-baseline.json');

const estTokens = (chars) => Math.round(chars / 4);

function safeStatBytes(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}
function safeRead(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// ── 1. CLAUDE.md ────────────────────────────────────────────────────────────
function measureClaudeMd() {
  const p = path.join(CLAUDE_DIR, 'CLAUDE.md');
  const bytes = safeStatBytes(p);
  return { source: 'CLAUDE.md', bytes, est_tokens: estTokens(bytes), present: bytes > 0 };
}

// ── 2. Session-start injection (file-backed pieces, honoring hook caps) ───────
function measureSessionStart() {
  const parts = [];

  // WIKI HOT CACHE — hot.md last 5 table rows (the hook does `tail`/`head -5` on rows)
  const hotMd = safeRead(path.join(VAULT, 'hot.md'));
  const hotRows = hotMd.split('\n').filter((l) => l.trim().startsWith('|')).slice(-5).join('\n');
  parts.push({ piece: 'wiki_hot_cache', bytes: Buffer.byteLength(hotRows, 'utf8') });

  // VAULT ORIENTATION — personal/_index.md body after 2nd `---`, capped 2000c (hook cap)
  const pIdx = safeRead(path.join(VAULT, 'personal', '_index.md'));
  let body = pIdx;
  const m = pIdx.split(/^---$/m);
  if (m.length >= 3) body = m.slice(2).join('---'); // after the 2nd '---'
  const orientation = body.slice(0, 2000);
  parts.push({ piece: 'vault_orientation', bytes: Buffer.byteLength(orientation, 'utf8'), capped_at: 2000 });

  // SESSION HOT CACHE (per-CWD L1) — measure the largest existing session-hot file as representative
  let hotCacheBytes = 0;
  try {
    const dir = path.join(CLAUDE_DIR, 'cache', 'session-hot');
    const files = fs.readdirSync(dir).map((f) => safeStatBytes(path.join(dir, f)));
    hotCacheBytes = files.length ? Math.max(...files) : 0;
  } catch { /* dir may not exist */ }
  parts.push({ piece: 'session_hot_cache_max', bytes: hotCacheBytes });

  // Active-system digest cap (2500c) — representative if any per-CWD digest exists
  let digestBytes = 0;
  try {
    const dir = path.join(CLAUDE_DIR, 'cache', 'active-system');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => safeStatBytes(path.join(dir, f)));
    digestBytes = files.length ? Math.min(2500, Math.max(...files)) : 0;
  } catch { /* optional */ }
  parts.push({ piece: 'active_system_digest', bytes: digestBytes, capped_at: 2500 });

  const bytes = parts.reduce((s, p) => s + p.bytes, 0);
  return { source: 'session_start_injection', bytes, est_tokens: estTokens(bytes), parts };
}

// ── 3. Skills metadata surface (description: is always in context) ────────────
function measureSkillsMetadata() {
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  let count = 0;
  let descChars = 0;
  let entries = [];
  try { entries = fs.readdirSync(skillsDir, { withFileTypes: true }); } catch { entries = []; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('_')) continue; // _archived, _external
    const skillMd = path.join(skillsDir, e.name, 'SKILL.md');
    const txt = safeRead(skillMd);
    if (!txt) continue;
    count++;
    // description: can be single-line or a folded block; capture up to the next top-level key
    const fmMatch = txt.match(/^---\n([\s\S]*?)\n---/);
    const fm = fmMatch ? fmMatch[1] : txt.slice(0, 1200);
    const dm = fm.match(/^description:\s*([\s\S]*?)(?:\n[a-zA-Z_-]+:\s|\n*$)/m);
    if (dm) descChars += dm[1].trim().length;
  }
  return {
    source: 'skills_metadata',
    skill_dirs_with_frontmatter: count,
    total_description_chars: descChars,
    est_tokens: estTokens(descChars),
    note: 'top-level skills/*/SKILL.md description fields (always-in-context tax; symlinked ecosystem skills excluded from this count)',
  };
}

// ── 4. MCP surface (proxy) ────────────────────────────────────────────────────
function measureMcpSurface() {
  const servers = new Set();
  // root .mcp.json (project) + Claude Desktop config
  const tryJson = (p) => { try { return JSON.parse(safeRead(p)); } catch { return null; } };
  const rootMcp = tryJson(path.join(CLAUDE_DIR, '.mcp.json'));
  if (rootMcp && rootMcp.mcpServers) Object.keys(rootMcp.mcpServers).forEach((k) => servers.add('root:' + k));
  const desktop = tryJson(path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json'));
  if (desktop && desktop.mcpServers) Object.keys(desktop.mcpServers).forEach((k) => servers.add('desktop:' + k));
  return { source: 'mcp_surface', enabled_server_count: servers.size, servers: [...servers], note: 'server count is a proxy for tool-list weight; exact schema bytes are not script-visible' };
}

function measure() {
  const claudeMd = measureClaudeMd();
  const sessionStart = measureSessionStart();
  const skills = measureSkillsMetadata();
  const mcp = measureMcpSurface();
  const totalAlwaysInContextTokens =
    claudeMd.est_tokens + sessionStart.est_tokens + skills.est_tokens;
  return {
    // date is passed in — this script may run under a harness that forbids Date.now();
    // callers stamp it. Standalone run uses the OS date via a child shell (see main()).
    components: { claudeMd, sessionStart, skills, mcp },
    totals: {
      always_in_context_est_tokens: totalAlwaysInContextTokens,
      breakdown_est_tokens: {
        claude_md: claudeMd.est_tokens,
        session_start: sessionStart.est_tokens,
        skills_descriptions: skills.est_tokens,
      },
    },
  };
}

function loadSnapshots() {
  try {
    const arr = JSON.parse(safeRead(OUT));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function fmt(n) { return n.toLocaleString('en-US'); }

function printSnapshot(s) {
  const t = s.totals;
  console.log(`# context baseline — ${s.date || '(undated)'}`);
  console.log(`\nAlways-in-context est. tokens: **${fmt(t.always_in_context_est_tokens)}**`);
  console.log(`  · CLAUDE.md:            ${fmt(t.breakdown_est_tokens.claude_md)} tok (${fmt(s.components.claudeMd.bytes)} bytes)`);
  console.log(`  · session-start inject: ${fmt(t.breakdown_est_tokens.session_start)} tok (${fmt(s.components.sessionStart.bytes)} bytes)`);
  console.log(`  · skills descriptions:  ${fmt(t.breakdown_est_tokens.skills_descriptions)} tok (${fmt(s.components.skills.total_description_chars)} chars, ${s.components.skills.skill_dirs_with_frontmatter} skills)`);
  console.log(`  · MCP servers (proxy):  ${s.components.mcp.enabled_server_count}`);
}

function main() {
  const arg = process.argv[2];
  const snaps = loadSnapshots();

  if (arg === '--print') {
    if (!snaps.length) return console.log('No baseline recorded yet. Run without --print to create one.');
    return printSnapshot(snaps[snaps.length - 1]);
  }
  if (arg === '--compare') {
    if (snaps.length < 2) return console.log('Need >=2 snapshots to compare.');
    const first = snaps[0], last = snaps[snaps.length - 1];
    const d = last.totals.always_in_context_est_tokens - first.totals.always_in_context_est_tokens;
    const pct = first.totals.always_in_context_est_tokens ? ((d / first.totals.always_in_context_est_tokens) * 100).toFixed(1) : '0';
    console.log(`baseline ${first.date} → ${last.date}`);
    console.log(`always-in-context: ${fmt(first.totals.always_in_context_est_tokens)} → ${fmt(last.totals.always_in_context_est_tokens)} tok  (${d >= 0 ? '+' : ''}${fmt(d)}, ${d >= 0 ? '+' : ''}${pct}%)`);
    return;
  }

  // Measure + append. Date via env (harness may forbid Date in-process; callers can pass BASELINE_DATE).
  const snap = measure();
  snap.date = process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10);
  snap.note = arg || 'baseline';
  snaps.push(snap);
  try {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(snaps, null, 2));
  } catch (e) { console.error('write failed:', e.message); }
  printSnapshot(snap);
  console.log(`\n(snapshot #${snaps.length} appended to cache/context-baseline.json)`);
}

if (require.main === module) main();
module.exports = { measure };
