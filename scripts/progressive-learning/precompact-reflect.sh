#!/bin/bash
# Progressive Learning — PreCompact Hook
# Fires before context compaction. Injects additionalContext to prompt reflection.

MEMORY_DIR="$HOME/.claude/projects/C--Users-leooa--claude/memory"

if [ -d "$MEMORY_DIR/sessions" ]; then
  echo '{"additionalContext":"Context compaction approaching. If this session produced novel patterns, solutions, or mistakes worth remembering, consider running /reflect after completing your current task."}'
fi
