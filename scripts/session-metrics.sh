#!/bin/bash
# Session Metrics — Human-readable report across all log files
# Run: bash ~/.claude/scripts/session-metrics.sh
# Callable via /health or manually

CLAUDE_DIR="$HOME/.claude"
LOGS_DIR="$CLAUDE_DIR/logs"
CACHE_DIR="$CLAUDE_DIR/cache"

echo "=== ATLAS Session Metrics ==="
echo ""

# ─── 1. Session efficiency (from cache/efficiency-*.json) ────────────
echo "[1] Session Efficiency"
session_count=0
total_calls=0
if [ -d "$CACHE_DIR" ]; then
  for f in "$CACHE_DIR"/efficiency-*.json; do
    [ -f "$f" ] || continue
    calls=$(node -e 'try{console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).total||0)}catch(e){console.log(0)}' "$f" 2>/dev/null)
    total_calls=$((total_calls + calls))
    session_count=$((session_count + 1))
  done
fi
if [ "$session_count" -gt 0 ]; then
  avg=$((total_calls / session_count))
  echo "  Sessions tracked: $session_count"
  echo "  Total tool calls: $total_calls"
  echo "  Avg calls/session: $avg"
else
  echo "  No session data found"
fi
echo ""

# ─── 2. Top errors (from error-patterns.json) ────────────────────────
echo "[2] Top Recurring Errors"
EP_FILE="$LOGS_DIR/error-patterns.json"
if [ -f "$EP_FILE" ]; then
  node -e '
    const p = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
    const sorted = Object.values(p).sort((a,b) => b.count - a.count).slice(0,5);
    if (sorted.length === 0) { console.log("  No errors recorded"); process.exit(0); }
    sorted.forEach(e => {
      console.log("  " + e.tool + " (" + e.count + "x): " + (e.sample||"").slice(0,70));
    });
  ' "$EP_FILE" 2>/dev/null || echo "  Parse error"
else
  echo "  No error patterns file"
fi
echo ""

# ─── 3. Tool health (from tool-health.json) ──────────────────────────
echo "[3] Tool Health"
TH_FILE="$LOGS_DIR/tool-health.json"
if [ -f "$TH_FILE" ]; then
  node -e '
    const h = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
    if (!h.tools || Object.keys(h.tools).length === 0) { console.log("  No tools tracked"); process.exit(0); }
    const sorted = Object.entries(h.tools).sort(([,a],[,b]) => b.total_failures - a.total_failures);
    sorted.forEach(([tool, data]) => {
      const status = data.total_failures >= 10 ? "UNHEALTHY" : data.total_failures >= 5 ? "WARN" : "OK";
      console.log("  " + tool + ": " + data.total_failures + " failures (" + status + ")");
    });
  ' "$TH_FILE" 2>/dev/null || echo "  Parse error"
else
  echo "  No tool health data"
fi
echo ""

# ─── 4. Hook performance (from hook-health.jsonl) ────────────────────
echo "[4] Hook Performance (avg ms)"
HH_FILE="$LOGS_DIR/hook-health.jsonl"
if [ -f "$HH_FILE" ]; then
  node -e '
    const lines = require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n");
    const agg = {};
    lines.forEach(line => {
      try {
        const e = JSON.parse(line);
        if (!agg[e.hook]) agg[e.hook] = { total: 0, count: 0 };
        agg[e.hook].total += e.duration_ms || 0;
        agg[e.hook].count += 1;
      } catch(err) {}
    });
    Object.entries(agg)
      .map(([hook, d]) => ({ hook, avg: Math.round(d.total / d.count), count: d.count }))
      .sort((a,b) => b.avg - a.avg)
      .forEach(h => {
        const status = h.avg > 50 ? "SLOW" : "OK";
        console.log("  " + h.hook + ": " + h.avg + "ms avg (" + h.count + " calls, " + status + ")");
      });
  ' "$HH_FILE" 2>/dev/null || echo "  Parse error"
else
  echo "  No hook health data"
fi
echo ""

# ─── 5. Failure log summary ──────────────────────────────────────────
echo "[5] Recent Failures"
for logfile in failures.jsonl tool-failures.jsonl; do
  fpath="$LOGS_DIR/$logfile"
  if [ -f "$fpath" ]; then
    count=$(wc -l < "$fpath" 2>/dev/null || echo 0)
    size=$(wc -c < "$fpath" 2>/dev/null || echo 0)
    size_kb=$((size / 1024))
    echo "  $logfile: $count entries (${size_kb}KB)"
  fi
done
echo ""

# ─── 6. Tool call distribution (from tool-call-counts.json) ──────────
echo "[6] Tool Call Distribution (all time)"
TC_FILE="$LOGS_DIR/tool-call-counts.json"
if [ -f "$TC_FILE" ]; then
  node -e '
    const c = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
    const sorted = Object.entries(c).sort(([,a],[,b]) => b - a).slice(0,10);
    sorted.forEach(([tool, count]) => console.log("  " + tool + ": " + count));
  ' "$TC_FILE" 2>/dev/null || echo "  Parse error"
else
  echo "  No tool call data"
fi

echo ""
echo "=== End Metrics ==="
