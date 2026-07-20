#!/bin/bash
# Progressive Learning — PreCompact Hook
# Fires before context compaction. Injects additionalContext to prompt reflection.
# Wired to: atlas-kg (recent facts), atlas-extractor (classification hint)

CLAUDE_DIR="$HOME/.claude"

# ─── Read session_id from stdin JSON ─────────────────────────────────
# Copied verbatim from session-stop.sh:14-32. Node primary + grep
# fallback keeps SESSION_ID populated even if node crashes or the
# payload is malformed.
SESSION_ID=""
STDIN_DATA=""
if ! [ -t 0 ]; then
  STDIN_DATA=$(cat)
  if [ -n "$STDIN_DATA" ]; then
    # Primary: node JSON parse (handles all valid JSON)
    SESSION_ID=$(printf '%s' "$STDIN_DATA" | node -e "
      const chunks = []; process.stdin.on('data', c => chunks.push(c));
      process.stdin.on('end', () => {
        try { process.stdout.write(JSON.parse(Buffer.concat(chunks).toString()).session_id || ''); }
        catch(e) { /* silent — fallback below */ }
      });
    " 2>/dev/null) || true
    # Fallback: grep extraction if node failed or returned empty
    if [ -z "$SESSION_ID" ]; then
      SESSION_ID=$(printf '%s' "$STDIN_DATA" | grep -oE '"session_id"\s*:\s*"[^"]*"' | head -1 | grep -oE '"[^"]*"$' | tr -d '"') || true
    fi
  fi
fi

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

# Atlas action graph: compute hot-set digest so the session's working set
# survives compaction. CLI prints "Action graph empty." when no items exist;
# suppress that marker so the context injection stays clean.
ACTION_GRAPH_DIGEST=""
if [ -n "$SESSION_ID" ] && [ -f "$CLAUDE_DIR/hooks/atlas-action-graph.js" ]; then
  ACTION_GRAPH_DIGEST=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" digest "$SESSION_ID" --budget=2000 2>/dev/null || true)
  if [ "$ACTION_GRAPH_DIGEST" = "Action graph empty." ]; then
    ACTION_GRAPH_DIGEST=""
  fi
  [ -n "$ACTION_GRAPH_DIGEST" ] && ACTION_GRAPH_DIGEST="${ACTION_GRAPH_DIGEST} | "
fi

# Atlas action graph: snapshot state before compaction (recovery point).
# Mirrors the KG snapshot pattern above — retains last 5 per session.
AG_DIR="$CLAUDE_DIR/atlas-action-graph"
if [ -d "$AG_DIR" ] && [ -n "$SESSION_ID" ] && [ -f "$AG_DIR/${SESSION_ID}.state.json" ]; then
  AG_SNAP_DIR="$AG_DIR/snapshots"
  mkdir -p "$AG_SNAP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d-%H%M%S)
  cp "$AG_DIR/${SESSION_ID}.state.json" "$AG_SNAP_DIR/${SESSION_ID}-${STAMP}.state.json" 2>/dev/null || true
  # Retention: keep only last 5 snapshots per session (matches KG policy).
  # rm -f is acceptable here — these are system-generated timestamp files,
  # not user work (same rationale as the KG snapshot cleanup above).
  ls -t "$AG_SNAP_DIR/${SESSION_ID}"-*.state.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
fi

# Reflection prompt
REFLECT_MSG="Context compaction approaching. Before compacting: (1) If this session produced novel patterns, solutions, or mistakes, run /reflect or save to Knowledge Store. (2) If you learned new facts about entities/projects, save to atlas-kg via: node ~/.claude/hooks/atlas-kg.js add <subject> <predicate> <object>"

# Order: digest first (most session-specific) → KG summary → reflection prompt
FULL_MSG="${ACTION_GRAPH_DIGEST}${EXTRA}${REFLECT_MSG}"
# Output as properly escaped JSON via node
node -e "process.stdout.write(JSON.stringify({additionalContext: process.argv[1]}))" "$FULL_MSG"
