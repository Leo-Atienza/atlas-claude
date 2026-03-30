#!/bin/bash
# PostCompact hook — checks if dream consolidation is needed after context compaction
# Compaction = long productive session = likely new knowledge to consolidate
#
# Logic: If dream hasn't run in 3+ days OR memory files > 40, inject dream signal.
# Lower thresholds than session-start (7 days / 50 files) because compaction
# is a strong signal that significant work happened.

DREAM_STATE_FILE="$HOME/.claude/cache/dream-last-run"
MEMORY_DIR="$HOME/.claude/projects/<PROJECT_MEMORY_DIR>/memory"
NOW=$(date +%s)
INTERVAL_DAYS=3

NEED_DREAM=false
REASON=""

# Check time since last dream
if [ -f "$DREAM_STATE_FILE" ]; then
  LAST_DREAM=$(cat "$DREAM_STATE_FILE")
  ELAPSED=$(( (NOW - LAST_DREAM) / 86400 ))
  if [ "$ELAPSED" -ge "$INTERVAL_DAYS" ]; then
    NEED_DREAM=true
    REASON="Last dream was ${ELAPSED} days ago and context just compacted."
  fi
else
  NEED_DREAM=true
  REASON="No previous dream recorded and context just compacted."
fi

# Check memory file count (lower threshold post-compaction)
if [ "$NEED_DREAM" = false ] && [ -d "$MEMORY_DIR" ]; then
  MEM_COUNT=$(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
  if [ "$MEM_COUNT" -gt 40 ]; then
    NEED_DREAM=true
    REASON="Memory has ${MEM_COUNT} files and context just compacted."
  fi
fi

if [ "$NEED_DREAM" = true ]; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostCompact\",\"additionalContext\":\"AUTO-DREAM TRIGGERED: ${REASON} Run /dream NOW to consolidate memories before continuing work in this compacted context.\"}}"
fi
