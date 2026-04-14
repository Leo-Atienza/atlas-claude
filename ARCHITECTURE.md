# ATLAS System Architecture (v6.7.0)

## Configuration Architecture

1. **`~/.claude/CLAUDE.md`** — Slim core instructions (~8KB). Rules extracted to on-demand pages.

2. **Skills Directory/Page System** (69 active skill entries, 105 top-level dirs on disk incl. container packs):
   - `skills/ACTIVE-DIRECTORY.md` — Index of active skills (15 Core + 51 Available)
   - `skills/ACTIVE-PAGE-1-web-frontend.md` — Web, animation, design, testing, security skills (34 skills)
   - `skills/ACTIVE-PAGE-2-backend-tools.md` — Backend, deployment, workflow skills (22 skills)
   - `skills/ACTIVE-PAGE-3-native-crossplatform.md` — Native, desktop, cross-platform skills (10 skills)
   - `skills/ARCHIVE-DIRECTORY.md` — Archived skills by domain bundle (7 archive pages)
   - `skills/RULES-GIT.md` — On-demand git workflow rules
   - `skills/RULES-SECURITY.md` — On-demand security rules + triggers
   - `skills/RULES-TESTING.md` — On-demand testing rules

3. **Knowledge Store** (72 entries):
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
| PreToolUse | context-guard.js | Duplicate-read advisory (Read) + security gate (Write/Edit/MultiEdit) + context budget (all expensive) |
| PreToolUse | cctools bash/file/env hooks | Safety hooks |
| PreToolUse | graphify hint (Glob/Grep) | Suggest graph navigation |
| PreToolUse | pre-commit-gate.js | Build/test reminder before git commit |
| PostToolUse | auto-formatter | Format on write |
| PostToolUse | tsc-check.js | TypeScript check (only .ts/.tsx files, 15s timeout) |
| PostToolUse | post-tool-monitor.js | Context, efficiency, failure tracking + action-graph retrieval logging (Read/Glob/Grep/Write/Edit/MultiEdit/Bash/Agent) |
| PostToolUseFailure | tool-failure-handler.js | Circuit breaker, tool health, MCP server classification |
| UserPromptSubmit | allow_git_hook.py | Session-scoped git approval |
| SessionStart | session-start.sh | Handoff, version, rotation, health, KG |
| Stop | session-stop.sh | Handoff, todos, KG capture |
| PreCompact | scripts/progressive-learning/precompact-reflect.sh | Preserve KG pre-compaction + action-graph hot-set digest injection (Tier 2) |
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

3. **`hooks/atlas-action-graph.js`** — In-session retrieval log (JSON-backed, zero deps) — *Tier 1, added 2026-04-14*
   - Storage: `atlas-action-graph/${session_id}.jsonl` (append-only) + `${session_id}.state.json` (priority queue, atomic)
   - Feeds duplicate-read advisory in `context-guard.js` and receives retrieval logging from `post-tool-monitor.js`
   - Separate storage keys per tool: `read:${path}` / `glob:${pattern}` / `grep:${pattern}` — no cross-tool collisions
   - Skips `/tmp/**` and `os.tmpdir()` to ignore scratchpad noise; mtime-aware so stale file changes don't trigger false duplicate warnings
   - Priority score: `0.4·log(retrieved_count)/log(6) + 0.4·(used_count/retrieved_count) + 0.2·exp(-ageMin/15)`; `pinned: true` overrides eviction
   - Profile-gated via `isHookEnabled('atlas-action-graph')` — fails open everywhere
   - CLI: `node atlas-action-graph.js {log|check|hot|digest|query|stats|rollup|carryover|mark-used|pin|unpin|prune}`
   - Scope: within-session working memory (complements atlas-kg's cross-session long-term memory)
   - **Tier 2 (2026-04-14):** reference scanner via `post-tool-monitor.js` §5 (flattens `tool_input` strings and bumps `used_count` through 3-tier `markUsed` matching — direct-key → canonical equality → substring containment with path-specificity guard); `compactDigest` survives PreCompact via `scripts/progressive-learning/precompact-reflect.sh`; state-file snapshots kept in `atlas-action-graph/snapshots/`; `used_count` capped on the writer at `retrieved_count × 3`
   - **Tier 3 (2026-04-14):** `statsRollup` appends a one-line per-session summary to `logs/action-graph-stats.jsonl` from `session-stop.sh`; `carryoverDigest` surfaces the previous session's top-5 items at SessionStart (`hooks/session-start.sh` §7i, 48h age guard); `pruneOldSessions(7)` runs on every SessionStart

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
