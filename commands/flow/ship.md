---
name: flow:ship
description: "Commit + push + PR. Optional feature video"
argument-hint: "[--pr|--commit-only] [--video]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Commit changes, push to remote, and optionally create a PR.

Replaces: /ship, compound:feature-video (partial)

**Flags:**
- `--pr` — Create PR after pushing (default if on a branch)
- `--commit-only` — Only commit, don't push or create PR
- `--video` — Record feature video and embed in PR description
</objective>

<process>

## Step 0: Pre-Ship Quality Gate (MANDATORY)

Before any git operations, run these checks. Do NOT skip.

1. **Security scan**: Run Trail of Bits `sharp-edges` patterns on changed files:
   - Check for hardcoded secrets, API keys, credentials
   - Check for SQL injection, XSS, command injection vectors
   - Check for insecure defaults (HTTP vs HTTPS, weak crypto)
   - If any HIGH severity finding → BLOCK and report to user
2. **Smoke test** (if in ~/.claude): Run `bash ~/.claude/scripts/smoke-test.sh` — all checks must pass
3. **Diff review**: Run `git diff` and scan for:
   - Accidentally committed `.env`, credential files, or large binaries
   - Debug/console.log statements left in production code
   - TODO/FIXME/HACK comments that should be resolved before shipping

If any gate fails, report the issue and ask the user whether to proceed or fix first.

## Step 1: Analyze Changes

1. Run `git status` to see untracked and modified files
2. Run `git diff --stat` for change summary
3. Read `.flow/state.yaml` for project context
4. Check recent SUMMARY.md files for context

## Step 2: Stage and Commit

1. Identify files to stage (exclude secrets, .env, credentials)
2. Draft commit message based on changes:
   - Use conventional commits if config.commits.conventional is true
   - Reference phase/plan if applicable
   - Keep concise (1-2 lines)
3. Present to user for approval
4. Create commit

## Step 3: Push (unless --commit-only)

1. Check current branch
2. Push with `-u` flag if needed
3. Handle push failures gracefully

## Step 4: Create PR (if --pr or on feature branch)

1. Draft PR title (short, <70 chars)
2. Draft PR body:
   ```markdown
   ## Summary
   {1-3 bullet points from commit messages}

   ## Changes
   {file change summary}

   ## Test Plan
   - [ ] {verification steps}

   ## Post-Deploy Monitoring
   {operational validation steps if applicable}

   Generated with [Claude Code](https://claude.com/claude-code)
   ```
3. If --video: record feature walkthrough
4. Create PR with `gh pr create`
5. Return PR URL

## Step 5: Update State

Update `.flow/state.yaml` with ship activity.
Offer: `/flow:compound` if non-trivial problem was solved.

</process>
