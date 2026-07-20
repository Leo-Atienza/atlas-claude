---
name: subagent-driven-dev
description: "Execute implementation plans by dispatching fresh subagents per task with two-stage review (spec compliance then code quality). Use when executing plans with independent tasks in the current session. Complements Smart Swarm (SK-039) for multi-agent orchestration."
---

# Subagent-Driven Development

Execute plans by dispatching a fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** Delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused. They never inherit your session's context or history — you construct exactly what they need. This preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

- Have an implementation plan with independent tasks? → Use this skill
- Tasks are tightly coupled? → Execute manually or use brainstorming first
- Want parallel sessions? → Use git worktrees instead

## The Process

```
For each task in the plan:

1. DISPATCH implementer subagent
   - Provide: full task text, relevant context, file paths, constraints
   - Subagent implements, tests, commits, self-reviews

2. Handle implementer status:
   - DONE → proceed to review
   - DONE_WITH_CONCERNS → read concerns, address if needed, then review
   - NEEDS_CONTEXT → provide missing info, re-dispatch
   - BLOCKED → assess blocker (see handling below)

3. DISPATCH spec reviewer subagent
   - Reviewer confirms code matches the task specification
   - If gaps found → implementer fixes, re-review

4. DISPATCH code quality reviewer subagent
   - Reviewer checks code quality, patterns, tests
   - If issues found → implementer fixes, re-review

5. Mark task complete

After all tasks:
6. DISPATCH final reviewer for entire implementation
```

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

| Task Type | Model Tier | Signal |
|-----------|-----------|--------|
| Mechanical implementation | Haiku/fast | Isolated functions, clear specs, 1-2 files |
| Integration tasks | Sonnet/standard | Multi-file coordination, pattern matching |
| Architecture/design/review | Opus/capable | Design judgment, broad codebase understanding |

**Task complexity signals:**
- Touches 1-2 files with a complete spec → fast model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

## Handling Implementer Status

**DONE:** Proceed to spec compliance review.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the human

**Never** ignore an escalation or force the same model to retry without changes.

## Subagent Prompt Structure

When dispatching any subagent, provide:

**For implementers:**
- Full task text (copied from plan, not summarized)
- Relevant file paths and their purpose
- Key constraints or patterns to follow
- What "done" looks like (acceptance criteria)
- Instructions to commit when done and report status

**For spec reviewers:**
- The original task specification
- What was implemented (git diff or file list)
- Check: Does the implementation match the spec? Nothing missing? Nothing extra?

**For code quality reviewers:**
- The git diff of changes
- Project conventions to check against
- Check: Code quality, test coverage, patterns, naming, edge cases

## Iterative Retrieval (Preferred Over Context Pre-Loading)

Instead of dumping all project context into each subagent prompt, use a draft-retrieve-incorporate cycle:

1. **Dispatch with minimal context:** Task spec + file paths + constraints. No full codebase dumps.
2. **If subagent returns NEEDS_CONTEXT:** Provide only the specific missing information, not everything.
3. **If subagent's draft has gaps:** Retrieve the targeted context yourself, then re-dispatch with just that addition.

This prevents context explosion — each subagent stays lean and focused. The coordinator (you) manages the knowledge, subagents manage the execution.

## Red Flags

- Unauthorized branch modifications
- Skipping review checkpoints
- Parallel implementation conflicts (two agents editing same file)
- Context pollution (passing too much history to fresh agents)
- Pre-loading entire codebase into subagent prompts (use iterative retrieval instead)
- Implementer retrying without changes after being BLOCKED
