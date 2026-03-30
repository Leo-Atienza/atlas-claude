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

# CLAUDE.md content integrity (detect truncation/corruption)
CLAUDE_SIZE=$(wc -c < "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null || echo "0")
if [ "$CLAUDE_SIZE" -lt 1024 ]; then
  fail "CLAUDE.md is suspiciously small (${CLAUDE_SIZE} bytes) — may be truncated"
else
  # Verify key sections exist
  CLAUDE_SECTIONS_OK=true
  for section in "Master Entry Points" "Session End Protocol" "Task Routing"; do
    if ! grep -q "$section" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
      fail "CLAUDE.md missing required section: $section"
      CLAUDE_SECTIONS_OK=false
    fi
  done
  if [ "$CLAUDE_SECTIONS_OK" = true ]; then
    pass "CLAUDE.md integrity OK (${CLAUDE_SIZE} bytes, key sections present)"
  fi
fi

# ─── 2. Hooks Exist and Are Executable ───────────────────────────────
echo "[2] Hooks"
for h in hooks/session-start.sh hooks/session-stop.sh hooks/post-tool-monitor.js hooks/statusline.js hooks/security-gate.sh hooks/subagent-tracker.js hooks/subagent-limiter.js hooks/subagent-verifier.js; do
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
  done < <(grep -oE '`(skills|commands|agents)/[^`]+\.md`' "$REGISTRY" | tr -d '`' | head -200)

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

# ─── 9. Consolidated PostToolUse Hook Can Parse ─────────────────────
echo "[9] Hook Functionality"
RESULT=$(echo '{"session_id":"test","tool_name":"Bash","tool_input":{"command":"test"},"tool_response":{"output":"ok"}}' | node "$CLAUDE_DIR/hooks/post-tool-monitor.js" 2>&1; echo "EXIT:$?")
if echo "$RESULT" | grep -q "EXIT:0"; then
  pass "post-tool-monitor.js runs without error"
else
  warn "post-tool-monitor.js returned non-zero"
fi

# ─── 10. Subagent Data Format Compatibility ─────────────────────────
echo "[10] Subagent System Integration"
# Test: tracker writes format that limiter can read
AGENT_TEST_FILE=$(mktemp)
echo '{"session_id":"smoke-test","tool_input":{"subagent_type":"test-agent","description":"smoke test"}}' | node "$CLAUDE_DIR/hooks/subagent-tracker.js" 2>/dev/null
NODE_TMPDIR=$(node -e "console.log(require('os').tmpdir())")
AGENT_STATE_FILE="$NODE_TMPDIR/claude-agents-smoke-test.json"
if [ -f "$AGENT_STATE_FILE" ]; then
  # Verify limiter can parse the format tracker wrote
  LIMITER_RESULT=$(echo '{"session_id":"smoke-test","tool_name":"Agent","tool_input":{}}' | node "$CLAUDE_DIR/hooks/subagent-limiter.js" 2>&1; echo "EXIT:$?")
  if echo "$LIMITER_RESULT" | grep -q "EXIT:0"; then
    # Verify the limiter actually reads a non-zero count
    COUNT=$(node -e "const s=JSON.parse(require('fs').readFileSync(require('os').tmpdir()+'/claude-agents-smoke-test.json','utf8'));const c=Array.isArray(s)?s.length:Array.isArray(s.active)?s.active.length:0;console.log(c)" 2>/dev/null)
    if [ "${COUNT:-0}" -gt 0 ] 2>/dev/null; then
      pass "Subagent tracker→limiter format compatible (count=$COUNT)"
    else
      fail "Subagent limiter reads 0 agents despite tracker writing data (FORMAT MISMATCH)"
    fi
  else
    fail "Subagent limiter failed to parse tracker state"
  fi
  # Cleanup: remove the agent via verifier
  echo '{"session_id":"smoke-test","subagent_type":"test-agent","tool_response":{"output":"smoke test complete"}}' | node "$CLAUDE_DIR/hooks/subagent-verifier.js" 2>/dev/null
  rm -f "$AGENT_STATE_FILE" 2>/dev/null
else
  warn "Subagent tracker did not create state file (may be tmp dir issue)"
fi

# ─── 10b. Verify-completion.py key matches bridge file ──────────────
BRIDGE_KEY=$(node -e "const fs=require('fs'),os=require('os'),p=require('path');const sp=p.join(os.homedir(),'.claude','hooks','statusline.js');const c=fs.readFileSync(sp,'utf8');const m=c.match(/remaining_percentage|remaining_pct/g);console.log(m?m[0]:'unknown')" 2>/dev/null)
VERIFY_KEY=$(node -e "const fs=require('fs'),os=require('os'),p=require('path');const sp=p.join(os.homedir(),'.claude','hooks','verify-completion.py');const c=fs.readFileSync(sp,'utf8');const m=c.match(/ctx\.get\(['\"](\w+)['\"].*100\)/);console.log(m?m[1]:'unknown')" 2>/dev/null)
if [ "$BRIDGE_KEY" = "$VERIFY_KEY" ]; then
  pass "verify-completion.py key ('$VERIFY_KEY') matches bridge file ('$BRIDGE_KEY')"
else
  fail "verify-completion.py reads '$VERIFY_KEY' but bridge writes '$BRIDGE_KEY'"
fi

# ─── 11. Hook Registration Integrity (Drift Detection) ──────────────
echo "[11] Hook Registration Integrity"
DRIFT_RESULT=$(python3 -c "
import json, os, glob, re

settings_path = os.path.expanduser('~/.claude/settings.json')
hooks_dir = os.path.expanduser('~/.claude/hooks')

with open(settings_path) as f:
    settings = json.load(f)

# Extract hook file basenames from settings.json
registered = set()
for event_hooks in settings.get('hooks', {}).values():
    for entry in event_hooks:
        for hook in entry.get('hooks', []):
            cmd = hook.get('command', '')
            # Match hook file paths like ~/.claude/hooks/foo.js
            for m in re.finditer(r'~?/\.claude/hooks/([^\s|;]+\.(js|sh|py))', cmd):
                registered.add(m.group(1))
            # Match hooks/foo.sh patterns
            for m in re.finditer(r'hooks/([^\s|;]+\.(js|sh|py))', cmd):
                registered.add(m.group(1))

# Files used outside the hooks config (e.g. statusLine) — not orphans
NON_HOOK_FILES = {'statusline.js'}

# Get .js/.sh/.py files directly in hooks/ (not subdirectories)
on_disk = set()
for ext in ('*.js', '*.sh', '*.py'):
    for f in glob.glob(os.path.join(hooks_dir, ext)):
        name = os.path.basename(f)
        if name not in NON_HOOK_FILES:
            on_disk.add(name)

# settings entries pointing to missing files
for f in sorted(registered):
    if not os.path.exists(os.path.join(hooks_dir, f)):
        print(f'MISSING:{f}')

# hooks on disk not registered in settings
for f in sorted(on_disk):
    if f not in registered:
        print(f'ORPHAN:{f}')
" 2>/dev/null)

if [ -z "$DRIFT_RESULT" ]; then
  pass "No hook registration drift detected"
else
  echo "$DRIFT_RESULT" | while IFS= read -r line; do
    case "$line" in
      MISSING:*)
        fail "settings.json references missing hook: ${line#MISSING:}"
        ;;
      ORPHAN:*)
        warn "Hook on disk not registered in settings.json: ${line#ORPHAN:}"
        ;;
    esac
  done
fi

# ─── [12] Security Gate Secret Blocking ─────────────────────────────
echo "[12] Security Gate Secret Blocking"

# Test bash_hook blocks AWS key in echo
BASH_RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"echo AKIAIOSFODNN7EXAMPLE1 > /tmp/test"}}' | CLAUDE_PLUGIN_ROOT="$HOME/.claude/hooks/cctools-safety-hooks" python3 ~/.claude/hooks/cctools-safety-hooks/bash_hook.py 2>/dev/null)
if echo "$BASH_RESULT" | grep -q '"deny"'; then
  pass "bash_hook blocks AWS key in echo command"
else
  fail "bash_hook did NOT block AWS key in echo command"
fi

# Test bash_hook blocks private key header (no write indicator)
PRIVKEY_RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"grep -----BEGIN RSA PRIVATE KEY----- /tmp/file"}}' | CLAUDE_PLUGIN_ROOT="$HOME/.claude/hooks/cctools-safety-hooks" python3 ~/.claude/hooks/cctools-safety-hooks/bash_hook.py 2>/dev/null)
if echo "$PRIVKEY_RESULT" | grep -q '"deny"'; then
  pass "bash_hook blocks private key header unconditionally"
else
  fail "bash_hook did NOT block private key header"
fi

# Test bash_hook allows clean commands
CLEAN_RESULT=$(echo '{"tool_name":"Bash","tool_input":{"command":"ls -la /tmp"}}' | CLAUDE_PLUGIN_ROOT="$HOME/.claude/hooks/cctools-safety-hooks" python3 ~/.claude/hooks/cctools-safety-hooks/bash_hook.py 2>/dev/null)
if echo "$CLEAN_RESULT" | grep -q '"approve"'; then
  pass "bash_hook approves clean commands"
else
  fail "bash_hook did NOT approve clean command"
fi

# ─── [13] Context Guard Stale Metrics Warning ──────────────────────
echo "[13] Context Guard Stale Metrics Warning"

STALE_TS=$(($(date +%s) - 300))
STALE_METRICS_PATH="$(node -e "console.log(require('os').tmpdir())")/claude-ctx-smoketest.json"
echo "{\"timestamp\":$STALE_TS,\"remaining_percentage\":40}" > "$STALE_METRICS_PATH"

GUARD_RESULT=$(echo '{"session_id":"smoketest","tool_name":"Bash","tool_input":{}}' | node ~/.claude/hooks/context-guard.js 2>/dev/null)
rm -f "$STALE_METRICS_PATH"

if echo "$GUARD_RESULT" | grep -q 'additionalContext'; then
  pass "context-guard emits warning on stale metrics"
else
  fail "context-guard did NOT warn on stale metrics"
fi

# ─── [14] Post-Tool-Monitor Buffered I/O ───────────────────────────
echo "[14] Post-Tool-Monitor Buffered I/O"

# Verify the buffering logic exists in the file
if grep -q 'counts\[toolName\] % 10' ~/.claude/hooks/post-tool-monitor.js 2>/dev/null; then
  pass "post-tool-monitor has buffered I/O (flush every 10th call)"
else
  fail "post-tool-monitor missing buffered I/O logic"
fi

# ─── [15] Permissions Mode ─────────────────────────────────────────
echo "[15] Permissions Mode"

CURRENT_MODE=$(node -e "const s=JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude/settings.json','utf8'));console.log(s.defaultMode)" 2>/dev/null)
if [ "$CURRENT_MODE" = "allowedTools" ]; then
  pass "settings.json defaultMode is allowedTools (not bypassPermissions)"
else
  warn "settings.json defaultMode is '$CURRENT_MODE' (expected allowedTools)"
fi

PERM_ALLOW=$(node -e "const s=JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude/settings.json','utf8'));console.log((s.permissions&&s.permissions.allow||[]).length)" 2>/dev/null)
if [ "$PERM_ALLOW" -gt 0 ] 2>/dev/null; then
  pass "settings.json has permissions.allow list ($PERM_ALLOW tools)"
else
  fail "settings.json missing permissions.allow list"
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
