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
  <a href="#what-is-atlas">What</a> &bull;
  <a href="#quick-start">Install</a> &bull;
  <a href="#the-pipeline">Pipeline</a> &bull;
  <a href="#autonomous-behaviors">Behaviors</a> &bull;
  <a href="#the-flow-system">Flow</a> &bull;
  <a href="#hook-lifecycle">Hooks</a> &bull;
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/claude_code-opus_4.6-blueviolet?style=flat-square" alt="Claude Code">
  <img src="https://img.shields.io/badge/version-5.6.0-informational?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/skills-61_active-blue?style=flat-square" alt="Skills">
  <img src="https://img.shields.io/badge/knowledge-63_entries-teal?style=flat-square" alt="Knowledge">
  <img src="https://img.shields.io/badge/hooks-11-yellow?style=flat-square" alt="Hooks">
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="License">
</p>

---

## What is ATLAS?

Most Claude Code setups are a `CLAUDE.md` with some rules. ATLAS is a **full infrastructure layer** — 11 lifecycle hooks, a self-contained 8KB brain, a 63-entry knowledge store, and a unified Flow execution engine that scales from trivial fixes to multi-agent epic tasks.

<table>
<tr>
<td width="50%">

**What you type:**
```
build a REST API for user management
```

**What ATLAS does:**
1. Scores complexity → **TEAM** (score: 9)
2. Spawns specialized agents via Flow
3. Routes Sonnet for implementation, Opus for planning
4. Loads relevant skills on-demand
5. Executes with parallel agents in isolated worktrees
6. Security scans before marking done
7. Saves novel patterns to Knowledge Store

</td>
<td width="50%">

```
       ┌──────────────────────────────────┐
       │            A T L A S             │
       ├──────────────────────────────────┤
       │                                  │
       │  Natural language → pipeline     │ ← You
       │               │                  │
       │               ▼                  │
       │  ┌───────────┐  ┌───────────┐    │
       │  │   Flow    │  │   Smart   │    │ ← Routing
       │  │  System   │  │   Swarm   │    │
       │  └─────┬─────┘  └─────┬─────┘    │
       │        ▼              ▼          │
       │  ┌──────────────────────────┐    │
       │  │ 61 Skills · 63 Knowledge │    │ ← Execution
       │  │ 11 Hooks  · 15+ MCPs     │    │
       │  └──────────┬───────────────┘    │
       │             ▼                    │
       │  ┌──────────────────────────┐    │
       │  │  Learn · Evolve · Grow   │    │ ← Growth
       │  └──────────────────────────┘    │
       └──────────────────────────────────┘
```

</td>
</tr>
</table>

> **TL;DR** — It continues its own work when context runs out. It deploys agent teams based on task complexity. It creates new skills when it finds capability gaps. It saves novel patterns and mistakes across sessions.

---

## Quick Start

```bash
# Clone
git clone https://github.com/Leo-Atienza/atlas-claude.git

# Install (safe — never overwrites existing files)
cd atlas-claude && bash install.sh

# Verify
bash ~/.claude/scripts/smoke-test.sh
```

---

## The Pipeline

Every task follows the same 5-step sequence. ATLAS determines depth automatically.

| Step | What Happens |
|:----:|:------------|
| **1. Analyze** | Scan codebase, search online (Context7 / WebSearch), ask if genuinely ambiguous |
| **2. Plan** | Load relevant skills on-demand, check MCPs, create plan, enter Plan mode for approval |
| **3. Execute** | Follow all rules, TDD, make creative decisions autonomously, give milestone updates |
| **4. Deliver** | Self-review: tests pass + build succeeds + preview works. Show proof. Never claim done without it. |
| **5. Learn** | Only when novel: save patterns (G-PAT), solutions (G-SOL), mistakes (G-ERR) to Knowledge Store |

**Trivial tasks** (<20 lines, 1 file, obvious intent): Skip to Execute. No ceremony.

### Unified Complexity Scale

One system for scope, agent routing, and flow depth:

| Scale | Scope | Agent Model | Flow |
|-------|-------|-------------|------|
| **Trivial** | <20 lines, 1 file | No agents — direct execution | Just do it |
| **Small** | 1-3 files | Haiku / Sonnet | Brief plan |
| **Medium** | 3-10 files | Sonnet | Plan → approve |
| **Large** | 10+ files, multi-phase | Opus planning + Sonnet execution | Full Flow pipeline |

---

## Autonomous Behaviors

These happen **without user action**.

### Auto-Continuation

When context approaches limits, ATLAS writes a structured handoff and resumes in a new session. Chain depth limit: 2 sessions.

```
session-stop.sh detects continuation flag
  → writes handoff (task, branch, files, plan, next action)
  → session ends gracefully
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

Combined with **three-tier model routing** — Haiku for simple subtasks, Sonnet for implementation, Opus for architecture — cutting token costs 30-50% without sacrificing quality.

### Self-Evolution

```
Capability gap detected?
  ├─ Missing tool    → search MCP registry → propose server → add on approval
  ├─ Repeated 3×     → auto-create new skill → register in ACTIVE-DIRECTORY.md
  └─ Need knowledge  → Context7 lookup → create skill only if recurring
```

### Knowledge Compounding

Every non-trivial session extracts reusable patterns with confidence scoring:
- Candidate patterns scored 1-5 — only 4+ saved (prevents noise accumulation)
- Tag: `[HIGH]` (3+ reproductions) · `[MEDIUM]` (once) · `[LOW]` (theoretical)
- 63 entries across 5 categories: G-PAT · G-SOL · G-ERR · G-PREF · G-FAIL

### Defense-in-Depth Security

```
Layer 1 (PreToolUse):  context-guard.js blocks 20+ secret patterns
Layer 2 (PreToolUse):  cctools blocks dangerous shell commands + .env reads
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

**21 Flow commands** — start, plan, go, quick, map, review, verify, ship, debug, discover, brainstorm, ground, compound, complete, retro, status, test, smart-swarm, auto, swarm, team.

**14 specialized agents** — planner, executor, verifier, mapper, debugger, UAT, researcher, repo-analyst, learnings-researcher, synthesizer, git-analyst, compound-writer, risk-assessor, swarm-coordinator.

---

## Hook Lifecycle

11 hooks across 7 lifecycle events. All JS hooks share `hooks/lib.js` for JSON I/O, stdin parsing, log rotation, and tool blocking.

```
┌─ SessionStart ────────────────────────────────────────────────┐
│  session-start.sh    8-section init: conflicts, handoff,      │
│                      version, log rotation, error TTL,        │
│                      health summary, debug cleanup, backups   │
├─ PreToolUse ──────────────────────────────────────────────────┤
│  context-guard.js    Security gate (20+ secret patterns)      │
│                      + context budget (blocks tools at ≥72%)  │
│  bash_hook.py        Block dangerous shell commands           │
│  file_length_limit   Prevent runaway file bloat               │
│  read_env_protection Protect .env / credentials reads         │
├─ PostToolUse ─────────────────────────────────────────────────┤
│  auto-formatter      prettier / dart format on every save     │
│  post-tool-monitor   Efficiency, failure tracking, context    │
│                      health — all in one consolidated hook    │
├─ PostToolUseFailure ──────────────────────────────────────────┤
│  tool-failure-handler Circuit breaker (3 strikes → reassess)  │
├─ PreCompact ──────────────────────────────────────────────────┤
│  precompact-reflect  Force reflection before context loss     │
├─ Stop ────────────────────────────────────────────────────────┤
│  session-stop.sh     Handoff creation, todo capture,          │
│                      auto-continuation chain (depth ≤ 2)      │
├─ Notification ────────────────────────────────────────────────┤
│  claudio             Audio alerts for long-running ops        │
└─ StatusLine ──────────────────────────────────────────────────┤
   statusline.js       Context bar, current task, call count    │
   ────────────────────────────────────────────────────────────┘
```

---

## Skill System

### Directory/Page Architecture

Skills are indexed in two levels — scan the directory, open the page on demand. Never load all 61 at start.

```
skills/
├── ACTIVE-DIRECTORY.md       # Index: 61 active skills (15 Core + 46 Available)
├── ACTIVE-PAGE-1-*.md        # Web, animation, design, testing, security
├── ACTIVE-PAGE-2-*.md        # Backend, deployment, workflow
├── ARCHIVE-DIRECTORY.md      # Index: 7 archive bundles
└── ARCHIVE-PAGE-1..7.md      # Archived by domain (load only when project matches)
```

### Active Core Skills (15)

| Domain | Skills |
|--------|--------|
| **Frontend** | Next.js Developer, React Expert, TypeScript Expert |
| **Animation** | Motion (Framer), GSAP Core, Lenis Smooth Scroll, L100 Web Orchestrator |
| **Data** | TanStack Ecosystem |
| **Backend** | Supabase Expert, Stripe Expert |
| **Security** | Sharp Edges Scanner, Differential Risk Review |
| **Quality** | Vitest Testing Framework, Code Review |
| **Design** | Frontend Design System |
| **Writing** | Anti-Slop Writing |

**Archive bundles** (auto-activate on project file match): Infra/DevOps · Security · Enterprise · Data/ML · Mobile/Native · Workflow/Meta · Document/Media

---

## Knowledge Store

63 entries across 5 pages. Directory/Page architecture — scan the index, open a page on demand.

| Page | Category | Count | Content |
|:----:|:--------:|:-----:|:--------|
| 1 | **G-PAT** | 25 | Reusable patterns |
| 2 | **G-SOL** | 16 | Solved problems |
| 3 | **G-ERR** | 9 | Mistakes to avoid |
| 4 | **G-PREF** | 7 | User preferences |
| 5 | **G-FAIL** | 6 | Failed approaches |

---

## Architecture

```
~/.claude/
├── CLAUDE.md                    # Self-contained brain (~8KB, all rules inline)
├── REFERENCE.md                 # Slash commands, MCP patterns, security triggers
├── settings.json                # Hook wiring, permissions, env vars
├── SYSTEM_VERSION.md            # Version tracking (v5.6.0)
├── SYSTEM_CHANGELOG.md          # Infrastructure version history
│
├── hooks/                       # 11 lifecycle hooks
│   ├── lib.js                   #   Shared utilities (JSON I/O, stdin, rotation, blocking)
│   ├── session-start.sh         #   SessionStart — 8-section init + cleanup rotation
│   ├── session-stop.sh          #   Stop — handoff + auto-continuation
│   ├── context-guard.js         #   PreToolUse — security gate + context budget
│   ├── post-tool-monitor.js     #   PostToolUse — efficiency, failures, context, health
│   ├── tool-failure-handler.js  #   PostToolUseFailure — circuit breaker
│   ├── statusline.js            #   StatusLine — context bar, task, call count
│   ├── precompact-reflect.sh    #   PreCompact — force reflection before context loss
│   └── cctools-safety-hooks/    #   PreToolUse — bash, file_length, env protection
│
├── skills/                      # Directory/Page architecture
│   ├── ACTIVE-DIRECTORY.md      #   Index: 61 active skills (15 Core + 46 Available)
│   ├── ACTIVE-PAGE-1-*.md       #   Web, animation, design, testing, security
│   ├── ACTIVE-PAGE-2-*.md       #   Backend, deployment, workflow
│   ├── ARCHIVE-DIRECTORY.md     #   Index: 7 archive bundles
│   └── ARCHIVE-PAGE-1..7.md     #   Archived by domain — load on demand
│
├── topics/                      # Knowledge store — Directory/Page architecture
│   ├── KNOWLEDGE-DIRECTORY.md   #   Master index (scan first)
│   ├── KNOWLEDGE-PAGE-1-*.md    #   25 G-PAT entries (patterns)
│   ├── KNOWLEDGE-PAGE-2-*.md    #   16 G-SOL entries (solutions)
│   ├── KNOWLEDGE-PAGE-3-*.md    #   9 G-ERR entries (mistakes)
│   ├── KNOWLEDGE-PAGE-4-*.md    #   7 G-PREF entries (preferences)
│   └── KNOWLEDGE-PAGE-5-*.md    #   6 G-FAIL entries (failed approaches)
│
├── commands/                    # Slash commands
│   ├── new.md, resume.md, task.md, done.md, ship.md, dream.md
│   ├── reflect.md, learn.md, compact.md, health.md, skill-review.md
│   └── flow/                    #   21 Flow workflow commands
│
├── scripts/                     # System utilities
│   ├── smoke-test.sh            #   Comprehensive system validator
│   ├── session-metrics.sh       #   Session analytics report
│   ├── health-validator.js      #   Health verification
│   └── skill-improver.js        #   Skill auto-improvement
│
└── scheduled-tasks/             # Automation
    └── skill-autofix/           #   Scheduled skill improvements
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
| `cctools-safety-hooks/` | Block dangerous bash commands, file limits, env protection | Install [cctools](https://github.com/anthropics/claude-code-community-tools) |
| `claudio` | Audio notifications for long-running operations | Optional binary at `~/.claude/bin/claudio` |

---

## What's Novel

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Self-contained brain** | CLAUDE.md with all rules inline — no external rule files | Simpler, faster, zero broken references |
| **Directory/Page skills** | Index → page → skill (never load all 61 at start) | Context-efficient, scales to any size |
| **Knowledge compounding** | 5-category store, confidence-scored, only 4+ saved | Filters noise, preserves signal across sessions |
| **Auto-continuation** | Context-aware session chaining with structured handoff | Never lose work mid-task |
| **5D complexity scoring** | Automatic agent deployment (SOLO/DUO/TEAM/SWARM) | Right-sized execution, no manual routing |
| **Self-evolution** | Creates skills + adds MCPs on detected capability gaps | System grows with your needs |
| **Shared hook lib** | `lib.js` shared across all JS hooks | Zero duplication, consistent behavior |
| **Circuit breaker** | Failure tracking + 3-strike reassessment | Prevents runaway tool failure loops |

---

## System Validation

```bash
bash ~/.claude/scripts/smoke-test.sh
```

Verifies: critical files, hooks, settings validity, skill/knowledge counts, log integrity, auto-continuation, and core commands.

---

## License

MIT License. Use it, modify it, make it yours.

## Author

**Leo Atienza**

<p align="center">
  <sub>Built with Claude Code (Opus 4.6) and an unhealthy amount of ambition.</sub>
</p>
