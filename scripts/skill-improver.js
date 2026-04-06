#!/usr/bin/env node
/**
 * Skill Improvement Candidate Generator
 *
 * Analyzes skills used within the past N days and generates improvement
 * candidates for underperforming ones.
 *
 * Run via: scheduled task (every few days) or manually
 * Output: skills/.candidates/<skill-name>.candidate.md
 *
 * Candidates are NEVER auto-promoted — requires review via /skill:review.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs');
const CANDIDATES_DIR = path.join(CLAUDE_DIR, 'skills', '.candidates');
const STATS_PATH = path.join(LOGS_DIR, 'skill-stats.json');
const EVENTS_PATH = path.join(LOGS_DIR, 'skill-events.jsonl');

// Configurable: only look at skills used within this many days
const LOOKBACK_DAYS = parseInt(process.env.SKILL_LOOKBACK_DAYS || '5', 10);
const cutoffDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

fs.mkdirSync(CANDIDATES_DIR, { recursive: true });

// Load skill stats
let stats = {};
try {
  stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
} catch (e) {
  console.log('No skill-stats.json found. Run some sessions first.');
  process.exit(0);
}

// Build set of recently-used skills from events log
const recentSkills = new Set();
try {
  const lines = fs.readFileSync(EVENTS_PATH, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.ts && new Date(entry.ts) >= cutoffDate) {
        recentSkills.add(entry.skill_id);
      }
    } catch (e) {}
  }
} catch (e) {}

// Also check last_used from stats
const skills = stats.skills || {};
for (const [id, data] of Object.entries(skills)) {
  if (data.last_used) {
    const lastUsed = new Date(data.last_used);
    if (lastUsed >= cutoffDate) {
      recentSkills.add(id);
    }
  }
}

if (recentSkills.size === 0) {
  console.log(`No skills used in the past ${LOOKBACK_DAYS} days. Nothing to improve.`);
  process.exit(0);
}

console.log(`Found ${recentSkills.size} skill(s) used in the past ${LOOKBACK_DAYS} days.`);

// Identify underperforming skills among recently-used ones
const candidates = [];

for (const id of recentSkills) {
  const data = skills[id];
  if (!data) continue;

  const name = data.name || id;
  const totalSelections = data.total_selections || 0;
  const fallbackRate = data.fallback_rate || 0;
  const appliedRate = data.applied_rate || 0;

  let reason = '';
  let priority = 'low';

  if (fallbackRate > 0.50 && totalSelections >= 3) {
    reason = `High fallback rate: ${Math.round(fallbackRate * 100)}% over ${totalSelections} selections. Skill may not match actual use cases.`;
    priority = 'high';
  } else if (appliedRate < 0.20 && totalSelections >= 3) {
    reason = `Low application rate: ${Math.round(appliedRate * 100)}% over ${totalSelections} selections. Content may not match what's needed.`;
    priority = 'medium';
  } else if (totalSelections >= 5 && appliedRate < 0.30) {
    reason = `Selected ${totalSelections}x but rarely applied (${Math.round(appliedRate * 100)}%). Content may be outdated.`;
    priority = 'medium';
  }

  if (reason) {
    candidates.push({ id, name, reason, priority, fallbackRate, appliedRate, totalSelections });
  }
}

if (candidates.length === 0) {
  console.log('All recently-used skills performing within acceptable thresholds.');
  process.exit(0);
}

// Sort by priority
const priorityOrder = { high: 0, medium: 1, low: 2 };
candidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

// Generate candidate files (max 5)
let generated = 0;
for (const c of candidates.slice(0, 5)) {
  const candidatePath = path.join(CANDIDATES_DIR, `${c.name}.candidate.md`);

  const content = `---
skill_name: ${c.name}
skill_id: ${c.id}
priority: ${c.priority}
generated: ${new Date().toISOString()}
lookback_days: ${LOOKBACK_DAYS}
reason: ${c.reason}
metrics:
  fallback_rate: ${Math.round(c.fallbackRate * 100)}%
  applied_rate: ${Math.round(c.appliedRate * 100)}%
  total_selections: ${c.totalSelections}
status: pending_review
---

# Improvement Candidate: ${c.name}

## Problem
${c.reason}

## Suggested Investigation
1. Read the current SKILL.md and check if content matches current best practices
2. Search Context7 for updated documentation on the skill's technology
3. Compare the skill's patterns against real-world usage in recent sessions
4. Update keywords, examples, and patterns to match actual needs

## Review Actions
- \`/skill-review accept ${c.name}\` — promote improvements to active skill
- \`/skill-review dismiss ${c.name}\` — dismiss this candidate
`;

  fs.writeFileSync(candidatePath, content);
  generated++;
  console.log(`  [${c.priority.toUpperCase()}] ${c.name}: ${c.reason}`);
}

console.log(`\nGenerated ${generated} improvement candidate(s) in skills/.candidates/`);
console.log('Run /skill-review to review and act on candidates.');
