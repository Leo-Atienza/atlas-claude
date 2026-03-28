---
name: flow:retro
description: "Cross-phase/sprint retrospective with lessons learned"
argument-hint: "[scope: phase|milestone|sprint]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---
<objective>
Generate retrospective analysis across phases or sprints.

Replaces: fullstack:complete-sprint, fullstack:complete-epic (retro portion)

Analyzes completed work, quality metrics, velocity trends, and captures lessons learned.
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Determine Scope

- **Phase:** Retrospective for a single phase
- **Milestone:** Retrospective across all phases in a milestone
- **Sprint:** Retrospective across multiple milestones/epics (if using external tracker)

## Step 2: Gather Data

1. Read all SUMMARY.md files in scope
2. Read VERIFICATION.md results
3. Read quality scores from `.flow/metrics/`
4. Read state.yaml for velocity data
5. Read any debug sessions that occurred

## Step 3: Analysis

### Deliverables
- What was planned vs what was delivered
- Features that exceeded expectations
- Features that were cut or deferred

### Quality
- Composite score trend across phases
- P1/P2/P3 findings trend
- Verification pass/fail history
- Deviation frequency

### Velocity
- Plan execution time trends
- Bottlenecks identified
- Phase-over-phase comparison

### Lessons Learned
- What went well (keep doing)
- What was harder than expected (watch out)
- What should change (improve)
- Patterns established (new conventions)
- Knowledge compounded (solutions documented)

## Step 4: Write Retrospective

Write to `.flow/milestones/v{X.Y}-RETROSPECTIVE.md` or `.flow/phases/{N}-{name}/RETRO.md`:

```markdown
# Retrospective: {scope}

## Summary
{1-paragraph overview}

## Deliverables
| Planned | Delivered | Delta |
|---|---|---|

## Quality Trends
{chart or table of scores across phases}

## Velocity
{analysis of execution speed and trends}

## Lessons Learned
### Keep Doing
- ...

### Watch Out
- ...

### Improve
- ...

## Action Items
- [ ] {specific improvement for next phase/milestone}
```

## Step 5: Route

Offer next steps:
- `/flow:complete {version}` — Archive milestone
- `/flow:start` — Begin next milestone
- `/flow:compound` — Document specific solutions

</process>
