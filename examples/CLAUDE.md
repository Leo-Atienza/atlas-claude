# Global Agent Instructions

**Core principle: Act autonomously. Classify the task, route to the right tool/skill/workflow, and execute. Only ask when genuinely ambiguous.**

## Master Entry Points

| Command | Plain English | When to use |
|---|---|---|
| `/new [description]` | "build X", "create X" | Starting anything new |
| `/resume` | "continue", "pick up where we left off" | Returning to existing work |
| `/task [description]` | "fix X", "add X", "review X" | One-off task in current session |
| `/done` | "done", "wrap up" | End of session |
| `/ship` | "ship it", "push this" | Commit + push + open PR |

## Session Start

Read session-state.md for fast resume. Check `.flow/` for active workflow. SessionStart hook handles reflection flags, conflicts, and handoffs automatically.

## Session End Protocol — MANDATORY

**Every session gets reflected.** Run `/reflect` at end of every session.

**State File Precedence** (canonical order):
1. `.flow/state.yaml` — Flow workflow state (authoritative for active Flow work)
2. `session-state.md` (project root) — Ephemeral session snapshot
3. `~/.claude/.last-session-handoff` — Git state + todos from Stop hook
4. `~/.claude/sessions/handoff-*.md` — Auto-continuation handoff

**Write session-state.md** before ending: `{ workflow: "flow"|"direct", active_skills: [...], branch: "...", next_action: "..." }`.

## Task Routing — Flow

All tasks route through Flow. `/flow:start` auto-detects depth.

| Route | When |
|-------|------|
| `/flow:start [desc]` | Any new work (auto-detects quick/standard/deep/epic) |
| `/flow:plan` -> `/flow:go` | Medium features (3-10 files) |
| `/flow:quick` | Small, well-defined tasks |
| `/flow:debug` | Bugs |
| `/flow:ship` | Commit + push + PR |
| `/flow:smart-swarm [desc]` | Complex tasks needing multiple agents (auto-scores complexity) |
| `/continue` | Resume from auto-continuation handoff file |
| Just do it | Trivial (<20 lines, 1 file) |

## Research — Automatic

Search online proactively: Context7 (library docs) -> WebSearch (general) -> MCP registry (tools) -> WebFetch (URLs). Do not guess when you can look up.

## Auto-Activation — On-Demand

When a task matches a domain, look up the matching resource in `REGISTRY.md` and read its SKILL.md.

**Self-Evolution (automatic)**: When you encounter a capability gap — a task needs tools you don't have, a workflow repeats 3+ times, or the user requests new capabilities — activate self-evolve (SK-038). This skill handles MCP server discovery (`mcp-find` -> `mcp-add`), skill creation, and registry updates. Always ask before adding external MCP servers.

**Smart Swarm (automatic)**: When complexity scoring detects TEAM (8-11) or SWARM (12-15) level tasks, AUTOMATICALLY use `/flow:smart-swarm` — do NOT ask, just deploy agents. For DUO-level (5-7), automatically spawn 2 agents. For SOLO (0-4), execute directly. Scoring: file scope + concerns + risk + isolation + time pressure.

**Auto-Continuation (automatic)**: At 70% context usage, the context-monitor hook triggers a structured handoff. Write the handoff file when instructed, then the Stop hook spawns a new session that resumes autonomously. Chain depth limit: 5 sessions.

## Mistake Learning — Automatic

Hooks capture tool failures automatically to `logs/failures.jsonl`. When a "RECURRING FAILURE" signal appears, run `/learn` immediately. After any user correction, proactively offer `/learn`.

## Validation Gates — Non-Negotiable

1. Never claim "done" without verification
2. Never push/deploy without asking
3. Always security-scan before completion
4. Always use specialist skills for domain work

## When to Ask the User

**Ask**: ambiguous architecture, unclear scope, destructive ops, deployments, greenfield tech choices.
**Never ask**: tests, security scans, reading skill files, MCP tools, TDD, code validation, online research.

## Context Budget

Load only what the task needs. Max 2 specialist skills simultaneously.
