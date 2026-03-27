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

**If `DREAM NEEDED` or `AUTO-DREAM TRIGGERED` signal appears**: Run `/dream` immediately before other work — this is NON-NEGOTIABLE, do not skip or defer. Three automatic triggers:
1. **SessionStart** — `session-start.sh` checks weekly interval (>7d), memory file count (>50), MEMORY.md lines (>150)
2. **PostCompact** — `post-compact-dream-check.sh` checks 3-day interval and 40-file threshold after context compaction
3. **Scheduled** — `weekly-dream` scheduled task runs every Monday ~9:17am automatically

## Session End Protocol — MANDATORY

**Every session gets reflected.** No exceptions. Run `/reflect` at end of every session. It handles: conflict detection, ID assignment, topic file creation, session logging, Memory Graph sync, and auto-pruning. If PreCompact hook fires, reflect IMMEDIATELY.

**Memory consolidation** (`/dream`): Now **fully automatic** via three triggers (session-start, post-compaction, weekly scheduled task). Manual `/dream` still available. Consolidates duplicates, fixes stale facts, prunes the index, resolves conflicts.

**State File Precedence** (canonical order — when resuming, read in this order):
1. `.flow/state.yaml` — Flow workflow state (machine-readable, authoritative for active Flow work)
2. `session-state.md` (project root) — Ephemeral session snapshot, overwritten each session
3. `~/.claude/.last-session-handoff` — Git state + todos from Stop hook (auto-generated)
4. `~/.claude/sessions/handoff-*.md` — Auto-continuation handoff (only if context limit was hit)

**Write session-state.md** before ending: `{ workflow: "flow"|"direct", active_skills: [...], branch: "...", next_action: "..." }`. This file is ephemeral — overwritten each session. It enables fast resume without re-parsing the full context.

Categories: Patterns (`G-PAT`), Solutions (`G-SOL`), Mistakes (`G-ERR`), Preferences (`G-PREF`), Failed Approaches (`G-FAIL`). Knowledge stored in `INDEX.md` → `topics/` files. Rules: never silently overwrite (use `conflicts.md`), filter PII, sequential IDs, dual storage (files + Memory Graph).

## Playbook Routing — Smart, Automatic

The detailed playbook is split into 3 focused files. **Load ONLY the one you need**, never all three.

| Playbook File | Load When | Contents |
|---|---|---|
| `skills/PLAYBOOK-WORKFLOWS.md` | Planning projects, choosing workflows, Flow lifecycle, classifying tasks | Task classification, Flow lifecycle, decision flowchart |
| `skills/PLAYBOOK-QUALITY.md` | Writing code, security scans, DevOps generation, quality processes | Security layers, DevOps gen+validate, language/framework expertise, TDD/Reflexion |
| `skills/PLAYBOOK-TOOLS.md` | Using MCP servers, looking up slash commands, checking built-in skills, updating system | MCP patterns, proactive behaviors, user prefs, built-in skills, slash command reference |

**Rules**: Load the matching playbook when CLAUDE.md routing tables aren't detailed enough. If a task spans two domains (e.g., writing code + choosing workflow), load the primary one first, then the secondary only if needed. Never load all three at once.

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

Full commands: `skills/flow/SKILL.md`. Depth: trivial→direct, small→quick, medium→plan+go, large→deep, massive→epic. `.flow/` exists → `/flow:status` for context.

## Research — Automatic

Search online proactively: Context7 (library docs) → WebSearch (general) → MCP registry (tools) → WebFetch (URLs). Do not guess when you can look up.

## Auto-Activation — On-Demand

When a task matches a domain, look up the matching resource in `REGISTRY.md` and read its SKILL.md.
Activation priority: (1) language/framework, (2) security on PR completion, (3) domain specialist, (4) tool specialist.
Max 2 specialist skills loaded simultaneously. Archived skills in `skills/skills-archive/` are fully usable.

**Self-Evolution (automatic)**: When you encounter a capability gap — a task needs tools you don't have, a workflow repeats 3+ times, or the user requests new capabilities — activate self-evolve (SK-038). This skill handles MCP server discovery (`mcp-find` → `mcp-add`), skill creation, and registry updates. Always ask before adding external MCP servers.

**Smart Swarm (automatic)**: When complexity scoring detects TEAM (8-11) or SWARM (12-15) level tasks, AUTOMATICALLY use `/flow:smart-swarm` — do NOT ask, just deploy agents. For DUO-level (5-7), automatically spawn 2 agents. For SOLO (0-4), execute directly. Scoring: file scope + concerns + risk + isolation + time pressure.

**Auto-Continuation (automatic)**: At 70% context usage, the context-monitor hook triggers a structured handoff. Write the handoff file when instructed, then the Stop hook spawns a new session that resumes autonomously. Chain depth limit: 5 sessions.

**Security (always)**: Every PR → `trailofbits-security/sharp-edges/`. Every diff → `trailofbits-security/differential-review/`.
Auth/crypto → `trailofbits-security/insecure-defaults/`. Found vuln → `trailofbits-security/variant-analysis/`.

**Quality (always)**: TDD red→green→refactor. Reflexion if complexity>10, nesting>3, fn>50 lines.
Context7 before recommending library patterns. DevOps generators always paired with validators.
Knowledge compounding: after non-trivial solutions, offer `/flow:compound`.

**Tier Routing (always)**: When spawning agents, apply `rules/tier-routing.md`:
Tier 1 (Bash) for deterministic transforms, Tier 2 (`model: "haiku"`) for pattern tasks,
Tier 3 (`model: "sonnet"`) for standard work, Tier 4 (Opus/default) for complex reasoning.
Agent profiler (HK-010) tracks per-agent EMA reliability in `logs/agent-profiles-summary.json`.

**Background Workers (deep/epic depth)**: During `/flow:go`, auto-spawn background quality agents
per `flow/references/background-workers.md`. Never block execution on workers.

**Truth Verification (flow:verify)**: Confidence scoring gate per `flow/references/truth-verification.md`.
>=0.95 auto-pass, 0.80-0.94 auto-pass with advisory, <0.80 auto-trigger gap closure. All automatic — never blocks.

**Project Init (on /new)**: Auto-generate project CLAUDE.md from stack-detected templates (SK-041).
Detects Next.js, Python, Flutter, Go, Rust, Rails, Node, .NET. Never overwrites existing.

Detailed activation tables (built-in skills, UI Design Stack layers, DevOps triggers): `skills/PLAYBOOK-QUALITY.md`

## MCP — Lazy via TOOL_SEARCH

Prefer MCP over CLI. TOOL_SEARCH active — discover tools on demand. One Context7 (MCP_DOCKER), one browser stack (Chrome=interactive, Preview=testing). shadcn MCP for components. Code Mode for batch MCP operations. Full routing: `skills/PLAYBOOK-TOOLS.md`.

## Scratchpad Directory

Use `C:/tmp/claude-scratchpad/` for ALL temporary file needs instead of `/tmp` or system temp dirs:
- Intermediate results during multi-step tasks
- Temporary scripts, configs, or working files
- Outputs that don't belong in the user's project
- Analysis artifacts, diffs, or data processing

Create the directory on first use: `mkdir -p /c/tmp/claude-scratchpad/`. This is isolated from projects and can be used freely.

## Auto Mode

When operating autonomously (auto mode, scheduled tasks, or agent hooks):
1. **Execute immediately** — make reasonable assumptions, proceed on low-risk work
2. **Minimize interruptions** — prefer assumptions over questions for routine decisions
3. **Prefer action over planning** — do not enter plan mode unless explicitly asked
4. **No destructive actions** — anything that deletes data or modifies shared/production systems still needs explicit confirmation
5. **No data exfiltration** — don't post to chat platforms or external services unless explicitly directed

## Context Budget

Load only what the task needs: 1 playbook, max 2 skills, INDEX.md scan (deep-read topics only when relevant). `/clear` at >70% usage. When tight, use inline knowledge over SKILL.md files.

## Mistake Learning — Automatic

Hooks capture tool failures automatically to `logs/failures.jsonl`. When a "RECURRING FAILURE" signal appears in context, run `/learn` immediately — don't wait for the user to ask. After any user correction ("no", "wrong", "don't do that"), proactively offer `/learn` to codify the lesson.

Weekly (or when session-start shows "Run /analyze-mistakes"): run `/analyze-mistakes` proactively at the start of the session before other work.

## Validation Gates — Non-Negotiable

1. Never claim "done" without verification — tests pass, behavior confirmed
2. Never push/deploy without asking — explicit confirmation required
3. Always validate generated IaC — every generator has a validator
4. Always security-scan before completion — `sharp-edges` on changed files
5. Always use specialist skills — look up the right ID in REGISTRY.md for domain work

## When to Ask the User

**Ask** (with multiple-choice + defaults): ambiguous architecture, genuinely unclear scope, destructive ops, deployments, greenfield tech choices.

**Never ask** (just do it): tests, security scans, reading skill files, MCP tools, TDD, code validation, online research for context.

## Resource Lookup — Central Registry

**`~/.claude/skills/REGISTRY.md`** is the single source of truth for all skills, MCP servers, and plugins. Every resource has a unique ID, one-line purpose, and exact path.

**How to use**: When a task arrives, scan the REGISTRY's Purpose column to find the matching resource by ID. Jump directly to its Path. **Never scan skill directories end-to-end.** Never read multiple SKILL.md files to figure out what's available.

**Maintenance**: When a skill, MCP server, or plugin is added, append its entry to REGISTRY.md immediately. When removed or merged, update or delete the entry.

**ID scheme**: `SK-xxx` (standalone skills), `DV-xxx` (DevOps), `SC-xxx` (security), `FS-xxx` (fullstack), `CE-xxx` (context engineering), `CP-xxx` (compound), `CT-xxx` (CLI tools), `MCP-xxx` (MCP servers), `PLG-xxx` (plugins), `PB-xxx` (playbooks)

## Self-Upgrade Loop — The System Improves Itself

Three compounding loops keep this system getting better:

**Loop 1 — Mistake Learning (every session)**
Tool failures → `logs/failures.jsonl` (automatic via hook) → recurring patterns detected → `/learn` creates G-ERR topics → rules/ entries for 3+ violations → hooks for persistent violations.
Trigger: RECURRING FAILURE signal = run `/learn` immediately. User correction = offer `/learn`.

**Loop 2 — Weekly Maintenance + Dream (scheduled: Monday ~9am)**
`/analyze-mistakes` audits failure patterns → `/health` checks system integrity → stale knowledge pruned → self-upgrade recommendations.
`weekly-dream` scheduled task runs `/dream` automatically every Monday for memory consolidation.
Trigger: Scheduled tasks. Also run proactively when session-start emits MISTAKE LEARNING or DREAM NEEDED signal.

**Loop 3 — Platform Evolution (on CLI version change)**
`session-start.sh` detects Claude Code update → `/health` fetches changelog → impact assessment on hooks/settings → `/system-update` applies changes → SYSTEM_CHANGELOG.md records what changed.
Trigger: Automatic via session-start.sh version check.

**After any system infrastructure change** (hooks, commands, settings.json, skills): update SYSTEM_CHANGELOG.md and REGISTRY.md. This is non-negotiable.

## Graceful Degradation

If a skill, hook, or script is missing or fails: continue without it, note the failure in your response, and suggest a fix. Never halt a session over broken infrastructure.
