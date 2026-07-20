#!/bin/bash
# SessionStart hook — slim version (rebuild 2026-04-06)
# Sections: conflicts, handoff, version check, log rotation, health summary, debug cleanup, stale temp cleanup, weekly backup

HOME_DIR="$HOME"
CLAUDE_DIR="$HOME_DIR/.claude"
NOW=$(date +%s)

# ─── 1. Session context (per-CWD handoff — no cross-project pollution) ─
# Slug the CWD the same way session-stop.sh does so this session only sees
# the handoff from the previous session *in this folder*.
cwd_slug() {
  printf '%s' "$1" | sed -e 's|[/\\:]|_|g' -e 's|__*|_|g' -e 's|^_||' -e 's|_$||'
}
HANDOFFS_DIR="$CLAUDE_DIR/handoffs"
CWD_SLUG=$(cwd_slug "$(pwd)")
HANDOFF_FILE="$HANDOFFS_DIR/${CWD_SLUG}.md"

if [ -f "$HANDOFF_FILE" ]; then
  echo "SESSION HANDOFF from previous session in this folder:"
  cat "$HANDOFF_FILE"
  echo "Use /resume to continue where you left off."
fi

# Prune stale per-CWD handoffs (14 days) so abandoned projects don't leak
if [ -d "$HANDOFFS_DIR" ]; then
  find "$HANDOFFS_DIR" -maxdepth 1 -name '*.md' -mtime +14 -delete 2>/dev/null || true
fi

# One-time migration: retire the old global file so nothing stale remains
STALE_GLOBAL="$CLAUDE_DIR/.last-session-handoff"
if [ -f "$STALE_GLOBAL" ]; then
  mkdir -p "$CLAUDE_DIR/TRASH" 2>/dev/null || true
  mv "$STALE_GLOBAL" "$CLAUDE_DIR/TRASH/.last-session-handoff.$(date +%s)" 2>/dev/null || true
fi

# ─── 2. Claude Code version check ───────────────────────────────────
VERSION_FILE="$CLAUDE_DIR/.claude-code-version"
CURRENT_VER=$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -n "$CURRENT_VER" ]; then
  STORED_VER=$(cat "$VERSION_FILE" 2>/dev/null)
  if [ -n "$STORED_VER" ] && [ "$CURRENT_VER" != "$STORED_VER" ]; then
    echo "CLAUDE CODE UPDATED: v$STORED_VER -> v$CURRENT_VER"
  fi
  echo "$CURRENT_VER" > "$VERSION_FILE"
fi

# ─── 3. Log rotation (line-count cap: keep last 500 lines) ──────────
LOGS_DIR="$CLAUDE_DIR/logs"
if [ -d "$LOGS_DIR" ]; then
  for logfile in "$LOGS_DIR"/failures.jsonl "$LOGS_DIR"/hook-health.jsonl "$LOGS_DIR"/tool-failures.jsonl "$LOGS_DIR"/skill-usage.jsonl "$LOGS_DIR"/cleanup.jsonl; do
    if [ -f "$logfile" ]; then
      LINES=$(wc -l < "$logfile" 2>/dev/null || echo 0)
      if [ "$LINES" -gt 500 ]; then
        tail -500 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
      fi
    fi
  done
fi

# ─── 4. Error pattern TTL (remove entries older than 7 days) ────────
EP_FILE="$LOGS_DIR/error-patterns.json"
if [ -f "$EP_FILE" ]; then
  node -e '
    const fs = require("fs");
    try {
      const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let changed = false;
      for (const [k, v] of Object.entries(p)) {
        const lastSeen = new Date(v.last_seen || v.first_seen || 0).getTime();
        if (lastSeen < cutoff) { delete p[k]; changed = true; }
      }
      const entries = Object.entries(p);
      if (entries.length > 100) {
        entries.sort(([,a],[,b]) => new Date(b.last_seen||0) - new Date(a.last_seen||0));
        const kept = Object.fromEntries(entries.slice(0, 100));
        fs.writeFileSync(process.argv[1], JSON.stringify(kept));
      } else if (changed) {
        fs.writeFileSync(process.argv[1], JSON.stringify(p));
      }
    } catch(e) {}
  ' "$EP_FILE" 2>/dev/null
fi

# ─── 5. Health summary (surfaces recurring errors + unhealthy tools)
health_messages=""

if [ -f "$EP_FILE" ]; then
  recurring=$(node -e '
    try {
      const p = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
      const hot = Object.values(p).filter(e => e.count >= 5).sort((a,b) => b.count - a.count).slice(0,3);
      if (hot.length) {
        const lines = hot.map(e => "  " + e.tool + " (" + e.count + "x): " + (e.sample||"").slice(0,60));
        console.log("Recurring errors:\n" + lines.join("\n"));
      }
    } catch(e) {}
  ' "$EP_FILE" 2>/dev/null)
  [ -n "$recurring" ] && health_messages="${health_messages}${recurring}\n"
fi

TH_FILE="$LOGS_DIR/tool-health.json"
SUPPRESS_FILE="$LOGS_DIR/health-suppress.json"
if [ -f "$TH_FILE" ]; then
  unhealthy=$(node -e '
    const fs = require("fs");
    try {
      const h = JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const suppressPath = process.argv[2];
      let suppress = {};
      try { suppress = JSON.parse(fs.readFileSync(suppressPath,"utf8")); } catch(_) {}

      if (h.tools) {
        const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const bad = Object.entries(h.tools)
          .map(([t, v]) => {
            const recent = (v.failures || []).filter(ts => ts > cutoff).length;
            const isMcp = v.is_mcp || /^mcp__/.test(t);
            return [t, recent, isMcp];
          })
          .filter(([, recent]) => recent >= 3)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8);

        // Track consecutive sessions each tool is unhealthy
        const newSuppress = {};
        let suppressed = 0;
        const nativeShow = [];
        const mcpShow = [];
        for (const [t, n, isMcp] of bad) {
          const prev = suppress[t] || 0;
          const streak = prev + 1;
          newSuppress[t] = streak;
          if (streak >= 5) {
            suppressed++;
          } else if (isMcp) {
            const server = t.split("__")[1] || "unknown";
            mcpShow.push("  " + t + ": " + n + " failures (last 48h) [server: " + server + "]");
          } else {
            nativeShow.push("  " + t + ": " + n + " failures (last 48h)");
          }
        }
        fs.writeFileSync(suppressPath, JSON.stringify(newSuppress));

        const lines = [];
        if (nativeShow.length) lines.push("Unhealthy tools:\n" + nativeShow.join("\n"));
        if (mcpShow.length) lines.push("Unhealthy MCP tools (consider disabling in .mcp.json if not needed):\n" + mcpShow.join("\n"));
        if (suppressed > 0) lines.push("  (" + suppressed + " known chronic issue(s) suppressed)");
        if (lines.length) console.log(lines.join("\n"));
      }
    } catch(e) {}
  ' "$TH_FILE" "$SUPPRESS_FILE" 2>/dev/null)
  [ -n "$unhealthy" ] && health_messages="${health_messages}${unhealthy}\n"
fi

if [ -n "$health_messages" ]; then
  echo "HEALTH SUMMARY:"
  echo -e "$health_messages"
fi

# ─── 6. Project wiki context ───────────────────────────────────────
CWD=$(pwd)
if [ -f "$CWD/wiki/index.md" ]; then
  WIKI_PAGES=$(grep -c '|.*\.md.*|' "$CWD/wiki/index.md" 2>/dev/null || echo 0)
  DECISION_COUNT=$(find "$CWD/wiki/decisions" -name "*.md" 2>/dev/null | wc -l)
  echo "PROJECT_WIKI:"
  echo "  pages: $WIKI_PAGES, decisions: $DECISION_COUNT"
  echo "  Read wiki/index.md for past decisions and context."
fi

# ─── 7. Atlas Knowledge Graph — inject recent facts ────────────────
KG_SUMMARY=$(node "$CLAUDE_DIR/hooks/atlas-kg.js" summary 2>/dev/null)
if [ -n "$KG_SUMMARY" ] && [ "$KG_SUMMARY" != "Knowledge graph empty." ]; then
  echo "$KG_SUMMARY"
fi

# ─── 7a. Unified cleanup engine (v7.0) ──────────────────────────────
# Declarative cleanup rules live in hooks/cleanup-config.json. Each rule is
# driven by hooks/cleanup-runner.js, which writes one JSONL record per rule
# to logs/cleanup.jsonl and prints any user-visible nag messages to stdout.
# Replaces the v6.x §7a–§7h + §7j–§7k bespoke blocks. §7i stays inline below
# because it emits carryover text that must flow back to the session.
node "$CLAUDE_DIR/hooks/cleanup-runner.js" 2>/dev/null || true

# ─── 7i. Action-graph carryover + prune (Tier 3) ────────────────────
# Carries forward the previous session's top-5 hot items if the state file
# is < 48h old. Also prunes action-graph files > 7 days old.
# §7f/§7g/§7h are already taken by Plans / Session-env / Cache efficiency.
AG_DIR="$CLAUDE_DIR/atlas-action-graph"
if [ -d "$AG_DIR" ]; then
  # Prune stale session files (cheap — runs every SessionStart)
  node "$CLAUDE_DIR/hooks/atlas-action-graph.js" prune --days=7 >/dev/null 2>&1 || true

  # Snapshot prune (7-day retention, mv to trash instead of delete per "never rm" rule)
  SNAP_TRASH="/c/tmp/trash/atlas-action-graph-snapshots"
  if [ -d "$AG_DIR/snapshots" ]; then
    mkdir -p "$SNAP_TRASH" 2>/dev/null || true
    find "$AG_DIR/snapshots" -maxdepth 1 -name "*.json" -mtime +7 -exec mv {} "$SNAP_TRASH/" \; 2>/dev/null || true
    # Second pass: drop anything >30 days old from trash to keep disk bloat bounded.
    find "$SNAP_TRASH" -maxdepth 1 -name "*.json" -mtime +30 -delete 2>/dev/null || true
  fi

  # Pick the most recent state file whose recorded cwd matches THIS session's
  # cwd — anything else would be cross-project pollution (e.g. Anniversary
  # hot files leaking into a .claude session).
  PREV_SID=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" latest-for-cwd --cwd="$(pwd)" --hours=48 2>/dev/null)
  if [ -n "$PREV_SID" ]; then
    CARRYOVER=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" carryover "$PREV_SID" --n=5 2>/dev/null)
    if [ -n "$CARRYOVER" ] && [ "$CARRYOVER" != "No carryover (action graph empty)." ]; then
      echo "$CARRYOVER"
    fi
  fi
fi

# ─── 7j/§7k migrated to cleanup-runner.js (see §7a) ─────────────────
# Transcript rotation and plugin skill-pack nag are now declarative rules
# (transcripts-rotation + plugin-skill-pack-nag) in hooks/cleanup-config.json.

# ─── 8. Stale temp file cleanup ─────────────────────────────────────
# Use Node's tmpdir (matches where hooks actually write — may differ from /tmp on Windows)
NODE_TMPDIR=$(node -e "process.stdout.write(require('os').tmpdir())" 2>/dev/null || echo "/tmp")
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-ctx-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-fail-streak-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-handoff-*.trigger" -mmin +1440 -delete 2>/dev/null || true

# Python-written allow-git flag files (allow_git_hook.py uses tempfile.gettempdir() + "/claude")
# On Windows this resolves to C:/tmp/claude; on POSIX to /tmp/claude. Both covered.
PY_TMPDIR=$(python3 -c "import tempfile,os;print(os.path.join(tempfile.gettempdir(),'claude'))" 2>/dev/null \
          || python -c "import tempfile,os;print(os.path.join(tempfile.gettempdir(),'claude'))" 2>/dev/null \
          || echo "/tmp/claude")
for d in "$PY_TMPDIR" "/tmp/claude" "/c/tmp/claude"; do
  [ -d "$d" ] || continue
  find "$d" -maxdepth 1 -name "allow-git-*" -mmin +1440 -delete 2>/dev/null || true
done

# Scratchpad cleanup (files older than 14 days)
SCRATCHPAD="/c/tmp/claude-scratchpad"
if [ -d "$SCRATCHPAD" ]; then
  find "$SCRATCHPAD" -maxdepth 1 -type f -mtime +14 -delete 2>/dev/null || true
  find "$SCRATCHPAD" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \; 2>/dev/null || true
fi

# ─── 8a. Auto drift-proposer (v7.0) ─────────────────────────────────
# Reads telemetry (tool-health, scheduled-tasks cache, cleanup.jsonl, skill-usage.jsonl)
# and prints AT MOST one `DRIFT: ...` advisory to stdout when any threshold crosses.
# Thresholds in hooks/drift-thresholds.json. Silent when the system is clean.
node "$CLAUDE_DIR/hooks/drift-proposer.js" 2>/dev/null || true

# ─── 9. Critical file backup (weekly) ───────────────────────────────
BACKUP_DIR="$CLAUDE_DIR/backups"
BACKUP_STATE="$CLAUDE_DIR/cache/backup-last-run"
LAST_BACKUP=$(cat "$BACKUP_STATE" 2>/dev/null || echo "0")
if [ $(( NOW - LAST_BACKUP )) -ge 604800 ]; then
  mkdir -p "$BACKUP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d)
  cp -f "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/CLAUDE-${STAMP}.md" 2>/dev/null || true
  cp -f "$CLAUDE_DIR/skills/ACTIVE-DIRECTORY.md" "$BACKUP_DIR/ACTIVE-DIRECTORY-${STAMP}.md" 2>/dev/null || true
  CWD_SLUG=$(printf '%s' "$CLAUDE_DIR" | sed -e 's|[/\\:]|-|g' -e 's|--*|-|g' -e 's|^-||' -e 's|-$||')
  MEMORY_SRC="$CLAUDE_DIR/projects/$CWD_SLUG/memory"
  if [ -d "$MEMORY_SRC" ] && command -v tar >/dev/null 2>&1; then
    tar czf "$BACKUP_DIR/memory-${STAMP}.tar.gz" -C "$(dirname "$MEMORY_SRC")" "$(basename "$MEMORY_SRC")" 2>/dev/null || true
  fi
  find "$BACKUP_DIR" -name "CLAUDE-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "ACTIVE-DIRECTORY-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "memory-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
  # Keep only the 2 most recent .claude.json backups
  ls -t "$BACKUP_DIR"/.claude.json.backup.* 2>/dev/null | tail -n +3 | while IFS= read -r f; do [ -f "$f" ] && rm -f "$f" 2>/dev/null; done || true
  echo "$NOW" > "$BACKUP_STATE"
fi
