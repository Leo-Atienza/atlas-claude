---
name: flow:plan
description: "Plans-as-prompts with depth-aware verification loop"
argument-hint: "[phase-number|feature-description] [--depth quick|standard|deep|epic] [--verify|--skip-verify] [--gaps]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Create executable plans (plans-as-prompts) for a phase or feature.

Replaces: gsd:plan-phase, compound:workflows:plan, compound:deepen-plan, fullstack:planning:*

Adapts behavior based on depth:
- quick: Single lightweight plan, no verification
- standard: Plan with parallel research, optional verification
- deep: Full plan with verification loop (planner → plan-checker → iterate)
- epic: Full plan with extended verification (max 5 iterations) + risk assessment

The plan IS the prompt — PLAN.md files are read directly by flow-executor as instructions.
</objective>

<context>
$ARGUMENTS

**Flags:**
- `--depth {level}` — Override project depth for this plan
- `--verify` — Force plan verification even at standard depth
- `--skip-verify` — Skip verification even at deep/epic depth
- `--gaps` — Gap closure mode: create plans to fix verification failures

Reference files:
@C:/Users/leooa/.claude/skills/flow/references/state-management.md
@C:/Users/leooa/.claude/skills/flow/references/checkpoints.md
@C:/Users/leooa/.claude/skills/flow/references/deviation-rules.md
</context>

<process>

## Step 1: Detect Context

1. Read `.flow/config.yaml` to get project depth (or use --depth override)
2. Read `.flow/state.yaml` for current position
3. Determine planning mode:
   - **Phase mode:** Argument is a number → planning for `.flow/phases/{N}-*/`
   - **Feature mode:** Argument is a description → planning for `.flow/plans/`
   - **Gap closure:** `--gaps` flag → create fix plans from VERIFICATION.md gaps

## Step 2: Gather Context

### Phase mode (deep/epic depth)
1. Read `.flow/ROADMAP.md` to get phase goal and success criteria
2. Read `.flow/REQUIREMENTS.md` for requirement mappings
3. Read phase CONTEXT.md if exists (user decisions — NON-NEGOTIABLE)
4. Check for recent brainstorm in `.flow/brainstorms/` (within 14 days)

### Feature mode (standard depth)
1. Check for recent brainstorm in `.flow/brainstorms/`
2. Read project CLAUDE.md for conventions
3. Scan codebase for related patterns

### Gap closure mode
1. Read VERIFICATION.md for specific gaps
2. Read original PLANs and SUMMARYs for context
3. Create targeted fix plans for each gap

## Step 3: Research (if enabled)

At standard+ depth, run parallel research agents:

```
Spawn in parallel:
  1. flow-repo-analyst — Scan codebase for existing patterns, similar features
  2. flow-learnings-researcher — Search .flow/solutions/ AND ~/.claude/flow-knowledge/ for relevant past solutions
```

At deep+ depth, also run:
```
  3. flow-external-researcher — Best practices, framework docs, Context7
  4. flow-git-analyst — Git history for related changes (optional, if relevant)
```

Collect research results before proceeding to planning.

## Step 4: Discuss Phase (deep/epic, if no CONTEXT.md)

If planning a phase at deep/epic depth and no CONTEXT.md exists:

Run adaptive questioning to capture user decisions:
1. Present the phase goal from ROADMAP.md
2. Ask about gray areas (UI choices, UX flows, data model decisions)
3. Ask one question at a time, prefer multiple choice
4. Capture decisions as LOCKED (non-negotiable during execution)
5. Track deferred ideas (out of scope for this phase)

Write `.flow/phases/{N}-{name}/CONTEXT.md`:
```markdown
# Phase {N} Context

## Decisions (LOCKED)
- {decision 1}: {choice} — {rationale}
- {decision 2}: {choice} — {rationale}

## Claude's Discretion
- {area where Claude can make choices}

## Deferred Ideas
- {idea 1} — defer to phase {N+X}
```

## Step 5: Create Plans

Spawn **flow-planner** agent with all gathered context:
- Phase goal, requirements, success criteria
- CONTEXT.md decisions
- Research results
- Brainstorm reference (if exists)
- Risk assessment (if available)

The planner creates PLAN.md files with:

**Frontmatter:**
```yaml
---
phase: {N}
plan: {M}
title: "{descriptive title}"
type: execute  # execute | tdd
wave: {W}  # pre-computed wave for parallel execution
depends_on: []  # other plan numbers this depends on
files_modified: []
autonomous: true  # false if has checkpoints
requirements: []  # requirement IDs covered
must_haves:
  truths: []    # what must be TRUE after execution
  artifacts: [] # files that must EXIST
  key_links: [] # connections that must be WIRED
---
```

**Body (plans-as-prompts):**
```markdown
<objective>
{What and why — the plan's goal}
</objective>

<context>
{@-references to files the executor should read}
{Research findings relevant to this plan}
{Decisions from CONTEXT.md that apply}
</context>

<tasks>
<task type="auto">
{Task 1 description with specific implementation details}
</task>

<task type="checkpoint:human-verify">
{Task 2 that needs human verification}
</task>

<task type="auto">
{Task 3 description}
</task>
</tasks>

<verification>
{How to verify the plan's objective was achieved}
</verification>

<success_criteria>
- [ ] {Criterion 1}
- [ ] {Criterion 2}
</success_criteria>
```

### Plan Decomposition Rules
- 2-3 tasks per plan (keep plans small and focused)
- Vertical slices preferred (model + API + UI in one plan, not horizontal layers)
- Each plan should be independently valuable when possible
- Wave numbers assigned based on dependency analysis

## Step 6: Plan Verification (deep/epic depth)

If plan verification is enabled:

Spawn **flow-plan-checker** agent with:
- All PLAN.md files
- Phase goal and requirements
- CONTEXT.md decisions
- Risk assessment

The checker evaluates:
1. Does the plan ACHIEVE the goal (not just complete tasks)?
2. Are all requirements covered by at least one task?
3. Does the plan contradict any CONTEXT.md decisions?
4. Are there missing artifacts or wiring?
5. Are must_haves complete and verifiable?
6. SpecFlow gap analysis (edge cases, error handling, data flow completeness)

**If PASS:** Plans are ready for execution.
**If REVISE:** Feedback sent to flow-planner for revision. Loop continues (max 3 at deep, 5 at epic).

## Step 7: Present Plans

Show the user a summary of created plans:

```
Plans created for Phase {N}: {name}

Wave 1 (parallel):
  Plan {N}-01: {title} — {files_modified count} files
  Plan {N}-02: {title} — {files_modified count} files

Wave 2 (after Wave 1):
  Plan {N}-03: {title} — depends on {N}-01, {N}-02

Verification: {PASS|REVISE iteration count}
Requirements covered: {count}/{total}

Ready to execute? Run /flow:go {N}
```

## Step 8: Update State

Update `.flow/state.yaml`:
- position.status = "planning" → "ready"
- position.plan_count = {total plans}

If deep/epic, update ROADMAP.md progress.

</process>
