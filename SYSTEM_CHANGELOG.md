# System Changelog

## [6.9.3] — 2026-04-24 (next-session picks — audit hardening + v7 scope draft)

### Continuation of v6.9.2 — three "Next session picks" from the 2026-04-24 handoff

Builds on v6.9.2's G-ERR-014 documentation by executing the deferred audit sweep, making the anti-pattern detectable going forward, upgrading the weekly maintenance scheduled task, and drafting the v7.0 scope.

**Pick #1 — `node -e` path audit + regression guard**
- Full audit of all 19 `node -e` call sites across `hooks/` and `scripts/`: **all safe.** Verified Git Bash (MSYS2) auto-mangles `/c/...` → `C:/...` when passing argv to native Windows executables, so argv-passed paths are safe without extra conversion. `cygpath -w` + `String.raw\`...\`` is the second approved idiom. Third is resolving paths inside Node via `os.homedir()` / `process.env.HOME`.
- `topics/KNOWLEDGE-PAGE-3-errors.md` G-ERR-014 entry rewritten — adds explicit "why argv works" section (with verification output), three approved safe patterns, two unsafe patterns, and a 2026-04-24 audit log listing all 19 sites.
- `scripts/smoke-test.sh` section 14 added — "G-ERR-014 Regression Guard" greps `hooks/` + `scripts/` for the bad pattern (same-line `node -e` + quoted `/c/` or `C:/` literal, excluding safe idioms). Self-excludes smoke-test.sh to avoid self-flagging on the regex source. Verified end-to-end: benign code passes, synthetic bad pattern correctly FAILs with actionable fix pointer.
- Smoke test now 70/70 HEALTHY (up from 69/69).

**Pick #2 — Weekly maintenance enhancement**
- `scheduled-tasks/weekly-maintenance/SKILL.md` prompt upgraded to include: smoke test run with explicit section 14 regression check, skill-count parity validation across all 4 sources (SYSTEM_VERSION, ARCHITECTURE, ACTIVE-DIRECTORY, REFERENCE), proactive SKILL-PACK CHECK + VERSION CHECK nag surfacing, and a structured result summary line. (Scheduled task is gitignored — private per-user — so this change lives only in live `~/.claude/`.)

**Pick #3 — v7.0 scope draft (DRAFT for Leo review)**
- `plans/v7-scope.md` drafted, marked `<!-- keep -->` to survive plan rotation. Theme: "Consolidation & Observability." Rationale: three consecutive audit-and-remediate releases (6.9.0 / 6.9.1 / 6.9.2) indicate the system needs to watch itself rather than be audited manually. Proposes 6 waves: unified cleanup engine (replaces §7b–§7k in session-start.sh), skill-usage instrumentation, observability dashboard, scheduled-task consolidation (6 → 4), auto-drift-proposer, docs polish. Includes rejected alternatives ("Graph-Native Mode," "Self-Auditing only"), risk matrix, and 5 decision points for Leo. Lives in live `plans/` only — not mirrored (plans/ is session working dir).

**Drift cleanup (caught during this pass)**
- `SYSTEM_VERSION.md`: `better-ccflare` 3.4.0 → **3.4.13** and `tdd-guard` 1.4.0 → **1.6.5** — upgrades landed in v6.9.2 Wave 4 but the version table was never synced (INSTALLED.md was pinned to "latest" so no edit at the time).
- `ARCHITECTURE.md` header bumped v6.9.2 → v6.9.3.
- `SYSTEM_CHANGELOG.md` in live `~/.claude/` was missing the 6.9.2 entry — synced from mirror to repair drift.

Verification: smoke test 70/70 HEALTHY, G-ERR-014 regression guard verified with positive + negative cases, `bash -n` clean on smoke-test.sh.

---

## [6.9.2] — 2026-04-24 (thorough review fix pass — all 6 waves)

### Fix / upgrade / improve — drift repair since v6.9.1

A third ULTRATHINK review audited the system and surfaced 17 findings (6 HIGH, 6 MEDIUM, 4 LOW). All six waves landed. Verification: skill-count validator green (76 across all 4 sources), smoke test 69/69 HEALTHY.

**Wave 1 — Public repo sync + retention safety**
- H1: Hackathon workflow skill synced to public repo — `skills/hackathon/` (SKILL.md + references/ + templates/), `commands/hackathon/*.md` (10 sub-commands), plus CLAUDE.md + REFERENCE.md registry updates. Landed only in live `~/.claude/` before this pass.
- H3: `hooks/session-stop.sh` §5 plan retention now honors a `<!-- keep -->` first-line marker — plans with that marker are exempt from the "keep 5 most recent" archival rule. ScrapePipe Phase-1 plan (`help-me-create-this-melodic-boot.md`) restored from archive and marked to survive indefinitely.

**Wave 2 — Skill registry consolidation**
- H2: Four orphaned skills added to `skills/ACTIVE-DIRECTORY.md` — SK-108 Hackathon Workflow, SK-109 Graphify (Mixed-Corpus), SK-110 Handoff, SK-111 Audit. (Plan originally proposed SK-090..SK-093 but those IDs were already in use.)
- H2 follow-up: Duplicate Skills Registry block removed from `CLAUDE.md` — ACTIVE-DIRECTORY.md is now the single source of truth. Runtime routing sentences retained in CLAUDE.md so the Skill tool still dispatches on `/graphify`, `/handoff`, `/audit`, `/hackathon:*`.
- L1: `SYSTEM_VERSION.md` drift repair — version 6.9.1 → 6.9.2, CLI 2.1.104 → 2.1.118, Hooks 14 → 24, Commands 48 → 58, Skills on disk 105 → 124, Skills in ACTIVE-DIRECTORY 72 → 76. ACTIVE-DIRECTORY.md header count synced.

**Wave 3 — Path bug investigation + orphan cleanup + preview health**
- H6: Root cause identified for `C:\c\Users\leooa\...` double-drive-prefix ENOENTs — `node -e` scripts that embed Unix-style `/c/Users/...` paths as literal strings. Node on Windows resolves them against the current drive, not as absolute POSIX paths. Documented as `G-ERR-014` in `topics/KNOWLEDGE-PAGE-3-errors.md` with correct/incorrect examples so future sessions avoid the antipattern. Not a hook bug — hooks themselves use `os.homedir()` and `path.join` correctly.
- H5: Orphan project transcript dirs `projects/C--/` (Mar 30) and `projects/C--Users-leooa/` (Feb 11) moved to `/c/tmp/trash/2026-04-24-orphan-projects/` per "never rm" rule.
- H4: `logs/health-suppress.json` zeroed out (`{}`) so new Bash/Read failures surface freshly. `preview_screenshot` recovery requires a project-scoped session (`~/projects/atlas-claude/` or anniversary site) — cross-scope preview start from `~/.claude/` would violate the session-scope rule. Noted for next project session.

**Wave 4 — Tool updates + cache hygiene**
- M1: `better-ccflare` 3.4.0 → 3.4.13, `tdd-guard` 1.4.0 → 1.6.5 via `npm install -g`. `INSTALLED.md` already pinned to "latest", no version edit needed.
- M3: Stale caches relocated to `/c/tmp/trash/2026-04-24-stale-caches/`:
  - `telemetry/1p_failed_events.*.json` × 3 (2 from 2026-03-28, 1 from 2026-04-18)
  - `stats-cache.json` (45+ days stale, 2026-03-09)
  - `mcp-needs-auth-cache.json` left in place (self-maintained by Claude Code, recent mtimes)

**Wave 5 — Retention automation + MCP accuracy**
- M4: `hooks/session-start.sh` §7i extended with snapshot prune (7-day `mv` to `/c/tmp/trash/atlas-action-graph-snapshots/`, 30-day hard delete).
- M6: `hooks/session-start.sh` §7j added — transcript rotation: gzips `projects/*/*.jsonl` > 7 days old AND > 1MB; moves resulting `*.jsonl.gz` > 30 days old to `/c/tmp/trash/claude-transcripts/`.
- M2: `hooks/session-start.sh` §7k added — plugin skill-pack freshness check with weekly nag state (`cache/plugin-skill-nag-last`); surfaces top-5 stale packs when any `plugins/*/skills/` dir has mtime > 14 days.
- M5: `ARCHITECTURE.md` §MCP Servers updated — Obsidian removed from bundled MCP_DOCKER list with explicit degraded note (14 failures 2026-04-09 → 2026-04-10) pointing users to filesystem tools against `~/Documents/Wiki/`.

**Wave 6 — Polish**
- L2: `ARCHITECTURE.md` removed-services line now cross-references `memory/feedback_applitools_trial.md` so the "14-day trial, not free-tier" knowledge travels with the removal note.
- L3: `hooks/cctools-safety-hooks/bash_hook.py` gained a `_bump_counter()` telemetry layer — increments `logs/safety-hook-counts.json` atomically per check fire (block + ask decisions, with timestamp). Verified: benign command leaves counts untouched; `rm -rf /` correctly increments `check_rm_command.block`. Fail-open, no hook behavior change.
- L4: `REFERENCE.md` at 19.6KB, under the 25KB split threshold — no action.

---

## [6.9.1] — 2026-04-20 (remediation pass 2)

### Post-v6.9.1 audit → 32-finding remediation across 5 waves

A second ULTRATHINK review ran three parallel Explore agents against the post-v6.9.1 state (git HEAD `40ac1a8`). 32 findings surfaced (0 critical, 3 HIGH, 10 MEDIUM, 11 LOW, 8 INFO). All resolved in one pass with zero deferred items, per the user's "perfect sync and harmony" directive.

**Wave 1 — Safety-critical fixes**
- H1: Removed duplicate `rm_block_hook.py` registration from `settings.json` — the hook was already imported by `bash_hook.py`, so every Bash call ran the rm check twice
- H2: `hooks/README.md` rewritten — documented `bash_hook.py` as the unified gate running 6 blockers (rm, git_add, git_checkout, git_commit, env_file, secret-patterns), replacing the fictional "opt-in/unregistered" framing that contradicted actual runtime behavior
- M1: Removed dead `storybook`/`openapi`/`applitools` references from `CLAUDE.md` and `REFERENCE.md` (removed from registries in v6.9.0/v6.9.1 but still listed as canonical)
- M5: Synced the live `CLAUDE.md` "Research Before Acting" section (14 lines) to `~/projects/atlas-claude/` so the repo mirrors live state
- M7: PreToolUse graph-hint hook: changed malformed `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"..."}}` to top-level `{"additionalContext":"..."}` — output format was silently invalid under the inject-context contract

**Wave 2 — Version propagation & count truth**
- M2: Bumped version to 6.9.1 everywhere it was stuck at 6.9.0 — `SYSTEM_VERSION.md` header + metadata, `ARCHITECTURE.md` header, `README.md` badge
- M3: Fixed stale Knowledge Store counts in `ARCHITECTURE.md` (28/16/9 → 29/17/12)
- M4: `ACTIVE-DIRECTORY.md` + `SYMLINKS.md` corrected from 98 dirs/30 symlinks → 105/37; added 7 missing expo skills to the symlink list (data-fetching, expo-api-routes, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui)
- L6: Commands count updated from 43 → 48 (22 top-level + 21 flow + 5 plugin) in README badge, prose, and ASCII tree

**Wave 3 — Hook & settings hygiene**
- M8: Added Python-tmp-aware cleanup for `allow-git-*` flag files in `session-start.sh §8` — existing cleanup only touched Node's tmpdir, leaving Python's `/tmp/claude/allow-git-*` to accumulate unboundedly across sessions
- M9: Added dedup guard + test-session filter to `atlas-action-graph.js` `statsRollup()` — prevents the 4x duplicate rows observed for session `e2b2be95` and skips `verify-*`/`test-*`/`smoke-*` session IDs from polluting production stats
- L1: Removed stale `rm` permissions from `settings.local.json` (`TRASH-cleanup`/`TRASH-FILES.md` targets no longer exist, and the perms contradicted the rm-block hook)
- L2: Fixed double-slash paths `Read(//tmp/**)` / `Read(//c/Users/leooa/**)` in `settings.local.json`
- L5: Confirmed CLAUDE.md dated section headers already cleaned in Wave 1 M1
- L8: Documented the `medium` hook profile in `hooks/lib.js` comment (comment listed only `minimal|standard` despite `medium` being defined in `HOOK_PROFILES`)

**Wave 4 — Skill & plan hygiene**
- M6: Added 6 previously-unlisted skills to `ACTIVE-DIRECTORY.md` — `SK-102` Impeccable (Craft), `SK-103` Nano Banana (Gemini Image), `SK-104` Design-Taste Frontend, `SK-105` LinkedIn Poster, `SK-106` Project Init, `SK-107` Remotion. Total active: 66 → 72. All four source-of-truth files re-aligned at 72 via `validate-skill-counts.js`
- L3: Archived 3 completed ATLAS plans to `plans/archive/` (idempotent-raccoon, stateless-lamport, synthetic-starfish). `help-me-create-this-melodic-boot.md` left in place — belongs to separate ScrapePipe project
- L10: Corrected `vaul` maintenance claim in `G-PREF-007` — actually actively maintained by emilkowalski through 2025–2026 (was marked "officially unmaintained", would have steered away from a legitimate library)

**Wave 5 — Live-state refresh**
- H3: Confirmed `firecrawl` already ✓ Connected (env var wired); `vercel` remains OAuth-pending (requires interactive sign-in). Post-`.mcp.json` parser fix in v6.9.0, the revival is more complete than previously documented: 20 servers now connect cleanly (13 user + 7 project), 8 OAuth-pending, 3 env-gated. `ARCHITECTURE.md` MCP section rewritten to reflect verified 2026-04-20 state
- L11: Rebuilt CRG graph for atlas-claude repo (`uvx code-review-graph update` — 13 files updated, 17 nodes, 88 edges, FTS index rebuilt with 3276 rows). Was 39h stale at v6.9.1 commit time
- M10: Refreshed `Documents/Wiki/wiki/source/atlas-system.md` to v6.9.1 snapshot — includes CRG integration, auto-history-check, new MCP table, v6.9.1 hook profiles, skill registry entry for graphify/handoff/audit. Was 10 days stale (2026-04-10)

**Final**
- `/health` passed clean: all 4 skill-count sources agree at 72, 0 stale knowledge entries, 0 recurring error patterns, 0 pending reflections, MEMORY.md healthy
- `project_mcp_revival.md` index line updated to reflect current 20-connected state

## [6.9.1] — 2026-04-18
### System review — drift repair, safety enforcement, hygiene pass

Five-wave systematic audit + fix of the drift that accumulated during the
v6.7 → v6.9 ship cycle. Every finding resolved in one pass; no deferred items.

**Wave 1 — Safety & source-of-truth**
- Registered `cctools rm_block_hook.py` on PreToolUse/Bash — enforces the
  CLAUDE.md "never use `rm`, always `mv` to trash" rule that had been
  aspirational since the hook was never wired
- `hooks/README.md`: documented the four remaining opt-in safety hooks
  (`git_add_block`, `git_checkout_safety`, `git_commit_block`,
  `env_file_protection`) — on disk but intentionally unregistered; per-project
  activation path documented
- `SYSTEM_VERSION.md`: bumped to v6.9.1 with correct counts (hooks 14,
  rules 3, `last_health_check` 2026-04-18)
- `ARCHITECTURE.md`: header bumped v6.8.1 → v6.9.1

**Wave 2 — Public README regenerated from truth**
- Badges: version `2.5.0` → `6.9.0`, skills `282` → `66_active`, hooks
  `18` → `14`, added commands badge, Claude Code `opus_4.6` → `opus_4.7`
- Architecture section rewritten to match the current three-layer persistence
  model (Memory / Knowledge Store / Atlas KG) and real hook roster
- Skill-count unified across all four sources (`SYSTEM_VERSION`,
  `ARCHITECTURE`, `ACTIVE-DIRECTORY`, `REFERENCE`) at 66

**Wave 3 — Hook & settings hygiene**
- PreToolUse graph-hint hook: added `timeout: 2` (was unbounded)
- Nested `.claude/settings.json` (empty `{}`): added `_comment` explaining
  its placeholder role so it doesn't look abandoned
- `scheduled-tasks@claude-plugins-official` enabled so CLAUDE.md Auto Mode
  language becomes truthful
- PostToolUse auto-formatter: added Python (`ruff format`) and Rust
  (`cargo fmt`) fallbacks alongside the existing dart/bun/npm chain

**Wave 4 — Cleanup & retention**
- Moved `bash.exe.stackdump`, `history.jsonl`, `TRASH-FILES.md` to `TRASH/`
- Added `*.stackdump` to `.gitignore`
- New plans-retention rule in `session-stop.sh` §5 — keeps 5 most recent,
  archives older to `plans/archive/`; ran once to archive 10 older plans
- `ACTIVE-DIRECTORY.md`: cross-referenced `SYMLINKS.md` and
  `archived-skills-manifest.json` so they stop looking orphaned
- `README.md`: now links to `examples/` as the starter-settings template

**Wave 5 — Upgrades & gaps**
- `better-ccflare` confirmed at 3.4.0, `tdd-guard` at 1.4.0; SYSTEM_VERSION
  stopped claiming upgrade available
- Statsig memory language softened — the server is registered in `.mcp.json`
  with an `_activate` command, so it's idle-by-design rather than "still pending"
- `post-tool-monitor.js` §6: Agent invocations now emit one line per call to
  `logs/subagent-stats.jsonl` (mirrors action-graph stats rollup pattern —
  gives visibility into subagent use without needing a SubagentStop event)
- `scripts/validate-skill-counts.js`: cross-source validator wired into
  `/health` §2 — fails loudly on drift across the four skill-count docs

**Verification**: `smoke-test.sh` 69/0/0, `health-validator.js` 0 stale,
`validate-skill-counts.js` green at 66.

## [6.9.0] — 2026-04-17
### Code-Review-Graph integration + MCP registry revival

Two days of infrastructure work consolidated: CRG promoted to the primary
code graph with auto-update wiring (2026-04-16), and the MCP registry
cleaned up and mass-revived to user scope (2026-04-17).

**Code-Review-Graph (CRG) integration — 2026-04-16**
- Installed CRG 2.3.2 via `uv tool install code-review-graph` + registered
  at USER scope via `claude mcp add -s user code-review-graph uvx ...`
  (stored in `~/.claude.json`, NOT `~/.claude/.mcp.json`)
- Tree-sitter graph over 23 languages; 30 MCP tools + 5 prompts; SQLite WAL;
  blast-radius analysis; 8.2× token reduction vs Glob/Grep
- `CLAUDE.md` Auto-Graph-Navigation: CRG MCP tools (`get_minimal_context`
  → `query_graph` → `get_impact_radius`) preferred over Glob/Grep when
  `.code-review-graph/graph.db` exists; graphify retained as fallback for
  mixed corpora (docs + papers + images); offer `uvx code-review-graph
  build` for 20+ code-file projects with no graph
- `settings.json` PostToolUse: `Write|Edit|MultiEdit` fires backgrounded
  `uvx code-review-graph update` (3s timeout, fail-open, only if graph.db
  exists) — graph stays current without blocking edits
- `settings.json` PreToolUse graph-hint: expanded to route between CRG
  and graphify based on which graph file is present
- `REFERENCE.md` / `INSTALLED.md` / `ARCHITECTURE.md`: CRG row added,
  Codebase Knowledge Graph skill described as CRG/graphify router
- Do NOT run `code-review-graph install` — it clobbers ATLAS skills/hooks/
  CLAUDE.md. ATLAS wires CRG manually.

**New CLAUDE.md section — Session Scope**
- Pre-task check: does the task's subject matter match the CWD's identity?
  A task can be out of scope even when no path is mentioned (finance
  question in an anniversary-website repo → domain mismatch)
- Applies at session start too: handoffs, action-graph carryovers, and
  scheduled-task prompts must match CWD before acting on carried-over work
- Prevents accidental cross-project work when stale context references a
  different repo

**MCP registry revival — 2026-04-17**
- Mass promotion of 12 dormant entries from `.mcp.json` to USER scope
  (`claude mcp add -s user ...`): `shadcn`, `prisma`, `expo`, `mobile`,
  `posthog`, `cloudflare`, `linear`, `context-mode`, `lighthouse`, `heroui`,
  `aceternity`, `tauri-mcp`
- Latent parse bug fixed: `_comment_*` keys must live at the top level,
  NOT inside `mcpServers` — strict parser had been silently blocking the
  whole `.mcp.json` object from loading before the fix
- Package + URL corrections: `netlify` (`@anthropic-ai/netlify-mcp-server`
  → `@netlify/mcp`), `vercel` (`https://mcp.vercel.com/mcp` →
  `https://mcp.vercel.com`); both now connect
- 7 servers remain project-scoped (only visible from CWD=~/.claude/):
  `supabase`, `resend`, `sentry`, `firecrawl`, `21st-dev`, `maestro`,
  `netlify` — each entry carries `_activate` metadata showing the exact
  `claude mcp add -s user -e KEY=...` command to promote
- OAuth-pending (first-use sign-in): `cloudflare`, `linear`, `expo`,
  `posthog`, `vercel`, `statsig`, `plugin:asana:asana`, `plugin:figma:figma`
- Failing — needs API key only: `stripe` (`STRIPE_SECRET_KEY`), `upstash`
  (`UPSTASH_EMAIL` + `UPSTASH_API_KEY`)
- Failing — plugin-bundled: `plugin:github:github` needs
  `GITHUB_PERSONAL_ACCESS_TOKEN` env var
- Removed as not standalone-invocable: `storybook` (addon, needs project),
  `openapi` (requires `--spec` arg)
- `ARCHITECTURE.md` MCP Servers section: rewritten with the two-registries
  model + current state enumerated
- `INSTALLED.md`: registration note explains both registries; always run
  `claude mcp list` from CWD=~/.claude/ to see the full picture

**Action-graph Tier-3 refinements**
- `hooks/atlas-action-graph.js`: `carryoverDigest` hot-set cap by count
  (not tokens) via `hotSet(sid, 1_000_000)`
- `hooks/session-start.sh` §7i: carryover + `pruneOldSessions(7)` on
  every SessionStart so stale state files auto-trim
- `hooks/session-stop.sh` §0: `statsRollup` runs before handoff so a
  rollup failure can't corrupt handoff state
- `scripts/auto-continue.sh`: minor updates

**Runtime state added to .gitignore**
- `atlas-action-graph/` — per-session JSONL + state.json files
- `atlas-kg/` — entities.json + triples.json + snapshots
- `handoffs/` — session-end handoff markdown per CWD
- `.code-review-graph/` — CRG `graph.db` + caches
- `graphify-out/` — graphify `graph.json` + reports + HTML viewer

## [6.8.0] — 2026-04-14
### Stateful action-graph intelligence layer — Tier 1 + 2 + 3

Cross-session working-memory tracker that logs every Read/Glob/Grep with priority scoring, detects reference usage from tool inputs via a 3-tier matcher, surfaces duplicate-read advisories, survives compaction via a PreCompact digest, and carries the top-N hot set into the next session at SessionStart.

**Tier 1 — Baseline logger + scoring**
- New `hooks/atlas-action-graph.js` — persistent per-session action graph with `log`/`check`/`hot`/`digest`/`query`/`stats`/`mark-used`/`pin`/`unpin` CLI commands
- Per-session JSONL log + JSON state file under `atlas-action-graph/<session>.{jsonl,state.json}`
- Priority formula combining read count, recency, and pin state
- Fail-open lazy loader pattern — `lib()` only resolves on first use, catches everything
- Gated by `isHookEnabled('atlas-action-graph')` via profile lookup
- Wired into `post-tool-monitor.js` — PostToolUse hook logs Read/Glob/Grep targets

**Tier 2 — Reference scanner + compaction survival**
- `post-tool-monitor.js` scans Write/Edit/Bash/Agent `tool_input` values for substrings matching previously-logged paths, bumping `used_count` via a 3-tier `markUsed`: direct key → canonical path equality → substring containment with a path-specificity guard
- Duplicate-read advisory — when a file gets read twice without any write, `context-guard.js` surfaces a one-line hint suggesting reuse
- Writer-side `used_count` cap invariant (not caller-side) — single source of truth
- `compactDigest(sessionId)` — produces ~2K-token hot-set digest consumed by `scripts/progressive-learning/precompact-reflect.sh` at PreCompact
- State-file snapshots in `atlas-action-graph/snapshots/` for post-compact restoration
- Verified self-referentially — auto-compact preserved the edit context across the boundary

**Tier 3 — Cross-session carryover + stats rollup + docs**
- `statsRollup(sessionId)` — writes one JSONL line per session to `logs/action-graph-stats.jsonl` with unique_targets, total_retrievals, duplicates, pinned, approx_tokens, hot_set size/tokens, mean_priority
- `carryoverDigest(sessionId, n=5)` — top-N hot-set formatter used at SessionStart; reuses `hotSet(sid, 1_000_000)` to cap by count not tokens
- New CLI commands: `rollup <session>` + `carryover <session> [--n=5]`
- `hooks/session-stop.sh` §0 — rollup runs before handoff so a rollup failure can't corrupt handoff state
- `hooks/session-start.sh` §7i — carryover + prune block that picks the most-recent `*.state.json` under 48h, emits the digest, and runs `pruneOldSessions(7)` on every SessionStart
- `CLAUDE.md` — new `Auto-Action-Graph` subsection describing the full lifecycle
- Pre-existing doc path fixes: `ARCHITECTURE.md:44` and `hooks/README.md:116` both wrongly placed `precompact-reflect.sh` in `hooks/` instead of `scripts/progressive-learning/`

**Verification — 8/8 steps passed**
- Syntax checks on all modified hooks
- `statsRollup` unit test — seeded reads, ran `rollup $SID`, confirmed JSONL append with expected fields
- `carryoverDigest` unit test — confirmed `top N/M` header + bullets + closing hint
- `session-stop.sh` §0 wiring — JSONL grew by exactly 1 line, handoff still written
- `session-start.sh` §7i live production output — real files at real priorities
- Prune sweep — aged a state file to 10d, confirmed prune removed it while keeping fresh files
- Cross-session smoke test — next SessionStart automatically emitted `ACTION-GRAPH CARRYOVER: previous session top 5/41` with real files at priorities 0.69–0.78
- Doc sanity — all operative `precompact-reflect.sh` path references fixed

**Files**: 1 created (`hooks/atlas-action-graph.js`), 7 modified (`CLAUDE.md`, `ARCHITECTURE.md`, `hooks/README.md`, `hooks/post-tool-monitor.js`, `hooks/session-start.sh`, `hooks/session-stop.sh`, `scripts/progressive-learning/precompact-reflect.sh`)

**Note**: `SYSTEM_VERSION.md` was stale at 6.6.1 through the v6.7.0 ship (commit `14e4b01` forgot to bump it). Jumping 6.6.1 → 6.8.0 here; v6.7.0 changelog gap is tracked as a separate cleanup task.

---

## [6.7.0] — 2026-04-12
### 2 new hooks, health dashboard, 4 new commands, 2 new skills, README rewrite

**New hooks**
- `hooks/tsc-check.js` — TypeScript-only type checking; reads `file_path` from stdin and only runs `tsc --noEmit` on `.ts/.tsx/.mts/.cts` edits (replaces blanket type-check on every Write/Edit)
- `hooks/pre-commit-gate.js` — build/test reminder surfaced before `git commit` runs

**New script**
- `scripts/health-dashboard.js` — consolidated system health view across hooks, stats, KG, memory

**New slash commands**
- `/api-design` — design and generate API from spec
- `/db-schema` — design and validate database schema
- `/new-desktop-app` — scaffold Tauri desktop project
- `/new-mobile-app` — scaffold Expo + Supabase mobile project

**New skills**
- `skills/audit/` — systematic codebase audit with wave-based verified fixes
- `skills/handoff/` — end-of-session build/test/commit/push/handoff automation

**Hook overhauls (10)**
- `atlas-kg`, `atlas-extractor`, `context-guard`, `lib`, `post-tool-monitor`, `session-start`, `session-stop`, `statusline`, `tool-failure-handler`, plus `hooks/README.md` refresh
- `scripts/progressive-learning/precompact-reflect.sh` — reflection prompt refinements

**Core docs refreshed**
- `CLAUDE.md`, `REFERENCE.md`, `ARCHITECTURE.md`, `INSTALLED.md`, `settings.json`
- `README.md` completely rewritten
- `skills/ACTIVE-DIRECTORY.md`, `skills/ARCHIVE-DIRECTORY.md`, `design-audit`, `trailofbits-security`

**Files**: 32 files changed, 1873 insertions(+), 540 deletions(-) (commit `14e4b01`)

---

## [6.6.1] — 2026-04-11
### Auto-System-Docs workflow
- Added `Auto-System-Docs` to CLAUDE.md Automatic Workflows — system infrastructure changes now auto-trigger documentation updates (ARCHITECTURE.md, hooks/README.md, SYSTEM_VERSION/CHANGELOG, INSTALLED.md) as part of the Deliver phase
- Closes the gap where doc updates only happened when explicitly requested

## [6.6.0] — 2026-04-11
### System Critique Fixes — 5 targeted improvements across hooks, persistence, skills

**tsc-check: smart TypeScript checking**
- New `hooks/tsc-check.js` — reads file_path from stdin, only runs `tsc --noEmit` on `.ts/.tsx/.mts/.cts` files
- Replaces blanket `(test -f tsconfig.json && npx tsc --noEmit) || true` that fired on every Write/Edit (including CSS, MD, JSON)
- Timeout reduced 30s → 15s; registered in hook profiles via lib.js
- Non-TS edits now skip type-checking entirely (was: 30s block on every save)

**Persistence layer boundaries defined**
- `session-stop.sh`: removed `worked_on` (branch) and `last_commit` captures from atlas-kg — git data belongs in git
- Pruned 22 stale git-derived triples from `atlas-kg/triples.json`
- `ARCHITECTURE.md`: added "Persistence Layer Boundaries" table — Memory vs Knowledge Store vs Atlas KG with clear "stores" / "does NOT store" columns

**MCP health classification**
- `tool-failure-handler.js`: MCP-specific failure detection — `ECONNREFUSED`/`ECONNRESET`/`spawn ENOENT` on `mcp__*` tools now produce `MCP SERVER DOWN:` messages with actionable advice
- MCP timeouts classified separately from generic timeouts
- Health records tagged with `is_mcp: true` for downstream grouping
- `session-start.sh`: health summary now groups MCP tools separately with "consider disabling in .mcp.json" advice

**Settings dedup**
- Emptied `.claude/.claude/settings.json` — duplicate graphify PreToolUse hook already in root `settings.json`

**Skill archive (14.2MB, 934 files archived)**
- Moved `cc-devops/` (7.7MB, 762 files) and `ckm/` (6.5MB, 172 files) to `skills/skills-archive/`
- Both had 0 active skill references; all skills already in ARCHIVE-DIRECTORY metadata
- Updated INSTALLED.md, ARCHITECTURE.md

**CLAUDE.md process fixes**
- Added "Auto-History-Check" workflow: review/audit tasks must check git log before surfacing findings
- Strengthened "Review vs Implement" rule: mandatory git history check before presenting findings

**Files**: 1 created (tsc-check.js), 8 modified, 2 directories archived

---

## [6.5.0] — 2026-04-08
### Deep Audit — 8 fixes across 13 files

**Atlas KG improvements**
- Predicate-based entity type inference (0 unknowns)
- `invalidateByPredicate` + `prune` commands added
- session-stop now invalidates old `last_commit` triples before writing new ones

**Tool health upgraded**
- Timestamped failure arrays + 48h-window health summary (replaces meaningless all-time counters)

**Hook fixes**
- PreCompact: JSON serialization via node (fixes silent failure on special chars)
- Context guard: `Skill` added to ALWAYS_ALLOWED tools
- Strict hook profile removed (dead code, never used)
- Auto-continuation: Windows prompt via temp file (fixes cmd.exe special char breakage)

**Testing & monitoring**
- Smoke test: +2 sections (KG integrity, memory system validation)
- Statusline: fallback partial-session matching for todo files

---

## [6.4.0] — 2026-04-07
### System Effectiveness Audit — fix 12 underutilized/broken components

**session-start.sh upgraded with comprehensive rotation**
- Plans: keep last 15 by mtime (was: unlimited, 99 files accumulated)
- Session-env dirs: 7-day retention (was: 30-day, 90 dirs accumulated)
- Todos: 3-day retention (was: 30-day, 44 files accumulated)
- Cache efficiency files: keep last 10 (was: 7-day, 30+ files)
- Scratchpad: 14-day retention for files and dirs (new)
- Log rotation: line-count cap at 500 lines (was: 2MB byte-size only, never triggered)

**Atlas KG improved**
- Invalidated 2 stale triples (version v6.1.0, pruned_skills_to 65)
- session-stop.sh now captures: last commit subject (git), session directory (non-git)
- Non-git sessions (like ~/.claude/) now produce KG triples instead of silently skipping

**Skill tracking reset**
- skill-stats.json and skill-events.jsonl were phantom data — no hook ever wrote to them
- Reset both files; awaiting proper instrumentation before tracking resumes

**Scheduled tasks consolidated 7 → 3**
- Kept: weekly-dream, weekly-maintenance, monthly-evolution-report
- Removed: weekly-cleanup-scan (now in session-start.sh), weekly-memory-maintenance (redundant with dream), skill-autofix + skill-usage-audit (depend on broken tracking)

**Waste purged**
- TRASH emptied: evolution.md, conflicts.md, evolution-reports/, memory-sessions/, 4 backup files (~165KB)
- 85 stale plan files deleted (1.1MB)
- 51 old session-env dirs, 44 stale todo files, 18 cache files, 800 log lines trimmed

## [6.3.0] — 2026-04-07
### Memory Restructuring — realign auto-memory with intended design

**Memory audit found the system misused as documentation store instead of user/project/feedback memories.**

**Moved out of memory/ (not memories — system docs)**
- `system_architecture.md` → `~/.claude/ARCHITECTURE.md`
- `installed-resources.md` → `~/.claude/INSTALLED.md`

**Deleted (dead weight)**
- `evolution.md` — meta-tracking with 3 saves, 0 promotions, 0 maturity milestones
- `evolution-reports/` — single report from March, superseded by SYSTEM_CHANGELOG
- `conflicts.md` — empty template, never used in 30+ days
- `sessions/` — 8 stale March session logs, replaced by handoff system

**Hook fix**
- `session-start.sh`: Removed conflicts.md reference (§1 simplified)

**New memories**
- `user_profile.md` — first actual user-type memory (role, stack, preferences)

**MEMORY.md rewritten** — clean 4-section index (User/Feedback/Project/Reference), removed Knowledge Store pointers (have own index), System Notes (duplicated changelog), Atlas docs (in ARCHITECTURE.md)

**Files**: 2 moved, 4 deleted (dirs+files), 3 modified, 1 created

---

## [6.2.0] — 2026-04-07
### System Review — pruning, hygiene, and hardening

**Skill Pruning (78 → 65 active)**
- Archived 13 skills: redundant subsets (FS-003, FS-065, SK-032, SK-033, CE-003), niche/novelty (SK-010, SK-050, SK-075), meta/workflow overlap (SK-038, SK-041, SK-072, SK-073, SK-074)
- Updated ACTIVE-DIRECTORY.md, ARCHIVE-DIRECTORY.md, REFERENCE.md, MEMORY.md

**Data Hygiene**
- Emptied TRASH directory (538KB of pre-rebuild artifacts, corrupted backups, test data)
- Trashed superseded memory/INDEX.md (13KB, replaced by KNOWLEDGE-DIRECTORY.md)
- Cleaned .claude.json backup accumulation in backups/ (kept only most recent)

**Automation Improvements**
- Added TRASH auto-cleanup to session-start.sh §7a (7-day retention policy)
- Added .claude.json backup rotation to session-start.sh §9 (keep 2 most recent)
- Wired session-stop.sh to feed Atlas KG with project/branch triples on session end
- Seeded Atlas KG with baseline system facts (8 entities, 5 triples)

**Hook Hardening**
- Added section [11] to smoke-test.sh: 8 functional tests for critical hooks
  - context-guard: Read allowed, .env blocked, AWS key blocked
  - post-tool-monitor: clean stdin processing
  - tool-failure-handler: clean stdin processing
  - lib.js: require-able without errors
  - atlas-kg.js: require-able with working queries
  - statusline.js: runs without crash
- All 60 tests passing (was 58/60 before path fix)

**Files**: 10 modified, 1 trashed, 538KB freed

---

## [6.1.0] — 2026-04-07
### Living Atlas Audit — dead weight purge, orphaned refs fixed, version sync

**Dead Weight Purge (22 files/dirs, ~488KB)**
- Deleted: TRASH/__pycache__ + active __pycache__ in cctools-safety-hooks
- Deleted: 5 corrupted .claude.json backups (March artifacts)
- Deleted: 10 pre-rebuild backup files (v4.0 artifacts, superseded by weekly backups)
- Deleted: cache/changelog.md (193KB, superseded by SYSTEM_CHANGELOG.md)
- Deleted: 2 test efficiency cache files
- Deleted: broken debug/latest symlink

**Orphaned Reference Fixes**
- `scripts/health-validator.js`: Removed dead `registryIntegrity()` function (referenced deleted REGISTRY.md since v4.0.0)
- `atlas-kg/entities.json`: Fixed 4 entities with `type: "unknown"` → proper types (component/project)

**Version Sync (4 files)**
- Aligned to v6.1.0: SYSTEM_VERSION.md, system_architecture.md, SYSTEM_CHANGELOG.md, MEMORY.md

**Files**: 4 modified, 22 trashed (via TRASH-FILES.md)

---

## [6.0.0] — 2026-04-07
### Atlas Intelligence Layer — temporal KG + heuristic extractor

**New: `hooks/atlas-kg.js`** — Temporal Knowledge Graph
- JSON-backed entity-relationship graph (entities.json + triples.json in `~/.claude/atlas-kg/`)
- Typed triples with temporal validity (valid_from/valid_to) and confidence scoring
- Query by entity, relationship, time window; timeline generation; recent facts; summary
- CLI: `node atlas-kg.js {add|query|invalidate|timeline|recent|summary|stats}`
- Zero dependencies (pure Node.js)

**New: `hooks/atlas-extractor.js`** — Heuristic Memory Auto-Extractor
- Pure regex classifier: free text → G-PAT/G-SOL/G-ERR/G-PREF/G-FAIL categories
- Engineering-focused marker sets with confidence scoring and disambiguation
- CLI: `node atlas-extractor.js {extract|extract-stdin|compact}`
- Zero dependencies (pure Node.js)

**Hook Integration (3 points)**
- `session-start.sh` §6: injects KG summary on session wake-up
- `session-stop.sh` §1b: auto-extracts memory candidates from handoff content
- `precompact-reflect.sh`: KG summary + extractor hint preserved before compaction

**Curation note**: Extracted from mempalace (12 components). Only 2 taken — the rest rejected as overengineered, dependency-heavy, or duplicating existing systems.

**Files**: 2 new hooks, 2 modified hooks (session-start.sh, session-stop.sh)

---

## [5.9.0] — 2026-04-07
### ULTRATHINK Audit — version sync, documentation drift fix, cleanup

**Version & Count Sync (7 files)**
- Aligned version to v5.9.0 across: SYSTEM_VERSION.md, SYSTEM_CHANGELOG.md, system_architecture.md, REFERENCE.md, MEMORY.md
- Fixed skill count drift: 65/70 → 78 (15 Core + 63 Available) in REFERENCE.md and system_architecture.md
- Fixed knowledge count drift: 63 → 66 entries (28 G-PAT) in system_architecture.md

**Smoke Test**
- Added ACTIVE-PAGE-3-native-crossplatform.md verification (gap since v5.8.0)

**Cleanup**
- Moved 2 orphaned __pycache__ directories to TRASH
- Reset stale tool-health.json streak counters
- Removed dead MEMORY.md reference to non-existent sessions/sessions-index.md

**Files**: 7 modified, 2 directories trashed

---

## [5.8.0] — 2026-04-06
### Native Engine — 5 new skills, Universal Conductor v2.0, ACTIVE-PAGE-3
- Added SK-088 (Tauri Desktop), SK-089 (Hardware Bridge), SK-090 (Local-First), SK-091 (Edge Intelligence), SK-092 (Monorepo)
- SK-058 upgraded to Universal Conductor v2.0
- Created ACTIVE-PAGE-3 (native/cross-platform)
- Added 5 Fusion Blueprint templates, expo-app template updated to SDK 54
- Skills: 65 → 70

---

## [5.7.0] — 2026-04-06
### Vanguard Web Architecture — 5 new skills, SK-057 archived
- Added SK-083 (Vanguard), SK-084 (CSS-First UI), SK-085 (Streaming & Cache), SK-086 (AI-Native UI), SK-087 (Build Pipeline)
- SK-057 (L100 Web Orchestrator) archived — superseded by SK-083
- SK-030/054 upgraded with new patterns
- Render Tiers, CSS-First principle, streaming pipeline
- Skills: 61 → 65

---

## [5.6.0] — 2026-04-06
### Final System Audit — dead file purge, rotation, hook profile consistency

**Dead File Purge (8 items)**
- Deleted scripts/TRASH/ directory (4 dead scripts + manifest) — missed by v5.5.0 cleanup
- Deleted empty directories: flow-knowledge/, memory/topics/
- Deleted orphaned scripts: self-repair.sh, precompact-flow-validate.sh (zero active references)

**Stale Reference Fixes**
- Fixed compact.md: removed references to deleted hooks (precompact-flow-validate.sh, post-compact-dream-check.sh)
- Fixed evolution.md: corrected "80 entries" → "63 entries" (stale from pre-v5.2.0 pruning)

**New Cleanup Mechanisms**
- session-start.sh: Added shell-snapshots rotation (>30 days, ~1.3MB reclaimed)
- session-start.sh: Added stale todos rotation (>30 days, ~1MB reclaimed)

**Hook Profile Consistency**
- statusline.js: Added isHookEnabled() gate (matches context-guard, post-tool-monitor, tool-failure-handler)
- lib.js: Added honest scope comment documenting which hooks respect profile settings

**Completed (v6.5.0)**: Legacy memory/INDEX.md migration — all 10 active files updated to use topics/KNOWLEDGE-DIRECTORY.md and KNOWLEDGE-PAGE-{1-5}.md. Commands: health, new-web, compact, analyze-mistakes, learn, done, reflect, init-memory, skill-review. Agents: flow-learnings-researcher. Skills: dream, self-evolve.

**Files**: 6 modified, 6 files deleted, 3 empty directories removed

---

## [5.5.0] — 2026-04-06
### Deep System Audit — version sync, dead file purge, data integrity

**Version Synchronization**
- Aligned version across 4 files: SYSTEM_VERSION.md, system_architecture.md, MEMORY.md, SYSTEM_CHANGELOG.md
- All now report v5.5.0 consistently

**Dead File Purge (12 items)**
- Deleted 4 TRASH directories + 4 TRASH-FILES.md manifests (root, hooks, skills, progressive-learning)
- Deleted `flow-knowledge/memory-bridge.yaml` — 21KB stale artifact referencing old individual-file knowledge system (58 broken paths)
- Deleted `skills/.candidates/` (empty), `hooks/__pycache__/`, `hooks/cctools-safety-hooks/__pycache__/`

**Data Integrity**
- Reset `logs/tool-health.json` — removed vestigial `total_calls` and `failure_rate_ema` fields from previous code versions
- Fixed MEMORY.md: skill count 59→61 (15 Core + 46 Available), version 5.2.0→5.5.0
- Fixed system_architecture.md: skill count 59→61

**Documentation**
- Updated REFERENCE.md: `strict` hook profile documented honestly as "currently identical to standard, reserved for future"
- Added SK-081 (Codebase Knowledge Graph) and SK-082 (Graph-Aware Code Review) to version history

**Files**: 5 modified, 12 deleted

---

## [5.4.0] — 2026-04-06
### Hook Modularity & Bug Fixes — shared lib.js, 6 bug fixes, cleanup

**New: `hooks/lib.js` — Shared Hook Utilities**
- Extracted duplicated helpers from 4 hook files into single reusable module
- Exports: `readJsonSafe`, `writeJsonSafe`, `appendLine`, `ensureDir`, `rotateIfLarge`, `loadThresholds`, `readStdin`, `blockTool`, `injectContext`, `paths`
- All hooks refactored to use lib.js — eliminated ~120 lines of duplicated code
- Cached threshold loading (single parse per process)

**Bug Fixes (6)**
- Fixed tool-failure-handler.js output format: was `hookSpecificOutput.additionalContext` (never surfaced), now top-level `additionalContext`
- Fixed session-stop.sh: session ID now parsed from stdin JSON instead of fragile `/tmp/` filesystem globbing
- Added error pattern TTL: session-start.sh prunes entries older than 7 days from error-patterns.json
- Added debug directory cleanup: session-start.sh deletes debug/*.txt files older than 14 days
- Fixed section numbering gap in session-start.sh (was 1-5, 7-8; now 1-8 sequential)
- Added REFERENCE.md pointer to CLAUDE.md Skills & Knowledge section (was orphaned)

**Cleanup**
- Trashed QUICK-REFERENCE.md (content in REFERENCE.md since v5.3.0)
- Trashed skills/PLAYBOOK-REFERENCE.md (content in REFERENCE.md since v5.3.0)
- Archived pre-v4.0 changelog entries to SYSTEM_CHANGELOG-ARCHIVE.md (main file: 383→~90 lines)

**Refactored hooks** (all use lib.js now):
- `context-guard.js` — cleaner with shared `readJsonSafe`, `appendLine`, `blockTool`, `readStdin`
- `post-tool-monitor.js` — extracted `detectFailure`, `logFailure`, `trackSuccess`, `checkContextUsage` functions
- `tool-failure-handler.js` — extracted `classifyFailure`, `updateToolHealth` functions + output format fix
- `statusline.js` — extracted `buildContextBar`, `findCurrentTask`, `getCallCount` functions

**Files**: 1 created, 10 modified, 2 trashed, 1 archived

---

## [5.3.0] — 2026-04-06
### System Audit & Upgrade — Bug fixes, hook improvements, context optimization

**Bug Fixes (7)**
- Created missing ARCHIVE-PAGE-7-document-media.md (6 skills had no loadable detail page)
- Fixed failure streak never resetting on success in post-tool-monitor.js (circuit breaker fired on non-consecutive failures)
- Fixed PostToolUse output format: was nested under `hookSpecificOutput`, now top-level `additionalContext`
- Removed phantom FS-001 (Python) reference from PLAYBOOK-REFERENCE.md
- Updated smoke-test.sh to check 7 archive pages (was 6)
- Cleaned 2 dead scripts from progressive-learning/ (session-start-check.sh, session-stop-flag.sh)

**Hook Upgrades**
- session-start.sh: Added health summary (surfaces recurring errors + unhealthy tools), log hygiene (rotates tool-failures.jsonl, cleans stale tmp/cache files)
- statusline.js: Added tool call counter from efficiency cache
- post-tool-monitor.js: Streak reset on success, correct output format

**Context Optimization**
- CLAUDE.md trimmed ~2KB: compressed Skills/Knowledge/MCP sections to minimal lookup pointers
- Merged QUICK-REFERENCE.md + PLAYBOOK-REFERENCE.md into single REFERENCE.md

**New Capabilities**
- scripts/session-metrics.sh: Human-readable report across all log files (sessions, errors, tool health, hook perf)
- smoke-test.sh: Added symlink validation, threshold config validation, hook executability checks, skill directory cross-reference
- hooks/README.md: Updated with correct output formats per hook type + log file mapping table

**Files**: 17 files modified/created, 2 dead scripts trashed

---

## [5.2.0] — 2026-04-06
### Prune & Consistency — Knowledge pruned, context thresholds widened, stale docs fixed
- Knowledge Store pruned from 80 to 63 entries (removed duplicates, overly-specific entries)
- Widened context thresholds for less aggressive warnings
- Fixed stale documentation references
- Unified version tracking in SYSTEM_VERSION.md

## [5.1.0] — 2026-04-05
### Resource Integration — 6 new skills, SK-005 upgrade, Context Mode MCP
- Added SK-075 (Canvas Design), SK-076 (Deep Research), SK-077 (Subagent-Driven Dev)
- Added SK-078/079/080 (Design Audit/Critique/Polish — design QA pipeline)
- SK-005 Frontend Design System upgraded with 7 reference modules from Impeccable
- Added 6 new G-PAT entries (027-032) from community sources
- Added Context Mode MCP server (FTS5+BM25 retrieval, 98% context reduction)
- Skills count: 53 → 59

## [5.0.0] — 2026-04-05
### System Overhaul — Self-contained CLAUDE.md, massive cleanup
- CLAUDE.md made self-contained: all 7 rule files merged inline, no external refs needed
- 4 separate task classification systems unified into single complexity scale
- Hooks reduced from 14 to 12 (removed keyword-detector.js at 0% apply rate, subagent-limiter.js)
- 88 dead files cleaned from disk
- Skills: 57 → 53 (6 archived, 3 deduplicated)
- Session tracking fixed: handoff writes, todo capture, auto-continuation
- Directory/Page architecture for both skills and knowledge

## [4.0.0] — 2026-04-05
### Pipeline Architecture — Directory/Page system, hooks consolidation
- Introduced Directory/Page architecture for skills (Active Directory + Pages, Archive Directory + Pages)
- Introduced Directory/Page architecture for knowledge (Knowledge Directory + 5 Pages)
- Consolidated hooks: post-tool-monitor.js replaces 4 separate PostToolUse hooks
- Consolidated context-guard.js merges security gate + context budget
- Created shared context-thresholds.json (single source of truth)
- Removed rules/ directory (all rules merged into CLAUDE.md)

---

> **Earlier versions (v2.0–v3.2)**: See `SYSTEM_CHANGELOG-ARCHIVE.md`
