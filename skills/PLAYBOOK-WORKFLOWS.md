# Playbook: Workflows & Task Routing

> **Auto-loaded when**: Planning projects, choosing workflows, managing Flow lifecycle, classifying tasks.

---

## 1. Task Classification & Autonomous Action Protocol

When the user gives a task, classify it and act WITHOUT asking unless genuinely ambiguous.

### Classification Matrix

| Signal in Request | Classification | Action Chain |
|-------------------|---------------|-------------|
| "build", "create app", "new project" | NEW_PROJECT | Classify scope → `/flow:start` (auto-detects depth) |
| "add feature", "implement" | FEATURE | Check for `.flow/` (or legacy `.planning/`) → route accordingly |
| "fix bug", "broken", "not working" | BUG | Check for `.flow/` → `/flow:debug` or systematic-debugging |
| "review", "check this PR" | CODE_REVIEW | Layered review: security → quality → framework |
| "deploy", "push", "release" | DEPLOYMENT | Validate → security scan → ASK user before executing |
| "optimize", "slow", "performance" | OPTIMIZATION | Measure first → PDCA cycle → validate improvement |
| "refactor", "clean up" | REFACTOR | Read existing code → plan changes → TDD → validate |
| "explain", "how does X work" | RESEARCH | Use Context7/WebSearch/codebase exploration → answer |
| "set up", "configure", "install" | SETUP | Check environment → apply skill → validate |
| File creation/edit (Dockerfile, .tf, etc.) | IaC_GENERATION | Auto-route via file-type table → generate → validate |

### Scope Assessment (Do This First)

| Scope | Indicators | Route |
|-------|-----------|-------|
| **Trivial** | Single file, <20 lines, obvious fix | Do it directly, no planning needed |
| **Small** | 1-3 files, clear requirements | `/flow:quick` |
| **Medium** | 3-10 files, some ambiguity | `/flow:plan` → `/flow:go` |
| **Large** | 10+ files, multi-phase, architectural | `/flow:start` → full lifecycle (auto-detects deep/epic) |

### When to Ask vs. Act

**ACT without asking:**
- File type matches a skill (auto-route)
- Bug has clear reproduction steps
- Task maps unambiguously to one action chain
- Validation/testing (always run)
- Security scanning (always run)

**ASK before acting:**
- Multiple valid architectural approaches exist
- Task scope is genuinely unclear (trivial vs. large)
- Destructive operations (delete, force-push, drop table)
- Deployment/publishing actions
- User hasn't specified technology choice for greenfield work

**How to ask efficiently:**
Use `ask-questions-if-underspecified` pattern: 1-5 multiple-choice questions with defaults marked. Include a "reply `defaults` to accept all" fast-path.

---

## 2. Flow Workflow — Complete Reference

Flow is the unified workflow system. A single `/flow:start` auto-detects depth (quick → standard → deep → epic) based on file scope, risk, and ambiguity.

### Project Lifecycle

```
/flow:start [description]
  → Auto-scores: file count, risk (7 dimensions), ambiguity
  → Creates: .flow/{state.yaml, config.yaml, ROADMAP.md, PLAN.md}
  → Routes: quick | standard | deep | epic

/flow:plan [description]
  → Spawns: flow-planner → flow-plan-checker → flow-risk-assessor
  → Creates: .flow/PLAN.md (plans-as-prompts with wave dependencies)

/flow:go [plan_file]
  → Spawns: parallel flow-executor agents (wave-based)
  → Each executor: atomic commits, TDD support, deviation auto-fix
  → Creates: PLAN-NN-SUMMARY.md per wave

/flow:verify
  → Spawns: flow-verifier → goal-backward verification
  → If failures: creates gap closure plans

/flow:complete
  → Archives completed milestone, runs retro, compounds knowledge
```

### Quick Tasks & Debugging

```
/flow:quick [description]
  → Minimal ceremony — plan + execute in one pass
  → For well-defined tasks under 4 files

/flow:debug "description"
  → Spawns flow-debugger with scientific method
  → Hypothesis → test → verify, persistent state in .flow/debug/
```

### State Management

```
/flow:status       → Current position, velocity, next recommended action
/resume            → Restore interrupted session from .flow/state.yaml
                     (auto-migrates legacy .planning/ projects to Flow)
/flow:map          → Parallel codebase mapping across 4 focus areas
/health            → Diagnose .flow/ issues + system integrity
```

### Executor Behavior

Deviation auto-fix rules (no permission needed):
1. Auto-fix bugs (broken behavior, errors, logic issues)
2. Auto-add missing critical functionality (validation, auth, error handling)
3. Auto-fix blocking issues (missing deps, broken imports, build errors)
4. **ASK** about architectural changes (new DB tables, major refactors)

TDD in executor: When task has `tdd="true"`:
- RED commit: `test(scope): add failing test for X`
- GREEN commit: `feat(scope): implement X`
- REFACTOR commit: `refactor(scope): clean up X`

---

## 3. Compound Engineering — Feature Development Cycle

### The Five Workflows

```
/compound-engineering:workflows:brainstorm [idea]
  → Explore WHAT to build through dialogue
  → Output: docs/brainstorms/DATE-topic-brainstorm.md
  → Next: :plan (auto-detects brainstorm)

/compound-engineering:workflows:plan [description]
  → Transform to HOW with acceptance criteria
  → Parallel research: repo-analyst + learnings-researcher
  → Output: docs/plans/DATE-type-name-plan.md (3 detail levels: minimal/more/a-lot)
  → Next: :work

/compound-engineering:workflows:work [plan_file]
  → Execute with TDD, quality gates, incremental commits
  → System-Wide Test Check before each task completion
  → Output: PR + passing tests + updated plan checkboxes

/compound-engineering:workflows:review [PR|branch|latest]
  → 5+ parallel review agents + ultra-thinking deep dives
  → Findings: P1 (blocks merge), P2 (should fix), P3 (nice-to-have)
  → Output: todo files in todos/ directory

/compound-engineering:workflows:compound [context]
  → 5 parallel subagents extract + classify + document
  → Output: docs/solutions/category/topic.md
  → Philosophy: First time 30min, next time 2min
```

### Supporting Commands

```
/compound-engineering:deepen-plan           → Parallel research enhances plan sections
/compound-engineering:resolve_todo_parallel  → Fix all pending todos in parallel
/compound-engineering:test-browser          → Browser tests on affected pages
/compound-engineering:feature-video         → Record walkthrough for PR description
```

---

## 4. Autonomous Decision Flowchart

When a task arrives, follow this decision tree:

```
1. IS THERE A FLOW PROJECT? (check .flow/state.yaml or legacy .planning/STATE.md)
   ├─ YES → Is this a phase task? → /flow:plan or /flow:go
   │        Is this a quick task? → /flow:quick
   │        Is this a bug?       → /flow:debug
   │        Is this a review?    → /flow:review
   └─ NO  → Continue to step 2

2. WHAT TYPE OF TASK?
   ├─ New project (multi-phase)  → /flow:start (auto-detects depth)
   ├─ Feature (medium scope)     → /flow:plan → /flow:go
   ├─ Feature (small scope)      → Do directly or /feature-dev:feature-dev
   ├─ Bug fix                    → Systematic debugging
   ├─ Code review                → /compound-engineering:workflows:review
   ├─ Document/file handling     → Built-in skill (docx/pdf/pptx/xlsx)
   ├─ Frontend/UI work           → frontend-design skill
   ├─ Infrastructure/DevOps      → cc-devops generator → validator
   ├─ Research/exploration       → Context7 + WebSearch + codebase tools
   └─ Trivial (<20 lines)       → Just do it

3. BEFORE STARTING WORK:
   ├─ Read matching specialist SKILL.md (language/framework)
   ├─ Read matching DevOps SKILL.md (if file-type matches)
   ├─ Check Context7 for library docs (if recommending patterns)
   └─ If requirements unclear → ask with multiple-choice + defaults

4. DURING WORK:
   ├─ Apply TDD (failing test first)
   ├─ Apply Kaizen (smallest improvement, error-proof via types)
   ├─ Use MCP tools over manual alternatives
   └─ Auto-fix bugs/deps/imports; ASK for architectural changes

5. BEFORE CLAIMING DONE:
   ├─ Run tests (all must pass)
   ├─ Run security scan (sharp-edges on changed files)
   ├─ Validate generated IaC (generator → validator)
   ├─ Verify behavior (not just "code compiles")
   └─ Offer /flow:compound if non-trivial

6. AFTER COMPLETION:
   ├─ Store key learnings in Memory Graph
   ├─ Offer to commit (/commit-commands:commit)
   └─ If PR needed → /commit-commands:commit-push-pr
```
