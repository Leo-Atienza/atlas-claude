#!/usr/bin/env python3
"""PostToolUse hook — Capture tool failures to logs/failures.jsonl.
Detects recurring patterns and suggests /learn when threshold hit.

Improvement over ULTIMATE S18:
- Uses our G-ERR ID format for integration with Progressive Learning
- Adds session context (cwd, branch) for better error correlation
- Pattern detection uses tool+error-signature fingerprint
"""
import json, sys, os, hashlib
from datetime import datetime, timezone

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

tool_name = data.get("tool_name", "")
tool_input = data.get("tool_input", {})
tool_response = data.get("tool_response", {})

# Only capture failures — check for error indicators
# PostToolUse provides: tool_name, tool_input, tool_response (varies by tool)
# Bash: tool_response has stdout/stderr/exitCode or output/error
# Read/Write/Edit: tool_response has output or error
response_str = str(tool_response)
error_indicators = ["error", "Error", "ERROR", "FAILED", "failed", "Traceback", "Exception",
                    "command not found", "No such file", "Permission denied", "exit code",
                    "ENOENT", "EPERM", "EACCES", "SyntaxError", "TypeError", "ReferenceError"]

# Quick check: if response looks successful, skip
is_failure = False
if isinstance(tool_response, dict):
    # Check explicit error fields
    if tool_response.get("error"):
        is_failure = True
    # Check Bash exit code (non-zero = failure)
    exit_code = tool_response.get("exitCode", tool_response.get("exit_code", 0))
    if exit_code and int(exit_code) != 0:
        is_failure = True
    # Check stderr content
    stderr = str(tool_response.get("stderr", ""))
    if stderr and any(ind in stderr for ind in error_indicators):
        is_failure = True
elif isinstance(tool_response, str) and any(ind in tool_response for ind in error_indicators):
    is_failure = True

if not is_failure:
    # Check for error strings in output (but only if short enough to scan quickly)
    output = str(tool_response.get("output", "") if isinstance(tool_response, dict) else tool_response)[:2000]
    if any(ind in output for ind in error_indicators):
        # Heuristic: if output contains error AND is from Bash/Write/Edit, likely a failure
        if tool_name in ("Bash", "Write", "Edit", "MultiEdit"):
            is_failure = True

if not is_failure:
    # Track successful tool calls for tool health (Improvement 4)
    log_dir = os.path.expanduser("~/.claude/logs")
    os.makedirs(log_dir, exist_ok=True)
    counts_path = os.path.join(log_dir, "tool-call-counts.json")
    try:
        counts = json.load(open(counts_path)) if os.path.exists(counts_path) else {}
        counts[tool_name] = counts.get(tool_name, 0) + 1
        json.dump(counts, open(counts_path, "w"))
    except Exception:
        pass

    # Track skill application events (Improvement 2)
    # When a SKILL.md file is read, it means the skill was applied
    file_path = str(tool_input.get("file_path", ""))
    if tool_name == "Read" and file_path.endswith("SKILL.md"):
        events_path = os.path.join(log_dir, "skill-events.jsonl")
        # Extract skill name from path (e.g., skills/frontend-design/SKILL.md -> frontend-design)
        parts = file_path.replace("\\", "/").split("/")
        skill_name = ""
        for i, p in enumerate(parts):
            if p == "skills" and i + 1 < len(parts):
                skill_name = parts[i + 1]
                break
        if skill_name:
            event = json.dumps({
                "ts": datetime.now(timezone.utc).isoformat(),
                "event": "applied",
                "skill_id": "",
                "skill_name": skill_name,
                "session": data.get("session_id", "")[:16],
            })
            try:
                with open(events_path, "a", encoding="utf-8") as f:
                    f.write(event + "\n")
            except Exception:
                pass

    sys.exit(0)

# Build structured failure entry
log_dir = os.path.expanduser("~/.claude/logs")
os.makedirs(log_dir, exist_ok=True)

error_text = str(tool_response.get("error", "") or tool_response.get("output", ""))[:500]
command = str(tool_input.get("command", ""))[:300]
file_path = str(tool_input.get("file_path", ""))

entry = {
    "ts": datetime.now(timezone.utc).isoformat(),
    "tool": tool_name,
    "command": command,
    "file_path": file_path,
    "error": error_text,
    "session": data.get("session_id", "")[:16],
    "cwd": os.getcwd(),
}

# Append to failures log
failures_path = os.path.join(log_dir, "failures.jsonl")
try:
    with open(failures_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
except Exception:
    pass

# Pattern detection — fingerprint is tool + first 100 chars of error
fingerprint = hashlib.md5(f"{tool_name}:{error_text[:100]}".encode()).hexdigest()[:12]
patterns_path = os.path.join(log_dir, "error-patterns.json")

try:
    if os.path.exists(patterns_path):
        with open(patterns_path, "r", encoding="utf-8") as f:
            patterns = json.load(f)
    else:
        patterns = {}

    if fingerprint not in patterns:
        patterns[fingerprint] = {"count": 0, "tool": tool_name, "sample": error_text[:100], "first_seen": entry["ts"]}

    patterns[fingerprint]["count"] += 1
    patterns[fingerprint]["last_seen"] = entry["ts"]

    with open(patterns_path, "w", encoding="utf-8") as f:
        json.dump(patterns, f, indent=2)

    count = patterns[fingerprint]["count"]
    if count >= 3:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": (
                    f"RECURRING FAILURE ({count}x): {tool_name} — {error_text[:80]}... "
                    f"Per CLAUDE.md Mistake Learning rules: run /learn NOW to codify this as a G-ERR topic."
                )
            }
        }))
except Exception:
    pass

# Rotate failures.jsonl if over 5MB
try:
    if os.path.exists(failures_path) and os.path.getsize(failures_path) > 5_000_000:
        import shutil
        shutil.move(failures_path, failures_path + ".bak")
except Exception:
    pass

sys.exit(0)
