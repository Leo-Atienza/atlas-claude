#!/bin/bash
# SessionStart hook — slim version (rebuild 2026-04-06)
# Sections: conflicts, handoff, version check, log rotation, health summary, debug cleanup, stale temp cleanup, weekly backup

HOME_DIR="$HOME"
CLAUDE_DIR="$HOME_DIR/.claude"
NOW=$(date +%s)

# ─── 1. Session context (per-CWD handoff — no cross-project pollution) ─
# Slug the CWD the same way session-stop.sh does so this session only sees
# the handoff from the previous session *in this folder*.
cwd_slug() {
  printf '%s' "$1" | sed -e 's|[/\\:]|_|g' -e 's|__*|_|g' -e 's|^_||' -e 's|_$||'
}
HANDOFFS_DIR="$CLAUDE_DIR/handoffs"
CWD_SLUG=$(cwd_slug "$(pwd)")
HANDOFF_FILE="$HANDOFFS_DIR/${CWD_SLUG}.md"
SESSION_HOT_FILE="$CLAUDE_DIR/cache/session-hot/${CWD_SLUG}.md"

# Prefer L1 hot cache (denser, ≤500 tokens) when fresh; fall back to L2 handoff.
# Hot cache goes stale after 7 days — older sessions fall through to handoff
# (which has its own 14-day prune in §1 below).
if [ -f "$SESSION_HOT_FILE" ] && [ -z "$(find "$SESSION_HOT_FILE" -mtime +7 2>/dev/null)" ]; then
  echo "SESSION HOT CACHE (per-CWD, L1):"
  cat "$SESSION_HOT_FILE"
  echo ""
  echo "Use /resume to continue where you left off."
elif [ -f "$HANDOFF_FILE" ]; then
  echo "SESSION HANDOFF from previous session in this folder:"
  cat "$HANDOFF_FILE"
  echo "Use /resume to continue where you left off."
fi

# Prune stale hot cache entries (14d — same window as handoffs)
SESSION_HOT_DIR="$CLAUDE_DIR/cache/session-hot"
if [ -d "$SESSION_HOT_DIR" ]; then
  find "$SESSION_HOT_DIR" -maxdepth 1 -name '*.md' -mtime +14 -delete 2>/dev/null || true
fi

# Prune stale per-CWD handoffs (14 days) so abandoned projects don't leak
if [ -d "$HANDOFFS_DIR" ]; then
  find "$HANDOFFS_DIR" -maxdepth 1 -name '*.md' -mtime +14 -delete 2>/dev/null || true
fi

# One-time migration: retire the old global file so nothing stale remains
STALE_GLOBAL="$CLAUDE_DIR/.last-session-handoff"
if [ -f "$STALE_GLOBAL" ]; then
  mkdir -p "$CLAUDE_DIR/TRASH" 2>/dev/null || true
  mv "$STALE_GLOBAL" "$CLAUDE_DIR/TRASH/.last-session-handoff.$(date +%s)" 2>/dev/null || true
fi

# ─── 2. Claude Code version check (daily-gated, v8.14) ──────────────
# `claude --version` cold-starts the whole CLI (~0.5-1s) — running it every
# SessionStart was the single largest §-cost. Gate to once/24h via file mtime;
# an upgrade is still announced on the first session of the day after it lands.
VERSION_FILE="$CLAUDE_DIR/.claude-code-version"
if [ ! -f "$VERSION_FILE" ] || [ -n "$(find "$VERSION_FILE" -mtime +0 2>/dev/null)" ]; then
  CURRENT_VER=$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  if [ -n "$CURRENT_VER" ]; then
    STORED_VER=$(cat "$VERSION_FILE" 2>/dev/null)
    if [ -n "$STORED_VER" ] && [ "$CURRENT_VER" != "$STORED_VER" ]; then
      echo "CLAUDE CODE UPDATED: v$STORED_VER -> v$CURRENT_VER"
      # v8.15: a CLI update is exactly when the hook-output contract can move
      # (KNOWLEDGE-162) — re-verify emission envelopes now, not at the next
      # weekly smoke run. ~1s, only on the first session after an upgrade.
      FIXOUT=$(node "$CLAUDE_DIR/scripts/hook-fixtures.js" --summary 2>/dev/null)
      echo "HOOK-FIXTURES (post-update): ${FIXOUT:-FAILED TO RUN — node ~/.claude/scripts/hook-fixtures.js}"
    fi
    echo "$CURRENT_VER" > "$VERSION_FILE"
  fi
fi

# ─── 3. Log rotation (line-count cap: keep last 500 lines) ──────────
LOGS_DIR="$CLAUDE_DIR/logs"
if [ -d "$LOGS_DIR" ]; then
  for logfile in "$LOGS_DIR"/hook-health.jsonl "$LOGS_DIR"/tool-failures.jsonl "$LOGS_DIR"/skill-usage.jsonl "$LOGS_DIR"/cleanup.jsonl "$LOGS_DIR"/local-llm-reads.jsonl "$LOGS_DIR"/action-graph-stats.jsonl "$LOGS_DIR"/subagent-stats.jsonl "$LOGS_DIR"/user-rejections.jsonl "$LOGS_DIR"/preview-health-gate.jsonl "$LOGS_DIR"/validator-sweep.jsonl; do
    if [ -f "$logfile" ]; then
      LINES=$(wc -l < "$logfile" 2>/dev/null || echo 0)
      if [ "$LINES" -gt 500 ]; then
        tail -500 "$logfile" > "${logfile}.tmp" && mv "${logfile}.tmp" "$logfile"
      fi
    fi
  done
fi

# ─── 4. Error pattern TTL (remove entries older than 7 days) ────────
EP_FILE="$LOGS_DIR/error-patterns.json"
if [ -f "$EP_FILE" ]; then
  node -e '
    const fs = require("fs");
    try {
      const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let changed = false;
      for (const [k, v] of Object.entries(p)) {
        const lastSeen = new Date(v.last_seen || v.first_seen || 0).getTime();
        if (lastSeen < cutoff) { delete p[k]; changed = true; }
      }
      const entries = Object.entries(p);
      if (entries.length > 100) {
        entries.sort(([,a],[,b]) => new Date(b.last_seen||0) - new Date(a.last_seen||0));
        const kept = Object.fromEntries(entries.slice(0, 100));
        fs.writeFileSync(process.argv[1], JSON.stringify(kept));
      } else if (changed) {
        fs.writeFileSync(process.argv[1], JSON.stringify(p));
      }
    } catch(e) {}
  ' "$EP_FILE" 2>/dev/null
fi

# ─── 5. Health summary (surfaces recurring errors + unhealthy tools)
health_messages=""

if [ -f "$EP_FILE" ]; then
  recurring=$(node -e '
    try {
      const p = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
      const hot = Object.values(p).filter(e => e.count >= 5).sort((a,b) => b.count - a.count).slice(0,3);
      if (hot.length) {
        const lines = hot.map(e => "  " + e.tool + " (" + e.count + "x): " + (e.sample||"").slice(0,60));
        console.log("Recurring errors:\n" + lines.join("\n"));
      }
    } catch(e) {}
  ' "$EP_FILE" 2>/dev/null)
  [ -n "$recurring" ] && health_messages="${health_messages}${recurring}\n"
fi

TH_FILE="$LOGS_DIR/tool-health.json"
SUPPRESS_FILE="$LOGS_DIR/health-suppress.json"
if [ -f "$TH_FILE" ]; then
  unhealthy=$(node -e '
    const fs = require("fs");
    try {
      const h = JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const suppressPath = process.argv[2];
      let suppress = {};
      try { suppress = JSON.parse(fs.readFileSync(suppressPath,"utf8")); } catch(_) {}

      // Tools whose failures are dominated by transient/self-inflicted noise
      // (test harness, EOF, ENOENT) rather than a tool defect. Their streak is
      // tracked but never surfaced or counted, so they do not dilute the signal.
      // StructuredOutput added 2026-06-09: its failures are Workflow-subagent
      // schema-validation retries — the harness retries until the output
      // validates, so they self-heal and are not a tool defect.
      // PowerShell + Read added 2026-06-24: PowerShell failures are usage-level
      // exit-1s (Unix-isms like `head`/`-MaxDepth` in PS, and foreign-project
      // build scripts), and Read failures are EISDIR / file-not-found probes —
      // both are operator/usage noise on a Windows host, not a tool defect.
      const BENIGN = new Set(["Bash", "StructuredOutput", "PowerShell", "Read"]);
      // Known-diagnosed chronic failures (v10.2 audit 2026-07-24): the nag used to
      // say "investigate or disable" even after the cause was found, re-spending an
      // investigation every 5 sessions. The diagnosis now rides along with the nag.
      const DIAGNOSED = {
        "mcp__Claude_Browser__computer": "diagnosed 2026-07-23, not a tool defect: Browser pane closed (only the user can open it) or data:-snapshot tab for files outside the project. Use shot.mjs headless instead; never retry-loop.",
        "mcp__Claude_Browser__navigate": "same diagnosis family as computer: pane closed or dev server down. One tabs_context/preview_logs check, then shot.mjs.",
      };
      const RESURFACE_EVERY = 5; // re-show a chronic issue every Nth session, never permanently silent
      if (h.tools) {
        const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        const bad = Object.entries(h.tools)
          .map(([t, v]) => {
            const recent = (v.failures || []).filter(ts => ts > cutoff).length;
            const isMcp = v.is_mcp || /^mcp__/.test(t);
            return [t, recent, isMcp];
          })
          .filter(([, recent]) => recent >= 3)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8);

        // Decay: only tools unhealthy THIS session carry a streak forward; any
        // tool that recovered (dropped out of `bad`) is absent from newSuppress,
        // so its streak resets to 0 instead of lingering forever.
        const newSuppress = {};
        let suppressed = 0;
        const nativeShow = [];
        const mcpShow = [];
        const chronicShow = [];
        for (const [t, n, isMcp] of bad) {
          const streak = (suppress[t] || 0) + 1;
          newSuppress[t] = streak;
          if (BENIGN.has(t)) continue; // noise — tracked but never surfaced/counted
          const server = isMcp ? (t.split("__")[1] || "unknown") : null;
          const tag = isMcp ? " [server: " + server + "]" : "";
          if (streak < 5) {
            (isMcp ? mcpShow : nativeShow).push("  " + t + ": " + n + " failures (last 48h)" + tag);
          } else if (streak % RESURFACE_EVERY === 0) {
            // Chronic but periodically re-surfaced so it never stays silent forever.
            const diag = DIAGNOSED[t];
            chronicShow.push("  " + t + ": still failing after " + streak + " sessions (" + n + " in last 48h)" + tag + (diag ? " — known cause: " + diag : " — investigate or disable"));
          } else {
            suppressed++;
          }
        }
        fs.writeFileSync(suppressPath, JSON.stringify(newSuppress));

        const lines = [];
        if (nativeShow.length) lines.push("Unhealthy tools:\n" + nativeShow.join("\n"));
        if (mcpShow.length) lines.push("Unhealthy MCP tools (consider disabling in .mcp.json if not needed):\n" + mcpShow.join("\n"));
        if (chronicShow.length) lines.push("Chronic tool issues:\n" + chronicShow.join("\n"));
        if (suppressed > 0) lines.push("  (" + suppressed + " known chronic issue(s) suppressed)");
        if (lines.length) console.log(lines.join("\n"));
      }
    } catch(e) {}
  ' "$TH_FILE" "$SUPPRESS_FILE" 2>/dev/null)
  [ -n "$unhealthy" ] && health_messages="${health_messages}${unhealthy}\n"
fi

if [ -n "$health_messages" ]; then
  echo "HEALTH SUMMARY:"
  echo -e "$health_messages"
fi

# ─── 6. Project wiki context ───────────────────────────────────────
CWD=$(pwd)
if [ -f "$CWD/wiki/index.md" ]; then
  WIKI_PAGES=$(grep -c '|.*\.md.*|' "$CWD/wiki/index.md" 2>/dev/null || echo 0)
  DECISION_COUNT=$(find "$CWD/wiki/decisions" -name "*.md" 2>/dev/null | wc -l)
  echo "PROJECT_WIKI:"
  echo "  pages: $WIKI_PAGES, decisions: $DECISION_COUNT"
  echo "  Read wiki/index.md for past decisions and context."
fi

# ─── 6a. Global wiki hot cache (Karpathy LLM Wiki pattern) ─────────
# Surfaces the last 5 entries of <your-vault-path>/wiki/hot.md so the
# global personal wiki is visible at session start, the way LIVING
# MEMORY core is auto-injected (§7l). Gated by mtime — only prints if
# hot.md was touched in the last 30 days. Stays silent when the wiki
# is dormant rather than nagging. Tier 2C of plans/obsidian-revival-
# handoff-tier-2-3.md.
WIKI_HOT="$HOME_DIR/Documents/Wiki/wiki/hot.md"
# Regenerate hot.md from vault fs activity first (added 2026-06-09: only the
# wiki-manage ingest path wrote hot.md, so the surface went dark ~2026-06-05
# while engineering/personal pages were written daily). Self-throttled: skipped
# while hot.md is <24h old; also runs if hot.md is missing. Fail-open.
if [ ! -f "$WIKI_HOT" ] || [ -n "$(find "$WIKI_HOT" -mtime +0 2>/dev/null)" ]; then
  node "$CLAUDE_DIR/scripts/wiki-hot-refresh.js" --quiet 2>/dev/null || true
fi
if [ -f "$WIKI_HOT" ] && [ -z "$(find "$WIKI_HOT" -mtime +30 2>/dev/null)" ]; then
  WIKI_ROWS=$(grep -E '^\|' "$WIKI_HOT" 2>/dev/null \
    | grep -v -E '^\|\s*-+|^\|\s*Page\s*\|' \
    | head -5)
  if [ -n "$WIKI_ROWS" ]; then
    echo "WIKI HOT CACHE (<your-vault-path>/wiki/hot.md, last 5 entries):"
    echo "$WIKI_ROWS"
    echo "  Use /wiki-query <topic> or read <your-vault-path>/wiki/index.md for full catalog."
    echo ""
  fi
fi

# ─── 6b. Pending wiki ingest backlog (raw/ drops not yet compiled) ──
# Surfaces clipped-but-uncompiled sources so the raw -> wiki/source sync
# doesn't silently rot. The detector self-gates (silent when backlog==0)
# and throttles (<=once/24h via cache/wiki-ingest-pending.json), matching
# 6a's "stay silent when dormant rather than nagging" philosophy. Compile
# stays human-in-the-loop (/wiki-ingest); this only reminds. Fail-open.
# Spawn-gate (added 2026-06-20): wiki-ingest-pending.js runs a FULL vault scan
# (readdir raw/ + read every source/synthesis/concept/entity page) on every
# invocation, BEFORE its own 24h surface-throttle is consulted. Gate the spawn
# itself on a 24h stamp so the scan runs at most once/day. Surfacing is already
# throttled to 24h inside the script, so this is behaviour-preserving — it only
# stops re-scanning the vault on every session within the window. Mirrors §6a.
INGEST_STAMP="$CLAUDE_DIR/cache/wiki-ingest-check.stamp"
if [ ! -f "$INGEST_STAMP" ] || [ -n "$(find "$INGEST_STAMP" -mtime +0 2>/dev/null)" ]; then
  PENDING_INGEST=$(node "$CLAUDE_DIR/scripts/wiki-ingest-pending.js" --surface 2>/dev/null)
  touch "$INGEST_STAMP" 2>/dev/null || true
  if [ -n "$PENDING_INGEST" ]; then
    echo "$PENDING_INGEST"
    echo ""
  fi
fi

# ─── 7. Atlas Knowledge Graph — inject recent facts ────────────────
KG_SUMMARY=$(node "$CLAUDE_DIR/hooks/atlas-kg.js" summary 2>/dev/null)
if [ -n "$KG_SUMMARY" ] && [ "$KG_SUMMARY" != "Knowledge graph empty." ]; then
  echo "$KG_SUMMARY"
fi

# ─── 7a. Unified cleanup engine (v7.0) ──────────────────────────────
# Declarative cleanup rules live in hooks/cleanup-config.json. Each rule is
# driven by hooks/cleanup-runner.js, which writes one JSONL record per rule
# to logs/cleanup.jsonl and prints any user-visible nag messages to stdout.
# Replaces the v6.x §7a–§7h + §7j–§7k bespoke blocks. §7i stays inline below
# because it emits carryover text that must flow back to the session.
node "$CLAUDE_DIR/hooks/cleanup-runner.js" 2>/dev/null || true

# ─── 7i. Action-graph carryover + prune (Tier 3) ────────────────────
# Carries forward the previous session's top-5 hot items if the state file
# is < 48h old. Also prunes action-graph files > 7 days old.
# §7f/§7g/§7h are already taken by Plans / Session-env / Cache efficiency.
AG_DIR="$CLAUDE_DIR/atlas-action-graph"
if [ -d "$AG_DIR" ]; then
  # Prune stale session files (cheap — runs every SessionStart)
  node "$CLAUDE_DIR/hooks/atlas-action-graph.js" prune --days=7 >/dev/null 2>&1 || true

  # Snapshot prune (7-day retention, mv to trash instead of delete per "never rm" rule)
  SNAP_TRASH="/c/tmp/trash/atlas-action-graph-snapshots"
  if [ -d "$AG_DIR/snapshots" ]; then
    mkdir -p "$SNAP_TRASH" 2>/dev/null || true
    find "$AG_DIR/snapshots" -maxdepth 1 -name "*.json" -mtime +7 -exec mv {} "$SNAP_TRASH/" \; 2>/dev/null || true
    # Second pass: drop anything >30 days old from trash to keep disk bloat bounded.
    find "$SNAP_TRASH" -maxdepth 1 -name "*.json" -mtime +30 -delete 2>/dev/null || true
  fi

  # Pick the most recent state file whose recorded cwd matches THIS session's
  # cwd — anything else would be cross-project pollution (e.g. another project's
  # hot files leaking into a .claude session).
  PREV_SID=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" latest-for-cwd --cwd="$(pwd)" --hours=48 2>/dev/null)
  if [ -n "$PREV_SID" ]; then
    CARRYOVER=$(node "$CLAUDE_DIR/hooks/atlas-action-graph.js" carryover "$PREV_SID" --n=5 2>/dev/null)
    if [ -n "$CARRYOVER" ] && [ "$CARRYOVER" != "No carryover (action graph empty)." ]; then
      echo "$CARRYOVER"
    fi
  fi
fi

# ─── 7l. Vault orientation (replaces Living Memory drift+core injection) ──
# Brain consolidation Phase 1.5.3 (2026-05-14). Reads vault personal/_index.md
# and profile.md (head only) and emits a compact orientation block (≤2KB).
# Replaces the old Living Memory SQLite-backed core memory injection now that
# the brain lives in <your-vault-path>/wiki/personal/. Fail-soft: missing files
# = silent skip (don't break SessionStart).
#
# Original §7l (LIVING MEMORY drift+core injection via memory-indexer.js +
# memory-retrieve.js) preserved in the brain-consolidation backup tar.gz.
VAULT_DIR="$HOME_DIR/Documents/Wiki/wiki"
PERSONAL_INDEX="$VAULT_DIR/personal/_index.md"
USER_PROFILE="$VAULT_DIR/personal/profile.md"

if [ -f "$PERSONAL_INDEX" ] || [ -f "$USER_PROFILE" ]; then
  ORIENTATION_TMP=$(mktemp -t vault-orient-XXXXXX 2>/dev/null || echo "/tmp/vault-orient-$$")
  {
    echo "VAULT ORIENTATION (<your-vault-path>/wiki/personal/):"
    if [ -f "$PERSONAL_INDEX" ]; then
      # Show file table (skip frontmatter, take next 40 lines of content)
      awk '/^---$/{c++; next} c>=2 {print}' "$PERSONAL_INDEX" 2>/dev/null | head -40
    fi
    if [ -f "$USER_PROFILE" ]; then
      echo ""
      echo "USER PROFILE (head):"
      awk '/^---$/{c++; next} c>=2 {print}' "$USER_PROFILE" 2>/dev/null | head -20
    fi
    echo ""
    echo "  Read wiki/personal/system-overview.md for the full map."
  } > "$ORIENTATION_TMP" 2>/dev/null

  # Cap at 2000 chars (~500 tokens)
  if [ -f "$ORIENTATION_TMP" ]; then
    CHARS=$(wc -c < "$ORIENTATION_TMP" 2>/dev/null || echo 0)
    if [ "$CHARS" -gt 2000 ]; then
      head -c 2000 "$ORIENTATION_TMP" > "${ORIENTATION_TMP}.cap" && mv "${ORIENTATION_TMP}.cap" "$ORIENTATION_TMP"
      echo "" >> "$ORIENTATION_TMP"
      echo "  <!-- truncated -->" >> "$ORIENTATION_TMP"
    fi
    cat "$ORIENTATION_TMP"
    rm -f "$ORIENTATION_TMP" 2>/dev/null
  fi
fi

# ─── 7l.2 Sous-chef injection (v9 A3 instincts + A7 inbox pointer) ───
# Learned instincts (top-6 with confidence >=0.70, informational routes not
# orders) + the ONE suggestions-inbox pointer. BOTH emit nothing until the
# sous-chef has earned content ⇒ zero session-start footprint by default
# (measured vs the F1a context baseline). Fail-soft; never blocks startup.
if [ -f "$CLAUDE_DIR/scripts/instincts.js" ]; then
  SC_INSTINCTS=$(node "$CLAUDE_DIR/scripts/instincts.js" render 2>/dev/null)
  [ -n "$SC_INSTINCTS" ] && { echo ""; echo "$SC_INSTINCTS"; }
fi
if [ -f "$CLAUDE_DIR/scripts/suggestions.js" ]; then
  SC_POINTER=$(node "$CLAUDE_DIR/scripts/suggestions.js" pointer 2>/dev/null)
  [ -n "$SC_POINTER" ] && echo "$SC_POINTER"
fi

# ─── 7m. Active Capability System carryover (v8.6.0) ────────────────
# If /system:activate ran in this folder, re-inject its bounded digest
# (≤2500 chars, written by the activate command) and touch the marker —
# sliding TTL: cleanup-config active-system-prune expires it only after
# 14 days with NO sessions in this CWD. Fail-soft throughout.
ACTIVE_SYS_MARKER="$CLAUDE_DIR/cache/active-system-${CWD_SLUG}.json"
ACTIVE_SYS_DIGEST="$CLAUDE_DIR/cache/active-system-${CWD_SLUG}.md"
if [ -f "$ACTIVE_SYS_MARKER" ]; then
  touch "$ACTIVE_SYS_MARKER" 2>/dev/null || true
  if [ -f "$ACTIVE_SYS_DIGEST" ]; then
    touch "$ACTIVE_SYS_DIGEST" 2>/dev/null || true
    head -c 2500 "$ACTIVE_SYS_DIGEST" 2>/dev/null
    echo ""
  else
    SYS_NAME=$(sed -n 's/.*"name": *"\([^"]*\)".*/\1/p' "$ACTIVE_SYS_MARKER" 2>/dev/null | head -1)
    [ -n "$SYS_NAME" ] && echo "Active system: $SYS_NAME (digest missing — run /system:activate $SYS_NAME to regenerate)"
  fi
fi

# ─── 7j/§7k migrated to cleanup-runner.js (see §7a) ─────────────────
# Transcript rotation and plugin skill-pack nag are now declarative rules
# (transcripts-rotation + plugin-skill-pack-nag) in hooks/cleanup-config.json.

# ─── 8. Stale temp file cleanup ─────────────────────────────────────
# Use Node's tmpdir (matches where hooks actually write — may differ from /tmp on Windows)
NODE_TMPDIR=$(node -e "process.stdout.write(require('os').tmpdir())" 2>/dev/null || echo "/tmp")
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-ctx-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-fail-streak-*.json" -mmin +1440 -delete 2>/dev/null || true
find "$NODE_TMPDIR" -maxdepth 1 -name "claude-handoff-*.trigger" -mmin +1440 -delete 2>/dev/null || true

# Python-written allow-git flag files (allow_git_hook.py uses tempfile.gettempdir() + "/claude")
# On Windows this resolves to C:/tmp/claude; on POSIX to /tmp/claude. Both covered.
PY_TMPDIR=$(python3 -c "import tempfile,os;print(os.path.join(tempfile.gettempdir(),'claude'))" 2>/dev/null \
          || python -c "import tempfile,os;print(os.path.join(tempfile.gettempdir(),'claude'))" 2>/dev/null \
          || echo "/tmp/claude")
for d in "$PY_TMPDIR" "/tmp/claude" "/c/tmp/claude"; do
  [ -d "$d" ] || continue
  find "$d" -maxdepth 1 -name "allow-git-*" -mmin +1440 -delete 2>/dev/null || true
done

# Scratchpad cleanup (files older than 14 days)
SCRATCHPAD="/c/tmp/claude-scratchpad"
if [ -d "$SCRATCHPAD" ]; then
  find "$SCRATCHPAD" -maxdepth 1 -type f -mtime +14 -delete 2>/dev/null || true
  find "$SCRATCHPAD" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \; 2>/dev/null || true
fi

# ─── 8·pre. Refresh scheduled-tasks cache from on-disk state (self-healing) ───
# Rewrites cache/scheduled-tasks-latest.json from the live scheduler state on disk
# so drift-proposer (§8a) never computes drift on a stale cache. Fail-open.
# MUST run before §8a — the cache must be fresh before drift-proposer reads it.
node "$CLAUDE_DIR/hooks/refresh-scheduled-cache.js" 2>/dev/null || true

# ─── 8a. Auto drift-proposer (v7.0) ─────────────────────────────────
# Reads telemetry (tool-health, scheduled-tasks cache, cleanup.jsonl, skill-usage.jsonl)
# and prints AT MOST one `DRIFT: ...` advisory to stdout when any threshold crosses.
# Thresholds in hooks/drift-thresholds.json. Silent when the system is clean.
node "$CLAUDE_DIR/hooks/drift-proposer.js" 2>/dev/null || true

# ─── 9. Critical file backup (weekly) ───────────────────────────────
BACKUP_DIR="$CLAUDE_DIR/backups"
BACKUP_STATE="$CLAUDE_DIR/cache/backup-last-run"
LAST_BACKUP=$(cat "$BACKUP_STATE" 2>/dev/null || echo "0")
if [ $(( NOW - LAST_BACKUP )) -ge 604800 ]; then
  mkdir -p "$BACKUP_DIR" 2>/dev/null
  STAMP=$(date +%Y%m%d)
  cp -f "$CLAUDE_DIR/CLAUDE.md" "$BACKUP_DIR/CLAUDE-${STAMP}.md" 2>/dev/null || true
  cp -f "$CLAUDE_DIR/skills/ACTIVE-DIRECTORY.md" "$BACKUP_DIR/ACTIVE-DIRECTORY-${STAMP}.md" 2>/dev/null || true
  # v8.0.0: memory subsystem retired. Vault at ~/Documents/Wiki has its own
  # local-only git history (no remote), which serves as the durable backup.
  # No additional weekly tar needed here.
  find "$BACKUP_DIR" -name "CLAUDE-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "ACTIVE-DIRECTORY-*.md" -mtime +30 -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "memory-*.tar.gz" -mtime +30 -delete 2>/dev/null || true  # legacy cleanup; old tars expire 30d post-v8.0.0
  find "$BACKUP_DIR" -name ".claude.json.corrupted.*" -mtime +14 -delete 2>/dev/null || true  # post-mortem corruption copies expire 14d (added 2026-06-24 / system audit)
  # Keep only the 2 most recent .claude.json backups
  ls -t "$BACKUP_DIR"/.claude.json.backup.* 2>/dev/null | tail -n +3 | while IFS= read -r f; do [ -f "$f" ] && rm -f "$f" 2>/dev/null; done || true
  echo "$NOW" > "$BACKUP_STATE"
fi
