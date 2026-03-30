#!/bin/bash
# Consolidated SessionStart hook
# Combines: session-start-check.sh + skill-health-check.sh + claudio
# Runs once at session start. Each section is independent (|| true per section).

HOME_DIR="$HOME"
CLAUDE_DIR="$HOME_DIR/.claude"

# Hard timeout watchdog — kill this script after 8 seconds to prevent hangs
( sleep 8 && kill $$ 2>/dev/null ) &
WATCHDOG_PID=$!
trap "kill $WATCHDOG_PID 2>/dev/null" EXIT

# ─── 1. Progressive Learning checks ───────────────────────────────────
FLAG_FILE="$CLAUDE_DIR/.pending-reflection"
CONFLICTS_FILE="$CLAUDE_DIR/projects/<PROJECT_MEMORY_DIR>/memory/conflicts.md"
HANDOFF_FILE="$CLAUDE_DIR/.last-session-handoff"

if [ -f "$FLAG_FILE" ]; then
  echo "PROGRESSIVE LEARNING: Previous session reflection was missed."
  cat "$FLAG_FILE"
  echo ""
  echo "Consider what was learned in the previous session and capture it now."
  echo "Run /reflect if you can recall the session context."
fi

if [ -f "$CONFLICTS_FILE" ]; then
  CONFLICT_COUNT=$(grep -c "^## CONFLICT-[0-9]" "$CONFLICTS_FILE" 2>/dev/null || echo "0")
  if [ "$CONFLICT_COUNT" -gt 0 ]; then
    echo ""
    echo "PROGRESSIVE LEARNING: $CONFLICT_COUNT unresolved knowledge conflict(s) detected."
    echo "Ask the user: 'You have $CONFLICT_COUNT unresolved knowledge conflicts. Resolve now or later?'"
  fi
fi

if [ -f "$HANDOFF_FILE" ]; then
  echo ""
  echo "SESSION HANDOFF from previous session:"
  cat "$HANDOFF_FILE"
  echo ""
  echo "Use /resume to continue where you left off."
fi

# ─── 1.5. Mermaid architecture diagram detection ──────────────────────
# Auto-detect existing architecture diagrams for context injection
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  MERMAID_FILES=""
  MERMAID_COUNT=0

  # Search common locations for mermaid files
  for pattern in "docs/diagrams/*.md" "docs/diagrams/*.mmd" "docs/*.mmd" "*.mmd" ".flow/codebase/ARCHITECTURE.mmd"; do
    for f in $pattern; do
      if [ -f "$f" ] 2>/dev/null; then
        MERMAID_FILES="${MERMAID_FILES} $f"
        MERMAID_COUNT=$((MERMAID_COUNT + 1))
      fi
    done
  done

  # Also check for mermaid blocks in CLAUDE.md
  if [ -f "CLAUDE.md" ]; then
    if grep -q '```mermaid' "CLAUDE.md" 2>/dev/null; then
      MERMAID_COUNT=$((MERMAID_COUNT + 1))
      MERMAID_FILES="${MERMAID_FILES} CLAUDE.md(inline)"
    fi
  fi

  if [ "$MERMAID_COUNT" -gt 0 ]; then
    echo "ARCHITECTURE DIAGRAMS: Found $MERMAID_COUNT diagram(s) at:${MERMAID_FILES}. Read these for architectural context."
  else
    # Only suggest generation for substantial projects
    SRC_COUNT=$(find . -maxdepth 3 -name "*.ts" -o -name "*.py" -o -name "*.js" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.dart" 2>/dev/null | head -11 | wc -l)
    if [ "$SRC_COUNT" -gt 10 ]; then
      echo "NO ARCHITECTURE DIAGRAMS detected in this project ($SRC_COUNT+ source files). Run /flow:map to auto-generate one."
    fi
  fi
fi

# ─── 1.75. Rebuild memory bridge for Flow agents ─────────────────────
bash "$CLAUDE_DIR/scripts/rebuild-memory-bridge.sh" 2>/dev/null || true

# ─── 2. Skill health check (daily, 1-day interval) ───────────────────
SKILLS_DIR="$CLAUDE_DIR/skills"
STATE_FILE="$CLAUDE_DIR/cache/skill-health-last-run"
INTERVAL_DAYS=1
NOW=$(date +%s)

RUN_HEALTH=true
if [ -f "$STATE_FILE" ]; then
  LAST_RUN=$(cat "$STATE_FILE")
  ELAPSED=$(( (NOW - LAST_RUN) / 86400 ))
  if [ "$ELAPSED" -lt "$INTERVAL_DAYS" ]; then
    RUN_HEALTH=false
  fi
fi

if [ "$RUN_HEALTH" = true ]; then
  ISSUES=""
  ISSUE_COUNT=0

  # Check critical files (REGISTRY.md, not deleted SKILL-CATALOG.md)
  for f in REGISTRY.md PLAYBOOK-WORKFLOWS.md PLAYBOOK-QUALITY.md PLAYBOOK-TOOLS.md; do
    if [ ! -f "$SKILLS_DIR/$f" ]; then
      ISSUES="${ISSUES}\n- MISSING: $f"
      ISSUE_COUNT=$((ISSUE_COUNT + 1))
    fi
  done

  # Check skill directories have documentation
  for dir in "$SKILLS_DIR"/*/; do
    dirname=$(basename "$dir")
    case "$dirname" in
      cc-devops|trailofbits-security|fullstack-dev|compound-engineering|cctools|infra-showcase|skills-archive) continue ;;
    esac
    if [ ! -f "$dir/SKILL.md" ] && [ ! -f "$dir/COMMAND.md" ] && [ ! -f "$dir/README.md" ]; then
      md_count=$(find "$dir" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
      if [ "$md_count" -eq 0 ]; then
        ISSUES="${ISSUES}\n- NO_DOCS: $dirname/ has no .md files"
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
      fi
    fi
  done

  echo "$NOW" > "$STATE_FILE"

  if [ "$ISSUE_COUNT" -gt 0 ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"SKILL HEALTH CHECK: $ISSUE_COUNT issue(s) found:$(echo -e "$ISSUES" | tr '\n' ' '). Run /health for details.\"}}"
  fi
fi

# ─── 3. Version manifest staleness nudge ─────────────────────────────
# (consolidated into single Node call in section 5.5)

# ─── 4. Claude Code version check ────────────────────────────────────
VERSION_FILE="$CLAUDE_DIR/.claude-code-version"
CURRENT_VER=$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -n "$CURRENT_VER" ]; then
  STORED_VER=$(cat "$VERSION_FILE" 2>/dev/null)
  if [ -n "$STORED_VER" ] && [ "$CURRENT_VER" != "$STORED_VER" ]; then
    echo "CLAUDE CODE UPDATED: v$STORED_VER -> v$CURRENT_VER. Run /health to check for breaking changes."
  fi
  echo "$CURRENT_VER" > "$VERSION_FILE"
fi

# ─── 5. Lessons & error pattern summary ──────────────────────────────
TOPICS_DIR="$CLAUDE_DIR/projects/<PROJECT_MEMORY_DIR>/memory/topics"
ERR_COUNT=$(ls "$TOPICS_DIR"/G-ERR-*.md 2>/dev/null | wc -l)

FAILURES_LOG="$CLAUDE_DIR/logs/failures.jsonl"
FAIL_COUNT=0
if [ -f "$FAILURES_LOG" ]; then
  WEEK_AGO=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "")
  if [ -n "$WEEK_AGO" ]; then
    FAIL_COUNT=$(grep -c "$WEEK_AGO\|$(date +%Y-%m-%d)" "$FAILURES_LOG" 2>/dev/null || echo "0")
  fi
fi

# Check recurring patterns
RECURRING_COUNT=0
PATTERNS_FILE="$CLAUDE_DIR/logs/error-patterns.json"
if [ -f "$PATTERNS_FILE" ]; then
  RECURRING_COUNT=$(python3 -c "
import json
with open('$PATTERNS_FILE') as f:
    p = json.load(f)
print(sum(1 for v in p.values() if v.get('count',0) >= 3))
" 2>/dev/null || echo "0")
fi

# Emit structured signal if there's actionable data
SIGNALS=""
if [ "$FAIL_COUNT" -gt 5 ]; then
  SIGNALS="${SIGNALS}${FAIL_COUNT} tool failures this week. "
fi
if [ "$RECURRING_COUNT" -gt 0 ]; then
  SIGNALS="${SIGNALS}${RECURRING_COUNT} recurring error pattern(s) need /learn. "
fi
if [ "$ERR_COUNT" -gt 10 ]; then
  SIGNALS="${SIGNALS}${ERR_COUNT} G-ERR topics accumulated — consider /analyze-mistakes. "
fi

if [ -n "$SIGNALS" ]; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"MISTAKE LEARNING: ${SIGNALS}Act on recurring patterns before starting new work.\"}}"
fi

# ─── 5.5. Consolidated health alerts (single Node process) ──────────
# Combines: version manifest staleness + skill performance + tool health
# Saves ~1-2s by avoiding 3 separate Node process spawns
MANIFEST="$CLAUDE_DIR/skills/VERSION-MANIFEST.json"
SKILL_STATS="$CLAUDE_DIR/logs/skill-stats.json"
TOOL_HEALTH="$CLAUDE_DIR/logs/tool-health.json"

if [ -f "$MANIFEST" ] || [ -f "$SKILL_STATS" ] || [ -f "$TOOL_HEALTH" ]; then
  node -e "
    const fs=require('fs');
    try{const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
      const d=[...Object.values(m.cli_tools||{}),...Object.values(m.skill_packs||{})]
        .map(v=>new Date(v.last_checked));
      const days=Math.round((Date.now()-Math.min(...d))/86400000);
      if(days>14)console.log('VERSION CHECK: Last update check was '+days+' days ago. Run /health to check for updates.');
    }catch(e){}
    try{const s=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
      const a=Object.entries(s.skills||{})
        .filter(([_,v])=>v.fallback_rate>0.50&&v.total_selections>=5)
        .map(([id,v])=>id+' ('+v.name+') '+Math.round(v.fallback_rate*100)+'% fallback');
      if(a.length)console.log('SKILL HEALTH: High fallback rates detected — '+a.join('; ')+'. Keywords may need updating.');
    }catch(e){}
    try{const h=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
      const a=Object.entries(h.tools||{})
        .filter(([_,t])=>t.failure_rate_ema>0.40&&t.total_calls>=10)
        .map(([n,t])=>n+' ('+Math.round(t.failure_rate_ema*100)+'% EMA failure)');
      if(a.length)console.log('HIGH TOOL FAILURE RATES: '+a.join(', ')+'. Investigate before heavy use.');
    }catch(e){}
  " "$MANIFEST" "$SKILL_STATS" "$TOOL_HEALTH" 2>/dev/null || true
fi

# ─── 5.6. MCP_DOCKER health check ───────────────────────────────────
MCP_CONTAINER=$(docker ps --filter name=mcp -q 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$MCP_CONTAINER" ]; then
  echo "MCP_DOCKER WARNING: No running MCP container found. Scheduled maintenance tasks (cron triggers, remote agents) will not execute this session."
fi

# ─── 5.7. Hook health alerts (slow hook detection) ─────────────────
HOOK_HEALTH="$CLAUDE_DIR/logs/hook-health.jsonl"
if [ -f "$HOOK_HEALTH" ] && [ -s "$HOOK_HEALTH" ]; then
  SLOW_HOOKS=$(python3 -c "
import json, sys
from collections import defaultdict
durations = defaultdict(list)
for line in open(sys.argv[1]):
    try:
        e = json.loads(line)
        durations[e['hook']].append(e['duration_ms'])
    except: pass
slow = []
for hook, times in durations.items():
    avg = sum(times) / len(times)
    if avg > 3000 and len(times) >= 3:
        slow.append(f'{hook} ({int(avg)}ms avg over {len(times)} calls)')
if slow: print('; '.join(slow))
" "$HOOK_HEALTH" 2>/dev/null)
  if [ -n "$SLOW_HOOKS" ]; then
    echo "SLOW HOOKS DETECTED: $SLOW_HOOKS. Consider optimizing or increasing timeout."
  fi
fi

# ─── 6. Stale plan cleanup ───────────────────────────────────────────
PLANS_DIR="$CLAUDE_DIR/plans"
if [ -d "$PLANS_DIR" ]; then
  STALE_PLANS=$(find "$PLANS_DIR" -name "*.md" -mtime +14 2>/dev/null | wc -l)
  if [ "$STALE_PLANS" -gt 3 ]; then
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"HOUSEKEEPING: ${STALE_PLANS} plan files older than 14 days in plans/. Clean up old plans to reduce clutter.\"}}"
  fi
fi

# ─── 7. Log rotation ────────────────────────────────────────────────
LOGS_DIR="$CLAUDE_DIR/logs"
if [ -d "$LOGS_DIR" ]; then
  # Rotate hook-health.jsonl and failures.jsonl if over 2MB
  for logfile in "$LOGS_DIR"/failures.jsonl "$LOGS_DIR"/hook-health.jsonl; do
    if [ -f "$logfile" ] && [ "$(wc -c < "$logfile" 2>/dev/null || echo 0)" -gt 2000000 ]; then
      tail -500 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
    fi
  done
fi

# ─── 8. Dream memory consolidation check ─────────────────────────────
DREAM_STATE_FILE="$CLAUDE_DIR/cache/dream-last-run"
DREAM_INTERVAL_DAYS=7
MEMORY_DIR="$CLAUDE_DIR/projects/<PROJECT_MEMORY_DIR>/memory"

NEED_DREAM=false
DREAM_REASON=""

# Check time since last dream
if [ -f "$DREAM_STATE_FILE" ]; then
  LAST_DREAM=$(cat "$DREAM_STATE_FILE")
  DREAM_ELAPSED=$(( (NOW - LAST_DREAM) / 86400 ))
  if [ "$DREAM_ELAPSED" -ge "$DREAM_INTERVAL_DAYS" ]; then
    NEED_DREAM=true
    DREAM_REASON="Last memory consolidation was ${DREAM_ELAPSED} days ago."
  fi
else
  NEED_DREAM=true
  DREAM_REASON="No previous memory consolidation recorded."
fi

# Check memory file count (threshold: 50+)
if [ "$NEED_DREAM" = false ] && [ -d "$MEMORY_DIR" ]; then
  MEM_FILE_COUNT=$(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
  if [ "$MEM_FILE_COUNT" -gt 50 ]; then
    NEED_DREAM=true
    DREAM_REASON="Memory directory has ${MEM_FILE_COUNT} files (threshold: 50)."
  fi
fi

# Check MEMORY.md line count (threshold: 150+)
if [ "$NEED_DREAM" = false ] && [ -f "$MEMORY_DIR/MEMORY.md" ]; then
  MEM_LINES=$(wc -l < "$MEMORY_DIR/MEMORY.md" 2>/dev/null || echo "0")
  if [ "$MEM_LINES" -gt 150 ]; then
    NEED_DREAM=true
    DREAM_REASON="MEMORY.md has ${MEM_LINES} lines (threshold: 150)."
  fi
fi

if [ "$NEED_DREAM" = true ]; then
  echo "DREAM NEEDED: ${DREAM_REASON} BLOCKING: Run /dream NOW before proceeding with any other work. Memory consolidation is required to prevent knowledge loss."
fi

# ─── 9. Critical file backup (weekly) ───────────────────────────────
BACKUP_DIR="$CLAUDE_DIR/backups"
BACKUP_STATE="$CLAUDE_DIR/cache/backup-last-run"
BACKUP_INTERVAL=604800  # 7 days in seconds
RUN_BACKUP=false
if [ -f "$BACKUP_STATE" ]; then
  LAST_BACKUP=$(cat "$BACKUP_STATE" 2>/dev/null || echo "0")
  if [ $(( NOW - LAST_BACKUP )) -ge $BACKUP_INTERVAL ]; then
    RUN_BACKUP=true
  fi
else
  RUN_BACKUP=true
fi

if [ "$RUN_BACKUP" = true ]; then
  mkdir -p "$BACKUP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d)
  # Back up critical single-point-of-failure files
  cp -f "$CLAUDE_DIR/skills/REGISTRY.md" "$BACKUP_DIR/REGISTRY-${STAMP}.md" 2>/dev/null || true
  cp -f "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/CLAUDE-${STAMP}.md" 2>/dev/null || true
  # Back up memory system (small files, zip if available)
  MEMORY_SRC="$CLAUDE_DIR/projects/<PROJECT_MEMORY_DIR>/memory"
  if [ -d "$MEMORY_SRC" ]; then
    if command -v tar >/dev/null 2>&1; then
      tar czf "$BACKUP_DIR/memory-${STAMP}.tar.gz" -C "$(dirname "$MEMORY_SRC")" "$(basename "$MEMORY_SRC")" 2>/dev/null || true
    else
      mkdir -p "$BACKUP_DIR/memory-${STAMP}" 2>/dev/null
      cp -r "$MEMORY_SRC"/*.md "$BACKUP_DIR/memory-${STAMP}/" 2>/dev/null || true
      cp -r "$MEMORY_SRC"/topics "$BACKUP_DIR/memory-${STAMP}/" 2>/dev/null || true
    fi
  fi
  # Prune backups older than 30 days
  find "$BACKUP_DIR" -name "REGISTRY-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "CLAUDE-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "memory-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
  echo "$NOW" > "$BACKUP_STATE"
fi

# ─── 10. Claudio audio ───────────────────────────────────────────────
"$CLAUDE_DIR/bin/claudio" 2>/dev/null || true
