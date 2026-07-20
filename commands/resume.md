# /resume — Continue existing work

Pick up exactly where you left off. Execute autonomously.

---

## Step 1 — Find the project

Check in this order:
1. `.flow/state.yaml` in the current working directory
2. `.flow/state.yaml` in any parent directory
3. `.planning/STATE.md` in the current working directory (legacy GSD)
4. `.planning/STATE.md` in any parent directory (legacy GSD)
5. If found → continue to Step 2
6. If not found → ask: "What project or directory should I resume from?"

## Step 2 — Restore context

Run `/flow:status` — this shows:
- What phases are complete
- What's currently in progress
- What the next recommended action is
- Any blockers or pending todos

Check for `.flow/.continue-here.md` — if exists, read for session handoff context.

## Step 3 — Present status clearly

Show the user:
- **Done**: what's already completed
- **Next**: the specific next task or phase
- **Blocked**: anything that needs a decision

## Step 4 — Execute next action

Without waiting, begin the next recommended action.

- If plans exist but not executed → `/flow:go {phase}`
- If a phase needs planning → `/flow:plan {phase}` then `/flow:go`
- If executed but not verified → `/flow:verify {phase}`
- If verified with gaps → `/flow:go {phase} --gaps-only`
- If all phases complete → `/flow:complete`
- If there are pending todos → offer to work on one

Apply all quality gates automatically (TDD, security scan, test run). Do not ask permission.

---

**Plain English triggers**: "continue", "resume", "pick up where we left off",
"what were we doing", "let's continue", "back to work"
