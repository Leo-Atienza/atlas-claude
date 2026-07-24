# ATLAS System Architecture (v10.0.0)

## Configuration Architecture

1. **`~/.claude/CLAUDE.md`** — Slim core instructions (~9KB). Rules extracted to on-demand pages. Now references the consolidated brain at `<your-vault-path>/wiki/` (v8.0.0).

2. **Skills Directory/Page System** (53 active skill entries; see SYSTEM_VERSION.md "Skills counted three ways" for the full filesystem breakdown — `ACTIVE-DIRECTORY.md` is canonical):
   - `skills/ACTIVE-DIRECTORY.md` — Index of active skills (5 Core + 48 Available)
   - `skills/ACTIVE-PAGE-1-web-frontend.md` — Web, animation, design, testing, security skills
   - `skills/ACTIVE-PAGE-2-backend-tools.md` — Backend, deployment, workflow skills
   - `skills/ACTIVE-PAGE-3-native-crossplatform.md` — Native + cross-platform skills
   - `skills/ARCHIVE-DIRECTORY.md` — Archived skills by domain bundle (7 archive pages)
   - `skills/RULES-GIT.md` — On-demand git workflow rules
   - `skills/RULES-SECURITY.md` — On-demand security rules + triggers
   - `skills/RULES-TESTING.md` — On-demand testing rules
   - `skills/RULES-LOCAL-LLM.md` — On-demand local-LLM delegation triggers
   - `skills/RULES-SESSION-SCOPE.md` — On-demand session-scope rules

3. **Consolidated brain** (Obsidian vault at `<your-vault-path>/wiki/` — single source of truth as of v8.0.0):
   - `wiki/personal/` — about the user: profile, system overview, feedback, procedures, project-state, references, reflections, arcs (38 files)
   - `wiki/engineering/` — reusable technical knowledge in 5 monolithic markdown files: `patterns.md` (85), `solutions.md` (38), `errors.md` (75), `preferences.md` (12), `failures.md` (11). Total 221 entries — successor to retired `topics/KNOWLEDGE-PAGE-*`. (Counts per `cache/system-ground-truth.json`; the `knowledge` validator is authoritative — prefer the snapshot over these inline numbers if they ever disagree.)
   - `wiki/session-log/{handoffs,transcripts}/` — durable session history (20 handoffs migrated; transcripts populated by Stop hook)
   - `wiki/{concept,entity,source,synthesis,raw}/` — external-world knowledge (articles, papers, entities from research)
   - Local-only git: `<your-vault-path>/.git/hooks/pre-push` refuses all pushes with exit 1. Never `git remote add`.

4. **Reference**: `REFERENCE.md` — slash commands, MCP patterns, skill routing, DevOps generators

5. **Living Memory** — Retired 2026-05-14 (v8.0.0); consolidated into the vault. `lib-memory.js` and `memory-lifecycle.js` were deleted. The dead `require('lib-memory.js')` path in `drift-proposer.js` was removed in v8.2.0 (the entire `detectMemoryDrift` block is gone; the detectors array is now 4 live channels). Any remaining disabled stubs that referenced the SQL mirror (e.g. in `atlas-kg.js`) are being removed and never execute. Rollback infrastructure archived to `_archived/brain-consolidation-2026-05-15/` on 2026-05-15 (includes `brain-consolidation-pre-phase1-20260514-124017.tar.gz`). Historical reference: `plans/archive/brain-consolidation.md` + `wiki/personal/arcs/brain-consolidation.md`.

## Hooks

All Node hooks import `hooks/lib.js` for shared utilities. Config: `hooks/context-thresholds.json`.

| Event | Hook | Purpose |
|-------|------|---------|
| PreToolUse | context-guard.js | Duplicate-read advisory (Read) + security gate (Write/Edit/MultiEdit) + context budget (all expensive) |
| PreToolUse | cctools bash/file/env hooks | Safety hooks |
| PreToolUse | graph hint (Glob/Grep) | Suggest CRG MCP tools (`.code-review-graph/graph.db`) or graphify (`graphify-out/graph.json`) before broad search |
| PreToolUse | pre-commit-gate.js | Build/test reminder before git commit |
| PreToolUse | skill-usage-log.js (Skill) | Append `{ts, skill, cwd, session_id}` per invocation to `logs/skill-usage.jsonl` — feeds `/observe` section 3 + monthly `skill-usage-audit` (v7.0) |
| PreToolUse | pre-read-local-llm.js (Read) | **UNWIRED v8.14** (was disabled via ATLAS_DISABLED_HOOKS yet still spawning node on every Read — wiring removed from settings.json; file retained. Re-enable: restore the PreToolUse Read block + remove `local-llm-pre-reader` from ATLAS_DISABLED_HOOKS, per [[use-local-llm-actively]] if that intent wins.) Files ≥100 lines: call Ollama (`llama3.2:3b` default, 6s timeout) to summarise, **cache the result by path+mtime**, then inject as `additionalContext` before Claude reads (an unchanged file reuses its cached summary with no Ollama call — added 2026-06-04). `LOCAL_LLM_AGGRESSIVE=1`: block reads of large docs/configs (≥400 lines; read-only artefacts .jsonl/.log/.csv/.txt/.rst) and return summary only. Logs to `logs/local-llm-reads.jsonl`. Fail-open. |
| PreToolUse | path-validator.js (Read) | (1) Blind-test contamination guard — blocks reads of `plans/_blind-tests/**` unless `BLIND_TEST_OPERATOR=1` (legacy `WAVE_2_OPERATOR=1`); soft-warns when CWD is `~/.claude/`. (2) Path-not-found guidance — bounded fuzzy-match glob for the basename when file doesn't exist; gated by `ATLAS_DISABLED_HOOKS`. Merged 2026-05-15 — absorbed `wave-2-contamination-guard.js`. |
| PostToolUse | auto-formatter | Format on write |
| PostToolUse | tsc-check.js | TypeScript check (only .ts/.tsx files, 15s timeout) |
| PostToolUse | CRG auto-update (Write/Edit/MultiEdit) | Incremental `uvx code-review-graph update` if `.code-review-graph/graph.db` exists (backgrounded, 3s timeout, fail-open) |
| PostToolUse | post-tool-monitor.js | Context, efficiency, failure tracking + action-graph retrieval logging (Read/Glob/Grep/Write/Edit/MultiEdit/Bash/Agent) |
| PostToolUse | deletion-guard.js (Edit/MultiEdit) | Advisory when an edit's old_string contains a symbol definition (toString/method/function/CSS class) the new_string lacks — points at the CLAUDE.md deletion protocol; once per file per session (tmp marker); fail-open. (Added v10 F-13 — 2× JavaFX toString regression) |
| PostToolUseFailure | tool-failure-handler.js | Circuit breaker, tool health, MCP server classification |
| UserPromptSubmit | allow_git_hook.py | Session-scoped git approval |
| UserPromptSubmit | open-ended-scope-guard.js | Detects "finish the app" / "continue with project" / "wrap up" prompts without bounded scope, injects scope-plan reminder. Skips when prompt names a specific step/phase/stage/wave/plan file. Non-blocking. (Added 2026-05-15 / Insights friction fix) |
| PreToolUse \| PostToolUse | session-reminders.js | Unified session-throttled reminder dispatcher. `--reminder=ui-edit-design-check` (PreToolUse Write/Edit/MultiEdit on UI files .tsx/.jsx/.vue/.svelte/.dart/.swift/.kt or /screens/ /components/ /pages/ /widgets/ /views/ dirs) → /design-check (SK-127) prompt. `--reminder=build-ship-verify` (PostToolUse Bash matching flutter/gradle/next/vite/vercel/netlify/gh-pages/eas/xcodebuild builds) → /ship-verify (SK-128) prompt. State: single JSON per session at `cache/session-reminders-<session_id>.json`. Merged 2026-05-15 — absorbed `ui-edit-design-check-reminder.js` + `build-ship-verify-reminder.js`. |
| SessionStart | session-start.sh | Handoff, version, rotation, health, KG, unified cleanup engine (§7a), drift proposer (§8a) |
| SessionStart | cleanup-runner.js | 25 declarative cleanup rules from `cleanup-config.json` (v7.0 engine; count as of v8.14); one JSONL record per rule to `logs/cleanup.jsonl` |
| SessionStart | drift-proposer.js | Reads telemetry, emits at most ONE `DRIFT: ...` advisory when a threshold crosses; persists to `cache/last-drift-proposal.json` (v7.0) |
| SessionStart | archived-skill-offer.js | Manifest consumer (v10 U3-8): matches cwd against `skills/archived-skills-manifest.json` detect_files (literal/dir-prefix, ≤120 fs ops) + detect_packages (one package.json read) → ONE advisory offering the archived skill's restore; 24h/cwd throttle; never auto-restores; fail-open |
| Stop | session-stop.sh | Handoff, todos, KG capture (memory-related §1d commented out in v8.0.0) |
| Stop | wiki-session-log.js | Append session summary to `wiki/session-log/<date>.md` |
| Stop | session-transcript-log.py | Verbatim session JSONL → distilled markdown in `wiki/session-log/transcripts/` via Ollama. Fail-open, idempotent. (Added 2026-05-14 / v8.0.0 brain-consolidation) |
| SessionStart | system-doctor-advisory.js | Read `cache/system-ground-truth.json` and surface a DRIFT advisory if any validator was red on last sweep, or if the snapshot is >7d old. ~5ms. (Added 2026-05-02) |
| SessionStart | system-detect.js | Capability-System proposer: scores CWD against `systems/registry.json` detect signals (bounded — literal existsSync + depth-3 `**` walk, ignore-set, ~200-fs-op budget) and prints at most one `SYSTEM: detected <domain> project → /system activate <name>` line. Never auto-activates. Ordered cheap exits (profile gate → active marker → 24h throttle → registry mtime-guard regen → scoring); throttle file doubles as recoverable last-proposal. Fail-open, profile-gated. (Added v8.6.0) |
| SessionStart | session-start.sh §7m | Active-system carryover: if `cache/active-system-<cwd_slug>.json` exists, touch it (sliding 14d TTL) and inject the ≤2,500-char digest from `cache/active-system-<cwd_slug>.md`. (Added v8.6.0) |
| PreCompact | scripts/progressive-learning/precompact-reflect.sh | Preserve KG pre-compaction + action-graph hot-set digest injection (Tier 2) |
| Notification | claudio | Desktop notifications |
| StatusLine | statusline.js | Context bar, task, call count |

## The conductor loop (v10)

The autonomous inventory cycle — Claude orchestrates, the user decides:

```
measure → propose → approve → apply → re-sync → verify
```

1. **measure** — every invocation path is captured (Skill-tool + slash via `skill-usage-log.js` dual registration; SKILL.md reads via the action graph; agents/MCP/tasks/hooks in their ledgers); `scripts/usage-report.js` fuses them.
2. **propose** — weekly-maintenance step 9d runs `usage-report.js --propose`: A4 proposals for newly-unused skills (60d, zero fused evidence) and zero-evidence plugins. Cap 3/run, per-target decline-memory (`cache/proposal-stats.json` declined_targets), CLAUDE.md-gate/upstream/personal-style exemptions. Proposals ONLY — ladder level 1.
3. **approve** — the user via `/review-proposals` (the A4 queue stays the ONLY self-modification path); the morning brief surfaces open proposals. A reject with a `target:` feeds the decline-memory so it is never re-proposed.
4. **apply** — a session executes approved rows: `mv` to `skills/_archived/` + ARCHIVE-DIRECTORY row + manifest detection pattern (never delete).
5. **re-sync** — weekly-validator-sweep runs `sync-counts.js` (write-back; anchor-miss files an A4 proposal instead of hand-editing).
6. **verify** — the validator scoreboard (roster + count live in the `scripts/lib/validators.js` manifest, never in prose) + smoke test; `hooks/archived-skill-offer.js` keeps archived capability restorable by auto-offering on repo match.

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

Two systems, strict boundaries — no overlap. (v8.0.0: collapsed from 3 → 2; Memory + Knowledge Store merged into the vault.)

| System | Stores | Does NOT store |
|--------|--------|----------------|
| **Vault** (`<your-vault-path>/wiki/`) | `personal/` — user profile, feedback, procedures, project context, references, reflections. `engineering/` — reusable technical knowledge: G-PAT (patterns), G-SOL (solutions), G-ERR (errors), G-PREF (preferences), G-FAIL (failures). `session-log/` — handoffs + transcripts. External-world: `concept/`, `entity/`, `source/`, `synthesis/`, `raw/`. | Git-derivable data (branch, commits, status — use `git log`), ephemeral session state (use `~/.claude/cache/`) |
| **Atlas KG** (`atlas-kg/`) | Facts not derivable from git, code, or files — architectural decisions, cross-project relationships, non-obvious context, temporal validity windows | Git data — use `git log` for that. Personal/feedback content — that's vault personal/. |

**When in doubt:** Can `git log` or `grep` answer it? → Don't store it. Is it a user correction or personal context? → `wiki/personal/`. Is it a reusable technical pattern? → `wiki/engineering/`. Is it an entity-relationship fact across the project's life? → Atlas KG.

## Cache Tiers (L1 / L2 / L3)

A second axis over the same artifacts. Persistence Layer Boundaries (above) classify by *kind of fact*; Cache Tiers classify by *access cadence*. Both axes apply to every entry.

| Tier | Loaded | Budget | Stores |
|------|--------|--------|--------|
| **L1 — Always loaded** | Every session, automatically | ~10KB | `CLAUDE.md` (core rules) · `cache/session-hot/${cwd_slug}.md` (per-CWD session continuity, ≤500 tokens, fresh ≤7d) · skills directory listings · KG summary · action-graph carryover · `wiki/personal/system-overview.md` VAULT ORIENTATION snippet (v8.0.0 §7l) |
| **L2 — On-demand** | Pulled by skill, command, or routing | unbounded | `skills/ACTIVE-PAGE-*.md` · `wiki/engineering/*.md` · `wiki/personal/{feedback,procedures,project-state,references,reflections}/*.md` · `atlas-kg/` triples · `wiki/{entity,concept,source,synthesis}/` · `wiki/session-log/handoffs/*.md` |
| **L3 — Cold storage** | Retrieved only when explicitly referenced | unbounded | `wiki/session-log/transcripts/*.md` (verbatim session distillations) · `projects/*/*.jsonl` raw transcripts · `wiki/raw/` ingested sources · `skills/ARCHIVE-DIRECTORY.md` retired skills · `backups/` · `TRASH/` |

**Movement between tiers:**
- Session ending → `session-stop.sh` §1c writes L1 `cache/session-hot/${cwd_slug}.md` + `wiki-session-log.js` appends to `wiki/session-log/<date>.md` (L2) + `session-transcript-log.py` writes L3 transcript + KG capture. Pruned at 14d by `session-start.sh`.
- Session starting → `session-start.sh` §7l injects VAULT ORIENTATION (L1 anchor doc snippet from `wiki/personal/`) + handoff + action-graph carryover (top-5 from previous session).
- L2 stale → `cleanup-runner.js` rules promote to L3 (transcripts gzip+trash) or trim by `keep_last`.
- Routing decisions for *new* facts → `config/routing-rules.yml` consulted by `/remember` and the context-router skill.
- Vault content is durable — no auto-decay in v8.0.0. The retired Living Memory `decay.tau_days` configuration is no longer applied (the `memory-lifecycle.js` hook was deleted in v8.0.0; snapshot preserved in `_archived/brain-consolidation-2026-05-15/brain-consolidation-pre-phase1-20260514-124017.tar.gz`).

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

## Capability Systems (v8.6.0)

Vertical domain bundles over the horizontal capability pools. A system is a **non-destructive overlay manifest** at `systems/<name>/SYSTEM.md` (YAML frontmatter + short imperative body) that *references* existing assets by id: skills (SK-### from ACTIVE-DIRECTORY or bare skill-dir names), `preferred_mcp` (**advisory only** — ATLAS cannot toggle MCP registration per session), commands, agents, RULES pages, and a knowledge domain. Nothing is moved; one asset can belong to many systems; deleting a system touches none of its members.

- **Roster (v8.6.0):** full-stack (SYS-WEB, web) · app-dev (SYS-APP, native) · atlas-meta (SYS-META, atlas). Deferred until needed (create via `/system:new`): design-ui, security, data, devops.
- **Index:** `systems/registry.json` — derived from frontmatter by `scripts/systems-registry.js`; the detect hook self-heals staleness via an mtime guard. `systems/REGISTRY.md` holds the add-a-system recipe (no hand-mirrored roster table).
- **Activation:** `/system:activate <name>` (or bare `/system <name>`) writes `cache/active-system-<cwd_slug>.json` (marker, `{primary, companions}` shape) + `cache/active-system-<cwd_slug>.md` (≤2,500-char digest), regenerates `cache/knowledge-view-<domain>.md`, and echoes a ≤600-token bundle. Slugs always via `hooks/lib/slug.js` `cwdSlug()`. Session 2+ in the same CWD: session-start §7m re-injects the digest and touches the marker (sliding TTL; pruned after 14d idle by cleanup rule `active-system-prune`). `statusline.js` shows `◆ <name>` while active. `/system deactivate` clears it.
- **Auto-detect:** `hooks/system-detect.js` (SessionStart) proposes — never activates — with a distinct `SYSTEM:` prefix (separate channel from `DRIFT:`; never written to `cache/last-drift-proposal.json`). Threshold ≥2 matched signals; 24h per-CWD throttle (`cache/system-detect-<cwd_slug>.json`, which also persists the last proposal for `/system detect`).
- **Knowledge loop:** entries gain an optional `**Domain**: <token>` on the metadata line (inert to validate-knowledge.js). `scripts/knowledge-view.js <domain>` resolves explicit Domain → census-derived hashtag map → `general` (collapsed cross-cutting section). `/remember`'s engineering routes stamp `**Domain**` from the active-system marker (route.domain in `config/routing-rules.yml`), so views grow automatically while a system is active. Domains with <5 entries omit `knowledge_domains` until the loop fills them (native as of v8.6.0).
- **Honesty:** `validate-systems.js` (11th validator) — dangling refs, MCP known-set (4 categories sourced from this file's § MCP "User scope" list), leading-`**` detect patterns rejected, value-level registry coherence, body >60 lines warns. Self-skips when `systems/` is absent. Full integration: snapshot `systems` key + doctor scoreboard row + `test-validators.js` smoke (auto via shared manifest).

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

- `/observe` → `scripts/observability.js` — 6-section markdown dashboard (tool health, safety hooks, skill usage, scheduled tasks, action graph, cleanup). Flags: `--json`, `--section=<name>`. Empty-safe per section. (The retired Living Memory 7th section was dropped in v8.2.0.)
- `/system-doctor` → `scripts/system-doctor.js` — runs every validator in `scripts/lib/validators.js` (the canonical manifest — count and roster live THERE, never in prose; v10 added `agents`) and emits a markdown scoreboard. Flags: `--json`, `--strict`. Surfaced at SessionStart by `system-doctor-advisory.js`. The companion `weekly-validator-sweep` task (Sun 03:36, cron `30 3 * * 0`) is registered and `enabled:true`; the scheduler executor is working (sibling `weekly-maintenance` fired on-cron 2026-05-25). `logs/validator-sweep.jsonl` has two sweeps (2026-05-18 initial + 2026-05-28 manual audit baseline) and its first post-registration cron fire lands 2026-05-31 — confirm it appends a 3rd entry then. As a safety net, `node scripts/system-snapshot.js && node scripts/system-doctor.js` can be run manually after major changes. (Added 2026-05-02 / audit synthetic-leaf; verified 2026-05-28 jazzy-wren)
- `scripts/test-validators.js` — regression tests for the validators THEMSELVES ("who validates the validators?"): unit-tests `validate-references` extraction (the regex where the `.js`-in-`.json` / mid-word `hooks/` false-positives lived) + smoke-tests every validator in the shared manifest (11 as of v8.6.0) for crashes and output-shape. Run weekly by `weekly-validator-sweep` (step 2) and on demand (`node scripts/test-validators.js`). Zero-dep, exit 0/1. (Added 2026-06-04.)
- `cache/system-ground-truth.json` (regen via `scripts/system-snapshot.js`) — canonical structured snapshot of the system state: every count, every list, every cross-reference. Audit-mode agents must read this file before re-deriving counts via grep (per CLAUDE.md "Auditing the ATLAS system itself" protocol).
- `/apply-drift-fix` — reads `cache/last-drift-proposal.json` and routes to the right action (skill archive, MCP disable, task retrigger, cleanup-rule fix).
- `drift-proposer.js` thresholds live in `hooks/drift-thresholds.json`. Per-kind cooldown (24h) + `max_proposals_per_session: 1` + `silenced_kinds` allowlist prevent noise.

**Cleanup engine:** `hooks/cleanup-runner.js` replaced `session-start.sh` §7a–§7k (10+ bespoke blocks). Config in `hooks/cleanup-config.json` declares 25 rules across 9 modes (count as of v8.14) (`age-prune`, `age-and-count`, `keep-last`, `delete-matching-dirs`, `age-prune-dirs`, `gzip-then-trash`, `per-project-uuid-dirs`, `weekly-nag`, `custom`). Adding a new target is a 3-line config change.

## MCP Servers

Lazy discovery via TOOL_SEARCH. **Two registries, both real:**
- `~/.claude.json` (top-level `mcpServers`) — USER scope, global across all CWDs. Managed via `claude mcp add|remove -s user`.
- `~/.claude/.mcp.json` — PROJECT scope, only loaded when CWD is `~/.claude/`. `_comment_*` keys must live at top level, NOT inside `mcpServers` (strict parser — invalid nesting silently blocks the whole object from loading, as happened before 2026-04-17).

**Current state — run `claude mcp list` from CWD=~/.claude/ for live status; this snapshot is 2026-06-09:**

- **Bundled / gateway**: `MCP_DOCKER` (Context7, GitHub, Neon, Wikipedia, Memory, Playwright, Git, Filesystem, Firecrawl, time, sequentialthinking) — one Docker gateway fronting many tools.
- **User scope** (`~/.claude.json`, 12): `MCP_DOCKER`, `code-review-graph` (CRG — Tree-sitter, auto-update on Write/Edit), `tauri-mcp`, `lighthouse`, `context-mode`, `mobile`, `cloudflare`, `expo`, `vercel`, `obsidian`, `shadcn` (official registry MCP `npx shadcn@latest mcp`, added 2026-06-11 v8.7.0), `unsplash` (`@violent-madman/unsplash-mcp` v1.0.0 MIT, real photography search — added 2026-06-11 v8.9.0, source-vetted: only hits api.unsplash.com, key sent only in Client-ID header). (`prisma` removed 2026-06-08 — stack standardized on Drizzle + Neon; Neon tools live in `MCP_DOCKER`.)
- **Project scope** (`~/.claude/.mcp.json`, 1): `statsig` (OAuth-pending). The Wave-2 prune (2026-04-27) cut the per-project servers (supabase, stripe, resend, sentry, upstash, netlify, firecrawl, 21st-dev, maestro) — re-add commands are in `INSTALLED.md`.
- **Plugin-registered MCPs** (via `enabledPlugins`, not `claude mcp`): `plugin:firebase:firebase`, `plugin:github:github` (needs `GITHUB_PERSONAL_ACCESS_TOKEN`).
- **Account / cloud connectors** (managed in the Claude app / plugin marketplace, identified by UUID prefix at session start): Gamma, Canva, Gmail, BigData, LunarCrush, Figma, Prospect Enrichment, Job Search, Vercel toolbar — see `INSTALLED.md` § Wave 2.4. Plus session-managed: Context7, Claude Browser (the preview pane; renamed 2026-07 from Claude Preview), Claude-in-Chrome, scheduled-tasks, mcp-registry, local-agent.

**Verify state:** `claude mcp list` (from CWD=~/.claude/ to see both registries). **Revival memory:** `projects/*/memory/project_mcp_revival.md`.

## Key Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Core instructions |
| `REFERENCE.md` | Quick-lookup for commands, skills, MCP |
| `INSTALLED.md` | Third-party resource manifest |
| `settings.json` | Hooks, permissions, env vars |
| `hooks/context-thresholds.json` | Shared threshold config |
| `cache/system-ground-truth.json` | Canonical snapshot of system state (regen via `scripts/system-snapshot.js`) — preferred over re-deriving counts via grep |
| `scripts/validate-*.js` | Per-surface validators — roster in `scripts/lib/validators.js` (the canonical manifest). Two questions: most ask *does every reference resolve?*; `brain-coverage` asks the mirror, *is every asset reachable?* (capability brains only — web-dev/impeccable, app-dev/tactile; the knowledge namespaces are reached by `/recall`, not link-routing) |
| `scripts/system-doctor.js` | Aggregator that runs all validators + emits markdown scoreboard |
| `systems/` | Capability Systems — overlay manifests (`<name>/SYSTEM.md`) + derived `registry.json` + `REGISTRY.md` recipe |
| `scripts/lib/system-manifest.js` | Shared SYSTEM.md frontmatter parser + registry derivation (consumed by validator, CLI, detect hook) |
| `scripts/systems-registry.js` | Regenerate `systems/registry.json` from manifests |
| `scripts/knowledge-view.js` | Per-domain knowledge view generator → `cache/knowledge-view-<domain>.md` (census-derived tag map; mtime short-circuit) |
