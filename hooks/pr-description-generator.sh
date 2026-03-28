#!/bin/bash
# PR Description Generator Hook
# Fires on PostToolUse for Bash when a git push is detected
# Generates a PR description template from commit history

# Only act on git push commands
if [[ "${TOOL_INPUT}" != *"git push"* ]]; then
  exit 0
fi

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [[ -z "$BRANCH" || "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  exit 0
fi

# Get base branch
BASE="main"
git show-ref --verify --quiet refs/heads/main 2>/dev/null || BASE="master"

# Get commits on this branch
COMMITS=$(git log "${BASE}..HEAD" --oneline 2>/dev/null)
if [[ -z "$COMMITS" ]]; then
  exit 0
fi

# Get changed files summary
FILES_CHANGED=$(git diff "${BASE}..HEAD" --stat 2>/dev/null | tail -1)

# Output suggestion
cat << EOF
---
PR Ready: Branch '${BRANCH}' pushed with changes.
Commits: $(echo "$COMMITS" | wc -l | tr -d ' ')
Files: ${FILES_CHANGED}
Tip: Use /ship to auto-generate PR with description from these commits.
---
EOF
