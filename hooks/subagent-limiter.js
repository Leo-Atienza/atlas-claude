#!/usr/bin/env node
// PreToolUse hook — blocks Agent spawning when concurrent limit (6) is reached
// Reads the concurrent agent count from subagent-tracker.js's state file

const fs = require('fs');
const path = require('path');
const os = require('os');

const MAX_CONCURRENT = 6;
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

try {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';

    // Only check Agent tool calls
    if (toolName !== 'Agent') {
      process.exit(0);
      return;
    }

    const sessionId = data.session_id || 'unknown';
    const stateFile = path.join(os.tmpdir(), `claude-agents-${sessionId}.json`);

    // If no state file, allow (no agents running)
    if (!fs.existsSync(stateFile)) {
      process.exit(0);
      return;
    }

    const stat = fs.statSync(stateFile);
    const ageMs = Date.now() - stat.mtimeMs;

    // If state file is stale, allow (data unreliable)
    if (ageMs > STALE_THRESHOLD_MS) {
      process.exit(0);
      return;
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    // Tracker writes a bare array, not { active: [...] }
    const activeCount = Array.isArray(state) ? state.length
      : Array.isArray(state.active) ? state.active.length : 0;

    if (activeCount >= MAX_CONCURRENT) {
      const result = {
        decision: 'block',
        reason: `Concurrent agent limit reached (${activeCount}/${MAX_CONCURRENT}). Wait for running agents to complete before spawning new ones.`
      };
      process.stdout.write(JSON.stringify(result));
    } else if (activeCount >= 3) {
      // Tier-routing advisory when many agents are active
      const advisory = {
        additionalContext: `TIER ROUTING: ${activeCount}/${MAX_CONCURRENT} agents active. Prefer model:"haiku" or model:"sonnet" for remaining agents to manage cost. Reserve Opus (default) for complex reasoning tasks only.`
      };
      process.stdout.write(JSON.stringify(advisory));
    }

    process.exit(0);
  });
} catch (e) {
  // Never block on errors — fail open
  process.exit(0);
}
