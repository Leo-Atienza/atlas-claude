#!/bin/bash
# Progressive Learning — SessionStart Hook
# Checks for pending reflections, unresolved conflicts, and session handoffs.
# Output is shown to Claude at session start.

FLAG_FILE="$HOME/.claude/.pending-reflection"
CONFLICTS_FILE="$HOME/.claude/projects/<PROJECT_MEMORY_DIR>/memory/conflicts.md"
HANDOFF_FILE="$HOME/.claude/.last-session-handoff"

# Check for missed reflection from previous session
if [ -f "$FLAG_FILE" ]; then
  echo "PROGRESSIVE LEARNING: Previous session reflection was missed."
  cat "$FLAG_FILE"
  echo ""
  echo "Consider what was learned in the previous session and capture it now."
  echo "Run /reflect if you can recall the session context."
fi

# Check for unresolved conflicts (exclude HTML comments and template lines)
if [ -f "$CONFLICTS_FILE" ]; then
  CONFLICT_COUNT=$(grep -c "^## CONFLICT-[0-9]" "$CONFLICTS_FILE" 2>/dev/null || echo "0")
  if [ "$CONFLICT_COUNT" -gt 0 ]; then
    echo ""
    echo "PROGRESSIVE LEARNING: $CONFLICT_COUNT unresolved knowledge conflict(s) detected."
    echo "Ask the user: 'You have $CONFLICT_COUNT unresolved knowledge conflicts. Resolve now or later?'"
  fi
fi

# Display session handoff from previous session
if [ -f "$HANDOFF_FILE" ]; then
  echo ""
  echo "SESSION HANDOFF from previous session:"
  cat "$HANDOFF_FILE"
  echo ""
  echo "Use /resume to continue where you left off."
fi
