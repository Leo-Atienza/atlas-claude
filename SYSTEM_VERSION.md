# Claude Code System — Version State

## System Version
version: 2.5.0
last_updated: 2026-03-29

## Platform Tracking
claude_code_last_seen: 2.1.81
last_check: 2026-03-29
update_available: false

## Component Health
last_health_check: 2026-03-29
failing_components: none

## Component Counts
hooks: 18
commands: 37
agents: 72
skills: 38 (direct SKILL.md) + 150+ (via skill packs)
plugins: 9
rules: 5

## Key Components
hooks/session-start.sh          | 2.5.0 | verified | OK
hooks/session-stop.sh           | 2.5.0 | verified | OK
hooks/security-gate.sh          | 2.1.0 | verified | OK
hooks/context-monitor.js        | 2.1.0 | verified | OK
hooks/context-guard.js          | 2.4.0 | new      | OK
hooks/statusline.js             | 2.1.0 | verified | OK
hooks/mistake-capture.py        | 2.5.0 | updated  | OK
hooks/verify-completion.py      | 2.1.0 | verified | OK
hooks/agent-profiler.py         | 2.3.0 | verified | OK
hooks/keyword-detector.js       | 2.4.0 | new      | OK
hooks/skill-injector.js         | 2.4.0 | new      | OK
hooks/skill-watcher.sh          | 2.2.0 | verified | OK
hooks/subagent-tracker.js       | 2.4.0 | new      | OK
hooks/subagent-verifier.js      | 2.4.0 | new      | OK
hooks/sync-skill-keywords.js    | 2.5.0 | new      | OK
hooks/tool-failure-handler.js   | 2.4.0 | new      | OK
hooks/post-compact-dream-check.sh | 2.2.0 | verified | OK
commands/learn.md               | 2.1.0 | verified | OK
commands/analyze-mistakes.md    | 2.1.0 | verified | OK
commands/health.md              | 2.1.0 | verified | OK
skills/REGISTRY.md              | 2.5.0 | verified | OK
scripts/skill-stats-rollup.js   | 2.5.0 | new      | OK
scripts/rebuild-memory-bridge.sh | 2.5.0 | new      | OK
