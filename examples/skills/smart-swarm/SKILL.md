---
name: smart-swarm
description: "Automatically organize multi-agent teams for complex tasks. Scores task complexity across 5 dimensions, selects appropriate agents from the Flow ecosystem, coordinates parallel work, and synthesizes results. Use when: a task involves multiple independent concerns (frontend + backend + tests), when speed matters and subtasks are parallelizable, or when user says 'use agents', 'swarm this', 'parallelize', or the task clearly benefits from multi-agent execution."
---

# Smart Swarm — Intelligent Multi-Agent Orchestration

Automatically detects when a task is complex enough for multi-agent execution, selects the right agents, coordinates parallel work, and synthesizes results.

## Task Complexity Scoring

Score each dimension 0-3, then sum for routing:

| Dimension | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|
| **File Scope** | 1-2 files | 3-5 files | 6-15 files | 16+ files |
| **Concern Count** | 1 concern | 2 concerns | 3-4 concerns | 5+ concerns |
| **Risk Level** | Low (cosmetic) | Medium (logic) | High (data/auth) | Critical (security/infra) |
| **Isolation** | Fully dependent | Mostly dependent | Mostly independent | Fully independent |
| **Time Pressure** | None | Implied | Explicit ("fast") | Blocking other work |

**Total Score → Routing**:
- **0-4 → SOLO**: Just do it. No agents needed.
- **5-7 → DUO**: 2 agents working in parallel (e.g., implementation + tests)
- **8-11 → TEAM**: 3-4 agents with a lightweight coordinator
- **12-15 → SWARM**: Full swarm with wave execution via `/flow:go --swarm`

## Agent Selection Matrix

Based on the task fingerprint (what concerns are involved), select agents:

| Task Fingerprint | Mode | Agents |
|---|---|---|
| **Feature + Tests** | DUO | `flow-executor`(feature) + `flow-executor`(tests) |
| **Frontend + Backend** | DUO/TEAM | `flow-executor`(frontend) + `flow-executor`(backend) + `flow-verifier` |
| **Bug + Root Cause** | DUO | `flow-debugger` + `flow-repo-analyst` |
| **Research + Implement** | TEAM | `flow-external-researcher` + `flow-repo-analyst` + `flow-executor` |
| **Multi-file Refactor** | TEAM | `flow-mapper` + N×`flow-executor` + `flow-verifier` |
| **Full Feature (deep)** | SWARM | `flow-planner` + 3×`flow-executor` + `flow-verifier` + `flow-uat` |
| **Code Review** | TEAM | Use CE-005 multi-agent review (already built for this) |
| **Discovery/Research** | TEAM | `flow-external-researcher` + `flow-repo-analyst` + `flow-learnings-researcher` + `flow-research-synthesizer` |

## Orchestration Protocol

### 1. Score & Route
Run the complexity scoring on the task. Announce the score and routing decision:
```
Complexity: FILE=2, CONCERNS=3, RISK=1, ISOLATION=2, TIME=1 → Total: 9 → TEAM mode
```

### 2. Decompose
Break the task into independent subtasks. Write each to a coordination file:
```
.flow/swarm-{timestamp}/
  task-1.md   # e.g., "Implement API endpoint for /users"
  task-2.md   # e.g., "Create React component for user list"
  task-3.md   # e.g., "Write integration tests for user flow"
```

Each task file contains:
- Task description (what to do)
- Input files (what to read)
- Output files (what to create/modify)
- Constraints (don't modify files assigned to other agents)
- Success criteria

### 3. Spawn Agents
Use the `Agent` tool to spawn each agent. Each agent gets:
- Its task file
- Project CLAUDE.md for context
- Instruction to write results to `result-{N}.md`

For DUO mode, spawn both agents in a single message (parallel).
For TEAM mode, spawn all agents in a single message.
For SWARM mode, delegate to `/flow:go --swarm` (already handles wave dependencies).

### 4. Collect Results
After agents complete:
- Read all `result-{N}.md` files
- Check for file conflicts (did two agents modify the same file?)
- If conflicts: present diff to user or use `flow-verifier` to auto-merge

### 5. Synthesize
Write `synthesis.md` summarizing:
- What each agent accomplished
- Any conflicts resolved
- Files created/modified
- Test results
- Remaining work (if any)

### 6. Clean Up
- Archive swarm directory if fully successful
- Leave it if there's remaining work for the user

## Tier Routing Integration

When spawning agents, apply `rules/tier-routing.md` model selection:

| Swarm Mode | Agent Role | Model Tier |
|------------|-----------|------------|
| **SOLO** | Single executor | Tier 2 (haiku) if trivial, Tier 3 (sonnet) otherwise |
| **DUO** | Test writer | Tier 2 (haiku) — pattern-based |
| **DUO** | Implementer | Tier 3 (sonnet) |
| **TEAM** | Coordinator | Tier 4 (opus) — needs reasoning |
| **TEAM** | Executors | Tier 3 (sonnet) |
| **TEAM** | Verifier | Tier 3 (sonnet) |
| **SWARM** | Planner | Tier 4 (opus) |
| **SWARM** | Executors | Tier 3 (sonnet) |
| **SWARM** | Verifier/UAT | Tier 3 (sonnet) |

Consult `logs/agent-profiles-summary.json` if available — prefer agents with reliability > 0.7.
If an agent type consistently underperforms (reliability < 0.4), escalate to a higher tier.

## Cost Awareness

Before spawning, estimate token usage:
```
estimated_tokens = num_agents × 50K (avg context per agent) + 20K (orchestrator overhead)
```

**Thresholds**:
- DUO (2 agents): ~120K tokens — always fine
- TEAM (3-4 agents): ~170-220K tokens — proceed
- SWARM (5+ agents): ~270K+ tokens — warn user:
  "This swarm will use approximately {N} tokens across {M} agents. Proceed?"

**Hard cap**: 6 concurrent agents maximum.

## When NOT to Swarm

- Task is sequential (each step depends on the previous)
- Task is trivial (< 20 lines of code, 1-2 files)
- Agent overhead would exceed the time savings
- The task requires human judgment at each step (interactive)
- Context window is already >50% used (risk of running out)

## Integration with Flow

- Smart Swarm is a higher-level orchestrator that uses Flow agents
- For SWARM mode, it delegates entirely to `/flow:go --swarm`
- For DUO/TEAM mode, it handles coordination directly
- DUO mode: agents work in current branch (low conflict risk)
- TEAM mode: use `isolation: "worktree"` on the Agent tool when agents modify overlapping files
- SWARM mode: all agents get `isolation: "worktree"` for full isolation

## Examples

### Example: DUO (score 6)
```
Task: "Add a dark mode toggle with tests"
Score: FILES=2, CONCERNS=2, RISK=0, ISOLATION=2, TIME=0 → 6 → DUO
Agents: flow-executor(implement toggle) + flow-executor(write tests)
Result: Both agents work in parallel, results merged
```

### Example: TEAM (score 9)
```
Task: "Build user authentication with frontend, backend, and database migration"
Score: FILES=2, CONCERNS=3, RISK=2, ISOLATION=2, TIME=0 → 9 → TEAM
Agents: flow-executor(backend+DB) + flow-executor(frontend) + flow-verifier(integration)
Result: 3 agents, coordinator checks no conflicts
```

### Example: SWARM (score 13)
```
Task: "Refactor the entire payment system across 20 files"
Score: FILES=3, CONCERNS=3, RISK=3, ISOLATION=2, TIME=2 → 13 → SWARM
Action: Delegate to /flow:plan → /flow:go --swarm
```
