#!/bin/bash
# Consolidated Stop hook
# Sections: session handoff (file + stdout), todo capture, auto-continuation

HANDOFF_FILE="$HOME/.claude/.last-session-handoff"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M:%S)

# ─── Read session_id from stdin JSON ─────────────────────────────────
SESSION_ID=""
if ! [ -t 0 ]; then
  STDIN_DATA=$(cat)
  SESSION_ID=$(echo "$STDIN_DATA" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try { console.log(JSON.parse(d).session_id || ''); } catch(e) { console.log(''); }
    });
  " 2>/dev/null)
fi

# ─── 1. Session handoff (write file + echo to terminal) ─────────────
{
  echo "date: $TODAY"
  echo "time: $NOW"
  echo "cwd: $(pwd)"
  echo ""

  if [ -f "$(pwd)/.flow/state.yaml" ]; then
    echo "workflow_state: active"
    head -5 "$(pwd)/.flow/state.yaml" 2>/dev/null
  else
    echo "workflow_state: none"
  fi

  echo ""

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "recent_commits:"
    git log --oneline -3 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "branch: $(git branch --show-current 2>/dev/null)"
    CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    echo "uncommitted_changes: $CHANGES"
  fi
} > "$HANDOFF_FILE" 2>/dev/null

# ─── 2. Capture todo state ───────────────────────────────────────────
TODOS_DIR="$HOME/.claude/todos"
if [ -d "$TODOS_DIR" ]; then
  IN_PROGRESS=$(find "$TODOS_DIR" -name "*.json" -exec grep -l '"in_progress"' {} \; 2>/dev/null | head -5)
  if [ -n "$IN_PROGRESS" ]; then
    echo "" >> "$HANDOFF_FILE"
    echo "pending_todos:" >> "$HANDOFF_FILE"
    for f in $IN_PROGRESS; do
      node -e "
const fs = require('fs');
try {
  const todos = JSON.parse(fs.readFileSync('$f', 'utf8'));
  for (const t of todos) {
    if (t.status === 'in_progress') console.log('  - [IN PROGRESS] ' + (t.content || ''));
    else if (t.status === 'pending') console.log('  - [PENDING] ' + (t.content || ''));
  }
} catch(e) {}
" 2>/dev/null >> "$HANDOFF_FILE"
    done
  fi
fi

# ─── 1b. Atlas Extractor — auto-extract memories from handoff ────────
EXTRACTOR="$HOME/.claude/hooks/atlas-extractor.js"
if [ -f "$EXTRACTOR" ] && [ -f "$HANDOFF_FILE" ]; then
  EXTRACTED=$(cat "$HANDOFF_FILE" | node "$EXTRACTOR" extract-stdin 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try {
        const items = JSON.parse(d).filter(m => m.confidence >= 0.5);
        if (items.length > 0) {
          console.log('ATLAS_EXTRACT: ' + items.length + ' candidate(s)');
          items.slice(0,3).forEach(m => console.log('  [' + m.atlas_tag + '] ' + m.preview.slice(0,80)));
        }
      } catch(e) {}
    });
  " 2>/dev/null)
  if [ -n "$EXTRACTED" ]; then
    echo "$EXTRACTED" >> "$HANDOFF_FILE"
  fi
fi

# Echo handoff to terminal so user sees it
echo ""
echo "── SESSION HANDOFF ──────────────────────────────"
cat "$HANDOFF_FILE" 2>/dev/null
echo "─────────────────────────────────────────────────"

# ─── 3. Auto-continuation check ─────────────────────────────────────
# Use session_id from stdin (parsed above) instead of filesystem guessing
if [ -n "$SESSION_ID" ]; then
  TRIGGER="/tmp/claude-handoff-${SESSION_ID}.trigger"
  if [ -f "$TRIGGER" ]; then
    bash "$HOME/.claude/scripts/auto-continue.sh" "$SESSION_ID" &
  fi
fi
