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

---

## Skill Quick Lookup

| Task | Skill |
|---|---|
| Animate in React | Motion (SK-047) — springs, layout, gestures, exit |
| Animate (non-React / timelines) | GSAP (SK-042/SK-044) — timelines, ScrollTrigger, SVG |
| Smooth scroll | Lenis (SK-048) — momentum scroll + GSAP integration |
| Fetch server data / cache | TanStack Query (SK-055) — caching, mutations, optimistic |
| Unit/component test | Vitest (SK-056) + Testing Library |
| Use new browser API | Web Platform APIs (SK-054) — popover, view transitions |
| Advanced JS/TS patterns | Advanced JavaScript (SK-045) — TC39, V8, TypeScript |
| Build a premium website | Vanguard (SK-083) — Render Tiers, CSS-First, streaming pipeline |
| CSS-first UI (zero-JS) | CSS-First UI Engine (SK-084) — Container Queries, :has(), @layer, Popover+Anchor |
| Streaming & cache architecture | Streaming & Cache (SK-085) — compositional cache, Activity, ViewTransition |
| AI-powered UI | AI-Native UI (SK-086) — streamText, useChat, tool→component, generative UI |
| Modern build tooling | Build Pipeline (SK-087) — Biome 2.0, Lightning CSS, Turbopack |
| Build a premium mobile app | Universal Conductor (SK-058) — routes to all native/cross-platform skills |
| Build a desktop app | Tauri Desktop (SK-088) — Rust backend, system WebView, 30+ plugins |
| Access device hardware | Hardware Bridge (SK-089) — camera, scanning, biometrics, NFC, sensors |
| Build offline-first app | Local-First (SK-090) — CRDT sync, PowerSync, TinyBase, Legend State |
| On-device AI/ML | Edge Intelligence (SK-091) — llama.rn, MediaPipe, sqlite-vec, RAG pipeline |
| Multi-platform monorepo | Monorepo (SK-092) — Turborepo for mobile + desktop + web |
| Design QA pipeline | `/critique` → `/audit` → `/polish` (SK-078/079/080) |
| Map a codebase (graph) | Codebase Knowledge Graph (SK-081) — AST + semantic → queryable graph |
| Review with blast radius | Graph-Aware Code Review (SK-082) — dependency-traced minimal file sets |
| Batch stagger reveals / text effects | Anime.js (SK-093) — lightweight modular animation, WAAPI engine |
| MPA page transitions | Barba.js (SK-094) — GSAP-orchestrated cross-page transitions |
| Design-driven 3D | Spline (SK-095) — visual 3D editor → web runtime |
| 3D with code (React) | Three.js / R3F (SK-007) — WebGL/WebGPU, Drei helpers |
| Multi-library animation | Cinematic Web Engine (SK-096) — SALA, Layer Ownership, Motion Tokens |

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
- `/flow:debug "desc"` — Scientific debugging
- `/flow:verify` — Goal-backward verification
- `/flow:complete` — Archive milestone, retro, compound
- `/flow:status` — Current position + next action
- `/flow:map` — Parallel codebase mapping

### Session
- `/done` — Wrap up, reflect, end session
- `/resume` — Restore interrupted session
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
| Go | FS-004 `[ARCHIVED]` | Error handling, goroutines, interfaces |
| Rust | FS-005 `[ARCHIVED]` | Ownership, lifetimes, error handling |
| SQL/Database | FS-027 `[ARCHIVED]` | EXPLAIN before optimizing, strategic indexes |
| API Design | FS-028 | REST principles, OpenAPI 3.1, RFC 7807 errors |

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

### Canonical Integrations (when duplicates exist)

| Capability | Canonical | Alternative |
|---|---|---|
| Figma | Figma Dev MCP | Canva MCP (only for Canva-native) |
| Firebase | Firebase Plugin | Firebase via MCP_DOCKER |
| Context7 | Standalone MCP | Via MCP_DOCKER |
| Browser | Chrome MCP (interactive) | Preview MCP (headless testing) |
| Code search | Grep/Glob (local) | GitHub `search_code` (cross-repo) |

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
| `skills/ACTIVE-DIRECTORY.md` | Active skill index (78 skills: 15 Core + 63 Available) |
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
| `standard` | All current hooks (default) | Normal development |
| `strict` | Same as standard (reserved for future differentiation) | No additional behavior yet |

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
