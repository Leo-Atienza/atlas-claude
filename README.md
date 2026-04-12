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
  <a href="#architecture">Architecture</a> &bull;
  <a href="#whats-novel">Novel</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/claude_code-opus_4.6-blueviolet?style=flat-square" alt="Claude Code">
  <img src="https://img.shields.io/badge/version-6.7.0-informational?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/skills-66_active-blue?style=flat-square" alt="Skills">
  <img src="https://img.shields.io/badge/knowledge-67_entries-teal?style=flat-square" alt="Knowledge">
  <img src="https://img.shields.io/badge/hooks-13-yellow?style=flat-square" alt="Hooks">
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="License">
</p>

---

## What is ATLAS?

Most Claude Code setups are a `CLAUDE.md` with some rules. ATLAS is a **full infrastructure layer** — 13 lifecycle hooks, a self-contained brain with auto-workflows, a 67-entry knowledge store, and a unified Flow execution engine that scales from trivial fixes to multi-agent epic tasks. 66 active skills across 3 pages, pruned to signal — no bloat.

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
       │  │ 66 Skills · 67 Knowledge │    │ ← Execution
       │  │ 13 Hooks  · KG · 15+ MCPs│    │
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
| **1. Analyze** | Scan codebase, check wiki + knowledge graph (Graphify), search online (Context7 / WebSearch), ask if genuinely ambiguous |
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

### Knowledge Graph Navigation (Graphify)

Before exploring any codebase, ATLAS checks for a knowledge graph. If found, it navigates by structure instead of brute-force search — 71.5x token savings on architecture/dependency questions.

```
Check graphify-out/graph.json
  ├─ Graph exists  → read GRAPH_REPORT.md → query graph instead of Glob/Grep
  ├─ No graph, 20+ files → offer to build (minutes, one command)
  └─ After editing → auto-update graph at session end (code-only, <2s)
```

### Project Wiki System

Per-project decision history that survives context compaction. Auto-scaffolded on `/new` and `/flow:start`.

```
wiki/
├── index.md             # Decision log + context pages
├── decisions/           # ADR-style records (auto-written on significant choices)
└── log.md               # Chronological session log
```

**Auto-Wiki-Context**: On session start, reads `wiki/index.md` before re-deriving context from code.
**Auto-Wiki-Decision**: After significant architectural decisions, writes ADR with context/options/decision/consequences.

### Knowledge Compounding

Every non-trivial session extracts reusable patterns with confidence scoring:
- Candidate patterns scored 1-5 — only 4+ saved (prevents noise accumulation)
- Tag: `[HIGH]` (3+ reproductions) · `[MEDIUM]` (once) · `[LOW]` (theoretical)
- 67 entries across 5 categories: G-PAT · G-SOL · G-ERR · G-PREF · G-FAIL

### Defense-in-Depth Security

```
Layer 1 (PreToolUse):  context-guard.js blocks 20+ secret patterns
Layer 2 (PreToolUse):  cctools blocks dangerous shell commands + .env reads
Layer 3 (PostToolUse): Trail of Bits skills — sharp-edges, differential-review
Layer 4 (At PR):       Full security scan before shipping
```

### Atlas Intelligence Layer

Two zero-dependency Node.js modules wired into the hook lifecycle for persistent memory across sessions.

**`hooks/atlas-kg.js`** — Temporal Knowledge Graph
```
Storage: ~/.claude/atlas-kg/entities.json + triples.json
Queries: entity lookup, relationship traversal, time windows, recent facts, timeline
CLI:     node atlas-kg.js {add|query|invalidate|timeline|recent|summary|stats}
Wired:   session-start (injects recent facts on wake-up)
```

**`hooks/atlas-extractor.js`** — Heuristic Memory Auto-Extractor
```
Maps free text → G-PAT / G-SOL / G-ERR / G-PREF / G-FAIL with confidence scoring
Runs on handoff content at session-stop — auto-flags candidates without forcing saves
CLI:     node atlas-extractor.js {extract|extract-stdin|compact}
Wired:   session-stop (auto-extracts from handoff), precompact (hint before context loss)
```

> Extracted from mempalace (12 components). Only 2 taken — the rest rejected as overengineered, dependency-heavy, or duplicating existing systems.

---

## The Flow System

One unified workflow system. A single "complexity dial" scales from trivial to epic:

```
Trivial ─────→ Quick ─────→ Standard ──────→ Deep ──────→ Epic
(<20 lines)    (small)      (3-10 files)    (10-30)      (system-wide)
    │             │              │              │              │
    ▼             ▼              ▼              ▼              ▼
 Just do      Minimal       Plan →         Full plan      Wave-based
   it         ceremony      Execute       + parallel       + swarm
                                           agents          mode
```

**21 Flow commands** — start, plan, go, quick, map, review, verify, ship, debug, discover, brainstorm, ground, compound, complete, retro, status, test, smart-swarm, auto, swarm, team.

**14 specialized agents** — planner, executor, verifier, mapper, debugger, UAT, researcher, repo-analyst, learnings-researcher, synthesizer, git-analyst, compound-writer, risk-assessor, swarm-coordinator.

---

## Hook Lifecycle

13 hooks across 7 lifecycle events. All JS hooks share `hooks/lib.js` for JSON I/O, stdin parsing, log rotation, and tool blocking.

```
┌─ SessionStart ────────────────────────────────────────────────┐
│  session-start.sh    8-section init: conflicts, handoff,      │
│                      version, log rotation, error TTL,        │
│                      health summary, debug cleanup, backups   │
├─ PreToolUse ──────────────────────────────────────────────────┤
│  context-guard.js    Security gate (20+ secret patterns)      │
│                      + context budget (blocks tools at ≥78%)  │
│  pre-commit-gate.js  Build/test reminder before git commit    │
│  bash_hook.py        Block dangerous shell commands           │
│  file_length_limit   Prevent runaway file bloat               │
│  read_env_protection Protect .env / credentials reads         │
├─ PostToolUse ─────────────────────────────────────────────────┤
│  auto-formatter      prettier / dart format on every save     │
│  post-tool-monitor   Efficiency, failure tracking, context    │
│                      health — all in one consolidated hook    │
│  tsc-check.js        TypeScript type-check on .ts/.tsx edits  │
├─ PostToolUseFailure ──────────────────────────────────────────┤
│  tool-failure-handler Circuit breaker (3 strikes → reassess)  │
├─ PreCompact ──────────────────────────────────────────────────┤
│  precompact-reflect  KG summary + extractor hint before loss  │
├─ Stop ────────────────────────────────────────────────────────┤
│  session-stop.sh     Handoff creation, todo capture,          │
│                      atlas-extractor auto-classify, chain ≤2  │
├─ Notification ────────────────────────────────────────────────┤
│  claudio             Audio alerts for long-running ops        │
├─ StatusLine ──────────────────────────────────────────────────┤
│   statusline.js       Context bar, current task, call count   │
────────────────────────────────────────────────────────────────┘
```

### Context Budget Cascade

Single source of truth: `hooks/context-thresholds.json`

| Stage | Used % | What Happens |
|-------|--------|-------------|
| Warning | 60% | Wrap up current task |
| Auto-continuation | 70% | Handoff file written for new session |
| Guard block | 78% | Agent, Bash, Write, Edit blocked |
| Critical | 85% | Stop immediately, save state |

### Hook Profiles

Control hook overhead via `ATLAS_HOOK_PROFILE` env var:

| Profile | Hooks Active | Use When |
|---------|-------------|----------|
| `minimal` | context-guard only | Trivial tasks, quick edits |
| `standard` | All hooks (default) | Normal development |

---

## Skill System

### Directory/Page Architecture

Skills are indexed in two levels — scan the directory, open the page on demand. Never load all 66 at start.

```
skills/
├── ACTIVE-DIRECTORY.md       # Index: 66 active skills (15 Core + 51 Available)
├── ACTIVE-PAGE-1-*.md        # Web, animation, design, testing, security
├── ACTIVE-PAGE-2-*.md        # Backend, deployment, workflow
├── ACTIVE-PAGE-3-*.md        # Native, desktop, cross-platform
├── ARCHIVE-DIRECTORY.md      # Index: 7 archive bundles
└── ARCHIVE-PAGE-1..7.md      # Archived by domain (load only when project matches)
```

### Active Core Skills (15)

| Domain | Skills |
|--------|--------|
| **Frontend** | Next.js Developer, React Expert, TypeScript Expert |
| **Animation** | Motion (Framer), GSAP Core, Lenis Smooth Scroll |
| **Architecture** | Vanguard Web Architecture |
| **Data** | TanStack Ecosystem |
| **Backend** | Supabase Expert, Stripe Expert |
| **Security** | Sharp Edges Scanner, Differential Risk Review |
| **Quality** | Vitest Testing Framework, Code Review |
| **Writing** | Anti-Slop Writing |

### Skill Domains (Available)

| Domain | Count | Highlights |
|--------|:-----:|-----------|
| **Web Frameworks** | 13 | Next.js (best practices, cache, upgrade), React composition/perf, TypeScript, TanStack |
| **Animation & Motion** | 8 | GSAP (core + advanced), Motion, Lenis, Anime.js, Barba.js, Cinematic Web Engine |
| **CSS & Styling** | 2 | CSS-First UI Engine, Web Platform APIs |
| **3D & Immersive** | 2 | Three.js/R3F, Spline 3D |
| **Native & Desktop** | 10 | Tauri Desktop, Universal Conductor, Hardware Bridge, Local-First, Edge Intelligence, Motion/Visual/Transition/Sensory native |
| **Backend & Data** | 5 | Supabase, Stripe, PostgreSQL, SQL, API Design |
| **Testing & Deploy** | 5 | Playwright, E2E, Vitest, Deploy to Vercel, TDD |
| **Workflow & Meta** | 13 | Smart Swarm, Deep Research, Dream, Self-Evolve, Design QA pipeline, Wiki Manager, Audit, Handoff |
| **Design** | 6 | Frontend Design, UX Design, Canvas, Design Audit/Critique/Polish |
| **Quality** | 2 | Impeccable (design polish), Taste (aesthetic judgment) |

**Archive bundles** (auto-activate on project file match): Infra/DevOps · Security · Enterprise · Data/ML · Mobile/Native · Workflow/Meta · Document/Media

---

## Knowledge Store

67 entries across 5 pages. Directory/Page architecture — scan the index, open a page on demand.

| Page | Category | Count | Content |
|:----:|:--------:|:-----:|:--------|
| 1 | **G-PAT** | 28 | Reusable patterns |
| 2 | **G-SOL** | 16 | Solved problems |
| 3 | **G-ERR** | 9 | Mistakes to avoid |
| 4 | **G-PREF** | 8 | User preferences |
| 5 | **G-FAIL** | 6 | Failed approaches |

---

## Architecture

```
~/.claude/
├── CLAUDE.md                    # Self-contained brain (~18KB, all rules inline)
├── REFERENCE.md                 # Slash commands, MCP patterns, security triggers
├── ARCHITECTURE.md              # System architecture reference
├── INSTALLED.md                 # Installed components reference
├── settings.json                # Hook wiring, permissions, env vars
├── SYSTEM_VERSION.md            # Version tracking (v6.7.0)
├── SYSTEM_CHANGELOG.md          # Infrastructure version history
│
├── hooks/                       # 13 lifecycle hooks
│   ├── lib.js                   #   Shared utilities (JSON I/O, stdin, rotation, blocking)
│   ├── session-start.sh         #   SessionStart — 8-section init + cleanup rotation
│   ├── session-stop.sh          #   Stop — handoff + auto-continuation
│   ├── context-guard.js         #   PreToolUse — security gate + context budget
│   ├── pre-commit-gate.js       #   PreToolUse — build/test reminder before git commit
│   ├── tsc-check.js             #   PostToolUse — TypeScript type-check on .ts/.tsx edits
│   ├── post-tool-monitor.js     #   PostToolUse — efficiency, failures, context, health
│   ├── tool-failure-handler.js  #   PostToolUseFailure — circuit breaker
│   ├── statusline.js            #   StatusLine — context bar, task, call count
│   ├── context-thresholds.json  #   Single source of truth for context budget
│   ├── atlas-kg.js              #   Temporal Knowledge Graph (entity/triple/time queries)
│   ├── atlas-extractor.js       #   Heuristic auto-classifier (text → G-PAT/SOL/ERR/PREF/FAIL)
│   └── cctools-safety-hooks/    #   PreToolUse — bash, file_length, env protection
│
├── skills/                      # Directory/Page architecture
│   ├── ACTIVE-DIRECTORY.md      #   Index: 66 active skills (15 Core + 51 Available)
│   ├── ACTIVE-PAGE-1-*.md       #   Web, animation, design, testing, security
│   ├── ACTIVE-PAGE-2-*.md       #   Backend, deployment, workflow
│   ├── ACTIVE-PAGE-3-*.md       #   Native, desktop, cross-platform
│   ├── graphify/                #   Knowledge graph skill (Graphify)
│   ├── ARCHIVE-DIRECTORY.md     #   Index: 7 archive bundles
│   ├── ARCHIVE-PAGE-1..7.md     #   Archived by domain — load on demand
│   └── templates/               #   9 project templates (Next.js, Expo, API, Tauri, etc.)
│
├── topics/                      # Knowledge store — Directory/Page architecture
│   ├── KNOWLEDGE-DIRECTORY.md   #   Master index (scan first)
│   ├── KNOWLEDGE-PAGE-1-*.md    #   28 G-PAT entries (patterns)
│   ├── KNOWLEDGE-PAGE-2-*.md    #   16 G-SOL entries (solutions)
│   ├── KNOWLEDGE-PAGE-3-*.md    #   9 G-ERR entries (mistakes)
│   ├── KNOWLEDGE-PAGE-4-*.md    #   8 G-PREF entries (preferences)
│   └── KNOWLEDGE-PAGE-5-*.md    #   6 G-FAIL entries (failed approaches)
│
├── commands/                    # Slash commands (27 + 21 flow)
│   ├── new.md, resume.md, task.md, done.md, ship.md, dream.md
│   ├── reflect.md, learn.md, compact.md, health.md, skill-review.md
│   ├── handoff.md, parallel-audit.md, verified-deploy.md
│   ├── api-design.md, db-schema.md, new-mobile-app.md, new-desktop-app.md
│   └── flow/                    #   21 Flow workflow commands
│
├── scripts/                     # System utilities
│   ├── smoke-test.sh            #   Comprehensive system validator (13 sections)
│   ├── session-metrics.sh       #   Session analytics report (48h windowed)
│   ├── health-dashboard.js      #   System health overview dashboard
│   └── health-validator.js      #   Health verification
│
├── agents/                      # 15 Flow agents + 59 specialized agents
│   ├── flow-planner.md          #   Plan creation with wave dependencies
│   ├── flow-executor.md         #   Atomic commits, deviation handling
│   ├── flow-verifier.md         #   Goal-backward verification
│   ├── flow-debugger.md         #   Scientific debugging with state tracking
│   └── ...                      #   mapper, UAT, researcher, synthesizer, etc.
│
└── scheduled-tasks/             # Automation (gitignored — runtime-only)
    └── weekly-dream/, weekly-maintenance/, monthly-evolution-report/
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
| `cctools-safety-hooks/` | Block dangerous bash commands, file limits, env protection | Install [cctools](https://github.com/pchalasani/claude-code-tools) |
| `claudio` | Audio notifications for long-running operations | `go install claudio.click/cmd/claudio@latest` |

---

## What's Novel

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Self-contained brain** | CLAUDE.md with all rules inline — no external rule files | Simpler, faster, zero broken references |
| **Directory/Page skills** | Index → page → skill (never load all 65 at start) | Context-efficient, scales to any size |
| **Curated skill set** | 13 redundant/superseded skills archived in v6.4.0 | Signal over noise — every active skill earns its place |
| **Knowledge compounding** | 5-category store, confidence-scored, only 4+ saved | Filters noise, preserves signal across sessions |
| **Auto-continuation** | Context-aware session chaining with structured handoff | Never lose work mid-task |
| **5D complexity scoring** | Automatic agent deployment (SOLO/DUO/TEAM/SWARM) | Right-sized execution, no manual routing |
| **Self-evolution** | Creates skills + adds MCPs on detected capability gaps | System grows with your needs |
| **Shared hook lib** | `lib.js` shared across all JS hooks | Zero duplication, consistent behavior |
| **Circuit breaker** | Failure tracking + 3-strike reassessment | Prevents runaway tool failure loops |
| **Context budget cascade** | 4-stage threshold system with single source of truth | Graceful degradation, not abrupt failure |
| **Temporal Knowledge Graph** | Entity-triple graph with time validity, queried at session start | Persistent facts that survive context compaction |
| **Heuristic auto-extractor** | Classifies session output → G-PAT/SOL/ERR/PREF/FAIL candidates | Auto-flags without forcing saves — noise prevention built in |
| **Knowledge graph navigation** | Graphify builds queryable graph per-repo, queried before raw search | 71.5x token savings on architecture/dependency questions |
| **Project wiki system** | Per-project decision history with auto-ADR on significant choices | Context survives compaction — never re-derive "why did we do X?" |
| **Smart tsc-check** | TypeScript type-checking only fires on `.ts/.tsx` edits, not every save | Eliminates 30s blocks on CSS/MD/JSON edits |
| **MCP health classification** | Tool failures from MCP servers tagged separately with actionable advice | Distinguishes "server down" from "bad input" — faster diagnosis |

---

## System Validation

```bash
bash ~/.claude/scripts/smoke-test.sh
```

Checks 13 sections: critical files, hooks, settings validity, skill pages (1-3), archive pages (1-7), knowledge pages, templates, symlinks, context thresholds, security config, hook executability, Atlas KG integrity, and memory system health.

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| **6.7.0** | 2026-04-12 | pre-commit gate hook, targeted tsc-check rewrite, /audit + /handoff skills, 4 app-dev commands, health dashboard, 10 hooks overhauled |
| **6.6.1** | 2026-04-11 | Auto-System-Docs workflow — infrastructure changes auto-trigger doc updates |
| **6.6.0** | 2026-04-11 | Smart tsc-check hook, MCP health classification, persistence layer boundaries, skill archive (14.2MB archived) |
| **6.5.0** | 2026-04-08 | KG type inference + prune, 48h-windowed health, CLAUDE.md auto-workflows, Graphify skill, wiki system, dead weight purge |
| **6.4.0** | 2026-04-07 | Skill curation (78→65), CLAUDE.md pipeline upgrade, functional smoke tests |
| **6.1.0** | 2026-04-07 | Living Atlas Audit — dead weight purge (22 files), orphaned refs fixed |
| **6.0.0** | 2026-04-07 | Atlas Intelligence Layer — temporal KG + heuristic extractor, zero deps |
| **5.9.0** | 2026-04-07 | ULTRATHINK audit — version sync, count corrections, smoke test gap fix |
| **5.8.0** | 2026-04-06 | Native Engine — 5 new skills, Universal Conductor v2.0, ACTIVE-PAGE-3 |
| **5.7.0** | 2026-04-06 | Vanguard Web Architecture — 5 new skills, Render Tiers, CSS-First |
| **5.6.0** | 2026-04-06 | Final audit — dead file purge, hook profile consistency |
| **5.0.0** | 2026-04-05 | System overhaul — self-contained CLAUDE.md, 88 dead files cleaned |
| **4.0.0** | 2026-04-05 | Pipeline architecture — Directory/Page system, hooks consolidated |

See `SYSTEM_CHANGELOG.md` for full history.

---

## License

MIT License. Use it, modify it, make it yours.

## Author

**Leo Atienza**

<p align="center">
  <sub>Built with Claude Code (Opus 4.6) and an unhealthy amount of ambition.</sub>
</p>
