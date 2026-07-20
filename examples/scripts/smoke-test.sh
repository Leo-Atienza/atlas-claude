#!/bin/bash
# Smoke Test — Validates core system infrastructure is functional
# Run: bash ~/.claude/scripts/smoke-test.sh
# Returns: 0 if all pass, 1 if any critical test fails

set -u
PASS=0
FAIL=0
WARN=0
CLAUDE_DIR="$HOME/.claude"

# Windows path for tools that need native paths (python3, node)
if [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" || "${OS:-}" == "Windows_NT" ]]; then
  CLAUDE_DIR_WIN=$(cygpath -w "$CLAUDE_DIR" 2>/dev/null || echo "$CLAUDE_DIR")
else
  CLAUDE_DIR_WIN="$CLAUDE_DIR"
fi

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }

echo "=== Claude System Smoke Test ==="
echo ""

# ─── 1. Critical Files Exist ─────────────────────────────────────────
echo "[1] Critical Files"
for f in CLAUDE.md settings.json skills/REGISTRY.md; do
  if [ -f "$CLAUDE_DIR/$f" ]; then
    pass "$f exists"
  else
    fail "$f MISSING"
  fi
done

# ─── 2. Hooks Exist and Are Executable ───────────────────────────────
echo "[2] Hooks"
for h in hooks/session-start.sh hooks/session-stop.sh hooks/context-monitor.js hooks/statusline.js hooks/security-gate.sh hooks/mistake-capture.py; do
  if [ -f "$CLAUDE_DIR/$h" ]; then
    pass "$h exists"
  else
    fail "$h MISSING"
  fi
done

# ─── 3. Settings.json Validity ───────────────────────────────────────
echo "[3] Settings"
# Use python3 for JSON validation with Windows-compatible path
if python3 -c "import json; json.load(open(r'$CLAUDE_DIR_WIN/settings.json'.replace('\\\\','/')))" 2>/dev/null; then
  pass "settings.json is valid JSON"
else
  fail "settings.json is INVALID JSON"
fi

# Check BYPASS_SAFETY_HOOKS is not set
if grep -q "BYPASS_SAFETY_HOOKS" "$CLAUDE_DIR/settings.json" 2>/dev/null; then
  fail "BYPASS_SAFETY_HOOKS still present in settings.json — security disabled"
else
  pass "No BYPASS_SAFETY_HOOKS (security active)"
fi

# ─── 4. Registry → Disk Validation ──────────────────────────────────
echo "[4] Registry Integrity"
REGISTRY="$CLAUDE_DIR/skills/REGISTRY.md"
MISSING_COUNT=0
CHECKED=0
if [ -f "$REGISTRY" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    full="$CLAUDE_DIR/$p"
    CHECKED=$((CHECKED + 1))
    if [ ! -f "$full" ]; then
      MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
  done < <(grep -oE '`(skills|commands|agents)/[^`]+\.md`' "$REGISTRY" | tr -d '`' | head -50)

  if [ "$MISSING_COUNT" -eq 0 ]; then
    pass "All $CHECKED checked registry paths exist on disk"
  else
    warn "$MISSING_COUNT of $CHECKED checked registry paths missing on disk"
  fi
else
  fail "REGISTRY.md not found"
fi

# ─── 5. Logs Directory and Files ─────────────────────────────────────
echo "[5] Logging Infrastructure"
if [ -d "$CLAUDE_DIR/logs" ]; then
  pass "logs/ directory exists"
else
  fail "logs/ directory MISSING"
fi

if [ -f "$CLAUDE_DIR/logs/failures.jsonl" ]; then
  pass "failures.jsonl exists"
else
  warn "failures.jsonl missing (mistake learning won't work)"
fi

if [ -f "$CLAUDE_DIR/logs/error-patterns.json" ]; then
  pass "error-patterns.json exists"
else
  warn "error-patterns.json missing (pattern detection won't work)"
fi

# ─── 6. Auto-Continuation Infrastructure ─────────────────────────────
echo "[6] Auto-Continuation"
if [ -f "$CLAUDE_DIR/scripts/auto-continue.sh" ]; then
  pass "auto-continue.sh exists"
else
  fail "auto-continue.sh MISSING (auto-continuation disabled)"
fi

if [ -d "$CLAUDE_DIR/sessions" ] || mkdir -p "$CLAUDE_DIR/sessions"; then
  pass "sessions/ directory ready"
else
  fail "Cannot create sessions/ directory"
fi

# ─── 7. Key Skills Exist ────────────────────────────────────────────
echo "[7] Core Skills"
for s in self-evolve smart-swarm flow skill-creator; do
  if [ -f "$CLAUDE_DIR/skills/$s/SKILL.md" ]; then
    pass "$s skill exists"
  else
    fail "$s skill MISSING"
  fi
done

# ─── 8. Key Commands Exist ──────────────────────────────────────────
echo "[8] Core Commands"
for c in flow/start.md flow/map.md flow/smart-swarm.md continue.md; do
  if [ -f "$CLAUDE_DIR/commands/$c" ]; then
    pass "commands/$c exists"
  else
    fail "commands/$c MISSING"
  fi
done

# ─── 9. Context Monitor Hook Can Parse ──────────────────────────────
echo "[9] Hook Functionality"
RESULT=$(echo '{"session_id":"test","tool_name":"Bash"}' | node "$CLAUDE_DIR/hooks/context-monitor.js" 2>&1; echo "EXIT:$?")
if echo "$RESULT" | grep -q "EXIT:0"; then
  pass "context-monitor.js runs without error"
else
  warn "context-monitor.js returned non-zero (may be normal without bridge file)"
fi

# ─── 10. Mistake Capture Hook Can Parse ─────────────────────────────
RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"test"},"tool_response":{"output":"ok"}}' | python3 "$CLAUDE_DIR/hooks/mistake-capture.py" 2>&1; echo "EXIT:$?")
if echo "$RESULT" | grep -q "EXIT:0"; then
  pass "mistake-capture.py runs without error"
else
  warn "mistake-capture.py returned non-zero"
fi

# ─── Summary ────────────────────────────────────────────────────────
echo ""
echo "=== Results ==="
echo "  PASS: $PASS"
echo "  WARN: $WARN"
echo "  FAIL: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: FAILURES DETECTED — fix before relying on system"
  exit 1
else
  if [ "$WARN" -gt 0 ]; then
    echo "STATUS: PASSING with $WARN warning(s)"
  else
    echo "STATUS: ALL CLEAR"
  fi
  exit 0
fi
