#!/bin/bash
# SessionStart hook — slim version (rebuild 2026-04-06)
# Sections: conflicts, handoff, version check, log rotation, health summary, debug cleanup, stale temp cleanup, weekly backup

HOME_DIR="$HOME"
CLAUDE_DIR="$HOME_DIR/.claude"
NOW=$(date +%s)

# ─── 1. Session context ─────────────────────────────────────────────
HANDOFF_FILE="$CLAUDE_DIR/.last-session-handoff"

if [ -f "$HANDOFF_FILE" ]; then
  echo "SESSION HANDOFF from previous session:"
  cat "$HANDOFF_FILE"
  echo "Use /resume to continue where you left off."
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
  for logfile in "$LOGS_DIR"/failures.jsonl "$LOGS_DIR"/hook-health.jsonl "$LOGS_DIR"/tool-failures.jsonl; do
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
if [ -f "$TH_FILE" ]; then
  unhealthy=$(node -e '
    try {
      const h = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
      if (h.tools) {
        const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const bad = Object.entries(h.tools)
          .map(([t, v]) => {
            const recent = (v.failures || []).filter(ts => ts > cutoff).length;
            return [t, recent];
          })
          .filter(([, recent]) => recent >= 3)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        if (bad.length) {
          const lines = bad.map(([t, n]) => "  " + t + ": " + n + " failures (last 48h)");
          console.log("Unhealthy tools:\n" + lines.join("\n"));
        }
      }
    } catch(e) {}
  ' "$TH_FILE" 2>/dev/null)
  [ -n "$unhealthy" ] && health_messages="${health_messages}${unhealthy}\n"
fi

if [ -n "$health_messages" ]; then
  echo "HEALTH SUMMARY:"
  echo -e "$health_messages"
fi

# ─── 6. Atlas Knowledge Graph — inject recent facts ────────────────
KG_SUMMARY=$(node "$CLAUDE_DIR/hooks/atlas-kg.js" summary 2>/dev/null)
if [ -n "$KG_SUMMARY" ] && [ "$KG_SUMMARY" != "Knowledge graph empty." ]; then
  echo "$KG_SUMMARY"
fi

# ─── 7a. TRASH cleanup (files older than 7 days) ──────────────────
TRASH_DIR="$CLAUDE_DIR/TRASH"
if [ -d "$TRASH_DIR" ]; then
  find "$TRASH_DIR" -mindepth 1 -mtime +7 -delete 2>/dev/null || true
fi

# ─── 7c. Debug directory cleanup (files older than 14 days) ─────────
DEBUG_DIR="$CLAUDE_DIR/debug"
if [ -d "$DEBUG_DIR" ]; then
  find "$DEBUG_DIR" -maxdepth 1 -name "*.txt" -mtime +14 -delete 2>/dev/null || true
fi

# ─── 7d. Shell-snapshots cleanup (files older than 30 days) ─────────
SNAP_DIR="$CLAUDE_DIR/shell-snapshots"
if [ -d "$SNAP_DIR" ]; then
  find "$SNAP_DIR" -maxdepth 1 -name "snapshot-*.sh" -mtime +30 -delete 2>/dev/null || true
fi

# ─── 7e. Stale todos cleanup (files older than 3 days) ─────────────
TODOS_DIR="$CLAUDE_DIR/todos"
if [ -d "$TODOS_DIR" ]; then
  find "$TODOS_DIR" -maxdepth 1 -name "*.json" -mtime +3 -delete 2>/dev/null || true
fi

# ─── 7f. Plans rotation (keep last 15 by mtime, delete rest) ───────
PLANS_DIR="$CLAUDE_DIR/plans"
if [ -d "$PLANS_DIR" ]; then
  PLAN_COUNT=$(find "$PLANS_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)
  if [ "$PLAN_COUNT" -gt 15 ]; then
    ls -t "$PLANS_DIR"/*.md 2>/dev/null | tail -n +16 | while read -r f; do rm -f "$f" 2>/dev/null; done
  fi
fi

# ─── 7g. Session-env rotation (dirs older than 7 days) ─────────────
SESSION_ENV_DIR="$CLAUDE_DIR/session-env"
if [ -d "$SESSION_ENV_DIR" ]; then
  find "$SESSION_ENV_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
fi

# ─── 7h. Cache efficiency rotation (keep last 10) ──────────────────
CACHE_DIR="$CLAUDE_DIR/cache"
if [ -d "$CACHE_DIR" ]; then
  EFF_COUNT=$(ls -1 "$CACHE_DIR"/efficiency-*.json 2>/dev/null | wc -l)
  if [ "$EFF_COUNT" -gt 10 ]; then
    ls -t "$CACHE_DIR"/efficiency-*.json 2>/dev/null | tail -n +11 | while read -r f; do rm -f "$f" 2>/dev/null; done
  fi
fi

# ─── 8. Stale temp file cleanup ─────────────────────────────────────
find /tmp -maxdepth 1 -name "claude-ctx-*.json" -mmin +1440 -delete 2>/dev/null || true
find /tmp -maxdepth 1 -name "claude-fail-streak-*.json" -mmin +1440 -delete 2>/dev/null || true
find /tmp -maxdepth 1 -name "claude-handoff-*.trigger" -mmin +1440 -delete 2>/dev/null || true

# Scratchpad cleanup (files older than 14 days)
SCRATCHPAD="/c/tmp/claude-scratchpad"
if [ -d "$SCRATCHPAD" ]; then
  find "$SCRATCHPAD" -maxdepth 1 -type f -mtime +14 -delete 2>/dev/null || true
  find "$SCRATCHPAD" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \; 2>/dev/null || true
fi

# ─── 9. Critical file backup (weekly) ───────────────────────────────
BACKUP_DIR="$CLAUDE_DIR/backups"
BACKUP_STATE="$CLAUDE_DIR/cache/backup-last-run"
LAST_BACKUP=$(cat "$BACKUP_STATE" 2>/dev/null || echo "0")
if [ $(( NOW - LAST_BACKUP )) -ge 604800 ]; then
  mkdir -p "$BACKUP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d)
  cp -f "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/CLAUDE-${STAMP}.md" 2>/dev/null || true
  cp -f "$CLAUDE_DIR/skills/ACTIVE-DIRECTORY.md" "$BACKUP_DIR/ACTIVE-DIRECTORY-${STAMP}.md" 2>/dev/null || true
  MEMORY_SRC="$CLAUDE_DIR/projects/C--Users-leooa--claude/memory"
  if [ -d "$MEMORY_SRC" ] && command -v tar >/dev/null 2>&1; then
    tar czf "$BACKUP_DIR/memory-${STAMP}.tar.gz" -C "$(dirname "$MEMORY_SRC")" "$(basename "$MEMORY_SRC")" 2>/dev/null || true
  fi
  find "$BACKUP_DIR" -name "CLAUDE-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "ACTIVE-DIRECTORY-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "memory-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
  # Keep only the 2 most recent .claude.json backups
  ls -t "$BACKUP_DIR"/.claude.json.backup.* 2>/dev/null | tail -n +3 | while read -r f; do [ -f "$f" ] && find "$f" -delete 2>/dev/null; done || true
  echo "$NOW" > "$BACKUP_STATE"
fi
