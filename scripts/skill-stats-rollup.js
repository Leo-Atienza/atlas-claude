#!/usr/bin/env node
// Skill stats rollup — aggregates skill-events.jsonl into skill-stats.json.
// Called by session-stop.sh. Computes per-skill selection/application/fallback rates.
// Auto-promotes skills that reach maturity threshold (3+ applications).

const fs = require('fs');
const os = require('os');
const path = require('path');

const LOGS_DIR = path.join(os.homedir(), '.claude', 'logs');
const EVENTS_PATH = path.join(LOGS_DIR, 'skill-events.jsonl');
const STATS_PATH = path.join(LOGS_DIR, 'skill-stats.json');
const EVOLUTION_PATH = path.join(os.homedir(), '.claude', 'projects', 'C--Users-leooa--claude', 'memory', 'evolution.md');
const MATURITY_THRESHOLD = 3;
const MAX_EVENTS_SIZE = 1_000_000; // 1MB rotation

// Load existing stats (to preserve historical data across sessions)
let stats = { _meta: { last_updated: '', sessions_counted: 0 }, skills: {} };
try {
  if (fs.existsSync(STATS_PATH)) {
    stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
  }
} catch (e) {}

// Read events
let events = [];
try {
  if (!fs.existsSync(EVENTS_PATH)) process.exit(0);
  const lines = fs.readFileSync(EVENTS_PATH, 'utf8').trim().split('\n').filter(Boolean);
  events = lines.map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
} catch (e) {
  process.exit(0);
}

if (events.length === 0) process.exit(0);

// Group by session + skill_id
const sessionSkills = {};
for (const evt of events) {
  const key = `${evt.session}::${evt.skill_id}`;
  if (!sessionSkills[key]) {
    sessionSkills[key] = { skill_id: evt.skill_id, skill_name: evt.skill_name, session: evt.session, selected: false, applied: false };
  }
  if (evt.event === 'selected') sessionSkills[key].selected = true;
  if (evt.event === 'applied') sessionSkills[key].applied = true;
}

// Aggregate into stats
const uniqueSessions = new Set();
for (const entry of Object.values(sessionSkills)) {
  uniqueSessions.add(entry.session);
  const id = entry.skill_id;
  if (!stats.skills[id]) {
    stats.skills[id] = {
      name: entry.skill_name,
      total_selections: 0,
      total_applied: 0,
      total_fallbacks: 0,
      applied_rate: 0,
      fallback_rate: 0,
      last_used: '',
      maturity_confirmations: 0,
      _promoted: false,
    };
  }
  const s = stats.skills[id];
  s.name = entry.skill_name || s.name;

  if (entry.selected) {
    s.total_selections += 1;
    if (entry.applied) {
      s.total_applied += 1;
      s.maturity_confirmations += 1;
    } else {
      s.total_fallbacks += 1;
    }
  }

  // Recompute rates
  if (s.total_selections > 0) {
    s.applied_rate = Math.round((s.total_applied / s.total_selections) * 100) / 100;
    s.fallback_rate = Math.round((s.total_fallbacks / s.total_selections) * 100) / 100;
  }
  s.last_used = new Date().toISOString().split('T')[0];
}

stats._meta.last_updated = new Date().toISOString();
stats._meta.sessions_counted += uniqueSessions.size;

// Auto-promote skills reaching maturity threshold
for (const [id, s] of Object.entries(stats.skills)) {
  if (s.maturity_confirmations >= MATURITY_THRESHOLD && !s._promoted) {
    s._promoted = true;
    // Append maturity milestone to evolution.md
    try {
      const milestone = `\n## Maturity Milestone | ${new Date().toISOString().split('T')[0]}\n` +
        `Entry: ${id} (${s.name})\n` +
        `Confirmations: ${s.maturity_confirmations} — proven\n` +
        `Applied rate: ${Math.round(s.applied_rate * 100)}% over ${s.total_selections} selections\n`;
      if (fs.existsSync(EVOLUTION_PATH)) {
        fs.appendFileSync(EVOLUTION_PATH, milestone);
      }
    } catch (e) {}
  }
}

// Write stats
try {
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
} catch (e) {}

// Clear processed events (rotate)
try {
  const eventsSize = fs.statSync(EVENTS_PATH).size;
  if (eventsSize > MAX_EVENTS_SIZE) {
    // Keep last 200 lines
    const lines = fs.readFileSync(EVENTS_PATH, 'utf8').trim().split('\n');
    fs.writeFileSync(EVENTS_PATH, lines.slice(-200).join('\n') + '\n');
  }
} catch (e) {}
