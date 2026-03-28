#!/bin/bash
# Progressive Learning — PreCompact Hook
# Fires before context compaction. Tells Claude to reflect NOW before context is lost.
# This output is shown to Claude as context.

MEMORY_DIR="$HOME/.claude/projects/C--Users-leooa--claude/memory"

# Check if there's meaningful content (sessions dir exists and has content)
if [ -d "$MEMORY_DIR/sessions" ]; then
  echo "CONTEXT COMPACTION IMMINENT — Progressive Learning Protocol"
  echo "Run /reflect NOW to capture session learnings before context is lost."
  echo "This is mandatory. Even trivial learnings matter."
fi
