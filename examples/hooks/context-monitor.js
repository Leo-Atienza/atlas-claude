#!/usr/bin/env node
// Context Monitor - PostToolUse hook
// Reads context metrics from the statusline bridge file and injects
// warnings when context usage is high. This makes the AGENT aware of
// context limits (the statusline only shows the user).
//
// How it works:
// 1. The statusline hook writes metrics to /tmp/claude-ctx-{session_id}.json
// 2. This hook reads those metrics after each tool use
// 3. When remaining context drops below thresholds, it injects a warning
//    as additionalContext, which the agent sees in its conversation
//
// Thresholds:
//   WARNING  (remaining <= 35%): Agent should wrap up current task
//   CRITICAL (remaining <= 25%): Agent should stop immediately and save state
//
// Debounce: 5 tool uses between warnings to avoid spam
// Severity escalation bypasses debounce (WARNING -> CRITICAL fires immediately)

const fs = require('fs');
const os = require('os');
const path = require('path');

const HANDOFF_THRESHOLD = 30;  // remaining_percentage <= 30% (70% used) → trigger auto-continuation
const WARNING_THRESHOLD = 35;  // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
const STALE_SECONDS = 60;      // ignore metrics older than 60s
const DEBOUNCE_CALLS = 5;      // min tool uses between warnings

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;

    if (!sessionId) {
      process.exit(0);
    }

    const tmpDir = os.tmpdir();
    const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);

    // If no metrics file, this is a subagent or fresh session -- exit silently
    if (!fs.existsSync(metricsPath)) {
      process.exit(0);
    }

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);

    // If metrics are stale (>120s), warn instead of silently ignoring
    if (metrics.timestamp && (now - metrics.timestamp) > 120) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: "CONTEXT MONITOR: Metrics stale (>" + (now - metrics.timestamp) + "s). Context usage unknown — statusline may not be running."
        }
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;

    // No warning needed
    if (remaining > WARNING_THRESHOLD) {
      process.exit(0);
    }

    // Debounce: check if we warned recently
    const warnPath = path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null, handoffFired: false };
    let firstWarn = true;

    if (fs.existsSync(warnPath)) {
      try {
        warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
        firstWarn = false;
      } catch (e) {
        // Corrupted file, reset
      }
    }

    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    // ─── AUTO-CONTINUATION: Handoff at 30% remaining (70% used) ────────
    // This fires ONCE per session. Writes a trigger file and injects
    // instructions for the agent to write a structured handoff file.
    if (remaining <= HANDOFF_THRESHOLD && !warnData.handoffFired) {
      warnData.handoffFired = true;
      fs.writeFileSync(warnPath, JSON.stringify(warnData));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const homeDir = os.homedir();
      const handoffPath = path.join(homeDir, '.claude', 'sessions', `handoff-${timestamp}.md`);
      const cwd = data.cwd || process.cwd();

      // Write trigger file for session-stop.sh → auto-continue.sh
      const triggerPath = path.join(tmpDir, `claude-handoff-${sessionId}.trigger`);
      try {
        fs.writeFileSync(triggerPath, `${handoffPath}\n${cwd}\n0\n`);
      } catch (e) {
        // If trigger write fails, still inject the warning
      }

      const handoffMessage = `AUTO-CONTINUATION TRIGGERED: Context at ${usedPct}% (${remaining}% remaining).

You MUST now write a handoff file so a new session can continue your work.

WRITE THIS FILE: ${handoffPath}

Use this EXACT format:
---
task_description: [What you are working on — 1-2 sentences]
branch: [Current git branch name]
cwd: ${cwd}
modified_files:
  - [list each file you modified this session]
uncommitted_changes: [true/false]
plan_state: [path to .flow/ plan if any, or "none"]
plan_progress: [which steps completed, which remain]
test_status: [last test result: pass/fail/not-run]
immediate_next_action: [EXACT next step to take — be specific]
context_notes: |
  [Any important context that would be lost — decisions made, patterns discovered,
   things tried that didn't work, user preferences noted]
todo_state: |
  [Copy your current in-progress and pending todos here]
---

After writing the handoff file, say "Continuing in new session..." and STOP working. A new session will automatically pick up from your handoff.`;

      const output = {
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: handoffMessage
        }
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }
    // ─── END AUTO-CONTINUATION ─────────────────────────────────────────

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';

    // Emit immediately on first warning, then debounce subsequent ones
    // Severity escalation (WARNING -> CRITICAL) bypasses debounce
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      // Update counter and exit without warning
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }

    // Reset debounce counter
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    // Build warning message
    let message;
    if (isCritical) {
      message = `CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted.';
    } else {
      message = `CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'Begin wrapping up current task. Do not start new complex work.';
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail -- never block tool execution
    process.exit(0);
  }
});
