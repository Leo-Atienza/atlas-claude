# /done — End session

Wrap up this session completely. Execute every step automatically.

If plan mode is active when /done is invoked, call ExitPlanMode immediately — the ritual itself is the plan — then execute.

---

## Step 0 — Scope check (current session vs bulk close-out)

If the request targets multiple/stale/previous sessions ("close out all my sessions", "end the old sessions", "clean up my sessions"), this is a **bulk close-out**, not a current-session ritual: list sessions via `mcp__ccd_session_mgmt__list_sessions`, identify stale/unclosed ones, archive each via `mcp__ccd_session_mgmt__archive_session`, and report the tally. No per-session confirmation, no investigation beyond the listing. Then continue with Steps 1–5 for the *current* session only if it is also ending.

## Step 1 — Auto-handoff (commit, push, handoff doc)

Run `/handoff` automatically. This commits all pending changes, pushes, and creates a session handoff document. Do not ask — just execute it.

## Step 2 — Quick Reflect (automatic, never skip)

Capture what matters from this session. This is a simplified version — focus on mistakes and key learnings only.

### a. Check for mistakes (G-ERR)
Review the session for any mistakes made, wrong assumptions, bugs hit, or near-misses.
For each mistake found:
1. Read `<your-vault-path>/wiki/engineering/errors.md` to find the current highest `KNOWLEDGE-NNN` id (IDs are unified across all 5 vault engineering files; check the global max with `grep -h "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/*.md | sort -V | tail -1`)
2. Append the new `## KNOWLEDGE-NNN: <title>` H2 entry to `<your-vault-path>/wiki/engineering/errors.md` (canonical id-allocation + entry format: `~/.claude/scripts/progressive-learning/KNOWLEDGE-WRITE.md`)

### b. Check for significant patterns or solutions
If a genuinely reusable pattern (G-PAT) or solution (G-SOL) was discovered:
1. Same process — find the next id, then append the H2 entry to `patterns.md` or `solutions.md` respectively
Only capture what would genuinely help future sessions. Skip if nothing notable.

### c. Update project state
If `.planning/STATE.md` exists → update progress.

## Step 3 — Conditional Dream (automatic, skip if recent)

Check `~/.claude/cache/dream-last-run`:
- If file doesn't exist OR timestamp is 7+ days old → run a lightweight dream:
  1. Scan `<your-vault-path>/wiki/engineering/_index.md` and the individual vault engineering files for obvious issues (duplicate IDs, missing entries, drift)
  2. Write current timestamp to `~/.claude/cache/dream-last-run`
- If dream ran within 7 days → skip entirely

> Note (v8.0.0): the standalone `/dream` skill has been archived in `skills/_archived/dream/`; this lightweight scan inside `/done` is the surviving usage.

## Step 4 — Session summary

Present a brief, clean summary:

```
Session complete.

Done: [what was accomplished]
Left for next time: [what's pending, if anything]
Learnings captured: [IDs if any, or "none"]
```

## Step 5 — Handout continuation prompt (optional)

Ask the user:

> "Would you like a **handout continuation prompt** to kickstart the next session?"

If yes, generate a compact, copy-pasteable prompt block:

```
--- HANDOUT: CONTINUE FROM [DATE] ---

Project: [name] | Stack: [tech]

Done this session:
- [bullet]

Next up:
- [bullet]

Key decisions:
- [bullet]

Files to know: [key paths]

To resume: "Continue [project] work. [1-sentence context]. Start with [first task]."
--- END HANDOUT ---
```

Keep it under 20 lines.

---

**Plain English triggers**: "done", "wrap up", "that's it for today",
"end session", "I'm done", "goodbye", "closing out", "that's all"
