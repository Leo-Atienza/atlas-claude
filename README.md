<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/atlas-banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/atlas-banner-light.svg">
    <img alt="ATLAS" src="assets/atlas-banner-dark.svg" width="600">
  </picture>
</p>

<h3 align="center"><b>A</b>utonomous <b>T</b>ask, <b>L</b>earning, and <b>A</b>gent <b>S</b>ystem</h3>

<p align="center">
  A self-evolving AI operating system for Claude Code<br>
  <sub>282 skills &bull; 72+ agents &bull; 176 resources &bull; 15+ languages &bull; 8 lifecycle hooks</sub>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#the-7-autonomous-behaviors">7 Behaviors</a> &bull;
  <a href="#the-flow-system">Flow System</a> &bull;
  <a href="#skill-domains">Skills</a> &bull;
  <a href="#hook-lifecycle">Hooks</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/claude_code-opus_4.6-blueviolet?style=flat-square" alt="Claude Code">
  <img src="https://img.shields.io/badge/skills-282-blue?style=flat-square" alt="Skills">
  <img src="https://img.shields.io/badge/agents-72+-green?style=flat-square" alt="Agents">
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="License">
</p>

---

## What is ATLAS?

ATLAS isn't a CLAUDE.md with some rules. It's a **full infrastructure layer** that transforms Claude Code from a stateless chatbot into a persistent, self-improving engineering team.

```
       ┌──────────────────────────────────────────────┐
       │                  A T L A S                   │
       │     Autonomous Task, Learning & Agent System │
       ├──────────────────────────────────────────────┤
       │                                              │
       │  /new  /resume  /task  /done  /ship          │  ← 5 Entry Points
       │         │                                    │
       │         ▼                                    │
       │  ┌─────────────┐  ┌───────────────────────┐  │
       │  │ Flow System │  │  Smart Swarm (auto)   │  │  ← Task Routing
       │  │ quick→epic  │  │  SOLO→DUO→TEAM→SWARM  │  │
       │  └──────┬──────┘  └──────────┬────────────┘  │
       │         │                    │               │
       │         ▼                    ▼               │
       │  ┌──────────┐  ┌────────┐  ┌────────────┐    │
       │  │ 282      │  │ 72+    │  │ 8 Hooks    │    │  ← Execution
       │  │ Skills   │  │ Agents │  │ (lifecycle)│    │
       │  └──────────┘  └────────┘  └────────────┘    │
       │         │                    │               │
       │         ▼                    ▼               │
       │  ┌───────────────────────────────────────┐   │
       │  │  Self-Evolution  │  Mistake Learning  │   │  ← Growth
       │  │  (auto-create    │  (capture→pattern  │   │
       │  │   skills+MCPs)   │   →permanent rule) │   │
       │  └───────────────────────────────────────┘   │
       │         │                                    │
       │         ▼                                    │
       │  ┌──────────────────────────────────────┐    │
       │  │  Auto-Continuation (at 70% context)  │    │  ← Persistence
       │  │  handoff → new session → --resume    │    │
       │  └──────────────────────────────────────┘    │
       └──────────────────────────────────────────────┘
```

**It continues its own work** when context runs out. **It deploys agent teams automatically** based on task complexity. **It grows its own capabilities** by creating skills and adding MCP servers. **It learns from mistakes** across sessions.

## Quick Start

```bash
# Clone
git clone https://github.com/Leo-Atienza/atlas-claude.git

# Install (safe — never overwrites existing files)
cd atlas-claude
bash install.sh

# Verify
bash ~/.claude/scripts/smoke-test.sh
```

The installer creates the full directory structure and copies core files to `~/.claude/`. Existing files are preserved.

## The 5 Entry Points

Everything funnels through 5 commands. You never need to think about the 282 skills, 72 agents, or 20 Flow commands underneath.

| Command | What You Say | What ATLAS Does |
|---------|-------------|-----------------|
| `/new` | "build X", "create X" | Classifies task → auto-detects depth → initializes Flow → routes to agents |
| `/resume` | "continue", "pick up" | Reads state files in precedence order → restores full context → continues |
| `/task` | "fix X", "add X" | One-off task → auto-routes by complexity scoring |
| `/done` | "wrap up" | Reflects → captures knowledge → saves state → commits |
| `/ship` | "push this" | Commits → pushes → opens PR → security scan |

## The 7 Autonomous Behaviors

These happen **without user action**. ATLAS monitors, decides, and acts.

### 1. Auto-Continuation

When context hits 70% usage, ATLAS writes a structured handoff file and spawns a new session that picks up exactly where it left off.

```
context-monitor.js (70% trigger)
  → agent writes handoff file (task, branch, files, plan, next action)
  → session ends
  → session-stop.sh detects trigger
  → auto-continue.sh spawns: claude --resume $SESSION_ID
  → new session reads handoff → resumes from exact point
```

Chain depth limit: 5 sessions. Uses `--resume` to preserve session history.

### 2. Smart Swarm Auto-Deploy

Every task is scored across 5 dimensions (0-15 scale):

| Dimension | What It Measures | 0 | 1 | 2 | 3 |
|-----------|-----------------|---|---|---|---|
| File Scope | Files affected | 1-2 | 3-5 | 6-15 | 16+ |
| Concerns | Independent concerns | 1 | 2 | 3-4 | 5+ |
| Risk | Consequence of failure | Low | Medium | High | Critical |
| Isolation | Subtask independence | Dependent | Mostly dep. | Mostly indep. | Fully indep. |
| Time Pressure | Urgency | None | Implied | Explicit | Blocking |

**ATLAS doesn't ask — it scores and routes:**

| Score | Mode | What Happens |
|-------|------|-------------|
| 0-4 | **SOLO** | Execute directly |
| 5-7 | **DUO** | Auto-spawn 2 agents in parallel |
| 8-11 | **TEAM** | Deploy 3-4 agents with coordinator |
| 12-15 | **SWARM** | Full wave execution, worktree isolation per agent |

### 3. Self-Evolution

When ATLAS detects a capability gap:

```
Missing tool?  → mcp-find → propose free server → mcp-add on approval → register
Repeated 3x?  → Create new skill automatically → register in REGISTRY.md
Need knowledge? → Search Context7 first → create skill only if recurring
```

### 4. Mermaid Architecture Auto-Generation

- **Session start**: Detects existing `.mmd` files, signals to load for context
- **After `/flow:map`**: Auto-generates Mermaid diagram from architecture analysis
- Saves to `docs/diagrams/architecture.mmd` (persistent) and `.flow/codebase/` (ephemeral)

### 5. Ticket-to-PR

```bash
/flow:start Fix #123
```

ATLAS auto-fetches the GitHub issue (title, body, labels, acceptance criteria) and injects it into the plan context. Works with `#123`, `GH-123`, and full GitHub URLs.

### 6. Three-Loop Mistake Learning

```
Loop 1: Tool failure → mistake-capture.py → failures.jsonl → fingerprint
        → 3+ occurrences → "RECURRING FAILURE" signal → /learn → G-ERR topic

Loop 2: Weekly maintenance → /analyze-mistakes audits patterns
        → /health checks integrity → recommendations generated

Loop 3: Claude Code update detected → changelog impact assessment
        → /system-update applies changes
```

### 7. Defense-in-Depth Security

```
Layer 1 (PreToolUse):  security-gate.sh — blocks 20+ secret patterns in ~10ms
Layer 2 (PostToolUse): Trail of Bits skills — sharp-edges, differential-review
Layer 3 (At PR):       Full security scan before shipping
```

## The Flow System

One unified workflow replacing 63 commands from three predecessor systems. A single "complexity dial" scales from trivial to epic:

```
Trivial ──→ Quick ──→ Standard ──→ Deep ──→ Epic
(<20 lines)  (small)   (3-10 files)  (10-30)   (system-wide)
  │            │          │            │           │
  ▼            ▼          ▼            ▼           ▼
 Just do    Minimal    Plan →      Full plan   Wave-based
   it       ceremony   Execute    + parallel    + swarm
                                   agents       mode
```

**20 Flow commands**: start, plan, go, quick, map, review, verify, ship, debug, discover, brainstorm, ground, compound, complete, retro, status, test, smart-swarm, and more.

**15 Flow agents**: planner, executor, verifier, mapper, debugger, UAT, researcher, repo-analyst, learnings-researcher, synthesizer, git-analyst, compound-writer, risk-assessor, plan-checker, swarm-coordinator.

## Skill Domains

| Domain | Count | Highlights |
|--------|-------|-----------|
| **Languages** | 10+ | Python, TypeScript, Go, Rust, Swift, Kotlin, Java, SQL, Bash, Dart |
| **Frontend** | 15+ | React, Next.js, Expo, React Native, SwiftUI, Compose, Tailwind, Three.js |
| **Backend** | 10+ | FastAPI, Express, GraphQL, REST, gRPC, WebSockets |
| **DevOps** | 31 | Terraform, Docker, K8s, Helm, Ansible, CI/CD (generators + validators) |
| **Security** | 28 | Trail of Bits skills, OWASP, secrets detection, variant analysis |
| **Documents** | 4 | PDF, DOCX, PPTX, XLSX (create, read, edit, fill) |
| **Design** | 5+ | Frontend design, UI stack (50+ styles, 161 palettes), Figma-to-code |
| **Video** | 1 | Remotion programmatic video |
| **Data** | 3+ | Neon Postgres, database optimization, migrations |
| **Meta** | 5+ | Skill creation, self-evolution, system health, smoke testing |

## Hook Lifecycle

```
┌─ SessionStart ─────────────────────────────────────────────┐
│  Progressive Learning checks (reflection, conflicts)       │
│  Mermaid diagram detection                                 │
│  Skill health check (daily)                                │
│  Version staleness + Claude Code version detection         │
│  Mistake pattern summary                                   │
│  Stale plan cleanup + log rotation                         │
└────────────────────────────────────────────────────────────┘

┌─ PreToolUse ───────────────────────────────────────────────┐
│  security-gate.sh → blocks secrets, credentials, .env      │
│  bash_hook.py → blocks dangerous commands                  │
│  file_length_limit_hook.py → prevents file bloat           │
│  read_env_protection_hook.py → protects env files          │
└────────────────────────────────────────────────────────────┘

┌─ PostToolUse ──────────────────────────────────────────────┐
│  Auto-formatter (prettier / dart format)                   │
│  context-monitor.js → tracks usage, triggers continuation  │
│  mistake-capture.py → logs failures, detects patterns      │
└────────────────────────────────────────────────────────────┘

┌─ PreCompact ───────────────────────────────────────────────┐
│  precompact-reflect.sh → force reflection before cutoff    │
└────────────────────────────────────────────────────────────┘

┌─ Stop ─────────────────────────────────────────────────────┐
│  session-stop.sh → handoff, todos, auto-continuation       │
│  verify-completion.py → task completion check               │
│  agent hook → verification + tests                         │
└────────────────────────────────────────────────────────────┘
```

## State Management

Canonical precedence (when resuming, ATLAS reads in this order):

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `.flow/state.yaml` | Flow workflow state (authoritative) |
| 2 | `session-state.md` | Ephemeral session snapshot |
| 3 | `~/.claude/.last-session-handoff` | Git state + todos from Stop hook |
| 4 | `~/.claude/sessions/handoff-*.md` | Auto-continuation handoff |

## System Validation

```bash
bash ~/.claude/scripts/smoke-test.sh
```

27 checks across 9 categories: critical files, hooks, settings validity, registry integrity, logging, auto-continuation, core skills, core commands, hook functionality.

```
=== Results ===
  PASS: 27
  WARN: 0
  FAIL: 0

STATUS: ALL CLEAR
```

## What's in This Repo

```
atlas-claude/
├── README.md              # You're reading it
├── LICENSE                # MIT
├── install.sh             # One-command installer (safe, no overwrites)
└── examples/
    ├── CLAUDE.md          # Master instructions template
    ├── settings.json      # Hook configuration template
    ├── hooks/
    │   ├── context-monitor.js     # Real-time context tracking + auto-continuation
    │   ├── session-start.sh       # 8-section session initialization
    │   ├── session-stop.sh        # Handoff + todos + auto-continuation
    │   ├── statusline.js          # Visual status bar
    │   ├── security-gate.sh       # Secrets/credentials blocking
    │   └── mistake-capture.py     # Failure logging + pattern detection
    ├── rules/
    │   ├── general.md     # Platform, code quality, naming, workflow
    │   ├── git.md         # Branch naming, commits, PRs
    │   ├── security.md    # Input validation, auth, secrets
    │   └── testing.md     # TDD, assertions, mocking
    ├── scripts/
    │   ├── auto-continue.sh       # Session chaining with --resume
    │   └── smoke-test.sh          # 27-check system validator
    ├── skills/
    │   ├── self-evolve/           # Meta-skill: autonomous capability growth
    │   └── smart-swarm/           # Auto-deploy multi-agent teams
    ├── commands/
    │   ├── continue.md            # Manual session continuation
    │   └── flow/smart-swarm.md    # Complexity-scored agent deployment
    └── agents/
        └── smart-swarm-coordinator.md  # Multi-agent team orchestrator
```

## Compared to the Community

| Setup | Skills | Agents | Auto-Continue | Self-Evolve | Smart Swarm |
|-------|--------|--------|---------------|-------------|-------------|
| **ATLAS** | **282** | **72+** | **Yes** | **Yes** | **Yes** |
| Boris Cherny (CC creator) | ~5 | 2 | No | No | No |
| Chris Wiles (enterprise) | ~20 | ~5 | No | No | No |
| Shinpr (multi-agent) | ~10 | ~20 | No | No | Partial |
| Community average | 2-5 | 0-2 | No | No | No |

## What's Novel (Not Found Elsewhere)

1. **Auto-continuation** — context-aware session chaining with structured handoff
2. **5D complexity scoring** — automatic agent team deployment without asking
3. **Self-evolution** — creates skills and adds MCP servers when gaps detected
4. **Three-loop learning** — mistake capture → pattern detection → permanent rules
5. **Context monitor** — real-time awareness with debounce and escalation

## Research

ATLAS was informed by deep research across X/Twitter, Reddit, GitHub, and blogs — covering 25+ contributors and their techniques. The full community intelligence report is available in the repo wiki.

## License

MIT License. Use it, modify it, make it yours.

## Author

**Leo Atienza** — [GitHub](https://github.com/Leo-Atienza)

<p align="center">
  <sub>Built with Claude Code (Opus 4.6) and an unhealthy amount of ambition.</sub>
</p>
