# Flow — Unified Workflow System

**Version:** 1.0.0
**Replaces:** GSD (32 commands), Compound Engineering (18 commands), Fullstack Dev (13 commands)

Flow is a single adaptive workflow system that scales from trivial tasks to multi-milestone projects. Complexity is a **dial** (quick/standard/deep/epic), not separate systems.

## Commands (18)

### INITIATE
| Command | Purpose |
|---|---|
| `/flow:start [desc] [--depth]` | Single entry point. Analyze task, recommend depth, initialize |
| `/flow:map [area]` | Parallel codebase mapping (4 agents) |
| `/flow:ground [--list\|--check\|--graph]` | Surface/validate Claude's hidden assumptions |

### THINK
| Command | Purpose |
|---|---|
| `/flow:brainstorm [idea]` | Explore WHAT to build collaboratively |
| `/flow:discover [phase\|topic]` | Unified research + discovery with parallel agents |
| `/flow:plan [phase\|feature] [--depth]` | Plans-as-prompts with depth-aware verification |

### BUILD
| Command | Purpose |
|---|---|
| `/flow:go [phase\|plan] [--swarm] [--gaps-only]` | Wave-based parallel execution + swarm mode |
| `/flow:debug [issue]` | Scientific debugging with persistent state |
| `/flow:quick [task]` | Fast path for small tasks |

### VERIFY
| Command | Purpose |
|---|---|
| `/flow:verify [phase]` | Goal-backward verification |
| `/flow:review [PR\|branch] [--agents]` | Multi-agent parallel code review |
| `/flow:test [target] [--browser\|--xcode]` | E2E testing |

### SHIP
| Command | Purpose |
|---|---|
| `/flow:ship [--pr\|--commit-only]` | Commit + push + PR |
| `/flow:complete [version\|phase]` | Archive phase/milestone + retrospective |
| `/flow:compound [context]` | Knowledge compounding |
| `/flow:retro [scope]` | Cross-phase/sprint retrospective |
| `/flow:status [--todos\|--health]` | Dashboard: position, velocity, next action |

### Composite
| Alias | Expands To |
|---|---|
| `/flow:auto` | plan -> go -> review -> ship |
| `/flow:swarm` | plan -> go --swarm -> review -> ship |

## Depth Levels

| Level | Scope | Key Features |
|---|---|---|
| **quick** | 1-3 files | Single plan, direct execution, basic tracking |
| **standard** | 3-10 files | Plan + research, system-wide test check, review, compounding |
| **deep** | 10+ files | Full phases, plan verification loop, wave execution, goal-backward verify |
| **epic** | Multi-milestone | Everything + milestone lifecycle, external trackers, cross-project learning |

## State Directory: `.flow/`

```
.flow/
  config.yaml          # Workflow preferences
  state.yaml           # Machine-readable position, velocity
  STATE.md             # Human-readable state
  PROJECT.md           # Vision, constraints (deep/epic)
  REQUIREMENTS.md      # Scoped requirements (deep/epic)
  ROADMAP.md           # Phase structure (deep/epic)
  SYSTEM.md            # Living system description
  codebase/            # From /flow:map
  ground/              # From /flow:ground
  brainstorms/         # From /flow:brainstorm
  research/            # From /flow:discover
  phases/              # Deep/epic phase work
  plans/               # Standard depth plans
  quick/               # Quick task tracking
  debug/               # Persistent debug sessions
  solutions/           # Knowledge compounding
  todos/               # Captured tasks/ideas
  milestones/          # Epic depth archives
  metrics/             # Quality scores + velocity
  .continue-here.md    # Session handoff
```

## Agents (14)

| Agent | Role |
|---|---|
| `flow-planner` | Plans-as-prompts + roadmap creation |
| `flow-plan-checker` | Completeness + gap analysis verification loop |
| `flow-executor` | Wave execution, deviation rules, atomic commits |
| `flow-verifier` | Goal-backward + integration checking |
| `flow-repo-analyst` | Local codebase research |
| `flow-external-researcher` | External research, Context7, official docs |
| `flow-learnings-researcher` | Search solutions for documented patterns |
| `flow-git-analyst` | Git history patterns |
| `flow-research-synthesizer` | Combine parallel research into summary |
| `flow-risk-assessor` | 7-dimension risk scoring |
| `flow-debugger` | Scientific debugging, checkpoints |
| `flow-mapper` | 4-focus parallel codebase mapping |
| `flow-compound-writer` | Knowledge compounding assembly |
| `flow-uat` | Conversational UAT testing |

## Pipeline Integration

### INITIATE enhancements
Before `/flow:start` runs:
- Check `topics/KNOWLEDGE-DIRECTORY.md` for relevant past patterns/solutions
- Check `skills/ACTIVE-DIRECTORY.md` → load relevant skills from pages (silently)
- If not in Active → check `skills/ARCHIVE-DIRECTORY.md` → load from archive page
- **Wiki scaffold**: if no `wiki/` dir exists in project root, auto-scaffold project wiki (wiki-manage SK-101 scaffold mode — creates wiki/index.md, wiki/log.md, wiki/decisions/, wiki/context/, wiki/synthesis/, raw/.gitkeep)

### BUILD enhancements
During execution:
- **Reflexion gate**: after execution, self-review output against L100 quality bar (see Reflexion Gate below)
- **TDD integration**: when tests make sense, use red→green→refactor pattern
- **SDD integration**: for spec-heavy work, write spec before code

### SHIP enhancements
- `/flow:compound` saves to Knowledge Store (Directory/Page system at `topics/`)
- Knowledge extraction happens automatically at session end, not just when `/flow:compound` is called

### Depth level additions
| Level | Learn Step | Reflexion | SDD |
|---|---|---|---|
| quick | Yes (minimal) | No | No |
| standard | Yes | Yes | No |
| deep | Yes | Yes | Yes |
| epic | Yes | Yes | Yes |

## Reflexion Gate (Pre-Delivery Self-Review)

Before declaring any task "done," run this self-review:

1. **L100 Check**: Does the output meet every point in the Quality Bar?
   - Springs on interactive elements? Skeleton loading? Accessible? Responsive?
   - Performance: no unnecessary re-renders, lazy loading, content-visibility?
   - Modern APIs used where available?

2. **Code Quality**: Would this pass a senior code review?
   - Clean, readable, no dead code
   - Error handling at system boundaries
   - Types are strict, no `any`
   - Tests cover happy path + top edge cases

3. **Creative Quality**: Is this premium?
   - Does it look/feel designed, not just coded?
   - Are animations smooth and purposeful?
   - Would the user be proud to show this?

4. **Completeness**: Is anything missing?
   - All acceptance criteria met?
   - Edge cases handled?
   - Mobile/responsive checked?

If any check fails → fix it before delivering. Don't mention the Reflexion gate to the user — just deliver quality.

## Key Principles

1. **Plans are prompts** — PLAN.md IS the executor prompt, zero translation loss
2. **Goal-backward verification** — Verify goals achieved, not tasks completed
3. **Wave execution** — Pre-computed dependency waves, parallel subagent spawning
4. **Deviation rules** — Auto-fix bugs/critical/blocking without asking
5. **Knowledge compounding** — Solutions saved to Knowledge Store pages across projects
6. **Adaptive depth** — System scales with task complexity
7. **Smart context** — Orchestrators stay lean (~15%), agents get fresh 200k
8. **Reflexion** — Self-review against L100 quality bar before every delivery

## Workflow Reference Files

- `workflows/start.md` — Initialization workflow
- `workflows/plan.md` — Planning workflow
- `workflows/execute.md` — Execution workflow
- `workflows/verify.md` — Verification workflow
- `workflows/quick.md` — Quick task workflow
- `workflows/status.md` — Dashboard workflow
- `references/state-management.md` — State utilities
- `references/depth-analysis.md` — Depth recommendation logic
- `references/deviation-rules.md` — Executor deviation handling
- `references/checkpoints.md` — Checkpoint protocol
- `templates/config.yaml` — Default config template
- `templates/state.yaml` — Default state template
