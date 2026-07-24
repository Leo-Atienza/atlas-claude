#!/usr/bin/env node
/**
 * rotate-chatty-logs.js
 *
 * Custom cleanup rule. Rotates the four chatty logs at a 500KB threshold
 * (vs lib.js's default 2MB) so they don't balloon to multi-MB before the
 * agent gets useful analytics from them.
 *
 * Targets: local-llm-reads.jsonl, tool-failures.jsonl, action-graph-stats.jsonl,
 * hook-health.jsonl. Rotation is non-destructive (.bak suffix); paired with
 * the log-bak-prune rule which expires .bak files after 30 days.
 *
 * Added 2026-05-15 per audit recommendation (P1-5 in plans/thoroughly-evaluate-my-claude-serene-quail.md).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { paths, rotateIfLarge } = require('../lib');

const THRESHOLD = 500_000; // 500KB — tighter than lib.js default
const TARGETS = [
  'local-llm-reads.jsonl',
  'tool-failures.jsonl',
  'action-graph-stats.jsonl',
  'hook-health.jsonl',
  'subagent-stats.jsonl',
  'user-rejections.jsonl',
  'preview-health-gate.jsonl',
];

function run() {
  const result = { rotated: [], skipped: [] };
  for (const name of TARGETS) {
    const filePath = path.join(paths.logs, name);
    try {
      if (!fs.existsSync(filePath)) {
        result.skipped.push({ file: name, reason: 'missing' });
        continue;
      }
      const size = fs.statSync(filePath).size;
      if (size <= THRESHOLD) {
        result.skipped.push({ file: name, reason: 'under-threshold', size });
        continue;
      }
      rotateIfLarge(filePath, THRESHOLD);
      result.rotated.push({ file: name, size });
    } catch (err) {
      result.skipped.push({ file: name, reason: 'error', err: err.code || err.message });
    }
  }
  return result;
}

// Cleanup-runner contract: stdout JSON line consumed by cleanup-runner.js
const out = run();
process.stdout.write(JSON.stringify({
  rotated_count: out.rotated.length,
  skipped_count: out.skipped.length,
  rotated: out.rotated.map(r => r.file),
}) + '\n');
