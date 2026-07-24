// lib/ollama.js — the ONE way ATLAS talks to local Ollama.
//
// Before 2026-06-09 three call sites each carried their own fetch + model
// default + (in one case) circuit breaker: pre-read-local-llm.js (llama3.2:3b,
// /v1/chat/completions), session-handoff.js (qwen2.5:7b, /api/generate),
// session-transcript-log.py (qwen2.5:7b, raw HTTP). This module unifies the
// JS sides; the Python writer reads the same breaker state file.
//
// Model tiers (env-overridable):
//   FAST  — quick per-tool-call summarization     ATLAS_OLLAMA_FAST_MODEL  (llama3.2:3b)
//   DEEP  — narratives, distillation               ATLAS_OLLAMA_DEEP_MODEL  (qwen2.5:7b; honors legacy ATLAS_LOCAL_MODEL)
//   EMBED — vector embeddings                      ATLAS_OLLAMA_EMBED_MODEL (embeddinggemma:300m)
//
// Shared circuit breaker, PER MODEL: 3 failures in a 5-min window → open 5 min
// for THAT model only. State in cache/ollama-breaker.json (replaces the old
// per-hook local-llm-hook-state.json). Per-model because the failure modes are
// independent in practice: under load, the fast model's 6s pre-read timeouts
// were tripping a global breaker and blocking the (healthy, warm) embed model
// — observed live 2026-06-09, twice. A fully dead Ollama still trips every
// model within a few calls. session-transcript-log.py reads the same file for
// the deep model.
//
// Everything fail-open: callers receive null and degrade; never throw.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const MODELS = {
  fast: process.env.ATLAS_OLLAMA_FAST_MODEL || process.env.LOCAL_LLM_HOOK_MODEL || 'llama3.2:3b',
  deep: process.env.ATLAS_OLLAMA_DEEP_MODEL || process.env.ATLAS_LOCAL_MODEL || 'qwen2.5:7b',
  embed: process.env.ATLAS_OLLAMA_EMBED_MODEL || 'embeddinggemma:300m',
};

// ── Circuit breaker (shared, file-backed) ─────────────────────────────
const CB_STATE_FILE = path.join(os.homedir(), '.claude', 'cache', 'ollama-breaker.json');
const CB_WINDOW_MS = 5 * 60 * 1000; // rolling failure window
const CB_FAIL_THRESHOLD = 3; // failures in window → trip
const CB_OPEN_DURATION = 5 * 60 * 1000; // breaker stays open

function readCircuitState() {
  try {
    const s = JSON.parse(fs.readFileSync(CB_STATE_FILE, 'utf8'));
    return s && typeof s.models === 'object' ? s : { models: {} }; // legacy flat shape → reset
  } catch {
    return { models: {} };
  }
}

function writeCircuitState(state) {
  try {
    fs.mkdirSync(path.dirname(CB_STATE_FILE), { recursive: true });
    fs.writeFileSync(CB_STATE_FILE, JSON.stringify(state));
  } catch {
    /* non-critical */
  }
}

function isBreakerOpen(model = MODELS.deep) {
  const state = readCircuitState();
  const m = state.models[model];
  if (!m) return false;
  const now = Date.now();
  if (m.opened_at && now - m.opened_at < CB_OPEN_DURATION) return true;
  if (m.opened_at && now - m.opened_at >= CB_OPEN_DURATION) {
    delete state.models[model];
    writeCircuitState(state);
  }
  return false;
}

function recordFailure(model = MODELS.deep) {
  const state = readCircuitState();
  const now = Date.now();
  const m = state.models[model] || { failures: [], opened_at: 0 };
  m.failures = (m.failures || []).filter((t) => now - t < CB_WINDOW_MS);
  m.failures.push(now);
  if (m.failures.length >= CB_FAIL_THRESHOLD) m.opened_at = now;
  state.models[model] = m;
  writeCircuitState(state);
}

// ── Core fetch helper ─────────────────────────────────────────────────
async function ollamaFetch(endpoint, body, timeoutMs) {
  if (typeof fetch !== 'function') return null;
  if (isBreakerOpen(body.model)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${OLLAMA_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      recordFailure(body.model);
      return null;
    }
    return await res.json();
  } catch {
    clearTimeout(timer);
    recordFailure(body.model);
    return null;
  }
}

/**
 * Generate text. Returns trimmed string or null (breaker open / Ollama down /
 * timeout — caller degrades).
 *
 * @param {object} opts
 * @param {string} opts.prompt        required
 * @param {string} [opts.system]      system prompt
 * @param {string} [opts.model]       defaults to MODELS.deep
 * @param {number} [opts.timeoutMs]   defaults 15000 — hooks on tight harness
 *                                    budgets MUST pass their own (e.g. 6000)
 * @param {object} [opts.options]     Ollama options (temperature etc.)
 * @param {boolean} [opts.forceEnglish] appends an English-only instruction —
 *                                    qwen drifts off-language on noisy input
 */
async function ollamaGenerate({ prompt, system, model, timeoutMs = 15000, options, forceEnglish = false }) {
  if (!prompt) return null;
  const fullPrompt = forceEnglish ? prompt + '\n\nRespond in English only.' : prompt;
  const data = await ollamaFetch(
    '/api/generate',
    {
      model: model || MODELS.deep,
      prompt: fullPrompt,
      ...(system ? { system } : {}),
      stream: false,
      options: options || { temperature: 0.2 },
    },
    timeoutMs
  );
  if (!data || typeof data.response !== 'string') return null;
  return data.response.trim() || null;
}

/**
 * Embed texts. Returns array of vectors (number[][]) aligned with input order,
 * or null. Ollama /api/embed accepts a string or string[] as `input`.
 *
 * keep_alive 30m: the embed model is 621MB — cheap to keep resident, and the
 * cold-load penalty is ~2.5s per /recall (measured 2026-06-10: cold 3.0s vs
 * warm 0.44s). The big generate models keep Ollama's default eviction.
 */
async function ollamaEmbed({ input, model, timeoutMs = 30000 }) {
  if (!input || (Array.isArray(input) && input.length === 0)) return null;
  const data = await ollamaFetch(
    '/api/embed',
    { model: model || MODELS.embed, input, keep_alive: process.env.ATLAS_OLLAMA_EMBED_KEEPALIVE || '30m' },
    timeoutMs
  );
  if (!data || !Array.isArray(data.embeddings)) return null;
  return data.embeddings;
}

module.exports = {
  MODELS,
  OLLAMA_BASE,
  CB_STATE_FILE,
  ollamaGenerate,
  ollamaEmbed,
  isBreakerOpen,
  recordFailure,
};
