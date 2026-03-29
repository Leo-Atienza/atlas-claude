#!/bin/bash
# PreCompact hook — validates .flow/ state before context compaction
# Never blocks compaction — only warns via additionalContext

FLOW_DIR=".flow"

# No .flow/ directory → nothing to validate
if [ ! -d "$FLOW_DIR" ]; then
  exit 0
fi

WARNINGS=""

# Check state.yaml exists
if [ ! -f "$FLOW_DIR/state.yaml" ]; then
  WARNINGS="WARNING: .flow/ exists but state.yaml is missing — Flow state may be lost after compaction."
elif [ ! -s "$FLOW_DIR/state.yaml" ]; then
  WARNINGS="WARNING: .flow/state.yaml is empty — Flow state may be lost after compaction."
else
  # Check for required fields
  if ! grep -q "status:" "$FLOW_DIR/state.yaml" 2>/dev/null; then
    WARNINGS="WARNING: .flow/state.yaml has no 'status' field — state may be incomplete."
  fi
  if ! grep -q "phase:" "$FLOW_DIR/state.yaml" 2>/dev/null; then
    WARNINGS="${WARNINGS:+$WARNINGS }WARNING: .flow/state.yaml has no 'phase' field."
  fi
fi

# Check config.yaml exists
if [ ! -f "$FLOW_DIR/config.yaml" ] && [ ! -f "$FLOW_DIR/config.yml" ]; then
  WARNINGS="${WARNINGS:+$WARNINGS }NOTE: .flow/config.yaml not found."
fi

if [ -n "$WARNINGS" ]; then
  echo "FLOW STATE CHECK: $WARNINGS Consider saving Flow state before compaction proceeds."
fi

exit 0
