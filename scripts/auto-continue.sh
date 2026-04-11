#!/bin/bash
# Auto-Continuation Relay — spawns new claude session from handoff file
# Called by session-stop.sh when context-monitor.js detects 70% usage
#
# Flow: context-monitor.js writes trigger → agent writes handoff → session exits →
#       session-stop.sh calls this → this spawns new claude session → resumes work

set -euo pipefail

SESSION_ID="${1:-}"
if [ -z "$SESSION_ID" ]; then
  echo "ERROR: No session ID provided" >&2
  exit 1
fi

TRIGGER_FILE="/tmp/claude-handoff-${SESSION_ID}.trigger"

# Only continue if trigger exists
if [ ! -f "$TRIGGER_FILE" ]; then
  exit 0
fi

# Read trigger data (line 1: handoff path, line 2: cwd, line 3: chain depth)
HANDOFF_PATH=$(sed -n '1p' "$TRIGGER_FILE")
CWD=$(sed -n '2p' "$TRIGGER_FILE")
CHAIN_DEPTH=$(sed -n '3p' "$TRIGGER_FILE" 2>/dev/null || echo "0")

# Clean up trigger BEFORE spawning (prevents infinite loops)
rm -f "$TRIGGER_FILE"

# Chain depth safety: max 2 continuations
if [ "${CHAIN_DEPTH:-0}" -ge 2 ]; then
  echo "WARNING: Auto-continuation chain depth limit reached (${CHAIN_DEPTH}). Stopping." >&2
  echo "chain_depth_exceeded: true" >> "$HANDOFF_PATH" 2>/dev/null || true
  exit 0
fi

# Verify handoff file exists
if [ ! -f "$HANDOFF_PATH" ]; then
  echo "WARNING: Handoff file not found at $HANDOFF_PATH" >&2
  # Fallback to last-session-handoff
  HANDOFF_PATH="$HOME/.claude/.last-session-handoff"
  if [ ! -f "$HANDOFF_PATH" ]; then
    echo "ERROR: No handoff file available. Cannot continue." >&2
    exit 1
  fi
fi

# Verify CWD exists
if [ ! -d "$CWD" ]; then
  CWD="$HOME"
fi

# Build the continuation prompt
NEXT_DEPTH=$((CHAIN_DEPTH + 1))
PROMPT="AUTO-CONTINUATION SESSION (chain depth: ${NEXT_DEPTH}/2)

You are continuing a previous session that reached 70% context usage. The previous session wrote a structured handoff file with all the context you need.

INSTRUCTIONS:
1. Read the handoff file at: ${HANDOFF_PATH}
2. Read any referenced plan files, .flow/ state files, or todo state
3. Verify the git branch and working directory match expectations
4. Resume from the 'immediate_next_action' field — do NOT start over
5. You are in chain position ${NEXT_DEPTH}. If you also hit 70% context, the auto-continuation system will spawn another session (up to depth 2)

IMPORTANT:
- Do NOT ask the user what to do. Resume autonomously.
- Do NOT re-read files you've already seen unless the handoff says they changed.
- Focus on completing the original task, not on the continuation mechanism.
- If the handoff file references a todo list, restore it with TodoWrite.

Handoff file: ${HANDOFF_PATH}
Chain depth: ${NEXT_DEPTH}/2"

# Log the continuation
echo "[$(date -Iseconds)] Auto-continuation: session=$SESSION_ID chain=$NEXT_DEPTH handoff=$HANDOFF_PATH" \
  >> "$HOME/.claude/logs/auto-continue.log" 2>/dev/null || true

# Spawn new session — platform-aware
# Strategy: try --resume first (preserves session history), fall back to -p
cd "$CWD"

# Extract session ID from the bridge file for --resume
RESUME_SESSION=""
BRIDGE_FILE="/tmp/claude-ctx-${SESSION_ID}.json"
if [ -f "$BRIDGE_FILE" ]; then
  RESUME_SESSION=$(node -e "
    try { const d=JSON.parse(require('fs').readFileSync('$BRIDGE_FILE','utf8')); process.stdout.write(d.session_id||''); } catch(e) {}
  " 2>/dev/null || echo "")
fi

if [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" || "${OS:-}" == "Windows_NT" ]]; then
  # Windows (Git Bash / MSYS2 / Cygwin): write prompt to temp file to avoid
  # cmd.exe special character issues (%, ^, !, &, |, <, > in commit messages/paths)
  PROMPT_FILE="/tmp/claude-continue-prompt-${SESSION_ID}.txt"
  printf '%s' "$PROMPT" > "$PROMPT_FILE"
  if [ -n "$RESUME_SESSION" ]; then
    nohup bash -c "claude --resume '$RESUME_SESSION' -p \"\$(cat '$PROMPT_FILE')\" ; rm -f '$PROMPT_FILE'" \
      > "/tmp/claude-continue-${SESSION_ID}.log" 2>&1 &
  else
    nohup bash -c "claude -p \"\$(cat '$PROMPT_FILE')\" ; rm -f '$PROMPT_FILE'" \
      > "/tmp/claude-continue-${SESSION_ID}.log" 2>&1 &
  fi
else
  # Unix: use nohup for proper detachment
  if [ -n "$RESUME_SESSION" ]; then
    nohup claude --resume "$RESUME_SESSION" -p "$PROMPT" > "/tmp/claude-continue-${SESSION_ID}.log" 2>&1 &
  else
    nohup claude -p "$PROMPT" > "/tmp/claude-continue-${SESSION_ID}.log" 2>&1 &
  fi
fi

echo "Auto-continuation spawned (PID: $!, chain: ${NEXT_DEPTH}, resume: ${RESUME_SESSION:-none})"
