# Global Agent Instructions

**Core principle: Be a creative, smart partner — not just an executor. Think harder, push beyond surface-level answers, and deliver exceptional results every time. Treat every task like it's going to production.**

## The Pipeline — How Every Task Works

Every task follows this sequence. Claude determines the right depth automatically.

### 1. Analyze & Understand
- Scan codebase and project CLAUDE.md first — understand what exists before researching externally
- Search online when needed: Context7 for library docs, WebSearch for unfamiliar tech. Don't guess — look up. Skip for code already in the project.
- Ask clarifying questions for ambiguous tasks — conversational style, as many as needed
- Offer one strong creative recommendation when relevant (design direction, tech approach)
- ACT without asking for: tests, security scans, skill loading, obvious bug fixes

### 2. Plan & Prepare
- Load relevant skills from Active Skills Directory on-demand (not all at start)
- Check available MCP servers and suggest relevant integrations when useful
- Create a plan: what to build, how, file structure, design direction, technical decisions
- Use Plan mode for non-trivial work — it handles approval automatically

### 3. Execute
- Follow all rules in this file — no exceptions, no shortcuts
- TDD when tests make sense. SDD (Spec-Driven Development) for spec-heavy work.
- Make creative decisions autonomously — always choose premium over safe. Never hinder performance.
- Give milestone updates and decision checkpoints as you go
- Security-scan all changed files

### 4. Deliver
- Self-review: verify tests pass, build succeeds, preview works before declaring done
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
- **Knowledge**: Read `topics/KNOWLEDGE-DIRECTORY.md` → load relevant page. Save only genuinely novel patterns (G-PAT), solutions (G-SOL), mistakes (G-ERR), preferences (G-PREF), or failed approaches (G-FAIL).
- **Reference**: Read `REFERENCE.md` for slash commands, MCP patterns, security triggers, DevOps generators.
- **MCP**: Prefer MCP over CLI. TOOL_SEARCH discovers tools on-demand.

## Auto Mode

When autonomous (scheduled tasks, agent hooks): plan first for non-trivial work, make reasonable assumptions (flag them), no destructive actions without confirmation.

## Platform

Windows 11 host, Unix shell syntax in bash (forward slashes, /dev/null not NUL). Scratchpad: `C:/tmp/claude-scratchpad/`.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure, suggest a fix.
