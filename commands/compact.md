---
name: compact
description: "Prepare session state for context compaction — capture learnings, save state, then compact"
---

Prepare this session for context compaction. Execute all steps automatically, then compact.

## Step 1 — Capture current todos

Read the current todo list state. Write a brief summary to:
`~/.claude/cache/precompact-todos-{YYYY-MM-DD}.md`

Format:
```
## Todos Snapshot — {YYYY-MM-DD HH:mm}

### In Progress
- [todo content]

### Pending
- [todo content]

### Completed
- [todo content]
```

If no todos exist, skip this step silently.

## Step 2 — Save flow state

Check for `.flow/state.yaml` in the current working directory.
- If found: read it and note the current phase, status, and any velocity data
- If not found: skip silently

## Step 3 — Write compact summary

Write a 5-10 line summary to:
`~/.claude/cache/compact-summary-{YYYY-MM-DD-HHmm}.md`

Include:
- What was being worked on (task/feature description)
- Key decisions made this session
- Files modified (from recent tool use context)
- Current branch and git status
- Immediate next action after compaction

## Step 4 — Lightweight session capture

Check if today's session file already exists in `~/.claude/projects/*/memory/sessions/`.
- If YES: skip — reflection already captured this session
- If NO: write a minimal session note to the appropriate project memory sessions directory as `{YYYY-MM-DD}-pre-compact.md`

Keep it brief — 1-3 bullet points of what was learned or accomplished. This is NOT a full /reflect. No IDs, no INDEX.md updates, no conflict detection.

## Step 5 — Report and compact

Print a brief report:

```
Compact preparation complete.

Saved:
  Todos:    ~/.claude/cache/precompact-todos-{date}.md
  Summary:  ~/.claude/cache/compact-summary-{datetime}.md
  Flow:     [saved / not active]
  Learning: [captured / already reflected]

Compacting now...
```

Then run `/compact` to trigger Claude Code's native context compaction. The existing PreCompact hooks (precompact-reflect.sh, precompact-flow-validate.sh) and PostCompact hook (post-compact-dream-check.sh) will fire automatically during compaction.
