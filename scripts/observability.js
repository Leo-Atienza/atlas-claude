#!/usr/bin/env node
/**
 * ATLAS v7.0 — Observability Dashboard
 *
 * Reads existing telemetry streams and emits a 6-section markdown dashboard to stdout.
 * Invoked by `/observe`, by weekly-maintenance step 2, or directly on the CLI.
 *
 * Sections:
 *   1. Tool health       — tool-health.json (30-day rolling failures, streak warnings)
 *   2. Safety hooks      — safety-hook-counts.json (per-check block/ask totals)
 *   3. Skill usage       — skill-usage.jsonl (top 20 by 30-day count, unused skills)
 *   4. Scheduled tasks   — cache/scheduled-tasks-latest.json (lastRunAt vs cron drift)
 *   5. Action graph      — action-graph-stats.jsonl (carryover health, aggregate stats)
 *   6. Cleanup           — logs/cleanup.jsonl (last-session per-rule summary)
 *
 * Every section is empty-safe: missing underlying log ⇒ header + "no data yet" line.
 * Fail-open: any per-section error degrades that section only, never aborts the run.
 *
 * Flags:
 *   --json          emit { generated_at, sections: { tool_health: [...], ... } } instead of markdown
 *   --section=NAME  restrict output to one section (tool_health|safety_hooks|skill_usage|
 *                   scheduled_tasks|action_graph|cleanup)
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs');
const CACHE_DIR = path.join(CLAUDE_DIR, 'cache');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const ONLY = (() => {
  const hit = args.find(a => a.startsWith('--section='));
  return hit ? hit.split('=')[1].trim() : null;
})();

const NOW = Date.now();
const DAY_MS = 86_400_000;
const THIRTY_DAYS_MS = 30 * DAY_MS;

// ─── helpers ──────────────────────────────────────────────────────────────

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function readJsonl(p, { limit = 0 } = {}) {
  try {
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split('\n').filter(l => l.trim());
    const slice = limit > 0 ? lines.slice(-limit) : lines;
    const out = [];
    for (const l of slice) {
      try { out.push(JSON.parse(l)); } catch { /* skip malformed */ }
    }
    return out;
  } catch { return null; }
}

function parseTs(ts) {
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const v = Date.parse(ts);
    return Number.isNaN(v) ? null : v;
  }
  return null;
}

function fmtAgo(ms) {
  if (ms == null || !Number.isFinite(ms)) return 'n/a';
  const delta = NOW - ms;
  if (delta < 0) return 'future';
  const h = Math.floor(delta / 3_600_000);
  if (h < 1) return `${Math.floor(delta / 60_000)}m ago`;
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function emptyNotice(msg) { return `_${msg}_`; }

// ─── section 1: tool health ───────────────────────────────────────────────

function sectionToolHealth() {
  const data = readJson(path.join(LOGS_DIR, 'tool-health.json'));
  if (!data || !data.tools) {
    return { md: emptyNotice('no tool-health.json yet'), rows: [] };
  }
  const rows = [];
  for (const [name, v] of Object.entries(data.tools)) {
    const failures = Array.isArray(v.failures) ? v.failures : [];
    const recent = failures
      .map(parseTs)
      .filter(t => t != null && NOW - t <= THIRTY_DAYS_MS)
      .length;
    if (recent === 0 && (v.consecutive_streak || 0) < 3) continue;
    rows.push({
      tool: name,
      recent_30d: recent,
      total: v.total_failures || 0,
      streak: v.consecutive_streak || 0,
      last_failure: parseTs(v.last_failure),
      is_mcp: !!v.is_mcp,
    });
  }
  rows.sort((a, b) => b.recent_30d - a.recent_30d || b.streak - a.streak);
  const top = rows.slice(0, 10);
  if (top.length === 0) {
    return { md: emptyNotice('no tool failures in the last 30 days'), rows: [] };
  }
  const lines = [
    '| Tool | 30d | Total | Streak | Last failure |',
    '|---|---:|---:|---:|---|',
  ];
  for (const r of top) {
    const streakTag = r.streak >= 3 ? ` **(${r.streak})**` : ` (${r.streak})`;
    const name = r.is_mcp ? `\`${r.tool}\` (MCP)` : `\`${r.tool}\``;
    lines.push(`| ${name} | ${r.recent_30d} | ${r.total} |${streakTag} | ${fmtAgo(r.last_failure)} |`);
  }
  const warnings = rows.filter(r => r.streak >= 3);
  if (warnings.length) {
    lines.push('');
    lines.push(`⚠ ${warnings.length} tool(s) with consecutive-failure streak ≥ 3 — see streak column.`);
  }
  return { md: lines.join('\n'), rows: top };
}

// ─── section 2: safety hooks ──────────────────────────────────────────────

function sectionSafetyHooks() {
  const data = readJson(path.join(LOGS_DIR, 'safety-hook-counts.json'));
  if (!data) {
    return { md: emptyNotice('no safety-hook-counts.json yet'), rows: [] };
  }
  const rows = [];
  for (const [name, v] of Object.entries(data)) {
    if (name === '_meta') continue;
    rows.push({
      check: name,
      block: v.block || 0,
      ask: v.ask || 0,
      last: parseTs(v.last),
    });
  }
  if (rows.length === 0) {
    return { md: emptyNotice('no safety-hook activity recorded'), rows: [] };
  }
  rows.sort((a, b) => (b.block + b.ask) - (a.block + a.ask));
  const lines = [
    '| Check | Blocked | Asked | Last fired |',
    '|---|---:|---:|---|',
  ];
  for (const r of rows) {
    lines.push(`| \`${r.check}\` | ${r.block} | ${r.ask} | ${fmtAgo(r.last)} |`);
  }
  return { md: lines.join('\n'), rows };
}

// ─── section 3: skill usage ───────────────────────────────────────────────

function listActiveSkills() {
  try {
    return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .filter(name => {
        try { return fs.existsSync(path.join(SKILLS_DIR, name, 'SKILL.md')); }
        catch { return false; }
      });
  } catch { return []; }
}

function sectionSkillUsage() {
  const records = readJsonl(path.join(LOGS_DIR, 'skill-usage.jsonl'));
  if (!records) {
    return {
      md: emptyNotice('no skill-usage.jsonl yet — run a few skills to populate'),
      rows: [],
    };
  }
  const since = NOW - THIRTY_DAYS_MS;
  const counts = new Map();
  const lastSeen = new Map();
  for (const r of records) {
    const t = parseTs(r.ts);
    if (t == null || t < since) continue;
    const skill = r.skill || 'unknown';
    counts.set(skill, (counts.get(skill) || 0) + 1);
    if (!lastSeen.has(skill) || lastSeen.get(skill) < t) lastSeen.set(skill, t);
  }
  const active = listActiveSkills();
  const used = new Set(counts.keys());
  const unused = active.filter(s => !used.has(s)).sort();

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([skill, count]) => ({ skill, count, last: lastSeen.get(skill) }));

  const lines = [];
  if (top.length === 0) {
    lines.push(emptyNotice('no skill invocations in the last 30 days'));
  } else {
    lines.push('**Top skills (last 30 days)**');
    lines.push('');
    lines.push('| Skill | Invocations | Last used |');
    lines.push('|---|---:|---|');
    for (const r of top) {
      lines.push(`| \`${r.skill}\` | ${r.count} | ${fmtAgo(r.last)} |`);
    }
  }

  if (active.length > 0) {
    lines.push('');
    lines.push(`**Unused (≥30d):** ${unused.length}/${active.length} active skills have no recorded invocation.`);
    if (unused.length > 0) {
      const preview = unused.slice(0, 12).map(s => `\`${s}\``).join(', ');
      const tail = unused.length > 12 ? `, … +${unused.length - 12} more` : '';
      lines.push(preview + tail);
    }
  }

  return {
    md: lines.join('\n'),
    rows: { top, unused, active_count: active.length },
  };
}

// ─── section 4: scheduled tasks ───────────────────────────────────────────

function parseCron(expr) {
  // returns approximate max inter-fire interval in hours for drift checks
  if (typeof expr !== 'string') return null;
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [, hour, dom, , dow] = parts;
  // Very rough classification: we only need "how many hours between fires (at most)".
  if (dow !== '*' && dow !== '?') return 7 * 24;     // weekly
  if (dom !== '*' && dom !== '?') return 31 * 24;    // monthly
  if (hour !== '*' && /^\d+$/.test(hour)) return 24; // daily at hour
  return 24;
}

function sectionScheduledTasks() {
  const cache = readJson(path.join(CACHE_DIR, 'scheduled-tasks-latest.json'));
  if (!cache || !Array.isArray(cache.tasks)) {
    return {
      md: emptyNotice('no scheduled-tasks cache — run `/observe` from an ATLAS session to refresh'),
      rows: [],
    };
  }
  const rows = [];
  for (const t of cache.tasks) {
    const last = parseTs(t.lastRunAt);
    const windowH = parseCron(t.cronExpression || t.cron || '');
    const ageH = last ? (NOW - last) / 3_600_000 : null;
    let status = 'ok';
    if (!last) status = 'never-ran';
    else if (windowH && ageH > windowH + 6) status = 'drift';
    else if (windowH && ageH > windowH) status = 'late';
    rows.push({
      id: t.taskId || t.id || '?',
      enabled: t.enabled !== false,
      cron: t.cronExpression || t.cron || '?',
      lastRunAt: last,
      last_exit: (t.lastRun && (t.lastRun.exit_code ?? t.lastRun.exitCode)) ?? null,
      status,
    });
  }
  if (rows.length === 0) {
    return { md: emptyNotice('no scheduled tasks registered'), rows: [] };
  }
  const lines = [
    `_Refreshed ${fmtAgo(parseTs(cache.refreshed_at))}. ${rows.length} task(s)._`,
    '',
    '| Task | Enabled | Cron | Last run | Status |',
    '|---|:-:|---|---|---|',
  ];
  const statusGlyph = { ok: '✓', late: '⏱ late', drift: '⚠ drift', 'never-ran': '· never' };
  for (const r of rows) {
    lines.push(`| \`${r.id}\` | ${r.enabled ? 'Y' : 'N'} | \`${r.cron}\` | ${fmtAgo(r.lastRunAt)} | ${statusGlyph[r.status]} |`);
  }
  return { md: lines.join('\n'), rows };
}

// ─── section 5: action graph ──────────────────────────────────────────────

function sectionActionGraph() {
  const records = readJsonl(path.join(LOGS_DIR, 'action-graph-stats.jsonl'), { limit: 200 });
  if (!records || records.length === 0) {
    return { md: emptyNotice('no action-graph-stats.jsonl yet'), rows: [] };
  }
  const recent = records.slice(-30);
  let sumUnique = 0, sumRetrievals = 0, sumDup = 0, sumTokens = 0, sumHot = 0, sumHotTok = 0, mpSum = 0, mpN = 0;
  for (const r of recent) {
    sumUnique += r.unique_targets || 0;
    sumRetrievals += r.total_retrievals || 0;
    sumDup += r.duplicate_items || 0;
    sumTokens += r.approx_total_tokens || 0;
    sumHot += r.hot_set_size || 0;
    sumHotTok += r.hot_set_tokens || 0;
    if (typeof r.mean_priority === 'number') { mpSum += r.mean_priority; mpN++; }
  }
  const n = recent.length;
  const dupRate = sumRetrievals > 0 ? (sumDup / sumRetrievals) : 0;
  const lines = [
    `_Last ${n} session(s). Dup-read rate ${(dupRate * 100).toFixed(1)}% — higher = more context waste._`,
    '',
    '| Metric | Avg/session |',
    '|---|---:|',
    `| Unique files touched | ${(sumUnique / n).toFixed(1)} |`,
    `| Total retrievals | ${(sumRetrievals / n).toFixed(1)} |`,
    `| Duplicate reads | ${(sumDup / n).toFixed(1)} |`,
    `| Approx. tokens | ${Math.round(sumTokens / n).toLocaleString()} |`,
    `| Hot-set size | ${(sumHot / n).toFixed(1)} |`,
    `| Hot-set tokens | ${Math.round(sumHotTok / n).toLocaleString()} |`,
    `| Mean priority | ${(mpN ? mpSum / mpN : 0).toFixed(3)} |`,
  ];
  return {
    md: lines.join('\n'),
    rows: {
      sessions: n,
      dup_rate: dupRate,
      avg_unique: sumUnique / n,
      avg_retrievals: sumRetrievals / n,
      avg_tokens: sumTokens / n,
    },
  };
}

// ─── section 6: cleanup ───────────────────────────────────────────────────

function sectionCleanup() {
  const records = readJsonl(path.join(LOGS_DIR, 'cleanup.jsonl'), { limit: 500 });
  if (!records || records.length === 0) {
    return { md: emptyNotice('no cleanup.jsonl yet — run session-start to populate'), rows: [] };
  }
  // Bucket by session_id; use the most recent session with at least one rule.
  const bySession = new Map();
  for (const r of records) {
    const sid = r.session_id || 'unknown';
    if (!bySession.has(sid)) bySession.set(sid, []);
    bySession.get(sid).push(r);
  }
  const lastSid = records[records.length - 1].session_id || 'unknown';
  const last = bySession.get(lastSid) || records.slice(-20);

  // 7-day error tally across all sessions
  const since = NOW - 7 * DAY_MS;
  let errorCount = 0, rulesRun = 0;
  const errorRules = new Set();
  for (const r of records) {
    const t = parseTs(r.ts);
    if (t == null || t < since) continue;
    rulesRun++;
    if (r.error) { errorCount++; errorRules.add(r.rule); }
  }

  const lines = [
    `_Last session \`${lastSid}\` — ${last.length} rule(s). 7-day: ${rulesRun} runs, ${errorCount} error(s)._`,
    '',
    '| Rule | Mode | Outcome | Duration |',
    '|---|---|---|---:|',
  ];
  for (const r of last) {
    const out = r.error
      ? `⚠ ${r.error}`
      : (r.deleted_count != null ? `deleted ${r.deleted_count}` :
         r.gzipped_count != null ? `gzip ${r.gzipped_count}/trash ${r.trashed_count || 0}` :
         r.nagged ? 'nagged' :
         r.kept != null ? `kept ${r.kept}` :
         'ok');
    lines.push(`| \`${r.rule}\` | ${r.mode} | ${out} | ${r.duration_ms ?? '?'}ms |`);
  }
  if (errorRules.size > 0) {
    lines.push('');
    lines.push(`⚠ Rules with errors in last 7d: ${[...errorRules].map(r => `\`${r}\``).join(', ')}`);
  }
  return { md: lines.join('\n'), rows: { last, error_rules: [...errorRules], rules_run_7d: rulesRun, errors_7d: errorCount } };
}

// ─── orchestration ────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'tool_health',     title: '1. Tool Health',     fn: sectionToolHealth },
  { key: 'safety_hooks',    title: '2. Safety Hooks',    fn: sectionSafetyHooks },
  { key: 'skill_usage',     title: '3. Skill Usage',     fn: sectionSkillUsage },
  { key: 'scheduled_tasks', title: '4. Scheduled Tasks', fn: sectionScheduledTasks },
  { key: 'action_graph',    title: '5. Action Graph',    fn: sectionActionGraph },
  { key: 'cleanup',         title: '6. Cleanup',         fn: sectionCleanup },
];

function runSection(s) {
  try { return s.fn(); }
  catch (e) { return { md: emptyNotice(`section error: ${e.message}`), rows: [] }; }
}

function main() {
  const picked = ONLY ? SECTIONS.filter(s => s.key === ONLY) : SECTIONS;
  if (picked.length === 0) {
    process.stderr.write(`unknown --section=${ONLY}. valid: ${SECTIONS.map(s => s.key).join(',')}\n`);
    process.exit(2);
  }
  const output = {};
  for (const s of picked) output[s.key] = runSection(s);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      generated_at: new Date().toISOString(),
      sections: Object.fromEntries(Object.entries(output).map(([k, v]) => [k, v.rows])),
    }, null, 2) + '\n');
    return;
  }

  const lines = [];
  lines.push(`# ATLAS Observability — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  lines.push('');
  for (const s of picked) {
    lines.push(`## ${s.title}`);
    lines.push('');
    lines.push(output[s.key].md);
    lines.push('');
  }
  process.stdout.write(lines.join('\n'));
}

main();
