#!/usr/bin/env node
/**
 * ATLAS Health Dashboard — Aggregated system health view.
 *
 * Usage: node ~/.claude/scripts/health-dashboard.js [--json]
 *
 * Aggregates: tool health, error patterns, hook latency, disk usage,
 * knowledge store stats, Atlas KG stats, session efficiency.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs');
const CACHE_DIR = path.join(CLAUDE_DIR, 'cache');
const KG_DIR = path.join(CLAUDE_DIR, 'atlas-kg');

const JSON_MODE = process.argv.includes('--json');

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function readJson(p, fb) {
  return safe(() => JSON.parse(fs.readFileSync(p, 'utf8')), fb);
}

function heading(title) {
  if (!JSON_MODE) console.log(`\n\x1b[1m=== ${title} ===\x1b[0m`);
}

function line(text) {
  if (!JSON_MODE) console.log(text);
}

function dirSize(dirPath) {
  try {
    return execSync(`du -sh "${dirPath}"`, { encoding: 'utf8', timeout: 5000 })
      .trim().split(/\s+/)[0];
  } catch { return '?'; }
}

// ── 1. Tool Health ──────────────────────────────────────────────────

function toolHealth() {
  heading('Tool Health (last 48h)');
  const health = readJson(path.join(LOGS_DIR, 'tool-health.json'), { tools: {} });
  const suppress = readJson(path.join(LOGS_DIR, 'health-suppress.json'), {});
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const tools = Object.entries(health.tools || {})
    .map(([name, v]) => ({
      name,
      total: v.total_failures || 0,
      recent: (v.failures || []).filter(ts => ts > cutoff).length,
      mcp: v.is_mcp || false,
      chronic: (suppress[name] || 0) >= 5,
    }))
    .filter(t => t.total > 0)
    .sort((a, b) => b.recent - a.recent);

  if (tools.length === 0) {
    line('  No tool failures recorded.');
    return tools;
  }

  const active = tools.filter(t => !t.chronic);
  const chronic = tools.filter(t => t.chronic);

  for (const t of active.slice(0, 10)) {
    const badge = t.mcp ? ' [MCP]' : '';
    const color = t.recent >= 10 ? '\x1b[31m' : t.recent >= 5 ? '\x1b[33m' : '\x1b[0m';
    line(`  ${color}${t.name}: ${t.recent} recent / ${t.total} total${badge}\x1b[0m`);
  }
  if (chronic.length > 0) {
    line(`  \x1b[2mSuppressed (chronic):\x1b[0m`);
    for (const t of chronic) {
      line(`  \x1b[2m  ${t.name}: ${t.total} total${t.mcp ? ' [MCP]' : ''}\x1b[0m`);
    }
  }

  return tools;
}

// ── 2. Error Patterns ───────────────────────────────────────────────

function errorPatterns() {
  heading('Error Patterns');
  const patterns = readJson(path.join(LOGS_DIR, 'error-patterns.json'), {});
  const items = Object.values(patterns)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (items.length === 0) {
    line('  No recurring error patterns.');
    return items;
  }

  for (const e of items) {
    const age = e.last_seen
      ? Math.round((Date.now() - new Date(e.last_seen).getTime()) / 3600000) + 'h ago'
      : '?';
    line(`  ${e.count}x | ${e.tool} | ${(e.sample || '').slice(0, 60)} | ${age}`);
  }
  return items;
}

// ── 3. Hook Latency ─────────────────────────────────────────────────

function hookLatency() {
  heading('Hook Latency (last 200 entries)');
  const logPath = path.join(LOGS_DIR, 'hook-health.jsonl');

  if (!fs.existsSync(logPath)) {
    line('  No hook health data.');
    return {};
  }

  const rawLines = safe(
    () => fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-200),
    []
  );
  const stats = {};

  for (const l of rawLines) {
    try {
      const entry = JSON.parse(l);
      const hook = entry.hook || 'unknown';
      if (!stats[hook]) stats[hook] = { total: 0, count: 0, max: 0 };
      stats[hook].total += entry.duration_ms || 0;
      stats[hook].count++;
      stats[hook].max = Math.max(stats[hook].max, entry.duration_ms || 0);
    } catch {}
  }

  const sorted = Object.entries(stats)
    .map(([hook, s]) => ({ hook, avg: Math.round(s.total / s.count), max: s.max, count: s.count }))
    .sort((a, b) => b.avg - a.avg);

  for (const { hook, avg, max, count } of sorted) {
    const color = avg > 100 ? '\x1b[33m' : '\x1b[0m';
    line(`  ${color}${hook.padEnd(24)} avg ${String(avg).padStart(4)}ms  max ${String(max).padStart(5)}ms  (${count} calls)\x1b[0m`);
  }

  return stats;
}

// ── 4. Disk Usage ───────────────────────────────────────────────────

function diskUsage() {
  heading('Disk Usage');
  const dirs = [
    ['skills/', path.join(CLAUDE_DIR, 'skills')],
    ['topics/', path.join(CLAUDE_DIR, 'topics')],
    ['hooks/', path.join(CLAUDE_DIR, 'hooks')],
    ['logs/', LOGS_DIR],
    ['cache/', CACHE_DIR],
    ['TRASH/', path.join(CLAUDE_DIR, 'TRASH')],
    ['backups/', path.join(CLAUDE_DIR, 'backups')],
    ['sessions/', path.join(CLAUDE_DIR, 'sessions')],
    ['atlas-kg/', KG_DIR],
  ];

  const results = {};
  for (const [label, dir] of dirs) {
    if (fs.existsSync(dir)) {
      const size = dirSize(dir);
      results[label] = size;
      const numericMB = parseFloat(size);
      const warn = size.endsWith('M') && numericMB > 20
        ? ' \x1b[33m(consider cleanup)\x1b[0m' : '';
      line(`  ${label.padEnd(14)} ${size}${warn}`);
    }
  }
  return results;
}

// ── 5. Knowledge Store ──────────────────────────────────────────────

function knowledgeStore() {
  heading('Knowledge Store');
  const dirPath = path.join(CLAUDE_DIR, 'topics', 'KNOWLEDGE-DIRECTORY.md');
  const content = safe(() => fs.readFileSync(dirPath, 'utf8'), '');

  const counts = { PAT: 0, SOL: 0, ERR: 0, PREF: 0, FAIL: 0 };
  const dateRegex = /^\|\s*G-(\w+)-\d+\s*\|[^|]+\|[^|]+\|\s*(\d{4}-\d{2}-\d{2})\s*\|/gm;
  let match;
  let oldest = null;
  let newest = null;

  while ((match = dateRegex.exec(content)) !== null) {
    const cat = match[1];
    const date = match[2];
    if (counts[cat] !== undefined) counts[cat]++;
    if (!oldest || date < oldest) oldest = date;
    if (!newest || date > newest) newest = date;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  line(`  Total: ${total} entries`);
  line(`  PAT=${counts.PAT}  SOL=${counts.SOL}  ERR=${counts.ERR}  PREF=${counts.PREF}  FAIL=${counts.FAIL}`);
  line(`  Date range: ${oldest || '?'} — ${newest || '?'}`);

  // Staleness check
  const cutoff90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  if (oldest && oldest < cutoff90) {
    line(`  \x1b[33mNote: earliest entries (${oldest}) are 90+ days old — consider /dream to prune\x1b[0m`);
  }

  return { counts, total, oldest, newest };
}

// ── 6. Atlas KG ─────────────────────────────────────────────────────

function atlasKG() {
  heading('Atlas Knowledge Graph');
  const entitiesRaw = readJson(path.join(KG_DIR, 'entities.json'), []);
  const triplesRaw = readJson(path.join(KG_DIR, 'triples.json'), []);
  const eCount = Array.isArray(entitiesRaw) ? entitiesRaw.length : Object.keys(entitiesRaw).length;
  const tCount = Array.isArray(triplesRaw) ? triplesRaw.length : Object.keys(triplesRaw).length;

  const snapDir = path.join(KG_DIR, 'snapshots');
  const snapCount = safe(
    () => fs.readdirSync(snapDir).filter(f => f.startsWith('entities-')).length,
    0
  );

  line(`  Entities: ${eCount}`);
  line(`  Triples: ${tCount}`);
  line(`  Snapshots: ${snapCount}`);

  if (eCount === 0 && tCount === 0) {
    line(`  \x1b[33mKG is empty — facts are captured at session-stop\x1b[0m`);
  }

  return { entities: eCount, triples: tCount, snapshots: snapCount };
}

// ── 7. Session Stats ────────────────────────────────────────────────

function sessionStats() {
  heading('Tool Usage (cumulative)');
  const counts = readJson(path.join(LOGS_DIR, 'tool-call-counts.json'), {});
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    line('  No tool usage data.');
    return { total: 0, top: [] };
  }

  line(`  Total tool calls (all sessions): ${total}`);
  for (const [tool, count] of sorted) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    line(`  ${tool.padEnd(24)} ${String(count).padStart(6)} (${pct}%)`);
  }

  return { total, top: sorted };
}

// ── 8. Hook Integrity ───────────────────────────────────────────────

function hookIntegrity() {
  heading('Hook Integrity');
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  const content = safe(() => fs.readFileSync(settingsPath, 'utf8'), null);
  if (!content) {
    line('  \x1b[31msettings.json not found\x1b[0m');
    return { ok: false };
  }

  let settings;
  try {
    settings = JSON.parse(content);
  } catch {
    line('  \x1b[31msettings.json parse error\x1b[0m');
    return { ok: false };
  }

  let total = 0;
  let missing = 0;
  const missingDetails = [];

  const hookEvents = settings.hooks || {};
  for (const [event, matchers] of Object.entries(hookEvents)) {
    if (!Array.isArray(matchers)) continue;
    for (const matcher of matchers) {
      const innerHooks = matcher.hooks || [];
      if (!Array.isArray(innerHooks)) continue;
      for (const hook of innerHooks) {
        if (hook.type !== 'command' || !hook.command) continue;
        total++;

        const cmd = hook.command.replace(/\|\|.*$/, '').trim();
        const parts = cmd.split(/\s+/).filter(p =>
          p.startsWith('~') || p.startsWith('/') || p.startsWith('$HOME') || /^[A-Z]:[/\\]/i.test(p)
        );

        for (const part of parts) {
          const resolved = part
            .replace(/^\$HOME/, os.homedir())
            .replace(/^~/, os.homedir())
            .replace(/"/g, '');
          if (!fs.existsSync(resolved)) {
            missing++;
            missingDetails.push(`${event}: ${part}`);
          }
        }
      }
    }
  }

  if (missing === 0) {
    line(`  \x1b[32mAll ${total} hook scripts present\x1b[0m`);
  } else {
    line(`  \x1b[31m${missing}/${total} hook scripts missing:\x1b[0m`);
    for (const d of missingDetails) {
      line(`    ${d}`);
    }
  }

  return { total, missing, missingDetails };
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  if (!JSON_MODE) {
    console.log('\x1b[1;36m');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║       ATLAS Health Dashboard         ║');
    console.log('  ╚══════════════════════════════════════╝');
    console.log('\x1b[0m');
  }

  const results = {};
  results.toolHealth = toolHealth();
  results.errorPatterns = errorPatterns();
  results.hookLatency = hookLatency();
  results.hookIntegrity = hookIntegrity();
  results.diskUsage = diskUsage();
  results.knowledgeStore = knowledgeStore();
  results.atlasKG = atlasKG();
  results.sessionStats = sessionStats();

  if (JSON_MODE) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n\x1b[2mRun with --json for machine-readable output.\x1b[0m`);
  }
}

main();
