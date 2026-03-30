#!/usr/bin/env node
/**
 * TaskCompleted Auto-Verification — verifies task deliverables on completion.
 *
 * Hook event: TaskCompleted
 * Fires when a task is marked as done.
 *
 * Exit codes:
 *   0 = accept completion
 *   2 = reject completion (task reopened with feedback)
 *
 * Checks:
 *   1. If project has tests, verify they pass
 *   2. If .flow/ exists, verify state.yaml is consistent
 *   3. Log completion event for analytics
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const LOG_PATH = path.join(os.homedir(), '.claude', 'logs', 'team-events.jsonl');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const taskId = data.task_id || data.id || 'unknown';
    const taskName = data.task_name || data.name || data.content || '';

    // Log the completion event
    const logDir = path.dirname(LOG_PATH);
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      event: 'task_completed',
      task_id: taskId,
      task_name: taskName.substring(0, 200),
      session_id: (data.session_id || '').substring(0, 16)
    };

    let reject = false;
    let feedback = '';

    // Check 1: Run project tests if test runner exists
    const cwd = process.cwd();
    const testRunners = [
      { file: 'package.json', cmd: 'npm test -- --watchAll=false 2>&1 | tail -20', name: 'npm test' },
      { file: 'Cargo.toml', cmd: 'cargo test 2>&1 | tail -20', name: 'cargo test' },
      { file: 'pyproject.toml', cmd: 'python -m pytest --tb=short -q 2>&1 | tail -20', name: 'pytest' },
      { file: 'go.mod', cmd: 'go test ./... 2>&1 | tail -20', name: 'go test' }
    ];

    for (const runner of testRunners) {
      if (fs.existsSync(path.join(cwd, runner.file))) {
        try {
          // Quick test run with 30s timeout
          const result = execSync(runner.cmd, {
            cwd,
            timeout: 30000,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          entry.tests_passed = true;
          entry.test_runner = runner.name;
        } catch (testErr) {
          // Test failure — reject completion
          const stderr = (testErr.stderr || testErr.stdout || '').substring(0, 500);
          reject = true;
          feedback = `Tests failed (${runner.name}). Please fix failing tests before marking complete.\n\n${stderr}`;
          entry.tests_passed = false;
          entry.test_runner = runner.name;
          entry.test_error = stderr.substring(0, 200);
        }
        break; // Only run first matching test runner
      }
    }

    // Check 2: .flow/ state consistency
    const flowState = path.join(cwd, '.flow', 'state.yaml');
    if (!reject && fs.existsSync(flowState)) {
      const stateContent = fs.readFileSync(flowState, 'utf8');
      if (!stateContent.includes('status:')) {
        // Don't reject for this, just warn
        entry.flow_state_warning = 'state.yaml missing status field';
      }
    }

    entry.accepted = !reject;
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');

    if (reject) {
      const result = {
        decision: 'block',
        reason: feedback
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(2);
    }
  } catch (e) {
    // Fail open
  }
  process.exit(0);
});
