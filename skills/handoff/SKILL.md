# /handoff — End-of-session ritual with build verification

Execute every step automatically. Do not ask — just do it.

---

## Step 1 — Pre-flight verification

1. Detect the project's build and test commands:
   - Check `package.json` for `build` and `test` scripts
   - If no `package.json`, check for `Makefile`, `pyproject.toml`, or other build systems
2. Run the build command (e.g., `npm run build`). If it fails, **stop and report the errors**. Do not proceed to commit.
3. Run the test command (e.g., `npm test`). If tests fail, **stop and report failures**. Do not proceed to commit.
4. Record the test count and pass rate for the commit message.

If no build/test system exists, skip this step and note it in the summary.

## Step 2 — Commit and push

1. Run `git status` in the current directory
2. If there are uncommitted changes:
   - Stage all relevant files (exclude `.env`, credentials, secrets, `node_modules`)
   - Write a conventional commit message summarizing the session's work
   - Include test count and pass rate in the commit body (e.g., `Tests: 57/57 passing`)
   - Push to the current branch
3. If no changes, skip to Step 3

## Step 3 — Print handoff (copy-paste block)

Print the handoff directly in chat as a single fenced markdown code block so the user can copy it and paste it into the next session. **Do not write to disk.** The block must be self-contained — the next session will see only what's inside the fence.

Print exactly this format (fill in the sections from this session's work):

```markdown
# Session Handoff — [Date]

## Project
[project name] | [branch] | [stack summary]

## Changes Made
- [bullet list of what was done, with file paths]

## Files Modified
[list of key files changed]

## Commits
- [commit hashes and messages from this session]

## Pending Items
- [anything left unfinished or flagged for next session]

## Knowledge Extracted
- [any patterns, mistakes, or decisions worth remembering]

## Resume Prompt
> "Continue [project] work. [1-sentence context]. Start with [first task]."
```

Sizing: keep the block tight — aim for under ~80 lines. Prune sections that are empty (e.g. no commits this session → drop the Commits section entirely rather than leaving "- none"). The Resume Prompt is mandatory and should be the last section.

## Step 4 — Wiki update (conditional)

If the project has a `wiki/` directory, append a session entry to `wiki/session-log.md` with date, summary of changes, and pending items.

## Step 5 — Memory update (conditional)

If anything genuinely novel was learned this session (new pattern, mistake to avoid, user preference), save it to memory. Otherwise skip.

## Step 6 — Summary

After printing the handoff block, print a short status line (outside the fence) so the user can verify at a glance:

```
Handoff ready — copy the block above.
Build: [pass/fail]
Tests: [count] passing, [count] failing
Committed: [hash] — [message]
Pushed to: [branch]
Pending: [count] items for next session
```

---

**Plain English triggers**: "handoff", "wrap up and push", "end of session",
"create handoff", "session done push it", "done for the day"
