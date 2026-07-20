# Agent Teams

## Overview

Orchestrate multiple independent Claude Code sessions working in parallel with shared task lists and direct inter-agent messaging. Each teammate is a full Claude instance with its own context window.

**Core principle:** Use teams when work is genuinely parallelizable across different files/domains. For sequential work or same-file edits, a single session is cheaper and simpler.

## When to Use

Use agent teams when:
- **Parallel code review** — security, performance, test coverage reviewers simultaneously
- **Cross-layer features** — frontend, backend, tests owned by different teammates
- **Competing hypotheses** — multiple theories investigated at once
- **New modules** — teammates own distinct, non-overlapping codebases

Do NOT use when:
- Tasks are sequential or interdependent
- Multiple teammates would edit the same files (causes overwrites)
- Task is simple enough for one session
- Cost is a concern (teams use ~2-7x more tokens)

## Decision: Teams vs Subagents

| Factor | Subagents | Agent Teams |
|--------|-----------|-------------|
| Communication | Report back to caller only | Message each other directly |
| Context | Ephemeral, returns results | Full independent session |
| Coordination | Caller manages all | Shared task list, self-claiming |
| Cost | Lower | Higher (scales with team size) |
| Best for | Focused lookup/research tasks | Complex parallel work |

## Creating a Team

### 1. Decompose into Parallel Tracks

Before spawning, split work into independent tracks with clear file ownership:

```
Track A: src/auth/       → Security teammate
Track B: src/api/        → Backend teammate
Track C: src/components/ → Frontend teammate
Track D: tests/          → Test teammate
```

**Golden rule:** No two teammates touch the same file.

### 2. Spawn with Rich Context

Teammates do NOT inherit conversation history. Include everything they need:

```
Create a team of 3 teammates:

1. "Security Reviewer" — Review src/auth/ for OWASP vulnerabilities.
   Focus on JWT handling, session management, input validation.
   Report issues with severity ratings.

2. "API Developer" — Implement the new /users endpoint in src/api/users.ts.
   Follow existing patterns in src/api/orders.ts. Write tests in tests/api/.

3. "Frontend Developer" — Build the UserProfile component in src/components/users/.
   Use the design system in src/components/shared/. Connect to /users API.
```

### 3. Set Appropriate Controls

- **Plan approval** for risky changes: *"Require plan approval before making changes"*
- **Model selection** for cost control: *"Use Sonnet for each teammate"*
- Aim for **3-5 teammates** with **5-6 tasks each**

## Task Sizing

| Size | Problem | Fix |
|------|---------|-----|
| Too small (< 5 min) | Coordination overhead > benefit | Combine related tasks |
| Too large (> 30 min) | Long stretches without check-in | Split into substeps |
| Right size | Self-contained, clear deliverable | 1 function, 1 test file, 1 review |

## Interaction

### In-Process Mode (default, works everywhere)

```
Shift+Down   → Cycle through teammates
Ctrl+T       → Toggle shared task list
Type message → Send to current teammate
Escape       → Interrupt teammate's turn
```

### Split-Pane Mode (requires tmux or iTerm2)

Add to settings.json: `"teammateMode": "tmux"`

Click into any pane to interact directly. See all teammates simultaneously.

## Common Patterns

### Pattern: Multi-Angle Code Review

```
Create a review team for PR #42:
- "Security" — check auth, injection, data exposure
- "Performance" — check N+1 queries, memory leaks, caching
- "Tests" — check coverage gaps, edge cases, mocking quality

Each reviewer writes findings to a separate review file.
Synthesize findings when all complete.
```

### Pattern: Feature Implementation

```
Create a feature team:
- "Backend" — API endpoints + database migrations (owns: src/api/, src/db/)
- "Frontend" — UI components + state management (owns: src/components/, src/store/)
- "Tests" — Integration + E2E tests (owns: tests/)

Backend finishes first → Frontend connects to API → Tests verify both.
```

### Pattern: Research Sprint

```
Create a research team:
- "Evaluator A" — research and evaluate library X
- "Evaluator B" — research and evaluate library Y
- "Evaluator C" — research and evaluate library Z

Each writes a brief at docs/research/. Lead synthesizes comparison.
```

## Lifecycle Management

### Monitor Progress
Check in periodically with `Shift+Down`. Redirect failing approaches early.

### Explicit Wait
If you (as lead) start implementing instead of waiting:
```
Wait for teammates to complete their tasks before proceeding.
```

### Shutdown
```
Ask the [name] teammate to shut down.
```
Teammate finishes current work, then exits gracefully.

### Cleanup (lead only, after all teammates shut down)
```
Clean up the team.
```

### Orphaned tmux sessions
```bash
tmux ls                           # List
tmux kill-session -t <name>       # Kill specific
```

## Quality Gates with Hooks

### Block idle without passing build

```json
{
  "hooks": {
    "TeammateIdle": [{
      "hooks": [{ "type": "command", "command": ".claude/hooks/build-gate.sh" }]
    }]
  }
}
```

Exit code 2 → sends feedback, keeps teammate working.

### Block task completion without tests

```json
{
  "hooks": {
    "TaskCompleted": [{
      "hooks": [{ "type": "command", "command": ".claude/hooks/test-gate.sh" }]
    }]
  }
}
```

Hook receives JSON on stdin with: `teammate_name`, `team_name`, `task_id`, `task_subject`, `task_description`.

## Cost Control

Teams cost significantly more tokens. Minimize waste:

1. **Use Sonnet for teammates** — balances capability and cost
2. **Keep teams at 3-5** — each additional teammate = linear cost increase
3. **Focused spawn prompts** — teammates auto-load CLAUDE.md + skills + MCP servers
4. **Self-contained tasks** — fewer inter-teammate messages = less overhead
5. **Shut down finished teammates** — idle teammates still consume resources
6. **Prefer subagents for simple lookups** — don't spawn a team for a focused query

## Failure Recovery

| Failure | Recovery |
|---------|----------|
| Teammate not appearing | `Shift+Down` to cycle; check if task was too trivial to warrant team |
| Permission prompt storm | Pre-approve common operations in settings permissions |
| Teammate stops on error | Message directly with instructions, or spawn replacement |
| Task status stuck | Nudge teammate or verify work manually, update status |
| File overwrite conflict | Check `git log -- path/to/file`, restore from history |
| Lead finishes early | Explicit: "Wait for teammates to finish" |

## Limitations

- No session resumption for in-process teammates (`/resume` won't restore them)
- One team per session; clean up before starting a new one
- Teammates cannot spawn their own teams (no nesting)
- Lead role is permanent and non-transferable
- Split panes only work in tmux or iTerm2 (not VS Code terminal, Windows Terminal, Ghostty)
