#!/usr/bin/env node
/**
 * Skill Evolution Engine — PostToolUse hook
 *
 * Monitors when SKILL.md files are read (indicating skill activation).
 * Tracks skill usage outcomes to logs/skill-outcomes.jsonl.
 * This data feeds into skill-improver.js for automated skill improvement.
 *
 * Hook event: PostToolUse (matcher: Read)
 * Lightweight: only fires on Read tool, checks path pattern, appends one line.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_DIR = path.join(os.homedir(), '.claude', 'logs');
const OUTCOMES_PATH = path.join(LOG_DIR, 'skill-outcomes.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};

    // Only track Read tool calls that load SKILL.md files
    if (toolName !== 'Read') {
      process.exit(0);
      return;
    }

    const filePath = (toolInput.file_path || '').replace(/\\/g, '/');
    if (!filePath.endsWith('SKILL.md')) {
      process.exit(0);
      return;
    }

    // Extract skill name from path: .../skills/<name>/SKILL.md
    const parts = filePath.split('/');
    const skillsIdx = parts.lastIndexOf('skills');
    if (skillsIdx === -1 || skillsIdx + 1 >= parts.length) {
      process.exit(0);
      return;
    }
    const skillName = parts[skillsIdx + 1];

    // Skip if this is a meta-read (skill-creator reading its own template, etc.)
    const metaSkills = ['skill-creator', 'self-evolve'];
    if (metaSkills.includes(skillName)) {
      process.exit(0);
      return;
    }

    // Log the skill activation event
    const entry = {
      ts: new Date().toISOString(),
      event: 'activated',
      skill_name: skillName,
      file_path: filePath,
      session_id: (data.session_id || '').substring(0, 16)
    };

    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(OUTCOMES_PATH, JSON.stringify(entry) + '\n');

  } catch (e) {
    // Never fail — telemetry is best-effort
  }
  process.exit(0);
});
