#!/usr/bin/env node
/**
 * Skill Improvement Candidate Generator
 *
 * Analyzes skill performance data (skill-stats.json + skill-outcomes.jsonl)
 * and generates improvement candidates for underperforming skills.
 *
 * Run via: /dream (phase 5) or scheduled weekly task
 * Output: skills/.candidates/<skill-name>.candidate.md
 *
 * Candidates are NEVER auto-promoted — requires manual review via /skill:review.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs');
const CANDIDATES_DIR = path.join(CLAUDE_DIR, 'skills', '.candidates');
const STATS_PATH = path.join(LOGS_DIR, 'skill-stats.json');
const OUTCOMES_PATH = path.join(LOGS_DIR, 'skill-outcomes.jsonl');

// Ensure candidates directory exists
fs.mkdirSync(CANDIDATES_DIR, { recursive: true });

// Load skill stats
let stats = {};
try {
  stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
} catch (e) {
  console.log('No skill-stats.json found. Run some sessions first.');
  process.exit(0);
}

// Load outcomes for activation frequency
const activations = {};
try {
  const lines = fs.readFileSync(OUTCOMES_PATH, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const name = entry.skill_name;
      if (!activations[name]) activations[name] = { count: 0, sessions: new Set() };
      activations[name].count++;
      if (entry.session_id) activations[name].sessions.add(entry.session_id);
    } catch (e) {}
  }
} catch (e) {}

// Identify underperforming skills
const candidates = [];
const skills = stats.skills || {};

for (const [id, data] of Object.entries(skills)) {
  const name = data.name || id;
  const totalSelections = data.total_selections || 0;
  const fallbackRate = data.fallback_rate || 0;
  const appliedRate = data.applied_rate || 0;

  // Criteria for improvement candidates:
  // 1. High fallback rate (>50%) with sufficient data (5+ selections)
  // 2. Low application rate (<20%) with sufficient activations (3+)
  // 3. Never applied despite multiple activations
  let reason = '';
  let priority = 'low';

  if (fallbackRate > 0.50 && totalSelections >= 5) {
    reason = `High fallback rate: ${Math.round(fallbackRate * 100)}% over ${totalSelections} selections. Keywords may not match actual use cases.`;
    priority = 'high';
  } else if (appliedRate < 0.20 && totalSelections >= 3) {
    reason = `Low application rate: ${Math.round(appliedRate * 100)}% over ${totalSelections} selections. Skill content may not match what users need.`;
    priority = 'medium';
  }

  const activation = activations[name];
  if (activation && activation.count >= 5 && !reason) {
    const uniqueSessions = activation.sessions.size;
    if (uniqueSessions >= 3 && appliedRate < 0.30) {
      reason = `Activated ${activation.count}x across ${uniqueSessions} sessions but rarely applied. Content may be outdated or mismatched.`;
      priority = 'medium';
    }
  }

  if (reason) {
    candidates.push({ id, name, reason, priority, fallbackRate, appliedRate, totalSelections });
  }
}

if (candidates.length === 0) {
  console.log('All skills performing within acceptable thresholds. No candidates generated.');
  process.exit(0);
}

// Sort by priority (high > medium > low)
const priorityOrder = { high: 0, medium: 1, low: 2 };
candidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

// Generate candidate files
let generated = 0;
for (const c of candidates.slice(0, 5)) { // Max 5 candidates per run
  const candidatePath = path.join(CANDIDATES_DIR, `${c.name}.candidate.md`);

  const content = `---
skill_name: ${c.name}
skill_id: ${c.id}
priority: ${c.priority}
generated: ${new Date().toISOString()}
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
1. Read the current SKILL.md and check if its content matches current best practices
2. Search Context7 for updated documentation on the skill's technology
3. Check if the skill's keywords in REGISTRY.md match actual user prompts
4. Compare the skill's patterns against real-world usage in recent sessions

## Review Actions
- \`/skill:review accept ${c.name}\` — promote improvements to active skill
- \`/skill:review dismiss ${c.name}\` — dismiss this candidate
- \`/skill:review investigate ${c.name}\` — deep-dive into the skill's performance data
`;

  fs.writeFileSync(candidatePath, content);
  generated++;
  console.log(`  [${c.priority.toUpperCase()}] ${c.name}: ${c.reason}`);
}

console.log(`\nGenerated ${generated} improvement candidate(s) in skills/.candidates/`);
console.log('Run /skill:review to review and act on candidates.');
