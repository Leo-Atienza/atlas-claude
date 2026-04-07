#!/bin/bash
# Smoke Test — Validates pipeline-driven system infrastructure
# Run: bash ~/.claude/scripts/smoke-test.sh
# Returns: 0 if all pass, 1 if any critical test fails

set -u
PASS=0; FAIL=0; WARN=0
CLAUDE_DIR="$HOME/.claude"

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }

echo "=== Claude System Smoke Test ==="
echo ""

# ─── 1. Core Files ──────────────────────────────────────────────────
echo "[1] Core Files"
for f in CLAUDE.md settings.json; do
  [ -f "$CLAUDE_DIR/$f" ] && pass "$f exists" || fail "$f MISSING"
done

CLAUDE_SIZE=$(wc -c < "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null || echo "0")
if [ "$CLAUDE_SIZE" -lt 1024 ]; then
  fail "CLAUDE.md suspiciously small (${CLAUDE_SIZE} bytes)"
else
  pass "CLAUDE.md size OK (${CLAUDE_SIZE} bytes)"
fi

# Verify key sections of pipeline CLAUDE.md
for section in "The Pipeline" "Skills & Knowledge" "Graceful Degradation"; do
  grep -q "$section" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null && pass "CLAUDE.md has '$section'" || fail "CLAUDE.md missing '$section'"
done

SETTINGS_WIN=$(cygpath -w "$CLAUDE_DIR/settings.json" 2>/dev/null || echo "$CLAUDE_DIR/settings.json")
node -e "JSON.parse(require('fs').readFileSync(String.raw\`$SETTINGS_WIN\`,'utf8'))" 2>/dev/null \
  && pass "settings.json valid JSON" || fail "settings.json INVALID JSON"

# ─── 2. Skills Directory/Page System ────────────────────────────────
echo "[2] Skills Directory/Page"
[ -f "$CLAUDE_DIR/skills/ACTIVE-DIRECTORY.md" ]          && pass "ACTIVE-DIRECTORY.md" || fail "ACTIVE-DIRECTORY.md MISSING"
[ -f "$CLAUDE_DIR/skills/ACTIVE-PAGE-1-web-frontend.md" ] && pass "ACTIVE-PAGE-1" || fail "ACTIVE-PAGE-1 MISSING"
[ -f "$CLAUDE_DIR/skills/ACTIVE-PAGE-2-backend-tools.md" ] && pass "ACTIVE-PAGE-2" || fail "ACTIVE-PAGE-2 MISSING"
[ -f "$CLAUDE_DIR/skills/ACTIVE-PAGE-3-native-crossplatform.md" ] && pass "ACTIVE-PAGE-3" || fail "ACTIVE-PAGE-3 MISSING"
[ -f "$CLAUDE_DIR/skills/ARCHIVE-DIRECTORY.md" ]          && pass "ARCHIVE-DIRECTORY.md" || fail "ARCHIVE-DIRECTORY.md MISSING"
for i in 1 2 3 4 5 6 7; do
  ls "$CLAUDE_DIR/skills/ARCHIVE-PAGE-$i"-*.md >/dev/null 2>&1 && pass "ARCHIVE-PAGE-$i" || fail "ARCHIVE-PAGE-$i MISSING"
done

# ─── 3. Knowledge Store ─────────────────────────────────────────────
echo "[3] Knowledge Store"
[ -f "$CLAUDE_DIR/topics/KNOWLEDGE-DIRECTORY.md" ]       && pass "KNOWLEDGE-DIRECTORY.md" || fail "KNOWLEDGE-DIRECTORY.md MISSING"
[ -f "$CLAUDE_DIR/topics/KNOWLEDGE-PAGE-1-patterns.md" ] && pass "KNOWLEDGE-PAGE-1" || fail "KNOWLEDGE-PAGE-1 MISSING"
[ -f "$CLAUDE_DIR/topics/KNOWLEDGE-PAGE-2-solutions.md" ] && pass "KNOWLEDGE-PAGE-2" || fail "KNOWLEDGE-PAGE-2 MISSING"
[ -f "$CLAUDE_DIR/topics/KNOWLEDGE-PAGE-3-errors.md" ]   && pass "KNOWLEDGE-PAGE-3" || fail "KNOWLEDGE-PAGE-3 MISSING"

# ─── 4. Project Templates ───────────────────────────────────────────
echo "[4] Templates"
for t in nextjs-saas landing-page expo-app api-service; do
  [ -f "$CLAUDE_DIR/skills/templates/$t.md" ] && pass "template/$t" || fail "template/$t MISSING"
done

# ─── 5. Hook Scripts Exist ──────────────────────────────────────────
echo "[5] Hooks"
for h in context-guard.js \
         post-tool-monitor.js tool-failure-handler.js session-start.sh session-stop.sh \
         statusline.js; do
  [ -f "$CLAUDE_DIR/hooks/$h" ] && pass "$h" || fail "$h MISSING"
done
[ -f "$CLAUDE_DIR/scripts/progressive-learning/precompact-reflect.sh" ] \
  && pass "precompact-reflect.sh" || fail "precompact-reflect.sh MISSING"

# ─── 6. Stale References ────────────────────────────────────────────
echo "[6] Stale References"
! grep -q 'REGISTRY\.md' "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null \
  && pass "No REGISTRY.md refs in CLAUDE.md" || warn "CLAUDE.md still references REGISTRY.md"
! grep -qi 'PLAYBOOK' "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null \
  && pass "No PLAYBOOK refs in CLAUDE.md" || warn "CLAUDE.md still references PLAYBOOKs"
! test -f "$CLAUDE_DIR/skills/REGISTRY.md" \
  && pass "Old REGISTRY.md removed" || warn "Old REGISTRY.md still on disk"
! grep -q 'rules/' "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null \
  && pass "No rules/ refs in CLAUDE.md" || warn "CLAUDE.md still references rules/"
! test -d "$CLAUDE_DIR/rules" \
  && pass "Old rules/ directory removed" || warn "Old rules/ directory still on disk"

# ─── 7. Security ────────────────────────────────────────────────────
echo "[7] Security"
CURRENT_MODE=$(node -e "const s=JSON.parse(require('fs').readFileSync(String.raw\`$SETTINGS_WIN\`,'utf8'));console.log(s.defaultMode)" 2>/dev/null)
[ "$CURRENT_MODE" = "allowedTools" ] && pass "defaultMode=allowedTools" || warn "defaultMode=$CURRENT_MODE"
! grep -q "BYPASS_SAFETY_HOOKS" "$CLAUDE_DIR/settings.json" 2>/dev/null \
  && pass "No BYPASS_SAFETY_HOOKS" || fail "BYPASS_SAFETY_HOOKS found"

# ─── 8. Symlink Health ──────────────────────────────────────────────
echo "[8] Symlink Health"
symlink_ok=0; symlink_broken=0
for link in "$CLAUDE_DIR/skills"/*/; do
  [ -L "${link%/}" ] || continue
  if [ -e "${link%/}" ]; then
    symlink_ok=$((symlink_ok + 1))
  else
    target=$(readlink "${link%/}" 2>/dev/null || echo "unknown")
    warn "Broken symlink: $(basename "${link%/}") -> $target"
    symlink_broken=$((symlink_broken + 1))
  fi
done
[ "$symlink_broken" -eq 0 ] && pass "All $symlink_ok symlinks resolve" || true

# ─── 9. Context Thresholds Config ──────────────────────────────────
echo "[9] Context Thresholds"
THRESHOLDS_FILE="$CLAUDE_DIR/hooks/context-thresholds.json"
if [ -f "$THRESHOLDS_FILE" ]; then
  node -e "
    const t = JSON.parse(require('fs').readFileSync(String.raw\`$(cygpath -w "$THRESHOLDS_FILE" 2>/dev/null || echo "$THRESHOLDS_FILE")\`,'utf8'));
    const th = t.thresholds;
    let ok = true;
    for (const [name, cfg] of Object.entries(th)) {
      if (typeof cfg.remaining_pct !== 'number' || cfg.remaining_pct < 0 || cfg.remaining_pct > 100) {
        console.log('INVALID: ' + name + '.remaining_pct = ' + cfg.remaining_pct);
        ok = false;
      }
    }
    // Verify ordering: warning > auto_continuation > guard_block > critical
    if (th.warning.remaining_pct <= th.auto_continuation.remaining_pct) {
      console.log('INVALID: warning must be > auto_continuation');
      ok = false;
    }
    if (th.auto_continuation.remaining_pct <= th.guard_block.remaining_pct) {
      console.log('INVALID: auto_continuation must be > guard_block');
      ok = false;
    }
    if (th.guard_block.remaining_pct <= th.critical.remaining_pct) {
      console.log('INVALID: guard_block must be > critical');
      ok = false;
    }
    process.exit(ok ? 0 : 1);
  " 2>/dev/null && pass "Thresholds valid and ordered" || fail "Thresholds invalid or misordered"
else
  fail "context-thresholds.json MISSING"
fi

# ─── 10. Hook Executability ────────────────────────────────────────
echo "[10] Hook Executability"
for h in "$CLAUDE_DIR/hooks"/*.js; do
  [ -f "$h" ] || continue
  [ -r "$h" ] && pass "$(basename "$h") readable" || fail "$(basename "$h") NOT readable"
done
for h in "$CLAUDE_DIR/hooks"/*.sh; do
  [ -f "$h" ] || continue
  [ -x "$h" ] && pass "$(basename "$h") executable" || warn "$(basename "$h") not executable"
done

# ─── Summary ────────────────────────────────────────────────────────
echo ""
echo "=== Results: $PASS passed, $FAIL failed, $WARN warnings ==="
[ "$FAIL" -eq 0 ] && echo "STATUS: HEALTHY" || echo "STATUS: ISSUES FOUND"
exit $FAIL
