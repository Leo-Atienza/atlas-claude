#!/usr/bin/env node
/**
 * usage-report.js — fused capability-usage reader (v10 U1-1).
 *
 * Joins every usage ledger into one per-capability view so "unused" claims are
 * evidence-fused, never single-source (the skill-usage.jsonl caveat: it only
 * sees explicit Skill-tool calls — drift-thresholds note 2026-05-28):
 *
 *   skills/commands ← logs/skill-usage.jsonl        (Skill tool + kind:"slash" rows)
 *   skills (soft)   ← atlas-action-graph/<s>.jsonl  (Read events on skills/<x>/SKILL.md)
 *   agents          ← logs/subagent-stats.jsonl     (subagent_type)
 *   MCP servers     ← logs/tool-call-counts.json    (mcp__<server>__* keys; _meta.since)
 *   scheduled tasks ← cache/scheduled-tasks-latest.json (lastRunAt, enabled)
 *   hooks           ← logs/hook-health.jsonl        (per-hook run counts)
 *   local-LLM lane  ← logs/delegations.jsonl        (aggregate volume only)
 *
 * Read-only. Zero-telemetry here = suspicion, never proof — the U2-2 UNUSED
 * rule additionally requires dependency-grep + transcript search.
 *
 * Usage: node scripts/usage-report.js [--json | --propose]
 *
 * --propose (the v10 U5-1 conductor step, run by weekly-maintenance 9d):
 *   compares the fused ledger against the active inventory and files A4
 *   proposals (scripts/proposals.js, type "inventory", --target set so
 *   /review-proposals rejection feeds the per-target decline-memory) for:
 *     - skills with ZERO fused evidence (no invocation, no slash, no SKILL.md
 *       read) whose SKILL.md is >60d old            → archive proposal
 *     - enabled plugins with zero ledger evidence   → disable proposal
 *   Caps at 3 proposals per run (governance ladder: inventory.propose_disposition,
 *   level 1). Skips: declined targets, CLAUDE.md-mandated gates, upstream-managed
 *   dirs, personal-style* skills, and anything already proposed.
 *   Tier mismatches stay with monthly-evolution-report step 3 (human-reviewed) —
 *   automating them needs a fragile SK-id → dir mapping; deliberately not done.
 *   PROPOSALS ONLY — this script never archives or disables anything itself.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(os.homedir(), '.claude');
const NOW = Date.now();
const D45 = 45 * 86400000;

const readLines = (file) => {
  try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); } catch (_) { return []; }
};
const readJson = (file, dflt) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return dflt; }
};
const parseJsonl = (file) => readLines(file).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);

// ── Inventory ─────────────────────────────────────────────────────────

function skillInventory() {
  const names = new Set();
  const dir = path.join(ROOT, 'skills');
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { /* none */ }
  for (const e of entries) {
    if (e.name.startsWith('_')) continue; // _archived, _external
    if (e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md'))) names.add(e.name);
  }
  // Registry rows whose path is a flat .md page (no dir) — parse ACTIVE-DIRECTORY.
  const ad = (() => { try { return fs.readFileSync(path.join(dir, 'ACTIVE-DIRECTORY.md'), 'utf8'); } catch (_) { return ''; } })();
  for (const m of ad.matchAll(/`skills\/([\w.-]+)\.md`/g)) {
    if (!/^(ACTIVE|ARCHIVE|RULES)-/.test(m[1])) names.add(m[1]);
  }
  return names;
}

function commandInventory() {
  const names = new Set();
  const walk = (dir, prefix) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.name.startsWith('_')) continue; // _archived bundles
      if (e.isDirectory()) walk(path.join(dir, e.name), prefix ? `${prefix}:${e.name}` : e.name);
      else if (e.name.endsWith('.md')) names.add(prefix ? `${prefix}:${e.name.slice(0, -3)}` : e.name.slice(0, -3));
    }
  };
  walk(path.join(ROOT, 'commands'), '');
  return names;
}

function agentInventory() {
  const out = new Map(); // name -> relpath (pack context)
  const walk = (dir, rel) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (e.name.startsWith('_')) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (e.name.endsWith('.md') && e.name !== 'AGENTS.md' && e.name.toLowerCase() !== 'readme.md') {
        out.set(e.name.slice(0, -3), r);
      }
    }
  };
  walk(path.join(ROOT, 'agents'), '');
  return out;
}

function hookInventory() {
  let entries = [];
  try { entries = fs.readdirSync(path.join(ROOT, 'hooks')); } catch (_) { /* none */ }
  return entries.filter(f => f.endsWith('.js') && !f.startsWith('lib') && !f.includes('.test.') && !f.endsWith('.bak'))
    .map(f => f.slice(0, -3));
}

// ── Evidence ──────────────────────────────────────────────────────────

function skillUsageEvidence(skills, commands) {
  // name -> {alltime, d45, last, sources:Set}
  const ev = new Map();
  const credit = (name, ts, source) => {
    const e = ev.get(name) || { alltime: 0, d45: 0, last: null, sources: new Set() };
    e.alltime++;
    const t = Date.parse(ts);
    if (!Number.isNaN(t)) {
      if (NOW - t <= D45) e.d45++;
      if (!e.last || t > Date.parse(e.last)) e.last = ts;
    }
    e.sources.add(source);
    ev.set(name, e);
  };
  const resolveName = (raw) => {
    if (skills.has(raw) || commands.has(raw)) return raw; // exact inventory hit (e.g. flow:plan)
    // Dual-name normalization: a pack-prefixed name that is NOT itself in the
    // inventory collapses to its suffix (anthropic-skills:ghost → ghost), so
    // one plugin skill invoked via two paths counts as one capability.
    const suffix = raw.includes(':') ? raw.slice(raw.lastIndexOf(':') + 1) : null;
    return suffix || raw;
  };
  for (const r of parseJsonl(path.join(ROOT, 'logs', 'skill-usage.jsonl'))) {
    if (r.kind === 'slash' && r.name) credit(resolveName(r.name), r.ts, 'slash-log');
    else if (r.skill) credit(resolveName(r.skill), r.ts, 'skill-log');
  }
  return ev;
}

function skillReadEvidence() {
  // Soft evidence: SKILL.md reads recorded by the action graph (bounded retention).
  const reads = new Map(); // skill dir -> {count, last}
  const agDir = path.join(ROOT, 'atlas-action-graph');
  let files = [];
  try { files = fs.readdirSync(agDir).filter(f => f.endsWith('.jsonl') && !f.endsWith('.state.json')); } catch (_) { /* none */ }
  for (const f of files) {
    for (const r of parseJsonl(path.join(agDir, f))) {
      if (r.tool !== 'Read' || !r.target) continue;
      const m = String(r.target).replace(/\\/g, '/').match(/\/skills\/([^/]+)\/SKILL\.md$/i);
      if (!m) continue;
      const e = reads.get(m[1]) || { count: 0, last: null };
      e.count++;
      if (r.ts_iso && (!e.last || r.ts_iso > e.last)) e.last = r.ts_iso;
      reads.set(m[1], e);
    }
  }
  return reads;
}

function agentEvidence() {
  const ev = new Map();
  for (const r of parseJsonl(path.join(ROOT, 'logs', 'subagent-stats.jsonl'))) {
    if (!r.subagent_type) continue;
    const e = ev.get(r.subagent_type) || { alltime: 0, d45: 0, last: null };
    e.alltime++;
    const t = Date.parse(r.ts);
    if (!Number.isNaN(t)) {
      if (NOW - t <= D45) e.d45++;
      if (!e.last || t > Date.parse(e.last)) e.last = r.ts;
    }
    ev.set(r.subagent_type, e);
  }
  return ev;
}

function mcpEvidence() {
  const counts = readJson(path.join(ROOT, 'logs', 'tool-call-counts.json'), {});
  const since = counts._meta && counts._meta.since;
  const servers = new Map();
  for (const [tool, n] of Object.entries(counts)) {
    if (!tool.startsWith('mcp__')) continue;
    const server = tool.split('__')[1] || 'unknown';
    const e = servers.get(server) || { calls: 0, tools: 0 };
    e.calls += Number(n) || 0;
    e.tools++;
    servers.set(server, e);
  }
  return { servers, since };
}

function taskEvidence() {
  const cache = readJson(path.join(ROOT, 'cache', 'scheduled-tasks-latest.json'), { tasks: [] });
  return new Map((cache.tasks || []).map(t => [t.taskId || t.id, {
    enabled: !!t.enabled,
    last: t.lastRunAt || null,
    cron: t.cronExpression || null,
  }]));
}

function hookEvidence() {
  const ev = new Map();
  for (const r of parseJsonl(path.join(ROOT, 'logs', 'hook-health.jsonl'))) {
    if (!r.hook) continue;
    const e = ev.get(r.hook) || { alltime: 0, last: null };
    e.alltime++;
    if (r.ts && (!e.last || r.ts > e.last)) e.last = r.ts;
    ev.set(r.hook, e);
  }
  return ev;
}

function delegationSummary() {
  const rows = parseJsonl(path.join(ROOT, 'logs', 'delegations.jsonl'));
  const d45 = rows.filter(r => r.ts && NOW - Date.parse(r.ts) <= D45).length;
  return { alltime: rows.length, d45, last: rows.length ? rows[rows.length - 1].ts : null };
}

// ── Assemble ──────────────────────────────────────────────────────────

function build() {
  const skills = skillInventory();
  const commands = commandInventory();
  const agents = agentInventory();
  const hooks = hookInventory();

  const usage = skillUsageEvidence(skills, commands);
  const reads = skillReadEvidence();
  const agentEv = agentEvidence();
  const { servers: mcpEv, since: mcpSince } = mcpEvidence();
  const taskEv = taskEvidence();
  const hookEv = hookEvidence();

  const caps = [];
  const seen = new Set();

  for (const s of [...skills].sort()) {
    const e = usage.get(s);
    const r = reads.get(s);
    seen.add(s);
    caps.push({
      type: 'skill', name: s,
      alltime: e ? e.alltime : 0, d45: e ? e.d45 : 0, last_used: e ? e.last : null,
      skill_md_reads: r ? r.count : 0, last_read: r ? r.last : null,
      sources: e ? [...e.sources] : [],
    });
  }
  for (const c of [...commands].sort()) {
    if (seen.has(c)) continue; // a dir-skill and command sharing a name = one capability
    const e = usage.get(c);
    caps.push({
      type: 'command', name: c,
      alltime: e ? e.alltime : 0, d45: e ? e.d45 : 0, last_used: e ? e.last : null,
      sources: e ? [...e.sources] : [],
    });
  }
  // Usage rows outside the local fs inventory (plugin-provided skills, or
  // renamed/removed capabilities) still surface — they are real usage.
  for (const [name, e] of usage) {
    if (skills.has(name) || commands.has(name) || seen.has(name)) continue;
    caps.push({ type: 'plugin-or-unmatched', name, alltime: e.alltime, d45: e.d45, last_used: e.last, sources: [...e.sources] });
  }
  for (const [name, rel] of [...agents.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const e = agentEv.get(name);
    caps.push({
      type: 'agent', name, path: rel,
      alltime: e ? e.alltime : 0, d45: e ? e.d45 : 0, last_used: e ? e.last : null,
      sources: e ? ['subagent-stats'] : [],
    });
  }
  for (const [server, e] of [...mcpEv.entries()].sort((a, b) => b[1].calls - a[1].calls)) {
    caps.push({ type: 'mcp-server', name: server, alltime: e.calls, tools_seen: e.tools, since: mcpSince, sources: ['tool-call-counts'] });
  }
  for (const [id, t] of taskEv) {
    caps.push({ type: 'scheduled-task', name: id, enabled: t.enabled, last_used: t.last, cron: t.cron, sources: ['scheduled-cache'] });
  }
  for (const h of hooks.sort()) {
    const e = hookEv.get(h);
    caps.push({
      type: 'hook', name: h,
      alltime: e ? e.alltime : 0, last_used: e ? e.last : null,
      sources: e ? ['hook-health'] : [],
    });
  }
  // Local plugins (settings.json enabledPlugins). Evidence: skill-usage rows
  // whose raw name carried the plugin's pack prefix (captured before
  // normalization would collapse them) — recomputed here from the raw ledger.
  const settings = readJson(path.join(ROOT, 'settings.json'), {});
  const rawLedger = parseJsonl(path.join(ROOT, 'logs', 'skill-usage.jsonl'));
  for (const [plugin, enabled] of Object.entries(settings.enabledPlugins || {})) {
    const short = plugin.split('@')[0];
    const rows = rawLedger.filter(r => {
      const n = r.skill || (r.kind === 'slash' && r.name) || '';
      return n.startsWith(short + ':');
    });
    const last = rows.length ? rows[rows.length - 1].ts : null;
    caps.push({
      type: 'plugin', name: short, enabled,
      alltime: rows.length,
      d45: rows.filter(r => NOW - Date.parse(r.ts) <= D45).length,
      last_used: last,
      sources: rows.length ? ['skill-log'] : [],
    });
  }
  caps.push({ type: 'local-llm-lane', name: 'local_llm_agent', ...delegationSummary(), sources: ['delegations'] });

  return {
    generated_at: new Date().toISOString(),
    windows: { d45_cutoff: new Date(NOW - D45).toISOString(), mcp_counts_since: mcpSince || null },
    caveat: 'Zero telemetry = suspicion, never proof (U2-2 rule: dependency grep + transcript search required before UNUSED).',
    counts: {
      skills: skills.size, commands: commands.size, agents: agents.size,
      mcp_servers_observed: mcpEv.size, scheduled_tasks: taskEv.size, hooks: hooks.length,
    },
    capabilities: caps,
  };
}

// ── Output ────────────────────────────────────────────────────────────

const report = build();

if (process.argv.includes('--propose')) {
  // Conductor step (U5-1): file A4 proposals from fused evidence. Never applies.
  const { addProposal } = require('./proposals.js');
  const D60 = 60 * 86400000;
  const EXEMPT = [
    /^ship-verify$/, /^design-check$/, /^design-polish$/,     // CLAUDE.md-mandated gates
    /^hyperframes/, /^media-use$/,                            // upstream-CLI-managed
    /^personal-style/,                                             // adopter: your own personal-style skills
    /^recall$/, /^remember$/,                                 // the two doors (script-invoked)
  ];
  const declined = (() => {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'cache', 'proposal-stats.json'), 'utf8'));
      return new Set((s.declined_targets || []).map(d => d.target));
    } catch (_) { return new Set(); }
  })();

  const candidates = [];
  for (const c of report.capabilities) {
    if (declined.has(c.name) || EXEMPT.some(re => re.test(c.name))) continue;
    if (c.type === 'skill' && c.alltime === 0 && c.skill_md_reads === 0) {
      let mtime = null;
      try { mtime = fs.statSync(path.join(ROOT, 'skills', c.name, 'SKILL.md')).mtimeMs; } catch (_) { continue; }
      if (NOW - mtime > D60) {
        candidates.push({
          target: c.name,
          title: `archive unused skill ${c.name}`,
          spec: `Skill \`${c.name}\` has zero fused evidence (no Skill-tool call, no slash, no SKILL.md read) and its SKILL.md is ${Math.floor((NOW - mtime) / 86400000)}d old. Proposed: mv skills/${c.name} skills/_archived/${c.name} + ARCHIVE-DIRECTORY row + manifest detection pattern. Confirm with a transcript search before approving.`,
          evidence: `usage-report --propose ${report.generated_at}`,
          rollback: `mv skills/_archived/${c.name} skills/${c.name}`,
        });
      }
    } else if (c.type === 'plugin' && c.enabled && c.alltime === 0) {
      candidates.push({
        target: `plugin:${c.name}`,
        title: `disable unused plugin ${c.name}`,
        spec: `Enabled plugin \`${c.name}\` has zero ledger evidence. Proposed: set "${c.name}@claude-plugins-official": false in settings.json enabledPlugins (one-line reversible).`,
        evidence: `usage-report --propose ${report.generated_at}`,
        rollback: `set the enabledPlugins flag back to true`,
      });
    }
  }

  const CAP_PER_RUN = 3;
  let filed = 0;
  for (const c of candidates) {
    if (filed >= CAP_PER_RUN) break;
    const r = addProposal('inventory', c.title, c.spec, {
      target: c.target, evidence: c.evidence, rollback: c.rollback,
    });
    if (r.ok) { filed++; console.log(`proposed: ${r.slug}`); }
  }
  console.log(`usage-report --propose: ${filed} proposal(s) filed (${candidates.length} candidate(s); cap ${CAP_PER_RUN}/run; decline-memory + exemptions applied). Review with /review-proposals.`);
  process.exit(0);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const byType = {};
  for (const c of report.capabilities) (byType[c.type] = byType[c.type] || []).push(c);
  console.log(`usage-report @ ${report.generated_at}`);
  console.log(`inventory: ${JSON.stringify(report.counts)}`);
  console.log(`caveat: ${report.caveat}\n`);
  for (const [type, rows] of Object.entries(byType)) {
    console.log(`## ${type} (${rows.length})`);
    console.log('| name | alltime | 45d | last | extra |');
    console.log('|---|---|---|---|---|');
    const sorted = [...rows].sort((a, b) => (b.alltime || 0) - (a.alltime || 0) || a.name.localeCompare(b.name));
    for (const r of sorted) {
      const extra = r.type === 'skill' ? `reads:${r.skill_md_reads}${r.last_read ? ' last-read:' + r.last_read.slice(0, 10) : ''}`
        : r.type === 'scheduled-task' ? `enabled:${r.enabled} cron:${r.cron || '-'}`
        : r.type === 'mcp-server' ? `tools:${r.tools_seen}`
        : r.path || '';
      console.log(`| ${r.name} | ${r.alltime ?? '-'} | ${r.d45 ?? '-'} | ${(r.last_used || '').slice(0, 10) || '-'} | ${extra} |`);
    }
    console.log('');
  }
}
