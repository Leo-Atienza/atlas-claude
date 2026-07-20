---
name: flow:status
description: "Dashboard: position, velocity, todos, next action, quality trends"
argument-hint: "[--todos|--health|--progress]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
---
<objective>
Show project status dashboard and intelligently route to the next action.

Combines: gsd:progress, gsd:check-todos, gsd:health, gsd:resume-work into one command.

Flags:
- `--todos` — Focus on pending todos, offer to work on one
- `--health` — Diagnose .flow/ directory integrity
- `--progress` — Default: show position + route to next action
</objective>

<process>

## Step 1: Detect Project State

Check for Flow project state:
```
1. Check for .flow/ directory → Flow project
2. Check for .planning/ directory → Legacy GSD project (read in compatibility mode)
3. Neither exists → No active project
```

If no project found:
- Suggest `/flow:start` to begin a new project
- Or `/flow:quick` for a quick task
- Exit

## Step 2: Load State

Read state files based on what exists:

**Flow project (.flow/):**
- Read `.flow/state.yaml` for machine-readable state
- Read `.flow/config.yaml` for workflow preferences
- Read `.flow/STATE.md` for human-readable view

**Legacy GSD project (.planning/):**
- Read `.planning/STATE.md` and parse
- Read `.planning/config.json` if exists

## Step 3: Handle Flags

### --todos flag
1. List all files in `.flow/todos/` (or `.planning/todos/pending/`)
2. Show pending todos grouped by area/priority
3. For each todo, show: title, area, priority, date
4. Offer interactive selection: "Which todo would you like to work on?"
5. Selected todo routes to: `/flow:quick`, `/flow:plan`, or `/flow:brainstorm` based on scope

### --health flag
1. Validate directory structure integrity
2. Check for orphaned files (PLAN without SUMMARY)
3. Verify config.yaml schema validity
4. Check state.yaml consistency (position matches disk state)
5. Check for stale .continue-here.md files
6. Report issues with severity (error/warning/info)
7. If `--repair` also specified: auto-fix what's possible

### --progress flag (default)
Continue to Step 4.

## Step 4: Display Dashboard

Present a concise dashboard:

```
═══ Flow Status ═══

Project: {name}
Depth: {depth} | Started: {started}

Position: Phase {phase}/{phase_count} — {phase_name}
  Plan {plan}/{plan_count} | Status: {status}
  [{progress_bar}] {progress_pct}%

Last: {last_activity.action} ({relative_time})

Velocity: {avg_duration_min} min/plan | Trend: {recent_trend}
Quality: {last_composite}/100 | Trend: {quality_trend}

Blockers: {count or "None"}
Todos: {pending} pending | {ready} ready

{quality_warning if declining}
```

## Step 5: Check for Resume Context

If `.flow/.continue-here.md` exists:
1. Read it
2. Display: "Previous session left off at: {summary}"
3. Offer: "Resume from here? [Y/n]"
4. If yes: route to the appropriate next action

## Step 6: Intelligent Routing

Based on current state, recommend the next action:

**Route A: Plans exist, not executed**
"Ready to execute. Run `/flow:go {phase}` to start."

**Route B: All plans executed, not verified**
"Phase {phase} execution complete. Run `/flow:verify {phase}` to verify."

**Route C: Phase verified and passed**
"Phase {phase} complete! Next: `/flow:plan {next_phase}` or `/flow:complete` if all phases done."

**Route D: Phase verified with gaps**
"Gaps found in phase {phase}. Run `/flow:go {phase} --gaps-only` to fix."

**Route E: No plans for current phase**
"Phase {phase} needs planning. Run `/flow:plan {phase}` to create plans."

**Route F: All phases complete**
"All phases complete! Run `/flow:complete` to archive this milestone."

**Route G: Quick tasks only (no phases)**
"Quick task mode. Run `/flow:quick` for ad-hoc tasks."

Present the recommended action and ask if the user wants to proceed.

## Step 7: Quality Trend Warning

If quality scores show declining trend (2+ consecutive drops):
```
⚠ Quality declining: {scores}
  Suggestions:
  - Run /flow:ground --check (validate assumptions)
  - Increase depth for next phase
  - Run /flow:verify for thorough check
```

</process>
