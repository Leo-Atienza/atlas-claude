# Leo's Claude System

**A self-evolving, self-continuing, multi-agent AI operating system built on Claude Code.**

282 skills | 72+ agents | 176 registered resources | 15+ languages | 8 lifecycle hooks

Built by [Leo Atienza](https://github.com/Leo-Atienza)

---

## What Is This?

This isn't just a `CLAUDE.md` with some rules. It's a **full infrastructure layer** that transforms Claude Code from a stateless chatbot into a persistent, self-improving engineering team.

The system:
- **Continues its own work** when context runs out (auto-continuation at 70%)
- **Deploys agent teams automatically** based on task complexity scoring
- **Grows its own capabilities** by creating skills and adding MCP servers when it detects gaps
- **Learns from mistakes** across sessions through a three-loop self-evolution system
- **Auto-generates architecture diagrams** as Mermaid on every codebase mapping

## Quick Start

```bash
# Clone into your Claude Code config directory
git clone https://github.com/Leo-Atienza/claude-system.git ~/.claude-system-ref

# Copy the structure you want (don't overwrite your existing ~/.claude/)
# Start with CLAUDE.md, settings.json, and hooks/
cp ~/.claude-system-ref/examples/CLAUDE.md ~/.claude/CLAUDE.md
cp ~/.claude-system-ref/examples/settings.json ~/.claude/settings.json
cp -r ~/.claude-system-ref/examples/hooks/ ~/.claude/hooks/
cp -r ~/.claude-system-ref/examples/rules/ ~/.claude/rules/
```

> **Warning**: This is a reference implementation. Adapt it to your needs rather than copying blindly. The full system has 282 skills — you probably want to start with the core and add domains as needed.

## System Architecture

```
~/.claude/
├── CLAUDE.md                    # Master instructions (routing, rules, behaviors)
├── settings.json                # Hooks, permissions, env vars, plugins
├── rules/                       # Modular rules (git, security, testing, general)
├── hooks/                       # 8 lifecycle hooks (JS/Bash/Python)
│   ├── session-start.sh         # Session init: reflection, health, mermaid, version
│   ├── session-stop.sh          # Session end: handoff, todos, auto-continuation
│   ├── context-monitor.js       # Real-time context tracking + auto-continuation trigger
│   ├── statusline.js            # Visual status bar with context usage
│   ├── security-gate.sh         # PreToolUse: blocks secrets and credentials
│   ├── mistake-capture.py       # PostToolUse: logs failures, detects patterns
│   └── ...
├── scripts/
│   ├── auto-continue.sh         # Spawns new session with --resume at 70% context
│   └── smoke-test.sh            # 27-check system validation
├── skills/                      # 282 SKILL.md files across 15+ domains
│   ├── REGISTRY.md              # Single source of truth (176 entries)
│   ├── PLAYBOOK-WORKFLOWS.md    # Task classification & Flow lifecycle
│   ├── PLAYBOOK-QUALITY.md      # Security, DevOps, TDD, language expertise
│   ├── PLAYBOOK-TOOLS.md        # MCP patterns, proactive behaviors
│   ├── self-evolve/SKILL.md     # Meta-skill: autonomous capability growth
│   ├── smart-swarm/SKILL.md     # Auto-deploy multi-agent teams
│   ├── flow/SKILL.md            # Unified workflow system (20 commands, 15 agents)
│   └── ...
├── commands/                    # 29 slash commands
│   ├── flow/                    # Flow system commands (start, plan, go, map, ship, ...)
│   └── continue.md              # Manual session continuation
├── agents/                      # 72+ specialized agents
│   ├── smart-swarm-coordinator.md
│   ├── flow-executor.md
│   ├── flow-verifier.md
│   └── ...
├── logs/                        # Auto-populated by hooks
│   ├── failures.jsonl           # Tool failure log
│   └── error-patterns.json      # Recurring error fingerprints
└── sessions/                    # Auto-continuation handoff files
```

## The 5 Entry Points

Everything funnels through 5 commands. You never need to think about workflows, agents, or routing:

| Command | Plain English | What Happens |
|---------|--------------|-------------|
| `/new` | "build X", "create X" | Classifies task, auto-detects depth, initializes Flow |
| `/resume` | "continue", "pick up" | Reads state files in precedence order, restores context |
| `/task` | "fix X", "add X" | One-off task, auto-routes by complexity |
| `/done` | "wrap up" | Reflects, captures knowledge, saves state |
| `/ship` | "push this" | Commits, pushes, opens PR, runs security scan |

## 7 Autonomous Behaviors

These happen **automatically** — no user action required:

### 1. Auto-Continuation at 70% Context

When context usage hits 70%, the system writes a structured handoff file and spawns a new session that picks up exactly where it left off.

```
statusline.js → bridge file → context-monitor.js → handoff trigger
→ agent writes handoff → Stop hook → auto-continue.sh → new session with --resume
```

Chain depth limit: 5 sessions. Uses `--resume` to preserve session history.

### 2. Auto-Deploy Agent Swarms

Every task is scored across 5 dimensions (0-15):

| Score | Mode | What Happens |
|-------|------|-------------|
| 0-4 | SOLO | Execute directly, no agents |
| 5-7 | DUO | Auto-spawn 2 agents in parallel |
| 8-11 | TEAM | Deploy 3-4 agents with coordinator |
| 12-15 | SWARM | Full wave execution with worktree isolation |

**Claude doesn't ask** — it scores and routes automatically. TEAM/SWARM agents get isolated git worktrees to prevent file conflicts.

### 3. Self-Evolution

When Claude detects a capability gap:
- **Missing tool?** → `mcp-find` → proposes free MCP server → `mcp-add` on approval
- **Repeated pattern (3x)?** → Creates a new skill automatically
- **Domain knowledge?** → Searches Context7 first, creates skill only if recurring

### 4. Mermaid Architecture Diagrams

- **Session start**: Detects existing `.mmd` files, signals Claude to load them
- **After `/flow:map`**: Auto-generates a Mermaid diagram from architecture analysis
- Saved to `docs/diagrams/architecture.mmd` (persistent) and `.flow/codebase/` (ephemeral)

### 5. Ticket-to-PR

`/flow:start Fix #123` auto-fetches the GitHub issue (title, body, labels, acceptance criteria) and injects it into the plan context. Also works with full URLs.

### 6. Mistake Learning Loop

```
Tool failure → mistake-capture.py → failures.jsonl → fingerprint → error-patterns.json
→ 3+ occurrences → "RECURRING FAILURE" signal → /learn → G-ERR topic → permanent rule
```

### 7. Defense-in-Depth Security

- **PreToolUse**: `security-gate.sh` blocks 20+ secret patterns in ~10ms
- **PostToolUse**: Trail of Bits skills (sharp-edges, differential-review, insecure-defaults)
- **At PR**: Full security scan before shipping

## The Flow System

A unified workflow replacing 63 commands from three predecessor systems. One "complexity dial":

| Depth | When | What |
|-------|------|------|
| Trivial | <20 lines, 1 file | Just do it |
| Quick | Small, well-defined | Minimal ceremony, still tracked |
| Standard | 3-10 files | Plan → Execute |
| Deep | 10-30 files | Full planning + parallel agents + verification |
| Epic | System-wide | Wave-based execution with swarm mode |

**20 Flow commands**: start, plan, go, quick, map, review, verify, ship, debug, discover, brainstorm, ground, compound, complete, retro, status, test, smart-swarm, and more.

**15 Flow agents**: planner, executor, verifier, mapper, debugger, UAT, external-researcher, repo-analyst, learnings-researcher, research-synthesizer, git-analyst, compound-writer, risk-assessor, plan-checker, smart-swarm-coordinator.

## Skill Domains

| Domain | Skills | Examples |
|--------|--------|---------|
| Languages | 10+ | Python, TypeScript, Go, Rust, Swift, Kotlin, Java, SQL, Bash, Dart |
| Frontend | 15+ | React, Next.js, Expo, React Native, SwiftUI, Compose, Tailwind, Three.js |
| Backend | 10+ | FastAPI, Express, GraphQL, REST, gRPC, WebSockets |
| DevOps | 31 | Terraform, Docker, K8s, Helm, Ansible, CI/CD, Checkov (generators + validators) |
| Security | 28 | Trail of Bits skills, OWASP, secrets detection, variant analysis |
| Documents | 4 | PDF, DOCX, PPTX, XLSX (create, read, edit, fill forms) |
| Design | 5+ | Frontend design, UI design stack (50+ styles, 161 palettes), Figma-to-code |
| Video | 1 | Remotion programmatic video |
| Data | 3+ | Neon Postgres, database optimization, migrations |
| Meta | 5+ | Skill creation, self-evolution, system health, smoke testing |

## Hook Lifecycle

```
SessionStart
  ├── Progressive Learning (reflection, conflicts, handoff)
  ├── Mermaid diagram detection
  ├── Skill health check (daily)
  ├── Version staleness check
  ├── Mistake pattern summary
  ├── Stale plan cleanup
  └── Log rotation

PreToolUse
  ├── security-gate.sh (secrets/credentials blocking)
  ├── bash_hook.py (dangerous command detection)
  ├── file_length_limit_hook.py
  └── read_env_protection_hook.py

PostToolUse
  ├── auto-formatter (prettier/dart)
  ├── context-monitor.js (context tracking + auto-continuation)
  └── mistake-capture.py (failure logging + pattern detection)

PreCompact → precompact-reflect.sh (force reflection)

Stop
  ├── session-stop.sh (reflection flag, handoff, todos, auto-continuation)
  ├── verify-completion.py (task completion check)
  └── agent hook (verification + tests)
```

## State Management

Canonical precedence order (when resuming, read in this order):

1. **`.flow/state.yaml`** — Flow workflow state (authoritative for active Flow work)
2. **`session-state.md`** — Ephemeral session snapshot
3. **`~/.claude/.last-session-handoff`** — Git state + todos from Stop hook
4. **`~/.claude/sessions/handoff-*.md`** — Auto-continuation handoff files

## System Validation

Run the smoke test to verify your installation:

```bash
bash ~/.claude/scripts/smoke-test.sh
```

Checks 27 things across 9 categories: critical files, hooks, settings validity, registry integrity, logging infrastructure, auto-continuation, core skills, core commands, and hook functionality.

## Community Research

This system was informed by research across X/Twitter, Reddit, GitHub, and blogs. Key inspirations:

- **Boris Cherny** (Claude Code creator) — Parallel sessions, living CLAUDE.md, verification loops
- **Boris Tane** — Annotation Cycle for plan review
- **John Kim** — Context engineering framework, 4 composable primitives
- **Chris Wiles** — Enterprise `.claude/` with JIRA-to-PR and GitHub Actions
- **John Lindquist** — Mermaid diagrams as compressed context
- **incident.io** — Worktree management for parallel development
- **Trail of Bits** — Security skill pack

The full community research report (`claude-code-community-report.md`) covers 25 contributors and their techniques.

## Comparison to Community

| vs. | Verdict |
|-----|---------|
| Boris Cherny's setup | His is deliberately minimal. This is 100x more infrastructure for complex workflows. |
| Chris Wiles' enterprise showcase | This exceeds in scope (282 vs ~20 skills), automation depth, and self-evolution. |
| Shinpr's 20-agent framework | This has 72+ agents, plus auto-continuation, context monitoring, and self-evolution. |
| Community average | Most use CLAUDE.md + 2-3 hooks. This is orders of magnitude more sophisticated. |

## What's Novel (Not Found Elsewhere)

1. **Auto-continuation** with structured handoff and `--resume` session chaining
2. **Complexity-driven auto-routing** that deploys agents without asking
3. **Self-evolution** that autonomously creates skills and adds MCP servers
4. **Three-loop mistake learning** (capture → pattern → permanent rules)
5. **Context monitor** with real-time awareness, debounce, and escalation

## License

MIT License. Use it, modify it, make it yours.

## Author

**Leo Atienza** — [GitHub](https://github.com/Leo-Atienza)

Built with Claude Code (Opus 4.6) and an unhealthy amount of ambition.
