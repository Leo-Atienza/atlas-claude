# System Changelog — Archive (pre-v4.0)

> Archived from SYSTEM_CHANGELOG.md on 2026-04-06 (v5.4.0).
> These entries document the system's evolution from v2.0 through v3.2.

## [3.2.0] — 2026-03-30
### L100 App Development System Upgrade — 9 MCP servers, CLAUDE.md expanded, skill-injector enhanced

**MCP Servers Added (9 new, total now 17)**
- Supabase, Stripe, Resend, Prisma, Expo, Sentry, Mobile, PostHog, Cloudflare

**CLAUDE.md Expanded**: Backend, Mobile, iOS, Quality Bar sections added.
**Skill Injector**: 8 new keyword rules (Supabase, Stripe, Resend, Prisma, Expo, Sentry, PostHog, Cloudflare).

## [3.1.0] — 2026-03-30
### L99/L100 Deep Evaluation — 27 findings resolved, system hardened

**Security**: Switched to allowedTools with 20-tool curated allowlist. Enhanced bash_hook.py, security-gate.sh, read_env_protection_hook.py.
**Observability**: Consolidated 4 PostToolUse hooks into single hub. Added MCP health check, weekly backup.
**Documentation**: Created QUICK-REFERENCE.md, hooks/README.md.
**Cleanup**: Retired 6 hooks. Smoke test 38 PASS / 0 FAIL.

## [3.0.0] — 2026-03-30
### Self-Evolving Skills, Self-Healing Infrastructure, Quality Evaluation

**Self-Evolving Skills**: Skill evolution engine, improvement generator, /skill:review command, AutoResearch scheduled agent.
**Self-Healing**: Self-repair script, CLAUDE.md integrity check, persistent cache.
**Quality Evaluation**: Tool efficiency tracker, hook health telemetry, pre-ship quality gate.
**Agent Teams**: /flow:team command, TeammateIdle quality gate, TaskCompleted auto-verification.
**MAGMA Memory**: Edge metadata in knowledge topics, graph-aware memory bridge, Knowledge Graph MCP sync.
**Context Isolation**: Wave-scoped artifact directories, summary-only reads, persistent per-agent memory.
**Consolidation**: GSAP 8 skills → 2, canonical integrations declared.
**Critical Bug Fix**: mistake-capture.py crash on string responses — entire progressive learning loop was silently dead.

## [2.6.0] — 2026-03-29
### Configuration Hardening & Performance

Subagent limiter, PreCompact flow validator, hook registration drift detection, /dream command.
Session-start consolidated 3 Node calls into 1.

## [2.5.0] — 2026-03-29
### OpenSpace-Inspired Self-Evolution Patterns

Dynamic keyword registration, skill performance tracking, unified knowledge bridge, per-tool health tracking (EMA).

## [2.4.0] — 2026-03-29
### OMC-Inspired Hook Enhancements

PreToolUse context guard, SubagentStart tracker, SubagentStop verifier, PostToolUseFailure handler, keyword detector, skill injector.

## [2.3.0] — 2026-03-27
### Ruflo-Inspired Adaptations

Three-tier model routing, agent performance profiler, background worker pool, project CLAUDE.md templates, truth verification gate.

## [2.2.0] — 2026-03-21
### Configuration Hardening

cctools safety hooks, todo state capture, log rotation, scheduled maintenance, self-upgrade recommendations.

## [2.1.0] — 2026-03-21
### Operational Monitoring

Mistake capture, completion verification, /learn command, /analyze-mistakes, rules/ directory, SYSTEM_VERSION.md.

## [2.0.0] — 2026-03-16
### Baseline

Pre-changelog era. Flow workflow, Progressive Learning, 72 agents, 150+ skills, 9 plugins, 4-tier architecture.
