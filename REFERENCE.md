# Reference

> Unified quick-lookup for commands, skills, MCP patterns, and system info. Loaded on-demand.

---

## I want to...

| Goal | Use |
|---|---|
| Start a new project/feature | `/new` |
| Resume previous work | `/resume` or `/continue` |
| Do a one-off task | `/task [desc]` or just describe it |
| Fix a bug | Describe it — observe → hypothesize → verify → fix (CLAUDE.md Debugging rule) |
| Ship code (commit + push + PR) | `/ship` |
| End my session | `/done` |
| Plan before building | Plan mode for interactive approval, or a plan file in `plans/` for multi-phase work |
| Run a complex multi-agent task | Workflow tool (say "use a workflow") or the CLAUDE.md council — the two orchestration lanes |
| Review code / PR | `/code-review:code-review` (add "ultra" for the cloud multi-agent review) |
| Check system health | `/health` |
| Learn from a mistake | `/remember` (routes error entries to the vault per `config/routing-rules.yml`) |
| Research a library/framework | Ask directly (Context7 + WebSearch auto-activate) |
| Create a new skill | `/skill-creator` |
| Schedule a recurring task | `/schedule` |
| Add an article/paper/URL to my wiki | `/wiki-ingest <url-or-path>` |
| **Ask my whole brain something** | `/recall <query>` — the single lookup front door: fused retrieval across vault + atlas-kg + graphify + catalog + session working set (v8.5). Comes up thin? `/deep-recall <query>` — full-vault semantic tier incl. session-log/transcripts. Interactive wiki synthesis: wiki-manage QUERY mode |
| Wiki health check | `/wiki-lint` |
| Convert a PowerPoint to PDF | `/pptx-to-pdf <file>` |
| Start a new mobile app | `/new-mobile-app [name]` |
| Start a new desktop app | `/new-desktop-app [name]` |
| Join / compete in a hackathon | Archived (seasonal) — restore `skills/_archived/hackathon/` (auto-offered on `.hackathon/` repos; see ARCHIVE-DIRECTORY §v10) |
| Design an API | `/api-design [desc]` |
| Design a database schema | `/db-schema [desc]` |
| Build/dev/test a Tauri app | Tauri MCP (archived SK-088 bundle restores on demand) |
| Manage feature flags | Statsig MCP (needs `console-` API key — see `.mcp.json` `_activate`) |
| Run mobile E2E tests | Maestro MCP (WSL + Maestro install — see `.mcp.json` `_activate`) |
| Use shadcn/heroui/aceternity/magicui/iconify UI MCP | Auto-provisioned per-project into `.mcp.json` by `scripts/ensure-frontend-mcp.js` (SessionStart, frontend-detected) — demoted from global 2026-05-28 (jazzy-wren) to cut picker bloat; bundle in `templates/frontend-mcp.json`. Re-globalize one: `claude mcp add -s user <name> -- npx …` |
| Publish to app stores | Expo skills (EAS Submit) |
| Set up CI/CD with Claude | `claude /install-github-app` (claude-code-action) |

---

## Skill Quick Lookup

> Routes only to **active** skills (canonical list: `skills/ACTIVE-DIRECTORY.md`). Archived skills (Vanguard, UX Design Stack, the native-mobile and animation bundles, …) still auto-activate via `skills/archived-skills-manifest.json` detection patterns, or restore with `mv skills/_archived/<name>/ skills/<name>/` — browse `skills/ARCHIVE-DIRECTORY.md`. (Stale routes to ~30 archived skills purged 2026-06-09.)

| Task | Skill |
|---|---|
| **Web Frameworks** | |
| Build a premium website / any web UI | Impeccable (SK-102) — craft/teach flow; loads Frontend Design (SK-005) as its principles library |
| Next.js best practices | Next.js Best Practices (SK-029) + Cache & PPR (SK-030) |
| Upgrade Next.js | Next.js Upgrade Guide (SK-031) |
| Strict TypeScript / generics | TypeScript Expert (SK-116) |
| Tailwind v4 setup | Tailwind v4 Web Setup (SK-040) |
| Web design review | Web Interface Guidelines (SK-034) |
| AI-powered UI / LLM apps | Vercel AI SDK 7 (SK-129) — generateText/Object, Agent + tools (durable WorkflowAgent), useChat |
| **Animation & 3D** | |
| Animate (timelines, scroll) | GSAP (SK-042) — timelines, ScrollTrigger, SVG |
| 3D with code (React) | Three.js / R3F (SK-007) — SSR-safe install, Drei helpers |
| **Backend & Database** | |
| Database + ORM (Postgres) | Drizzle + Neon (SK-130) + Neon MCP |
| Auth | Better Auth (SK-131) — email/OAuth/2FA/passkeys, edge-native |
| SQL optimization | SQL Expert (SK-117) — strategic indexes, query planning |
| PostgreSQL admin | PostgreSQL Expert (SK-123) — optimization, extensions |
| API design | API Designer (SK-120) — REST, OpenAPI 3.1, RFC 7807 errors |
| Supabase / Stripe integration | Context7 docs (no dedicated active skill; archived experts restorable from ARCHIVE-DIRECTORY) |
| **Testing & Quality** | |
| Unit/component test | Vitest (SK-056) + Testing Library |
| E2E browser test | playwright-cli (anthropic-skills symlink) |
| AI-powered E2E test | `mobile` MCP for device flows (e2e-testing skill archived — ARCHIVE-DIRECTORY §v10) |
| Test-first development | `skills/RULES-TESTING.md` (tdd skill archived — restore on demand) |
| Debug systematically | CLAUDE.md Debugging rule: observe → hypothesize → verify → fix |
| Design QA pipeline | `design-polish` (SK-080) for final-pass craft work; wave-based audits follow CLAUDE.md Wave-Based Fixes (audit skill archived) |
| Pre-flight UI diff vs design reference | Design Check (SK-127) — MANDATORY before UI work against Stitch/Figma/screenshot |
| Verify before claiming "done" | Ship Verify (SK-128) — MANDATORY for build/deploy/ship claims |
| **Native & Cross-Platform** | |
| Mobile screen design / review | Mobile App Design (SK-126) — HIG, Material 3, RN translation pitfalls |
| Build/dev/test a Tauri app | Tauri MCP (archived Tauri Desktop bundle SK-088 restores on demand) |
| Expo / React Native | expo-* + react-native symlinked skills (see `skills/SYMLINKS.md`) |
| **Workflow & Tools** | |
| Compete in a hackathon | Archived (seasonal) — `skills/_archived/hackathon/`, auto-offered on `.hackathon/` repos |
| Map a codebase (graph) | Graphify (SK-109) for mixed corpora; CRG MCP for code (`.code-review-graph/graph.db`) |
| Multi-agent orchestration | Two lanes (CLAUDE.md): Workflow tool for deterministic fan-out; council (subagents/agent-teams) for high-stakes calls |
| Deep research pipeline | deep-research skill — built-in fan-out + adversarial-verify harness |
| Deploy to Vercel | Deploy to Vercel (SK-028) |
| Build MCP server | `anthropic-skills:mcp-builder` (ecosystem symlink; local link archived) |
| Apply themes | theme-factory (anthropic-skills symlink) — 10 presets + custom |
| Manage wiki | wiki-manage (SK-101) — ingest/query/lint Obsidian vault |
| PowerPoint → PDF | PPTX → PDF (SK-132) — `/pptx-to-pdf`, COM/LibreOffice render |

---

## Slash Commands

### Git & Shipping
- `/commit-commands:commit` — Create a git commit
- `/commit-commands:commit-push-pr` — Commit, push, and open PR
- `/commit-commands:clean_gone` — Clean local branches deleted on remote

### Session
- `/done` — Wrap up, reflect, end session
- `/resume` — Restore interrupted session
- `/continue` — Resume from a handoff file (manual)
- `/compact` — Prepare session state for context compaction
- `/handoff` — Build, test, commit, push, create handoff doc
- `/health` — System + project integrity check
- `/observe` — 7-section ATLAS dashboard (tool health, safety, skill usage, schedules, action graph, cleanup, delegation)
- `/system-doctor` — Unified validator scoreboard (runs every validator in the `scripts/lib/validators.js` manifest)
- `/system [list|show <name>|detect|deactivate|<name>]` — Capability Systems: list/inspect/detect/deactivate domain bundles (see `systems/REGISTRY.md`)
- `/system:activate <name>` — Activate a Capability System for this folder (marker + digest + knowledge view; persists across sessions here, sliding 14d TTL)
- `/system:new <name>` — Scaffold a new Capability System overlay manifest (the extensibility recipe)
- `/apply-drift-fix` — Read latest drift proposal and route to action
- `/review-proposals` — Review the sous-chef's proposal queue (`proposals/`), the ONLY self-modification path — approve/reject/defer each (A4, v9)
- `/verified-deploy` — Deploy with auto production verification
- `/skill-review` — Review skill improvement candidates
- `/claude-md-management:revise-claude-md` — Update CLAUDE.md

### Memory & Knowledge (one read door, one write door — v10 U3)
- `/recall [query]` — **the** lookup front door: unified retrieval across ALL knowledge layers (vault, atlas-kg, graphify, hot/index catalog, session working set) with deterministic rank fusion + Ollama semantic layer; `--json`, `--no-semantic` flags (v8.5)
- `/deep-recall [query]` — deep tier: semantic search over the ENTIRE vault incl. session-log/handoffs/transcripts (the tier /recall deliberately skips); use when /recall comes up thin
- `/remember [fact]` — **the** capture door: routes a fact/error/preference to the right vault location per `config/routing-rules.yml` (error entries follow `scripts/progressive-learning/KNOWLEDGE-WRITE.md`)
- `/reflect` — Capture session knowledge into `wiki/engineering/*` + `wiki/personal/*`
- `/analyze-mistakes` — Audit recent failures and error patterns from `wiki/engineering/errors.md`

> Retired in v8.0.0 (2026-05-14, brain consolidation): "dream", "memory-rebuild", "memory-promote-to-wiki" (files at `~/.claude/_retired_commands/`). Retired in v10 (2026-07-20, → `skills/_archived/retired-commands/`): init-memory (targeted the retired memory dir), learn (→ /remember), memory-search + wiki-query (→ /recall), memory-review (→ /reflect + /review-proposals), memory-health (→ /wiki-lint), parallel-audit (audit skill archived).

### App-dev shortcuts
- `/new` — Start something new (auto-routes by intent)
- `/new-web` — New web project
- `/new-mobile-app` — Scaffold Expo + Supabase mobile project
- `/new-desktop-app` — Scaffold Tauri desktop project

### Archived workflow families (v10, 2026-07-20)
The `flow:*` (19 commands) and `hackathon:*` (10 commands) families are archived as bundles under `skills/_archived/{flow,hackathon}/commands/` — zero / 1 use across all sessions. The manifest hook auto-offers a restore when a repo contains `.flow/state.yaml` or `.hackathon/`; manual restore recipes in `ARCHIVE-DIRECTORY.md` §v10.

### Locally-authored namespaced commands

These are local command files at `commands/<namespace>/...` using `:`-separated namespaces (NOT shipped by any enabled plugin — none of `cctools`/`infra-showcase` appear in `settings.json#enabledPlugins` or the plugin registry). They are real and dispatchable; the namespace is organizational only.

- `/cctools/aichat:recover-context` — Strategically explore the most recent parent session from the session lineage to reconstruct the last task's context (uses `session-searcher` sub-agent or `aichat:session-search` skill).
- `/cctools/voice:speak` — Enable, disable, or configure voice (TTS) feedback during sessions.
- `/infra-showcase:dev-docs` — Create a comprehensive strategic plan with structured task breakdown for infra showcase work.
- `/infra-showcase:dev-docs-update` — Update dev documentation before context compaction.
- `/infra-showcase:route-research-for-testing` — Map edited routes and launch tests for the touched paths.

---

## Security Skill Triggers

| Trigger | Skill | Action |
|---|---|---|
| Reviewing any PR/diff | `differential-review` | Risk classification, attack scenarios, blast radius |
| Before marking feature complete | `sharp-edges` | API footguns, dangerous defaults, fail-open patterns |
| Auditing secrets/config | `insecure-defaults` | Hardcoded secrets, weak defaults, fail-open detection |
| Found a vulnerability | `variant-analysis` | Search for similar bugs (ripgrep → Semgrep → CodeQL) |
| Writing auth/crypto code | `insecure-defaults` + `sharp-edges` | Both skills, layered |

---

## DevOps Generator + Validator Pairs

Every generator has a validator. Always run both.

| Generator | Validator | Key Output |
|---|---|---|
| terraform-generator | terraform-validator | Multi-file TF project + Checkov scan |
| dockerfile-generator | dockerfile-validator | Multi-stage Dockerfile + Hadolint |
| github-actions-generator | github-actions-validator | Workflow with pinned SHAs + minimal permissions |
| k8s-yaml-generator | k8s-yaml-validator | Manifests with labels, limits, probes |
| helm-generator | helm-validator | Chart with values, templates |
| bash-script-generator | bash-script-validator | Script with strict mode, logging, traps |
| ansible-generator | ansible-validator | Playbooks with roles |
| makefile-generator | makefile-validator | Makefile with standard targets |

---

## Language/Framework Skill Routing

| Language/Framework | Skill ID | Key Enforcements |
|---|---|---|
| TypeScript | SK-116 | Strict TS, proper generics, type safety |
| React/Next.js | SK-029 + SK-030 + vercel-react-best-practices + Context7 | Server components, hooks patterns |
| SQL/PostgreSQL | SK-117 + SK-123 | EXPLAIN before optimizing, strategic indexes |
| API Design | SK-120 | REST principles, OpenAPI 3.1, RFC 7807 errors |
| Supabase | Context7 (`resolve-library-id` → `get-library-docs`) | Auth, RLS, Edge Functions, TypeScript types (archived Supabase Expert restorable) |
| Stripe | Context7 | Checkout, Subscriptions, Webhooks (archived Stripe Expert restorable) |

---

## Reflexion Auto-Refine Triggers

- Cyclomatic complexity > 10
- Nested depth > 3 levels
- Function length > 50 lines
- Duplicate code blocks
- No error handling / no input validation

---

## MCP Server Patterns

### GitHub MCP
- `issue_read` / `list_issues` — issues with comments, labels
- `pull_request_read` — PR details, diffs, review comments
- `search_code` — find patterns across all GitHub repos
- **Prefer over** `gh` CLI for reads; use `gh` for complex local git workflows

### Context7 MCP
- `resolve-library-id` → `get-library-docs` — ALWAYS check before framework advice
- Use `topic` parameter to focus; set `tokens` 20000+ for comprehensive coverage

### Neon MCP (PostgreSQL)
- `prepare_database_migration` → `complete_database_migration` — safe migration with temp branch
- `describe_table_schema` — schema exploration

### Claude Browser MCP (`mcp__Claude_Browser__*`)
_Renamed 2026-07 from `Claude_Preview`; `preview_start`/`preview_logs`/`preview_stop` survive, the read/interact verbs were renamed._
- `preview_start` → `computer` (`action:"screenshot"`) — visual verification
- `javascript_tool` — evaluate JS / read computed CSS (more accurate than screenshots; was `preview_eval`/`preview_inspect`)
- `read_page` — accessibility tree for text/structure (was `preview_snapshot`)
- `computer` (`left_click`) / `form_input` — interact with running app (was `preview_click`/`preview_fill`)
- `read_console_messages` / `read_network_requests` — console + network reads (was `preview_console_logs`/`preview_network`)

### Vercel MCP
- List deployments, read build logs, manage env vars, inspect domains
- **Prefer over** `vercel` CLI for reads; use CLI for `vercel deploy`
- Works on all Vercel plans including free Hobby

### Lighthouse MCP
- Run full Google Lighthouse audit on any URL (runs locally, no API key)
- Returns: Performance, Accessibility, SEO, Best Practices scores + specific recommendations
- Includes axe-core accessibility violations
- Use after deployment for quality metrics, or in the design QA pipeline (`/audit` SK-111 + design-polish SK-080) for runtime data

### Firecrawl MCP
- Extract clean LLM-ready markdown from any webpage (strips nav, ads, scripts)
- **Second choice since v8.20.0**: crawl4ai `crwl` covers scrape/crawl free with no credit ceiling — `"$HOME/AppData/Roaming/Python/Python313/Scripts/crwl.exe" <url> -o markdown`; reach for Firecrawl when crawl4ai is unavailable or for `firecrawl_search` (no local equivalent)
- **Prefer over** Chrome MCP `get_page_text` for research/content extraction
- **Prefer** Chrome MCP for interactive page testing
- Free tier: 500 credits; self-hostable for unlimited free usage

### UI Component MCPs
- **21st.dev Magic**: AI-generate polished components from text descriptions (100 free credits/mo)
- **HeroUI**: Official component docs, props, theme tokens, source code (free, formerly NextUI)
- **Aceternity UI**: Animated landing page components — search, browse, install info (free)
- **Iconify**: 200K+ icons from 200+ icon sets — one-stop icon search (free)
- **shadcn**: Copy-paste primitive components (existing)
- **MagicUI**: Animated component search/browse (existing)

### Tauri MCP
- `tauri dev` / `tauri build` / scaffold / plugin management
- Always pair with SK-088 skill for architecture guidance

### Maestro MCP
- Write, run, and auto-heal mobile E2E test flows (YAML)
- Windows: Android via WSL2 only (iOS requires macOS)
- Complements `mobile` MCP (device interaction) with structured test authoring

### Statsig MCP
- Feature flags, A/B experiments, metrics (remote HTTP, no local binary)
- Free tier: 50M events/month
- Note: `~/.claude/statsig/` is Claude Code internal telemetry -- unrelated

### Canonical Integrations (when duplicates exist)

| Capability | Canonical | Alternative |
|---|---|---|
| Figma | Figma Dev MCP | Canva MCP (only for Canva-native) |
| Firebase | Firebase Plugin | Firebase via MCP_DOCKER |
| Context7 | Standalone MCP | Via MCP_DOCKER |
| Browser | Chrome MCP (interactive) | Preview MCP (headless testing) |
| Code search | Grep/Glob (local) | GitHub `search_code` (cross-repo) |
| Web research | crawl4ai `crwl` CLI (free local extraction, no credit ceiling — v8.20.0) | Firecrawl MCP (500 credits; unique: `firecrawl_search`), Chrome MCP (interactive), WebFetch (raw HTTP) |
| Component generation | 21st.dev Magic (AI text-to-component) | shadcn + manual composition |
| Component docs | shadcn + HeroUI + Aceternity MCPs | Context7 (Mantine, Chakra, Ark, Base UI, etc.) |
| Performance audit | Lighthouse MCP (runtime) | `/audit` (SK-111) static review |
| Deployment mgmt | Vercel MCP (reads) | `vercel` CLI (deploys), Netlify MCP (Netlify sites) |
| Feature flags | Statsig MCP (free 50M events) | ConfigCat (10 flags free), LaunchDarkly (paid) |
| Visual regression | Claude Browser screenshots (manual) | Lighthouse visual-diff snapshots |
| Desktop build | Tauri MCP (execution) + SK-088 (knowledge) | Electron MCP (if Electron project) |
| Mobile E2E | Maestro MCP (auto-heal YAML) | mobile MCP + manual scripts |

### P2 — Evaluate When Needed

| Resource | Install command | When |
|----------|----------------|------|
| Apollo MCP (GraphQL) | `claude mcp add apollo-graphql -- npx -y @apollo/mcp-server` | GraphQL project |
| k6 MCP (load testing) | `winget install k6` + configure per k6 docs | Pre-production launch |
| Google Play Store MCP | See `github.com/devexpert-io/play-store-mcp` | Android app ready for store |
| App Store Connect MCP | See `github.com/yuraist/appstoreconnect-mcp` | iOS app ready ($99/yr Apple Dev) |
| Electron MCP | See `github.com/kanishka-namdeo/electron-mcp` | Electron project (not Tauri) |
| Dart & Flutter MCP | `dart pub global activate dart_mcp_server` | Flutter project |
| Auth0 MCP | See official Auth0 MCP docs | Enterprise SSO (Supabase Auth insufficient) |
| Grafana MCP | `claude mcp add grafana -- npx -y @leval/mcp-grafana` | Infra metrics to monitor |
| Amplitude MCP | `claude mcp add -t http Amplitude "https://mcp.amplitude.com/mcp"` | PostHog insufficient |

---

## Built-In Skills (File Triggers)

| Trigger | Skill | What It Does |
|---|---|---|
| `.docx` files | `docx` | Create, read, edit Word docs |
| `.pdf` files | `pdf` | Read, merge, split, OCR, fill forms |
| `.pptx` files | `pptx` | Create, edit slide decks |
| `.xlsx`/`.csv` files | `xlsx` | Open, edit, create spreadsheets |
| "build a website" | `frontend-design` | Production-grade frontend |
| "test the web app" | `playwright` | Browser automation, UI verification |
| "build an MCP server" | `mcp-builder` | MCP servers in Python or Node |
| "create a skill" | `skill-creator` | Claude Code skill creation |

---

## Key Files

| File | What it does |
|---|---|
| `CLAUDE.md` | Master instructions (self-contained) |
| `settings.json` | Hooks, permissions, env vars |
| `skills/ACTIVE-DIRECTORY.md` | Active skill index (53 skills: tier split lives in the directory header) |
| `skills/ARCHIVE-DIRECTORY.md` | Archived skill index (7 bundles) |
| `hooks/post-tool-monitor.js` | Central PostToolUse telemetry hub |
| `hooks/context-guard.js` | PreToolUse context + security enforcer |
| `hooks/context-thresholds.json` | Shared threshold config (single source of truth) |
| `hooks/lib/{slug,session,git,ollama}.js` | v8.5 shared libs — canonical slugs/matching keys, session-state readers, git snapshot, ONE Ollama wrapper + system-wide circuit breaker (`cache/ollama-breaker.json`) |
| `scripts/recall.js` + `scripts/recall-embed-index.js` | `/recall` engine + its semantic index builder (refreshed weekly by weekly-graph-sync) |
| `systems/` + `systems/registry.json` | Capability Systems overlay manifests + derived machine index (v8.6) |
| `scripts/{validate-systems,systems-registry,knowledge-view}.js` + `scripts/lib/system-manifest.js` | Systems validator · registry regen · per-domain knowledge views · shared manifest parser (v8.6) |
| `hooks/system-detect.js` | SessionStart Capability-System proposer (`SYSTEM:` advisory, bounded scoring, 24h throttle) (v8.6) |
| `scripts/prune-dead-scheduled-tasks.js` | Manual maintenance CLI — the **only** way to delete dead scheduler entries (the `scheduled-tasks` MCP exposes no delete). Dry-run by default; `--apply` rewrites scheduler state after backing it up to `cache/`. Run `--apply` with the Claude desktop app CLOSED (the app overwrites scheduler state on its next write). Fail-closed. |

## External Token Optimization Tools

Complementary tools that reduce token burn at the transport layer (ATLAS reduces it at the architecture layer):

| Tool | What it does | Reduction | Install |
|------|-------------|-----------|---------|
| **Headroom** | Localhost proxy compressing context between client and API | ~34% | `github.com/chopratejas/headroom` |
| **RTK** | Rust CLI proxy compressing shell output (git, npm, build logs) | 60-90% | `github.com/rtk-ai/rtk` |

These stack with ATLAS: Headroom compresses API traffic, RTK compresses CLI output, ATLAS prevents unnecessary reads. All three together maximize weekly token budget.

## Hook Profiles

Control hook overhead via `ATLAS_HOOK_PROFILE` env var in settings.json:

| Profile | Hooks Active | Use When |
|---------|-------------|----------|
| `minimal` | context-guard only | Trivial tasks, quick edits |
| `medium` | All except tsc-check | Non-TypeScript work, faster feedback loop |
| `standard` | All current hooks (default) | Normal development |

Disable individual hooks: `ATLAS_DISABLED_HOOKS="post-tool-monitor,claudio"`

---

## Context Budget Cascade

Source of truth: `hooks/context-thresholds.json`

| Stage | Used % | Remaining % | What happens |
|-------|--------|-------------|-------------|
| Warning | 60% | 40% | Wrap up current task |
| Auto-continuation | 70% | 30% | Handoff file written for new session |
| Guard block | 78% | 22% | Agent, Bash, Write, Edit blocked |
| Critical | 85% | 15% | Stop immediately, save state |
