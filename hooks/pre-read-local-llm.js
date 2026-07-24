#!/usr/bin/env node
/**
 * PreToolUse: Local LLM Pre-Reader
 *
 * ⚠ UNWIRED as of v8.14 (2026-07-04): the hook had been disabled via
 * ATLAS_DISABLED_HOOKS=local-llm-pre-reader yet its settings.json wiring still
 * spawned node on EVERY Read just to exit 0. The wiring was removed; this file
 * is retained. RE-ENABLE = (1) restore the PreToolUse "Read" block in
 * settings.json (command: node ~/.claude/hooks/pre-read-local-llm.js, timeout 8)
 * AND (2) remove local-llm-pre-reader from env.ATLAS_DISABLED_HOOKS.
 *
 * Fires on every Read tool call. For files above the line threshold,
 * calls Ollama to generate a terse summary and injects it as
 * additionalContext BEFORE Claude reads the file. Claude gets the
 * summary upfront and can skip deep in-context analysis.
 *
 * Key behaviours:
 *   - Skips files modified < FRESH_SECONDS ago (Claude just wrote/edited
 *     it — it already knows the contents, summary would be stale/redundant)
 *   - Skips files < LINE_THRESHOLD lines (overhead not worth it)
 *   - Caches summaries by path+mtime — an unchanged file reuses its summary
 *     with no Ollama call (an edit changes mtime and re-summarises)
 *   - Skips binary-ish paths, node_modules, .git, secrets
 *   - Aggressive mode (LOCAL_LLM_AGGRESSIVE=1): blocks reads of large
 *     clearly-never-edited files (.jsonl logs, .csv, .log, .txt, .rst)
 *     above BLOCK_THRESHOLD lines. Markdown, JSON, code, YAML are never
 *     blocked — only truly read-only artefacts are.
 *
 * Fail-open: any error (Ollama down, timeout, parse failure) silently
 * lets the Read proceed unchanged.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { readStdin, injectContext, blockTool, appendLine, paths, isHookEnabled } = require('./lib');
// Ollama access + circuit breaker unified into lib/ollama (2026-06-09) — the
// breaker state is now SYSTEM-WIDE (cache/ollama-breaker.json), so a dead
// Ollama trips once for all call sites instead of per hook.
const { ollamaGenerate, isBreakerOpen, MODELS } = require('./lib/ollama');

// ── Config ────────────────────────────────────────────────────────────
const HOOK_ID            = 'local-llm-pre-reader';
const LINE_THRESHOLD     = 100;     // raised from 40: a smaller file is read faster than the model summarises it, so summarising it is pure overhead. summarise files with ≥ this many lines
const BLOCK_THRESHOLD    = 400;     // only block in aggressive mode above this
const FRESH_SECONDS      = 180;     // skip files modified < 3 min ago (just written by Claude)
const CONTENT_CAP        = 12_000;  // chars sent to Ollama. NOTE (2026-06-25): this hook is DISABLED on this machine (ATLAS_DISABLED_HOOKS=local-llm-pre-reader). Measured on CPU-bound llama3.2:3b: summarizing even ~2000 chars takes ~7s — over the 6s internal / 8s harness timeout — so it always fails open with no summary. Lowering CONTENT_CAP does NOT help: generation time, not input size, dominates (2000→7s, 4000→9.3s, 8000→14s). Re-enable only with a GPU-fast model; the behavioral local_llm_agent gate is the active offload path instead.
const OLLAMA_TIMEOUT_MS  = 6_000;   // internal Ollama timeout — must be < harness timeout (8s)
const MODEL              = MODELS.fast; // honors LOCAL_LLM_HOOK_MODEL / ATLAS_OLLAMA_FAST_MODEL
const AGGRESSIVE         = process.env.LOCAL_LLM_AGGRESSIVE     === '1';

// Summary cache: reuse an unchanged file's summary instead of re-calling Ollama.
// Keyed by path+mtime, so an edit (new mtime) misses and re-summarises. Bounded.
const SUMMARY_CACHE_FILE = path.join(require('os').homedir(), '.claude', 'cache', 'local-llm-summary-cache.json');
const SUMMARY_CACHE_MAX  = 300;            // keep the most-recent N summaries

// Extensions blockable in aggressive mode — ONLY truly read-only artefacts.
// Markdown (.md), JSON (.json/.jsonc), YAML (.yaml/.yml), TOML, and code
// are deliberately EXCLUDED because they are routinely edited in this system.
const BLOCKABLE_EXT = new Set(['.jsonl', '.log', '.csv', '.txt', '.rst']);

// Extensions that are NEVER blocked regardless of mode
const SAFE_EXT = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.cpp', '.c', '.h',
  '.cs', '.swift', '.kt', '.sh', '.bash', '.zsh', '.fish',
  '.md', '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini',
]);

// Paths we never intercept
const SKIP_RE = [
  /node_modules[\\/]/,
  /\.git[\\/]/,
  /\.env(\.|$)/,
  /credentials/i,
  /\.pem$/i,
  /\.key$/i,
];

if (!isHookEnabled(HOOK_ID)) process.exit(0);

// ── Helpers ───────────────────────────────────────────────────────────
function shouldSkip(filePath) {
  if (!filePath) return true;
  return SKIP_RE.some(re => re.test(filePath));
}

/** Returns true if the file was modified within FRESH_SECONDS (just written by Claude). */
function isRecentlyWritten(filePath) {
  try {
    const mtime = fs.statSync(filePath).mtimeMs;
    return (Date.now() - mtime) < FRESH_SECONDS * 1000;
  } catch (_) {
    return false;
  }
}

// ── Summary cache (path+mtime keyed) ─────────────────────────────────
function readSummaryCache() {
  try { return JSON.parse(fs.readFileSync(SUMMARY_CACHE_FILE, 'utf8')); } catch (_) { return {}; }
}
function getCachedSummary(key) {
  const c = readSummaryCache();
  return (c[key] && typeof c[key].summary === 'string') ? c[key].summary : null;
}
function putCachedSummary(key, summary) {
  try {
    const c = readSummaryCache();
    c[key] = { summary, at: Date.now() };
    // Prune to the most-recent SUMMARY_CACHE_MAX entries by timestamp.
    const keys = Object.keys(c);
    if (keys.length > SUMMARY_CACHE_MAX) {
      keys.sort((a, b) => (c[a].at || 0) - (c[b].at || 0));
      for (const k of keys.slice(0, keys.length - SUMMARY_CACHE_MAX)) delete c[k];
    }
    fs.mkdirSync(path.dirname(SUMMARY_CACHE_FILE), { recursive: true });
    fs.writeFileSync(SUMMARY_CACHE_FILE, JSON.stringify(c));
  } catch (_) { /* non-critical: cache just won't persist */ }
}

async function summarise(content) {
  const system =
    'You are a terse technical assistant. ' +
    'Summarize this file in 3-5 lines covering: purpose, key contents, and notable patterns. ' +
    'Be extremely concise. No preamble or closing remarks.';
  // lib/ollama handles timeout, breaker recording, and fail-open null.
  return ollamaGenerate({
    prompt: content.slice(0, CONTENT_CAP),
    system,
    model: MODEL,
    timeoutMs: OLLAMA_TIMEOUT_MS,
    options: {},
  });
}

function logRun(filePath, lineCount, blocked, skippedFresh, cached) {
  try {
    appendLine(
      path.join(paths.logs, 'local-llm-reads.jsonl'),
      JSON.stringify({
        ts: new Date().toISOString(),
        file: filePath,
        lines: lineCount,
        blocked,
        skipped_fresh: skippedFresh,
        cached: !!cached,
        model: MODEL,
      }),
    );
  } catch (_) { /* non-critical */ }
}

// ── Main ──────────────────────────────────────────────────────────────
readStdin(async (data) => {
  if (data.tool_name !== 'Read') process.exit(0);

  const filePath = (data.tool_input || {}).file_path || '';
  if (shouldSkip(filePath)) process.exit(0);

  // Skip files Claude recently wrote — it already knows the contents
  if (isRecentlyWritten(filePath)) {
    logRun(filePath, 0, false, true);
    process.exit(0);
  }

  // Read the file — if it fails, let the Read tool handle the error
  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch (_) { process.exit(0); }

  const lineCount = content.split('\n').length;
  if (lineCount < LINE_THRESHOLD) process.exit(0);

  // Circuit breaker: if Ollama has timed out 3+ times recently, skip the call.
  // Pass MODEL explicitly: isBreakerOpen() defaults to MODELS.deep (qwen2.5:7b),
  // but this hook uses MODELS.fast (llama3.2:3b) — the no-arg call checked the
  // wrong model's breaker, so a flapping fast model never tripped this early exit.
  if (isBreakerOpen(MODEL)) {
    logRun(filePath, lineCount, false, false);
    process.exit(0);
  }

  // Reuse a cached summary for an unchanged file (path+mtime key); else summarise.
  let mtimeMs = 0;
  try { mtimeMs = Math.round(fs.statSync(filePath).mtimeMs); } catch (_) {}
  const cacheKey = filePath + '|' + mtimeMs;
  let summary = getCachedSummary(cacheKey);
  const fromCache = summary !== null;
  if (!fromCache) summary = await summarise(content);
  if (!summary) process.exit(0); // Ollama unavailable — fail-open silently

  const ext      = path.extname(filePath).toLowerCase();
  const canBlock = BLOCKABLE_EXT.has(ext) && !SAFE_EXT.has(ext);
  const doBlock  = AGGRESSIVE && canBlock && lineCount >= BLOCK_THRESHOLD;

  if (!fromCache) putCachedSummary(cacheKey, summary);
  logRun(filePath, lineCount, doBlock, false, fromCache);

  if (doBlock) {
    blockTool(
      `LOCAL LLM SUMMARY — ${path.basename(filePath)} (${lineCount} lines, ${MODEL}):\n` +
      `${summary}\n\n` +
      `[Read blocked: large read-only artefact in aggressive mode. ` +
      `Call local_llm_agent for further analysis, or use Read explicitly if you need to edit this file.]`,
    );
  } else {
    injectContext(
      `LOCAL LLM PRE-SUMMARY — ${path.basename(filePath)} (${lineCount} lines, ${MODEL}):\n${summary}`,
    );
  }

  process.exit(0);
});
