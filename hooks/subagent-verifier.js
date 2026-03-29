#!/usr/bin/env node
// SubagentStop hook — Verifies agent deliverables on completion.
//
// When an agent finishes, checks if the output looks substantial.
// Injects a warning if the deliverable appears empty, errored, or too thin.
// Also updates the concurrent agent tracker and logs completion.
//
// Inspired by oh-my-claudecode's verify-deliverables.

const fs = require('fs');
const os = require('os');
const path = require('path');

const MIN_OUTPUT_LENGTH = 30; // Agent output shorter than this is suspicious

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || '';
    const agentType = data.subagent_type || data.tool_input?.subagent_type || 'general-purpose';
    const output = data.tool_response?.output || data.tool_response?.result || '';
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Log completion event
    const logDir = path.join(os.homedir(), '.claude', 'logs');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}

    const isError = /error|Error|ERROR|FAILED|timed?\s*out|Exception/i.test(outputStr.slice(0, 500));
    const isThin = outputStr.length < MIN_OUTPUT_LENGTH;

    const entry = {
      ts: new Date().toISOString(),
      event: 'stop',
      session: sessionId.slice(0, 16),
      agent_type: agentType,
      output_length: outputStr.length,
      has_error: isError,
      is_thin: isThin,
    };

    const logPath = path.join(logDir, 'subagent-events.jsonl');
    try {
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (e) {}

    // Update concurrent agent tracker (remove one of this type)
    const concurrentPath = path.join(os.tmpdir(), `claude-agents-${sessionId}.json`);
    try {
      if (fs.existsSync(concurrentPath)) {
        let agents = JSON.parse(fs.readFileSync(concurrentPath, 'utf8'));
        const idx = agents.findIndex(a => a.type === agentType);
        if (idx >= 0) agents.splice(idx, 1);
        fs.writeFileSync(concurrentPath, JSON.stringify(agents));
      }
    } catch (e) {}

    // Verify deliverable quality
    const warnings = [];

    if (isThin && !isError) {
      warnings.push(`Agent "${agentType}" returned very short output (${outputStr.length} chars). Verify it completed its task.`);
    }

    if (isError) {
      warnings.push(`Agent "${agentType}" output contains error indicators. Review before using its results.`);
    }

    if (warnings.length > 0) {
      const hookOutput = {
        hookSpecificOutput: {
          hookEventName: "SubagentStop",
          additionalContext: `DELIVERABLE CHECK: ${warnings.join(' ')}`
        }
      };
      process.stdout.write(JSON.stringify(hookOutput));
    }

  } catch (e) {
    process.exit(0);
  }
});
