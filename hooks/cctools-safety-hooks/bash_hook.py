#!/usr/bin/env python3
"""
Unified Bash hook that combines all bash command safety checks.
Supports three decision types: allow, ask (user prompt), block (deny).
"""
import json
import sys
import os
import datetime


# ── Blocker counter ─────────────────────────────────────────────────
# Tracks how many times each safety check fires, so we can tune triggers
# without adding noisy logging. Fail-open — never crash the hook.
_COUNTS_PATH = os.path.join(os.path.expanduser('~'), '.claude', 'logs', 'safety-hook-counts.json')


def _bump_counter(check_name, decision):
    """Increment the [check_name][decision] counter. Fail-open, atomic write."""
    try:
        os.makedirs(os.path.dirname(_COUNTS_PATH), exist_ok=True)
        try:
            with open(_COUNTS_PATH, 'r', encoding='utf-8') as f:
                counts = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            counts = {}
        bucket = counts.setdefault(check_name, {"block": 0, "ask": 0, "last": None})
        bucket[decision] = bucket.get(decision, 0) + 1
        bucket["last"] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        counts["_meta"] = {"last_updated": bucket["last"]}
        tmp = _COUNTS_PATH + ".tmp"
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(counts, f)
        os.replace(tmp, _COUNTS_PATH)
    except Exception:
        # Telemetry must never break the hook
        pass

# Add hooks directory to Python path so we can import the other modules
PLUGIN_ROOT = os.environ.get('CLAUDE_PLUGIN_ROOT')
if PLUGIN_ROOT:
    hooks_dir = os.path.join(PLUGIN_ROOT, 'hooks')
    if hooks_dir not in sys.path:
        sys.path.insert(0, hooks_dir)
    if PLUGIN_ROOT not in sys.path:
        sys.path.insert(0, PLUGIN_ROOT)
else:
    # Fallback for running outside plugin context
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import check functions from other hooks
from git_add_block_hook import check_git_add_command
from git_checkout_safety_hook import check_git_checkout_command
from git_commit_block_hook import check_git_commit_command
from rm_block_hook import check_rm_command
from env_file_protection_hook import check_env_file_access
from command_utils import expand_command_aliases
import re


# Secret patterns — same as security-gate.sh but applied to Bash commands
SECRET_PATTERNS = [
    (r'AKIA[0-9A-Z]{16}', 'AWS access key'),
    (r'sk-[a-zA-Z0-9]{48}', 'OpenAI API key'),
    (r'sk-ant-[a-zA-Z0-9\-]{95}', 'Anthropic API key'),
    (r'ghp_[a-zA-Z0-9]{36}', 'GitHub personal access token'),
    (r'gho_[a-zA-Z0-9]{36}', 'GitHub OAuth token'),
    (r'github_pat_[a-zA-Z0-9_]{82}', 'GitHub fine-grained PAT'),
    (r'xoxb-[0-9]{10,}-[a-zA-Z0-9\-]+', 'Slack bot token'),
    (r'password\s*[:=]\s*["\'][^\'"]{8,}', 'plaintext password'),
    (r'(mongodb|postgres|mysql|redis)://[^:]+:[^@]+@', 'database connection string with credentials'),
    (r'(token|api_key|apikey|secret_key)\s*[:=]\s*["\'][a-zA-Z0-9+/=]{40,}', 'generic token/API key'),
]


def check_secret_patterns(command):
    """Check if a bash command contains hardcoded secrets."""
    # Always check for private key headers regardless of write indicators
    if re.search(r'-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', command):
        return True, (
            "Blocked: Bash command contains a private key header.\n\n"
            "Secrets should never be hardcoded in commands. Use environment variables instead."
        )

    # Only check remaining patterns in commands that write/echo content
    write_indicators = ['echo ', 'printf ', 'cat <<', "cat <<'", 'cat <<"',
                        'tee ', '> ', '>> ', 'curl ', 'wget ',
                        'base64', 'openssl', 'gpg', 'python3 -c', 'python -c',
                        'node -e', '| tee', '| sudo tee']
    has_write = any(ind in command for ind in write_indicators)
    if not has_write:
        return False, None

    for pattern, label in SECRET_PATTERNS:
        if re.search(pattern, command):
            return True, (
                f"Blocked: Bash command contains what appears to be a {label}.\n\n"
                "Secrets should never be hardcoded in commands. Use environment variables instead."
            )
    return False, None


def normalize_check_result(result):
    """
    Normalize check results to (decision, reason) format.
    Handles both old format (bool, reason) and new format (decision_str, reason).
    """
    decision, reason = result
    if isinstance(decision, bool):
        # Old format: (should_block: bool, reason)
        return ("block" if decision else "allow", reason)
    # New format: (decision: str, reason)
    return (decision, reason)


def main():
    # Respect bypass mode — but log it for audit trail
    if os.environ.get('BYPASS_SAFETY_HOOKS') == '1':
        try:
            log_dir = os.path.join(os.path.expanduser('~'), '.claude', 'logs')
            os.makedirs(log_dir, exist_ok=True)
            data = json.load(sys.stdin)
            entry = {
                "ts": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
                "event": "bypass",
                "hook": "bash_hook",
                "session": data.get("session_id", "unknown")[:16],
                "command": data.get("tool_input", {}).get("command", "")[:200],
            }
            with open(os.path.join(log_dir, 'security-bypass.jsonl'), 'a') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception:
            pass
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    data = json.load(sys.stdin)

    session_id = data.get("session_id", "")

    # Check if this is a Bash tool call
    tool_name = data.get("tool_name")
    if tool_name != "Bash":
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    # Get the command being executed
    command = data.get("tool_input", {}).get("command", "")

    # Expand any shell aliases before checking
    # This handles cases like 'gco -f' -> 'git checkout -f'
    command = expand_command_aliases(command)

    # Run all checks
    checks = [
        check_rm_command,
        check_git_add_command,
        check_git_checkout_command,
        check_git_commit_command,
        check_env_file_access,
        check_secret_patterns,
    ]

    block_reasons = []
    ask_reasons = []

    for check_func in checks:
        # Pass session_id to git checks that support it
        if check_func in (check_git_add_command, check_git_commit_command):
            result = check_func(command, session_id=session_id)
        else:
            result = check_func(command)
        decision, reason = normalize_check_result(result)
        if decision == "block":
            block_reasons.append(reason)
            _bump_counter(check_func.__name__, "block")
        elif decision == "ask":
            ask_reasons.append(reason)
            _bump_counter(check_func.__name__, "ask")

    # Priority: block > ask > allow
    if block_reasons:
        if len(block_reasons) == 1:
            combined_reason = block_reasons[0]
        else:
            combined_reason = "Multiple safety checks failed:\n\n"
            for i, reason in enumerate(block_reasons, 1):
                combined_reason += f"{i}. {reason}\n\n"

        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": combined_reason
            }
        }, ensure_ascii=False))
    elif ask_reasons:
        combined_reason = ask_reasons[0] if len(ask_reasons) == 1 else \
            "Approval required: " + "; ".join(ask_reasons)

        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": combined_reason
            }
        }))
    else:
        print(json.dumps({"decision": "approve"}))

    sys.exit(0)


if __name__ == "__main__":
    main()