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
        bucket["last"] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
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


# ── Git routine-command allowlist (added 2026-05-15; compound chains 2026-06-15) ──
# Allowlist for routine git operations that don't need user approval prompts.
# Telemetry showed ~245 commit + ~156 add modal prompts/period for routine git
# ops. Disabled by setting ATLAS_DISABLE_GIT_ALLOWLIST=1. Single-command pure-git
# invocations qualify, AND (2026-06-15) plain `&&`/`;` chains where EVERY part is
# an independently-safe git command (e.g. `git add <file> && git commit -m "..."`,
# which dominated the prompts). Anything with a pipe (`|`/`||`), command
# substitution (`$(...)`), backticks, or a background `&` still falls through to
# the per-command checks. Dangerous patterns (--force, push, reset --hard, rebase,
# --amend, clean -f, remote add, etc.) are excluded even if a leading verb matches
# a safe pattern. When allowlisted, the rm / env-file / secret checks STILL run.

GIT_READ_ONLY_PATTERNS = [
    re.compile(r'^\s*git\s+status\b'),
    re.compile(r'^\s*git\s+diff\b'),
    re.compile(r'^\s*git\s+log\b'),
    re.compile(r'^\s*git\s+show\b'),
    re.compile(r'^\s*git\s+blame\b'),
    re.compile(r'^\s*git\s+grep\b'),
    re.compile(r'^\s*git\s+rev-(?:parse|list)\b'),
    re.compile(r'^\s*git\s+ls-(?:files|remote|tree)\b'),
    re.compile(r'^\s*git\s+config\s+(?:--get|--list|-l)\b'),
    re.compile(r'^\s*git\s+remote\s+(?:-v|show|get-url)\b'),
    re.compile(r'^\s*git\s+remote\s*$'),
    re.compile(r'^\s*git\s+(?:describe|reflog|fsck|cat-file|symbolic-ref)\b'),
    re.compile(r'^\s*git\s+stash\s+(?:list|show)\b'),
    re.compile(r'^\s*git\s+branch\s*$'),
    re.compile(r'^\s*git\s+branch\s+-(?:l|a|r|v|vv)\b'),
    re.compile(r'^\s*git\s+tag\s*$'),
    re.compile(r'^\s*git\s+tag\s+-l\b'),
    re.compile(r'^\s*git\s+fetch\b'),
    re.compile(r'^\s*git\s+(?:worktree\s+list|submodule\s+(?:status|summary))\b'),
]

GIT_SAFE_WRITE_PATTERNS = [
    # `git add <explicit files>` — rejects -A, --all, -a, bare `.`, bare `*`.
    # `git add ./subdir/file` is allowed; `git add .` and `git add *` are not.
    re.compile(r'^\s*git\s+add\s+(?!-A\b|--all\b|-a\b|\.(?:\s|$)|\*(?:\s|$))[^\s]'),
    # `git commit -m "..."` with explicit message (optionally `-S -m` for signed).
    # `--amend` is caught by GIT_DANGEROUS_PATTERNS below.
    re.compile(r'^\s*git\s+commit\s+(?:-S\s+)?-m\s+["\']'),
]

GIT_DANGEROUS_PATTERNS = [
    re.compile(r'\b--force\b'),
    re.compile(r'\b--no-verify\b'),
    re.compile(r'\bgit\s+push\b'),
    re.compile(r'\bgit\s+reset\s+(?:--hard|--mixed)\b'),
    re.compile(r'\bgit\s+rebase\b'),
    re.compile(r'\bgit\s+clean\s+-[fF]'),
    re.compile(r'\bgit\s+checkout\s+--\b'),
    re.compile(r'\bgit\s+restore\b'),
    re.compile(r'\bgit\s+commit\b[^;|&]*--amend\b'),
    re.compile(r'\bgit\s+branch\s+(?:-D|--delete\s+--force)\b'),
    re.compile(r'\bgit\s+(?:update-ref|filter-branch|filter-repo)\b'),
    re.compile(r'\bgit\s+remote\s+(?:add|remove|rename|set-url|rm)\b'),
]

SHELL_CHAIN_OPERATORS = re.compile(r'[;|&]|\$\(|\`')


def _is_single_routine_git(cmd):
    """True if a SINGLE (unchained) command is a safe git op.

    A part is routine only if it (a) contains no shell chaining/substitution
    of its own, (b) matches no dangerous git pattern, and (c) is a git command
    matching a read-only or safe-write pattern.
    """
    cmd = cmd.strip()
    if not cmd:
        return False
    if SHELL_CHAIN_OPERATORS.search(cmd):
        return False
    if any(p.search(cmd) for p in GIT_DANGEROUS_PATTERNS):
        return False
    if not re.match(r'^\s*git\b', cmd):
        return False
    return (any(p.search(cmd) for p in GIT_READ_ONLY_PATTERNS) or
            any(p.search(cmd) for p in GIT_SAFE_WRITE_PATTERNS))


def _split_simple_chain(cmd):
    """Split a command on `&&` and `;` ONLY, into stripped non-empty parts.

    Returns None (caller treats as not-routine) if the command contains any
    construct we refuse to reason about: a pipe `|`/`||`, command substitution
    `$(...)`, a backtick, or a background `&`. This keeps the compound path
    restricted to plain sequential chains of simple git commands — e.g.
    `git add file && git commit -m "..."` — and never auto-approves anything
    whose output is piped or whose arguments are command-substituted.
    """
    if '$(' in cmd or '`' in cmd:
        return None
    if '|' in cmd:            # rejects both `|` (pipe) and `||` (logical or)
        return None
    # Reject a background `&` (a single `&` that is not part of `&&`).
    if '&' in cmd.replace('&&', ''):
        return None
    segments = []
    for amp_seg in cmd.split('&&'):
        segments.extend(amp_seg.split(';'))
    return [s.strip() for s in segments if s.strip()]


def is_routine_git_command(command):
    """Return True if command is a routine git op safe to auto-approve.

    Single commands take the fast path. Compound commands joined only by `&&`
    or `;` are routine iff EVERY subcommand is independently a safe git op and
    NONE is dangerous — so `git add <file> && git commit -m "..."` stops
    prompting, while `git add x && git push`, `... && rm -rf /`, or anything
    piped/substituted still falls through to the full safety checks (and the
    rm/env/secret checks run regardless of this allowlist).
    """
    if not command:
        return False
    if os.environ.get('ATLAS_DISABLE_GIT_ALLOWLIST') == '1':
        return False

    cmd = command.strip()

    # Fast path: a single command with no chaining of any kind.
    if not SHELL_CHAIN_OPERATORS.search(cmd):
        return _is_single_routine_git(cmd)

    # Compound path: only plain `&&`/`;` chains of safe git commands qualify.
    parts = _split_simple_chain(cmd)
    if not parts:
        return False
    return all(_is_single_routine_git(p) for p in parts)


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

    # Routine git ops bypass the git-specific ask prompts. rm/env/secrets
    # checks still run. See is_routine_git_command for pattern details.
    routine_git = is_routine_git_command(command)
    if routine_git:
        _bump_counter('git_routine_allowlist', 'allow')

    checks = [
        check_rm_command,
        check_env_file_access,
        check_secret_patterns,
    ]
    if not routine_git:
        checks.extend([
            check_git_add_command,
            check_git_checkout_command,
            check_git_commit_command,
        ])

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