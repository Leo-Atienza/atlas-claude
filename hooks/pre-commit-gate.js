#!/usr/bin/env node
// PreToolUse hook — injects a build/test reminder before git commit commands.
//
// Detects `git commit` in Bash tool calls and outputs additionalContext
// reminding Claude to verify build+tests first. Lightweight: no subprocesses.

const { readStdin, isHookEnabled, injectContext } = require('./lib');

if (!isHookEnabled('pre-commit-gate')) process.exit(0);

const COMMIT_PATTERN = /\bgit\s+commit\b/;

readStdin((data) => {
  const command = data.tool_input?.command || '';

  if (!COMMIT_PATTERN.test(command)) {
    process.exit(0);
  }

  // Inject reminder — does not block, just adds context
  injectContext(
    'PRE-COMMIT GATE: You are about to run git commit. ' +
    'Ensure you have run the full build and test suite this session and both passed. ' +
    'If not, run them now before committing. ' +
    'Include test count and pass rate in the commit message body.'
  );
});
