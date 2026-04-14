# Global Agent Instructions

**Core principle: Be a creative, smart partner — not just an executor. Think harder, push beyond surface-level answers, and deliver exceptional results every time. Treat every task like it's going to production.**

## The Pipeline

Every task follows this sequence. Claude determines the right depth automatically.

### 1. Analyze & Understand
- Scan codebase and project CLAUDE.md first — understand what exists before researching externally
- **Project wiki check:** If `wiki/index.md` exists, read it for past decisions and context.
- **Knowledge graph check:** If `graphify-out/graph.json` exists, read `graphify-out/GRAPH_REPORT.md` first. Use `python -m graphify query` over Glob/Grep. No graph + 20+ files → offer to build.
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
- **Graphify**: Check `graphify-out/graph.json` before exploring large codebases. Build: `python -m graphify .` | Query: `python -m graphify query "<q>"`
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
1. Check `[ -f graphify-out/graph.json ]` before any Glob/Grep
2. **Graph found:** read `graphify-out/GRAPH_REPORT.md`. Prefer `python -m graphify query` over broad sweeps.
3. **No graph, 20+ files:** offer to build. Proceed with or without based on response.
4. **After editing code:** run `python -m graphify --update` once at end of session.

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
4. Generate handoff at `~/.claude/sessions/handoff-YYYY-MM-DD.md`
5. If project has `wiki/` directory, update `wiki/session-log.md` with session summary
6. Update memory if anything session-worthy was learned

### Auto-Action-Graph (in-session working memory)
Every Read/Glob/Grep is logged to `~/.claude/atlas-action-graph/` with priority scoring. Write/Edit/Bash/Agent `tool_input`s are scanned for references to previously-logged paths, bumping their `used_count` via 3-tier matching (direct key → canonical equality → substring containment with a path-specificity guard). Duplicate reads on unchanged files surface an advisory through `context-guard.js`. At PreCompact, the hot set survives as a ~2K-token digest injected by `scripts/progressive-learning/precompact-reflect.sh`, alongside a state-file snapshot in `atlas-action-graph/snapshots/`. At SessionStart, the previous session's top-5 items carry over if the state file is < 48h old, and `logs/action-graph-stats.jsonl` receives one line per completed session. All behavior is automatic, fail-open, and gated by `ATLAS_HOOK_PROFILE` via `isHookEnabled`.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure, suggest a fix.

## App Development MCP Servers (2026-04-12)

| Server | Purpose | Surface |
|--------|---------|---------|
| `storybook` | Component-level testing, story generation, a11y testing | Frontend testing |
| `tauri-mcp` | Build, dev, test Tauri v2 projects (pairs with SK-088) | Desktop |
| `maestro` | Mobile E2E testing with auto-healing selectors (Android on Win, iOS needs macOS) | Mobile testing |
| `openapi` | Auto-generate MCP tools from any OpenAPI/Swagger spec | Backend / API |
| `statsig` | Feature flags, A/B experiments, metrics (free 50M events/mo) | Lifecycle |
| `applitools` | Visual AI regression testing on Playwright screenshots | Visual testing |

### App Dev Slash Commands
- `/new-mobile-app` — Scaffold Expo + Supabase mobile project
- `/new-desktop-app` — Scaffold Tauri desktop project
- `/api-design` — Design and generate API from spec
- `/db-schema` — Design and validate database schema

### App Dev Skills (Expo Official, 2026-04-12)
Installed from `expo/skills`: expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui, native-data-fetching, upgrading-expo, use-dom

## Skills Registry

- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - Turn any folder into a queryable knowledge graph. Trigger: `/graphify`

When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

- **handoff** (`~/.claude/skills/handoff/SKILL.md`) - End-of-session: build, test, commit, push, handoff doc. Trigger: `/handoff`
- **audit** (`~/.claude/skills/audit/SKILL.md`) - Systematic codebase audit with wave-based verified fixes. Trigger: `/audit`

When the user types `/handoff`, invoke the Skill tool with `skill: "handoff"` before doing anything else.
When the user types `/audit`, invoke the Skill tool with `skill: "audit"` before doing anything else.
