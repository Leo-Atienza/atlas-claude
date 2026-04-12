# Reference

> Unified quick-lookup for commands, skills, MCP patterns, and system info. Loaded on-demand.

---

## I want to...

| Goal | Use |
|---|---|
| Start a new project/feature | `/new` or `/flow:start [desc]` |
| Resume previous work | `/resume` or `/continue` |
| Do a one-off task | `/task [desc]` or just describe it |
| Fix a bug | `/flow:debug [desc]` |
| Ship code (commit + push + PR) | `/ship` or `/flow:ship` |
| End my session | `/done` |
| Consolidate memories | `/dream` |
| Plan before building | `/flow:plan` then `/flow:go` |
| Run a complex multi-agent task | `/flow:smart-swarm [desc]` |
| Review code / PR | `/code-review:code-review` or `/flow:review` |
| Check system health | `/health` |
| Learn from a mistake | `/learn` |
| Research a library/framework | Ask directly (Context7 + WebSearch auto-activate) |
| Create a new skill | `/skill-creator` |
| Schedule a recurring task | `/schedule` |
| Add an article/note to my wiki | `/wiki-ingest [source]` (SK-101) |
| Search my wiki | `/wiki-query [topic]` (SK-101) |
| Check wiki health | `/wiki-lint` (SK-101) |
| Start a new mobile app | `/new-mobile-app [name]` |
| Start a new desktop app | `/new-desktop-app [name]` |
| Design an API | `/api-design [desc]` |
| Design a database schema | `/db-schema [desc]` |
| Test a component in isolation | Storybook MCP (story generation + a11y check) |
| Build/dev/test a Tauri app | Tauri MCP + SK-088 |
| Consume a third-party REST API | OpenAPI MCP (set `OPENAPI_SPEC_URL`) |
| Manage feature flags | Statsig MCP |
| Run visual regression tests | Applitools MCP + Playwright |
| Run mobile E2E tests | Maestro MCP (Android on Win, iOS needs macOS) |
| Publish to app stores | Expo skills (EAS Submit) |
| Set up CI/CD with Claude | `claude /install-github-app` (claude-code-action) |

---

## Skill Quick Lookup

| Task | Skill |
|---|---|
| **Web Frameworks** | |
| Build a premium website | Vanguard (SK-083) — Render Tiers, CSS-First, streaming pipeline |
| Next.js best practices | Next.js Best Practices (SK-029) + Cache & PPR (SK-030) |
| Upgrade Next.js | Next.js Upgrade Guide (SK-031) |
| Advanced JS/TS patterns | Advanced JavaScript (SK-045) — TC39, V8, TypeScript |
| CSS-first UI (zero-JS) | CSS-First UI Engine (SK-084) — Container Queries, :has(), @layer |
| Streaming & cache architecture | Streaming & Cache (SK-085) — compositional cache, ViewTransition |
| AI-powered UI | AI-Native UI (SK-086) — streamText, useChat, generative UI |
| Modern build tooling | Build Pipeline (SK-087) — Biome 2.0, Lightning CSS, Turbopack |
| Use new browser API | Web Platform APIs (SK-054) — popover, view transitions, WebGPU |
| Fetch server data / cache | TanStack Query (SK-055) — caching, mutations, optimistic |
| UX design intelligence | UX Design Stack (SK-006) — 67 styles, 161 palettes, BM25 search |
| Web design review | Web Interface Guidelines (SK-034) |
| **Animation & Motion** | |
| Animate in React | Motion (SK-047) — springs, layout, gestures, exit |
| Animate (non-React / timelines) | GSAP (SK-042/SK-044) — timelines, ScrollTrigger, SVG |
| Smooth scroll | Lenis (SK-048) — momentum scroll + GSAP integration |
| Batch stagger reveals / text effects | Anime.js (SK-093) — lightweight modular animation, WAAPI |
| MPA page transitions | Barba.js (SK-094) — GSAP-orchestrated cross-page transitions |
| Multi-library animation | Cinematic Web Engine (SK-096) — SALA, Layer Ownership, Motion Tokens |
| **3D & Immersive** | |
| Design-driven 3D | Spline (SK-095) — visual 3D editor → web runtime |
| 3D with code (React) | Three.js / R3F (SK-007) — WebGL/WebGPU, Drei helpers |
| **Backend & Database** | |
| Supabase integration | Supabase Expert (FS-060) — Auth, RLS, Storage, Edge Functions |
| Stripe payments | Stripe Expert (FS-061) — Checkout, Subscriptions, Webhooks |
| SQL optimization | SQL Expert (FS-012) — strategic indexes, query planning |
| PostgreSQL admin | PostgreSQL Expert (FS-052) — optimization, extensions |
| API design | API Designer (FS-028) — REST, OpenAPI 3.1, RFC 7807 errors |
| **Testing & Quality** | |
| Unit/component test | Vitest (SK-056) + Testing Library |
| E2E browser test | Playwright (SK-009) — Chromium/Firefox/WebKit |
| AI-powered E2E test | E2E Testing (SK-027) — mobile and desktop |
| Test-first development | TDD (SK-070) — red-green-refactor loop |
| Testing strategy | Testing Strategist (FS-033) — patterns, coverage |
| Debug systematically | Debugging Expert (FS-035) — root cause analysis |
| Design QA pipeline | `/critique` → `/audit` → `/polish` (SK-078/079/080) |
| **Native & Cross-Platform** | |
| Build a premium mobile app | Universal Conductor (SK-058) — routes to all native skills |
| Build a desktop app | Tauri Desktop (SK-088) — Rust backend, 30+ plugins |
| Access device hardware | Hardware Bridge (SK-089) — camera, biometrics, NFC |
| Build offline-first app | Local-First (SK-090) — CRDT sync, PowerSync, TinyBase |
| On-device AI/ML | Edge Intelligence (SK-091) — llama.rn, MediaPipe, RAG |
| Multi-platform monorepo | Monorepo (SK-092) — Turborepo mobile + desktop + web |
| Native animations | Native Motion Engine (SK-097) — Reanimated 4, gestures |
| Native rendering | Native Visual Canvas (SK-098) — Skia, R3F native, Rive |
| Native transitions | Native Transition & Scroll (SK-099) — shared elements, FlashList |
| Native design system | Native Sensory Design (SK-100) — haptics, sound, motion tokens |
| **Workflow & Tools** | |
| Map a codebase (graph) | Codebase Knowledge Graph (SK-081) — AST → queryable graph |
| Review with blast radius | Graph-Aware Code Review (SK-082) — dependency tracing |
| Multi-agent orchestration | Smart Swarm (SK-039) — 5D complexity scoring |
| Subagent task dispatch | Subagent-Driven Dev (SK-077) — fresh subagent + review |
| Deep research pipeline | Deep Research (SK-076) — 8 phases, citation-backed |
| Bug investigation | Triage Issue (SK-071) — root cause + TDD fix plans |
| Deploy to Vercel | Deploy to Vercel (SK-028) |
| Build MCP server | MCP Server Builder (SK-011) — Python FastMCP / Node TS |
| Apply themes | Theme Factory (SK-013) — 10 presets + custom |
| Remove AI slop | Anti-Slop Writing (SK-053) — banned phrases, scoring |
| Manage wiki | wiki-manage (SK-101) — ingest/query/lint Obsidian vault |
| Consolidate memory | Dream (SK-040) — orient, merge, prune knowledge |
| Frontend design system | Frontend Design (SK-005) — production-grade interfaces |

---

## Slash Commands

### Git & Shipping
- `/commit-commands:commit` — Create a git commit
- `/commit-commands:commit-push-pr` — Commit, push, and open PR
- `/commit-commands:clean_gone` — Clean local branches deleted on remote

### Flow Workflow
- `/flow:start [desc]` — Auto-detect depth, create project
- `/flow:plan` → `/flow:go` — Plan then execute in waves
- `/flow:quick [desc]` — Minimal ceremony, plan + execute
- `/flow:auto [desc]` — Full autonomous pipeline: plan → go → review → ship
- `/flow:smart-swarm [desc]` — Multi-agent swarm with complexity scoring
- `/flow:swarm [desc]` — Swarm pipeline: plan → parallel swarm → review → ship
- `/flow:debug "desc"` — Scientific debugging
- `/flow:verify` — Goal-backward verification
- `/flow:complete` — Archive milestone, retro, compound
- `/flow:status` — Current position + next action
- `/flow:map` — Parallel codebase mapping
- `/flow:brainstorm` — Divergent idea generation
- `/flow:compound` — Extract reusable solution patterns
- `/flow:discover` — External + internal research
- `/flow:ground` — Ground plans in codebase reality
- `/flow:retro` — Retrospective on completed work
- `/flow:review` — Code review workflow
- `/flow:ship` — Ship code (commit + push + PR)
- `/flow:team` — Multi-agent team coordination
- `/flow:test` — Test execution workflow

### Session
- `/done` — Wrap up, reflect, end session
- `/resume` — Restore interrupted session
- `/handoff` — Build, test, commit, push, create handoff doc
- `/audit` — Systematic codebase audit with wave-based fixes
- `/health` — System + project integrity check
- `/claude-md-management:revise-claude-md` — Update CLAUDE.md

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
| TypeScript | FS-002 | Strict TS, proper generics, type safety |
| React/Next.js | FS-020 + FS-021 + Context7 | Server components, hooks patterns |
| SQL/PostgreSQL | FS-012 + FS-052 | EXPLAIN before optimizing, strategic indexes |
| API Design | FS-028 | REST principles, OpenAPI 3.1, RFC 7807 errors |
| Supabase | FS-060 + Context7 | Auth, RLS, Edge Functions, TypeScript types |
| Stripe | FS-061 | Checkout, Subscriptions, Webhooks |

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

### Claude Preview MCP
- `preview_start` → `preview_screenshot` — visual verification
- `preview_inspect` — CSS property verification (more accurate than screenshots)
- `preview_snapshot` — accessibility tree for text/structure
- `preview_click` / `preview_fill` — interact with running app

### Vercel MCP
- List deployments, read build logs, manage env vars, inspect domains
- **Prefer over** `vercel` CLI for reads; use CLI for `vercel deploy`
- Works on all Vercel plans including free Hobby

### Lighthouse MCP
- Run full Google Lighthouse audit on any URL (runs locally, no API key)
- Returns: Performance, Accessibility, SEO, Best Practices scores + specific recommendations
- Includes axe-core accessibility violations
- Use after deployment for quality metrics, or in design-audit (SK-078) for runtime data

### Firecrawl MCP
- Extract clean LLM-ready markdown from any webpage (strips nav, ads, scripts)
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

### Storybook MCP
- Generate stories from components, run a11y checks, visual snapshots
- Use at component level; Playwright for page/flow level

### Tauri MCP
- `tauri dev` / `tauri build` / scaffold / plugin management
- Always pair with SK-088 skill for architecture guidance

### Maestro MCP
- Write, run, and auto-heal mobile E2E test flows (YAML)
- Windows: Android via WSL2 only (iOS requires macOS)
- Complements `mobile` MCP (device interaction) with structured test authoring

### OpenAPI MCP
- Feed any OpenAPI/Swagger spec URL, get auto-generated callable tools
- Configure per API: set `OPENAPI_SPEC_URL` env var

### Statsig MCP
- Feature flags, A/B experiments, metrics (remote HTTP, no local binary)
- Free tier: 50M events/month
- Note: `~/.claude/statsig/` is Claude Code internal telemetry -- unrelated

### Applitools MCP
- AI-powered visual regression testing on Playwright screenshots
- Detects layout shifts, color changes, rendering regressions
- Complements Lighthouse (perf/a11y) and Claude Preview (manual screenshots)

### Canonical Integrations (when duplicates exist)

| Capability | Canonical | Alternative |
|---|---|---|
| Figma | Figma Dev MCP | Canva MCP (only for Canva-native) |
| Firebase | Firebase Plugin | Firebase via MCP_DOCKER |
| Context7 | Standalone MCP | Via MCP_DOCKER |
| Browser | Chrome MCP (interactive) | Preview MCP (headless testing) |
| Code search | Grep/Glob (local) | GitHub `search_code` (cross-repo) |
| Web research | Firecrawl (clean extraction) | Chrome MCP (interactive), WebFetch (raw HTTP) |
| Component generation | 21st.dev Magic (AI text-to-component) | shadcn + manual composition |
| Component docs | shadcn + HeroUI + Aceternity MCPs | Context7 (Mantine, Chakra, Ark, Base UI, etc.) |
| Performance audit | Lighthouse MCP (runtime) | SK-078 Design Audit (static code analysis) |
| Deployment mgmt | Vercel MCP (reads) | `vercel` CLI (deploys), Netlify MCP (Netlify sites) |
| Feature flags | Statsig MCP (free 50M events) | ConfigCat (10 flags free), LaunchDarkly (paid) |
| Visual regression | Applitools MCP (AI diff) | Claude Preview screenshots (manual) |
| Desktop build | Tauri MCP (execution) + SK-088 (knowledge) | Electron MCP (if Electron project) |
| Mobile E2E | Maestro MCP (auto-heal YAML) | mobile MCP + manual scripts |
| API consumption | OpenAPI MCP (auto-generate tools) | Custom MCP server per API |
| Component testing | Storybook MCP (isolation) | Playwright (page-level) |

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
| `skills/ACTIVE-DIRECTORY.md` | Active skill index (66 skills: 15 Core + 51 Available) |
| `skills/ARCHIVE-DIRECTORY.md` | Archived skill index (7 bundles) |
| `hooks/post-tool-monitor.js` | Central PostToolUse telemetry hub |
| `hooks/context-guard.js` | PreToolUse context + security enforcer |
| `hooks/context-thresholds.json` | Shared threshold config (single source of truth) |

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
