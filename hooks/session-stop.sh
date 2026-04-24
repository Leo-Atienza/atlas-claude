#!/bin/bash
# Consolidated Stop hook
# Sections: session handoff (file + stdout), todo capture, auto-continuation

# Per-CWD handoff file so two projects can't clobber each other's handoffs.
# Slug: replace /, \, : with _; collapse repeats; strip leading/trailing _.
#   /c/Users/leooa/.claude            -> c_Users_leooa_.claude
#   /c/Users/leooa/Documents/Foo      -> c_Users_leooa_Documents_Foo
cwd_slug() {
  printf '%s' "$1" | sed -e 's|[/\\:]|_|g' -e 's|__*|_|g' -e 's|^_||' -e 's|_$||'
}
HANDOFFS_DIR="$HOME/.claude/handoffs"
mkdir -p "$HANDOFFS_DIR" 2>/dev/null || true
CWD_SLUG=$(cwd_slug "$(pwd)")
HANDOFF_FILE="$HANDOFFS_DIR/${CWD_SLUG}.md"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M:%S)

# ─── Read session_id from stdin JSON ─────────────────────────────────
# Robust parsing: capture stdin once, extract session_id with fallback chain.
# Previous approach used echo|node subshell pipeline which silently produced
# empty SESSION_ID when node crashed or stdin was malformed — causing
# auto-continuation to silently skip at the worst possible time.
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

# ─── 0. Action-graph rollup (before handoff so failure can't block it) ──
# Appends one line to logs/action-graph-stats.jsonl per session. Fail-open.
if [ -n "$SESSION_ID" ]; then
  node "$HOME/.claude/hooks/atlas-action-graph.js" rollup "$SESSION_ID" >/dev/null 2>&1 || true
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
      node -e '
const fs = require("fs");
try {
  const todos = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  for (const t of todos) {
    if (t.status === "in_progress") console.log("  - [IN PROGRESS] " + (t.content || ""));
    else if (t.status === "pending") console.log("  - [PENDING] " + (t.content || ""));
  }
} catch(e) {}
' "$f" 2>/dev/null >> "$HANDOFF_FILE"
    done
  fi
fi

# ─── 1b. Atlas KG — capture session facts ──────────────────────────
# NOTE: Git-derivable data (branch, last_commit) is NOT stored in KG.
# Use `git log` / `git branch` for that — KG is for facts not in git.
KG_SCRIPT="$HOME/.claude/hooks/atlas-kg.js"
EXTRACTOR="$HOME/.claude/hooks/atlas-extractor.js"
if [ -f "$KG_SCRIPT" ] && [ -f "$HANDOFF_FILE" ]; then
  # Non-git sessions: capture working directory as context (not derivable from git)
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    CWD_NAME=$(basename "$(pwd)")
    if [ -n "$CWD_NAME" ]; then
      node "$KG_SCRIPT" add "user" "session_in" "$CWD_NAME" --from="$TODAY" 2>/dev/null
    fi
  fi

  # Run extractor on handoff content (two-step: extract then format)
  if [ -f "$EXTRACTOR" ]; then
    RAW_EXTRACT=$(cat "$HANDOFF_FILE" | node "$EXTRACTOR" extract-stdin 2>/dev/null)
    if [ -n "$RAW_EXTRACT" ]; then
      EXTRACTED=$(node -e '
        try {
          const items = JSON.parse(process.argv[1]).filter(m => m.confidence >= 0.5);
          if (items.length > 0) {
            console.log("ATLAS_EXTRACT: " + items.length + " candidate(s)");
            items.slice(0,3).forEach(m => console.log("  [" + m.atlas_tag + "] " + m.preview.slice(0,80)));
          }
        } catch(e) {
          process.stderr.write("atlas-extractor parse error: " + e.message + "\n");
        }
      ' "$RAW_EXTRACT" 2>>"$HOME/.claude/logs/hook-errors.log")
      if [ -n "$EXTRACTED" ]; then
        echo "$EXTRACTED" >> "$HANDOFF_FILE"
      fi
    fi
  fi
fi

# Echo handoff to terminal so user sees it
echo ""
echo "── SESSION HANDOFF ──────────────────────────────"
cat "$HANDOFF_FILE" 2>/dev/null
echo "─────────────────────────────────────────────────"

# ─── 3. Graphify auto-refresh (code-only, no LLM) ──────────────────
# Only if a graph already exists in CWD and code files changed since last build.
GRAPH_FILE="$(pwd)/graphify-out/graph.json"
if [ -f "$GRAPH_FILE" ]; then
  PYTHONUTF8=1 timeout 10 python3 -c "
import sys
from pathlib import Path

try:
    graph = Path('graphify-out/graph.json')
    graph_mtime = graph.stat().st_mtime

    CODE_EXTS = {
        '.py','.ts','.js','.tsx','.jsx','.go','.rs','.java','.cpp','.c',
        '.rb','.swift','.kt','.cs','.scala','.php','.h','.hpp','.cc','.cxx',
    }

    stale = False
    for f in Path('.').rglob('*'):
        if f.suffix.lower() in CODE_EXTS and 'node_modules' not in f.parts and '.git' not in f.parts:
            if f.stat().st_mtime > graph_mtime:
                stale = True
                break

    if not stale:
        sys.exit(0)

    from graphify.watch import _rebuild_code
    from graphify.detect import detect, save_manifest
    _rebuild_code(Path('.'))
    save_manifest(detect(Path('.'))['files'])
except Exception:
    sys.exit(0)
" 2>/dev/null || true
fi

# ─── 4. Auto-continuation check ─────────────────────────────────────
# Use session_id from stdin (parsed above) instead of filesystem guessing.
# Hooks (post-tool-monitor.js) write to Node's os.tmpdir(); on Windows that
# differs from /tmp. Resolve it the same way session-start.sh does.
if [ -n "$SESSION_ID" ]; then
  NODE_TMPDIR=$(node -e "process.stdout.write(require('os').tmpdir())" 2>/dev/null || echo "/tmp")
  TRIGGER="$NODE_TMPDIR/claude-handoff-${SESSION_ID}.trigger"
  if [ -f "$TRIGGER" ]; then
    bash "$HOME/.claude/scripts/auto-continue.sh" "$SESSION_ID" &
  fi
fi

# ─── 5. Plans retention (keep 5 most recent + <!-- keep --> markers) ───
# Archive older plan files to plans/archive/ on every session end. Fail-open.
# Plans whose first line contains `<!-- keep -->` are exempt from archival.
PLANS_DIR="$HOME/.claude/plans"
if [ -d "$PLANS_DIR" ]; then
  mkdir -p "$PLANS_DIR/archive" 2>/dev/null || true
  # Sort by mtime (newest first), skip top 5, archive the rest — unless kept.
  ls -t "$PLANS_DIR"/*.md 2>/dev/null | tail -n +6 | while read -r oldplan; do
    [ -f "$oldplan" ] || continue
    # Skip plans with <!-- keep --> marker on the first line.
    if head -1 "$oldplan" 2>/dev/null | grep -qF '<!-- keep -->'; then
      continue
    fi
    mv "$oldplan" "$PLANS_DIR/archive/" 2>/dev/null || true
  done
fi
