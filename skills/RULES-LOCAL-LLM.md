# Rules: Local LLM Delegation (MANDATORY)

> Loaded on-demand when delegating sub-tasks. Core summary lives in CLAUDE.md; full triggers and models live here.

`local_llm_agent` is a zero-cost MCP tool backed by local Ollama. **Apply the delegation gate on every sub-task before spending Claude tokens.**

## The delegation engine (v2 — ATLAS v9 Wave 1, B3)

`local_llm_agent` is no longer a bare prompt-pipe. New optional params turn it into a delegation engine (all backward-compatible with `prompt`/`model`/`system`):
- **`task`** — load a tuned template from `local-llm/templates/<task>.md` (role + few-shot + refusal rule + optional schema). The 9 classes mirror the ALWAYS table below: `summarize-file`, `explain-grep`, `boilerplate`, `extract-fields`, `describe-snippet`, `classify`, `convert-format`, `answer-doc`, `draft-changelog`.
- **`format`** — a JSON schema; Ollama constrains the reply to match it (structured output, verified 20/20-class reliable on the golden set). Overrides a task's default schema.
- **`vote`** — self-consistency k (run k samples, majority-vote; `agreement` reported in `self_check`). Use k=3 for ambiguous classification.
- **`two_pass`** — free-form answer, then a second call formalizes it to the schema (helps small models on non-trivial structured tasks).
- **`num_ctx`** — per-call context window (see the context reality below). **`temperature`**, **`timeout_ms`**, **`images`** (vision, with `qwen3-vl:4b`).
- **Response `self_check`** — every reply ends with `[self_check] {schema_ok, agreement, insufficient, escalate_recommended, reason}`. **If `escalate_recommended` is true (parse-fail / low agreement / the model said INSUFFICIENT), escalate that sub-task to Claude** — don't trust a shaky local answer (FrugalGPT cascade).
- Every call logs one line to `logs/delegations.jsonl` (`/observe` Delegation section + the weekly scorecard read it).
- **Thinking is OFF by default** (`think:false`). qwen3.5* are hybrid thinking models; leaving thinking on made a trivial classification take ~100 s vs ~5 s. Delegation wants direct answers — never enable `think` for delegation (if a task needs step-by-step reasoning, it belongs with Claude).

> The upgraded server only takes effect after a **client restart** (Claude Desktop + Claude Code both load `mcp-servers/local-agent/index.js`). Verified in-session via direct stdio (17/17). If a live session still shows the v1 tool signature, restart the client.

## The context reality (ATLAS v9 Wave 1, B1 — corrects a stale assumption)

**There is NO 4096-token silent-truncation bug on this install.** Ollama **0.31.2** defaults `OLLAMA_CONTEXT_LENGTH` to **262144**, capped per-model to the model's native max — verified live via `/api/ps`:

| Model | Effective ctx (default) | Native max |
|---|---|---|
| `qwen2.5:7b` | 32768 | 32K |
| `llama3.2:3b` | 131072 | 131K |
| `gemma4:latest` | 131072 | 131K |
| `gemma4:12b-it-qat` | up to 262144 | 256K |

The docs FAQ's "default 4096" is **stale for 0.31.2**. The delegation path (native `/api/chat`) gets full native context; long-doc delegation is NOT being truncated. `num_ctx` is therefore for **bounding** context down (save RAM/latency on short tasks), not raising it. A forced `num_ctx:4096` DOES truncate (control-tested) — so never set it below your document size.

**Perf settings applied + persistent (Wave 1):** `OLLAMA_FLASH_ATTENTION=1` + `OLLAMA_KV_CACHE_TYPE=q8_0` (User env vars; active). q8_0 KV quantization ~halves KV-cache memory — measured **~850 MB saved** on qwen2.5:7b at 32K, needle-recall preserved, gemma4 compatible. **`OLLAMA_CONTEXT_LENGTH` deliberately left UNSET** — a 16K cap would regress the native 32K/131K/256K contexts.

## The Delegation Gate

Before processing any sub-task, ask: *"Can a small model answer this from only the text I'm about to provide?"*

- **YES → call `local_llm_agent` immediately. Do not use Claude tokens.**
- **NO → proceed with Claude.**

When in doubt, try local first. If the result is poor, escalate to Claude.

## ALWAYS delegate (no exceptions)

| Trigger | Examples |
|---------|---------|
| Summarize or describe a file | "What does this skill file do?", "Describe this config" |
| Explain grep / search output | "What do these results mean?", "Summarize these matches" |
| Generate boilerplate | Test stubs, CRUD scaffolding, config templates, fixture data |
| Extract fields / entities from text | "List all skill names", "What version is in package.json?" |
| Describe an isolated code snippet | "What does this function do?" (no cross-file context needed) |
| Classify or categorize text | "Is this semantic or procedural?", "What type of error is this?" |
| Convert / reformat content | diff → plain English, JSON → readable summary, log → bullet list |
| Simple bounded Q&A from a single doc | "What's the expiry date in this file?", "How many items are listed?" |
| Draft repetitive structured content | Changelog entries, commit message drafts, table rows |

## NEVER delegate (keep with Claude)

- Architecture decisions, design tradeoffs, system design
- Complex multi-step debugging (requires cross-file or runtime context)
- Security review or vulnerability analysis
- Planning, task decomposition, roadmaps, acceptance criteria
- Any output that will be committed / deployed without human review
- Cross-file analysis requiring project-wide understanding
- Anything where a wrong answer is hard to catch

## Models — the routing table (v9 Wave 1, B2/B4 eval-gated)

Golden-set eval (`local-llm/evals/`, 2026-07-12) **REFUTED** the assumed qwen3.5:4b swap: 19/20 vs qwen2.5:7b's 18/20 (a single case = noise), and qwen3.5:4b measured **~1.8× slower warm** (3957 ms vs 2230 ms). No clear win → the proven **qwen2.5:7b stays default** (eval-gated, not vibes-gated). qwen3.5* are hybrid **thinking** models; the engine sends `think:false` (thinking made a trivial classify ~20× slower). Never enable `think` for delegation. Re-run `node local-llm/evals/run-evals.mjs` with a larger golden set to revisit.

| Model | Role | Notes |
|-------|------|-------|
| **`qwen2.5:7b`** | **Default worker** | 4.7 GB, CPU/GPU split, 32K ctx. Fastest of the accurate general models here (~2.2 s warm); 18/20 golden set. The proven default. |
| `qwen3.5:4b` | GPU-resident / long-ctx option | 3.4 GB — fits the 4 GB card fully (frees VRAM for co-residency); **256K** ctx; 19/20 golden set but ~1.8× slower. Reach for it when VRAM headroom or a very long context matters, or if a bigger eval shows a real accuracy edge. |
| `qwen3.5:2b` | Fast classifier / high-volume | 2.7 GB — co-resident candidate. A1 behavior-mining + bulk classification where volume matters more than the last accuracy point. |
| `qwen2.5-coder:7b` | Code-heavy tasks | 4.7 GB, 32K ctx — now pulled. Code explanation/boilerplate where a coder model helps. |
| `gemma4` | Long docs / strong general | 8B, **131K** effective ctx. Prefer for large-file / long-document work and higher-quality general delegation. Text-only through this tool. |
| `gemma4:12b-it-qat` | Highest-quality / long | 12B QAT, up to **256K** ctx, ~10 GB resident. Better reasoning; CPU-bound ~44 s cold load — warm first (`ollama run gemma4:12b-it-qat ""`) or retry. q8_0 KV now halves its KV cache. |
| `llama3.2:3b` | Fastest trivial | 2.0 GB, 131K ctx. |
| `qwen3-vl:4b` | **Vision** (with `images`) | 3.3 GB — screenshot description, alt-text, UI-state pre-checks (B6). Pass file paths via `images`. |
| `qwen3-embedding:0.6b` | (retrieval, not this tool) | 639 MB, **32K** ctx — the recall embedder candidate (E1); superior to embeddinggemma's 2K ctx. |

## Named agents (dispatch presets — added 2026-07-20)

**Registration:** the `local_llm_agent` MCP server (`mcp-servers/local-agent/index.js`) is now registered in **Claude Code at user scope** (`claude mcp add local-agent -s user -- node <path>`; verified Connected). It loads on the **next Claude Code launch** — a session already running won't see the tool. In an in-flight session you can still delegate by calling Ollama directly (`/api/chat` at `localhost:11434`).

Ergonomic shorthand over `local_llm_agent`: pick the agent by the job and the preset fills in `model` + `task` template. All zero-cost; all obey the escalate-on-`self_check` rule; override any field per call. These are **conventions over the existing engine, not new code** — the server already routes by `task`+`model`.

| Agent | Call args | Best for |
|-------|-----------|----------|
| **summarizer** | `model:"gemma4"`, `task:"summarize-file"` | File / long-doc summaries (131K ctx, strong general). |
| **coder** | `model:"qwen2.5-coder:7b"`, `task:"describe-snippet"` (or `"boilerplate"`) | Explain an isolated snippet; generate stubs / scaffolding / fixtures. |
| **classifier** | `model:"qwen3.5:2b"`, `task:"classify"`, `vote:3` | Fast high-volume categorization; `vote:3` on ambiguous cases. |
| **extractor** | `model:"qwen2.5:7b"`, `task:"extract-fields"` | Pull fields / entities from text → structured JSON (pass `format`). |
| **reformatter** | `model:"qwen2.5:7b"`, `task:"convert-format"` | diff→prose, JSON→summary, log→bullets. |
| **doc-qa** | `model:"gemma4"`, `task:"answer-doc"` | Bounded Q&A from a single long document. |
| **vision** | `model:"qwen3-vl:4b"`, `images:[...]` | Screenshot description / alt-text — **batch only** (~2 min cold; never interactive). |
| **worker** (default) | `model:"qwen2.5:7b"` | General fallback when no preset fits. |

Escalate the sub-task to Claude whenever the reply's `self_check.escalate_recommended` is true (parse-fail / low vote agreement / model said INSUFFICIENT).

## Vision delegation (v9 Wave 4, B6 — new capability, verified working but SLOW)

`qwen3-vl:4b` (3.3 GB) is pulled and the engine's `images` param works (base64 file paths → API). Verified: it accurately described a portfolio UI screenshot. **Caveat: ~123 s cold on this 4 GB card** — so it is NOT a fast interactive pre-check (waiting 2 min to avoid one Claude vision call is rarely a win). Best fit: **non-latency-sensitive batch** where quality is forgiving —
- **alt-text generation** for web/app builds (feeds impeccable/tactile a11y) — batch, offline, no user waiting.
- **bulk screenshot description** ("what's on these screens") when many images need a first-pass caption.

Keep with Claude (never delegate): design-quality judgment / AR-rule auditing (wrong-answer-hard-to-catch), and any interactive "is this screenshot right?" check where the 2-min latency defeats the purpose. Warm it first (`ollama run qwen3-vl:4b ""`) if using it repeatedly.

## Hardware ceiling (this machine, verified 2026-06-24)

RTX 3050 Ti Laptop GPU = **4 GB VRAM**; 31 GB system RAM. Anything larger than ~4 GB runs CPU-bound (slow). Delegation sweet spot: **≤8B / ≤~10 GB** (`gemma4` 8B, `qwen2.5:7b`). Big models (27B–31B, ≥18 GB: `qwen3.6:27b-mtp`, `gemma4:31b-it-qat`) fit in 31 GB RAM but are too slow for quick offload — evaluated and deliberately skipped. `DiffusionGemma 26B-A4B` (MoE, 3.8B active) would be the *ideal* fit but Ollama can't run it yet (llama.cpp PR #24427 unmerged as of Jun 2026 — revisit when `ollama pull diffusiongemma` works). Re-check any new model's size against this 4 GB ceiling before pulling.

## Keep-alive & memory (decided 2026-06-24)

`OLLAMA_KEEP_ALIVE` defaults to **5m** (verified via `ollama serve --help`) — **deliberately left as-is.** `gemma4:12b-it-qat` loads at **9.5 GB resident** (7.2 GB weights + full 256K-context KV cache) and runs **~82% on CPU** (only ~18% fits the 4 GB GPU), so pinning it longer would pressure this RAM-tight laptop. The 5m window keeps a model warm during active back-to-back delegation, then frees RAM when idle — the right trade here. To override (accept steady RAM cost): set `OLLAMA_KEEP_ALIVE=30m` env var and restart Ollama.

`ponytail:` big-context models (`gemma4`, `gemma4:12b-it-qat`) load their full 131K–256K context, inflating RAM for short delegation prompts. If that ever bites, cap `num_ctx` (~8–16K) via a Modelfile or by switching the MCP server from OpenAI-compat `/v1/chat/completions` to native `/api/chat` with `options.num_ctx`. Not worth doing until RAM pressure is actually observed.

## Telemetry & the pre-read hook (the gate above is the PRIMARY offload path)

The behavioral delegation gate (calling `local_llm_agent` yourself) is the **reliable, active** offload mechanism — you control the prompt size, the model, and timing, and there's no tight per-call timeout.

- `pre-read-local-llm.js` — a PreToolUse hook that *would* auto-summarize large file reads (files ≥100 lines; `LOCAL_LLM_AGGRESSIVE=1` blocks ≥400-line read-only artefacts and returns summary only) — is **DISABLED on this machine** (`ATLAS_DISABLED_HOOKS=local-llm-pre-reader` in `settings.json`). **Verified reason (2026-06-25):** on this RTX 3050 Ti 4 GB / CPU-bound setup, summarizing even ~2000 chars on `llama3.2:3b` takes ~7 s — over the hook's 6 s internal and 8 s harness timeout — so it ALWAYS fails open with no summary, adding 6–8 s of dead latency per large read. **Not fixable by lowering `CONTENT_CAP`** (generation time, not input size, dominates). Re-enable only if a model can run GPU-resident fast enough to summarize within ~5 s.
- When active, reads are logged to `logs/local-llm-reads.jsonl`.
