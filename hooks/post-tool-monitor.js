#!/usr/bin/env node
/**
 * Consolidated PostToolUse monitor — replaces 4 separate hooks:
 *   1. context-monitor.js    → context usage warnings + auto-continuation
 *   2. mistake-capture.py    → failure logging + pattern detection + tool counts
 *   3. hook-health-logger.js → hook execution time logging
 *   4. tool-efficiency.js    → tool call counting + efficiency warnings
 *
 * Single process spawn instead of 4 (3 Node + 1 Python) = ~75% overhead reduction.
 *
 * Matcher: Write|Edit|MultiEdit|Bash|Agent (same as the hooks it replaces)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const hookStart = Date.now();

// ── Config ──────────────────────────────────────────────────────────
const LOG_DIR = path.join(os.homedir(), '.claude', 'logs');
const CACHE_DIR = path.join(os.homedir(), '.claude', 'cache');
const TMP_DIR = os.tmpdir();

// Context monitor thresholds
const HANDOFF_THRESHOLD = 30;
const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const STALE_SECONDS = 120;
const DEBOUNCE_CALLS = 5;

// Tool efficiency thresholds
const EFFICIENCY_WARN_AT = [100, 200];

// Mistake capture error indicators
const ERROR_INDICATORS = [
  'error', 'Error', 'ERROR', 'FAILED', 'failed', 'Traceback', 'Exception',
  'command not found', 'No such file', 'Permission denied', 'exit code',
  'ENOENT', 'EPERM', 'EACCES', 'SyntaxError', 'TypeError', 'ReferenceError'
];

// ── Helpers ─────────────────────────────────────────────────────────
function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJsonSafe(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data)); } catch (e) {}
}

function appendLineSafe(filePath, line) {
  try { fs.appendFileSync(filePath, line + '\n'); } catch (e) {}
}

function rotateIfLarge(filePath, maxBytes) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > maxBytes) {
      fs.renameSync(filePath, filePath + '.bak');
    }
  } catch (e) {}
}

// ── Main ────────────────────────────────────────────────────────────
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || '';
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const toolResponse = data.tool_response || {};
    const messages = []; // Collect all additionalContext messages

    ensureDir(LOG_DIR);
    ensureDir(CACHE_DIR);

    // ── 0. Read-only fast path (skill tracking only) ────────────────
    if (toolName === 'Read') {
      const readPath = String(toolInput.file_path || '').replace(/\\/g, '/');
      if (readPath.endsWith('SKILL.md')) {
        const parts = readPath.split('/');
        let skillName = '';
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'skills' && i + 1 < parts.length) {
            skillName = parts[i + 1];
            break;
          }
        }
        const metaSkills = ['skill-creator', 'self-evolve'];
        if (skillName && !metaSkills.includes(skillName)) {
          const ts = new Date().toISOString();
          const sessionShort = sessionId.substring(0, 16);
          appendLineSafe(path.join(LOG_DIR, 'skill-outcomes.jsonl'), JSON.stringify({
            ts, event: 'activated', skill_name: skillName, file_path: readPath, session_id: sessionShort
          }));
          appendLineSafe(path.join(LOG_DIR, 'skill-events.jsonl'), JSON.stringify({
            ts, event: 'applied', skill_id: '', skill_name: skillName, session: sessionShort
          }));
        }
      }
      process.exit(0);
    }

    // ── 1. Tool Efficiency Tracking ─────────────────────────────────
    const counterFile = path.join(CACHE_DIR, `efficiency-${sessionId.substring(0, 16)}.json`);
    let counters = readJsonSafe(counterFile, {
      session_id: sessionId.substring(0, 16),
      started: new Date().toISOString(),
      tools: {},
      total: 0
    });

    counters.tools[toolName] = (counters.tools[toolName] || 0) + 1;
    counters.total = (counters.total || 0) + 1;
    counters.last_tool = toolName;
    counters.last_ts = new Date().toISOString();
    writeJsonSafe(counterFile, counters);

    if (EFFICIENCY_WARN_AT.includes(counters.total)) {
      const breakdown = Object.entries(counters.tools)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([t, c]) => `${t}:${c}`)
        .join(', ');
      messages.push(`EFFICIENCY NOTE: ${counters.total} tool calls this session. Breakdown: ${breakdown}. Consider if approach can be streamlined.`);
    }

    // ── 2. Mistake Capture ──────────────────────────────────────────
    const responseStr = typeof toolResponse === 'string' ? toolResponse : JSON.stringify(toolResponse);
    let isFailure = false;

    if (typeof toolResponse === 'object' && toolResponse !== null) {
      if (toolResponse.error) isFailure = true;
      const exitCode = toolResponse.exitCode || toolResponse.exit_code || 0;
      if (exitCode && parseInt(exitCode) !== 0) isFailure = true;
      const stderr = String(toolResponse.stderr || '');
      if (stderr && ERROR_INDICATORS.some(ind => stderr.includes(ind))) isFailure = true;
    } else if (typeof toolResponse === 'string' && ERROR_INDICATORS.some(ind => toolResponse.includes(ind))) {
      isFailure = true;
    }

    if (!isFailure) {
      const output = String(
        (typeof toolResponse === 'object' && toolResponse !== null ? toolResponse.output : toolResponse) || ''
      ).substring(0, 2000);
      if (ERROR_INDICATORS.some(ind => output.includes(ind)) && ['Bash', 'Write', 'Edit', 'MultiEdit'].includes(toolName)) {
        isFailure = true;
      }
    }

    if (isFailure) {
      // Log the failure
      const errorText = typeof toolResponse === 'object' && toolResponse !== null
        ? String(toolResponse.error || toolResponse.output || '').substring(0, 500)
        : String(toolResponse).substring(0, 500);
      const command = String(toolInput.command || '').substring(0, 300);
      const filePath = String(toolInput.file_path || '');

      const entry = {
        ts: new Date().toISOString(),
        tool: toolName,
        command,
        file_path: filePath,
        error: errorText,
        session: sessionId.substring(0, 16),
      };

      const failuresPath = path.join(LOG_DIR, 'failures.jsonl');
      appendLineSafe(failuresPath, JSON.stringify(entry));

      // Pattern detection
      const fingerprint = crypto.createHash('md5')
        .update(`${toolName}:${errorText.substring(0, 100)}`)
        .digest('hex')
        .substring(0, 12);
      const patternsPath = path.join(LOG_DIR, 'error-patterns.json');
      const patterns = readJsonSafe(patternsPath, {});

      if (!patterns[fingerprint]) {
        patterns[fingerprint] = { count: 0, tool: toolName, sample: errorText.substring(0, 100), first_seen: entry.ts };
      }
      patterns[fingerprint].count++;
      patterns[fingerprint].last_seen = entry.ts;
      writeJsonSafe(patternsPath, patterns);

      if (patterns[fingerprint].count >= 3) {
        messages.push(
          `RECURRING FAILURE (${patterns[fingerprint].count}x): ${toolName} — ${errorText.substring(0, 80)}... ` +
          `Per CLAUDE.md Mistake Learning rules: run /learn NOW to codify this as a G-ERR topic.`
        );
      }

      // Rotate at 2MB (aligned with session-start.sh)
      rotateIfLarge(failuresPath, 2_000_000);
    } else {
      // Track successful tool call counts (buffered: flush every 10th call)
      const countsPath = path.join(LOG_DIR, 'tool-call-counts.json');
      const counts = readJsonSafe(countsPath, {});
      counts[toolName] = (counts[toolName] || 0) + 1;
      if (counts[toolName] % 10 === 0 || counts[toolName] === 1) {
        writeJsonSafe(countsPath, counts);
      }

      // Skill tracking for Read events is handled in the fast path above (section 0)
    }

    // ── 3. Context Monitor ──────────────────────────────────────────
    if (sessionId) {
      const metricsPath = path.join(TMP_DIR, `claude-ctx-${sessionId}.json`);

      if (fs.existsSync(metricsPath)) {
        const metrics = readJsonSafe(metricsPath, null);
        if (metrics) {
          const now = Math.floor(Date.now() / 1000);

          if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
            messages.push(`CONTEXT MONITOR: Metrics stale (>${now - metrics.timestamp}s). Context usage unknown — statusline may not be running.`);
          } else {
            const remaining = metrics.remaining_percentage;
            const usedPct = metrics.used_pct;

            if (remaining !== undefined && remaining <= WARNING_THRESHOLD) {
              const warnPath = path.join(TMP_DIR, `claude-ctx-${sessionId}-warned.json`);
              let warnData = readJsonSafe(warnPath, { callsSinceWarn: 0, lastLevel: null, handoffFired: false });
              let firstWarn = !fs.existsSync(warnPath);
              warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

              // Auto-continuation handoff at 30% remaining
              if (remaining <= HANDOFF_THRESHOLD && !warnData.handoffFired) {
                warnData.handoffFired = true;
                writeJsonSafe(warnPath, warnData);

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const homeDir = os.homedir();
                const handoffPath = path.join(homeDir, '.claude', 'sessions', `handoff-${timestamp}.md`);
                const cwd = data.cwd || process.cwd();

                const triggerPath = path.join(TMP_DIR, `claude-handoff-${sessionId}.trigger`);
                try { fs.writeFileSync(triggerPath, `${handoffPath}\n${cwd}\n0\n`); } catch (e) {}

                messages.push(
                  `AUTO-CONTINUATION TRIGGERED: Context at ${usedPct}% (${remaining}% remaining).\n\n` +
                  `You MUST now write a handoff file so a new session can continue your work.\n\n` +
                  `WRITE THIS FILE: ${handoffPath}\n\n` +
                  `Use this EXACT format:\n---\ntask_description: [What you are working on — 1-2 sentences]\n` +
                  `branch: [Current git branch name]\ncwd: ${cwd}\nmodified_files:\n  - [list each file you modified this session]\n` +
                  `uncommitted_changes: [true/false]\nplan_state: [path to .flow/ plan if any, or "none"]\n` +
                  `plan_progress: [which steps completed, which remain]\ntest_status: [last test result: pass/fail/not-run]\n` +
                  `immediate_next_action: [EXACT next step to take — be specific]\ncontext_notes: |\n` +
                  `  [Any important context that would be lost — decisions made, patterns discovered,\n` +
                  `   things tried that didn't work, user preferences noted]\ntodo_state: |\n` +
                  `  [Copy your current in-progress and pending todos here]\n---\n\n` +
                  `After writing the handoff file, say "Continuing in new session..." and STOP working. A new session will automatically pick up from your handoff.`
                );
              } else {
                // Standard warning/critical
                const isCritical = remaining <= CRITICAL_THRESHOLD;
                const currentLevel = isCritical ? 'critical' : 'warning';
                const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';

                if (firstWarn || warnData.callsSinceWarn >= DEBOUNCE_CALLS || severityEscalated) {
                  warnData.callsSinceWarn = 0;
                  warnData.lastLevel = currentLevel;
                  writeJsonSafe(warnPath, warnData);

                  if (isCritical) {
                    messages.push(`CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted.`);
                  } else {
                    messages.push(`CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. Begin wrapping up current task. Do not start new complex work.`);
                  }
                } else {
                  writeJsonSafe(warnPath, warnData);
                }
              }
            }
          }
        }
      }
    }

    // ── 4. Hook Health Logging ───────────────────────────────────────
    const hookDuration = Date.now() - hookStart;
    appendLineSafe(
      path.join(LOG_DIR, 'hook-health.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: 'post-tool-monitor', duration_ms: hookDuration, tool: toolName })
    );

    // ── Emit collected messages ──────────────────────────────────────
    if (messages.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: messages.join('\n\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch (e) {
    // Never fail — fail open
  }
  process.exit(0);
});
