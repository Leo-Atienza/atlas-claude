#!/usr/bin/env python3
"""
UserPromptSubmit hook to toggle git staging/commit approval.

Triggers:
- '>allow-git': Allow both staging modified files and commits
- '>allow-git staging': Allow only staging modified files
- '>allow-git commit': Allow only commits
- '>allow-git off': Restore approval prompts
- '>allow-git status': Show current status

Creates session-scoped flag files so the PreToolUse hooks
(git_add_block_hook, git_commit_block_hook) can skip the
"ask" prompt. Dangerous operations (git add -A, git add .,
git checkout --force) remain always blocked.
"""
import json
import os
import sys

TRIGGER = ">allow-git"
FLAG_DIR = "/tmp/claude"
FLAG_NAMES = ("staging", "commit")

# ANSI colors
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def _flag_path(name: str, session_id: str) -> str:
    return os.path.join(FLAG_DIR, f"allow-git-{name}.{session_id}")


def _set_flags(
    names: tuple[str, ...],
    session_id: str,
) -> str:
    """Create session-scoped flag files. Returns status message."""
    os.makedirs(FLAG_DIR, exist_ok=True)
    for name in names:
        with open(_flag_path(name, session_id), "w") as f:
            f.write(session_id)

    label = " and ".join(names)
    return (
        f"{GREEN}Git {label} allowed for this session.{RESET}\n"
        f"{BLUE}Use >allow-git off to restore approval prompts.{RESET}"
    )


def _clear_flags(session_id: str) -> str:
    """Remove all session-scoped flag files."""
    for name in FLAG_NAMES:
        try:
            os.remove(_flag_path(name, session_id))
        except FileNotFoundError:
            pass
    return f"{YELLOW}Git approval prompts restored.{RESET}"


def _status(session_id: str) -> str:
    """Report which flags are active."""
    active = []
    for name in FLAG_NAMES:
        if os.path.exists(_flag_path(name, session_id)):
            active.append(name)

    if active:
        label = ", ".join(active)
        return (
            f"{GREEN}Active: {label}{RESET}\n"
            f"{BLUE}Use >allow-git off to restore prompts.{RESET}"
        )
    return f"{BLUE}All git operations require approval.{RESET}"


def main():
    try:
        data = json.load(sys.stdin)
        session_id = data.get("session_id", "")
        prompt = data.get("prompt")

        if not isinstance(prompt, str) or not prompt.strip():
            sys.exit(0)

        prompt = prompt.strip().lower()

        # Must match trigger exactly or as prefix + space
        if prompt != TRIGGER and not prompt.startswith(TRIGGER + " "):
            sys.exit(0)

        if not session_id:
            print(json.dumps({
                "decision": "block",
                "reason": "No session ID available.",
            }))
            sys.exit(0)

        # Parse the sub-command after ">allow-git"
        arg = prompt[len(TRIGGER):].strip()

        if arg == "off":
            message = _clear_flags(session_id)
        elif arg == "staging":
            message = _set_flags(("staging",), session_id)
        elif arg == "commit":
            message = _set_flags(("commit",), session_id)
        elif arg == "status":
            message = _status(session_id)
        else:
            # No arg or unrecognized -> allow both
            message = _set_flags(FLAG_NAMES, session_id)

        print(json.dumps({
            "decision": "block",
            "reason": message,
        }))
        sys.exit(0)

    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
