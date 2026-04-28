# ATLAS System Architecture (v7.0.0)

## Configuration Architecture

1. **`~/.claude/CLAUDE.md`** — Slim core instructions (~8KB). Rules extracted to on-demand pages.

2. **Skills Directory/Page System** (76 active skill entries, 124 top-level dirs on disk incl. container packs):
   - `skills/ACTIVE-DIRECTORY.md` — Index of active skills (15 Core + 61 Available)
   - `skills/ACTIVE-PAGE-1-web-frontend.md` — Web, animation, design, testing, security skills (34 skills)
   - `skills/ACTIVE-PAGE-2-backend-tools.md` — Backend, deployment, workflow skills (22 skills)
   - `skills/ACTIVE-PAGE-3-native-crossplatform.md` — Native, desktop, cross-platform skills (10 skills)
   - `skills/ARCHIVE-DIRECTORY.md` — Archived skills by domain bundle (7 archive pages)
   - `skills/RULES-GIT.md` — On-demand git workflow rules
   - `skills/RULES-SECURITY.md` — On-demand security rules + triggers
   - `skills/RULES-TESTING.md` — On-demand testing rules

3. **Knowledge Store** (72 entries):
   - `topics/KNOWLEDGE-DIRECTORY.md` — Index
   - `topics/KNOWLEDGE-PAGE-1-patterns.md` — 29 G-PAT entries
   - `topics/KNOWLEDGE-PAGE-2-solutions.md` — 17 G-SOL entries
   - `topics/KNOWLEDGE-PAGE-3-errors.md` — 12 G-ERR entries
   - `topics/KNOWLEDGE-PAGE-4-preferences.md` — 8 G-PREF entries
   - `topics/KNOWLEDGE-PAGE-5-failures.md` — 6 G-FAIL entries

4. **Reference**: `REFERENCE.md` — slash commands, MCP patterns, skill routing, DevOps generators

5. **Living Memory** (Bentley plan, 2026-04-26 onwards) — Phase 0 + Phase 1 shipped:
   - **Source of truth (Phase 0)**: `projects/C--Users-leooa--claude/memory/{semantic,episodic,procedural,reflection,_pending,forgotten}/*.md`
   - **Substrate (Phase 1)**: `memory/lib/schema.sql` (11 tables), `memory/package.json` (better-sqlite3 + sqlite-vec, isolated from create-atlas-env), derived index `memory/index.db` regenerable via `/memory:rebuild`
   - **Future phases** (embedder, pipeline, retrieval ranker, decay/dream lifecycle, slash commands) — design lives in [plans/i-want-you-to-purring-bentley.md](plans/i-want-you-to-purring-bentley.md) and the 3 supporting research docs (audit, research synthesis, implementation blueprint)

## Hooks

All Node hooks import `hooks/lib.js` for shared utilities. Config: `hooks/context-thresholds.json`.

| Event | Hook | Purpose |
|-------|------|---------|
| PreToolUse | context-guard.js | Duplicate-read advisory (Read) + security gate (Write/Edit/MultiEdit) + context budget (all expensive) |
| PreToolUse | cctools bash/file/env hooks | Safety hooks |
| PreToolUse | graph hint (Glob/Grep) | Suggest CRG MCP tools (`.code-review-graph/graph.db`) or graphify (`graphify-out/graph.json`) before broad search |
| PreToolUse | pre-commit-gate.js | Build/test reminder before git commit |
| PreToolUse | skill-usage-log.js (Skill) | Append `{ts, skill, cwd, session_id}` per invocation to `logs/skill-usage.jsonl` — feeds `/observe` section 3 + monthly `skill-usage-audit` (v7.0) |
| PostToolUse | auto-formatter | Format on write |
| PostToolUse | tsc-check.js | TypeScript check (only .ts/.tsx files, 15s timeout) |
| PostToolUse | CRG auto-update (Write/Edit/MultiEdit) | Incremental `uvx code-review-graph update` if `.code-review-graph/graph.db` exists (backgrounded, 3s timeout, fail-open) |
| PostToolUse | post-tool-monitor.js | Context, efficiency, failure tracking + action-graph retrieval logging (Read/Glob/Grep/Write/Edit/MultiEdit/Bash/Agent) |
| PostToolUseFailure | tool-failure-handler.js | Circuit breaker, tool health, MCP server classification |
| UserPromptSubmit | allow_git_hook.py | Session-scoped git approval |
| SessionStart | session-start.sh | Handoff, version, rotation, health, KG, unified cleanup engine (§7a), drift proposer (§8a) |
| SessionStart | cleanup-runner.js | 13 declarative cleanup rules from `cleanup-config.json` (v7.0); one JSONL record per rule to `logs/cleanup.jsonl` |
| SessionStart | drift-proposer.js | Reads telemetry, emits at most ONE `DRIFT: ...` advisory when a threshold crosses; persists to `cache/last-drift-proposal.json` (v7.0) |
| Stop | session-stop.sh | Handoff, todos, KG capture |
| PreCompact | scripts/progressive-learning/precompact-reflect.sh | Preserve KG pre-compaction + action-graph hot-set digest injection (Tier 2) |
| Notification | claudio | Desktop notifications |
| StatusLine | statusline.js | Context bar, task, call count |

## Hook-driven workflows

These behaviors fire automatically based on the hooks above, not on explicit prompts.

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

## Persistence Layer Boundaries

Three systems, strict boundaries — no overlap.

| System | Stores | Does NOT store |
|--------|--------|----------------|
| **Memory** (`projects/*/memory/`) | User profile, behavioral feedback, project context, external references | Technical patterns, code solutions, git-derivable data |
| **Knowledge Store** (`topics/`) | Reusable technical knowledge: G-PAT (patterns), G-SOL (solutions), G-ERR (mistakes), G-PREF (work style preferences), G-FAIL (failed approaches) | User-facing corrections (use feedback memory), ephemeral state |
| **Atlas KG** (`atlas-kg/`) | Facts not derivable from git, code, or files — architectural decisions, cross-project relationships, non-obvious context | Git data (branch, commits, status) — use `git log` for that |

**When in doubt:** Can `git log` or `grep` answer it? → Don't store it. Is it a user correction? → Feedback memory. Is it a reusable technical pattern? → Knowledge Store.

## Cache Tiers (L1 / L2 / L3)

A second axis over the same artifacts. Persistence Layer Boundaries (above) classify by *kind of fact*; Cache Tiers classify by *access cadence*. Both axes apply to every entry.

| Tier | Loaded | Budget | Stores |
|------|--------|--------|--------|
| **L1 — Always loaded** | Every session, automatically | ~10KB | `CLAUDE.md` (core rules) · `projects/*/memory/MEMORY.md` (auto-memory index) · `cache/session-hot/${cwd_slug}.md` (per-CWD session continuity, ≤500 tokens, fresh ≤7d) · skills directory listings · KG summary · action-graph carryover |
| **L2 — On-demand** | Pulled by skill, command, or routing | unbounded | `skills/ACTIVE-PAGE-*.md` · `topics/KNOWLEDGE-PAGE-*.md` · `atlas-kg/` triples · `Documents/Wiki/wiki/` (entity/concept/source/synthesis) · `handoffs/*.md` |
| **L3 — Cold storage** | Retrieved only when explicitly referenced | unbounded | `projects/*/*.jsonl` raw transcripts · `Documents/Wiki/raw/` ingested sources · `skills/ARCHIVE-DIRECTORY.md` retired skills · `backups/` · `TRASH/` |

**Movement between tiers:**
- Session ending → `session-stop.sh` §1c writes L1 `cache/session-hot/${cwd_slug}.md` (≤500 tokens, hard-capped at 2500 chars) + appends L2 `handoffs/${cwd_slug}.md` + KG capture. Pruned at 14d by `session-start.sh`.
- Session starting → `session-start.sh` injects L1 hot cache + handoff + action-graph carryover (top-5 from previous session).
- L2 stale → `cleanup-runner.js` rules promote to L3 (transcripts gzip+trash) or trim by `keep_last`.
- Routing decisions for *new* facts → `config/routing-rules.yml` consulted by `/remember` and the context-router skill.
- Decay thresholds per content type → `config/decay.yml` (sibling to `cleanup-config.json`, content-type axis).

**Invariant:** L1 must stay under ~10KB. Anything larger is L2 by default, even if it feels "important" — importance ≠ hot.

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

## Telemetry & Observability (v7.0)

The system generates telemetry at five points; one consumer (`/observe`) renders the lot.

| Stream | Writer | Consumer |
|---|---|---|
| `logs/tool-health.json` | `tool-failure-handler.js` (PostToolUseFailure) | `/observe §1` · `drift-proposer` tool-failure channel |
| `logs/safety-hook-counts.json` | `hooks/cctools-safety-hooks/bash_hook.py::_bump_counter` | `/observe §2` |
| `logs/skill-usage.jsonl` | `hooks/skill-usage-log.js` (PreToolUse Skill, v7.0) | `/observe §3` · `drift-proposer` skill-unused channel · `skill-usage-audit` scheduled task |
| `cache/scheduled-tasks-latest.json` | `/observe` (via `mcp__scheduled-tasks__list_scheduled_tasks`) | `/observe §4` · `drift-proposer` scheduled-task-drift channel |
| `logs/action-graph-stats.jsonl` | `hooks/atlas-action-graph.js::statsRollup` (Stop) | `/observe §5` |
| `logs/cleanup.jsonl` | `hooks/cleanup-runner.js` (SessionStart, v7.0) | `/observe §6` · `drift-proposer` cleanup-error-streak channel · `weekly-maintenance` step 3 |

**Consumer surfaces:**

- `/observe` → `scripts/observability.js` — 6-section markdown dashboard. Flags: `--json`, `--section=<name>`. Empty-safe per section.
- `/apply-drift-fix` — reads `cache/last-drift-proposal.json` and routes to the right action (skill archive, MCP disable, task retrigger, cleanup-rule fix).
- `drift-proposer.js` thresholds live in `hooks/drift-thresholds.json`. Per-kind cooldown (24h) + `max_proposals_per_session: 1` + `silenced_kinds` allowlist prevent noise.

**Cleanup engine:** `hooks/cleanup-runner.js` replaced `session-start.sh` §7a–§7k (10+ bespoke blocks). Config in `hooks/cleanup-config.json` declares 13 rules across 7 modes (`age-prune`, `age-and-count`, `keep-last`, `delete-matching-dirs`, `age-prune-dirs`, `gzip-then-trash`, `per-project-uuid-dirs`, `weekly-nag`, `custom`). Adding a new target is a 3-line config change.

## MCP Servers

Lazy discovery via TOOL_SEARCH. **Two registries, both real:**
- `~/.claude.json` (top-level `mcpServers`) — USER scope, global across all CWDs. Managed via `claude mcp add|remove -s user`.
- `~/.claude/.mcp.json` — PROJECT scope, only loaded when CWD is `~/.claude/`. `_comment_*` keys must live at top level, NOT inside `mcpServers` (strict parser — invalid nesting silently blocks the whole object from loading, as happened before 2026-04-17).

**Current state (verified 2026-04-20 via `claude mcp list`):**

- **Bundled / gateway**: `MCP_DOCKER` (Context7, GitHub, Neon, Wikipedia, Memory, Playwright, Git, Filesystem). Obsidian sub-tool is degraded (14 failures 2026-04-09 → 2026-04-10, no successful call since) — don't rely on `mcp__MCP_DOCKER__obsidian_list_files_in_vault`; use filesystem tools against `~/Documents/Wiki/` instead.
- **✓ Connected user scope** (13): `code-review-graph` (CRG — Tree-sitter, 30 tools + 5 prompts, auto-update on Write/Edit), `magicuidesign-mcp`, `shadcn`, `prisma`, `tauri-mcp`, `lighthouse`, `heroui`, `context-mode`, `mobile`, `aceternity`, `iconify`, `plugin:firebase:firebase`
- **✓ Connected project scope (only visible from CWD=~/.claude/)** (7): `supabase`, `resend`, `sentry`, `firecrawl`, `21st-dev`, `maestro`, `netlify` — loaded from `.mcp.json` with env vars wired from `settings.json`. Actively serving calls. Each entry's `_activate` field shows the exact `claude mcp add -s user -e KEY=...` command to promote to user scope.
- **! OAuth-pending** (sign-in on first use; interactive): `cloudflare`, `linear`, `expo`, `posthog`, `vercel`, `statsig`, `plugin:asana:asana`, `plugin:figma:figma`
- **✗ Failing — needs API key only** (package + endpoint work, servers exit on missing env var): `stripe` (needs `STRIPE_SECRET_KEY`), `upstash` (needs `UPSTASH_EMAIL` + `UPSTASH_API_KEY`)
- **✗ Failing — plugin-bundled, needs user token**: `plugin:github:github` — sends `Authorization: Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`; set the env var (or `gh auth token`) and restart Claude Code.
- **Not standalone-invocable** (removed 2026-04-17): `storybook` (addon — needs project context), `openapi` (requires `--spec` arg), `applitools` (14-day trial only, not free-tier — see `memory/feedback_applitools_trial.md`; replaced by `Claude Preview` manual screenshot flow). Re-register per-project if needed.
- **OAuth/cloud connectors** (plugin-registered): Gamma, Context7, Canva, Figma Dev, Gmail, BigData, Prospect Enrichment, Job Search, Social/Stocks, mcp-registry, scheduled-tasks
- **Plugin-based**: Canva, Figma, Claude Preview, Chrome

**Verify state:** `claude mcp list` (from CWD=~/.claude/ to see both registries). **Revival memory:** `projects/*/memory/project_mcp_revival.md`.

## Key Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Core instructions |
| `REFERENCE.md` | Quick-lookup for commands, skills, MCP |
| `INSTALLED.md` | Third-party resource manifest |
| `settings.json` | Hooks, permissions, env vars |
| `hooks/context-thresholds.json` | Shared threshold config |
