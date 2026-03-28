# /done — End session

Wrap up this session completely. Execute every step automatically.

---

## Step 1 — Handle uncommitted changes

Run `git status` in the current directory.

- If there are uncommitted changes → ask: "Commit before wrapping up? [y/n]"
- If yes → run `/commit-commands:commit`
- If no → skip

## Step 2 — Capture mistakes (if any)

Check `~/.claude/logs/error-patterns.json` for patterns with count >= 3.
If recurring patterns exist: run `/learn` for the top one automatically before reflecting.
This ensures mistakes are codified into G-ERR topics while context is fresh.

## Step 3 — Reflect (mandatory, never skip)

Run `/reflect` — this captures everything from this session into the memory system:
- Patterns discovered
- Solutions built
- Mistakes made and bugs hit
- User preferences confirmed
- Failed approaches and why they failed

This is what makes future sessions smarter. Do not skip this even if the session felt trivial.

## Step 4 — Update project state (if in a Flow or GSD project)

Check for `.flow/state.yaml` first, then `.planning/STATE.md`.

- If `.flow/state.yaml` exists → update position, velocity, and phase status
- If `.planning/STATE.md` exists → ensure STATE.md reflects current progress accurately
- If a phase was completed → mark it done in the appropriate state file

## Step 4 — Session summary

Present a brief, clean summary:

```
Session complete.

Done: [what was accomplished]
Left for next time: [what's pending, if anything]
Key learnings captured: [1-2 bullet points of what was saved to memory]
```

## Step 5 — Handout continuation prompt (optional)

Ask the user:

> "Would you like a **handout continuation prompt** to kickstart the next session?"

If yes, generate a compact, copy-pasteable prompt block that covers:

1. **Project context** — repo name, stack, current milestone/phase
2. **What was done** — bullet list of completed work this session
3. **What's next** — pending tasks, blockers, next steps
4. **Key decisions** — technical choices made, trade-offs, rejected alternatives
5. **Important files/paths** — any files central to what was built or changed
6. **Resume instruction** — a single sentence the user can paste to wake Claude right up

Format:

```
--- HANDOUT: CONTINUE FROM [DATE] ---

Project: [name] | Stack: [tech] | Phase: [current phase if GSD]

Done this session:
- [bullet]
- [bullet]

Next up:
- [bullet]
- [bullet]

Key decisions:
- [bullet]

Files to know: [comma-separated key paths]

To resume: "Continue [project] work. [1-sentence context]. Start with [first task]."
--- END HANDOUT ---
```

Keep it tight — aim for under 20 lines. This is for pasting, not reading.

---

**Plain English triggers**: "done", "wrap up", "that's it for today",
"end session", "I'm done", "goodbye", "closing out", "that's all"
