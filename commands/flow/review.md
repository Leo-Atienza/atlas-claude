---
name: flow:review
description: "Multi-agent parallel code review with configurable agent pool"
argument-hint: "[PR-number|branch|file-path|latest] [--agents agent1,agent2]"
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
Exhaustive code reviews using multi-agent parallel analysis.

Replaces: compound:workflows:review, compound:resolve_parallel, compound:resolve_todo_parallel

Runs configurable review agents in parallel, synthesizes findings into prioritized issues (P1 Critical / P2 Important / P3 Nice-to-have), and optionally auto-resolves with parallel agents.
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Determine Review Target

1. Parse argument:
   - Numeric → PR number (fetch with `gh pr view`)
   - URL → GitHub PR URL
   - Branch name → Review that branch
   - File path → Review specific file
   - "latest" or empty → Review current branch changes
2. Get diff: `git diff main...HEAD` (or appropriate base)
3. Fetch file list and change summary

## Step 2: Load Review Agents

1. Read `.flow/config.yaml` for review agent configuration
2. If `--agents` flag: use specified agents instead
3. Load conditional agents based on changed file patterns:
   - `db/migrate/*.rb` → schema-drift-detector, data-migration-expert
   - `*.sql` → data-integrity-guardian
   - Auth/crypto files → security-sentinel (always)
4. Always include: flow-learnings-researcher (search past issues)

## Step 3: Parallel Agent Review

Spawn ALL configured review agents in parallel:

```
For each agent in review_agents:
  Agent {agent-name}:
    prompt: Review the following PR/changes for {agent's specialty}
    context: diff, file list, PR description, config
```

Additionally run ultra-thinking analysis:
1. **Stakeholder perspectives**: developer, ops, end user, security, business
2. **Scenario exploration**: happy path, invalid inputs, boundaries, concurrency, scale, network failures, resource exhaustion, security vectors, data corruption, cascading failures
3. **Multi-angle**: technical excellence, business value, risk management

## Step 4: Synthesize Findings

Collect all agent results and synthesize:

### Priority Classification
- **P1 CRITICAL** — Blocks merge. Security vulnerabilities, data loss risk, breaking changes without migration
- **P2 IMPORTANT** — Should fix before merge. Logic errors, missing error handling, performance issues
- **P3 NICE-TO-HAVE** — Can fix later. Code style, minor optimizations, documentation

### Protected Artifacts
Never flag for deletion:
- `.flow/` directory and contents
- `docs/plans/`, `docs/solutions/` (knowledge base)

### Create Todo Files

For each finding, create a todo file:
```
.flow/todos/{id}-{status}-{priority}-{description}.md
```

With frontmatter: status (pending), priority (p1/p2/p3), agent (source), file, line.

## Step 5: Present Findings

```
Review Complete:

P1 CRITICAL ({count}):
  - {finding 1} — {file}:{line}
  - {finding 2} — {file}:{line}

P2 IMPORTANT ({count}):
  - {finding 3} — {file}:{line}

P3 NICE-TO-HAVE ({count}):
  - {finding 4} — {file}:{line}

{P1 findings BLOCK merge}

Options:
  1. Resolve all findings now (parallel agents)
  2. Resolve P1 only
  3. Review findings individually
  4. Dismiss (with justification)
```

## Step 6: Auto-Resolve (if selected)

Spawn parallel resolution agents for selected findings:
- Each agent reads the todo file and implements the fix
- Atomic commits per fix
- Mark todo as complete after resolution

## Step 7: Update Quality Metrics

Record review results in `.flow/metrics/quality-scores.yaml`:
```yaml
  review_p1: {count}
  review_p2: {count}
  review_p3: {count}
```

</process>
