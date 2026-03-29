# System Changelog

## [2.6.0] — 2026-03-29
### Added — Configuration Hardening & Performance
Audit-driven improvements: configuration drift detection, missing safety mechanisms, stale documentation cleanup, and startup performance optimization.

- **Subagent limiter** (`hooks/subagent-limiter.js`, HK-019): PreToolUse hook matching Agent. Reads concurrent agent count from subagent-tracker.js state file and blocks spawns when >= 6 concurrent. Fail-open on errors or stale state (>5min). Closes the gap where subagent-tracker.js (SubagentStart) could only warn after spawn.
- **PreCompact flow validator** (`scripts/precompact-flow-validate.sh`, HK-020): PreCompact hook validates `.flow/state.yaml` exists, has `status`/`phase` fields, and isn't empty before context compaction. Never blocks — only warns via additionalContext.
- **Hook registration drift detection** (`scripts/smoke-test.sh` section [11]): Cross-references settings.json hook entries against hooks/ directory. Reports FAIL for settings pointing to missing files, WARN for hooks on disk not registered.
- **`/dream` command** (`commands/dream.md`): Thin command entry point delegating to `skills/dream/SKILL.md`. Completes the set — all 6 master entry points now have command files.

### Changed
- `hooks/session-start.sh`: Consolidated 3 separate `node -e` calls (version manifest, skill stats, tool health) into single Node invocation. Added 8-second timeout watchdog. Saves ~1-2s startup time.
- `settings.json`: Extended context-monitor matcher to include Agent (`Write|Edit|MultiEdit|Bash|Agent`). Extended mistake-capture matcher to include Agent (`Bash|Write|Edit|MultiEdit|Agent`). Registered HK-019 and HK-020.
- `skills/PLAYBOOK-WORKFLOWS.md`: Rewrote all GSD references to Flow equivalents. Section 2 completely replaced. 28 stale `/gsd:*` command references removed.

### Removed
- `flow-knowledge/index.yaml` — dead file (only `solutions: []`), never read by any hook or script
- `flow-knowledge/solutions/` — empty directory

### Design Principles
- Subagent limiter is fail-open: errors, missing state files, or stale data all result in allowing the spawn
- PreCompact validator never blocks compaction — warnings only
- Drift detection uses Python for JSON parsing to avoid fragile bash jq dependency
- Session-start consolidation outputs directly from Node (no intermediate JSON parsing)

## [2.5.0] — 2026-03-29
### Added — OpenSpace-Inspired Self-Evolution Patterns
Analyzed HKUDS/OpenSpace (Python MCP server for agent skill evolution). Borrowed 4 concepts adapted to our file-based hook architecture. No external dependencies added.

- **Dynamic keyword registration** (`hooks/sync-skill-keywords.js`, HK-018): SessionStart hook regenerates `cache/skill-keyword-map.json` from REGISTRY.md + SKILL.md `keywords` frontmatter. Ensures skills created by self-evolve are immediately discoverable by skill-injector.js without manual keyword map edits.
- **Skill performance tracking** (`scripts/skill-stats-rollup.js`): Logs skill selection events in `logs/skill-events.jsonl` (from skill-injector.js) and application events (from mistake-capture.py Read detection). Session-stop rollup aggregates into `logs/skill-stats.json` with per-skill applied_rate/fallback_rate. Auto-promotes skills reaching 3+ applications in `evolution.md` maturity milestones.
- **Unified knowledge bridge** (`scripts/rebuild-memory-bridge.sh`): SessionStart script generates `flow-knowledge/memory-bridge.yaml` indexing all 58+ Progressive Learning topics from INDEX.md. Makes memory/topics/ searchable by flow-learnings-researcher without schema merging.
- **Per-tool health tracking** (EMA in `tool-failure-handler.js`): Persistent `logs/tool-health.json` tracks exponential moving average failure rates per tool across sessions. Session-start alerts when any tool exceeds 40% EMA failure rate. Success counting in `mistake-capture.py` via `logs/tool-call-counts.json`.

### Changed
- `hooks/skill-injector.js`: Loads dynamic keyword cache before hardcoded map; logs selection events to skill-events.jsonl
- `hooks/mistake-capture.py`: Success path now tracks tool call counts + detects SKILL.md reads as application events
- `hooks/tool-failure-handler.js`: Persists per-tool EMA failure rates to tool-health.json
- `hooks/session-start.sh`: Added memory bridge rebuild (step 1.75), skill performance alerts (step 5.5), tool health alerts (step 5.6)
- `hooks/session-stop.sh`: Added skill-stats-rollup.js call (step 1.5)
- `agents/flow-learnings-researcher.md`: Added memory-bridge.yaml as search source
- `skills/self-evolve/SKILL.md`: Added `keywords` field to skill creation template
- `settings.json`: Added sync-skill-keywords.js to SessionStart hooks
- `skills/REGISTRY.md`: Added HK-018

### New Files
- `hooks/sync-skill-keywords.js` — keyword cache generator
- `scripts/skill-stats-rollup.js` — skill performance aggregator
- `scripts/rebuild-memory-bridge.sh` — Progressive Learning → Flow bridge
- `cache/skill-keyword-map.json` — generated keyword cache (runtime)
- `logs/skill-events.jsonl` — skill selection/application events (runtime)
- `logs/skill-stats.json` — aggregated skill performance data (runtime)
- `logs/tool-health.json` — persistent tool EMA failure rates (runtime)
- `logs/tool-call-counts.json` — tool success counters (runtime)
- `flow-knowledge/memory-bridge.yaml` — generated knowledge index (runtime)

### Design Principles
- All new data files are hook-only — never injected into Claude's context window
- EMA alpha=0.3 for tool health — balances recency with smoothing
- Skill events use append-only JSONL with 1MB rotation
- Memory bridge is regenerated from scratch each session — never drifts from INDEX.md
- Dynamic keywords fall back to derived patterns when no explicit `keywords` frontmatter exists

## [2.4.0] — 2026-03-29
### Added — OMC-Inspired Hook Enhancements
Analyzed oh-my-claudecode (yeachan-heo/oh-my-claudecode) for features missing from our system. Implemented 6 new hooks natively without OMC dependency.

- **PreToolUse context guard** (`hooks/context-guard.js`, HK-012): Proactively blocks expensive tools (Agent, Bash, Write, Edit, MultiEdit) when context >= 72% used. Always allows state-saving tools (Read, Glob, Grep, TodoWrite). Reads same bridge file as statusline.js. Prevents wasted tokens — upgrade from reactive (PostToolUse) to proactive (PreToolUse) context protection.
- **SubagentStart tracker** (`hooks/subagent-tracker.js`, HK-013): Logs all agent spawns to `logs/subagent-events.jsonl`. Tracks concurrent agents via temp file, warns at >6 concurrent. Provides agent lifecycle visibility missing from agent-profiler.py (which only tracks completions).
- **SubagentStop verifier** (`hooks/subagent-verifier.js`, HK-014): Validates agent deliverable quality on completion. Flags thin output (<30 chars) or error-containing results. Updates concurrent agent counter. Catches failed agents before their output is trusted.
- **PostToolUseFailure handler** (`hooks/tool-failure-handler.js`, HK-015): Dedicated handler for framework-level tool failures (timeout, permission denied, tool not found). Circuit breaker: 3+ consecutive failures triggers reassess warning. More targeted than mistake-capture.py (which handles content-level errors in successful tools).
- **Keyword detector** (`hooks/keyword-detector.js`, HK-016): UserPromptSubmit hook that routes natural language to workflow commands. Guards against informational queries. Maps: debug/bug→flow:debug, swarm/parallel→flow:smart-swarm, ship/push→/ship, etc. Injects routing context, doesn't auto-execute.
- **Skill injector** (`hooks/skill-injector.js`, HK-017): UserPromptSubmit hook that detects technology keywords and suggests matching skills from REGISTRY.md. Embedded keyword→skill map for speed (no file reads per prompt). Covers all active skills. Max 2 suggestions per context budget rules.

### Changed
- `settings.json`: Added 4 new hook event types (UserPromptSubmit, SubagentStart, SubagentStop, PostToolUseFailure) and PreToolUse:* context guard
- `CLAUDE.md`: Updated Auto-Continuation (context guard), Auto-Activation (prompt hooks), Mistake Learning (circuit breaker, deliverable verification), Hook Signals (6 new signal types)
- `skills/REGISTRY.md`: Added HK-012 through HK-017

### Design Principles
- All hooks follow existing patterns: Node.js for speed, JSON stdin/stdout, silent fail on errors
- context-guard.js reads the same bridge file as context-monitor.js — no new state files
- subagent-tracker/verifier share `logs/subagent-events.jsonl` — one log, two writers
- tool-failure-handler.js has its own log (`logs/tool-failures.jsonl`) separate from mistake-capture.py's `logs/failures.jsonl` — framework failures vs content errors
- keyword-detector guards against false positives with info-query detection
- skill-injector uses embedded map (not REGISTRY.md reads) for sub-3ms latency
- No OMC dependency — all concepts reimplemented natively within existing architecture

## [2.3.0] — 2026-03-27
### Added — Ruflo-Inspired Adaptations
- **Three-tier model routing** (`rules/tier-routing.md`): Bash→Haiku→Sonnet→Opus routing by task complexity. Reduces token costs 30-50% by matching agent tier to task difficulty. Integrated into smart-swarm, flow:go, and CLAUDE.md.
- **Agent performance profiler** (`hooks/agent-profiler.py`, HK-010): PostToolUse:Agent hook tracks success/failure per agent type with EMA reliability scoring (0.7 decay + 0.3 new). Writes to `logs/agent-profiles.jsonl` (events) and `logs/agent-profiles-summary.json` (EMA summary). Smart-swarm consults profiles for agent selection.
- **Background worker pool** (`skills/flow/references/background-workers.md`, FL-007): Auto-spawns background quality agents during `/flow:go` wave execution. Security scanner per wave (deep+), test coverage after final wave, pattern learner (epic). Never blocks main execution.
- **Project CLAUDE.md templates** (`skills/project-init/SKILL.md`, SK-041): Auto-generates project-level CLAUDE.md from detected tech stack (Next.js, Python, Flutter, Go, Rust, Rails, Node, .NET). Integrated into `/new` command as Step 1b. Never overwrites existing.
- **Truth verification gate** (`skills/flow/references/truth-verification.md`, FL-008): Weighted confidence scoring for `/flow:verify`. Existence (1.0x), Substantive (1.5x), Wired (2.0x), Truths (2.0x). Thresholds: >=0.95 auto-pass, 0.80-0.94 advisory, <0.80 human review, <0.60 blocked. Feeds back into agent profiler.

### Changed
- `settings.json`: Added PostToolUse:Agent hook for agent-profiler.py
- `commands/flow/go.md`: Added Step 4b (background workers), references to background-workers.md and tier-routing.md
- `commands/flow/verify.md`: Added Step 2b (confidence scoring), reference to truth-verification.md
- `commands/new.md`: Added Step 1b (project CLAUDE.md generation via project-init)
- `skills/smart-swarm/SKILL.md`: Added tier routing integration section with per-mode model selection table
- `CLAUDE.md`: Added 5 new auto-activation behaviors (tier routing, background workers, truth verification, project init, agent profiler)
- `skills/REGISTRY.md`: Added SK-041, FL-007, FL-008, HK-010

### Design Principles
- All adaptations use existing ATLAS patterns (hooks, skills, flow references, rules) — no new architecture
- Tier routing is advisory (rules/ file), not enforced by hook — preserves flexibility
- Background workers are read-only and non-blocking — they can't break execution
- Agent profiler uses same JSONL+JSON pattern as mistake-capture.py — consistent with logging infrastructure
- Truth verification integrates into existing flow:verify steps — no separate command needed

## [2.2.0] — 2026-03-21
### Added
- cctools safety hooks wired into settings.json: bash_hook (rm blocking, git safety, env protection), file_length_limit_hook (Edit/Write), read_env_protection_hook (Read)
- Todo state capture in session-stop.sh — handoff now includes in-progress tasks
- Stale plan cleanup signal in session-start.sh (warns when >3 plans older than 14 days)
- Log rotation in session-start.sh (auto-trims logs >2MB)
- Scheduled weekly maintenance task (Monday 9am): /analyze-mistakes + /health + SYSTEM_VERSION auto-update
- Self-upgrade recommendations in /health (hook gaps, underused capabilities, rule promotion, stale knowledge)
- Self-upgrade loop documentation in CLAUDE.md (3 compounding loops)
- SYSTEM_VERSION.md auto-updating via /health component recount

### Changed
- `hooks/security-gate.sh` — Now scans Edit/MultiEdit content (new_string, operations[].new_string), not just Write content
- `settings.json` PreToolUse — Expanded from Write-only to Write|Edit|MultiEdit for security gate; added 3 cctools hooks (Bash, Write|Edit, Read)
- `hooks/session-start.sh` — Added sections 6 (stale plan cleanup) and 7 (log rotation)
- `hooks/session-stop.sh` — Added section 3 (todo state capture in handoff)
- `commands/health.md` — Added sections 14 (self-updating SYSTEM_VERSION.md) and 15 (self-upgrade recommendations)
- `CLAUDE.md` — Added "Self-Upgrade Loop" section documenting 3 compounding improvement cycles

### Security
- Closed gap: Edit/MultiEdit operations now pass through security-gate.sh (previously only Write was guarded)
- Activated 13 dormant cctools safety scripts: rm blocking, git checkout/commit/add safety, env file protection, file length limits

---

## [2.1.0] — 2026-03-21
### Added
- Operational monitoring: `logs/` directory with `failures.jsonl`, `error-patterns.json`
- `hooks/mistake-capture.py` — PostToolUse failure capture with recurring pattern detection
- `hooks/verify-completion.py` — Stop hook for lightweight task completion verification
- `commands/learn.md` — Transform mistakes into permanent G-ERR Progressive Learning topics
- `commands/analyze-mistakes.md` — Weekly failure pattern analysis and recommendation engine
- `rules/` directory with 4 modular rule files (testing, git, security, general)
- `SYSTEM_VERSION.md` — Version and component inventory tracking
- `SYSTEM_CHANGELOG.md` — This file

### Changed
- `hooks/session-start.sh` — Added version check, lessons summary, and log summary sections
- `commands/health.md` — Added logs/ reading and failure rate reporting
- `settings.json` — Added 2 new hook entries (PostToolUse mistake-capture, Stop verify-completion)
- `skills/REGISTRY.md` — Added entries for new commands

### Source
Adopted from ULTIMATE_CLAUDE_CODE_SYSTEM_COMPLETE.md gap analysis.
Components adapted to integrate with existing Progressive Learning system and Flow workflow.

---

## [2.0.0] — 2026-03-16
### Note
Pre-changelog era. System was established with Flow unified workflow, Progressive Learning,
72 agents, 150+ skills, 9 plugins, 4-tier configuration architecture.
See `system_architecture.md` for full baseline documentation.
