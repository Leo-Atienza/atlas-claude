# Executing Plans

> Source: [obra/superpowers](https://github.com/obra/superpowers)

## Overview

Load a plan, review it critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for review.

## When to Use

Use when you have a written implementation plan to execute. Pairs with the `writing-plans` skill.

## The Process

### Step 1: Load and Review Plan

1. Read plan file from `docs/plans/`
2. Review critically — identify any questions or concerns
3. If concerns: Raise them before starting
4. If no concerns: Create a TodoWrite checklist and proceed

### Step 2: Execute Batch

**Default batch size: 3 tasks**

For each task:
1. Mark as `in_progress` in TodoWrite
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified (type checker, build, tests)
4. Mark as `completed`

### Step 3: Report

When batch is complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."
- Wait for response before continuing

### Step 4: Continue

Based on feedback:
- Apply changes if needed
- Execute next batch of 3 tasks
- Repeat until complete

### Step 5: Final Verification

After all tasks are complete:
1. Run the project's type checker — must pass
2. Run the project's build command — must succeed
3. Run the project's linter — fix any errors
4. Report final status with evidence (see `verification-before-completion` skill)

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, errors you can't resolve, instruction unclear)
- Plan has critical gaps
- You don't understand an instruction
- Verification fails repeatedly (3+ times — see `systematic-debugging` skill)

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- User updates the plan based on feedback
- Fundamental approach needs rethinking

**Don't force through blockers** — stop and ask.

## Remember

- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Between batches: just report and wait
- Stop when blocked, don't guess
- Use `verification-before-completion` skill before claiming any task is done
- Use `systematic-debugging` skill when encountering unexpected errors
