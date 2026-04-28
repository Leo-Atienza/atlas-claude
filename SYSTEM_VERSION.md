# ATLAS System Version

> Auto-updated by `/health`. Do not edit manually.

**version: 7.0.1**
**last_updated: 2026-04-28**

## Component Counts

| Component | Count | Last Updated |
|-----------|-------|-------------|
| Hooks (files) | 30 | 2026-04-24 |
| Commands (total) | 58 | 2026-04-24 |
| Skills (on disk) | 124 | 2026-04-24 |
| Skills (in ACTIVE-DIRECTORY) | 76 | 2026-04-24 |
| Agents | 74 | 2026-04-24 |
| Rules | 3 (RULES-GIT, RULES-SECURITY, RULES-TESTING) | 2026-04-20 |
| Knowledge entries | 74 | 2026-04-28 |
| Scheduled tasks (enabled) | 4 | 2026-04-24 |
| Cleanup rules | 13 | 2026-04-24 |

## Knowledge Breakdown

> ID format unified to `KNOWLEDGE-NNN` with `**Type**:` field (v7.0.1).

| Category | Count |
|----------|-------|
| Patterns (type: pattern) | 30 |
| Solutions (type: solution) | 17 |
| Errors (type: error) | 13 |
| Preferences (type: preference) | 8 |
| Failures (type: failure) | 6 |

## Installed Versions

| Tool | Version |
|------|---------|
| Claude Code CLI | 2.1.118 |
| better-ccflare | 3.4.13 |
| tdd-guard | 1.6.5 |
| claude-rules-doctor | 0.2.2 |
| claudio | 1.11.1 |
| claude-squad | 1.0.14 |

## Skill Pack Status

| Pack | Last Checked | Latest Activity |
|------|-------------|----------------|
| trailofbits-security | 2026-03-15 | 2026-04-01 |
| fullstack-dev | 2026-03-15 | 2026-03-23 |
| context-engineering-kit | 2026-03-15 | 2026-04-06 |
| compound-engineering | 2026-03-15 | 2026-04-13 |
| cctools | 2026-03-15 | 2026-04-02 |

## Metadata

| Key | Value |
|-----|-------|
| version | 7.0.1 |
| last_health_check | 2026-04-24 |
| hook_event_types | 8 (Notification, PostToolUse, PostToolUseFailure, PreToolUse, PreCompact, SessionStart, Stop, UserPromptSubmit) |
| disk_total | 351MB |
| disk_skills | 14MB |
| disk_projects | 266MB |

## v7.0 Highlights

- **Unified cleanup engine** — `hooks/cleanup-runner.js` drives 13 declarative rules from `hooks/cleanup-config.json`; replaces v6.x §7a–§7k bespoke blocks in `session-start.sh`.
- **Skill-usage instrumentation** — new PreToolUse `Skill` hook writes `logs/skill-usage.jsonl`; `skill-stats.json` is superseded.
- **Observability dashboard** — `/observe` renders 6 sections (tool health, safety hooks, skill usage, scheduled tasks, action graph, cleanup) from existing + new telemetry.
- **Scheduled tasks 6→4** — `weekly-cleanup-scan` absorbed into `weekly-maintenance`; `weekly-memory-maintenance` absorbed into `weekly-dream`; both kept disabled for a 1-week shadow period.
- **Auto-drift-proposer** — `hooks/drift-proposer.js` emits at most ONE session-start advisory when thresholds cross (skill unused, tool failures, task drift, cleanup errors). Thresholds live in `hooks/drift-thresholds.json`.
