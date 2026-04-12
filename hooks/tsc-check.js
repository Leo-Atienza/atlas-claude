#!/usr/bin/env node
// PostToolUse TypeScript check — only runs tsc when the edited file is .ts/.tsx.
//
// Replaces the blanket `npx tsc --noEmit` that fired on EVERY Write/Edit
// (including .css, .md, .json, etc.) with a 30s timeout.
//
// Now: checks file_path extension first, skips non-TS files entirely.
// Timeout reduced to 15s. Outputs first 20 lines of errors.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readStdin, isHookEnabled } = require('./lib');

if (!isHookEnabled('tsc-check')) process.exit(0);

const TS_EXT = /\.(ts|tsx|mts|cts)$/;

readStdin((data) => {
  const filePath = data.tool_input?.file_path || '';

  // Skip non-TypeScript files entirely
  if (!filePath || !TS_EXT.test(filePath)) {
    process.exit(0);
  }

  // Skip if no tsconfig.json in the project
  const cwd = data.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
    process.exit(0);
  }

  try {
    const output = execSync('npx tsc --noEmit 2>&1', {
      cwd,
      timeout: 15000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // tsc succeeded (exit 0) — no type errors
  } catch (err) {
    // tsc returns non-zero when there are type errors
    const stdout = (err.stdout || '').trim();
    if (stdout) {
      const lines = stdout.split('\n').slice(0, 20);
      process.stdout.write(JSON.stringify({
        additionalContext: 'TSC TYPE ERRORS:\n' + lines.join('\n'),
      }));
    }
  }
});
