# /resume — Continue existing work

Pick up exactly where you left off. Execute autonomously.

---

## Step 1 — Find the project

Check in this order:
1. `.planning/STATE.md` in the current working directory (legacy GSD)
2. `.planning/STATE.md` in any parent directory (legacy GSD)
3. The latest handoff for this cwd (`~/.claude/handoffs/`, or `wiki/session-log/handoffs/`)
4. If found → continue to Step 2
5. If not found → ask: "What project or directory should I resume from?"

(If the project contains a legacy `.flow/state.yaml`, the flow system is archived — the manifest will offer restoring `skills/_archived/flow/`; otherwise read the state file directly as plain YAML for context.)

## Step 2 — Restore context

From the state/handoff found above, determine:
- What phases are complete
- What's currently in progress
- What the next recommended action is
- Any blockers or pending todos

## Step 3 — Present status clearly

Show the user:
- **Done**: what's already completed
- **Next**: the specific next task or phase
- **Blocked**: anything that needs a decision

## Step 4 — Execute next action

Without waiting, begin the next recommended action.

- If plans exist but not executed → execute the next planned phase
- If a phase needs planning → plan it (EnterPlanMode for large scopes), then execute
- If executed but not verified → run the relevant verification (tests, /ship-verify)
- If all phases complete → close out (offer /done)
- If there are pending todos → offer to work on one

Apply all quality gates automatically (TDD, security scan, test run). Do not ask permission.

---

**Plain English triggers**: "continue", "resume", "pick up where we left off",
"what were we doing", "let's continue", "back to work"
