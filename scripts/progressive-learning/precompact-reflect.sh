#!/bin/bash
# Progressive Learning — PreCompact Hook
# Fires before context compaction. Injects additionalContext to prompt reflection.
# Wired to: atlas-kg (recent facts), atlas-extractor (classification hint)

CLAUDE_DIR="$HOME/.claude"

# Build additional context for compaction
EXTRA=""

# Atlas KG: snapshot state before compaction (recovery point)
KG_DIR="$CLAUDE_DIR/atlas-kg"
if [ -f "$KG_DIR/entities.json" ] && [ -f "$KG_DIR/triples.json" ]; then
  SNAP_DIR="$KG_DIR/snapshots"
  mkdir -p "$SNAP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d-%H%M%S)
  cp "$KG_DIR/entities.json" "$SNAP_DIR/entities-$STAMP.json" 2>/dev/null || true
  cp "$KG_DIR/triples.json" "$SNAP_DIR/triples-$STAMP.json" 2>/dev/null || true
  # Keep only last 5 snapshots (system files, not user work)
  ls -t "$SNAP_DIR"/entities-*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
  ls -t "$SNAP_DIR"/triples-*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
fi

# Atlas KG: inject recent knowledge graph facts so they survive compaction
KG_SUMMARY=$(node "$CLAUDE_DIR/hooks/atlas-kg.js" summary 2>/dev/null)
if [ -n "$KG_SUMMARY" ] && [ "$KG_SUMMARY" != "Knowledge graph empty." ]; then
  EXTRA="${KG_SUMMARY} | "
fi

# Reflection prompt
REFLECT_MSG="Context compaction approaching. Before compacting: (1) If this session produced novel patterns, solutions, or mistakes, run /reflect or save to Knowledge Store. (2) If you learned new facts about entities/projects, save to atlas-kg via: node ~/.claude/hooks/atlas-kg.js add <subject> <predicate> <object>"

FULL_MSG="${EXTRA}${REFLECT_MSG}"
# Output as properly escaped JSON via node
node -e "process.stdout.write(JSON.stringify({additionalContext: process.argv[1]}))" "$FULL_MSG"
