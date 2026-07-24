#!/bin/bash
# wiki-search-cli.sh — Obsidian CLI bridge.
#
# Search the Wiki vault using Obsidian's first-class CLI (1.12+).
# Independent of mcp-obsidian — works regardless of MCP wrapper state.
#
# Usage: bash wiki-search-cli.sh "<query>" [limit]
# Returns: JSON array of file paths matching the query (relative to vault root)
#
# Then read individual files via:
#   Read <your-vault-path>/<path>
#   or: obsidian vault=Wiki read path=<path>
#
# Note on `search` vs `search:context`: the CLI's search:context subcommand
# silently fails (exit 127) on installer 1.11.7 even though `search` works.
# A future installer upgrade (1.12.7+) is expected to fix search:context;
# until then, callers wanting line context should `Grep` the returned paths.
#
# Docs: https://obsidian.md/help/cli (search section)

set -euo pipefail

QUERY="${1:-}"
LIMIT="${2:-10}"

if [[ -z "$QUERY" ]]; then
  echo "usage: $0 <query> [limit]" >&2
  exit 1
fi

# Locate the CLI: prefer PATH, fall back to known Windows install path.
if command -v obsidian >/dev/null 2>&1; then
  OBSIDIAN_BIN="obsidian"
elif [[ -x "/c/Program Files/Obsidian/Obsidian.com" ]]; then
  OBSIDIAN_BIN="/c/Program Files/Obsidian/Obsidian.com"
else
  echo "error: Obsidian CLI not found. Verify Obsidian 1.12.7+ installer is present at C:/Program Files/Obsidian/Obsidian.com" >&2
  exit 2
fi

# vault= must precede the command per https://obsidian.md/help/cli
# path=wiki limits matches to wiki/ (skip raw/, attachments/, etc.)
"$OBSIDIAN_BIN" vault=Wiki search query="$QUERY" path=wiki limit="$LIMIT" format=json
