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

# ─── 7a. VERSION-MANIFEST staleness check (weekly, nag once per 7 days) ──
MANIFEST_FILE="$CLAUDE_DIR/skills/VERSION-MANIFEST.json"
VERSION_NAG_STATE="$CLAUDE_DIR/cache/version-nag-last"
if [ -f "$MANIFEST_FILE" ]; then
  LAST_NAG=$(cat "$VERSION_NAG_STATE" 2>/dev/null || echo "0")
  if [ $(( NOW - LAST_NAG )) -ge 604800 ]; then
    stale_count=$(node -e '
      try {
        const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
        const cutoff = Date.now() - 14 * 86400000;
        let stale = 0;
        for (const v of Object.values(m.cli_tools || {})) {
          if (new Date(v.last_checked || 0).getTime() < cutoff) stale++;
        }
        for (const v of Object.values(m.skill_packs || {})) {
          if (new Date(v.last_checked || 0).getTime() < cutoff) stale++;
        }
        if (stale > 0) console.log(stale);
      } catch(e) {}
    ' "$MANIFEST_FILE" 2>/dev/null)
    if [ -n "$stale_count" ] && [ "$stale_count" -gt 0 ]; then
      echo "VERSION CHECK: $stale_count tool(s)/skill pack(s) haven't been checked in 14+ days. Run: node ~/.claude/scripts/health-validator.js --check versions"
      echo "$NOW" > "$VERSION_NAG_STATE"
    fi
  fi
fi

# ─── 7a2. tool-health.json pruning (keep last 20 failure timestamps per tool)
if [ -f "$TH_FILE" ]; then
  node -e '
    const fs = require("fs");
    try {
      const h = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      if (h.tools) {
        for (const [k, v] of Object.entries(h.tools)) {
          if (Array.isArray(v.failures) && v.failures.length > 20) {
            v.failures = v.failures.slice(-20);
          }
        }
        fs.writeFileSync(process.argv[1], JSON.stringify(h));
      }
    } catch(e) {}
  ' "$TH_FILE" 2>/dev/null
fi

TRASH_DIR="$CLAUDE_DIR/TRASH"
if [ -d "$TRASH_DIR" ]; then
  find "$TRASH_DIR" -mindepth 1 -mtime +3 -delete 2>/dev/null || true
fi

# ─── 7a3. Session cache pruning (per-project: keep last 30, delete >14 days)
# NOTE: rm -rf is intentional here — these are system-generated UUID session dirs,
# not user files. Moving to TRASH would add bloat for zero recovery value.
PROJECTS_DIR="$CLAUDE_DIR/projects"
if [ -d "$PROJECTS_DIR" ]; then
  for proj in "$PROJECTS_DIR"/*/; do
    [ -d "$proj" ] || continue
    # Delete UUID session dirs older than 14 days
    find "$proj" -maxdepth 1 -type d -name '*-*-*-*-*' -mtime +14 -exec rm -rf {} \; 2>/dev/null || true
    # If still >30, keep only newest 30
    SESSION_COUNT=$(find "$proj" -maxdepth 1 -type d -name '*-*-*-*-*' 2>/dev/null | wc -l)
    if [ "$SESSION_COUNT" -gt 30 ]; then
      ls -1td "$proj"/*-*-*-*-* 2>/dev/null | tail -n +31 | while IFS= read -r d; do rm -rf "$d" 2>/dev/null; done
    fi
  done
fi

# ─── 7b. Python cache cleanup ────────────────────────────────────────
find "$CLAUDE_DIR/hooks" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# ─── 7c. Debug directory cleanup (files older than 14 days) ─────────
DEBUG_DIR="$CLAUDE_DIR/debug"
if [ -d "$DEBUG_DIR" ]; then
  find "$DEBUG_DIR" -maxdepth 1 -name "*.txt" -mtime +14 -delete 2>/dev/null || true
fi

# ─── 7d. Shell-snapshots cleanup (14-day retention + keep last 50) ───
SNAP_DIR="$CLAUDE_DIR/shell-snapshots"
if [ -d "$SNAP_DIR" ]; then
  find "$SNAP_DIR" -maxdepth 1 -name "snapshot-*.sh" -mtime +14 -delete 2>/dev/null || true
  SNAP_COUNT=$(find "$SNAP_DIR" -maxdepth 1 -name "snapshot-*.sh" 2>/dev/null | wc -l)
  if [ "$SNAP_COUNT" -gt 50 ]; then
    ls -1t "$SNAP_DIR"/snapshot-*.sh 2>/dev/null | tail -n +"51" | xargs rm -f 2>/dev/null || true
  fi
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
    ls -t "$PLANS_DIR"/*.md 2>/dev/null | tail -n +16 | while IFS= read -r f; do rm -f "$f" 2>/dev/null; done
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
    ls -t "$CACHE_DIR"/efficiency-*.json 2>/dev/null | tail -n +11 | while IFS= read -r f; do rm -f "$f" 2>/dev/null; done
  fi
fi

# ─── 7i. Action-graph carryover + prune (Tier 3) ────────────────────
# Carries forward the previous session's top-5 hot items if the state file
# is < 48h old. Also prunes action-graph files > 7 days old.
# §7f/§7g/§7h are already taken by Plans / Session-env / Cache efficiency.
AG_DIR="$CLAUDE_DIR/atlas-action-graph"
if [ -d "$AG_DIR" ]; then
  # Prune stale session files (cheap — runs every SessionStart)
  node "$CLAUDE_DIR/hooks/atlas-action-graph.js" prune --days=7 >/dev/null 2>&1 || true

  # Pick most recent state file (current session's doesn't exist yet at SessionStart)
  PREV_STATE=$(ls -t "$AG_DIR"/*.state.json 2>/dev/null | head -1)
  if [ -n "$PREV_STATE" ] && [ -f "$PREV_STATE" ]; then
    MTIME=$(stat -c %Y "$PREV_STATE" 2>/dev/null || echo 0)
    AGE=$(( NOW - MTIME ))
    if [ "$AGE" -gt 0 ] && [ "$AGE" -lt 172800 ]; then  # 48h = 172800s
      PREV_SID=$(basename "$PREV_STATE" .state.json)
      CARRYOVER=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" carryover "$PREV_SID" --n=5 2>/dev/null)
      if [ -n "$CARRYOVER" ] && [ "$CARRYOVER" != "No carryover (action graph empty)." ]; then
        echo "$CARRYOVER"
      fi
    fi
  fi
fi

# ─── 8. Stale temp file cleanup ─────────────────────────────────────
# Use Node's tmpdir (matches where hooks actually write — may differ from /tmp on Windows)
NODE_TMPDIR=$(node -e "process.stdout.write(require('os').tmpdir())" 2>/dev/null || echo "/tmp")
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-ctx-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-fail-streak-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-handoff-*.trigger" -mmin +1440 -delete 2>/dev/null || true

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
  ls -t "$BACKUP_DIR"/.claude.json.backup.* 2>/dev/null | tail -n +3 | while IFS= read -r f; do [ -f "$f" ] && rm -f "$f" 2>/dev/null; done || true
  echo "$NOW" > "$BACKUP_STATE"
fi
