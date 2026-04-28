# Installed Third-Party Resources

> Manifest of third-party skill packs, CLI tools, and integrations. Originally installed 2026-02-25 from [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).
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

### deep-research/ (1 skill + 3 reference modules)
Source: https://github.com/199-biotechnologies/deep-research-claude-code
License: MIT
Skill: deep-research (SK-076) — enterprise research pipeline (8 phases, 3 modes)
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
| vercel | Official (mcp.vercel.com) | Proprietary (hosted) | Deployment management, build logs, env vars, domains | Free (all plans) |
| lighthouse | priyankark/lighthouse-mcp | MIT | Google Lighthouse audits: performance, accessibility, SEO, best practices | Free (runs locally) |
| firecrawl | firecrawl-mcp (npm) | AGPL-3.0 / MIT | Clean web content extraction for LLM consumption | Free tier (500 credits) or self-host free |
| heroui | @heroui/mcp (official) | MIT + Apache-2.0 | HeroUI component docs, props, types, theme tokens, examples | Free |
| aceternity | aceternityui-mcp | MIT | Animated landing page component registry (search, browse, install) | Free |
| iconify | iconify-mcp-server | GPL-3.0 | 200K+ icons from 200+ icon sets (Lucide, Heroicons, Phosphor, etc.) | Free |
| 21st-dev | @21st-dev/magic (official) | Proprietary | AI-generate polished components from text descriptions | Free (100 credits/mo) |

### App Development MCP Servers (added 2026-04-12)

| Server | Source | License | Purpose | Cost |
|--------|--------|---------|---------|------|
| storybook | @storybook/addon-mcp (official) | MIT | Component-level testing, story generation, a11y testing | Free |
| tauri-mcp | @hypothesi/tauri-mcp-server | MIT | Build, dev, test, scaffold Tauri v2 projects via MCP | Free |
| maestro | maestro mcp (official) | Apache-2.0 | Mobile E2E testing with auto-healing selectors | Free (Cloud paid) |
| openapi | @baryhuang/mcp-server-any-openapi | MIT | Auto-generate MCP tools from any OpenAPI/Swagger spec | Free |
| statsig | mcp.statsig.com (official, remote HTTP) | Proprietary | Feature flags, A/B experiments, metrics | Free (50M events/mo) |
| applitools | @applitools/mcp (official) | Proprietary | Visual AI regression testing on Playwright screenshots | **14-day trial only** (disabled) |

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
| claude-rules-doctor | 0.2.2 | npm | `npm install -g` |
| better-ccflare | latest | npm | `npm install -g` |
| tdd-guard | latest | npm | `npm install -g` |
| claude-squad | 1.0.14 | GitHub release | Pre-built Windows binary in ~/.local/bin/ |
| claudio | 1.11.1 | go install | `go install claudio.click/cmd/claudio@latest` |
| react-native-ai-debugger | latest | npm | `npm install -g react-native-ai-debugger --ignore-scripts` |
| maestro | 2.4.0 | get.maestro.mobile.dev | Installed in Ubuntu WSL2 (`~/.maestro/bin/maestro`) |

### WSL Distros
- **Ubuntu** (added 2026-04-12) — Installed for Maestro mobile E2E testing. Has Java 21 (OpenJDK), unzip.

## Hooks in settings.json
Active hooks: PreToolUse, PostToolUse, PostToolUseFailure, Notification, Stop, PreCompact, SessionStart
Removed 2026-04-05: UserPromptSubmit keyword-detector (0% apply rate), SubagentStop (never existed), subagent-limiter (no-op without tracker)
Re-added: UserPromptSubmit with cctools allow_git_hook.py (session-scoped git staging/commit approval toggle)
Legacy GSD hooks removed (2026-03-16)

## Living Memory subsystem (Bentley plan, 2026-04-26 onwards)

The memory system at `~/.claude/projects/C--Users-leooa--claude/memory/` is being upgraded from passive markdown + flat index into a self-maintaining cognitive substrate (full plan: `~/.claude/plans/i-want-you-to-purring-bentley.md`). Markdown remains the source of truth; everything below is derived/regenerable.

### Required runtime
| Component | Version | Install method | Purpose |
|---|---|---|---|
| Ollama | ≥0.1.45 | `winget install --id Ollama.Ollama` | Local embedding model serving |
| `embeddinggemma:300m` model | latest | `ollama pull embeddinggemma:300m` (~200 MB) | 256-dim Matryoshka embeddings |
| better-sqlite3 | ^11.7.0 | npm at `~/.claude/memory/` | SQLite driver |
| sqlite-vec | ^0.1.6 | npm at `~/.claude/memory/` | Vector index extension |
| Node.js | ≥20 | already installed | Runtime |

### Phases shipped
- **Phase 0** (2026-04-26): Reconcile audit — Statsig contradiction resolved, all 13 memories have provenance, decay.yml deprecated, KG snapshotted, MEMORY.md regenerated
- **Phase 1** (2026-04-26): Substrate — Ollama + EmbeddingGemma + SQLite at `~/.claude/memory/index.db`, indexer at `hooks/memory-indexer.js`, `/memory:rebuild` slash command, drift-check wired into `session-start.sh §7l`
- Phase 2-5: pending (write pipeline, retrieval, lifecycle, observability)

### Files
- `~/.claude/memory/index.db` — SQLite derived index (regenerable)
- `~/.claude/memory/lib/schema.sql` — schema v1
- `~/.claude/memory/package.json` + `node_modules/` — isolated deps
- `~/.claude/hooks/lib-memory.js` — shared helpers (DB, embed, hash, parse)
- `~/.claude/hooks/memory-indexer.js` — rebuild + drift-check
- `~/.claude/commands/memory-rebuild.md` — `/memory:rebuild`

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
| 21st-dev | `claude mcp add -s user -e TWENTY_FIRST_API_KEY=$env:TWENTY_FIRST_API_KEY 21st-dev -- npx -y @21st-dev/magic@latest` |
| maestro | `claude mcp add -s user maestro -- wsl -d Ubuntu -- bash -c 'export PATH="$PATH:$HOME/.maestro/bin" && maestro mcp'` |

User-scope removals (also from this wave): `linear`, `posthog` (`claude mcp remove -s user <name>`). Re-add via search of `claude mcp add` examples or registry docs.

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
| `firecrawl` | Clean markdown extraction from webpages | Research |
| `21st-dev`, `heroui`, `aceternity`, `shadcn`, `magicuidesign`, `iconify` | Component + icon registries | UI sourcing |
| `supabase`, `resend`, `sentry`, `netlify`, `vercel`, `prisma` | Backend + deployment + error tracking | Platform |

### App Dev Slash Commands
- `/new-mobile-app` — Scaffold Expo + Supabase mobile project
- `/new-desktop-app` — Scaffold Tauri desktop project
- `/api-design` — Design and generate API from spec
- `/db-schema` — Design and validate database schema

### App Dev Skills (Expo Official, 2026-04-12)
Installed from `expo/skills`: expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui, native-data-fetching, upgrading-expo, use-dom
