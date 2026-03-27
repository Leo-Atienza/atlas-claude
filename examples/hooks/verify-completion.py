#!/usr/bin/env python3
"""Stop hook — Lightweight verification that Claude completed the task.
Runs before the heavier agent-type verification hook.

Improvements over ULTIMATE S17:
- Checks our todo list (~/. claude/todos/) for in_progress items
- Checks for context monitor CRITICAL warnings
- More nuanced failure detection (not just string matching)
"""
import json, sys, os, glob

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

last_message = str(data.get("last_assistant_message", ""))
if len(last_message) < 50:
    sys.exit(0)

issues = []

# 1. Check for question indicators (Claude is asking, not finishing)
question_indicators = ["?", "would you like", "shall i", "should i", "do you want",
                       "let me know", "what would you prefer"]
lower_msg = last_message.lower()[-500:]  # Check end of message
question_count = sum(1 for ind in question_indicators if ind in lower_msg)
if question_count >= 2:
    # Multiple question indicators = Claude is asking for direction, not done
    sys.exit(0)

# 2. Check for failure phrases
failure_phrases = [
    "i wasn't able to", "i could not", "i'm unable to",
    "failed to", "unfortunately", "encountered an error",
    "i don't have access", "permission denied",
    "this approach won't work", "cannot be done",
]
found_failures = [p for p in failure_phrases if p in lower_msg]
if found_failures:
    issues.append(f"Possible incomplete work: '{found_failures[0]}' detected")

# 3. Check for in_progress todos
todos_dir = os.path.expanduser("~/.claude/todos")
if os.path.isdir(todos_dir):
    try:
        for todo_file in glob.glob(os.path.join(todos_dir, "*.json")):
            with open(todo_file, "r", encoding="utf-8") as f:
                todos = json.load(f)
            if isinstance(todos, list):
                in_progress = [t for t in todos if isinstance(t, dict) and t.get("status") == "in_progress"]
                if in_progress:
                    issues.append(f"{len(in_progress)} todo(s) still marked in_progress")
                    break
    except Exception:
        pass

# 4. Check for context monitor CRITICAL warning (rushed ending)
session_id = data.get("session_id", "")
ctx_file = f"/tmp/claude-ctx-{session_id}.json"
if os.path.exists(ctx_file):
    try:
        with open(ctx_file, "r") as f:
            ctx = json.load(f)
        remaining = ctx.get("remaining_pct", 100)
        if remaining <= 15:
            issues.append(f"Context nearly exhausted ({remaining}% remaining) — work may be truncated")
    except Exception:
        pass

# Emit findings
if issues:
    msg = "COMPLETION CHECK: " + "; ".join(issues) + ". Review before ending session."
    print(json.dumps({
        "additionalContext": msg
    }))

sys.exit(0)
