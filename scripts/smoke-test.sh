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

# ─── 11. Hook Functional Tests ─────────────────────────────────────
echo "[11] Hook Functional Tests"

# Test context-guard.js: should allow Read tool (always-allowed)
GUARD_RESULT=$(echo '{"session_id":"test-smoke","tool_name":"Read","tool_input":{}}' \
  | node "$CLAUDE_DIR/hooks/context-guard.js" 2>/dev/null; echo "EXIT:$?")
echo "$GUARD_RESULT" | grep -q "EXIT:0" \
  && pass "context-guard allows Read tool" || fail "context-guard blocks Read tool"

# Test context-guard.js: should block writes to .env files
GUARD_BLOCK=$(echo '{"session_id":"test-smoke","tool_name":"Write","tool_input":{"file_path":"/tmp/test/.env","content":"test"}}' \
  | node "$CLAUDE_DIR/hooks/context-guard.js" 2>/dev/null)
echo "$GUARD_BLOCK" | grep -qi "block\|sensitive" \
  && pass "context-guard blocks .env writes" || fail "context-guard does NOT block .env writes"

# Test context-guard.js: should block content with AWS keys
GUARD_SECRET=$(echo '{"session_id":"test-smoke","tool_name":"Edit","tool_input":{"file_path":"/tmp/test.js","new_string":"const key = AKIA1234567890123456"}}' \
  | node "$CLAUDE_DIR/hooks/context-guard.js" 2>/dev/null)
echo "$GUARD_SECRET" | grep -qi "block\|secret" \
  && pass "context-guard blocks AWS key content" || fail "context-guard does NOT block AWS keys"

# Test post-tool-monitor.js: should exit cleanly on valid input
echo '{"session_id":"test-smoke","tool_name":"Read","tool_input":{},"tool_response":"ok"}' \
  | node "$CLAUDE_DIR/hooks/post-tool-monitor.js" >/dev/null 2>&1
[ $? -eq 0 ] && pass "post-tool-monitor runs cleanly" || fail "post-tool-monitor crashes"

# Test tool-failure-handler.js: should exit cleanly
echo '{"session_id":"test-smoke","tool_name":"Bash","tool_input":{"command":"ls"},"tool_response":{"error":"test"}}' \
  | node "$CLAUDE_DIR/hooks/tool-failure-handler.js" >/dev/null 2>&1
[ $? -eq 0 ] && pass "tool-failure-handler runs cleanly" || fail "tool-failure-handler crashes"

# Test lib.js: should be require-able without errors
HOOKS_WIN=$(cygpath -w "$CLAUDE_DIR/hooks" 2>/dev/null || echo "$CLAUDE_DIR/hooks")
node -e "require(String.raw\`$HOOKS_WIN\` + '/lib')" 2>/dev/null \
  && pass "lib.js loads without errors" || fail "lib.js fails to load"

# Test atlas-kg.js: should be require-able and support stats
node -e "const kg = require(String.raw\`$HOOKS_WIN\` + '/atlas-kg'); const s = kg.stats(); console.log(s.entities >= 0 ? 'OK' : 'FAIL')" 2>/dev/null | grep -q "OK" \
  && pass "atlas-kg.js loads and queries" || fail "atlas-kg.js broken"

# Test statusline.js: should exit cleanly
timeout 3 node "$CLAUDE_DIR/hooks/statusline.js" >/dev/null 2>&1; EXIT=$?
[ "$EXIT" -eq 0 ] || [ "$EXIT" -eq 143 ] \
  && pass "statusline.js runs without crash" || warn "statusline.js exit code $EXIT"

# ─── 12. Atlas KG Integrity ──────────────────────────────────────────
echo "[12] Atlas KG Integrity"
KG_DIR="$CLAUDE_DIR/atlas-kg"
for f in entities.json triples.json; do
  KG_PATH="$KG_DIR/$f"
  if [ -f "$KG_PATH" ]; then
    KG_WIN=$(cygpath -w "$KG_PATH" 2>/dev/null || echo "$KG_PATH")
    node -e "JSON.parse(require('fs').readFileSync(String.raw\`$KG_WIN\`,'utf8'))" 2>/dev/null \
      && pass "$f valid JSON" || fail "$f INVALID JSON"
  else
    warn "$f not found (KG may be empty)"
  fi
done

# Check for orphaned triple references
if [ -f "$KG_DIR/entities.json" ] && [ -f "$KG_DIR/triples.json" ]; then
  ENT_WIN=$(cygpath -w "$KG_DIR/entities.json" 2>/dev/null || echo "$KG_DIR/entities.json")
  TRP_WIN=$(cygpath -w "$KG_DIR/triples.json" 2>/dev/null || echo "$KG_DIR/triples.json")
  node -e "
    const fs = require('fs');
    const e = JSON.parse(fs.readFileSync(String.raw\`$ENT_WIN\`,'utf8'));
    const t = JSON.parse(fs.readFileSync(String.raw\`$TRP_WIN\`,'utf8'));
    let orphans = 0;
    for (const tr of Object.values(t)) {
      if (!e[tr.subject]) orphans++;
      if (!e[tr.object]) orphans++;
    }
    if (orphans > 0) { console.log(orphans + ' orphaned refs'); process.exit(1); }
  " 2>/dev/null && pass "No orphaned triple references" || warn "Orphaned triple refs found"

  # Check for unknown-type entities
  node -e "
    const e = JSON.parse(require('fs').readFileSync(String.raw\`$ENT_WIN\`,'utf8'));
    const unknowns = Object.values(e).filter(x => x.type === 'unknown');
    if (unknowns.length > 0) { console.log(unknowns.length + ' unknown-type entities'); process.exit(1); }
  " 2>/dev/null && pass "All entities have types" || warn "Unknown-type entities found"
fi

# ─── 13. Memory System ──────────────────────────────────────────────
echo "[13] Memory System"
MEMORY_DIR="$CLAUDE_DIR/projects/C--Users-leooa--claude/memory"
if [ -f "$MEMORY_DIR/MEMORY.md" ]; then
  pass "MEMORY.md exists"
  BROKEN_REFS=""
  while IFS= read -r ref; do
    [ -f "$MEMORY_DIR/$ref" ] || BROKEN_REFS="${BROKEN_REFS} $ref"
  done < <(grep -oP '\[.*?\]\(\K[^)]+' "$MEMORY_DIR/MEMORY.md" 2>/dev/null || true)
  [ -z "$BROKEN_REFS" ] && pass "All MEMORY.md refs resolve" || warn "Broken memory refs:$BROKEN_REFS"
else
  warn "MEMORY.md not found"
fi

# ─── 14. G-ERR-014 Regression Guard ─────────────────────────────────
# Detects the `node -e` path-literal antipattern that causes `C:\c\Users\...`
# ENOENT failures on Windows Git Bash. See topics/KNOWLEDGE-PAGE-3-errors.md.
# Scans for same-line `node -e` + quoted `/c/` or `C:/` literal,
# excluding known-safe idioms (cygpath, String.raw, process.argv).
# Excludes this file itself (contains the detection regex in source).
echo "[14] G-ERR-014 Regression Guard"
NODE_E_BAD=$(grep -rEn --exclude="smoke-test.sh" \
  "node -e.*['\"](/c/|C:/)" \
  "$CLAUDE_DIR/hooks" "$CLAUDE_DIR/scripts" 2>/dev/null \
  | grep -vE "cygpath|String\.raw|process\.argv" \
  || true)
if [ -n "$NODE_E_BAD" ]; then
  fail "G-ERR-014 regression: literal /c/ or C:/ inside node -e string"
  printf '%s\n' "$NODE_E_BAD" | sed 's|^|    |'
  echo "    Fix: argv-pass, cygpath+String.raw, or os.homedir(). See topics/KNOWLEDGE-PAGE-3-errors.md#g-err-014"
else
  pass "No G-ERR-014 bad patterns (hooks/ + scripts/)"
fi

# ─── 15. v7.0 Cleanup Engine ────────────────────────────────────────
echo "[15] v7.0 Cleanup Engine"
if [ -f "$CLAUDE_DIR/hooks/cleanup-runner.js" ] && [ -f "$CLAUDE_DIR/hooks/cleanup-config.json" ]; then
  pass "cleanup-runner.js + cleanup-config.json present"
  CFG_WIN=$(cygpath -w "$CLAUDE_DIR/hooks/cleanup-config.json" 2>/dev/null || echo "$CLAUDE_DIR/hooks/cleanup-config.json")
  RULE_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync(String.raw\`$CFG_WIN\`,'utf8')).rules.length)" 2>/dev/null || echo "0")
  if [ "$RULE_COUNT" -ge 13 ]; then
    pass "cleanup-config.json has $RULE_COUNT rules (expected >= 13)"
  else
    fail "cleanup-config.json has $RULE_COUNT rules (expected >= 13)"
  fi
  # Dry-run exits 0
  if node "$CLAUDE_DIR/hooks/cleanup-runner.js" --dry-run >/dev/null 2>&1; then
    pass "cleanup-runner.js --dry-run exits 0"
  else
    fail "cleanup-runner.js --dry-run failed"
  fi
else
  fail "cleanup-runner.js or cleanup-config.json MISSING"
fi

# ─── 16. v7.0 Skill Usage Log ───────────────────────────────────────
echo "[16] v7.0 Skill Usage Log"
if [ -f "$CLAUDE_DIR/hooks/skill-usage-log.js" ]; then
  pass "skill-usage-log.js present"
else
  fail "skill-usage-log.js MISSING"
fi
# Hook must be wired in settings.json as a PreToolUse Skill matcher
if grep -q 'skill-usage-log.js' "$CLAUDE_DIR/settings.json" 2>/dev/null; then
  pass "settings.json wires skill-usage-log.js"
else
  fail "settings.json does NOT reference skill-usage-log.js"
fi
# Log file either exists or will be created — just verify directory writable
if [ -d "$CLAUDE_DIR/logs" ]; then
  pass "logs/ directory exists for skill-usage.jsonl"
else
  fail "logs/ directory MISSING"
fi

# ─── 17. v7.0 Observability Dashboard ───────────────────────────────
echo "[17] v7.0 Observability Dashboard"
if [ -f "$CLAUDE_DIR/scripts/observability.js" ]; then
  pass "observability.js present"
  # Run it and count rendered sections (## headers)
  SECTION_COUNT=$(node "$CLAUDE_DIR/scripts/observability.js" 2>/dev/null | grep -c '^## ' || echo "0")
  if [ "$SECTION_COUNT" -ge 6 ]; then
    pass "observability.js renders $SECTION_COUNT sections (expected >= 6)"
  else
    fail "observability.js renders $SECTION_COUNT sections (expected >= 6)"
  fi
else
  fail "observability.js MISSING"
fi
if [ -f "$CLAUDE_DIR/commands/observe.md" ]; then
  pass "/observe command present"
else
  fail "/observe command MISSING"
fi

# ─── 18. v7.0 Drift Proposer ────────────────────────────────────────
echo "[18] v7.0 Drift Proposer"
if [ -f "$CLAUDE_DIR/hooks/drift-proposer.js" ] && [ -f "$CLAUDE_DIR/hooks/drift-thresholds.json" ]; then
  pass "drift-proposer.js + drift-thresholds.json present"
  # Thresholds JSON parse
  THR_WIN=$(cygpath -w "$CLAUDE_DIR/hooks/drift-thresholds.json" 2>/dev/null || echo "$CLAUDE_DIR/hooks/drift-thresholds.json")
  node -e "JSON.parse(require('fs').readFileSync(String.raw\`$THR_WIN\`,'utf8'))" 2>/dev/null \
    && pass "drift-thresholds.json valid JSON" || fail "drift-thresholds.json INVALID JSON"
  # Proposer exits 0 in clean system
  if node "$CLAUDE_DIR/hooks/drift-proposer.js" >/dev/null 2>&1; then
    pass "drift-proposer.js exits 0"
  else
    fail "drift-proposer.js returns non-zero"
  fi
else
  fail "drift-proposer.js or drift-thresholds.json MISSING"
fi
if [ -f "$CLAUDE_DIR/commands/apply-drift-fix.md" ]; then
  pass "/apply-drift-fix command present"
else
  fail "/apply-drift-fix command MISSING"
fi

# ─── Summary ────────────────────────────────────────────────────────
echo ""
echo "=== Results: $PASS passed, $FAIL failed, $WARN warnings ==="
[ "$FAIL" -eq 0 ] && echo "STATUS: HEALTHY" || echo "STATUS: ISSUES FOUND"
exit $FAIL
