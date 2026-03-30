# Global Agent Instructions

**Core principle: Act autonomously. Classify the task, route to the right tool/skill/workflow, and execute. Only ask when genuinely ambiguous. Think harder — push beyond surface-level answers, dig deeper into problems, consider edge cases, and deliver thorough, high-quality results every time.**

**For deep guidance on any section below, read the matching playbook file (see Playbook Routing).**

## Master Entry Points — Use These First

Six commands cover everything. Slash or plain English, both work.

| Command | Plain English | When to use |
|---|---|---|
| `/new [description]` | "build X", "create X", "new project X" | Starting anything new |
| `/resume` | "continue", "pick up where we left off" | Returning to existing work |
| `/task [description]` | "fix X", "add X", "review X", "explain X" | One-off task in current session |
| `/done` | "done", "wrap up", "that's it for today" | End of session — reflects + commits |
| `/ship` | "ship it", "push this", "create a PR" | Commit + push + open PR |
| `/dream` | "consolidate memories", "clean up memories" | Deep memory consolidation — orient, merge, prune |

**These chain everything automatically.** You never need to invoke workflows, reflect, or security scans directly — the entry points handle all of it.

## Session Start

Read session-state.md for fast resume. Check `.flow/` for active workflow. Check `workflow.lock` in project memory. Check for project-level CLAUDE.md. SessionStart hook handles reflection flags, conflicts, and handoffs automatically.

**React to hook signals**: When `DREAM NEEDED` or `AUTO-DREAM TRIGGERED` appears → run `/dream` immediately (NON-NEGOTIABLE). When `AUTO-ACTIVATE ARCHIVED SKILLS` appears → read the listed SKILL.md files and move entries from Archived to Active in REGISTRY.md. When `CONTEXT GUARD` blocks a tool → save state immediately (handoff file + todos). When `CIRCUIT BREAKER` fires → stop, reassess, change approach. When `DELIVERABLE CHECK` warns → verify agent output before using it. When `SKILL MATCH` or `KEYWORD DETECTED` appears → follow the suggested routing if it aligns with intent.

## Session End Protocol — MANDATORY

**Every session gets reflected.** No exceptions. Run `/reflect` at end of every session. If PreCompact hook fires, reflect IMMEDIATELY.

**State File Precedence** (when resuming, read in this order):
1. `.flow/state.yaml` — Flow workflow state (authoritative for active Flow work)
2. `session-state.md` (project root) — Ephemeral session snapshot
3. `~/.claude/.last-session-handoff` — Git state + todos from Stop hook
4. `~/.claude/sessions/handoff-*.md` — Auto-continuation handoff (context limit hit)

**Write session-state.md** before ending: `{ workflow, active_skills, branch, next_action }`.

Knowledge categories: `G-PAT` (patterns), `G-SOL` (solutions), `G-ERR` (mistakes), `G-PREF` (preferences), `G-FAIL` (failed approaches). Stored in `INDEX.md` → `topics/`. Rules: never silently overwrite, filter PII, sequential IDs.

## Playbook Routing — Smart, Automatic

| Playbook File | Load When |
|---|---|
| `skills/PLAYBOOK-WORKFLOWS.md` | Planning projects, choosing workflows, Flow lifecycle, classifying tasks |
| `skills/PLAYBOOK-QUALITY.md` | Writing code, security scans, DevOps generation, quality processes |
| `skills/PLAYBOOK-TOOLS.md` | Using MCP servers, looking up slash commands, checking built-in skills, updating system |

**Rules**: Load ONLY the one you need, never all three. If a task spans two domains, load the primary one first, then the secondary only if needed.

## Task Routing — Flow

All tasks route through Flow. `/flow:start` auto-detects depth.

| Route | When |
|-------|------|
| `/flow:start [desc]` | Any new work (auto-detects quick/standard/deep/epic) |
| `/flow:plan` → `/flow:go` | Medium features (3-10 files) |
| `/flow:quick` | Small, well-defined tasks |
| `/flow:debug` | Bugs |
| `/flow:ship` | Commit + push + PR |
| `/flow:smart-swarm [desc]` | Complex tasks needing multiple agents (auto-scores complexity) |
| `/continue` | Resume from auto-continuation handoff file |
| Just do it | Trivial (<20 lines, 1 file) |

Full commands: `skills/flow/SKILL.md`. `.flow/` exists → `/flow:status` for context.

## Research — Automatic

Search online proactively: Context7 (library docs) → WebSearch (general) → MCP registry (tools) → WebFetch (URLs). Do not guess when you can look up.

## Auto-Activation — On-Demand

When a task matches a domain, look up the matching resource in `REGISTRY.md` and read its SKILL.md.
Activation priority: (1) language/framework, (2) security on PR completion, (3) domain specialist, (4) tool specialist.
Max 2 specialist skills loaded simultaneously.

**Prompt Hooks**: `skill-injector.js` (UserPromptSubmit) auto-detects technology keywords and suggests matching skills. `keyword-detector.js` auto-routes natural language to workflow commands. Both inject context — they don't auto-execute.

**Self-Evolution**: Capability gap detected → activate self-evolve (SK-038). Ask before adding external MCP servers.

**Smart Swarm**: TEAM (8-11) or SWARM (12-15) complexity → AUTOMATICALLY deploy agents via `/flow:smart-swarm`. DUO (5-7) → spawn 2 agents. SOLO (0-4) → execute directly.

**Auto-Continuation**: At 70% context, write handoff file when instructed. Chain depth limit: 5 sessions. Context guard (PreToolUse) proactively blocks expensive tools at 72% — only Read/Glob/Grep/TodoWrite remain available.

**Security**: Every PR → `sharp-edges`. Every diff → `differential-review`. Auth/crypto → `insecure-defaults`. Found vuln → `variant-analysis`.

**Quality**: TDD red→green→refactor. Reflexion if complexity>10, nesting>3, fn>50 lines. Context7 before recommending library patterns.

## MCP — Lazy via TOOL_SEARCH

Prefer MCP over CLI. TOOL_SEARCH active — discover tools on demand. One Context7 (MCP_DOCKER), one browser stack (Chrome=interactive, Preview=testing). shadcn MCP for components. Full routing: `skills/PLAYBOOK-TOOLS.md`.

## Scratchpad Directory

Use `C:/tmp/claude-scratchpad/` for ALL temporary file needs. Create on first use: `mkdir -p /c/tmp/claude-scratchpad/`.

## Auto Mode

When operating autonomously (auto mode, scheduled tasks, or agent hooks):
1. **Execute immediately** — make reasonable assumptions, proceed on low-risk work
2. **Minimize interruptions** — prefer assumptions over questions for routine decisions
3. **Prefer action over planning** — do not enter plan mode unless explicitly asked
4. **No destructive actions** — deletions/production changes still need confirmation
5. **No data exfiltration** — don't post to external services unless directed

## Context Budget

Load only what the task needs: 1 playbook, max 2 skills, INDEX.md scan (deep-read topics only when relevant). When tight, use inline knowledge over SKILL.md files.

Context threshold cascade (automated by hooks): 65% → WARNING (wrap up current task) → 70% → AUTO-CONTINUATION (handoff file written) → 72% → GUARD (expensive tools blocked, only Read/Glob/Grep/TodoWrite allowed) → 75% → CRITICAL (stop immediately).

## Mistake Learning — Automatic

Hooks capture tool failures to `logs/failures.jsonl`. `tool-failure-handler.js` (PostToolUseFailure) handles framework-level failures with circuit breaker (3+ consecutive → reassess approach). `subagent-verifier.js` (SubagentStop) checks agent deliverable quality. When `RECURRING FAILURE` signal appears → run `/learn` immediately. After user correction → offer `/learn`. When `MISTAKE LEARNING` signal appears → run `/analyze-mistakes` before other work.

## Validation Gates — Non-Negotiable

1. Never claim "done" without verification — tests pass, behavior confirmed
2. Never push/deploy without asking — explicit confirmation required
3. Always security-scan before completion — `sharp-edges` on changed files
4. Always use specialist skills — look up the right ID in REGISTRY.md for domain work

## When to Ask the User

**Ask** (with multiple-choice + defaults): ambiguous architecture, genuinely unclear scope, destructive ops, deployments, greenfield tech choices.

**Never ask** (just do it): tests, security scans, reading skill files, MCP tools, TDD, code validation, online research for context.

## Resource Lookup — Central Registry

**`~/.claude/skills/REGISTRY.md`** is the single source of truth for all skills, MCP servers, and plugins. Scan the Purpose column to find matching resource by ID, jump to its Path. **Never scan skill directories end-to-end.**

**`~/.claude/QUICK-REFERENCE.md`** — fast lookup: "I want to do X → use Y". Key files, session lifecycle, context budget cascade. Read when unsure which command/tool to use.

When a skill, MCP server, or plugin is added/removed: update REGISTRY.md immediately.

**After any system infrastructure change** (hooks, commands, settings.json, skills): update SYSTEM_CHANGELOG.md and REGISTRY.md. Non-negotiable.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure in your response, and suggest a fix. Never halt a session over broken infrastructure.
