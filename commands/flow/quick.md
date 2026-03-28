---
name: flow:quick
description: "Fast path for small tasks. Minimal ceremony, still tracked"
argument-hint: "[task description] [--full]"
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
Execute small, ad-hoc tasks with Flow guarantees (atomic commits, state tracking) but skip ceremony.

Replaces: gsd:quick

Quick mode spawns flow-planner (quick mode) + flow-executor directly.
Tasks tracked in `.flow/quick/` separate from planned phases.

**Default:** Skips research, plan-checker, verifier.
**`--full` flag:** Enables plan-checking (max 2 iterations) and post-execution verification.
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Validate

1. If no task description, ask: "What would you like to do?"
2. Check if `.flow/` exists. If not, create minimal structure:
   ```bash
   mkdir -p .flow/quick
   ```
3. Read `.flow/config.yaml` if exists, use defaults if not

## Step 2: Plan (Lightweight)

Spawn **flow-planner** in quick mode:
- Single plan file: `.flow/quick/{slug}-PLAN.md`
- No phases, no waves, no roadmap
- Simplified frontmatter (no must_haves unless --full)
- 1-5 tasks maximum

## Step 3: Execute

Spawn **flow-executor** with the quick plan:
- Atomic commits per task
- Deviation rules apply (auto-fix bugs, blocking issues)
- System-wide test check if enabled in config

## Step 4: Verify (--full only)

If `--full` flag:
1. Run plan-checker on the plan (max 2 iterations)
2. After execution, run flow-verifier on results

## Step 5: Update State

Update `.flow/state.yaml` quick tasks section.
Create `.flow/quick/{slug}-SUMMARY.md` with results.

Present completion:
```
Quick task complete: {title}
  Files modified: {count}
  Commits: {count}
  Duration: {time}

Compound this knowledge? [y/N] (run /flow:compound)
```

</process>
