# ATLAS System Architecture (v6.7.0)

## Configuration Architecture

1. **`~/.claude/CLAUDE.md`** — Slim core instructions (~8KB). Rules extracted to on-demand pages.

2. **Skills Directory/Page System** (66 active skill entries, 98 top-level dirs on disk incl. container packs):
   - `skills/ACTIVE-DIRECTORY.md` — Index of active skills (15 Core + 51 Available)
   - `skills/ACTIVE-PAGE-1-web-frontend.md` — Web, animation, design, testing, security skills (34 skills)
   - `skills/ACTIVE-PAGE-2-backend-tools.md` — Backend, deployment, workflow skills (22 skills)
   - `skills/ACTIVE-PAGE-3-native-crossplatform.md` — Native, desktop, cross-platform skills (10 skills)
   - `skills/ARCHIVE-DIRECTORY.md` — Archived skills by domain bundle (7 archive pages)
   - `skills/RULES-GIT.md` — On-demand git workflow rules
   - `skills/RULES-SECURITY.md` — On-demand security rules + triggers
   - `skills/RULES-TESTING.md` — On-demand testing rules

3. **Knowledge Store** (67 entries):
   - `topics/KNOWLEDGE-DIRECTORY.md` — Index
   - `topics/KNOWLEDGE-PAGE-1-patterns.md` — 28 G-PAT entries
   - `topics/KNOWLEDGE-PAGE-2-solutions.md` — 16 G-SOL entries
   - `topics/KNOWLEDGE-PAGE-3-errors.md` — 9 G-ERR entries
   - `topics/KNOWLEDGE-PAGE-4-preferences.md` — 8 G-PREF entries
   - `topics/KNOWLEDGE-PAGE-5-failures.md` — 6 G-FAIL entries

4. **Reference**: `REFERENCE.md` — slash commands, MCP patterns, skill routing, DevOps generators

## Hooks

All Node hooks import `hooks/lib.js` for shared utilities. Config: `hooks/context-thresholds.json`.

| Event | Hook | Purpose |
|-------|------|---------|
| PreToolUse | context-guard.js | Security gate + context budget |
| PreToolUse | cctools bash/file/env hooks | Safety hooks |
| PreToolUse | graphify hint (Glob/Grep) | Suggest graph navigation |
| PreToolUse | pre-commit-gate.js | Build/test reminder before git commit |
| PostToolUse | auto-formatter | Format on write |
| PostToolUse | tsc-check.js | TypeScript check (only .ts/.tsx files, 15s timeout) |
| PostToolUse | post-tool-monitor.js | Context, efficiency, failure tracking |
| PostToolUseFailure | tool-failure-handler.js | Circuit breaker, tool health, MCP server classification |
| UserPromptSubmit | allow_git_hook.py | Session-scoped git approval |
| SessionStart | session-start.sh | Handoff, version, rotation, health, KG |
| Stop | session-stop.sh | Handoff, todos, KG capture |
| PreCompact | precompact-reflect.sh | Preserve knowledge pre-compaction |
| Notification | claudio | Desktop notifications |
| StatusLine | statusline.js | Context bar, task, call count |

## Persistence Layer Boundaries

Three systems, strict boundaries — no overlap.

| System | Stores | Does NOT store |
|--------|--------|----------------|
| **Memory** (`projects/*/memory/`) | User profile, behavioral feedback, project context, external references | Technical patterns, code solutions, git-derivable data |
| **Knowledge Store** (`topics/`) | Reusable technical knowledge: G-PAT (patterns), G-SOL (solutions), G-ERR (mistakes), G-PREF (work style preferences), G-FAIL (failed approaches) | User-facing corrections (use feedback memory), ephemeral state |
| **Atlas KG** (`atlas-kg/`) | Facts not derivable from git, code, or files — architectural decisions, cross-project relationships, non-obvious context | Git data (branch, commits, status) — use `git log` for that |

**When in doubt:** Can `git log` or `grep` answer it? → Don't store it. Is it a user correction? → Feedback memory. Is it a reusable technical pattern? → Knowledge Store.

## Atlas Intelligence Layer

1. **`hooks/atlas-kg.js`** — Temporal Knowledge Graph (JSON-backed, zero deps)
   - Storage: `atlas-kg/entities.json` + `triples.json`
   - CLI: `node atlas-kg.js {add|query|invalidate|prune|summary|stats}`
   - Rule: only store facts NOT derivable from git or filesystem

2. **`hooks/atlas-extractor.js`** — Heuristic memory auto-extractor
   - Pure regex classifier: text → G-PAT/G-SOL/G-ERR/G-PREF/G-FAIL

## MCP Servers

Lazy discovery via TOOL_SEARCH.

- **MCP_DOCKER** (bundled): Context7, GitHub, Neon, Wikipedia, Memory, Playwright, Git, Filesystem, Obsidian
- **Standalone** (`.mcp.json`): shadcn, supabase, stripe, resend, prisma, expo, sentry, mobile, posthog, cloudflare, linear, upstash, netlify, context-mode, lighthouse, firecrawl, heroui, aceternity, 21st-dev, iconify
- **Global** (`.claude.json`): MCP_DOCKER, magicuidesign-mcp
- **OAuth/Cloud connectors**: Gamma, Context7, Canva, Figma Dev, Gmail, BigData, Prospect Enrichment, Job Search, Social/Stocks, vercel, expo, linear, cloudflare, mcp-registry, scheduled-tasks
- **Plugin-based**: Canva, Figma, Claude Preview, Chrome

## Key Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Core instructions |
| `REFERENCE.md` | Quick-lookup for commands, skills, MCP |
| `INSTALLED.md` | Third-party resource manifest |
| `settings.json` | Hooks, permissions, env vars |
| `hooks/context-thresholds.json` | Shared threshold config |
