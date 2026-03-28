#!/bin/bash
# Skill Health Check — runs periodically at session start
# Validates skill files exist and are well-formed
# Only runs if >7 days since last check

SKILLS_DIR="$HOME/.claude/skills"
STATE_FILE="/tmp/claude-skill-health-last-run"
INTERVAL_DAYS=7
NOW=$(date +%s)

# Check if we ran recently
if [ -f "$STATE_FILE" ]; then
  LAST_RUN=$(cat "$STATE_FILE")
  ELAPSED=$(( (NOW - LAST_RUN) / 86400 ))
  if [ "$ELAPSED" -lt "$INTERVAL_DAYS" ]; then
    exit 0
  fi
fi

# Run health check
ISSUES=""
ISSUE_COUNT=0

# Check that key files exist
for f in SKILL-CATALOG.md PLAYBOOK-WORKFLOWS.md PLAYBOOK-QUALITY.md PLAYBOOK-TOOLS.md; do
  if [ ! -f "$SKILLS_DIR/$f" ]; then
    ISSUES="${ISSUES}\n- MISSING: $f"
    ISSUE_COUNT=$((ISSUE_COUNT + 1))
  fi
done

# Check skill directories have SKILL.md
for dir in "$SKILLS_DIR"/*/; do
  dirname=$(basename "$dir")
  # Skip non-skill directories
  case "$dirname" in
    cc-devops|trailofbits-security|fullstack-dev|compound-engineering|cctools|infra-showcase) continue ;;
  esac
  if [ ! -f "$dir/SKILL.md" ] && [ ! -f "$dir/COMMAND.md" ] && [ ! -f "$dir/README.md" ]; then
    # Check if it has any .md file at all
    md_count=$(find "$dir" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
    if [ "$md_count" -eq 0 ]; then
      ISSUES="${ISSUES}\n- NO_DOCS: $dirname/ has no .md files"
      ISSUE_COUNT=$((ISSUE_COUNT + 1))
    fi
  fi
done

# Check archived skills are accessible
ARCHIVE_DIR="$SKILLS_DIR/skills-archive"
if [ -d "$ARCHIVE_DIR" ]; then
  for dir in "$ARCHIVE_DIR"/*/; do
    if [ -d "$dir" ]; then
      dirname=$(basename "$dir")
      if [ ! -f "$dir/SKILL.md" ]; then
        ISSUES="${ISSUES}\n- ARCHIVE_NO_DOCS: skills-archive/$dirname/ missing SKILL.md"
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
      fi
    fi
  done
fi

# Save timestamp
echo "$NOW" > "$STATE_FILE"

# Output results if issues found
if [ "$ISSUE_COUNT" -gt 0 ]; then
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"SKILL HEALTH CHECK: $ISSUE_COUNT issue(s) found:$(echo -e "$ISSUES" | tr '\n' ' '). Run /health for details.\"}}"
fi
