#!/usr/bin/env node
/**
 * Tool Efficiency Tracker — PostToolUse hook
 *
 * Counts tool calls per session. At scale, enables detecting sessions that
 * used significantly more tool calls than typical for their task complexity.
 *
 * Writes to: logs/session-efficiency.jsonl (one entry per tool call, aggregated at Stop)
 * Hook event: PostToolUse (matcher: Write|Edit|MultiEdit|Bash|Agent)
 * Lightweight: increments a counter file, no LLM calls
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.claude', 'cache');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = (data.session_id || 'unknown').substring(0, 16);
    const toolName = data.tool_name || 'unknown';
    const counterFile = path.join(CACHE_DIR, `efficiency-${sessionId}.json`);

    fs.mkdirSync(CACHE_DIR, { recursive: true });

    // Load or initialize counter
    let counters = {};
    try {
      counters = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
    } catch (e) {
      counters = { session_id: sessionId, started: new Date().toISOString(), tools: {}, total: 0 };
    }

    // Increment
    counters.tools[toolName] = (counters.tools[toolName] || 0) + 1;
    counters.total = (counters.total || 0) + 1;
    counters.last_tool = toolName;
    counters.last_ts = new Date().toISOString();

    fs.writeFileSync(counterFile, JSON.stringify(counters));

    // Warn at high tool call counts (possible inefficiency)
    if (counters.total === 100 || counters.total === 200) {
      const result = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `EFFICIENCY NOTE: ${counters.total} tool calls this session. Breakdown: ${
            Object.entries(counters.tools)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([t, c]) => `${t}:${c}`)
              .join(', ')
          }. Consider if approach can be streamlined.`
        }
      };
      process.stdout.write(JSON.stringify(result));
    }
  } catch (e) {
    // Never fail
  }
  process.exit(0);
});
