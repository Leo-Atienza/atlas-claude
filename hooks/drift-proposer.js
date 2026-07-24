#!/usr/bin/env node
require('./lib'); // F5: auto-instrument per-hook health on exit (lib.js IIFE)
/**
 * ATLAS v7.0 — Auto-Drift Proposer (Wave E).
 *
 * Runs as a §8a step in hooks/session-start.sh. Reads existing telemetry,
 * detects at most ONE drift condition per session, prints a single advisory
 * line to stdout, and persists the proposal so `/apply-drift-fix` can act.
 *
 * Channels (evaluated in priority order — first hit wins):
 *   1. scheduled_task_drift — lastRunAt older than cron window + N hours.
 *   2. cleanup_rule_errors  — rule errored on its last N consecutive runs.
 *   3. tool_failure_streak  — tool has had failures in each of the last N weeks.
 *   4. skill_unused         — active skill with 0 invocations in last N days
 *                             AND created >N days ago.
 *
 * Per-kind cooldown prevents re-proposing the same category hourly.
 * Global `max_proposals_per_session` enforces the scope-doc "1 per session" cap.
 *
 * Silences: any kind listed in `silenced_kinds` (in drift-thresholds.json) is
 * skipped. Fail-open: any error = silent exit 0.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.resolve(__dirname, '..');
const LOGS = path.join(CLAUDE_DIR, 'logs');
const CACHE = path.join(CLAUDE_DIR, 'cache');
const CONFIG_PATH = path.join(__dirname, 'drift-thresholds.json');
const LAST_PROPOSAL_PATH = path.join(CACHE, 'last-drift-proposal.json');

const NOW = Date.now();
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function readJsonl(p, { limit = 0 } = {}) {
  try {
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split('\n').filter(l => l.trim());
    const slice = limit > 0 ? lines.slice(-limit) : lines;
    return slice.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return null; }
}
function parseTs(t) {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') { const v = Date.parse(t); return Number.isNaN(v) ? null : v; }
  return null;
}
function parseCronWindowHours(expr) {
  if (typeof expr !== 'string') return null;
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [, hour, dom, , dow] = parts;
  if (dow !== '*' && dow !== '?') return 7 * 24;
  if (dom !== '*' && dom !== '?') return 31 * 24;
  if (hour !== '*' && /^\d+$/.test(hour)) return 24;
  return 24;
}

// ─── detectors ────────────────────────────────────────────────────────────

function detectScheduledTaskDrift(cfg) {
  const cachePath = path.join(CACHE, 'scheduled-tasks-latest.json');
  const cache = readJson(cachePath);
  if (!cache || !Array.isArray(cache.tasks)) return null;
  // Staleness guard (fallback): never compute drift on a stale cache — stale
  // lastRunAt values make on-time tasks look hundreds of hours late. In normal
  // operation refresh-scheduled-cache.js (session-start §8·pre) keeps this
  // fresh; this only trips if that refresh failed (e.g. AppData path moved).
  const maxAgeH = cfg.scheduled_cache_max_age_hours;
  if (maxAgeH) {
    const refreshed = parseTs(cache.refreshed_at);
    let age;
    if (refreshed != null) age = NOW - refreshed;
    else { try { age = NOW - fs.statSync(cachePath).mtimeMs; } catch { age = Infinity; } }
    if (age > maxAgeH * HOUR_MS) return null;
  }
  const budget = cfg.scheduled_task_drift_hours * HOUR_MS;
  const worst = cache.tasks
    .filter(t => t.enabled !== false)
    .map(t => {
      const last = parseTs(t.lastRunAt);
      const windowH = parseCronWindowHours(t.cronExpression || t.cron);
      if (!last || !windowH) return null;
      const drift = NOW - last - windowH * HOUR_MS;
      return drift > budget ? { task: t.taskId || t.id, drift_ms: drift } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.drift_ms - a.drift_ms)[0];
  if (!worst) return null;
  const hours = Math.round(worst.drift_ms / HOUR_MS);
  return {
    kind: 'scheduled_task_drift',
    target: worst.task,
    message: `scheduled task \`${worst.task}\` is ${hours}h late (missed its window + ${cfg.scheduled_task_drift_hours}h grace).`,
    apply_command: `mcp__scheduled-tasks__update_scheduled_task taskId=${worst.task} (re-trigger manually)`,
  };
}

function detectCleanupRuleErrors(cfg) {
  const records = readJsonl(path.join(LOGS, 'cleanup.jsonl'), { limit: 500 });
  if (!records) return null;
  const byRule = new Map();
  for (const r of records) {
    if (!r.rule) continue;
    if (!byRule.has(r.rule)) byRule.set(r.rule, []);
    byRule.get(r.rule).push(r);
  }
  for (const [rule, runs] of byRule) {
    const tail = runs.slice(-cfg.cleanup_rule_error_streak);
    if (tail.length < cfg.cleanup_rule_error_streak) continue;
    if (tail.every(r => !!r.error)) {
      return {
        kind: 'cleanup_rule_errors',
        target: rule,
        message: `cleanup rule \`${rule}\` has errored on its last ${cfg.cleanup_rule_error_streak} runs (last: ${tail[tail.length - 1].error}).`,
        apply_command: `inspect hooks/cleanup-config.json entry '${rule}' and the matching hooks/cleanup-rules/*.js`,
      };
    }
  }
  return null;
}

// Failures that reflect the remote host/network, not a fault in our tooling.
// A 404, an expired cert on the target site, a refused socket, or Claude Code's
// own domain blocklist (e.g. reddit.com) say nothing about whether the tool
// itself is healthy — they should NOT accumulate into a chronic-failure streak.
const EXTERNAL_FAILURE_PATTERNS = [
  /status code [45]\d\d/i,                 // remote HTTP 4xx/5xx
  /\bHTTP (4\d\d|5\d\d)\b/i,
  /certificate has expired/i,
  /\bECONN(REFUSED|RESET)\b/i,
  /\bENOTFOUND\b|\bEAI_AGAIN\b/i,
  /socket (connection was closed|hang up)/i,
  /timeout of \d+ms exceeded/i,             // fetch/axios client timeout (remote slow) — NOT Preview's "timed out after Ns"
  /unable to fetch from/i,                  // CC domain blocklist
];
function isExternalFailure(msg) {
  return typeof msg === 'string' && EXTERNAL_FAILURE_PATTERNS.some(re => re.test(msg));
}

// Environment/usage failures that aren't a fault in the tool itself — a port
// already held by the user's own dev server, a server already running, or the
// agent calling an MCP tool with bad/missing args (schema validation). Like the
// external set, these must NOT accumulate into a chronic-failure streak.
// (Added 2026-06-25: Claude Preview's preview_start failures were 100% this
// class — "port 3000 in use", "already running", "Invalid arguments … Required" —
// yet were counted, producing a recurring, non-actionable "disable the MCP"
// proposal for a healthy, harness-managed server that isn't even in .mcp.json.)
const USAGE_FAILURE_PATTERNS = [
  /port \d+ is in use/i,
  /already running/i,
  /address already in use|EADDRINUSE/i,
  /invalid arguments for tool/i,
  /input validation error/i,
  /\b-32602\b/,                       // JSON-RPC "invalid params" (MCP arg validation)
];
function isUsageFailure(msg) {
  return typeof msg === 'string' && USAGE_FAILURE_PATTERNS.some(re => re.test(msg));
}
function isBenignFailure(msg) {
  return isExternalFailure(msg) || isUsageFailure(msg);
}

// A tool_failure_streak proposal should only tell the user to disable an MCP
// server in .mcp.json when that server is ACTUALLY in a local .mcp.json /
// ~/.claude.json. Harness-managed built-in MCPs (Claude_Browser/Claude_Preview, Claude_in_Chrome,
// computer-use, MCP_DOCKER, …) are in no local config, so "edit .mcp.json to
// disable it" is non-actionable. (Added 2026-06-25.)
function mcpServerName(toolName) {
  const parts = String(toolName).split('__');
  return parts.length >= 3 && parts[0] === 'mcp' ? parts[1] : null;
}
function isMcpServerInConfig(server) {
  if (!server) return false;
  for (const f of [path.join(CLAUDE_DIR, '.mcp.json'), path.join(path.dirname(CLAUDE_DIR), '.claude.json')]) {
    const j = readJson(f);
    if (j && j.mcpServers && Object.keys(j.mcpServers).some(k => k.toLowerCase() === server.toLowerCase())) return true;
  }
  return false;
}

function detectToolFailureStreak(cfg) {
  const h = readJson(path.join(LOGS, 'tool-health.json'));
  if (!h || !h.tools) return null;
  const weeks = cfg.tool_failure_weeks;
  const weekStart = (i) => NOW - (i + 1) * 7 * DAY_MS;

  // Cross-reference the detailed failure log so benign failures — external
  // (remote 4xx/5xx, expired certs, blocked domains) AND environment/usage
  // (port-in-use, already-running, bad MCP args) — don't masquerade as a broken
  // tool. tool-health.json keeps only bare timestamps; tool-failures.jsonl carries
  // the error text. The two are written by separate Date.now() calls a few ms
  // apart, so match by tool + a small time tolerance rather than exact equality.
  // Missing/unreadable log → empty map → identical behaviour to before (fail-open).
  const TS_TOL_MS = 2000;
  const detail = readJsonl(path.join(LOGS, 'tool-failures.jsonl'), { limit: 4000 }) || [];
  const benignTs = new Map(); // tool -> number[] (benign failure ts in ms)
  for (const r of detail) {
    if (!r || !r.tool || !isBenignFailure(r.error)) continue;
    const t = parseTs(r.ts);
    if (t == null) continue;
    if (!benignTs.has(r.tool)) benignTs.set(r.tool, []);
    benignTs.get(r.tool).push(t);
  }
  const isBenignAt = (name, t) => {
    const arr = benignTs.get(name);
    return !!arr && arr.some(e => Math.abs(e - t) <= TS_TOL_MS);
  };

  const candidates = [];
  for (const [name, v] of Object.entries(h.tools)) {
    const failures = (v.failures || [])
      .map(parseTs)
      .filter(t => t != null && !isBenignAt(name, t));
    if (failures.length === 0) continue;
    let weeksWithFailures = 0;
    for (let i = 0; i < weeks; i++) {
      const lo = weekStart(i), hi = i === 0 ? NOW : weekStart(i - 1);
      if (failures.some(t => t >= lo && t < hi)) weeksWithFailures++;
    }
    if (weeksWithFailures >= weeks) candidates.push({ name, total: failures.length, is_mcp: !!v.is_mcp });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.total - a.total);
  const top = candidates[0];
  const server = top.is_mcp ? mcpServerName(top.name) : null;
  const configurable = top.is_mcp && isMcpServerInConfig(server);  // can it actually be disabled in .mcp.json?
  return {
    kind: 'tool_failure_streak',
    target: top.name,
    message: `tool \`${top.name}\` has had non-benign failures every week for ${weeks} consecutive weeks (${top.total} in window).` +
      (configurable ? ` Consider disabling its MCP server \`${server}\` in \`.mcp.json\` if the functionality isn't needed.` : ''),
    apply_command: configurable
      ? `edit .mcp.json to disable the MCP server \`${server}\` serving ${top.name}`
      : `investigate chronic failures in ${top.name}` +
        (top.is_mcp ? ` (harness-managed MCP \`${server}\` — not in any local .mcp.json, so it can't be disabled there)` : ''),
  };
}

// Parse the curated active-skill registry (skills/ACTIVE-DIRECTORY.md is an
// index; the actual `skills/<name>/SKILL.md` paths live in the ACTIVE-PAGE-*.md
// files) for local skill directory names. These are the ONLY skills we propose
// archiving — excludes ecosystem symlinks, plugin packs, and anything already
// in _archived/ (none appear here). This is the cross-check that stops the
// proposer firing on already-archived or non-active skills.
function loadActiveSkillNames() {
  try {
    const dir = path.join(CLAUDE_DIR, 'skills');
    const files = fs.readdirSync(dir).filter(f => /^ACTIVE-.*\.md$/.test(f));
    if (!files.length) return null;
    const names = new Set();
    const re = /skills\/([A-Za-z0-9._-]+)\/SKILL\.md/g;
    for (const f of files) {
      let md; try { md = fs.readFileSync(path.join(dir, f), 'utf8'); } catch { continue; }
      let m;
      while ((m = re.exec(md)) !== null) names.add(m[1]);
    }
    return names;
  } catch { return null; }
}

// Per-target decline-memory (v10 U1-3, KNOWLEDGE-144): a target the user rejected
// via /review-proposals lands in cache/proposal-stats.json `declined_targets`
// (written by scripts/proposals.js on reject) and is never re-proposed.
function declinedTargets() {
  try {
    const stats = JSON.parse(fs.readFileSync(path.join(CACHE, 'proposal-stats.json'), 'utf8'));
    return new Set((stats.declined_targets || []).map(d => d.target));
  } catch { return new Set(); }
}

function detectSkillUnused(cfg) {
  const records = readJsonl(path.join(LOGS, 'skill-usage.jsonl'));
  if (!records) return null; // no instrumentation data → can't propose

  // Fused evidence (v10 U1): the ledger now carries BOTH explicit Skill-tool
  // rows ({skill}) and slash-expansion rows ({kind:"slash", name}), and
  // SKILL.md reads recorded by the action graph count as soft usage. Still
  // gate hard: only propose archiving a skill that is (a) listed active,
  // (b) not already in _archived/, (c) unused across ALL fused sources, and
  // (d) not previously declined by the user (per-target decline-memory).
  const activeNames = loadActiveSkillNames();
  if (!activeNames || activeNames.size === 0) return null; // can't verify "active" → stay silent

  const cutoff = NOW - cfg.skill_unused_days * DAY_MS;
  // A logged "ns:leaf" (e.g. "hackathon:scope") counts as using both the full
  // value and the bare directory name "scope"/"hackathon" — prevents the
  // namespace mismatch that made every namespaced skill look unused.
  const leaf = (s) => String(s).split(':').pop();
  const usedRecently = new Set();
  const usedEver = new Set();
  const credit = (val, t) => {
    usedEver.add(val); usedEver.add(leaf(val));
    if (t != null && t >= cutoff) { usedRecently.add(val); usedRecently.add(leaf(val)); }
  };
  for (const r of records) {
    if (!r) continue;
    const name = r.skill || (r.kind === 'slash' && r.name) || null;
    if (name) credit(name, parseTs(r.ts));
  }
  // Soft evidence: SKILL.md reads from the action-graph per-session logs.
  try {
    const agDir = path.join(CLAUDE_DIR, 'atlas-action-graph');
    for (const f of fs.readdirSync(agDir).filter(x => x.endsWith('.jsonl'))) {
      for (const line of fs.readFileSync(path.join(agDir, f), 'utf8').split('\n')) {
        if (!line || !line.includes('SKILL.md')) continue;
        let r; try { r = JSON.parse(line); } catch { continue; }
        if (r.tool !== 'Read' || !r.target) continue;
        const m = String(r.target).replace(/\\/g, '/').match(/\/skills\/([^/]+)\/SKILL\.md$/i);
        if (m) credit(m[1], parseTs(r.ts_iso || r.ts));
      }
    }
  } catch { /* soft source — fine without it */ }

  const declined = declinedTargets();
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  const candidates = [];
  for (const name of activeNames) {
    if (usedRecently.has(name) || usedEver.has(name)) continue;
    if (declined.has(name)) continue; // the user said no — decline-memory
    if (fs.existsSync(path.join(skillsDir, '_archived', name))) continue; // already archived
    const skillMd = path.join(skillsDir, name, 'SKILL.md');
    let stat; try { stat = fs.statSync(skillMd); } catch { continue; } // not on disk → skip
    if (stat.mtimeMs > cutoff) continue; // too new to judge
    candidates.push({ name, ageDays: Math.floor((NOW - stat.mtimeMs) / DAY_MS) });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.ageDays - a.ageDays);
  const top = candidates[0];
  return {
    kind: 'skill_unused',
    target: top.name,
    message: `skill \`${top.name}\` is listed active but has ${top.ageDays}d on disk and no usage across the fused ledgers ` +
      `(Skill-tool + slash + SKILL.md reads). Confirm with \`node scripts/usage-report.js\` + a transcript search before archiving.`,
    apply_command: `mv ~/.claude/skills/${top.name} ~/.claude/skills/_archived/${top.name}`,
    extra: { candidate_count: candidates.length },
  };
}

// ─── channel 5: MCP server unused (v8.5, 2026-06-09) ──────────────────────
// MCP usage became measurable today (post-tool-monitor matcher now includes
// mcp__.*). tool-call-counts.json is a cumulative counter, so a _meta.since
// clock gates this channel: silent BY DESIGN until the data is ≥N days mature.
// Conservative matching: a server only counts as unused when NO counted tool
// key contains its (separator-normalized) name — false negatives are fine,
// false positives are not.
function detectMcpServerUnused(cfg) {
  const days = cfg.mcp_unused_days;
  if (!days) return null;
  const counts = readJson(path.join(LOGS, 'tool-call-counts.json'));
  if (!counts || !counts._meta || !counts._meta.since) return null;
  const since = parseTs(counts._meta.since);
  if (since == null || NOW - since < days * DAY_MS) return null; // data not mature yet

  const servers = new Set();
  for (const f of [
    path.join(CLAUDE_DIR, '.mcp.json'),
    path.join(path.dirname(CLAUDE_DIR), '.claude.json'),
  ]) {
    const j = readJson(f);
    for (const name of Object.keys((j && j.mcpServers) || {})) servers.add(name);
  }
  if (!servers.size) return null;

  const squash = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const seenKeys = Object.keys(counts)
    .filter((k) => k.startsWith('mcp__'))
    .map(squash);
  const unused = [...servers]
    .filter((s) => !seenKeys.some((k) => k.includes(squash(s))))
    .sort();
  if (!unused.length) return null;
  const sinceDate = new Date(since).toISOString().slice(0, 10);
  return {
    kind: 'mcp_server_unused',
    target: unused[0],
    message:
      `MCP server \`${unused[0]}\` has 0 tool calls since ${sinceDate} (${unused.length} unused total: ${unused.slice(0, 5).join(', ')}${unused.length > 5 ? ', …' : ''}). ` +
      `Each configured server costs session-start tool-surface; consider disabling it.`,
    apply_command: `Review the server's entry in ~/.claude/.mcp.json or ~/.claude.json (mcpServers) and remove/disable it — or keep it and silence this kind.`,
    extra: { unused_count: unused.length, since: sinceDate },
  };
}

// ─── channel 6: permission friction (v8.5, 2026-06-09) ────────────────────
// user-rejection-log.js now records PermissionRequest events (kind:"ask").
// Repeated asks for the same tool+pattern with ZERO denials = allowlist
// fodder. Groups containing any denial are excluded — ask-then-deny means the
// prompt is doing its job. Rows without a kind field (legacy/pre-hook denials)
// count as denials, which is the conservative direction.
function frictionKey(r) {
  const tool = r.tool || '';
  if (!tool) return null;
  try {
    const input = JSON.parse(r.input_summary || '{}');
    if (tool === 'Bash' && input.command) {
      const head = String(input.command).trim().split(/\s+/)[0];
      return head ? `Bash(${head}:*)` : 'Bash';
    }
    if (input.file_path) {
      const fp = String(input.file_path);
      const ext = path.extname(fp);
      return `${tool}(${ext || path.basename(path.dirname(fp)) || '*'})`;
    }
  } catch {
    /* unparseable input_summary → fall through to bare tool */
  }
  return tool; // MCP tools + everything else group by tool name
}

// Tools/patterns already in permissions.allow can't have their friction reduced
// by "add it to the allowlist" — it's already there. Proposing it anyway produced
// a recurring no-op loop (e.g. AskUserQuestion, which is allowlisted yet still
// emits PermissionRequest telemetry). Cross-check the live allowlist and skip any
// friction key whose full form OR base tool is already allowed.
function loadAllowedTools() {
  const out = new Set();
  for (const f of [
    path.join(CLAUDE_DIR, 'settings.json'),
    path.join(CLAUDE_DIR, 'settings.local.json'),
  ]) {
    const j = readJson(f);
    for (const a of (j && j.permissions && j.permissions.allow) || []) out.add(a);
  }
  return out;
}
function isAlreadyAllowed(key, allowed) {
  if (allowed.has(key)) return true;
  const base = key.includes('(') ? key.slice(0, key.indexOf('(')) : key;
  return allowed.has(base);
}

function detectPermissionFriction(cfg) {
  const days = cfg.permission_friction_days;
  const minAsks = cfg.permission_friction_min_asks;
  if (!days || !minAsks) return null;
  const rows = readJsonl(path.join(LOGS, 'user-rejections.jsonl'));
  if (!rows) return null;
  const cutoff = NOW - days * DAY_MS;
  const groups = new Map();
  for (const r of rows) {
    const t = parseTs(r && r.ts);
    if (t == null || t < cutoff) continue;
    const key = frictionKey(r);
    if (!key) continue;
    const g = groups.get(key) || { asks: 0, denies: 0 };
    if (r.kind === 'ask') g.asks++;
    else g.denies++;
    groups.set(key, g);
  }
  const allowed = loadAllowedTools();
  let top = null;
  for (const [key, g] of groups) {
    if (g.denies > 0 || g.asks < minAsks) continue;
    if (isAlreadyAllowed(key, allowed)) continue; // already allowlisted — re-proposing is a no-op
    if (!top || g.asks > top.g.asks) top = { key, g };
  }
  if (!top) return null;
  return {
    kind: 'permission_friction',
    target: top.key,
    message:
      `\`${top.key}\` triggered ${top.g.asks} permission dialogs in ${days}d with zero denials — ` +
      `an allowlist rule would remove that friction.`,
    apply_command: `Add "${top.key}" (or a tighter variant) to permissions.allow in ~/.claude/settings.json`,
    extra: { asks: top.g.asks },
  };
}

// ─── cooldown & session budget ────────────────────────────────────────────

function shouldSkipKind(kind, cfg, last) {
  if ((cfg.silenced_kinds || []).includes(kind)) return true;
  if (!last || !last.history) return false;
  const cooldownMs = (cfg.cooldown_hours_per_proposal_kind || 0) * HOUR_MS;
  const recent = last.history.filter(h => h.kind === kind);
  if (!recent.length) return false;
  const newest = recent.sort((a, b) => b.ts - a.ts)[0];
  return (NOW - newest.ts) < cooldownMs;
}

function sessionAlreadyProposed(last, cfg) {
  if (!last || !last.history) return false;
  // Scope the "max per session" to a 1-hour window so a single session
  // (which has no stable id at hook time) only sees one proposal.
  const max = cfg.max_proposals_per_session || 1;
  const recent = last.history.filter(h => NOW - h.ts < HOUR_MS);
  return recent.length >= max;
}

// ─── main ─────────────────────────────────────────────────────────────────

function main() {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return; } // misconfigured → silent

  const last = readJson(LAST_PROPOSAL_PATH) || { history: [] };
  if (!Array.isArray(last.history)) last.history = [];
  if (sessionAlreadyProposed(last, cfg)) return;

  const detectors = [
    detectScheduledTaskDrift,
    detectCleanupRuleErrors,
    detectToolFailureStreak,
    detectMcpServerUnused,
    detectPermissionFriction,
    detectSkillUnused,
  ];
  let proposal = null;
  for (const fn of detectors) {
    let p; try { p = fn(cfg); } catch { p = null; }
    if (!p) continue;
    if (shouldSkipKind(p.kind, cfg, last)) continue;
    proposal = p;
    break;
  }
  if (!proposal) {
    // No active drift this run. Clear any stale `current` so /apply-drift-fix
    // doesn't offer a phantom action for a proposal that has since resolved
    // (e.g. a scheduled task that's now on-time after a cache refresh).
    // Preserve history; only rewrite when there's actually something to clear.
    if (last.current) {
      try {
        fs.writeFileSync(
          LAST_PROPOSAL_PATH,
          JSON.stringify({ current: null, history: last.history }, null, 2),
        );
      } catch { /* fail-open */ }
    }
    return;
  }

  const record = {
    ts: NOW,
    ts_iso: new Date(NOW).toISOString(),
    ...proposal,
  };
  // Persist: overwrite `current`, keep rolling history (last 50).
  const next = {
    current: record,
    history: [...last.history, record].slice(-50),
  };
  try {
    fs.mkdirSync(path.dirname(LAST_PROPOSAL_PATH), { recursive: true });
    fs.writeFileSync(LAST_PROPOSAL_PATH, JSON.stringify(next, null, 2));
  } catch { /* fail-open */ }

  // User-visible line — one only, prefixed so it's greppable.
  process.stdout.write(`DRIFT: ${proposal.message} Run \`/apply-drift-fix\` to act.\n`);
}

main();
