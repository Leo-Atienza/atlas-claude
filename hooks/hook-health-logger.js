#!/usr/bin/env node
/**
 * Hook Health Logger — Utility for hooks to log their execution time.
 *
 * Usage from other hooks:
 *   const start = Date.now();
 *   // ... hook logic ...
 *   require('./hook-health-logger').log('context-monitor', Date.now() - start);
 *
 * Or standalone: tracks PostToolUse hook orchestration time.
 * Writes to logs/hook-health.jsonl for session-start aggregation.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_PATH = path.join(os.homedir(), '.claude', 'logs', 'hook-health.jsonl');

function log(hookName, durationMs, metadata = {}) {
  try {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      hook: hookName,
      duration_ms: durationMs,
      ...metadata
    });
    fs.appendFileSync(LOG_PATH, entry + '\n');
  } catch (e) {
    // Never fail — telemetry is best-effort
  }
}

module.exports = { log };

// If run directly as a PostToolUse hook, measure and log orchestration overhead
if (require.main === module) {
  const start = Date.now();
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      log('posttooluse-orchestration', Date.now() - start, {
        tool: data.tool_name || 'unknown'
      });
    } catch (e) {
      // ignore
    }
    process.exit(0);
  });
}
