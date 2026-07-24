# Agents Registry

> The last previously-untracked surface (closed v10 U4-2). Every `agents/**/*.md` definition
> loads into every session's Agent roster, so this registry + `scripts/validate-agents.js`
> (fs ⇄ doc parity, wired into /system-doctor) keep it from rotting silently.
> Status: **active** = in `agents/`, loads each session · **archived** = parked under
> `skills/_archived/agents-parked/` or inside an archived bundle (restore = mv back).

## Active (21)

| Agent | Source pack | Stack relevance | Evidence (subagent-stats, all-time) |
|---|---|---|---|
| cctools/aichat/session-searcher | cctools | Session-history search | 3 spawns |
| cctools/workflow/ui-tester | cctools | UI verification | 0 — cctools bundle, safety-adjacent, kept |
| compound-engineering/design/design-implementation-reviewer | compound-engineering | UI/design (core) | 0 — design lane kept |
| compound-engineering/design/design-iterator | compound-engineering | UI/design (core) | 0 — design lane kept |
| compound-engineering/research/best-practices-researcher | compound-engineering | Generic research | 1 spawn |
| compound-engineering/research/framework-docs-researcher | compound-engineering | Generic research | 0 — kept, cheap + plausible |
| compound-engineering/research/git-history-analyzer | compound-engineering | Generic research | 0 — kept |
| compound-engineering/research/learnings-researcher | compound-engineering | Institutional knowledge | 0 — kept |
| compound-engineering/research/repo-research-analyst | compound-engineering | Onboarding/conventions | 0 — kept |
| compound-engineering/review/agent-native-reviewer | compound-engineering | Agent-parity review | 0 — kept |
| compound-engineering/review/architecture-strategist | compound-engineering | Architecture review | 0 — kept |
| compound-engineering/review/code-simplicity-reviewer | compound-engineering | YAGNI review (matches lazy-dev ladder) | 0 — kept |
| compound-engineering/review/data-integrity-guardian | compound-engineering | Migrations/data safety | 1 spawn |
| compound-engineering/review/julik-frontend-races-reviewer | compound-engineering | JS races (TS stack) | 1 spawn |
| compound-engineering/review/kieran-typescript-reviewer | compound-engineering | TS quality (primary stack) | 0 — kept per CP-1 |
| compound-engineering/review/pattern-recognition-specialist | compound-engineering | Consistency review | 1 spawn |
| compound-engineering/review/performance-oracle | compound-engineering | Performance review | 1 spawn |
| compound-engineering/review/security-sentinel | compound-engineering | Security review (full-stack SYSTEM.md companion) | 1 spawn |
| compound-engineering/workflow/bug-reproduction-validator | compound-engineering | Bug validation | 0 — kept |
| compound-engineering/workflow/pr-comment-resolver | compound-engineering | PR feedback | 0 — kept |
| compound-engineering/workflow/spec-flow-analyzer | compound-engineering | Spec gap analysis | 0 — kept |

## Archived (v10, 2026-07-20 — CP-1-approved)

| Where | Contents |
|---|---|
| `skills/_archived/flow/agents/` | 15 flow-* agents + smart-swarm-coordinator (0 spawns each, family archived) |
| `skills/_archived/agents-parked/compound-engineering/` | dhh-rails-reviewer, kieran-rails-reviewer, kieran-python-reviewer, lint (Ruby/ERB), every-style-editor, ankane-readme-writer, schema-drift-detector, data-migration-expert, deployment-verification-agent, figma-design-sync (wrong stack / 0 spawns / figma plugin disabled) |
| `skills/_archived/agents-parked/context-engineering-kit/` | fpf/sdd/code-review agent set (0 evidence) |
| `skills/_archived/agents-parked/infra-showcase/` | 11 showcase agents (0 evidence) |

Plugin-provided agent types (feature-dev:*, code-simplifier:*, coderabbit:*, agent-sdk-dev:*) come and go with `enabledPlugins` in settings.json — they are not files in `agents/` and are out of this registry's scope.
