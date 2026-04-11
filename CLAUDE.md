# Global Agent Instructions

**Core principle: Be a creative, smart partner — not just an executor. Think harder, push beyond surface-level answers, and deliver exceptional results every time. Treat every task like it's going to production.**

## The Pipeline — How Every Task Works

Every task follows this sequence. Claude determines the right depth automatically.

### 1. Analyze & Understand
- Scan codebase and project CLAUDE.md first — understand what exists before researching externally
- **Project wiki check:** If `wiki/index.md` exists in the project root, read it — it contains past decisions, architectural context, and synthesis from previous sessions. This is faster and more reliable than re-deriving context from code.
- **Knowledge graph check (non-trivial codebase tasks):** Before any file exploration, check `[ -f graphify-out/graph.json ]`:
  - **Graph exists** → read `graphify-out/GRAPH_REPORT.md` first for god nodes and community structure. Use `python -m graphify query "<question>"` instead of Glob/Grep for architecture/dependency questions. Use `python -m graphify path "A" "B"` to trace connections between components.
  - **No graph, Large/Medium task with 20+ files** → offer to build: `python -m graphify .` (minutes, 71.5x token savings on all subsequent queries in this project).
- **System lookup (non-trivial tasks):** Before planning, check what the system already has for this task:
  - `skills/ACTIVE-DIRECTORY.md` — find matching skills by technology, pattern, or domain. Load the relevant page.
  - `topics/KNOWLEDGE-DIRECTORY.md` — find matching G-PAT (patterns), G-SOL (solutions), G-ERR (mistakes to avoid), G-FAIL (approaches that failed before). Load the relevant page.
  - `REFERENCE.md` — check if a slash command, MCP server, or DevOps generator already handles part of the task.
  - TOOL_SEARCH — discover available MCP tools before defaulting to CLI.
- Search online when needed: Context7 for library docs, WebSearch for unfamiliar tech. Don't guess — look up. Skip for code already in the project.
- Ask clarifying questions for ambiguous tasks — conversational style, as many as needed
- Offer one strong creative recommendation when relevant (design direction, tech approach)
- ACT without asking for: tests, security scans, skill loading, obvious bug fixes

### 2. Plan & Prepare
- Apply loaded skills and knowledge — they contain hard-won patterns, known failures, and tested approaches. Use them.
- **Context7 for framework work:** When the task involves a library/framework (Next.js, React, Supabase, Stripe, etc.), resolve-library-id → get-library-docs BEFORE writing code. Don't rely on training data for API specifics.
- Check available MCP servers and use them (prefer MCP over CLI for reads).
- Create a plan: what to build, how, file structure, design direction, technical decisions
- Use Plan mode for non-trivial work — it handles approval automatically

### 3. Execute
- Follow all rules in this file — no exceptions, no shortcuts
- TDD when tests make sense. SDD (Spec-Driven Development) for spec-heavy work.
- Make creative decisions autonomously — always choose premium over safe. Never hinder performance.
- Give milestone updates and decision checkpoints as you go
- **Security triggers** (see REFERENCE.md for full table): Run `sharp-edges` before marking any feature complete. Run `differential-review` when reviewing diffs/PRs. Run `insecure-defaults` when touching auth/secrets/config.
- **Reflexion self-check:** After writing code, check: cyclomatic complexity >10? Nesting >3 levels? Function >50 lines? Duplicate blocks? Missing error handling? If yes → refactor before moving on.

### 4. Deliver
- Self-review: verify tests pass, build succeeds, preview works before declaring done
- **Visual verification for UI work:** Use Claude Preview MCP (preview_start → preview_screenshot) to verify UI changes. Use preview_inspect for CSS accuracy. Don't skip this for frontend tasks.
- **Design QA for UI features:** Run the design pipeline: SK-078 (audit) for technical quality, SK-079 (critique) for UX evaluation, SK-080 (polish) for ship-readiness. Scale to task size — a small CSS fix needs only a glance, a new page needs the full pipeline.
- Show: code complete + tests passing + preview/screenshot
- Highlight key decisions made
- Suggest "next level" improvements proactively
- Never claim "done" without verification

### 5. Learn & Improve (conditional)
- Only when genuinely novel: save patterns to Knowledge Store, mistakes to G-ERR, new skills for real gaps. Skip for trivial/routine sessions.
- **Instinct extraction:** After non-trivial sessions, extract reusable patterns with confidence scoring:
  - Score each candidate pattern 1-5 (1=maybe useful, 5=critical insight)
  - Only save patterns scoring 4+ to Knowledge Store (prevents noise accumulation)
  - Tag with confidence: `[HIGH]` (reproduced 3+ times), `[MEDIUM]` (reproduced once), `[LOW]` (theoretical)
  - When 3+ related patterns cluster around a domain, consider creating a new skill

**Exception — Trivial tasks** (<20 lines, 1 file, obvious intent): Skip to Execute. No questions, no plan.

## Task Complexity — Unified Scale

One system for everything: scope, agent routing, and flow depth.

| Scale | Scope | Agent Model | Flow |
|-------|-------|-------------|------|
| **Trivial** | <20 lines, 1 file, obvious fix | No agents — use Bash for deterministic transforms | Do directly |
| **Small** | 1-3 files, clear requirements | Haiku for simple tasks, Sonnet if logic-heavy | Plan briefly, execute |
| **Medium** | 3-10 files, some ambiguity | Sonnet for implementation, Haiku for tests/docs | Present plan, get approval |
| **Large** | 10+ files, multi-phase | Opus for planning/verification, Sonnet for execution | Full Flow pipeline |

**Cost awareness:** Prefer lower-tier agents for independent subtasks. Never downgrade for: security auditing, architecture decisions, complex debugging.

**ACT without asking:** Clear bug reproduction, unambiguous single action, validation/testing, security scanning.
**ASK before acting:** Multiple valid architectures, unclear scope, destructive ops, deployment, greenfield tech choice. Use 1-5 multiple-choice questions with defaults marked.

## Behavioral Rules

### Review vs Implement
When asked to 'review', 'critique', 'audit', or 'analyze' — ONLY report findings with severity ratings. Do NOT implement changes unless explicitly told to. Present findings first, wait for approval on what to fix.

### File Deletion
Never use `rm` to delete files. Always use `mv` to a trash directory (`C:/tmp/trash/` or the project's `TRASH/` folder). The safety hook blocks `rm` — don't fight it, use alternatives.

### Debugging
When debugging failures: ALWAYS capture and show the actual error/response before hypothesizing a root cause. Never attribute blame to missing keys, wrong config, or timeout limits without empirical verification first. Sequence: observe real output → form hypothesis → verify → fix. Not: guess → implement fix → discover guess was wrong.

## Session Resume

When returning to previous work, ask: "Want a recap or should we jump in?"
Read state files in order: `.flow/state.yaml` → `session-state.md` → `~/.claude/.last-session-handoff` → `~/.claude/sessions/handoff-*.md`

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
- Before finishing any task: confirm it builds AND tests pass

## Git

- Branch naming: `feat/desc`, `fix/issue-123`, `refactor/module`, `chore/task`
- One branch per logical unit. No "misc-changes" branches.
- Conventional commits: `feat|fix|refactor|test|docs|chore|perf|ci: subject`
- Subject: imperative mood, <=72 chars, no trailing period, lowercase.
- Body: explain WHY, not WHAT. The diff shows what.
- One logical change per commit. Squash WIP before PR.
- ALWAYS run `git status` before every commit.
- PR description: what changed, why, how to test, screenshots if UI.
- Never force-push to main, staging, or production.
- Delete branch after merge.

## Security

- Validate and sanitize ALL user input at system boundaries. Trust internal code.
- Parameterized queries only. Never interpolate user data into SQL.
- Auth checks in middleware, not scattered across handlers.
- Check authorization on every request to a protected resource.
- Secure, httpOnly, sameSite cookies. Never localStorage for auth tokens.
- NEVER commit secrets. Rotate any accidentally committed secret immediately.
- NEVER log passwords, tokens, credit cards, SSNs, or PII.
- Error messages to clients: generic. Details: server-side logs only.
- Pin exact versions in production. Audit transitive deps before major updates.
- Blocked patterns (enforced by context-guard.js): `*.env*`, `*credentials*`, `*id_rsa*`, `*.pem`, `*.key`, AWS keys (`AKIA`), API tokens, private keys, DB connection strings.

## Testing

- TDD for new features: write the failing test first, then implement.
- Test file co-located with source: `foo.ts` → `foo.test.ts`
- Run targeted tests during dev, full suite only before commits.
- Arrange → Act → Assert. One logical assertion cluster per test.
- Test names describe behavior: "returns 404 when user not found"
- No test depends on execution order or shared mutable state.
- Mock ALL external services. Never call live APIs in tests.
- New features: cover happy path + top 3 edge cases minimum.
- Bug fixes: regression test required before fix is merged.
- NEVER modify test assertions to make tests pass — fix the code.
- NEVER use `.skip` or `xit` without a TODO referencing an issue.

## Skills & Knowledge

- **Skills**: Read `skills/ACTIVE-DIRECTORY.md` to find skills → load the relevant page on-demand. Archive in `skills/ARCHIVE-DIRECTORY.md`. If a skill gap is found → search online → create it.
- **Knowledge**: Read `topics/KNOWLEDGE-DIRECTORY.md` → load relevant page. **Check G-ERR and G-FAIL entries before implementing** — they document known mistakes and failed approaches. Save only genuinely novel patterns (G-PAT), solutions (G-SOL), mistakes (G-ERR), preferences (G-PREF), or failed approaches (G-FAIL).
- **Reference**: Read `REFERENCE.md` for slash commands, MCP patterns, security triggers, DevOps generators. **When generating IaC/Docker/CI:** use the generator+validator pairs (always run both).
- **MCP**: Prefer MCP over CLI. TOOL_SEARCH discovers tools on-demand. **Context7 is mandatory for framework tasks** — resolve-library-id → get-library-docs before writing framework-specific code.
- **Graphify**: For codebase navigation, `python -m graphify query` is cheaper than Glob/Grep sweeps when a graph exists. Check `graphify-out/graph.json` before exploring large codebases. Build: `python -m graphify .` | Query: `python -m graphify query "<q>"` | Path: `python -m graphify path "A" "B"` | Update: `python -m graphify --update`
- **Personal Wiki**: Dedicated Obsidian vault at `Documents/Wiki/` — personal knowledge wiki (Karpathy LLM Wiki pattern). `/wiki-ingest` (add articles/notes), `/wiki-query` (search wiki), `/wiki-lint` (health check). Wiki = external world knowledge. ATLAS topics = engineering patterns. Don't duplicate. Per-project wikis auto-scaffold on `/new` and `/flow:start`.

## Auto Mode

When autonomous (scheduled tasks, agent hooks): plan first for non-trivial work, make reasonable assumptions (flag them), no destructive actions without confirmation.

## Platform

Windows 11 host, Unix shell syntax in bash (forward slashes, /dev/null not NUL). Scratchpad: `C:/tmp/claude-scratchpad/`.

## Automatic Workflows

These workflows fire automatically based on context. Do not wait to be asked.

### Auto-Graph-Navigation (codebase tasks)
When starting any non-trivial task in a project directory:
1. Check `[ -f graphify-out/graph.json ]` — do this before any Glob/Grep
2. **Graph found:** read `graphify-out/GRAPH_REPORT.md` (god nodes, communities, surprising connections). Navigate by graph structure, not file guessing. Prefer `python -m graphify query` over broad Glob/Grep sweeps.
3. **No graph, 20+ files in scope:** offer one line — *"No knowledge graph found. Run `python -m graphify .` to build one (minutes, 71.5x token savings). Want me to build it first?"* — then proceed with or without based on response.
4. **After editing code files in a session:** run `python -m graphify --update` once at end of session to keep graph current (code-only, no LLM cost, <2s).
5. **Flow integration:** before `/flow:map` or `/flow:discover`, check for graph. If found, pass GRAPH_REPORT.md to map/discover agents as pre-loaded structure. If not, offer to build before spawning agents.

### Auto-Handoff (every session end)
When the session is ending (user says "done", "wrap up", "that's it", or work is complete):
1. Commit all pending changes with a descriptive conventional commit message
2. Push to the current branch
3. Generate a handoff document at `~/.claude/sessions/handoff-YYYY-MM-DD.md` with: changes summary, files modified, pending items, knowledge extracted
4. Update memory if anything session-worthy was learned

### Auto-Scraper-Debug (JobHunter project)
When debugging scraper failures in the JobHunter project, automatically follow this protocol:
1. Run the failing scraper in isolation — capture the raw response/error payload
2. Show the actual output before hypothesizing root cause
3. Verify env vars are loaded, endpoint is reachable, and SDK version is correct
4. Implement a fix based on evidence, not assumptions
5. Re-run the scraper to confirm the fix works before moving to the next
6. After all scrapers pass, run the full test suite
7. If any scraper fails after 3 fix attempts, stop and report with raw output

### Auto-Parallel-Audit (system audits)
When running a system audit (stale references, dead code, orphaned files, version mismatches), automatically parallelize:
1. Spawn separate sub-agents for each audit domain: orphaned file references, version string mismatches, dead exports, stale TODO/FIXME comments
2. Each agent collects findings into a structured list — NO changes yet
3. Coordinator deduplicates findings across agents and presents a unified report
4. Wait for approval on what to fix (follows Review vs Implement rule)
5. Fix approved issues, run smoke tests after each batch
6. Present final summary table: category | files changed | issues fixed

### Auto-Verified-Deploy (after pushing code)
When deploying to production (Vercel or any host), automatically verify after push:
1. Run the full test suite locally — stop if anything fails
2. Pre-deploy check: verify env vars referenced in code exist, no hardcoded localhost URLs, no stray console.log
3. Commit and push
4. Wait for deployment (90s for Vercel), then verify production URL returns 200
5. Hit each API endpoint with a test request and verify response shape
6. If any endpoint fails: diagnose by comparing local vs production, fix, restart from step 1
7. Once verified, create a handoff doc noting what shipped and endpoints verified

### Auto-Wiki-Context (session start in any project)
When starting a session in a project directory that has a `wiki/` folder:
1. Read `wiki/index.md` — scan for decisions and context pages
2. If the session's task relates to an existing decision or context page, read those pages first
3. This replaces re-reading code to reconstruct "why did we do X?" — the answer is pre-compiled in the wiki

### Auto-Wiki-Decision (after making significant decisions)
When making a significant architectural decision during a session (tech stack choice, pattern selection, approach rejection, schema design, deployment strategy):
1. Write it to `wiki/decisions/YYYY-MM-DD-{slug}.md` with frontmatter:
   ```yaml
   ---
   title: "Decision title"
   type: decision
   related: []
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   ---
   ```
2. Content structure: **Context** (what prompted the decision), **Options Considered** (what was evaluated), **Decision** (what was chosen and why), **Consequences** (trade-offs accepted)
3. Update `wiki/index.md` — add row to Decisions table
4. Append to `wiki/log.md`
5. **What qualifies**: choosing a library over alternatives, picking an auth strategy, designing a data model, rejecting an approach, making a performance/simplicity trade-off. **What doesn't**: routine implementation details, code style, bug fixes.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure, suggest a fix.

## Skills Registry

- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - Turn any folder into a queryable knowledge graph. Trigger: `/graphify`

When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.
