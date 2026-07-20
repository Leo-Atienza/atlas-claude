# System Changelog

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
