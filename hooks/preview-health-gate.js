#!/usr/bin/env node
/**
 * PreToolUse: Preview health-gate.
 *
 * Fires on every browser-preview call — the current `mcp__Claude_Browser__*`
 * tools and the legacy `mcp__Claude_Preview__preview_*` names. Reads the running
 * tool-health tally (logs/tool-health.json, maintained by post-tool-monitor)
 * and, if the preview has been failing recently (screenshot timeouts,
 * navigate/snapshot errors), injects a NON-BLOCKING advisory steering toward the
 * Playwright fallback. Never blocks — preview can still be the right call, and
 * the gate is fail-open.
 *
 * This elevates the per-skill fallback that already lives in design-check
 * (SK-127) Step 2 to a system-wide rule, so the fallback fires regardless of
 * which skill (or no skill) is active.
 *
 * Fail-open: missing/unparseable health data or any error → silent exit 0.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { readStdin, injectContext, appendLine, paths, isHookEnabled } = require('./lib');

const HOOK_ID = 'preview-health-gate';
const WINDOW_MS = 7 * 24 * 3600 * 1000;   // count failures in the last 7 days
const FAIL_THRESHOLD = 3;                  // ≥3 recent fails → advise fallback
// The render/read operations whose recent failures mean "the preview is stuck."
// Current Claude_Browser API first, then the legacy Claude_Preview names so the
// gate keeps working across the 2026-07 harness rename either way.
const WATCH = [
  'mcp__Claude_Browser__computer',      // screenshots + clicks (was preview_screenshot)
  'mcp__Claude_Browser__navigate',      // page load / hang
  'mcp__Claude_Browser__read_page',     // a11y snapshot (was preview_snapshot)
  'mcp__Claude_Browser__preview_start', // dev-server / pane boot
  'mcp__Claude_Preview__preview_screenshot',
  'mcp__Claude_Preview__preview_eval',
  'mcp__Claude_Preview__preview_snapshot',
];

if (!isHookEnabled(HOOK_ID)) process.exit(0);

function recentFailures(health, tool, now) {
  const t = health && health.tools && health.tools[tool];
  if (!t || !Array.isArray(t.failures)) return 0;
  return t.failures.filter(ts => now - Date.parse(ts) < WINDOW_MS).length;
}

readStdin((data) => {
  const tool = data.tool_name || '';
  if (!/^mcp__Claude_(Browser__|Preview__preview_)/.test(tool)) process.exit(0);

  let health;
  try {
    health = JSON.parse(fs.readFileSync(path.join(paths.logs, 'tool-health.json'), 'utf8'));
  } catch (_) {
    process.exit(0);   // no health data yet — let the call through
  }

  const now = Date.now();
  const worst = Math.max(0, ...WATCH.map(t => recentFailures(health, t, now)));
  if (worst < FAIL_THRESHOLD) process.exit(0);   // preview healthy — silent

  // v10.2 audit 2026-07-24: this advisory now carries the full 2026-07-23 pane
  // diagnosis (previously only in CLAUDE.md § Deliver), so the guidance arrives
  // at call time — CLAUDE.md keeps the short rule + a pointer here.
  injectContext(
    `PREVIEW HEALTH-GATE: the browser preview has ${worst} failure(s) in the last 7 days. ` +
    `The two chronic failure modes are DIAGNOSED (2026-07-23) and are NOT flakiness — retrying does not fix them: ` +
    `(a) "No site is open in this tab" = the target file is OUTSIDE the project folder, so the pane inlined it as a data: snapshot ` +
    `(tell: tabs_context shows "(data:)" where a real load shows "(file:)"); move the file into the project folder or go headless. ` +
    `(b) "Screenshot timed out ... the Browser pane is not displayed" = the pane is CLOSED in the desktop UI — only the user can open it; ` +
    `say so plainly instead of retrying. ` +
    `Headless default for static verification: node ~/.claude/skills/impeccable/scripts/shot.mjs <url-or-path> <out.png> ` +
    `(no pane needed; exit 1 = mechanically broken; reports overflow + dead anchors as advisories). ` +
    `To open a local file in the user's REAL browser: Start-Process <path> — never claude-in-chrome navigate (it force-prepends https:// to file:// URLs and false-reports success). ` +
    `Deeper fallbacks: playwright-cli skill, then Docker-MCP Playwright. One recovery cycle max, then fall back — never retry-loop.`
  );

  appendLine(
    path.join(paths.logs, 'preview-health-gate.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), tool, recent_failures: worst })
  );
  process.exit(0);
});
