# System Changelog

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
