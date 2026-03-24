---
name: flow:smart-swarm
description: "Auto-detect complexity, select agents, execute as coordinated team"
argument-hint: "[task description]"
---

Intelligently organize multi-agent teams based on task complexity.

## Process

1. **Read the smart-swarm skill**: `~/.claude/skills/smart-swarm/SKILL.md`

2. **Score complexity** across 5 dimensions (file scope, concerns, risk, isolation, time pressure) → total 0-15

3. **Route based on score**:
   - **0-4 (SOLO)**: Execute directly, no agents needed
   - **5-7 (DUO)**: Spawn 2 agents in parallel using the Agent tool
   - **8-11 (TEAM)**: Spawn 3-4 agents with lightweight coordination
   - **12-15 (SWARM)**: Delegate to `/flow:plan` then `/flow:go --swarm`

4. **For DUO/TEAM mode**:
   - Decompose task into independent subtasks
   - Select agents from the selection matrix in the skill
   - Spawn all agents in a SINGLE message (parallel execution)
   - Collect results and check for file conflicts
   - Synthesize and present unified result

5. **For SWARM mode**:
   - Run `/flow:plan` to create wave-based plan
   - Run `/flow:go --swarm` for full parallel execution
   - Results handled by Flow's existing synthesis

6. **Report**: Show complexity score, agents used, results summary

## Important

- Always announce the complexity score before spawning agents
- Show cost estimate if spawning 4+ agents
- Hard cap: 6 concurrent agents maximum
- If context is >50% used, prefer SOLO/DUO over TEAM/SWARM
- Use `isolation: "worktree"` for agents that modify overlapping files
