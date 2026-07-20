# /done — End session

Wrap up this session completely. Execute every step automatically.

---

## Step 1 — Auto-handoff (commit, push, handoff doc)

Run `/handoff` automatically. This commits all pending changes, pushes, and creates a session handoff document. Do not ask — just execute it.

## Step 2 — Quick Reflect (automatic, never skip)

Capture what matters from this session. This is a simplified version — focus on mistakes and key learnings only.

### a. Check for mistakes (G-ERR)
Review the session for any mistakes made, wrong assumptions, bugs hit, or near-misses.
For each mistake found:
1. Read `~/.claude/topics/KNOWLEDGE-DIRECTORY.md` to get the current highest G-ERR ID
2. Write a new topic file to `~/.claude/topics/` with the next G-ERR ID
3. Add the entry to `KNOWLEDGE-DIRECTORY.md`
4. Add the entry to `KNOWLEDGE-PAGE-3-errors.md`

### b. Check for significant patterns or solutions
If a genuinely reusable pattern (G-PAT) or solution (G-SOL) was discovered:
1. Same process — read directory, get next ID, write topic file, update directory and page
Only capture what would genuinely help future sessions. Skip if nothing notable.

### c. Update project state
If `.flow/state.yaml` exists → update phase status.
If `.planning/STATE.md` exists → update progress.

## Step 3 — Conditional Dream (automatic, skip if recent)

Check `~/.claude/cache/dream-last-run`:
- If file doesn't exist OR timestamp is 7+ days old → run a lightweight dream:
  1. Scan `~/.claude/topics/KNOWLEDGE-DIRECTORY.md` for obvious issues (duplicate IDs, missing pages)
  2. Write current timestamp to `~/.claude/cache/dream-last-run`
- If dream ran within 7 days → skip entirely

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
