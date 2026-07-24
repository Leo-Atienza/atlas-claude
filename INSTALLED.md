# Installed Third-Party Resources

> Manifest of third-party skill packs, CLI tools, and integrations. Originally installed 2026-02-25 from [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).
>
> **§v10.0.0 (2026-07-20) — inventory & disposition (CP-1-approved; receipts in `skills/CHANGELOG.md` + `SYSTEM_CHANGELOG.md` §10.0.0):** third-party surfaces affected: **flow** (vendored workflow system) archived whole as `skills/_archived/flow/`; **hackathon** bundle seasonal-parked; mattpocock **tdd**, **triage-issue**, **e2e-testing**, **mcp-builder** ecosystem symlinks archived (targets in `~/.agents/skills/` untouched); **enterprise-research**, **audit**, **smart-swarm**, **subagent-driven-dev** archived; **context-engineering-kit** + **infra-showcase** packs (agents + skills) parked in `skills/_archived/agents-parked/` + `-skills/`; **compound-engineering** trimmed to 19 stack-relevant agents (Rails/Ruby roster parked). Local plugins DISABLED in settings.json enabledPlugins (one-line reversible): agent-sdk-dev, code-simplifier, coderabbit, feature-dev, figma, firebase, ralph-loop. Every archival has an `ARCHIVE-DIRECTORY.md` §v10 row and (where detectable) an `archived-skills-manifest.json` pattern consumed by `hooks/archived-skill-offer.js`.
>
> **MCP registration note (updated 2026-04-17 + follow-up):** The MCP Servers tables below document what was *planned*. For current *live* status, always run `claude mcp list` from CWD=~/.claude/. There are TWO active registries: `~/.claude.json` (user scope — global) and `~/.claude/.mcp.json` (project scope — only visible from CWD=~/.claude/). Mass revival + parse-fix on 2026-04-17 promoted 12 entries to user scope (shadcn, prisma, expo, mobile, posthog, cloudflare, linear, context-mode, lighthouse, heroui, aceternity, tauri-mcp) and fixed a latent parse bug in `.mcp.json` that had been silently blocking the whole file (`_comment_*` keys must be at top level, not inside `mcpServers`). Follow-up fixes: corrected netlify package (`@anthropic-ai/netlify-mcp-server` → `@netlify/mcp`) and vercel URL (`https://mcp.vercel.com/mcp` → `https://mcp.vercel.com`) — both now connect. 7 servers load from project scope: supabase, resend, sentry, firecrawl, 21st-dev, maestro, netlify. Remaining failures split: `stripe`/`upstash` need only their API-key env vars (package + endpoint work); `plugin:github:github` needs `GITHUB_PERSONAL_ACCESS_TOKEN` env var per its bundled config. Removed as not standalone-invocable: storybook, openapi.

## Skills/Plugins (in ~/.claude/skills/)

### trailofbits-security/ (28 plugins)
Source: https://github.com/trailofbits/skills
License: CC-BY-SA-4.0
Categories: static analysis, variant analysis, differential review, Semgrep, CodeQL, smart contracts, malware (YARA), reverse engineering, property-based testing, spec compliance
Optional deps: CodeQL, Semgrep, YARA, Burp Suite (per skill)

### context-engineering-kit/ (13 plugins)
Source: https://github.com/NeoLabHQ/context-engineering-kit
Key plugins: sdd (Spec-Driven Development), reflexion, code-review, kaizen, tdd, git, ddd, docs, fpf, sadd, customaize-agent, mcp, tech-stack
Note: fpf plugin is ~600k tokens, loads in subagent

### cc-devops/ (31 skills) — REMOVED
Source: https://github.com/akin-ozer/cc-devops-skills
License: Apache 2.0
Note: Removed 2026-04-11 (0 active references, 15MB on disk). Available on GitHub if needed.

### compound-engineering/ (19 skills, 5 agent groups, 18 commands)
Source: https://github.com/EveryInc/compound-engineering-plugin
Version: 2.35.2 | License: MIT
Key workflows: /plan, /review, /work, /compound, /brainstorm
Philosophy: Each unit of work should make subsequent units easier

### cctools/ (5 plugins)
Source: https://github.com/pchalasani/claude-code-tools
Plugins: aichat (session search/recovery), safety-hooks, tmux-cli, voice, workflow
Optional deps: Rust (for aichat-search binary), Python 3.11+

### fullstack-dev/ (66 skills, 4 commands)
Source: https://github.com/Jeffallan/claude-skills
Key command: /common-ground (surfaces Claude's hidden assumptions)
Categories: 12 language experts, 10 backend frameworks, 6 frontend/mobile, plus infra, devops, security, testing

### infra-showcase/ (7 skills, 11 agents, 3 commands)
Source: https://github.com/diet103/claude-code-infrastructure-showcase
Reference library for hook-driven skill auto-activation patterns
Key file: skill-rules.json (context-aware skill selection)

### mattpocock-skills/ (5 skills)
Source: https://github.com/mattpocock/skills
License: MIT
Install method: `npx skills@latest add mattpocock/skills/<name> -y -g`
Installed to: `~/.agents/skills/` (symlinked into `~/.claude/skills/`)
Skills: tdd, triage-issue, write-a-prd, prd-to-plan, grill-me
Categories: TDD workflow, bug triage, PRD generation, implementation planning, design validation

### impeccable-design/ (3 skills + 10 reference modules)
Source: https://github.com/pbakaus/impeccable
License: Apache 2.0
Skills: design-audit (SK-078), design-critique (SK-079), design-polish (SK-080)
Reference modules: 3 critique refs (cognitive-load, heuristics-scoring, personas)
SK-005 upgrade: 7 frontend-design refs (typography, color-and-contrast, spatial-design, motion-design, interaction-design, responsive-design, ux-writing)
Note: Adapted from Impeccable's /audit, /critique, /polish commands. Template variables resolved. Impeccable-specific features (.impeccable.md config, teach-impeccable) removed.

### canvas-design/ (1 skill)
Source: https://github.com/anthropics/anthropic-cookbook (canvas-design)
License: Anthropic official
Skill: canvas-design (SK-075) — visual art creation via design philosophy manifestos

### enterprise-research/ (1 skill + 3 reference modules)
Source: https://github.com/199-biotechnologies/deep-research-claude-code
License: MIT
Skill: enterprise-research (SK-076, folder renamed from deep-research/ to avoid collision with the built-in deep-research harness) — enterprise research pipeline (8 phases, 3 modes)
Reference modules: methodology, quality-gates, report-assembly

### subagent-driven-dev/ (1 skill)
Source: https://github.com/nicobailon/subagent-driven-development
License: MIT (via obra/superpowers)
Skill: subagent-driven-dev (SK-077) — task dispatch + fresh subagent + two-stage review

### Knowledge entries (6 G-PAT from multiple sources)
KNOWLEDGE-020 (Verification-Before-Completion): obra/superpowers
KNOWLEDGE-021 (Bite-Sized Task Plans): obra/superpowers
KNOWLEDGE-022 (Token Optimization): Everything Claude Code community patterns
KNOWLEDGE-023 (Continuous Learning Loop): Everything Claude Code community patterns
KNOWLEDGE-024 (Context Compression Strategy): mksglu/context-mode + Context Engineering
KNOWLEDGE-025 (Skeleton Loading Generation): amorim/boneyard

### Context Mode MCP Server
Source: https://github.com/mksglu/context-mode
Package: context-mode@latest (npm)
License: Elastic-2.0
Purpose: Sandboxes tool output (98% context reduction), FTS5+BM25 search for relevant context retrieval
Config: Added to ~/.claude/.mcp.json as `context-mode` server
Security audit: postinstall.mjs clean (Windows path fixes only), no telemetry, no exfiltration

### MCP Servers (added 2026-04-12)

| Server | Source | License | Purpose | Cost |
|--------|--------|---------|---------|------|
| claude-design | **REGISTERED 2026-07-22 v10.1.8** (user scope, `api.anthropic.com/v1/design/mcp`) — official Anthropic | Proprietary (hosted, included with the Claude plan) | **OPTIONAL tool for the web-dev system, not its design step** (demoted 2026-07-23 — direction and craft are local; see CLAUDE.md § Deliver + wiki `web-dev/capability-map.md` § Claude Design). Worth reaching for only for a shareable `claude.ai/design` link a human can comment on, or *Start from code* import. Registered permanently at the user's request so it's present when wanted. **Access is ONE account toggle: claude.ai/design/settings → *Claude product access* → On** (equivalently `/design consent`) — the server inherits the Claude Code session; there is no separate credential. **`/design-login` does not exist and never did** (corrected 2026-07-23; `claude mcp login claude-design` replies *"claude-design authenticates automatically with your Claude login"*). Do not read `claude mcp get claude-design` as a health check — it reports `× Failed to connect` when consent is merely ungranted; confirm with a real call (`list_design_systems`). Distinct from the harness-builtin `DesignSync` tool, which syncs design-SYSTEM project files (the `ATLAS House Rules` mirror). | Free (plan-included) |
| vercel | Official (mcp.vercel.com) | Proprietary (hosted) | Deployment management, build logs, env vars, domains | Free (all plans) |
| lighthouse | priyankark/lighthouse-mcp | MIT | Google Lighthouse audits: performance, accessibility, SEO, best practices | Free (runs locally) |
| firecrawl | firecrawl-mcp (npm) | AGPL-3.0 / MIT | Clean web content extraction for LLM consumption | Free tier (500 credits) or self-host free |
| heroui | @heroui/mcp (official) | MIT + Apache-2.0 | HeroUI component docs, props, types, theme tokens, examples | Free |
| aceternity | aceternityui-mcp | MIT | Animated landing page component registry (search, browse, install) | Free |
| iconify | iconify-mcp-server | GPL-3.0 | 200K+ icons from 200+ icon sets (Lucide, Heroicons, Phosphor, etc.) | Free |
| 21st-dev | @21st-dev/magic (official) | Proprietary | AI-generate polished components from text descriptions | Free (100 credits/mo) |
| shadcn | Official (`npx shadcn@latest mcp`) | MIT | Registry-aware shadcn component browse/search/install (multi-registry: @shadcn, @magicui, community) — added 2026-06-11 v8.7.0, user scope | Free |
| unsplash | **REGISTERED 2026-06-11 v8.9.0** (user scope, `✔ Connected`) | MIT (`@violent-madman/unsplash-mcp` v1.0.0) | Real professional photography search in-context — kills placeholder/AI-image slop. **Source-vetted on install:** only network host is `api.unsplash.com`; Access Key sent solely in the `Client-ID` Authorization header; deps = MCP SDK + node-fetch + zod; no child_process/eval/exfiltration; built-in photographer attribution (`generateAttribution`). Tools: search_photos, get_random_photo, get_photo_details, trigger_download (Unsplash attribution requirement). 50 req/hr demo tier; image downloads don't count. Key lives in `~/.claude.json` env. | Free |

### Design Excellence vendored skill (v8.7.0, 2026-06-11)

| Skill | Source | License | Notes |
|-------|--------|---------|-------|
| ui-ux-catalog (SK-133) | nextlevelbuilder/ui-ux-pro-max-skill v2.5.0 @ `07f4ef3` | MIT | 13 CSVs (palettes/styles/pairings/reasoning) + stdlib-only search scripts; write paths + updaters stripped. Pin + refresh procedure: `skills/VERSION-MANIFEST.json` + `skills/ui-ux-catalog/NOTICE.md` |

### App Development MCP Servers (added 2026-04-12)

| Server | Source | License | Purpose | Cost |
|--------|--------|---------|---------|------|
| tauri-mcp | @hypothesi/tauri-mcp-server | MIT | Build, dev, test, scaffold Tauri v2 projects via MCP | Free |
| maestro | maestro mcp (official) | Apache-2.0 | Mobile E2E testing with auto-healing selectors | Free (Cloud paid) |
| statsig | mcp.statsig.com (official, remote HTTP) | Proprietary | Feature flags, A/B experiments, metrics | Free (50M events/mo) |

### Removed App Dev MCPs (audit synthetic-leaf, 2026-05-02)
- `storybook` — addon-only, requires project context, not standalone-invocable
- `openapi` — requires `--spec` arg, not standalone-invocable
- `applitools` — 14-day trial only (not free-tier per `feedback_applitools_trial.md`); replaced by the browser-preview manual screenshot flow

### Code Intelligence (added 2026-04-16)

| Tool | Version | Source | License | Purpose | Cost |
|------|---------|--------|---------|---------|------|
| code-review-graph (CRG) | 2.3.2 | tirth8205/code-review-graph | MIT | Tree-sitter code graph over 23 langs; 30 MCP tools + 5 prompts; SQLite WAL; blast-radius; auto-update on Write/Edit; 8.2× token reduction | Free |

Install: `uv tool install code-review-graph` (CLI via `uvx`) + `claude mcp add -s user code-review-graph uvx code-review-graph serve` (MCP registration at USER scope — stored in `~/.claude.json`, NOT `~/.claude/.mcp.json`).
Verify: `claude mcp list` → `code-review-graph ✓ Connected`.
Replaces: graphify for code-only graphs. Graphify retained for mixed corpora (docs + papers + images).
Do NOT run `code-review-graph install` — it clobbers ATLAS skills/hooks/CLAUDE.md. ATLAS wires CRG manually.

### Expo Official Skills (added 2026-04-12)
Source: https://github.com/expo/skills
Install: `npx skills@latest add expo/skills -y -g`
Skills (11): expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui, native-data-fetching, upgrading-expo, use-dom
Location: `~/.agents/skills/` (symlinked into `~/.claude/skills/`)
Note: Opus-optimized, from official Expo team

### App Development Slash Commands (added 2026-04-12)
- `/new-mobile-app` -- Scaffold Expo + Supabase mobile project
- `/new-desktop-app` -- Scaffold Tauri desktop project
- `/api-design` -- Design and generate API from spec
- `/db-schema` -- Design and validate database schema

## CLI Tools

| Tool | Version | Source | Install Method |
|------|---------|--------|----------------|
| playwright-cli | 0.1.5 | npm (@playwright/cli) | `npm install -g @playwright/cli@latest` |
| playwright (full) | 1.60.0 | npm (playwright) | `npm i -g playwright && playwright install chromium firefox webkit` — powers `skills/impeccable/scripts/verify-browsers.mjs` (3-engine cross-browser + motion-proof verification, v8.10.0). All 3 engines + ffmpeg in `~/AppData/Local/ms-playwright/`. **Keep browser builds matched to the JS version** — run `playwright install` from the same global playwright. |
| claude-rules-doctor | 0.2.2 | npm | `npm install -g` |
| better-ccflare | latest | npm | `npm install -g` |
| tdd-guard | latest | npm | `npm install -g` |
| claude-squad | 1.0.17 | GitHub release | Pre-built Windows binary in ~/.local/bin/ (latest 1.0.18, 2026-05-23) |
| claudio | 1.13.1 | go install | `go install claudio.click/cmd/claudio@latest` (note: the npm pkg named `claudio` is unrelated) |
| react-native-ai-debugger | latest | npm | `npm install -g react-native-ai-debugger --ignore-scripts` |
| maestro | 2.4.0 | get.maestro.mobile.dev | Installed in Ubuntu WSL2 (`~/.maestro/bin/maestro`) |
| crawl4ai | 0.9.1 | pip (crawl4ai) | `pip install -U crawl4ai && crawl4ai-setup` — CLIs (`crwl`, `crawl4ai-doctor`) at `%APPDATA%\Python\Python313\Scripts\` (not on PATH; invoke by full path). Free URL→markdown extraction, no keys — see §v8.20.0 |
| hyperframes | 0.7.48 | npx (no global install) | `npx hyperframes …` — HTML→video renderer + self-managing skill set; FFmpeg 8.1.2 via winget (`Gyan.FFmpeg`); `HYPERFRAMES_NO_TELEMETRY=1` set machine-wide — see §v8.20.0 |
| claude-real-video (`crv`) | 0.7.15 | pip (`claude-real-video[fast]`) | SK-144 runtime. `crv`/`crv-web` at `%APPDATA%\Python\Python313\Scripts` — **added to user PATH 2026-07-20**; PATH-free fallback `python -m claude_real_video`. faster-whisper (CTranslate2, no torch) for the 4 GB-VRAM/CPU box; ffmpeg 8.1.2 on PATH. Video→deduped keyframes + transcript, no keys — see §v9.1.0 |

### WSL Distros
- **Ubuntu** (added 2026-04-12) — Installed for Maestro mobile E2E testing. Has Java 21 (OpenJDK), unzip.

## Hooks in settings.json
Active hooks: PreToolUse, PostToolUse, PostToolUseFailure, Notification, Stop, PreCompact, SessionStart, UserPromptSubmit
Removed 2026-04-05: UserPromptSubmit keyword-detector (0% apply rate), SubagentStop (never existed), subagent-limiter (no-op without tracker)
Re-added: UserPromptSubmit with cctools allow_git_hook.py (session-scoped git staging/commit approval toggle)
Legacy GSD hooks removed (2026-03-16)

### Hook additions (2026-05-01 onwards)
| Hook | Event | Timeout | Purpose |
|---|---|---|---|
| `pre-read-local-llm.js` | ~~PreToolUse Read~~ **UNWIRED v8.14** | — | Local LLM pre-summarizer via Ollama — file retained, wiring removed 2026-07-04 (it had been disabled via `ATLAS_DISABLED_HOOKS` yet still spawned node on every Read). Re-enable: restore the settings.json PreToolUse Read block AND drop `local-llm-pre-reader` from the env var — see the file header. |
| `system-doctor-advisory.js` | SessionStart | 5s | Reads `cache/system-ground-truth.json` and surfaces DRIFT advisory if any validator was red on last sweep or snapshot is >7d old. ~5ms. (Audit synthetic-leaf, 2026-05-02) |
| ~~`memory-wal-checkpoint.js`~~ | ~~Stop~~ | ~~3s~~ | ~~`pragma wal_checkpoint(TRUNCATE)` if `memory/index.db-wal` exceeds 50% of main DB.~~ — **DELETED v8.0.0** (the file was removed, not moved; `hooks/_disabled/` does not exist. Snapshot in `_archived/brain-consolidation-2026-05-15/…tar.gz`) |
| `wiki-session-log.js` | Stop | 5s | Append session summary row to `wiki/session-log/<date>.md`. (v8.0.0 brain-consolidation) |
| `session-transcript-log.py` | Stop | 30s | Verbatim session JSONL → distilled markdown in `wiki/session-log/transcripts/` via Ollama (`qwen2.5:7b`). Fail-open, idempotent. (v8.0.0 brain-consolidation) |

### Validators & system-doctor (2026-05-02, audit synthetic-leaf)

| Surface | Script | Status |
|---|---|---|
| Aggregator | `scripts/system-doctor.js` + `commands/system-doctor.md` | runs all validators, emits scoreboard |
| Snapshot | `scripts/system-snapshot.js` → `cache/system-ground-truth.json` | regen on demand or weekly via `weekly-validator-sweep` |
| Skill counts | `scripts/validate-skill-counts.js` (extended for depth-unlimited bundle walk) | ✓ |
| Cross-listed | `scripts/validate-cross-listed-skills.js` (intersection must be empty) | ✓ |
| Archive | `scripts/validate-archive-counts.js` (`_archived/` ↔ ARCHIVE-DIRECTORY.md) | ✓ |
| Symlinks | `scripts/validate-symlinks.js` (resolves SYMLINKS.md targets) | ✓ |
| Archive manifest | `scripts/validate-archive-manifest.js` (detection patterns ↔ dirs) | ✓ |
| Commands | `scripts/validate-commands.js` (commands/ ↔ REFERENCE.md, plugin-namespace aware) | ✓ |
| Hooks | `scripts/validate-hooks.js` (every hook is reachable from settings.json or another caller) | ✓ |
| Knowledge | `scripts/validate-knowledge.js` (KNOWLEDGE-DIRECTORY ↔ pages, per-type counts, unique IDs, valid Type field) | ✓ |

Audit-mode agents should read `cache/system-ground-truth.json` and run `node scripts/system-doctor.js` BEFORE re-deriving counts via grep — see CLAUDE.md "Auditing the ATLAS system itself".

## local-agent MCP server (2026-05-01)

Ollama-backed MCP tool for zero-cost local LLM inference. Claude delegates cheap sub-agent tasks to a local model instead of spinning up a Haiku-tier API call. Typical savings: 30–178× fewer Claude tokens on file reads, classification, summarization, and boilerplate generation.

**Source:** `~/.claude/mcp-servers/local-agent/index.js`  
**Registered in:** `%APPDATA%\Claude\claude_desktop_config.json` as `local-agent`  
**Runtime:** Node v22, `@modelcontextprotocol/sdk` (deps at `~/.claude/mcp-servers/local-agent/node_modules/`)

### Tool exposed
| Tool | Inputs | Default model |
|------|--------|---------------|
| `local_llm_agent` | `prompt` (required), `model` (optional), `system` (optional) | `qwen2.5:7b` |

### Ollama models for sub-agent use
| Model | Size | Best for |
|-------|------|----------|
| `qwen2.5:7b` | ~4.5 GB | General sub-agent work (default) |
| `qwen2.5-coder:7b` | ~4.5 GB | Code-focused tasks |
| `llama3.2:3b` | ~2 GB | Fast/light tasks |
| `embeddinggemma:300m` | ~200 MB | Embeddings (Living Memory retired in v8.0.0; model retained but unused) |

Pull models: `ollama pull qwen2.5:7b` etc.  
Delegation rules: See `CLAUDE.md` → "Local LLM Delegation" section.

---

## Consolidated brain (v8.0.0, 2026-05-14 onwards)

The durable knowledge layer lives in the Obsidian vault at `<your-vault-path>/wiki/`. `~/.claude/` is pure operational code. Plan-of-record: `~/.claude/plans/brain-consolidation.md` + `wiki/personal/arcs/brain-consolidation.md`.

### Vault structure
> Counts below are illustrative — **live counts: `cache/system-ground-truth.json` / `SYSTEM_VERSION.md`** (validator-backed). Do not treat this table as a source of truth.

| Folder | Holds | Migrated from |
|---|---|---|
| `wiki/personal/` | 5 top-level (incl. profile, system-overview), feedback (7), procedures (5), project-state (14), references (3), reflections (2), arcs (2) — 38 files total | `projects/<cwd>/memory/{semantic,procedural,reflection}/` |
| `wiki/engineering/` | 5 monolithic markdown files: patterns (64), solutions (29), errors (32), preferences (10), failures (11) — 146 entries (illustrative; snapshot is authoritative per the note above) | `topics/KNOWLEDGE-PAGE-1..5-*.md` |
| `wiki/session-log/handoffs/` | 20 handoff files | `handoffs/` |
| `wiki/session-log/transcripts/` | Distilled session transcripts (Stop hook output) | new in v8.0.0 |
| `wiki/{concept,entity,source,synthesis,raw}/` | External-world knowledge — articles, papers, ingested sources, synthesis pages | retained from earlier wiki-manage work |

### Stop-hook pipeline (writes to vault)
- `hooks/session-stop.sh` — Handoff, todos, KG capture (memory-related §1d commented out)
- `hooks/wiki-session-log.js` — Append session summary to `wiki/session-log/<date>.md`
- `hooks/session-transcript-log.py` — Verbatim JSONL → distilled markdown in `wiki/session-log/transcripts/` via Ollama (`qwen2.5:7b` default). Fail-open, idempotent. Filters trivial sessions (<2 user turns).

### Session-start pipeline (reads vault)
- `hooks/session-start.sh §7l` — VAULT ORIENTATION block: head of `wiki/personal/_index.md` + user-profile summary, injected as L1 context.

### Required runtime
| Component | Version | Install method | Purpose |
|---|---|---|---|
| Ollama | ≥0.1.45 | `winget install --id Ollama.Ollama` | Local model serving (qwen2.5:7b for distillation) |
| `qwen2.5:7b` model | latest | `ollama pull qwen2.5:7b` | Transcript distillation; sub-agent work |
| Python | ≥3.10 | `python.org` / store | `session-transcript-log.py` runtime |
| Node.js | ≥20 | already installed | Hook runtime |

### Vault git
Local-only repo. `.git/hooks/pre-push` refuses all pushes with exit 1 + privacy message. **Never `git remote add`. Never push.** Personal data leaks are not recoverable.

### Retired (Living Memory, Bentley plan 2026-04-26 → 2026-04-30 → retired 2026-05-14)
9 hooks **deleted** (not moved — `hooks/_disabled/` does not exist): `memory-{episodic-write,indexer,lifecycle,precompact,regen-index,retrieve,wal-checkpoint,worker,write-watch}.js`. Full snapshot preserved in `_archived/brain-consolidation-2026-05-15/brain-consolidation-pre-phase1-20260514-124017.tar.gz`. Slash commands `memory-{rebuild,promote-to-wiki}` moved to `_retired_commands/`; skill `dream` archived to `skills/_archived/dream/`. `hooks/lib-memory.js` was **deleted, not retained** — `drift-proposer.js` no longer references it (the dead `require` path was removed in v8.2.0); `atlas-kg.js`'s disabled SQL-mirror stub is being removed too. Embedding model `embeddinggemma:300m` no longer used. Cron tasks `memory-{decay-daily,dream-weekly,dream-quarterly}` are **disabled in the plugin registry as orphans**; their on-disk `scheduled-tasks/memory-*/` dirs no longer exist (only the 6 enabled-task dirs remain).

## Wave 2 prune (2026-04-27) — project-scope MCPs cut

Cut from `~/.claude/.mcp.json`. Add to each project's own `.mcp.json` when needed. Activation commands (run from PowerShell):

| Server | Re-add command |
|---|---|
| supabase | `claude mcp add -s user -e SUPABASE_ACCESS_TOKEN=$env:SUPABASE_ACCESS_TOKEN supabase -- npx -y @supabase/mcp-server-supabase@latest` |
| stripe | `claude mcp add -s user -e STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY stripe -- npx -y @stripe/mcp@latest` |
| resend | `claude mcp add -s user -e RESEND_API_KEY=$env:RESEND_API_KEY resend -- npx -y resend-mcp` |
| sentry | `claude mcp add -s user -e SENTRY_ACCESS_TOKEN=$env:SENTRY_ACCESS_TOKEN sentry -- npx -y @sentry/mcp-server` |
| upstash | `claude mcp add -s user -e UPSTASH_EMAIL=$env:UPSTASH_EMAIL -e UPSTASH_API_KEY=$env:UPSTASH_API_KEY upstash -- npx -y @upstash/mcp-server@latest` |
| netlify | OAuth (recommended): `npm i -g netlify-cli && netlify login`, then `claude mcp add -s user netlify -- npx -y @netlify/mcp@latest`. Or env-var: `claude mcp add -s user -e NETLIFY_ACCESS_TOKEN=$env:NETLIFY_ACCESS_TOKEN netlify -- npx -y @netlify/mcp@latest` |
| firecrawl | `claude mcp add -s user -e FIRECRAWL_API_KEY=$env:FIRECRAWL_API_KEY firecrawl -- npx -y firecrawl-mcp` |
| claude-design | `claude mcp add --scope user --transport http claude-design https://api.anthropic.com/v1/design/mcp` — then grant access once at claude.ai/design/settings → *Claude product access* → On (or `/design consent`). No login step; it inherits the Claude session. |
| 21st-dev | `claude mcp add -s user -e TWENTY_FIRST_API_KEY=$env:TWENTY_FIRST_API_KEY 21st-dev -- npx -y @21st-dev/magic@latest` |
| maestro | `claude mcp add -s user maestro -- wsl -d Ubuntu -- bash -c 'export PATH="$PATH:$HOME/.maestro/bin" && maestro mcp'` |
| unsplash | `claude mcp add -s user -e UNSPLASH_ACCESS_KEY=$env:UNSPLASH_ACCESS_KEY unsplash -- npx -y @violent-madman/unsplash-mcp@latest` — then ALSO add `'unsplash'` to `MCP_USER_SCOPE` in `scripts/validate-systems.js` + the ARCHITECTURE.md §MCP user-scope line + design-ui `preferred_mcp` (hand-sync rule) |

User-scope removals (also from this wave): `linear`, `posthog` (`claude mcp remove -s user <name>`). Re-add via search of `claude mcp add` examples or registry docs.

**2026-06-08 — `prisma` removed (user scope)** during a skills/MCP consolidation audit: the stack standardized on Drizzle + Neon (`drizzle-neon` skill; Neon tools live in `MCP_DOCKER`), leaving the standalone Prisma MCP (`Prisma-Studio` / `migrate-*`) with no in-scope caller. `/db-schema`'s Prisma branch was redirected to Drizzle. Re-add if a project adopts Prisma: `claude mcp add -s user prisma -- npx -y prisma mcp`.

**2026-06-12 — `@21st-dev/magic` removed (desktop-app config, `%APPDATA%\Claude\claude_desktop_config.json`)** — stale leftover from before the Wave 2 prune: its API key was still the literal placeholder `"YOUR_API_KEY"` (tools could never call the 21st.dev API), and its `cmd /c npx` wrapper printed `Terminate batch job (Y/N)?` into the JSON-RPC stream on every app shutdown, causing recurring `Unexpected token 'T' … is not valid JSON` error toasts. Pre-edit backup: `C:/tmp/claude-scratchpad/claude_desktop_config.backup-20260612-151745.json`. Re-add with a real key from console.21st.dev using the `21st-dev` row in the re-add table above (note: the desktop-app config is a THIRD registry, separate from user scope `~/.claude.json` and project scope `~/.claude/.mcp.json`).

**2026-07-14 — F4 prune (proposal approved by the user)** — `cloudflare` + `expo` removed at user scope (`claude mcp remove -s user <name>`; never authed, never used); `statsig` disabled in `~/.claude/.mcp.json` after 2.5 months never-authed/never-approved (supersedes the wave-2 "retained at user request" note; the re-add one-liner is preserved in that file's `_comment_f4_prune_2026_07_14`). `vercel` deliberately KEPT despite never-authed: platform match, and the claude.ai Vercel-toolbar connector is separate and active. Re-add cloudflare: `claude mcp add -s user --transport http cloudflare https://mcp.cloudflare.com/mcp` · expo: `claude mcp add -s user --transport http expo https://mcp.expo.dev/mcp`. The `plugin:*` auth-required servers and the `anthropic-skills@inline` bundle (F2's 7 duplicate skills) are claude.ai/app-provisioned — no local disable surface; F2 therefore needs the app's own skill settings, not a file edit here.

## Wave 2.4 — Plugin-marketplace MCP servers (audit only, 2026-04-27)

These load via Claude Code's plugin system (not `claude mcp` registry). Manage via plugin settings UI. Identified at session start by their UUID prefix. If unused in last 60 days, consider disabling via plugin marketplace.

| UUID prefix | Likely service |
|---|---|
| 0aa31d67-... | Gamma (AI presentations) |
| 33fa2d63-... | BigData (company/market tearsheets) |
| 4b36355d-... | Cryptocurrencies / LunarCrush social |
| 883407ff-... | Canva designs |
| a135693c-... | Figma (design context, separate from plugin:figma:figma) |
| b5e00eb0-... | Resume / job search |
| cf0a53bf-... | Gmail |
| e7480d9f-... | Prospect / B2B enrichment |
| f8134a90-... | Vercel deploy / toolbar helpers |

Action for user: open plugin marketplace, disable any not used in last 60 days. Records here so re-enabling is one click later.

## App Dev (CLAUDE.md migration, 2026-04-28)

Moved out of `CLAUDE.md` during Wave 3.3 of the ATLAS reduction.

### App Dev MCP Servers

| Server | Purpose | Surface |
|--------|---------|---------|
| `tauri-mcp` | Build, dev, test Tauri v2 projects (pairs with Tauri Desktop Engine skill) | Desktop |
| `maestro` | Mobile E2E testing with auto-healing selectors (Android on Win, iOS needs macOS) | Mobile testing |
| `statsig` | Feature flags, A/B experiments, metrics (free 50M events/mo) — OAuth | Lifecycle |
| `lighthouse` | Performance/a11y/SEO audits on URLs, runs locally | Runtime quality |
| `chrome-devtools` | Real-Chrome debugging + performance traces (CWV scoring, LCP subparts) — in the frontend auto-bundle (`templates/frontend-mcp.json`, added 2026-07-09) | Runtime quality |
| `firecrawl` | Clean markdown extraction from webpages | Research |
| `21st-dev`, `heroui`, `aceternity`, `shadcn`, `magicuidesign`, `iconify` | Component + icon registries | UI sourcing |
| `supabase`, `resend`, `sentry`, `netlify`, `vercel` | Backend + deployment + error tracking | Platform |

> `prisma` removed 2026-06-08 (stack moved to Drizzle + Neon) — see the prisma removal note under "Wave 2 prune" above for the re-add command.

### App Dev Slash Commands
- `/new-mobile-app` — Scaffold Expo + Supabase mobile project
- `/new-desktop-app` — Scaffold Tauri desktop project
- `/api-design` — Design and generate API from spec
- `/db-schema` — Design and validate database schema

### App Dev Skills (Expo Official, 2026-04-12)
Installed from `expo/skills`: expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui, native-data-fetching, upgrading-expo, use-dom

### App Dev Skills — skills.sh sweep (2026-06-18, v8.12.0)

Vendored from a scoped skills.sh app-dev sweep (mobile / desktop / testing / store-deploy). Each candidate was deep-read file-by-file and adversarially skeptic-vetted via the `appdev-skill-vet` workflow, then SHA-pinned and stripped of self-promo/telemetry/marketplace machinery.

| Skill | Source | License | Notes |
|-------|--------|---------|-------|
| app-store-review (SK-135) | `safaiyeh/app-store-review-skill` @ `c2532321` | MIT | Apple App Store Review Guidelines preflight (all 5 sections, Swift/ObjC/RN/Expo). SKILL.md (+ATLAS routing note) + `rules/1-5.md` verbatim + LICENSE. README/metadata.json/plugin-machinery excluded (no telemetry path). See `skills/app-store-review/NOTICE.md`. |
| fastlane (SK-136) | `greenstevester/fastlane-skill` @ `df448776` | MIT | Native/non-EAS deployment + code signing (TestFlight, App Store, Match, screenshots, Xcode Cloud / GH Actions CI). **Distilled** 5 command-skills + `docs/xcode-cloud.md` into one authored SKILL.md — dropped the `!`auto-exec pre-flight blocks; **iOS lanes are macOS-only**. See `skills/fastlane/NOTICE.md`. |
| upgrading-react-native (SK-137) | `callstackincubator/agent-skills` @ `0ba043ab` | MIT | Bare/ejected RN version upgrades (Upgrade Helper diffs, native config, breaking APIs). SKILL.md (+ATLAS routing note + `vendored_from`) + 7 `references/*.md` verbatim + LICENSE; `agents/openai.yaml` plugin machinery excluded. See `skills/upgrading-react-native/NOTICE.md`. |
| react-native-brownfield-migration (SK-138) | `callstackincubator/agent-skills` @ `0ba043ab` | MIT | Embed RN/Expo into existing native iOS/Android apps (XCFramework/AAR, phased host integration). SKILL.md (+routing note) + 10 `references/*.md` verbatim + LICENSE; plugin machinery excluded. See `skills/react-native-brownfield-migration/NOTICE.md`. |
| github-actions (SK-139) | `callstackincubator/agent-skills` @ `0ba043ab` | MIT | GitHub Actions CI for RN simulator/emulator cloud builds + artifact download (gh CLI / GitHub API). SKILL.md (+routing note) + 3 `references/*.md` verbatim + LICENSE; plugin machinery excluded. See `skills/github-actions/NOTICE.md`. |

**Previously held, now ADOPTED (v8.13.0):**
- `callstackincubator/agent-skills` @ `0ba043ab` (MIT, org-backed) — `upgrading-react-native` (SK-137), `react-native-brownfield-migration` (SK-138), `github-actions` (SK-139). Held in v8.12.0 (bare-RN / native-integration scope is low-value for a Windows + Expo/EAS stack); adopted 2026-06-19 to complete the app-dev sweep hand-off. SHA-pinned manual vendor, re-scanned clean, `agents/openai.yaml` plugin machinery stripped — see each skill's `NOTICE.md` and the rows above.

**Rejected — license failure** (hard gate; redistribution-unsafe):
- `tovimx/maestro-mobile-testing-skill` — Maestro YAML test-authoring; SKILL.md *claims* MIT but ships **no LICENSE file**. Revisit if upstream adds one.
- `software-mansion-labs/skills` → `radon-mcp` — Radon IDE live-debugging; LICENSE file **404'd** on the skeptic's re-check (README says MIT, but no file), and value is conditional on running Radon IDE.

**Surfaced but skipped as redundant:** every RN `*-best-practices` skill (Vercel Labs / Callstack / Software Mansion) → covered by `react-native`; mobile-*design* skills (`sleekdotdesign/agent-skills`, `awesome-skills/mobile-app-design`) → covered by `tactile` / `mobile-app-design`; all Tauri skills → covered by `tauri-mcp`.

### Full-stack system sweep (v8.13.0, 2026-06-19) — 0 adopted

First skills.sh sweep of the **full-stack** system, via `skill-vet` (SK-140). Discovery across 12 query angles (Next.js, RSC, TS backend, Postgres, ORM, API, devops/CI, Docker/k8s, observability, auth, Tailwind, Node) → 7 strongest candidates adversarially vetted (3-gate default-refute, 7-agent Workflow). **Outcome: adopt 0, hold 1, reject 6** — full-stack is already densely covered by native SK-029/030/031/116/117/120/123/129/130/131 + the `fullstack-dev` (66) and `trailofbits-security` (74) bundles. Recorded so re-vetting isn't needed:

- **Held — decision FINALIZED 2026-06-19: leave-held.** `neondatabase/agent-skills` @ `claimable-postgres` (Apache-2.0, official Neon) — instant throwaway-Postgres *provisioning* (distinct from SK-130's schema/query). Held because value is marginal for personal/learning work **and** it has an aggressive default posture (auto-provisions remote DBs unprompted, always-`@latest` remote npx, Vite-plugin auto-provision on dev, embedded tracking `ref`). **Decisive reason not to adopt:** the only adoption-safe path is to strip the auto-provision + Vite plugin first — but that *is* the sole non-redundant capability, so stripped it collapses into SK-130 (drizzle-neon) + the in-environment Neon MCP (`mcp__MCP_DOCKER__create_project` / `create_branch` / `get_connection_string`) + `anthropic-skills:neon-postgres`, leaving only a thin doc around an unpinned `@latest` remote npx that cuts against the system's SHA-pin discipline. Adopting it for sweep-completion's sake would violate `skill-vet` §3 (don't bloat the count with skills that won't trigger). **Re-adopt trigger:** only if the user wants zero-auth throwaway DBs in a *real recurring workflow* (e.g. a hackathon spinning up disposable Postgres repeatedly) — and then adopt the **raw** provisioning capability deliberately, eyes-open on the `@latest` npx; stripped-adoption is pointless.
- **Rejected — no LICENSE file (hard gate):** `better-auth/skills@two-factor-authentication-best-practices` (official, but repo has zero LICENSE; also redundant with SK-131), `clerk/skills@clerk-nextjs-patterns` (frontmatter MIT, no file; Clerk≠Better Auth), `langchain-ai/langchain-skills@deep-agents-memory` (no LICENSE; LangChain≠Vercel AI SDK).
- **Rejected — redundant / off-stack (licensed but no fit):** `mcollina/skills@node` (MIT; self-hosted-Node focus vs the user's serverless), `prisma/skills@prisma-postgres` (MIT; Prisma≠Drizzle), `sickn33/antigravity-awesome-skills@observability-engineer` (MIT; enterprise SRE, covered by fullstack-dev sre/monitoring).

**Other systems:** `atlas-meta` = already covered by `context-engineering-kit` (65) + `compound-engineering` (39) + self-evolve/smart-swarm/subagent-driven-dev. `design-ui` swept v8.7.0, `app-dev` v8.12.0+v8.13.0.

### App Dev Skills — re-sweep (2026-06-26) — 0 adopted

A week after v8.12.0/v8.13.0, re-ran `skills.sh` discovery across the native stack (expo, react-native, mobile, swiftui, jetpack-compose, android-kotlin, ios, app-store, fastlane, rn-performance, accessibility, animation, rn-testing). Most hits were the same already-vendored Expo-official + already-rejected/redundant set; **5 genuinely-new / plausibly-non-redundant candidates** were adversarially vetted (`appdev-resweep-and-gap-audit` Workflow, 3-gate default-refute, inspect-only via `gh api`, scratch-quarantine — no installer run). **Outcome: adopt 0, hold 3, reject 2.** The app-dev skill space remains comprehensively covered by the existing roster; adopting any of these would have bloated the count against `skill-vet` §3.

- **Rejected — license failure (hard gate):** `dpearson2699/swift-ios-skills@ios-accessibility` (2.6K installs) — a real LICENSE file exists but it's **PolyForm Perimeter License 1.0.0**, source-available + **non-permissive (noncompete clause)**, outside the MIT/Apache/BSD/ISC set → redistribution-unsafe. (Also native-iOS-only + overlaps tactile/swiftui-pro/app-store-review.)
- **Rejected — wholly redundant:** `mindrally/skills@expo-react-native-typescript` (1.3K, Apache-2.0, clean) — a ~40-line generic Expo/RN/TS listicle whose every bullet is already owned at far greater depth by `react-native` + `tactile` + `building-native-ui` + `native-data-fetching` + the `expo-*` family. On-stack but zero capability delta.
- **Held — clean + licensed but redundant/off-stack (re-vet skip list):**
  - `pproenca/dot-skills@expo-react-native-performance` (876, MIT, clean) — = the `react-native` (Callstack) perf skill; identical RN-perf canon, no new ground.
  - `dimillian/skills@swiftui-performance-audit` (7.6K, MIT, clean) — = `swiftui-pro` (covers perf) + `swift-concurrency-pro`; adds only marginal Instruments-profiling depth, and native-iOS is secondary on a Windows/Expo host.
  - `dylantarre/animation-principles@mobile-touch` (1.9K, MIT, clean) — Disney's 12 principles restated for mobile; already owned (RN-specific) by `tactile` motion-and-gesture + touch-and-interaction; its only code is native UIKit/Kotlin, not Expo/RN.
- **Skipped as redundant (not deep-vetted):** `avdlee`/`twostraws` SwiftUI → `swiftui-pro`; `wondelai@ios-hig-design`, `wshobson@mobile-ios/android-design`, `sleekdotdesign@sleek-design-mobile-apps` (281K, re-confirmed) → `tactile`/`mobile-app-design`; `thebushidocollective`/`krutikjain` Compose/Kotlin → `android-development`; `momentic-ai@momentic-mobile-test` → `e2e-testing`/`mobile` MCP; `software-mansion@argent-ios-simulator-setup` → off-stack (no iOS sim on Windows); `callstack@react-native-best-practices` → `react-native`.

### Free-repo integration wave (v8.20.0, 2026-07-10) — crawl4ai + hyperframes adopted, 3 concepts woven, parked-capabilities registry created

From a 13-repo + CuPy evaluation (research briefing: 5 parallel agents, GitHub-API-verified; full record in vault `wiki/personal/project-state/free-repo-integration-2026-07.md`). Adopted only genuinely-free, key-less capabilities.

#### crawl4ai (CLI tool — the free web-extraction layer)

| | |
|---|---|
| **Source** | `unclecode/crawl4ai` v0.9.1, Apache-2.0, ~72k stars, active |
| **Install** | `pip install -U crawl4ai` + `crawl4ai-setup` (2026-07-10). CLIs at `%APPDATA%\Python\Python313\Scripts\` (NOT on PATH): `crwl.exe`, `crawl4ai-setup.exe`, `crawl4ai-doctor.exe` |
| **Verified** | `crwl https://example.com -o markdown` → clean markdown ✓ |
| **Why** | Self-hosted firecrawl alternative: URL→markdown, CSS/XPath extraction (no LLM), deep crawl, screenshots/PDF/JS — zero keys, no credit ceiling. Firecrawl MCP (500 credits/mo) demoted to fallback |
| **Wired into** | `wiki-manage` SKILL.md ingest fetch order (Defuddle → **crawl4ai** → firecrawl → WebFetch) + `enterprise-research` source cascade tier 3 |
| **Upgrade path (parked)** | Docker MCP server: `docker pull unclecode/crawl4ai:latest` (needs `--shm-size=1g`) then `claude mcp add --transport sse c4ai-sse http://localhost:11235/mcp/sse` — tools: md, html, screenshot, pdf, execute_js, crawl. NOT registered now: the MCP requires the container running, so it would sit dead in `claude mcp list` and trip weekly-mcp-health. Register only if crawling becomes MCP-preferred / high-volume |

#### hyperframes (SK-143 — HTML→video rendering; first video capability)

| | |
|---|---|
| **Source** | `heygen-com/hyperframes` (HeyGen, org-backed, ~34.1k stars), **Apache-2.0** (verified from LICENSE file). CLI v0.7.48. Vet SHA `dda09c8d6434158de397c6ec393b83c15464a304` |
| **What** | Deterministic HTML/CSS/GSAP → MP4/WebM/alpha-overlay/deck renderer built for agents. NOT an AI model — headless Chrome + FFmpeg; no GPU, no keys, no account |
| **Verified end-to-end** | 2026-07-10: `npx hyperframes init hf-verify --example blank --non-interactive` + `npx hyperframes render` → real MP4 (10.0s video, rendered 18.5s) ✓ |
| **⚠ Live-managed skill dir** | `skills/hyperframes/SKILL.md` (the intent router) + the core domain dirs (`hyperframes-core/-animation/-keyframes/-creative/-cli/-registry`, `media-use`) are **installed and refreshed by the upstream CLI** (`init` / `skills update`) into `~/.claude/skills/` + `~/.agents/skills/`. **Empirically confirmed: local edits to these SKILL.md files are overwritten on refresh** (hash-based manifest) — an adapted router with an ATLAS note was replaced within the hour. So: never edit those files; ATLAS routing/vet docs live HERE + ACTIVE-DIRECTORY row + web-dev capability map. Workflow skills (product-launch-video, website-to-video, motion-graphics, music-to-video, slideshow, pr-to-video, embedded-captions, talking-head-recut, faceless-explainer, general-video, remotion-to-hyperframes) install lazily at trigger time. **Audit guidance: all `hyperframes-*` / `media-use` / workflow dirs are SK-143 bundle content, deliberately unrowed — not strays** |
| **Safety vet** | Danger scan over upstream skills/*.md: 1 hit — `media-use` documents `curl … static.heygen.ai/cli/install.sh \| bash` for the OPTIONAL HeyGen catalog (BGM/SFX/TTS/avatar, needs HeyGen OAuth account). Opt-in only; never run without asking the user; rendering needs none of it. Telemetry: CLI ships PostHog, **opted out machine-wide** `setx HYPERFRAMES_NO_TELEMETRY 1` (2026-07-10) |
| **Runtime deps** | Node 22+ ✓ · FFmpeg **8.1.2** installed 2026-07-10 via `winget install Gyan.FFmpeg` (resolves via PATH or `FFMPEG_PATH`; fresh shells: `%LOCALAPPDATA%\Microsoft\WinGet\Links`) · headless Chrome auto-fetched |
| **Composes with** | SK-042/044 (GSAP inside compositions), impeccable design discipline; page motion stays with the web stack — hyperframes owns rendered-video deliverables. App-dev: App Store preview videos / promo clips |

#### Concepts woven (software rejected, ideas kept — per `prefer-claude-md-over-vendored-skills`)

- **loop-engineering** (`cobusgreyling/loop-engineering`, MIT) → KNOWLEDGE-173: design-the-loop methodology + gap-audit vs our 7 scheduled tasks (missing primitives: token-cost estimator, circuit breaker — build at next new-loop proposal, not speculatively). npm CLIs not installed.
- **TencentDB-Agent-Memory** (license ⚠ MIT-text but GitHub says Other/NOASSERTION — Tencent preamble) → KNOWLEDGE-174: drillable symbolic task-graph short-term memory + deterministic drill-down to raw evidence. Software rejected: OpenClaw plugin form factor, needs LLM key, reopens the v8.0.0 Living-Memory retirement.
- **SkillNet** (`zjunlp/SkillNet`, MIT, arXiv:2603.04448) → skill-vet §2b five-dimension rubric (Safety/Completeness/Executability/Maintainability/**Cost-Awareness**). The tool itself REJECTED: its GitHub→`~/.claude/skills` auto-installer bypasses exactly the vet skill-vet enforces.

#### Parked capabilities — pre-vetted, adopt when a use case appears (user request, 2026-07-10: "make sure the agent picks it up later when needed")

> **self-evolve (SK-142) checks this table BEFORE `mcp-find`/web-search when a gap matches.** Each row was already researched + license-checked; adoption is install + register, not re-research.

| Capability | Tool | Trigger to adopt | Install (verified free) | Caveats |
|---|---|---|---|---|
| **Local image generation** | ComfyUI (`comfy-org/ComfyUI`, GPL-3.0, ~120k★) + official **local** Comfy MCP (launched 2026-06-30, docs.comfy.org/agent-tools) | the user wants local text-to-image / img2img (Unsplash covers *photography*; this is *generation*) | Windows portable 7z or `comfy-cli`; then the free local MCP | 4 GB VRAM (RTX 3050 Ti): SD1.5 ✓, SDXL tight, video models ✗. Weights carry their OWN licenses (Flux-dev non-commercial; Wan Apache). GPL fine for personal self-host |
| **Local TTS / voice cloning** | OmniVoice (`k2-fsa/OmniVoice`, Apache-2.0 code+weights, ~613M params) | Voice/narration need — e.g. narrating hyperframes videos (obvious composition) | `pip install omnivoice`; weights auto-download from HF | CPU-only + Windows support UNDOCUMENTED (uses flash_attn → SDPA fallback; GPU examples only). Verify on this machine before promising. We already have `cctools:voice:speak` for basic TTS |
| **Crawling as MCP** | crawl4ai Docker server | Heavy/recurring crawling, MCP-preferred workflows | See crawl4ai row above | Container must be running or the MCP reads dead |
| **MCP tool-description compression** | `caveman-shrink` (npm, from `juliusbrussee/caveman`, MIT) | MCP context weight becomes a measured problem (~200+ tools loaded today) | npm package — wraps any MCP server | MITM proxy in the MCP path → needs a hard security vet FIRST. Measure the actual cost before adopting; caveman core originally rejected (readability > terse-speak) but OVERRULED by the user 2026-07-24 — see rejection-list note below |
| **No-code scheduled scrapers** | Maxun (`getmaxun/maxun`, ⚠ AGPL-3.0, ~16.4k★) | Recurring visual-recorder scraping robots with schedules/APIs | Docker Compose (Postgres+Redis+MinIO+Chromium) | Heavy 4-service stack — crawl4ai covers extraction; adopt only for the recorder/schedule workflow. AGPL fine for personal use |
| **Local video generation** | Wan2.2 (`Wan-Video/Wan2.2`, Apache-2.0) via `deepbeepmeep/Wan2GP` low-VRAM fork | **GPU upgrade to ≥8 GB VRAM** (hard-blocked today: smallest model needs 8.19 GB vs our 4 GB) | ComfyUI or Wan2GP | Not before a hardware upgrade — do not retry on this laptop |

**Evaluated and REJECTED outright (do not re-research):** browser-use (needs paid LLM key in practice; redundant with claude-in-chrome/Playwright/Preview), openwiki (collides with the vault + needs LLM key + macOS LaunchAgents), OpenHands (is Claude Code; Docker/WSL2; redundant), CuPy (runs on the 3050 Ti but ATLAS has no numeric hotspot; ROCm path Linux-only). ~~caveman core (net-negative on already-terse work; readability rule wins)~~ — **OVERRULED by explicit the user request 2026-07-24** ("not too many words, straight to the point"): re-vetted `github:JuliusBrussee/caveman@0d95a81d` (MIT ✓, pure-doc core ✓), **woven into CLAUDE.md** "Caveman terseness" bullet per [[prefer-claude-md-over-vendored-skills]] — skill machinery (installers, compress scripts, plugin dirs) NOT vendored. `caveman-shrink` hold above unchanged.

**Design-principle gap-audit (same workflow):** audited tactile's 16-file reference lib + 31 AR-T## rules against current Apple HIG / Material 3 / NN/g / WCAG 2.2 sources. Coverage confirmed STRONG (deep-linking, dark-mode nuance, gesture-conflict, offline/optimistic, reduced-motion all already covered — refused as non-gaps). **3 genuine MEDIUM gaps filled** (in existing reference files, no new files / no AR-T renumber): haptics generator taxonomy → `motion-and-gesture.md`; biometric/auth-gate state → `state-patterns.md`; RTL/i18n logical-property discipline → `cross-platform-parity.md` (#9, locale-conditional — deliberately not an AR-T BLOCK, since physical margins are valid in LTR-only apps). Plus a WCAG 2.2 SC 2.5.8 citation in `touch-and-interaction.md`. All API facts (expo-haptics, expo-local-authentication, RN I18nManager) verified against live Expo/RN docs first.

### Repo-integration round 2 (v9.1.0, 2026-07-20) — 12-repo request; 2 adopted, 1 woven, 2 standalone, rest held/rejected

From a 12-repo list the user supplied ("check if we can use these locally" → "integrate what genuinely improves what we have"). Each run through `skill-vet` (SK-140) 3-gate default-refute + the user-context filter. Quarantine clones in `C:/tmp/claude-scratchpad/repo-vendor-quarantine/`.

#### SK-144 claude-real-video — ADOPTED (video understanding; new capability)

| | |
|---|---|
| **Source** | `HUANGCHIHHUNGLeo/claude-real-video` @ `3fc1872dba1ba85ee534a3faa812231cef501e97`, **MIT** (LICENSE file verified, © 2026 LeoAido — likely the user's own project) |
| **What** | `crv` CLI: video → scene-change-detected, deduplicated keyframes + Whisper transcript so the model can "watch" a video. Fully local, no API keys |
| **Vendored** | `skills/claude-real-video/` — SKILL.md (from `skills/claude-real-video-for-agents/`, frontmatter-only adaptation + ATLAS routing note) + LICENSE + NOTICE |
| **Runtime** | pip `claude-real-video[fast]` v0.7.15 → **faster-whisper/CTranslate2** (no torch) — chosen for the 4 GB-VRAM/CPU box; `crv` auto-prefers it. ffmpeg 8.1.2 on PATH. Scripts added to user PATH; fallback `python -m claude_real_video` |
| **Verified end-to-end** | 2026-07-20: synthetic 6 s clip → 6 frames deduped to 4 + 3×3 contact sheet ✓. `MANIFEST.txt` ships an untrusted-transcript prompt-injection boundary (a plus) |
| **Excluded** | `src/` (installed via pip), `install-skill.sh` (inspected, benign, not run), marketing/benchmark/tests, the human-facing skill variant |

#### SK-145 clone-website — ADOPTED (site reverse-engineering; complements impeccable)

| | |
|---|---|
| **Source** | `JCodesMore/ai-website-cloner-template` @ `58e00d5369181dc0b84b45a2a55e6f64a017f59b`, **MIT** (LICENSE file verified, © 2025 JCodesMore) |
| **What** | `/clone-website <url>`: browser MCP extracts a live site's CSS/assets/behavior section-by-section → spec files → parallel builder agents → Next.js 16 + shadcn + Tailwind v4 codebase. 9 guiding principles, spec-driven, build-must-compile gate |
| **Vendored** | `skills/clone-website/` — SKILL.md (473 lines, +ATLAS routing note) + `references/INSPECTION_GUIDE.md` + LICENSE + NOTICE |
| **Runtime** | Browser MCP = **Claude_Browser** pane (fallbacks: claude-in-chrome, playwright-cli) + a Next.js 16/shadcn/Tailwind v4 scaffold at use time. Upstream pins `engines.node >=24`; runtime works on installed Node 22 |
| **Excluded** | the Next.js template scaffold, `scripts/sync-skills.mjs` (inspected: pure `node:fs`, safe), per-agent copies (`.codex`/`.cursor`/`.gemini`/…) |
| **Non-redundant** | impeccable = *original* design; clone-website = *reverse-engineer an existing* site. Ethics guardrail preserved: clone only sites you have the right to; never impersonation |

#### Woven (engine only, not a skill) — scroll-world scrub-engine

`oso95/scroll-world` @ `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` (MIT). The free, dependency-free vanilla-JS scroll-scrubbed video engine → `wiki/web-dev/techniques/` as `[[scroll-scrub-video-engine]]` + `scrub-engine.js` + `scrub-engine-template.html`, linked from `[[web-dev-system]]`. **The paid AI generation pipeline (Higgsfield/GPT-Image-2 stills, Seedance/Kling clips) was excluded** — per the user's "engine only." Reviewed line-by-line: XSS-escaped, seek-coalescing, iOS-primed, reduced-motion fallback, no network beyond your own clip URLs.

#### Standalone apps (installed for the user, NOT agent-wired)

- **Jan** (`janhq/jan`, Apache-2.0) — local-LLM desktop app, OpenAI-compatible API at `http://localhost:1337`, Tauri + llama.cpp. **Install:** `winget install --id Jan.Jan` (attempted user-scope 2026-07-20; also on MS Store as `XPDCNFN5CPZLQB`). Complements the existing Ollama backend (`local-agent` MCP) with a GUI + server.
- **Youwee** (`vanloctech/youwee` v0.20.0, MIT) — yt-dlp GUI (downloads + AI summaries via Gemini/OpenAI/Ollama), Tauri. **Not on winget** — install from the release: `gh release download v0.20.0 --repo vanloctech/youwee --pattern "Youwee-Windows-Setup.exe"` then run it (UAC). Purely a personal tool; nothing wired into the agent.

#### OmniRoute — DOCUMENTED, deliberately NOT adopted

`diegosouzapw/OmniRoute` (MIT) — AI gateway aggregating free-tier providers behind one OpenAI-compatible endpoint. **Usage** (if the user wants a *separate, throwaway* coding setup): `npm install -g omniroute` → `omniroute` (dashboard + API at `http://localhost:20128/v1`) → Dashboard → Providers → connect a no-auth free provider → copy the API key from Dashboard → Endpoints → point a coding tool at base URL `http://localhost:20128/v1`, key from dashboard, model `auto`. **Not adopted because** routing *main* Claude Code sessions through it replaces Opus 4.8 with free models and sends prompts through third-party providers (quality + privacy downgrade). The "$0 sub-tasks" need is already covered by `local_llm_agent` (Ollama).

#### Held / rejected (do not re-vet)

| Repo | License | Verdict | Reason |
|---|---|---|---|
| `remotion-dev/skills` | **no LICENSE file** | **Hold (hard-reject to vendor)** | Redistribution-unsafe without a LICENSE; only if Remotion work appears. hyperframes already covers HTML→video |
| `kulaxyz/self-learning-skills` | MIT | Reject (redundant) | Duplicates self-evolve/learn/reflect; auto-writing skill files would bypass the sous-chef single-approval path (`review-proposals`) |
| `browser-use/browser-harness` | MIT | Reject (redundant + surface) | Overlaps Claude_Browser / claude-in-chrome / MCP_DOCKER Playwright / playwright-cli; also auto-persists agent-written executable helpers |
| `vercel-labs/skills` (find-skills) | MIT | Skip (already have) | The `npx skills` CLI is already used by skill-vet's discovery step |
| `shanraisshan/claude-code-best-practice` | MIT | Mine, don't integrate | Pattern/doc library; CLAUDE.md is already richer. Cherry-pick tips if a gap appears |
| `multica-ai/andrej-karpathy-skills` | MIT | Already integrated | Woven into CLAUDE.md 2026-07-02 ("Surgical changes (Karpathy)", `[[prefer-claude-md-over-vendored-skills]]`) |

### Repo-integration round 3 (v10.1.0, 2026-07-20) — 19-source web-dev request; 6 skills adopted, 8 woven, 3 rejected/documented

From a 19-source list the user supplied (GitHub repos + live tool sites) with "add them as skills and add them to the brain for more ways to make a website." the user chose **max skills** (vendor each genuinely-usable source even where it overlaps existing coverage) + salvage genjutsu's canvas algos + reconsider threejs-skills. 6 read-only research agents vetted first (nothing cloned/executed during vetting); then clones into `C:/tmp/claude-scratchpad/webdev-r3-quarantine/`, SHA-pinned. Skill count **47 → 53**.

#### 6 skills ADOPTED (SK-146 → SK-151)

| SK | Skill | Source @ pinned SHA | License | Lane |
|---|---|---|---|---|
| SK-146 | `css-keyframe-animations` | MADEiN83/react-animista @4946134 + Bigetion/animista-css-generator @6243845 | **BSD-2** — animista.net's own FreeBSD grant governs the keyframe DATA (the repos' ISC-no-file packaging is moot; data is what's reused, free, no attribution) | The Animista CSS keyframe catalog — CSS-first bottom rung of the motion ladder; 50+ emit-ready `@keyframes` |
| SK-147 | `svg-backgrounds` | authored + genjutsu canvas-generative @a2b8b09 | SVG recipes original (Haikei-equivalent); canvas MIT (genjutsu) | 15 Haikei-equivalent SVG background families + animated generative-canvas companion |
| SK-148 | `motion-principles` | lottiefiles/motion-design-skill @f9a8a04 | MIT | Motion-director *principles* (personality/duration/easing/emotion→motion) — planning layer above the mechanics. NOT Lottie tooling (name is a misnomer) |
| SK-149 | `gsap-plugins` | greensock/gsap-skills @aed9cfd (official) | MIT | GSAP plugin catalog beyond SK-044 (ScrollSmoother/Observer/Inertia/MotionPath/CustomEase/Physics2D/GSDevTools/Pixi) |
| SK-150 | `design-dna` | zanwei/design-dna @9d9d795 | MIT | Extract a reference UI → 3-dimension profile (tokens + style + `visual_effects` taxonomy); extract-then-build complement to design-check |
| SK-151 | `threejs-imperative` | cloudai-x/threejs-skills @b1c6230 | ⚠ **UNCONFIRMED / no LICENSE file** | Raw/imperative Three.js + GLSL reference (10 topics). Adopted at the user's explicit direction DESPITE no license — **LOCAL REFERENCE ONLY, do not redistribute** (see its NOTICE). Lane distinct from SK-007 R3F |

Per-skill `NOTICE.md` in each dir (source, SHA, license, vendored/excluded files, safety). Danger-scanned clean (only hits: AGSL `image.eval()` shader code + a Nuxt `postinstall` in an `examples/` dir — neither vendored).

#### 8 woven into the brain (no new skill)
- **motion.dev vanilla API** (`animate()`/`scroll()`/`inView()`/`stagger()` + View Transitions) → SK-047 motion-animation (same `motion` package, non-React reach).
- **`@react-spring/three`** (MIT) declarative R3F springs → capability-map §2 note (Motion stays the DOM-React default).
- **anime.js v4** (MIT, ESM) → capability-map §2 note (hyperframes adapter + smallest-footprint SVG morph/draw).
- **ibelick/motion-primitives** (MIT) → resources.md copy-in catalog + shadcn-registry command.
- **gsap.com/showcase** → resources.md study-references (technique-indexed motion inspiration feed).
- **Phosphor Icons** (6-weight) → capability-map icon routing note (via iconify or `@phosphor-icons/react`; weight variation vs Lucide's uniform stroke).
- **Realtime Colors** → impeccable `color-and-contrast.md` as a **preview/export** tool (5-role share-link for a palette impeccable already designed — NEVER a palette source; the palette-generator ban holds).
- **design-dna visual_effects taxonomy** → also feeds impeccable's signature-effects framing.

#### Auto-use wiring (the user's "automatically use it while building a website")
- **animista** → SK-146 auto-reached at the CSS-first rung of impeccable's motion ladder.
- **haikei** → SK-147 emits equivalents directly; the live app is a manual hand-tuning pointer only.
- **realtimecolors** → impeccable emits a live-preview link for every palette it designs.

#### Rejected / documented (do not re-vet)
| Source | Verdict | Reason |
|---|---|---|
| `AThevon/genjutsu` | **Reject wholesale**; salvage canvas algos → SK-147 | Near 1:1 duplicate of impeccable/gsap/threejs/motion; its `ui-ux-pro-max` = same CSV lineage as ui-ux-catalog; a competing entry point. Python/bash machinery NOT taken |
| `docs.originlab.com/originc/odk` | **Reject (out-of-scope)** | OriginLab Origin C / ODK = C/C++ automation of a Windows scientific-graphing desktop app. Zero web overlap |
| `shadcn-ui/ui` | **Document** | Live shadcn MCP already serves the registry. Its NEW official `skills/shadcn` + `skills/migrate-radix-to-base` dirs are a candidate for a future separate skill-vet (MIT) |
| `21st-dev/magic-mcp` | **Document — keep manual-only** | NL→component gen is unique, but needs an API key + browser-handoff + prompt egress + an off-by-default `--github` git-push footgun; ISC-declared, no LICENSE file. Existing re-add row + posture unchanged |
| `cloudai-x/threejs-skills` | **Reconsidered → adopted SK-151** | the user overrode the no-LICENSE hard-reject for local-only reference use |
