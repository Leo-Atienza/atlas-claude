#!/usr/bin/env node
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
  const cache = readJson(path.join(CACHE, 'scheduled-tasks-latest.json'));
  if (!cache || !Array.isArray(cache.tasks)) return null;
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

function detectToolFailureStreak(cfg) {
  const h = readJson(path.join(LOGS, 'tool-health.json'));
  if (!h || !h.tools) return null;
  const weeks = cfg.tool_failure_weeks;
  const weekStart = (i) => NOW - (i + 1) * 7 * DAY_MS;
  const candidates = [];
  for (const [name, v] of Object.entries(h.tools)) {
    const failures = (v.failures || []).map(parseTs).filter(t => t != null);
    if (failures.length === 0) continue;
    let weeksWithFailures = 0;
    for (let i = 0; i < weeks; i++) {
      const lo = weekStart(i), hi = i === 0 ? NOW : weekStart(i - 1);
      if (failures.some(t => t >= lo && t < hi)) weeksWithFailures++;
    }
    if (weeksWithFailures >= weeks) candidates.push({ name, total: v.total_failures || failures.length, is_mcp: !!v.is_mcp });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.total - a.total);
  const top = candidates[0];
  return {
    kind: 'tool_failure_streak',
    target: top.name,
    message: `tool \`${top.name}\` has had failures every week for ${weeks} consecutive weeks (${top.total} total).` +
      (top.is_mcp ? ' Consider disabling its MCP server in `.mcp.json` if the functionality isn\'t needed.' : ''),
    apply_command: top.is_mcp
      ? `edit .mcp.json to disable the MCP server serving ${top.name}`
      : `investigate chronic failures in ${top.name}`,
  };
}

function detectSkillUnused(cfg) {
  const records = readJsonl(path.join(LOGS, 'skill-usage.jsonl'));
  if (!records) return null; // no instrumentation data → can't propose
  const cutoff = NOW - cfg.skill_unused_days * DAY_MS;
  const usedRecently = new Set();
  for (const r of records) {
    const t = parseTs(r.ts);
    if (t != null && t >= cutoff) usedRecently.add(r.skill);
  }
  // Active skills = directories under skills/ with a SKILL.md, AND must be
  // older than the unused-days threshold (don't propose archiving a 2-day-old
  // skill just because no one ran it yet).
  const skillsDir = path.join(CLAUDE_DIR, 'skills');
  let dirents;
  try { dirents = fs.readdirSync(skillsDir, { withFileTypes: true }); } catch { return null; }
  const candidates = [];
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    const name = d.name;
    if (usedRecently.has(name)) continue;
    const skillMd = path.join(skillsDir, name, 'SKILL.md');
    let stat; try { stat = fs.statSync(skillMd); } catch { continue; }
    // Must be older than threshold AND unused throughout the log.
    if (stat.mtimeMs > cutoff) continue;
    const everUsed = records.some(r => r.skill === name);
    if (everUsed) continue;
    candidates.push({ name, ageDays: Math.floor((NOW - stat.mtimeMs) / DAY_MS) });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.ageDays - a.ageDays);
  const top = candidates[0];
  return {
    kind: 'skill_unused',
    target: top.name,
    message: `skill \`${top.name}\` has ${top.ageDays}d on disk and 0 invocations — consider archiving or refining its trigger description.`,
    apply_command: `mv ~/.claude/skills/${top.name} ~/.claude/skills/_archived/${top.name}`,
    extra: { candidate_count: candidates.length },
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
  if (!proposal) return;

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
