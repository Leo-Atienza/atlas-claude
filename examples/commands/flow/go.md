---
name: flow:go
description: "Wave-based parallel execution + swarm mode. System-wide test check"
argument-hint: "[phase-number|plan-file] [--swarm] [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - AskUserQuestion
---
<objective>
Execute plans using wave-based parallel execution with subagent isolation.

Replaces: gsd:execute-phase, compound:workflows:work, compound:lfg/slfg, fullstack:execution:*

The orchestrator stays LEAN: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent (flow-executor) loads full context and handles its own plan.

Context budget: ~15% orchestrator, 100% fresh per subagent.

**Flags:**
- `--swarm` — Swarm mode: spawn all plans simultaneously (ignore wave ordering)
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true`)
</objective>

<context>
$ARGUMENTS

Reference files:
@~/.claude/skills/flow/references/deviation-rules.md
@~/.claude/skills/flow/references/checkpoints.md
@~/.claude/skills/flow/references/background-workers.md
@~/.claude/rules/tier-routing.md
</context>

<process>

## Step 1: Load Project State

1. Read `.flow/config.yaml` for execution preferences
2. Read `.flow/state.yaml` for current position
3. Determine execution target:
   - **Phase number:** Execute all plans in `.flow/phases/{N}-*/`
   - **Plan file path:** Execute single specific plan
   - **No argument:** Execute current phase from state.yaml

## Step 2: Discover Plans

### Phase execution
1. Find phase directory: `.flow/phases/{N}-*/`
2. List all `*-PLAN.md` files in the directory
3. Check for existing `*-SUMMARY.md` files (already completed)
4. Filter: only plans without SUMMARY.md (incomplete)
5. If `--gaps-only`: filter to plans with `gap_closure: true` in frontmatter

### Single plan execution
1. Read the specified plan file
2. Proceed directly to Step 4 (skip wave analysis)

If no incomplete plans found:
- "All plans in phase {N} are already executed. Run `/flow:verify {N}` to verify."
- Exit

## Step 3: Analyze Dependencies and Group into Waves

Parse frontmatter from each plan to build dependency graph:

```
For each plan:
  Read: wave (pre-computed), depends_on (plan numbers)

Group by wave number:
  Wave 1: plans with wave=1 (no dependencies)
  Wave 2: plans with wave=2 (depend on wave 1)
  Wave 3: plans with wave=3 (depend on wave 2)
  ...
```

If `--swarm` flag: ignore waves, put ALL plans in a single wave (maximum parallelism).

Present execution plan to user:
```
Execution Plan for Phase {N}:

Wave 1 (parallel):
  [{autonomous?}] Plan {N}-01: {title}
  [{autonomous?}] Plan {N}-02: {title}

Wave 2 (after Wave 1):
  [{autonomous?}] Plan {N}-03: {title}

{checkpoint plans} will pause for user input.
Estimated: {plan_count} plans in {wave_count} waves.

Proceed? [Y/n]
```

## Step 4: Execute Waves

For each wave (sequential):

### Spawn Subagents
For each plan in the current wave, spawn a **flow-executor** subagent:

```
Agent flow-executor:
  prompt: Execute the following plan.

  <files_to_read>
  - .flow/phases/{N}-{name}/{plan}-PLAN.md
  - .flow/phases/{N}-{name}/CONTEXT.md (if exists)
  - .flow/config.yaml
  - .flow/state.yaml
  - ./CLAUDE.md (if exists)
  </files_to_read>

  Plan file: {path to PLAN.md}
  Phase: {N}
  Plan: {M}
  State directory: .flow/
```

Run all subagents in the wave **in parallel** (up to max_concurrent_agents from config).

### Collect Results
For each completed subagent:
1. Verify SUMMARY.md was created
2. Check for checkpoint returns (plan paused, needs user input)
3. Check for replan signals (REPLAN NEEDED, DEBUG ESCALATION, BLOCKER)
4. Collect commit hashes

### Handle Checkpoints
If a plan returns a checkpoint:
1. Present the checkpoint to the user
2. Wait for user response
3. Spawn new flow-executor to continue from checkpoint

### Handle Replan Signals
If a plan returns a replan signal:
1. Present the situation to the user
2. Options:
   - **Replan:** Run `/flow:plan {N} --gaps` with the signal context
   - **Debug:** Switch to `/flow:debug` for the failing component
   - **Override:** Continue execution despite the signal
   - **Skip:** Mark this plan as skipped, continue with remaining

## Step 4b: Background Workers (Depth-Dependent)

After each wave completes, spawn background quality workers per `background-workers.md`:
- **standard depth**: Security scanner after final wave only
- **deep depth**: Security scanner per wave + test coverage after final wave
- **epic depth**: All three workers (security, test, pattern learner)
- **quick depth**: Skip — overhead not worth it

Use `run_in_background: true` and `model: "sonnet"` (Tier 3) for workers.
Apply tier-routing rules from `tier-routing.md` when spawning all agents.
Never block wave execution waiting for background workers.

## Step 5: Post-Wave Processing

After each wave completes:
1. Update `.flow/state.yaml` with completed plans
2. Check if any wave 2+ plans need results from wave 1 (dependency resolution)
3. Check for background worker results (include if available, note "in progress" if not)
4. Proceed to next wave

## Step 6: Phase Completion

After all waves complete:
1. Read all SUMMARY.md files
2. Aggregate metrics:
   - Total files modified
   - Total commits
   - Deviations encountered
   - Duration
3. Update `.flow/state.yaml`:
   - position.status = "verifying" (if goal_verify enabled) or "complete"
   - velocity metrics
4. Update `.flow/STATE.md`

Present completion summary:
```
Phase {N} Execution Complete:
  Plans: {completed}/{total}
  Files modified: {count}
  Commits: {count}
  Deviations: {count}
  Duration: {time}

  {skipped plans if any}
  {checkpoint plans awaiting verification if any}

Next: /flow:verify {N}  (verify goals achieved)
  or: /flow:review       (code review)
  or: /flow:ship          (commit and PR)
```

## Step 7: Quality Metrics

Record execution metrics in `.flow/metrics/quality-scores.yaml`:
```yaml
  - phase: {N}
    scores:
      deviations: {count}
      replans: {count}
```

(Verification and review scores added later by those commands.)

</process>
