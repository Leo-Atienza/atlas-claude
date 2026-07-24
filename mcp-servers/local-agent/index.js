import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ============================================================================
// local-agent MCP v2 (ATLAS v9 Wave 1, B3) — a DELEGATION ENGINE, not a pipe.
//
// New on local_llm_agent (all optional, backward-compatible with v1's
// prompt/model/system): task (load a template), format (JSON schema →
// structured output), temperature, num_ctx (per-call context — v9 Wave 0
// found Ollama 0.31.2 defaults to 256K/native, so this is for BOUNDING, not
// raising), timeout_ms, vote (self-consistency k), two_pass (free-form →
// constrained), images (base64 file paths → vision, B6). Response gains a
// self_check block so the caller can cascade to Claude on parse-fail / low
// agreement / refusal. Every call logs one line to logs/delegations.jsonl.
//
// Uses Ollama's native /api/chat (supports full-JSON-schema `format`, per-call
// `options.num_ctx`/`temperature`, and message `images`). v1 used the OpenAI
// /v1 path which can't set num_ctx and only has a thinner response_format.
// ============================================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
// Default worker: qwen2.5:7b — KEPT after the eval-gated B4 test (v9 Wave 1)
// REFUTED the assumed qwen3.5:4b win: golden set 19/20 vs 18/20 (a single case =
// noise), and qwen3.5:4b measured ~1.8x SLOWER warm (3957ms vs 2230ms). No clear
// win → don't swap the proven default. qwen3.5:4b is available for GPU-residency /
// 256K ctx; qwen3.5:2b for fast high-volume classification.
const DEFAULT_MODEL = process.env.LOCAL_AGENT_DEFAULT_MODEL ?? "qwen2.5:7b";
const HOME = os.homedir();
const TEMPLATES_DIR = path.join(HOME, ".claude", "local-llm", "templates");
const LOG_FILE = path.join(HOME, ".claude", "logs", "delegations.jsonl");

// ── template loading ─────────────────────────────────────────────────────────
// local-llm/templates/<task>.md  → frontmatter {model?,temperature?,num_ctx?} + body (system prompt + few-shot)
// local-llm/templates/<task>.schema.json → optional default JSON schema for that task
function loadTemplate(task) {
  if (!task) return null;
  const safe = String(task).replace(/[^a-z0-9_-]/gi, "");
  const mdPath = path.join(TEMPLATES_DIR, `${safe}.md`);
  let system = "";
  const meta = {};
  try {
    const raw = fs.readFileSync(mdPath, "utf8");
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fm) {
      for (const line of fm[1].split("\n")) {
        const m = line.match(/^([a-z_]+):\s*(.+)$/i);
        if (m) meta[m[1].trim()] = m[2].trim();
      }
      system = fm[2].trim();
    } else {
      system = raw.trim();
    }
  } catch {
    return null; // unknown task → caller falls back to plain prompt
  }
  let schema = null;
  try {
    schema = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, `${safe}.schema.json`), "utf8"));
  } catch { /* no schema sidecar */ }
  return {
    system,
    model: meta.model || null,
    temperature: meta.temperature != null ? Number(meta.temperature) : null,
    num_ctx: meta.num_ctx != null ? Number(meta.num_ctx) : null,
    schema,
  };
}

// ── one native /api/chat call ─────────────────────────────────────────────────
async function chat({ model, messages, format, options, timeoutMs, think }) {
  const ctrl = new AbortController();
  const timer = timeoutMs ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  const body = { model, messages, stream: false, think: think === true };
  if (format) body.format = format;
  if (options && Object.keys(options).length) body.options = options;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (timer) clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `Ollama ${res.status}: ${await res.text()}` };
    const data = await res.json();
    return {
      ok: true,
      text: data.message?.content ?? "",
      tokens_in: data.prompt_eval_count ?? null,
      tokens_out: data.eval_count ?? null,
    };
  } catch (err) {
    if (timer) clearTimeout(timer);
    return { ok: false, error: err.name === "AbortError" ? `timeout after ${timeoutMs}ms` : err.message, aborted: err.name === "AbortError" };
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function tryParseJson(text) {
  if (typeof text !== "string") return null;
  // tolerate code fences / leading prose
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try { return JSON.parse(candidate.trim()); } catch { /* fall through */ }
  const braces = candidate.match(/[{[][\s\S]*[}\]]/);
  if (braces) { try { return JSON.parse(braces[0]); } catch { /* nope */ } }
  return null;
}

function looksInsufficient(text) {
  return /\bINSUFFICIENT\b/.test(text || "") || /^\s*(i (don't|do not) know|not (found|present|in the))/i.test(text || "");
}

// majority vote over an array of {text, parsed}. Returns {winner, agreement}.
function majorityVote(results, hasSchema) {
  const keyOf = (r) => (hasSchema && r.parsed ? JSON.stringify(r.parsed) : (r.text || "").trim());
  const counts = new Map();
  for (const r of results) {
    const k = keyOf(r);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let bestKey = null, bestCount = 0;
  for (const [k, c] of counts) if (c > bestCount) { bestKey = k; bestCount = c; }
  const winner = results.find((r) => keyOf(r) === bestKey) || results[0];
  return { winner, agreement: bestCount / results.length };
}

function logDelegation(entry) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
  } catch { /* logging is non-critical */ }
}

// ── MCP server ─────────────────────────────────────────────────────────────────
const server = new Server(
  { name: "local-agent", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "local_llm_agent",
      description:
        "Delegate a Haiku-tier sub-task to a local Ollama model at ZERO Claude-token cost (offline). Use for: file/diff/grep summarization, classification, entity/field extraction, boilerplate, format conversion, bounded single-doc Q&A, changelog/commit drafts. For reliable machine-readable output pass `format` (a JSON schema) or `task` (a template). The response carries a `self_check` block — if schema_ok is false, confidence is low, or vote agreement is weak, escalate that sub-task to Claude. Keep NEVER-delegate work (architecture, multi-step debugging, security review, planning, anything committed unreviewed) with Claude.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The task/user prompt (include the text to work on)." },
          task: { type: "string", description: "Optional template name from local-llm/templates/ (e.g. summarize-file, classify-error, extract-fields). Loads role + few-shot + schema tuned for that class." },
          model: { type: "string", description: `Ollama model. Default ${DEFAULT_MODEL}. GPU-resident on this 4GB card: qwen3.5:4b, qwen3.5:2b (classifier). CPU/GPU split: qwen2.5:7b, qwen2.5-coder:7b (code). Long docs: gemma4 (131K), gemma4:12b-it-qat. Vision: qwen3-vl:4b (with images).` },
          system: { type: "string", description: "Optional system prompt (appended to any task template's system)." },
          format: { type: "object", description: "Optional JSON schema — Ollama constrains the reply to match it (structured output). Overrides a task's default schema." },
          temperature: { type: "number", description: "Sampling temperature (default 0 for determinism; vote uses >=0.3 for diversity)." },
          num_ctx: { type: "number", description: "Per-call context window. Ollama 0.31.2 defaults to the model's native max (32K–256K); set this LOWER to bound RAM/latency on short tasks, or higher only up to the model max for long docs." },
          timeout_ms: { type: "number", description: "Abort the call after this many ms (default 120000)." },
          vote: { type: "number", description: "Self-consistency: run k samples and majority-vote (k=3 recommended for ambiguous classification). agreement is reported in self_check." },
          two_pass: { type: "boolean", description: "Answer free-form first, then a second call formalizes it to the schema (helps small models on non-trivial structured tasks). Requires format or a task schema." },
          images: { type: "array", items: { type: "string" }, description: "Optional file paths to images (read + base64-encoded) for a vision model (e.g. qwen3-vl:4b). Adds a vision delegation." },
          think: { type: "boolean", description: "Enable model reasoning traces (default false). OFF by default — delegation wants direct answers; thinking makes hybrid models (qwen3.5*) ~20x slower. Leave off unless a task genuinely needs step-by-step reasoning (in which case prefer escalating to Claude)." },
        },
        required: ["prompt"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "local_llm_agent") throw new Error(`Unknown tool: ${request.params.name}`);
  const a = request.params.arguments || {};
  const started = Date.now();

  const tpl = loadTemplate(a.task);
  const model = a.model || (tpl && tpl.model) || DEFAULT_MODEL;
  const format = a.format || (tpl && tpl.schema) || null;
  const temperature = a.temperature != null ? a.temperature : (tpl && tpl.temperature != null ? tpl.temperature : 0);
  const num_ctx = a.num_ctx != null ? a.num_ctx : (tpl && tpl.num_ctx != null ? tpl.num_ctx : undefined);
  const timeoutMs = a.timeout_ms ?? 120000;
  const think = a.think === true; // default OFF — delegation wants direct answers, not reasoning traces

  // assemble messages
  const systemParts = [tpl && tpl.system, a.system].filter(Boolean);
  const messages = [];
  if (systemParts.length) messages.push({ role: "system", content: systemParts.join("\n\n") });
  const userMsg = { role: "user", content: a.prompt };
  if (Array.isArray(a.images) && a.images.length) {
    const b64 = [];
    for (const p of a.images) {
      try { b64.push(fs.readFileSync(p).toString("base64")); } catch { /* skip unreadable image */ }
    }
    if (b64.length) userMsg.images = b64;
  }
  messages.push(userMsg);

  const baseOptions = {};
  if (num_ctx) baseOptions.num_ctx = num_ctx;

  const fail = (error, aborted) => {
    logDelegation({ task: a.task || null, model, status: "error", error, duration_ms: Date.now() - started, escalated: true });
    return { content: [{ type: "text", text: `Local delegation failed (${aborted ? "timeout" : "error"}): ${error}\nEscalate this sub-task to Claude.` }], isError: true };
  };

  let finalText, tokensIn = null, tokensOut = null, agreement = null, twoPassUsed = false;

  // ── voting path ──
  if (a.vote && a.vote > 1) {
    const k = Math.min(7, Math.max(2, Math.floor(a.vote)));
    const results = [];
    for (let i = 0; i < k; i++) {
      const r = await chat({ model, messages, format, options: { ...baseOptions, temperature: Math.max(0.3, temperature) }, timeoutMs, think });
      if (!r.ok) { if (results.length === 0) return fail(r.error, r.aborted); break; }
      results.push({ text: r.text, parsed: format ? tryParseJson(r.text) : null });
      tokensIn = (tokensIn || 0) + (r.tokens_in || 0);
      tokensOut = (tokensOut || 0) + (r.tokens_out || 0);
    }
    const { winner, agreement: ag } = majorityVote(results, !!format);
    finalText = winner.text; agreement = ag;
  } else if (a.two_pass && format) {
    // ── two-pass: free-form reasoning, then constrain ──
    twoPassUsed = true;
    const p1 = await chat({ model, messages, options: { ...baseOptions, temperature }, timeoutMs, think });
    if (!p1.ok) return fail(p1.error, p1.aborted);
    const p2msgs = [...messages, { role: "assistant", content: p1.text }, { role: "user", content: "Now return ONLY the answer as JSON matching the required schema." }];
    const p2 = await chat({ model, messages: p2msgs, format, options: { ...baseOptions, temperature: 0 }, timeoutMs, think });
    if (!p2.ok) return fail(p2.error, p2.aborted);
    finalText = p2.text;
    tokensIn = (p1.tokens_in || 0) + (p2.tokens_in || 0);
    tokensOut = (p1.tokens_out || 0) + (p2.tokens_out || 0);
  } else {
    // ── single call ──
    const r = await chat({ model, messages, format, options: { ...baseOptions, temperature }, timeoutMs, think });
    if (!r.ok) return fail(r.error, r.aborted);
    finalText = r.text; tokensIn = r.tokens_in; tokensOut = r.tokens_out;
  }

  // ── self_check + cascade signal ──
  const parsed = format ? tryParseJson(finalText) : null;
  const schemaOk = format ? parsed != null : null;
  const insufficient = looksInsufficient(finalText);
  const lowAgreement = agreement != null && agreement < 0.6;
  const escalateRecommended = (format && !schemaOk) || insufficient || lowAgreement;
  const self_check = {
    schema_ok: schemaOk,
    agreement,
    insufficient,
    escalate_recommended: escalateRecommended,
    reason: escalateRecommended
      ? (format && !schemaOk ? "output did not parse to the schema" : insufficient ? "model reported insufficient info" : "low vote agreement")
      : null,
  };

  logDelegation({
    task: a.task || null,
    model,
    status: "ok",
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    duration_ms: Date.now() - started,
    schema_ok: schemaOk,
    vote: a.vote || null,
    agreement,
    two_pass: twoPassUsed || null,
    vision: (userMsg.images && userMsg.images.length) || null,
    escalated: escalateRecommended,
  });

  // Return the model text plus a machine-readable self_check trailer the caller
  // can parse to decide whether to escalate.
  const trailer = `\n\n---\n[self_check] ${JSON.stringify(self_check)}`;
  return { content: [{ type: "text", text: finalText + trailer }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
