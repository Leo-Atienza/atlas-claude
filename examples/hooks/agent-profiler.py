#!/usr/bin/env python3
"""PostToolUse hook — Track agent performance profiles.
Adapted from Ruflo's agent performance learning system.
Logs both successes and failures per subagent type to build
an exponential moving average (EMA) of reliability.

EMA formula: new_reliability = old_reliability * 0.7 + new_score * 0.3

Consumes: Agent tool responses from PostToolUse
Produces: logs/agent-profiles.jsonl (raw events), logs/agent-profiles-summary.json (EMA)
"""
import json, sys, os
from datetime import datetime, timezone

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

tool_name = data.get("tool_name", "")

# Only process Agent tool completions
if tool_name != "Agent":
    sys.exit(0)

tool_input = data.get("tool_input", {})
tool_response = data.get("tool_response", {})

# Extract agent metadata
subagent_type = tool_input.get("subagent_type", "general-purpose")
description = tool_input.get("description", "")[:200]
model = tool_input.get("model", "default")

# Determine success/failure from response
response_str = str(tool_response)[:3000]
failure_indicators = [
    "error", "Error", "ERROR", "FAILED", "failed", "Traceback",
    "Exception", "could not", "unable to", "timed out", "timeout"
]

is_failure = False
if isinstance(tool_response, dict):
    if tool_response.get("error"):
        is_failure = True
    # Check for explicit failure markers
    output = str(tool_response.get("output", "") or tool_response.get("result", ""))[:2000]
    fail_count = sum(1 for ind in failure_indicators if ind.lower() in output.lower())
    if fail_count >= 2:
        is_failure = True
elif isinstance(tool_response, str):
    fail_count = sum(1 for ind in failure_indicators if ind.lower() in response_str.lower())
    if fail_count >= 2:
        is_failure = True

score = 0.0 if is_failure else 1.0

# Build event entry
log_dir = os.path.expanduser("~/.claude/logs")
os.makedirs(log_dir, exist_ok=True)

entry = {
    "ts": datetime.now(timezone.utc).isoformat(),
    "agent_type": subagent_type,
    "model": model,
    "description": description,
    "score": score,
    "session": data.get("session_id", "")[:16],
    "cwd": os.getcwd(),
}

# Append raw event
events_path = os.path.join(log_dir, "agent-profiles.jsonl")
try:
    with open(events_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
except Exception:
    pass

# Update EMA summary
summary_path = os.path.join(log_dir, "agent-profiles-summary.json")
EMA_DECAY = 0.7  # Weight for existing reliability
EMA_NEW = 0.3    # Weight for new observation

try:
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            summary = json.load(f)
    else:
        summary = {}

    key = f"{subagent_type}:{model}"
    if key not in summary:
        summary[key] = {
            "agent_type": subagent_type,
            "model": model,
            "reliability": 0.5,  # Prior: assume 50% until data arrives
            "total_runs": 0,
            "successes": 0,
            "failures": 0,
            "first_seen": entry["ts"],
            "last_seen": entry["ts"],
        }

    profile = summary[key]
    profile["total_runs"] += 1
    if is_failure:
        profile["failures"] += 1
    else:
        profile["successes"] += 1
    profile["last_seen"] = entry["ts"]

    # EMA update (but use raw ratio for first 5 observations to bootstrap)
    if profile["total_runs"] <= 5:
        profile["reliability"] = profile["successes"] / profile["total_runs"]
    else:
        profile["reliability"] = round(
            profile["reliability"] * EMA_DECAY + score * EMA_NEW, 4
        )

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

except Exception:
    pass

# Rotate events log if over 5MB
try:
    if os.path.exists(events_path) and os.path.getsize(events_path) > 5_000_000:
        import shutil
        shutil.move(events_path, events_path + ".bak")
except Exception:
    pass

sys.exit(0)
