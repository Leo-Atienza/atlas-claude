#!/bin/bash
# Self-Repair Script — Detects and fixes common infrastructure issues
# Triggered by: /health --fix, or manually after smoke-test FAIL results
# Philosophy: fix what's safe to fix automatically, report what needs human attention

CLAUDE_DIR="$HOME/.claude"
FIXED=0
SKIPPED=0

echo "=== ATLAS Self-Repair ==="
echo ""

# ─── 1. Missing log files ────────────────────────────────────────────
LOGS_DIR="$CLAUDE_DIR/logs"
mkdir -p "$LOGS_DIR"

for logfile in failures.jsonl hook-health.jsonl skill-events.jsonl subagent-events.jsonl; do
  if [ ! -f "$LOGS_DIR/$logfile" ]; then
    touch "$LOGS_DIR/$logfile"
    echo "  FIXED: Created missing $logfile"
    FIXED=$((FIXED + 1))
  fi
done

for jsonfile in error-patterns.json tool-call-counts.json tool-health.json skill-stats.json; do
  if [ ! -f "$LOGS_DIR/$jsonfile" ]; then
    echo "{}" > "$LOGS_DIR/$jsonfile"
    echo "  FIXED: Created missing $jsonfile"
    FIXED=$((FIXED + 1))
  fi
done

# ─── 2. Missing directories ──────────────────────────────────────────
for dir in cache plans sessions backups; do
  if [ ! -d "$CLAUDE_DIR/$dir" ]; then
    mkdir -p "$CLAUDE_DIR/$dir"
    echo "  FIXED: Created missing $dir/"
    FIXED=$((FIXED + 1))
  fi
done

# ─── 3. CLAUDE.md integrity ──────────────────────────────────────────
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"
if [ ! -f "$CLAUDE_MD" ]; then
  echo "  CRITICAL: CLAUDE.md is missing! Cannot auto-repair — restore from git."
  SKIPPED=$((SKIPPED + 1))
elif [ "$(wc -c < "$CLAUDE_MD" 2>/dev/null || echo 0)" -lt 1024 ]; then
  echo "  CRITICAL: CLAUDE.md is suspiciously small ($(wc -c < "$CLAUDE_MD") bytes). May be truncated."
  echo "           Run: git checkout HEAD -- CLAUDE.md"
  SKIPPED=$((SKIPPED + 1))
fi

# ─── 4. Settings.json validity ────────────────────────────────────────
SETTINGS="$CLAUDE_DIR/settings.json"
if [ -f "$SETTINGS" ]; then
  if ! python3 -c "import json; json.load(open('$SETTINGS'))" 2>/dev/null; then
    echo "  CRITICAL: settings.json is invalid JSON! Restore from git."
    echo "           Run: git checkout HEAD -- settings.json"
    SKIPPED=$((SKIPPED + 1))
  fi
fi

# ─── 5. Hook file permissions (make executable) ──────────────────────
for hook in "$CLAUDE_DIR"/hooks/*.sh "$CLAUDE_DIR"/scripts/*.sh; do
  if [ -f "$hook" ] && [ ! -x "$hook" ]; then
    chmod +x "$hook" 2>/dev/null
    echo "  FIXED: Made $(basename "$hook") executable"
    FIXED=$((FIXED + 1))
  fi
done

# ─── 6. Orphan git lock files ────────────────────────────────────────
if [ -f "$CLAUDE_DIR/.git/index.lock" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$CLAUDE_DIR/.git/index.lock" 2>/dev/null || stat -f %m "$CLAUDE_DIR/.git/index.lock" 2>/dev/null || echo "0") ))
  if [ "$LOCK_AGE" -gt 60 ]; then
    rm -f "$CLAUDE_DIR/.git/index.lock" 2>/dev/null
    echo "  FIXED: Removed stale git index.lock (${LOCK_AGE}s old)"
    FIXED=$((FIXED + 1))
  else
    echo "  SKIP: git index.lock exists but is recent (${LOCK_AGE}s) — may be in use"
    SKIPPED=$((SKIPPED + 1))
  fi
fi

# ─── 7. Cache directory state files ──────────────────────────────────
CACHE_DIR="$CLAUDE_DIR/cache"
mkdir -p "$CACHE_DIR"

# Migrate old /tmp/ state files if they exist
for old_new in "/tmp/claude-dream-last-run:$CACHE_DIR/dream-last-run" "/tmp/claude-skill-health-last-run:$CACHE_DIR/skill-health-last-run"; do
  OLD_PATH="${old_new%%:*}"
  NEW_PATH="${old_new##*:}"
  if [ -f "$OLD_PATH" ] && [ ! -f "$NEW_PATH" ]; then
    cp "$OLD_PATH" "$NEW_PATH" 2>/dev/null
    echo "  FIXED: Migrated $(basename "$OLD_PATH") from /tmp/ to cache/"
    FIXED=$((FIXED + 1))
  fi
done

# ─── 8. Registry path validation ─────────────────────────────────────
REGISTRY="$CLAUDE_DIR/skills/REGISTRY.md"
if [ -f "$REGISTRY" ]; then
  BROKEN_PATHS=0
  while IFS= read -r path; do
    if [ ! -f "$CLAUDE_DIR/$path" ]; then
      BROKEN_PATHS=$((BROKEN_PATHS + 1))
    fi
  done < <(grep -oE '`(skills|commands|agents|hooks|scripts)/[^`]+`' "$REGISTRY" | tr -d '`' | head -200)
  if [ "$BROKEN_PATHS" -gt 0 ]; then
    echo "  WARN: $BROKEN_PATHS broken path(s) in REGISTRY.md — run smoke-test for details"
    SKIPPED=$((SKIPPED + 1))
  fi
fi

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
echo "=== Results ==="
echo "  FIXED: $FIXED"
echo "  NEEDS ATTENTION: $SKIPPED"

if [ "$SKIPPED" -eq 0 ] && [ "$FIXED" -eq 0 ]; then
  echo ""
  echo "STATUS: HEALTHY — nothing to repair"
elif [ "$SKIPPED" -eq 0 ]; then
  echo ""
  echo "STATUS: ALL REPAIRED"
else
  echo ""
  echo "STATUS: $SKIPPED issue(s) need manual attention (see above)"
fi
