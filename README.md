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
  <sub>It doesn't just follow instructions — it learns, adapts, and grows itself.</sub>
</p>

<p align="center">
  <a href="#-what-is-atlas">What</a> &bull;
  <a href="#quick-start">Install</a> &bull;
  <a href="#the-6-entry-points">Commands</a> &bull;
  <a href="#autonomous-behaviors">Behaviors</a> &bull;
  <a href="#the-flow-system">Flow</a> &bull;
  <a href="#hook-lifecycle">Hooks</a> &bull;
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/claude_code-opus_4.6-blueviolet?style=flat-square" alt="Claude Code">
  <img src="https://img.shields.io/badge/version-2.5.0-informational?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/skills-282-blue?style=flat-square" alt="Skills">
  <img src="https://img.shields.io/badge/agents-72+-green?style=flat-square" alt="Agents">
  <img src="https://img.shields.io/badge/hooks-18-yellow?style=flat-square" alt="Hooks">
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="License">
</p>

---

## What is ATLAS?

Most Claude Code setups are a `CLAUDE.md` with some rules. ATLAS is a **full infrastructure layer** — 18 lifecycle hooks, 72 specialized agents, a progressive learning system, and self-evolution capabilities that let Claude Code grow its own toolset.

<table>
<tr>
<td width="50%">

**What you type:**
```
build a REST API for user management
```

**What ATLAS does:**
1. Scores complexity → **TEAM** (score: 9)
2. Spawns 3 agents: architect, implementer, tester
3. Routes to Tier 3 (Sonnet) for cost efficiency
4. Loads relevant skills (FastAPI, security, testing)
5. Executes with parallel agents in isolated worktrees
6. Security scans before marking done
7. Learns from any mistakes for next time

</td>
<td width="50%">

```
       ┌──────────────────────────────────┐
       │            A T L A S             │
       ├──────────────────────────────────┤
       │                                  │
       │  /new  /resume  /task  /done     │ ← You
       │         │                        │
       │         ▼                        │
       │  ┌───────────┐  ┌───────────┐    │
       │  │   Flow    │  │   Smart   │    │ ← Routing
       │  │  System   │  │   Swarm   │    │
       │  └─────┬─────┘  └─────┬─────┘    │
       │        ▼              ▼          │
       │  ┌──────────────────────────┐    │
       │  │ 282 Skills · 72 Agents   │    │ ← Execution
       │  │ 18 Hooks  · 5 Rules      │    │
       │  └──────────┬───────────────┘    │
       │             ▼                    │
       │  ┌──────────────────────────┐    │
       │  │ Learn · Evolve · Grow    │    │ ← Growth
       │  └──────────────────────────┘    │
       └──────────────────────────────────┘
```

</td>
</tr>
</table>

> **TL;DR** — It continues its own work when context runs out. It deploys agent teams based on task complexity. It creates new skills when it finds capability gaps. It learns from mistakes across sessions.

---

## Quick Start

```bash
# Clone
git clone https://github.com/Leo-Atienza/atlas-claude.git

# Install (safe — never overwrites existing files)
cd atlas-claude && bash install.sh

# Verify (27 checks across 9 categories)
bash ~/.claude/scripts/smoke-test.sh
```

---

## The 6 Entry Points

Everything funnels through 6 commands. You never need to think about the 282 skills, 72 agents, or 37 commands underneath.

| Command | Plain English | What Happens Under the Hood |
|:-------:|:-------------|:---------------------------|
| `/new` | "build X", "create X" | Classifies task → auto-detects depth → initializes Flow → routes to agents |
| `/resume` | "continue", "pick up" | Reads 4 state files in precedence order → restores full context → continues |
| `/task` | "fix X", "add X" | One-off routing → complexity scoring → direct execution |
| `/done` | "wrap up" | Reflects → captures knowledge → saves state → commits |
| `/ship` | "push this" | Commits → pushes → opens PR → security scan |
| `/dream` | "consolidate" | Deep memory merge → prune stale → resolve conflicts → reindex |

---

## Autonomous Behaviors

These happen **without user action**. ATLAS monitors, decides, and acts.

### Auto-Continuation

When context hits 70%, ATLAS doesn't just stop — it writes a structured handoff and spawns a new session that picks up exactly where it left off. Chain depth limit: 5 sessions.

```
context-monitor.js detects 70% usage
  → writes handoff (task, branch, files, plan, next action)
  → session ends gracefully
  → auto-continue.sh spawns: claude --resume $SESSION_ID
  → new session reads handoff → resumes from exact point
```

### Smart Swarm

Every task is scored across 5 dimensions on a 0-15 scale:

```
 File Scope ──┐
 Concerns ────┤
 Risk ────────┼── Score ──→ SOLO (0-4)  │ DUO (5-7)  │ TEAM (8-11) │ SWARM (12-15)
 Isolation ───┤            execute      2 agents      3-4 agents    wave execution
 Urgency ─────┘            directly     in parallel   + coordinator  + worktrees
```

Combined with **three-tier model routing** — haiku for simple subtasks, sonnet for implementation, opus for architecture — to cut token costs 30-50% without sacrificing quality.

### Self-Evolution

```
Capability gap detected?
  ├─ Missing tool    → search MCP registry → propose server → add on approval
  ├─ Repeated 3x     → auto-create new skill → register in REGISTRY.md
  └─ Need knowledge  → Context7 lookup → create skill only if recurring
```

### Three-Loop Mistake Learning

```
Loop 1 (Real-time):   Tool failure → fingerprint → 3+ matches → "RECURRING FAILURE" → /learn
Loop 2 (Weekly):      /analyze-mistakes audits patterns → /health checks integrity
Loop 3 (On update):   Claude Code changelog detected → impact assessment → /system-update
```

### Skill Archiving & Auto-Recovery

Skills you don't use are archived, not deleted. When your project needs them, they auto-activate:

```
SessionStart → skill-watcher.sh scans project files
  Dockerfile found?  → AUTO-ACTIVATE: dockerfile-generator
  go.mod found?      → AUTO-ACTIVATE: golang-pro
  *.sol found?       → AUTO-ACTIVATE: building-secure-contracts
```

60+ technology detection patterns. Zero manual maintenance.

### Defense-in-Depth Security

```
Layer 1 (PreToolUse):  security-gate.sh blocks 20+ secret patterns
Layer 2 (PreToolUse):  context-guard.js blocks expensive ops at 72% context
Layer 3 (PostToolUse): Trail of Bits skills — sharp-edges, differential-review
Layer 4 (At PR):       Full security scan before shipping
```

---

## The Flow System

One unified workflow system. A single "complexity dial" scales from trivial to epic:

```
Trivial ─────→ Quick ─────→ Standard ─────→ Deep ─────→ Epic
(<20 lines)    (small)      (3-10 files)    (10-30)     (system-wide)
    │             │              │              │             │
    ▼             ▼              ▼              ▼             ▼
 Just do      Minimal       Plan →         Full plan     Wave-based
   it         ceremony      Execute       + parallel      + swarm
                                           agents         mode
```

**20 Flow commands** — start, plan, go, quick, map, review, verify, ship, debug, discover, brainstorm, ground, compound, complete, retro, status, test, smart-swarm, and more.

**15 specialized agents** — planner, executor, verifier, mapper, debugger, UAT, researcher, repo-analyst, learnings-researcher, synthesizer, git-analyst, compound-writer, risk-assessor, plan-checker, swarm-coordinator.

---

## Hook Lifecycle

18 hooks across 10 lifecycle events create a fully reactive system:

```
┌─ SessionStart (3 hooks) ──────────────────────────────────────┐
│  session-start.sh      9-section init, lessons, log rotation  │
│  skill-watcher.sh      Auto-activate archived skills          │
│  sync-skill-keywords   Regenerate keyword→skill cache         │
├─ UserPromptSubmit (2 hooks) ──────────────────────────────────┤
│  keyword-detector.js   Route natural language → /commands     │
│  skill-injector.js     Detect tech keywords → suggest skills  │
├─ PreToolUse (5 hooks) ────────────────────────────────────────┤
│  context-guard.js      Block expensive tools at ≥72% context  │
│  security-gate.sh      Block secrets, credentials, .env       │
│  bash_hook.py          Block dangerous shell commands         │
│  file_length_limit     Prevent file bloat                     │
│  read_env_protection   Protect env file reads                 │
├─ PostToolUse (4 hooks) ───────────────────────────────────────┤
│  auto-formatter        prettier / dart format on save         │
│  context-monitor.js    Track usage, trigger auto-continuation │
│  mistake-capture.py    Log failures, detect patterns (EMA)    │
│  agent-profiler.py     Per-agent reliability tracking (EMA)   │
├─ PostToolUseFailure (1 hook) ─────────────────────────────────┤
│  tool-failure-handler  Circuit breaker (3+ → reassess)        │
├─ SubagentStart (1 hook) ──────────────────────────────────────┤
│  subagent-tracker.js   Log spawns, enforce 6-agent limit      │
├─ SubagentStop (1 hook) ───────────────────────────────────────┤
│  subagent-verifier.js  Validate deliverable quality           │
├─ PreCompact (1 hook) ─────────────────────────────────────────┤
│  precompact-reflect    Force reflection before context loss   │
├─ PostCompact (1 hook) ────────────────────────────────────────┤
│  dream-check.sh        Auto-dream if threshold exceeded       │
├─ Stop (3 hooks) ──────────────────────────────────────────────┤
│  session-stop.sh       Handoff creation, todo capture         │
│  verify-completion.py  Task completion verification           │
│  agent hook            Final verification + tests             │
└───────────────────────────────────────────────────────────────┘
```

---

## Skill Domains

<table>
<tr><th>Domain</th><th>Count</th><th>Highlights</th></tr>
<tr><td><b>Languages</b></td><td>10+</td><td>Python, TypeScript, Go, Rust, Swift, Kotlin, Java, SQL, Bash, Dart</td></tr>
<tr><td><b>Frontend</b></td><td>15+</td><td>React, Next.js, Expo, React Native, SwiftUI, Compose, Tailwind, Three.js, GSAP</td></tr>
<tr><td><b>Backend</b></td><td>10+</td><td>FastAPI, Express, GraphQL, REST, gRPC, WebSockets</td></tr>
<tr><td><b>DevOps</b></td><td>31</td><td>Terraform, Docker, K8s, Helm, Ansible, GitHub Actions, GitLab CI (gen + validate)</td></tr>
<tr><td><b>Security</b></td><td>28</td><td>Trail of Bits suite, OWASP, secrets detection, variant analysis</td></tr>
<tr><td><b>Documents</b></td><td>4</td><td>PDF, DOCX, PPTX, XLSX — create, read, edit, fill</td></tr>
<tr><td><b>Design</b></td><td>5+</td><td>Frontend design, UI stack (50+ styles, 161 palettes), Figma-to-code</td></tr>
<tr><td><b>Video/3D</b></td><td>2</td><td>Remotion programmatic video, Three.js 3D scenes</td></tr>
<tr><td><b>Data</b></td><td>3+</td><td>Neon Postgres, database optimization, migrations</td></tr>
<tr><td><b>Meta</b></td><td>5+</td><td>Skill creation, self-evolution, system health, smart swarm, smoke testing</td></tr>
</table>

---

## Architecture

```
~/.claude/
├── CLAUDE.md                    # Master instructions (the brain)
├── settings.json                # Hook wiring + plugin config
├── SYSTEM_VERSION.md            # Component inventory + health
├── SYSTEM_CHANGELOG.md          # Infrastructure version history
│
├── hooks/                       # 18 lifecycle hooks
│   ├── session-start.sh         #   SessionStart — 9-section init
│   ├── session-stop.sh          #   Stop — handoff + auto-continuation
│   ├── security-gate.sh         #   PreToolUse — secrets blocking
│   ├── context-monitor.js       #   PostToolUse — real-time context tracking
│   ├── context-guard.js         #   PreToolUse — proactive tool blocking at 72%
│   ├── mistake-capture.py       #   PostToolUse — failure logging + EMA
│   ├── tool-failure-handler.js  #   PostToolUseFailure — circuit breaker
│   ├── subagent-tracker.js      #   SubagentStart — spawn logging + limits
│   ├── subagent-verifier.js     #   SubagentStop — deliverable validation
│   ├── keyword-detector.js      #   UserPromptSubmit — NL → command routing
│   ├── skill-injector.js        #   UserPromptSubmit — tech keyword detection
│   └── ...                      #   + 7 more
│
├── skills/                      # 282+ skills
│   ├── REGISTRY.md              #   Single source of truth (all resources)
│   ├── PLAYBOOK-WORKFLOWS.md    #   Task classification guide
│   ├── PLAYBOOK-QUALITY.md      #   Security + quality processes
│   ├── PLAYBOOK-TOOLS.md        #   MCP + CLI patterns
│   └── [domain]/SKILL.md        #   Individual skill definitions
│
├── commands/                    # 37 slash commands
│   ├── new.md, resume.md, ...   #   6 master entry points
│   └── flow/*.md                #   20 Flow workflow commands
│
├── agents/                      # 72+ specialized agents
│   ├── flow-*.md                #   15 Flow agents
│   ├── smart-swarm-coordinator  #   Multi-agent orchestrator
│   └── [domain]/*.md            #   Domain specialists
│
├── rules/                       # 5 modular convention files
│   ├── general.md               #   Platform, code quality, naming
│   ├── git.md                   #   Branch naming, commits, PRs
│   ├── security.md              #   Input validation, auth, secrets
│   ├── testing.md               #   TDD, assertions, mocking
│   └── tier-routing.md          #   Three-tier model selection
│
├── scripts/                     # System utilities
│   ├── smoke-test.sh            #   27-check system validator
│   ├── auto-continue.sh         #   Session chaining
│   ├── health-validator.js      #   Health verification
│   ├── skill-stats-rollup.js    #   Skill performance aggregation
│   └── rebuild-memory-bridge.sh #   Progressive Learning bridge
│
├── flow-knowledge/              # Knowledge bridge
│   └── memory-bridge.yaml       #   Auto-indexed 58+ learning topics
│
└── scheduled-tasks/             # Cron-style automation
    ├── weekly-dream/            #   Memory consolidation (Mon 9:17am)
    └── skill-usage-audit/       #   Monthly auto-archive (1st of month)
```

## State Management

When resuming, ATLAS reads state in strict precedence order:

| Priority | Source | Purpose |
|:--------:|:-------|:--------|
| 1 | `.flow/state.yaml` | Active Flow workflow state (authoritative) |
| 2 | `session-state.md` | Ephemeral session snapshot |
| 3 | `~/.claude/.last-session-handoff` | Git state + todos from Stop hook |
| 4 | `~/.claude/sessions/handoff-*.md` | Auto-continuation handoff |

---

## Optional Components

Some hooks reference external components. They degrade gracefully — silent no-op if missing:

| Component | Purpose | How to Get |
|-----------|---------|-----------|
| `cctools-safety-hooks/` | Block dangerous bash commands, file limits | Install [cctools](https://github.com/anthropics/claude-code-community-tools) |
| `progressive-learning/` | Force reflection before compaction | Create manually or remove hook entry |
| `claudio` | Audio notifications | Optional binary at `~/.claude/bin/claudio` |

---

## What's Novel

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Auto-continuation** | Context-aware session chaining with structured handoff | Never lose work mid-task |
| **5D complexity scoring** | Automatic agent team deployment | Right-sized execution without asking |
| **Self-evolution** | Creates skills + adds MCP servers on capability gaps | System grows with your needs |
| **Three-loop learning** | Capture → pattern → permanent rule | Mistakes become institutional knowledge |
| **Tier routing** | Haiku/Sonnet/Opus per subtask | 30-50% token cost reduction |
| **Skill auto-recovery** | Archive → detect → restore on project match | Zero-maintenance skill lifecycle |
| **Circuit breaker** | EMA failure tracking + 3-strike shutdown | Prevents runaway tool failures |
| **Subagent governance** | Spawn limits + deliverable validation | Quality control on agent output |

---

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

---

## License

MIT License. Use it, modify it, make it yours.

## Author

**Leo Atienza** 

<p align="center">
  <sub>Built with Claude Code (Opus 4.6) and an unhealthy amount of ambition.</sub>
</p>
