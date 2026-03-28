# Flow State Management Reference

## State Directory Detection

Flow commands detect state by checking for `.flow/` directory in the working directory. For backward compatibility, `.planning/` is also recognized (legacy GSD projects).

```bash
# Detection order
if [ -d ".flow" ]; then
  FLOW_DIR=".flow"
elif [ -d ".planning" ]; then
  FLOW_DIR=".planning"  # Legacy mode
fi
```

## config.yaml Schema

```yaml
# .flow/config.yaml — Workflow preferences
version: 1

depth: standard  # auto | quick | standard | deep | epic

workflow:
  research: true           # Run research agents during planning
  plan_verify: true        # Plan-checker verification loop
  goal_verify: true        # Goal-backward verification after execution
  auto_advance: false      # Auto-advance phases without asking
  common_ground: false     # Surface assumptions before work (auto at deep+)

execution:
  parallel: true           # Enable wave-based parallel execution
  max_concurrent_agents: 3 # Max subagents per wave
  wave_execution: true     # Group plans into dependency waves
  swarm_mode: false        # Default swarm off (override with --swarm)

review:
  agents:                  # Review agent pool
    - security-sentinel
    - performance-oracle
    - architecture-strategist
  conditional_agents:      # Triggered by file patterns
    "db/migrate/*.rb": [schema-drift-detector, data-migration-expert]
    "*.sql": [data-integrity-guardian]

quality:
  tdd: false               # TDD mode (red-green-refactor)
  security_scan: true      # Security scan before completion
  system_wide_test_check: true  # Trace callbacks/middleware during execution

integrations:
  tracker: none            # none | github | linear | jira
  tracker_url: ""
  confluence: false

commits:
  docs: true               # Commit planning docs
  incremental: true        # Per-task commits during execution
  conventional: true       # Conventional commit messages

gates:
  confirm_project: true    # Confirm project setup before proceeding
  confirm_roadmap: true    # Confirm roadmap before planning phases
  confirm_plan: true       # Confirm plan before execution
  confirm_destructive: true # Confirm destructive operations
```

## state.yaml Schema

```yaml
# .flow/state.yaml — Machine-readable project state
project:
  name: ""
  core_value: ""
  started: "2026-03-16"
  depth: standard

position:
  phase: 1
  phase_count: 4
  phase_name: "Foundation"
  plan: 2
  plan_count: 3
  status: executing  # planning | executing | verifying | blocked | complete
  progress_pct: 25

last_activity:
  date: "2026-03-16T14:30:00Z"
  action: "Completed plan 1 of phase 1"

velocity:
  total_plans: 5
  completed_plans: 3
  avg_duration_min: 12
  total_hours: 1.0
  recent_trend: improving  # improving | stable | degrading

blockers: []

decisions:
  - phase: 1
    decision: "Use PostgreSQL over SQLite"
    date: "2026-03-16"

todos:
  pending: 3
  ready: 1
  complete: 7

quality:
  last_composite: 85
  trend: [92, 85]
  p1_findings: 0

session:
  last: "2026-03-16T14:30:00Z"
  resume_file: ".flow/.continue-here.md"
```

## STATE.md Generation

STATE.md is a human-readable view generated from state.yaml. Format:

```markdown
# Flow State

**Project:** {name}
**Core Value:** {core_value}
**Depth:** {depth}
**Started:** {started}

## Current Position

Phase {phase}/{phase_count}: {phase_name}
Plan {plan}/{plan_count} — Status: {status}
Progress: [{progress_bar}] {progress_pct}%

## Last Activity

{date}: {action}

## Velocity

| Metric | Value |
|---|---|
| Plans completed | {completed_plans}/{total_plans} |
| Avg duration | {avg_duration_min} min |
| Total time | {total_hours} hrs |
| Trend | {recent_trend} |

## Quality

Composite: {last_composite}/100
Trend: {trend}
P1 findings: {p1_findings}

## Blockers

{blockers list or "None"}

## Key Decisions

{decisions table}

## Todos

Pending: {pending} | Ready: {ready} | Complete: {complete}

## Quick Tasks Completed

{quick tasks table if any}
```

## State Operations

### Reading State
```bash
# Read full state
cat .flow/state.yaml

# Read specific field (use grep or yq if available)
grep "status:" .flow/state.yaml

# Read STATE.md for human-readable view
cat .flow/STATE.md
```

### Updating State
State updates are done by reading state.yaml, modifying in memory, and writing back. Always preserve all fields — never partial-write.

Key update patterns:
- **Position change:** Update phase, plan, status, progress_pct
- **Activity log:** Update last_activity with timestamp + action
- **Velocity update:** Recalculate avg_duration_min, total_hours, recent_trend
- **Quality update:** Append to trend array, update last_composite
- **Blocker add/remove:** Push/filter blockers array
- **Decision record:** Append to decisions array

After any state.yaml update, regenerate STATE.md.

### Session Handoff
When pausing work, create `.flow/.continue-here.md`:

```markdown
# Continue Here

**Paused:** {timestamp}
**Phase:** {phase} — {phase_name}
**Plan:** {plan}/{plan_count}
**Status:** {status}

## Completed This Session
{list of completed plans/tasks with commit hashes}

## Remaining Work
{list of remaining plans/tasks}

## Decisions Made
{decisions with rationale}

## Blockers/Concerns
{any issues to be aware of}

## Context Needed to Resume
{key files, state, understanding needed}
```

## Dual-Read Compatibility

For projects with `.planning/` (legacy GSD):
- Read `.planning/STATE.md` and parse as best effort
- Read `.planning/config.json` and map to config.yaml schema
- Phase directories at `.planning/phases/` work the same as `.flow/phases/`
- PLAN.md and SUMMARY.md formats are identical

Migration: `/flow:migrate` converts `.planning/` to `.flow/` (see migration command).

## Quality Scores

`.flow/metrics/quality-scores.yaml`:

```yaml
phases:
  - phase: 1
    name: Foundation
    scores:
      verification_pass: true
      gaps_found: 0
      review_p1: 0
      review_p2: 2
      review_p3: 5
      test_coverage_delta: "+15%"
      deviations: 1
      replans: 0
    composite: 92

trends:
  composite: [92]
  p1_findings: [0]
```

Composite score weights:
- Verification pass: 30%
- P1 findings (inverse): 25%
- Gaps found (inverse): 20%
- Deviations (inverse): 15%
- Replans (inverse): 10%
