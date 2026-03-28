---
name: continue
description: "Resume work from a handoff file — manual version of auto-continuation"
argument-hint: "[handoff-file-path]"
---

Resume work from the most recent handoff file (or the specified one).

## Process

1. **Find the handoff file**:
   - If `$ARGUMENTS` is provided, use that path
   - Otherwise, find the most recent file matching `~/.claude/sessions/handoff-*.md`
   - Fallback: `~/.claude/.last-session-handoff`

2. **Read and parse** the handoff file completely

3. **Restore context**:
   - Switch to the correct working directory (`cwd` field)
   - Check git branch matches (`branch` field)
   - Read any referenced plan files (`.flow/` state if `plan_state` is set)
   - Restore todo list from `todo_state` field using TodoWrite

4. **Verify state**:
   - Run `git status` to check for uncommitted changes
   - Verify modified files still exist
   - Check test status if noted

5. **Resume from `immediate_next_action`** — do NOT start over, pick up exactly where the previous session left off

6. **Clean up**: After successfully reading, note the handoff was consumed (don't delete it — it's historical)

## Important
- Do NOT ask the user what to do unless the handoff file is ambiguous
- If the handoff references a `.flow/` plan, read the ROADMAP.md or PLAN.md
- If `chain_depth_exceeded: true` is in the handoff, warn the user that 5 continuations were reached
