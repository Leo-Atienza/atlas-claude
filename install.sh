#!/bin/bash
# Leo's Claude System — Quick Install
# Usage: bash install.sh
#
# This installs the core infrastructure (hooks, rules, scripts, key skills).
# It does NOT overwrite existing files — safe to run on an existing setup.

set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXAMPLES_DIR="$SCRIPT_DIR/examples"

echo "=== Leo's Claude System Installer ==="
echo ""

# Create directories
for dir in hooks scripts rules skills/self-evolve/templates skills/smart-swarm commands/flow agents logs sessions; do
  mkdir -p "$CLAUDE_DIR/$dir"
done
echo "Directories created."

# Copy files (no overwrite)
copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    echo "  + $(basename "$dst")"
  else
    echo "  ~ $(basename "$dst") (already exists, skipped)"
  fi
}

echo ""
echo "Installing hooks..."
for f in "$EXAMPLES_DIR"/hooks/*; do
  copy_if_missing "$f" "$CLAUDE_DIR/hooks/$(basename "$f")"
done

echo ""
echo "Installing rules..."
for f in "$EXAMPLES_DIR"/rules/*; do
  copy_if_missing "$f" "$CLAUDE_DIR/rules/$(basename "$f")"
done

echo ""
echo "Installing scripts..."
for f in "$EXAMPLES_DIR"/scripts/*; do
  copy_if_missing "$f" "$CLAUDE_DIR/scripts/$(basename "$f")"
done

echo ""
echo "Installing core skills..."
copy_if_missing "$EXAMPLES_DIR/skills/self-evolve/SKILL.md" "$CLAUDE_DIR/skills/self-evolve/SKILL.md"
copy_if_missing "$EXAMPLES_DIR/skills/self-evolve/templates/skill-template.md" "$CLAUDE_DIR/skills/self-evolve/templates/skill-template.md"
copy_if_missing "$EXAMPLES_DIR/skills/smart-swarm/SKILL.md" "$CLAUDE_DIR/skills/smart-swarm/SKILL.md"

echo ""
echo "Installing commands..."
copy_if_missing "$EXAMPLES_DIR/commands/continue.md" "$CLAUDE_DIR/commands/continue.md"
copy_if_missing "$EXAMPLES_DIR/commands/flow/smart-swarm.md" "$CLAUDE_DIR/commands/flow/smart-swarm.md"

echo ""
echo "Installing agents..."
copy_if_missing "$EXAMPLES_DIR/agents/smart-swarm-coordinator.md" "$CLAUDE_DIR/agents/smart-swarm-coordinator.md"

echo ""
echo "Installing config..."
copy_if_missing "$EXAMPLES_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
copy_if_missing "$EXAMPLES_DIR/settings.json" "$CLAUDE_DIR/settings.json"

# Initialize log files
touch "$CLAUDE_DIR/logs/failures.jsonl"
test -f "$CLAUDE_DIR/logs/error-patterns.json" || echo '{}' > "$CLAUDE_DIR/logs/error-patterns.json"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Installed to: $CLAUDE_DIR"
echo ""
echo "Next steps:"
echo "  1. Review ~/.claude/CLAUDE.md and customize for your workflow"
echo "  2. Review ~/.claude/settings.json and adjust hooks/permissions"
echo "  3. Run: bash ~/.claude/scripts/smoke-test.sh"
echo "  4. Start Claude Code and enjoy your new system"
echo ""
echo "Full docs: https://github.com/Leo-Atienza/claude-system"
