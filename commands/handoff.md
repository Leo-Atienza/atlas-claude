# /handoff — Commit, push, and create session handoff

Execute every step automatically. Do not ask — just do it.

---

## Step 1 — Commit and push

1. Run `git status` in the current directory
2. If there are uncommitted changes:
   - Stage all relevant files (not .env, credentials, or secrets)
   - Write a conventional commit message summarizing the session's work
   - Push to the current branch
3. If no changes, skip to Step 2

## Step 2 — Create handoff document

Write a structured handoff document to `~/.claude/sessions/handoff-YYYY-MM-DD.md`:

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

## Step 3 — Update memory (if warranted)

If anything genuinely novel was learned this session (new pattern, mistake to avoid, user preference), save it to memory. Otherwise skip.

## Step 4 — Summary

Print:
```
Handoff complete.
Committed: [hash] — [message]
Pushed to: [branch]
Handoff doc: ~/.claude/sessions/handoff-YYYY-MM-DD.md
Pending: [count] items for next session
```

---

**Plain English triggers**: "handoff", "wrap up and push", "end of session",
"create handoff", "session done push it"
