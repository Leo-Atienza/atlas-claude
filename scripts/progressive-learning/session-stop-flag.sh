#!/bin/bash
# Progressive Learning — Stop Hook (Safety Net)
# Creates a reflection flag if reflection wasn't performed today.
# Also generates a structured session handoff for continuity.

MEMORY_DIR="$HOME/.claude/projects/<PROJECT_MEMORY_DIR>/memory"
SESSIONS_DIR="$MEMORY_DIR/sessions"
FLAG_FILE="$HOME/.claude/.pending-reflection"
HANDOFF_FILE="$HOME/.claude/.last-session-handoff"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M:%S)

# Check if a session file was written today (meaning reflection happened)
REFLECTED=false
if [ -d "$SESSIONS_DIR" ]; then
  for f in "$SESSIONS_DIR"/${TODAY}*.md; do
    if [ -f "$f" ]; then
      REFLECTED=true
      break
    fi
  done
fi

if [ "$REFLECTED" = false ]; then
  # Create flag for next session
  echo "date: $TODAY" > "$FLAG_FILE"
  echo "time: $NOW" >> "$FLAG_FILE"
  echo "cwd: $(pwd)" >> "$FLAG_FILE"
  echo "note: Session ended without running /reflect" >> "$FLAG_FILE"
fi

# Generate session handoff for continuity
{
  echo "date: $TODAY"
  echo "time: $NOW"
  echo "cwd: $(pwd)"
  echo ""

  # Capture GSD state if present
  if [ -f "$(pwd)/.planning/STATE.md" ]; then
    echo "gsd_state: active"
    head -5 "$(pwd)/.planning/STATE.md" 2>/dev/null
  else
    echo "gsd_state: none"
  fi

  echo ""

  # Capture recent git activity (last 3 commits if in a git repo)
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "recent_commits:"
    git log --oneline -3 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "branch: $(git branch --show-current 2>/dev/null)"
    # Check for uncommitted changes
    CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    echo "uncommitted_changes: $CHANGES"
  fi
} > "$HANDOFF_FILE" 2>/dev/null
