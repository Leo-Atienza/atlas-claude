# Git Rules
> @import into project CLAUDE.md for consistent git workflow.

- Branch naming: `feat/desc`, `fix/issue-123`, `refactor/module`, `chore/task`
- One branch per logical unit. No "misc-changes" branches.
- Conventional commits: `feat|fix|refactor|test|docs|chore|perf|ci: subject`
- Subject: imperative mood, <=72 chars, no trailing period, lowercase.
- Body: explain WHY, not WHAT. The diff shows what.
- One logical change per commit. Squash WIP before PR.
- ALWAYS run `git status` before every commit. (G-ERR pattern)
- PR description: what changed, why, how to test, screenshots if UI.
- Never force-push to main, staging, or production.
- Delete branch after merge.
