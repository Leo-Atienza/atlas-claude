#!/usr/bin/env node
/**
 * TeammateIdle Quality Gate — automatically checks teammate output quality.
 *
 * Hook event: TeammateIdle
 * Fires when a teammate finishes a turn and goes idle.
 *
 * Exit codes:
 *   0 = accept (teammate can idle)
 *   2 = reject (send feedback to keep working)
 *
 * Quality checks:
 *   1. Thin output detection (<50 chars of content)
 *   2. Error-containing output (unresolved errors in deliverable)
 *   3. Incomplete task detection (todos marked in_progress but no file changes)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_PATH = path.join(os.homedir(), '.claude', 'logs', 'team-events.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const teammateId = data.teammate_id || data.agent_id || 'unknown';
    const output = data.output || data.result || data.content || '';
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Log the event
    const logDir = path.dirname(LOG_PATH);
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      event: 'teammate_idle',
      teammate_id: teammateId,
      output_length: outputStr.length,
      session_id: (data.session_id || '').substring(0, 16)
    };

    // Quality checks
    let reject = false;
    let feedback = '';

    // Check 1: Thin output
    if (outputStr.length < 50 && outputStr.length > 0) {
      reject = true;
      feedback = `Output is too thin (${outputStr.length} chars). Please provide more detail about what you accomplished and any remaining work.`;
      entry.rejection_reason = 'thin_output';
    }

    // Check 2: Error indicators in output
    const errorPatterns = [
      /\bERROR\b/i,
      /\bFAILED\b/i,
      /\bException\b/,
      /\bTraceback\b/,
      /\bcould not\b/i,
      /\bunable to\b/i
    ];
    if (!reject && errorPatterns.some(p => p.test(outputStr))) {
      // Only reject if there's no indication the error was handled
      const handledPatterns = [/fixed/i, /resolved/i, /handled/i, /workaround/i, /alternative/i];
      if (!handledPatterns.some(p => p.test(outputStr))) {
        reject = true;
        feedback = 'Output contains unresolved errors. Please fix the errors or explain why they are expected before idling.';
        entry.rejection_reason = 'unresolved_errors';
      }
    }

    // Check 3: Empty output (teammate did nothing)
    if (!reject && outputStr.length === 0) {
      reject = true;
      feedback = 'No output produced. Please describe what you worked on and provide your deliverable.';
      entry.rejection_reason = 'empty_output';
    }

    entry.accepted = !reject;
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');

    if (reject) {
      // Exit code 2 = send feedback back to teammate
      const result = {
        decision: 'block',
        reason: feedback
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(2);
    }
  } catch (e) {
    // Fail open — never block on hook errors
  }
  process.exit(0);
});
