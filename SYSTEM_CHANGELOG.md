# System Changelog

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

**Deferred**: Legacy memory/INDEX.md (13KB) migration — deeply referenced by 6 commands + 1 agent, requires dedicated task

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
