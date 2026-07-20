---
name: flow:team
description: "Spawn an Agent Team for complex tasks — peer-to-peer multi-agent collaboration"
argument-hint: "[task description]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - Task
  - TodoWrite
  - AskUserQuestion
---
<objective>
Use Claude Code's Agent Teams API to tackle TEAM/SWARM-complexity tasks with 2-16 agents
that communicate peer-to-peer, share a codebase, and coordinate via a shared task list.

This is the upgrade path from `/flow:smart-swarm` — use when:
- Complexity score is TEAM (8-11) or SWARM (12-15)
- Subtasks have dependencies (not fully independent)
- Agents need to communicate mid-flight (not just at the end)
</objective>

<process>

## Step 1: Score Complexity

Read `~/.claude/skills/smart-swarm/SKILL.md` and score the task across 5 dimensions:
- File scope (0-3): How many files affected?
- Concerns (0-3): How many separate domains?
- Risk (0-3): How much could go wrong?
- Isolation (0-3): How independent are the pieces?
- Time pressure (0-3): How urgent?

Total 0-15. Route:
- **0-7**: Use `/flow:smart-swarm` instead (simpler orchestration is sufficient)
- **8-15**: Continue with Agent Teams below

## Step 2: Design the Team

1. Decompose the task into 2-6 roles (not just subtasks — roles that persist)
2. For each role, define:
   - **Role name**: e.g., "Architect", "Implementer", "Tester", "Security Auditor"
   - **Responsibility**: What this teammate owns
   - **Deliverable**: Concrete output expected (file, report, test suite)
   - **Dependencies**: Which other roles they need input from

3. Select agent types from the Flow ecosystem:

| Role Pattern | Agent Type | Model Tier |
|-------------|-----------|------------|
| Planning/Architecture | `flow-planner` | opus |
| Implementation | `flow-executor` | sonnet |
| Testing/Verification | `flow-verifier` | sonnet |
| Security Review | `flow-security-auditor` | sonnet |
| Research | `flow-external-researcher` | haiku |
| Code Analysis | `flow-repo-analyst` | haiku |

## Step 3: Create Shared Task List

Before spawning, create a shared task list using TodoWrite that all teammates can see:
- One task per deliverable
- Include acceptance criteria in task descriptions
- Mark dependencies explicitly

## Step 4: Spawn the Team

Spawn teammates using the Agent tool. Each teammate gets:
1. Their role definition and deliverable requirement
2. The shared task list for context
3. File ownership boundaries (which files they own, which to not touch)
4. Instruction to update the task list as they make progress

**Spawn all teammates in a single message for parallel execution.**

## Step 5: Monitor and Coordinate

As team lead:
1. Watch for teammate completions via the task list
2. The `TeammateIdle` hook will auto-check quality of their output
3. The `TaskCompleted` hook will verify deliverables
4. If a teammate's work is rejected by hooks, provide feedback

## Step 6: Synthesize

Once all deliverables are complete:
1. Check for file conflicts between teammates
2. Run integration tests if applicable
3. Present unified result with attribution per teammate
4. Update `.flow/state.yaml` with team execution metadata

</process>
