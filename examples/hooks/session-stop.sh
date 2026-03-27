#!/bin/bash
# Consolidated Stop hook
# Combines: session-stop-flag.sh + claudio
# The agent-type verification hook remains separate in settings.json.

# Derive memory directory dynamically (find first project with memory/)
MEMORY_DIR=""
for d in "$HOME/.claude/projects"/*/memory; do
  if [ -d "$d" ]; then
    MEMORY_DIR="$d"
    break
  fi
done
SESSIONS_DIR="${MEMORY_DIR:+$MEMORY_DIR/sessions}"
FLAG_FILE="$HOME/.claude/.pending-reflection"
HANDOFF_FILE="$HOME/.claude/.last-session-handoff"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M:%S)

# ─── 1. Reflection flag check ────────────────────────────────────────
REFLECTED=false
if [ -n "$SESSIONS_DIR" ] && [ -d "$SESSIONS_DIR" ]; then
  for f in "$SESSIONS_DIR"/${TODAY}*.md; do
    if [ -f "$f" ]; then
      REFLECTED=true
      break
    fi
  done
fi

if [ "$REFLECTED" = false ]; then
  echo "date: $TODAY" > "$FLAG_FILE"
  echo "time: $NOW" >> "$FLAG_FILE"
  echo "cwd: $(pwd)" >> "$FLAG_FILE"
  echo "note: Session ended without running /reflect" >> "$FLAG_FILE"
fi

# ─── 2. Session handoff ──────────────────────────────────────────────
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

# ─── 3. Capture todo state ────────────────────────────────────────────
TODOS_DIR="$HOME/.claude/todos"
if [ -d "$TODOS_DIR" ]; then
  IN_PROGRESS=$(find "$TODOS_DIR" -name "*.json" -exec grep -l '"in_progress"' {} \; 2>/dev/null | head -5)
  if [ -n "$IN_PROGRESS" ]; then
    echo "" >> "$HANDOFF_FILE"
    echo "pending_todos:" >> "$HANDOFF_FILE"
    for f in $IN_PROGRESS; do
      python3 -c "
import json, sys
try:
    with open('$f') as fh:
        todos = json.load(fh)
    for t in todos:
        if t.get('status') == 'in_progress':
            print('  - [IN PROGRESS] ' + t.get('content',''))
        elif t.get('status') == 'pending':
            print('  - [PENDING] ' + t.get('content',''))
except: pass
" 2>/dev/null >> "$HANDOFF_FILE"
    done
  fi
fi

# ─── 4. Claudio audio ────────────────────────────────────────────────
"$HOME/.claude/bin/claudio" 2>/dev/null || true

# ─── 5. Auto-continuation check ────────────────────────────────────
# If context-monitor.js wrote a handoff trigger, spawn a new session
SESSION_ID=$(ls -t /tmp/claude-ctx-*.json 2>/dev/null | head -1 | sed 's/.*claude-ctx-//' | sed 's/.json//')
if [ -n "$SESSION_ID" ]; then
  TRIGGER="/tmp/claude-handoff-${SESSION_ID}.trigger"
  if [ -f "$TRIGGER" ]; then
    bash "$HOME/.claude/scripts/auto-continue.sh" "$SESSION_ID" &
  fi
fi
