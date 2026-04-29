#!/usr/bin/env bash
# sync-from-local.sh — Scrub personal paths during ATLAS local→public sync.
#
# Usage:
#   bash scripts/sync-from-local.sh <local-src-path> <public-dest-path>
#   bash scripts/sync-from-local.sh <local-src-path> -          # write to stdout
#
# Replaces personal username/path patterns with portable forms in one pipe.
# Edit LEAKED_USERNAMES if other developers contribute and their usernames
# end up in tracked files.

set -e

if [ $# -lt 2 ]; then
  cat <<'USAGE'
sync-from-local.sh — Personal-path scrubber for ATLAS public-mirror syncs.

Usage:
  bash scripts/sync-from-local.sh <local-src-path> <public-dest-path>
  bash scripts/sync-from-local.sh <local-src-path> -          # stdout

Replaces (per known username):
  C:/Users/<u>/.claude/         -> ~/.claude/
  /c/Users/<u>/.claude/         -> ~/.claude/
  C:\Users\<u>\.claude\         -> ~/.claude/
  /c/Users/<u>/.agents/         -> ~/.agents/
  C:\Users\<u>\Documents\Wiki\  -> <your-wiki-path>\
  /c/Users/<u>/Documents/Wiki/  -> ~/Documents/Wiki/
  C--Users-<u>--claude          -> <your-cwd-slug>

Reports counts before/after and warns if any pattern matches remain.
USAGE
  exit 1
fi

SRC="$1"
DEST="$2"

if [ ! -f "$SRC" ]; then
  echo "ERROR: source file not found: $SRC" >&2
  exit 1
fi

# Add usernames here as needed.
LEAKED_USERNAMES="leooa"

scrub_stream() {
  local content
  content=$(cat)
  for u in $LEAKED_USERNAMES; do
    content=$(printf '%s' "$content" | sed \
      -e "s|C:/Users/$u/\\.claude/|~/.claude/|g" \
      -e "s|/c/Users/$u/\\.claude/|~/.claude/|g" \
      -e "s|/c/Users/$u/\\.agents/|~/.agents/|g" \
      -e "s|/c/Users/$u/Documents/Wiki/|~/Documents/Wiki/|g" \
      -e "s|C--Users-$u--claude|<your-cwd-slug>|g")
    # Backslash patterns: handled separately because sed quoting is hairy.
    content=$(printf '%s' "$content" | sed \
      -e "s|C:\\\\Users\\\\$u\\\\\\.claude\\\\|~/.claude/|g" \
      -e "s|C:\\\\Users\\\\$u\\\\Documents\\\\Wiki\\\\|<your-wiki-path>\\\\|g")
  done
  printf '%s' "$content"
}

CONTENT=$(cat "$SRC")
CLEAN=$(printf '%s' "$CONTENT" | scrub_stream)

if [ "$DEST" = "-" ]; then
  printf '%s' "$CLEAN"
  exit 0
fi

mkdir -p "$(dirname "$DEST")"
printf '%s' "$CLEAN" > "$DEST"

# Report
PATTERN=$(echo "$LEAKED_USERNAMES" | tr ' ' '|')
LEAKS_BEFORE=$(printf '%s' "$CONTENT" | grep -cE "$PATTERN" || true)
LEAKS_AFTER=$(printf '%s' "$CLEAN" | grep -cE "$PATTERN" || true)
DIFF=$((LEAKS_BEFORE - LEAKS_AFTER))

echo "synced: $SRC -> $DEST"
[ $DIFF -gt 0 ] && echo "  scrubbed: $DIFF personal-path reference(s)"
if [ $LEAKS_AFTER -gt 0 ]; then
  echo "  WARNING: $LEAKS_AFTER reference(s) to known leaked usernames remain — manual review needed" >&2
  exit 2
fi
