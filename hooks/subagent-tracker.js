#!/usr/bin/env node
// SubagentStart hook — Tracks agent spawning events.
//
// Logs every agent spawn to logs/subagent-events.jsonl with metadata.
// Injects context reminding the parent agent of deliverable expectations.
// Inspired by oh-my-claudecode's subagent-tracker.
//
// Also enforces a concurrent agent limit (max 6) to prevent runaway spawns.

const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_CONCURRENT = 6;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || '';
    const agentType = data.subagent_type || data.tool_input?.subagent_type || 'general-purpose';
    const model = data.tool_input?.model || 'default';
    const description = (data.tool_input?.description || '').slice(0, 200);
    const background = data.tool_input?.run_in_background || false;

    // Log the spawn event
    const logDir = path.join(os.homedir(), '.claude', 'logs');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}

    const entry = {
      ts: new Date().toISOString(),
      event: 'start',
      session: sessionId.slice(0, 16),
      agent_type: agentType,
      model,
      description,
      background,
    };

    const logPath = path.join(logDir, 'subagent-events.jsonl');
    try {
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (e) {}

    // Track concurrent agents via temp file
    const concurrentPath = path.join(os.tmpdir(), `claude-agents-${sessionId}.json`);
    let agents = [];
    try {
      if (fs.existsSync(concurrentPath)) {
        agents = JSON.parse(fs.readFileSync(concurrentPath, 'utf8'));
      }
    } catch (e) { agents = []; }

    agents.push({ type: agentType, description, ts: entry.ts });
    try {
      fs.writeFileSync(concurrentPath, JSON.stringify(agents));
    } catch (e) {}

    // Warn if too many concurrent agents
    if (agents.length > MAX_CONCURRENT) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "SubagentStart",
          additionalContext: `AGENT LIMIT WARNING: ${agents.length} concurrent agents (max ${MAX_CONCURRENT}). ` +
            `Wait for existing agents to complete before spawning more. ` +
            `Active: ${agents.map(a => a.type).join(', ')}`
        }
      };
      process.stdout.write(JSON.stringify(output));
    }

    // Rotate log if over 3MB
    try {
      if (fs.existsSync(logPath) && fs.statSync(logPath).size > 3_000_000) {
        fs.renameSync(logPath, logPath + '.bak');
      }
    } catch (e) {}

  } catch (e) {
    process.exit(0);
  }
});
