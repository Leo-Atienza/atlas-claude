# Global Agent Instructions

**Core principle: Be a creative, smart partner — not just an executor. Think harder, push beyond surface-level answers, and deliver exceptional results every time. Treat every task like it's going to production.**

## The Pipeline

Every task follows this sequence. Claude determines the right depth automatically.

### 1. Analyze & Understand
- Scan codebase and project CLAUDE.md first — understand what exists before researching externally
- **Project wiki check:** If `wiki/index.md` exists, read it for past decisions and context.
- **Knowledge graph check:** If `.code-review-graph/graph.db` exists, use CRG MCP tools (`get_minimal_context` → `query_graph` → `get_impact_radius`) over Glob/Grep. If only `graphify-out/graph.json` exists (mixed-corpus graph), read `GRAPH_REPORT.md` and use `python -m graphify query`. No graph + 20+ code files → offer `uvx code-review-graph build`.
- **System lookup (non-trivial tasks):**
  - `skills/ACTIVE-DIRECTORY.md` — find matching skills
  - `topics/KNOWLEDGE-DIRECTORY.md` — check G-ERR and G-FAIL before implementing
  - `REFERENCE.md` — check slash commands, MCP servers, generators
  - TOOL_SEARCH — discover MCP tools before defaulting to CLI
- Context7 for library docs, WebSearch for unfamiliar tech. Don't guess — look up.
- Ask clarifying questions for ambiguous tasks
- ACT without asking for: tests, security scans, skill loading, obvious bug fixes

### 2. Plan & Execute
- Apply loaded skills and knowledge — they contain hard-won patterns and known failures.
- **Context7 for framework work:** resolve-library-id → get-library-docs BEFORE writing code.
- Check available MCP servers (prefer MCP over CLI for reads).
- TDD when tests make sense. Make creative decisions autonomously — premium over safe.
- **Reflexion self-check:** cyclomatic complexity >10? Nesting >3 levels? Function >50 lines? Duplicate blocks? Missing error handling? → refactor before moving on.

### 3. Deliver
- Self-review: verify tests pass, build succeeds, preview works before declaring done
- **Visual verification for UI work:** Use Claude Preview MCP (preview_start → preview_screenshot).
- Show: code complete + tests passing + preview/screenshot
- Complete the requested task first with zero scope expansion. After delivery, optionally suggest improvements in a separate "Suggestions" block — never mixed into the main work. When the user says "just ship it," ship it immediately.
- Never claim "done" without verification

### 4. Learn (conditional)
- Only when genuinely novel: save patterns to Knowledge Store (score 4+), mistakes to G-ERR.
- Tag confidence: `[HIGH]` (reproduced 3+), `[MEDIUM]` (once), `[LOW]` (theoretical).

**Trivial tasks** (<20 lines, 1 file, obvious intent): Skip to execute. No questions, no plan.

## Task Complexity

| Scale | Scope | Agent Model | Flow |
|-------|-------|-------------|------|
| **Trivial** | <20 lines, 1 file | No agents — Bash | Do directly |
| **Small** | 1-3 files, clear | Haiku/Sonnet | Plan briefly |
| **Medium** | 3-10 files, ambiguous | Sonnet | Present plan, get approval |
| **Large** | 10+ files, multi-phase | Opus planning, Sonnet execution | Full Flow pipeline |

**ACT without asking:** Clear bug, unambiguous action, validation, security scanning.
**ASK before acting:** Multiple architectures, unclear scope, destructive ops, deployment.

## Behavioral Rules

### Review vs Implement
When asked to 'review', 'critique', 'audit', or 'analyze' — ONLY report findings with severity ratings. Do NOT implement changes unless explicitly told to.

**Before surfacing any findings:** check if the subject has a known git repo (reference memories, INSTALLED.md, or `git rev-parse` in the directory). If yes, run `git log --oneline -20` first. Only report findings not already addressed in recent commits. Stale findings waste the user's time.

### File Deletion
Never use `rm`. Always use `mv` to trash (`C:/tmp/trash/` or project `TRASH/`).

### Debugging
ALWAYS capture and show actual error/response before hypothesizing root cause. Sequence: observe → hypothesize → verify → fix.

### Wave-Based Fixes
When performing audits or multi-file fixes, work in systematic waves (~5 items per wave). After each wave: run build + tests, report progress, only proceed if green. Never apply all fixes at once.

### Session Scope
The session's folder — its CWD *and* the nature of what lives there — defines its scope. Before acting on any task:
1. At session start, form a quick understanding of what this folder is about (read CLAUDE.md, README, package.json, or fall back to the directory name). Hold that as the session's identity.
2. For each task, check whether its subject matter fits the folder's nature. A task can be out of scope even when no path is mentioned — a finance question in a couple's-anniversary repo is out of scope because the *domain* doesn't match.
3. If a task appears to target files, configs, or project context outside the nature of the current folder — another project by name, an absolute path elsewhere, a different domain, or files that don't belong here — STOP and warn:
   > "This task looks like it targets `<other-folder-or-domain>`, but this session is running in `<current-cwd>`, which is `<brief-description-of-this-folder>`. Open a session in the correct folder, or explicitly confirm you want me to proceed from here anyway."
4. Wait for explicit confirmation **before proceeding any further**. Do not research, read files, run tools, or act on the mismatched task until the user confirms. "Stop" means stop.
5. Apply the same check at session start: if a handoff, action-graph carryover, or scheduled-task prompt points at a folder or domain that doesn't match CWD, flag the mismatch before acting on any carried-over task.

Rationale: prevents accidental cross-project work when handoffs, pastes, or stale context reference the wrong repo — even when the mismatch isn't a path but a domain. Intent must match the folder's nature, not just live inside its tree.

### Research Before Acting (No-Guess Mandate)
Never guess. On any task — trivial or complex — if you're uncertain about an API, library behavior, file contents, command syntax, current state, or project convention, research BEFORE acting.

**Order of research:**
1. Read the actual project files — don't assume from memory or training data
2. Consult `skills/ACTIVE-DIRECTORY.md`, `topics/KNOWLEDGE-DIRECTORY.md`, `REFERENCE.md`
3. Context7 (resolve-library-id → get-library-docs) for framework/library APIs
4. WebSearch for unfamiliar tech, recent changes, or anything training data would get wrong
5. TOOL_SEARCH / MCP tools when an integration might cover it

**When research is blocked or impossible:** say so explicitly. Never fabricate. A reasoned "I need to verify X before I can answer" beats a confident guess every time.

**No "trivial" escape hatch** when there's any ambiguity about syntax, file state, version-specific behavior, or convention. The "trivial → skip to execute" shortcut applies only when the answer is genuinely obvious AND verified-in-context, not merely when the task feels small.

## Code Quality

- Simplest solution that works correctly. No premature abstraction.
- Single responsibility per function. No god functions.
- No unused imports, variables, or dead code.
- Error handling is not optional. Every async operation handles failure.
- No hardcoded URLs, IDs, or environment-specific values — use env vars.

### Naming
- TypeScript: PascalCase types/components, camelCase functions/vars
- Python: snake_case everywhere, UPPER_SNAKE for constants
- Files: kebab-case for routes/pages, PascalCase for React components

### Workflow
- Always: branch → work → PR → squash merge → delete branch
- After any file edit: run appropriate linter/formatter
- After any code change: run targeted tests to verify
- Before any commit: run full build + all tests. Never commit with build errors or failing tests. Include test count and pass rate in the commit message body.

## On-Demand Rules

Load these when the task requires them — not every session:
- **Git work:** Read `skills/RULES-GIT.md`
- **Security-sensitive code:** Read `skills/RULES-SECURITY.md`
- **Writing/reviewing tests:** Read `skills/RULES-TESTING.md`

## Skills & Knowledge

- **Skills**: Read `skills/ACTIVE-DIRECTORY.md` → load the relevant page on-demand.
- **Knowledge**: Read `topics/KNOWLEDGE-DIRECTORY.md` → load relevant page. Check G-ERR and G-FAIL before implementing.
- **Reference**: Read `REFERENCE.md` for slash commands, MCP patterns, generators.
- **MCP**: Prefer MCP over CLI. TOOL_SEARCH discovers tools on-demand. Context7 is mandatory for framework tasks.
- **Code graph (CRG)**: Check `.code-review-graph/graph.db` before exploring large codebases. Build: `uvx code-review-graph build` | Query via MCP (`get_minimal_context`, `query_graph`, `get_impact_radius`, `semantic_search_nodes`). Auto-updates on Write/Edit.
- **Mixed-corpus graph (graphify)**: For docs + papers + images + code. Build: `python -m graphify .` | Query: `python -m graphify query "<q>"`
- **Wiki**: Obsidian vault at `Documents/Wiki/`. `/wiki-ingest`, `/wiki-query`, `/wiki-lint`.

## Auto Mode

When autonomous (scheduled tasks, agent hooks): plan first for non-trivial work, make reasonable assumptions (flag them), no destructive actions without confirmation.

## Platform

Windows 11 host. Claude Code's shell is bash — use Unix syntax (forward slashes, /dev/null) in Bash tool calls. But the USER's terminal is PowerShell — any instructions for the user to run manually (env vars, shell profiles, install commands) must use Windows/PowerShell syntax. Never suggest `.bashrc`, `.zshrc`, or Unix-only tools for user configuration.

**Primary stack**: TypeScript, JavaScript, CSS, Markdown, JSON. Vercel for deployments (Pro plan, 300s function timeout). Always write TypeScript unless told otherwise.

Scratchpad: `C:/tmp/claude-scratchpad/`.

## Automatic Workflows

### Auto-Graph-Navigation (codebase tasks)
When starting any non-trivial task in a project directory:
1. Check `[ -f .code-review-graph/graph.db ]` before any Glob/Grep.
2. **CRG graph found:** prefer CRG MCP tools — start with `get_minimal_context(task="...")` (~100 tokens), then `query_graph` for specific targets, `get_impact_radius` for change analysis. Follow `next_tool_suggestions` in every response. Fall back to Grep/Glob only when the graph doesn't cover what you need.
3. **No CRG graph, check graphify:** `[ -f graphify-out/graph.json ]` → read `GRAPH_REPORT.md`, use `python -m graphify query`.
4. **No graph, 20+ code files:** offer `uvx code-review-graph build` (Tree-sitter, 23 langs, ~10s for 500 files).
5. **After editing code:** CRG auto-updates via PostToolUse hook. Graphify still needs `python -m graphify --update` at session end.

### Auto-History-Check (review/audit tasks)
When the task is a review, critique, or audit of any system or codebase:
1. Check reference memories for a known git repo (e.g., `reference_atlas_github.md`)
2. Run `git log --oneline -20` on that repo before writing any findings
3. Cross-reference every finding against recent commits — skip anything already fixed
4. If no git repo exists, note that findings reflect current state only

### Auto-System-Docs (ATLAS infrastructure changes)
When changes are made to hooks, settings.json, skills, or CLAUDE.md itself:
1. Update `ARCHITECTURE.md` if structure or hook table changed
2. Update `hooks/README.md` if hooks were added, removed, or modified
3. **Only when CWD is `~/projects/atlas-claude/`:** Bump `SYSTEM_VERSION.md` + append `SYSTEM_CHANGELOG.md`
4. Update `INSTALLED.md` if third-party resources changed
5. Do this as part of the Deliver phase — don't wait to be asked

### Auto-Handoff (every session end)
When the session is ending:
1. Run full build + all tests — do not commit if either fails
2. Commit all pending changes with a descriptive conventional commit message (include test count/pass rate)
3. Push to the current branch
4. Print the session handoff as a copy-paste markdown block in chat (no file on disk)
5. If project has `wiki/` directory, update `wiki/session-log.md` with session summary
6. Update memory if anything session-worthy was learned

### Auto-Action-Graph (in-session working memory)
Every Read/Glob/Grep is logged to `~/.claude/atlas-action-graph/` with priority scoring. Write/Edit/Bash/Agent `tool_input`s are scanned for references to previously-logged paths, bumping their `used_count` via 3-tier matching (direct key → canonical equality → substring containment with a path-specificity guard). Duplicate reads on unchanged files surface an advisory through `context-guard.js`. At PreCompact, the hot set survives as a ~2K-token digest injected by `scripts/progressive-learning/precompact-reflect.sh`, alongside a state-file snapshot in `atlas-action-graph/snapshots/`. At SessionStart, the previous session's top-5 items carry over if the state file is < 48h old, and `logs/action-graph-stats.jsonl` receives one line per completed session. All behavior is automatic, fail-open, and gated by `ATLAS_HOOK_PROFILE` via `isHookEnabled`.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure, suggest a fix.

## App Development MCP Servers

| Server | Purpose | Surface |
|--------|---------|---------|
| `tauri-mcp` | Build, dev, test Tauri v2 projects (pairs with SK-088) | Desktop |
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

## Skills Registry

All active skills are catalogued in `skills/ACTIVE-DIRECTORY.md` (single source of truth). Runtime routing:

When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.
When the user types `/handoff`, invoke the Skill tool with `skill: "handoff"` before doing anything else.
When the user types `/audit`, invoke the Skill tool with `skill: "audit"` before doing anything else.
When the user types `/hackathon:<phase>` (or plain-English hackathon triggers), invoke the Skill tool with `skill: "hackathon"` before running any sub-command — the SKILL.md routes to the right phase based on `.hackathon/` state.
