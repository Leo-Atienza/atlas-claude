#!/bin/bash
# Progressive Learning — PreCompact Hook
# Fires before context compaction. Injects additionalContext to prompt reflection.
# Wired to: atlas-kg (recent facts), atlas-extractor (classification hint)

CLAUDE_DIR="$HOME/.claude"

# Build additional context for compaction
EXTRA=""

# Atlas KG: inject recent knowledge graph facts so they survive compaction
KG_SUMMARY=$(node "$CLAUDE_DIR/hooks/atlas-kg.js" summary 2>/dev/null)
if [ -n "$KG_SUMMARY" ] && [ "$KG_SUMMARY" != "Knowledge graph empty." ]; then
  EXTRA="${KG_SUMMARY} | "
fi

# Reflection prompt
REFLECT_MSG="Context compaction approaching. Before compacting: (1) If this session produced novel patterns, solutions, or mistakes, run /reflect or save to Knowledge Store. (2) If you learned new facts about entities/projects, save to atlas-kg via: node ~/.claude/hooks/atlas-kg.js add <subject> <predicate> <object>"

FULL_MSG="${EXTRA}${REFLECT_MSG}"
# Escape for JSON
ESCAPED=$(echo "$FULL_MSG" | sed 's/"/\\"/g' | tr '\n' ' ')
echo "{\"additionalContext\":\"$ESCAPED\"}"
