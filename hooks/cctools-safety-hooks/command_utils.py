"""Shared utilities for bash command parsing."""
import os
import re
import subprocess

# Cache for alias expansions (populated on first use)
_alias_cache: dict[str, str] | None = None


def _load_alias_cache() -> dict[str, str]:
    """
    Load all shell aliases into a cache dict.

    Sources the shell rc file and runs 'alias' to get all aliases.
    Avoids -i (interactive) flag to prevent TTY issues when run as
    a background process by Claude Code.
    Returns empty dict on failure.
    """
    global _alias_cache
    if _alias_cache is not None:
        return _alias_cache

    _alias_cache = {}
    shell = os.environ.get('SHELL', '/bin/bash')

    try:
        # Avoid -i (interactive) flag which can cause TTY issues
        # Source rc file explicitly to get aliases without interactive mode
        if 'zsh' in shell:
            cmd = [shell, '-c', 'source ~/.zshrc 2>/dev/null; alias']
        else:
            cmd = [shell, '-c', 'source ~/.bashrc 2>/dev/null; alias']

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5,
            stdin=subprocess.DEVNULL,  # Explicitly close stdin
            start_new_session=True,  # Isolate from terminal control
            env={**os.environ, 'PS1': '', 'TERM': 'dumb'},
        )
        output = result.stdout

        # Strip ANSI escape sequences
        output = re.sub(r'\x1b\][^\x07]*\x07', '', output)
        output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', output)

        # Parse alias output - handles both bash and zsh formats:
        # bash: alias gcam='git commit -am'
        # zsh:  gcam='git commit -a -m' or gcam="git commit -a -m"
        for line in output.strip().split('\n'):
            line = line.strip()
            if not line:
                continue
            # Remove leading 'alias ' if present (bash format)
            if line.startswith('alias '):
                line = line[6:]
            # Parse name=value
            if '=' in line:
                name, _, value = line.partition('=')
                name = name.strip()
                value = value.strip()
                # Remove surrounding quotes
                if (value.startswith("'") and value.endswith("'")) or \
                   (value.startswith('"') and value.endswith('"')):
                    value = value[1:-1]
                if name:
                    _alias_cache[name] = value
    except Exception:
        pass  # Fail silently, return empty cache

    return _alias_cache


def expand_alias(command: str) -> str:
    """
    Expand shell alias in the first token of a command.

    Uses cached alias lookups for performance. The cache is populated
    once per hook invocation by sourcing the shell rc file.

    Args:
        command: A single bash command (not compound).

    Returns:
        Command with first token expanded if it's an alias,
        otherwise the original command unchanged.

    Example:
        >>> # With alias gco='git checkout'
        >>> expand_alias("gco -f")
        'git checkout -f'
    """
    parts = command.split(None, 1)  # Split into [first_token, rest]
    if not parts:
        return command

    first_token = parts[0]
    rest = parts[1] if len(parts) > 1 else ""

    # Skip if already a known command or path
    if first_token in ('git', 'rm', 'cat', 'less', 'nano', 'vim') or '/' in first_token:
        return command

    # Look up in alias cache
    alias_cache = _load_alias_cache()
    if first_token in alias_cache:
        expansion = alias_cache[first_token]
        return f"{expansion} {rest}".strip()

    return command


def expand_command_aliases(command: str) -> str:
    """
    Expand aliases in a possibly compound bash command.

    Splits compound command on shell operators, expands each subcommand's
    alias, and reconstructs the command.

    Recognized operators:
        - && (AND)
        - || (OR)
        - ; (sequential)
        - | (pipe)
        - & (background)

    Args:
        command: A bash command string, possibly compound.

    Returns:
        Command with aliases expanded in each subcommand.

    Example:
        >>> # With alias gco='git checkout', gcam='git commit -am'
        >>> expand_command_aliases("gco -f && gcam 'msg'")
        "git checkout -f && git commit -am 'msg'"
    """
    if not command:
        return command

    # Find the operators and their positions to preserve them.
    # This regex captures the operators as well as the commands.
    # Multi-character operators (&&, ||) must come before single-character
    # variants ([;&|]) to prevent partial matching.
    parts = re.split(r'(\s*(?:&&|\|\||[;&|])\s*)', command)

    result = []
    for part in parts:
        # Check if this part is an operator
        if re.match(r'\s*(?:&&|\|\||[;&|])\s*', part):
            result.append(part)
        elif part.strip():
            # It's a command, expand its alias
            result.append(expand_alias(part.strip()))
        else:
            result.append(part)

    return ''.join(result)


def extract_subcommands(command: str) -> list[str]:
    """
    Split compound bash command into individual subcommands.

    Splits on shell chaining operators:
        - && (AND)
        - || (OR)
        - ; (sequential)
        - | (pipe)
        - & (background)

    Multi-character operators (&&, ||) are matched before single-character
    variants to prevent partial matching (e.g., '&&' won't be split as '&' + '&').

    Args:
        command: A bash command string, possibly compound.

    Returns:
        List of individual subcommands with whitespace stripped.

    Example:
        >>> extract_subcommands("cd /tmp && git add . && git commit -m 'msg'")
        ['cd /tmp', 'git add .', "git commit -m 'msg'"]
        >>> extract_subcommands("echo ok | rm foo")
        ['echo ok', 'rm foo']
        >>> extract_subcommands("sleep 1 & rm bar")
        ['sleep 1', 'rm bar']
    """
    if not command:
        return []
    subcommands = re.split(r'\s*(?:&&|\|\||[;&|])\s*', command)
    return [cmd.strip() for cmd in subcommands if cmd.strip()]


def _extract_balanced_paren_content(command: str, start_idx: int) -> str | None:
    """
    Extract content from balanced parentheses starting at given index.

    Given a string and the index of an opening '(', finds the matching
    closing ')' accounting for nested parentheses.

    Args:
        command: The full command string.
        start_idx: Index of the opening '(' character.

    Returns:
        The content between the balanced parentheses (excluding the parens
        themselves), or None if no balanced closing paren is found.

    Example:
        >>> _extract_balanced_paren_content("$(echo $(rm foo))", 1)
        'echo $(rm foo)'
    """
    if start_idx >= len(command) or command[start_idx] != '(':
        return None

    depth = 0
    for i in range(start_idx, len(command)):
        if command[i] == '(':
            depth += 1
        elif command[i] == ')':
            depth -= 1
            if depth == 0:
                # Found the matching closing paren
                return command[start_idx + 1:i]

    # No matching closing paren found
    return None


def extract_subshell_commands(command: str) -> list[str]:
    """
    Extract commands embedded in subshells from a bash command string.

    Detects and extracts commands from:
        - $(...) command substitution (modern syntax, handles nesting)
        - `...` backtick command substitution (legacy syntax)

    This is a security measure to detect dangerous commands hidden inside
    subshells, e.g., `echo $(rm -rf /)` or `echo \`rm foo\``.

    Uses balanced parenthesis scanning to correctly handle nested $()
    subshells like `$(echo $(rm foo))`.

    Args:
        command: A bash command string that may contain subshells.

    Returns:
        List of commands found inside subshells. Returns empty list if
        no subshells are found.

    Example:
        >>> extract_subshell_commands("echo $(whoami)")
        ['whoami']
        >>> extract_subshell_commands("echo `rm foo` bar")
        ['rm foo']
        >>> extract_subshell_commands("$(cat file) | $(rm -rf /)")
        ['cat file', 'rm -rf /']
        >>> extract_subshell_commands("echo $(echo $(rm foo))")
        ['echo $(rm foo)']
    """
    if not command:
        return []

    subshell_commands = []

    # Extract from $(...) - modern command substitution
    # Use balanced parenthesis scanning to handle nested subshells
    i = 0
    while i < len(command) - 1:
        if command[i:i+2] == '$(':
            # Found start of $(), extract balanced content
            inner_cmd = _extract_balanced_paren_content(command, i + 1)
            if inner_cmd is not None:
                inner_cmd = inner_cmd.strip()
                if inner_cmd:
                    subshell_commands.append(inner_cmd)
                # Skip past this subshell to avoid re-matching nested ones
                # at the top level (they'll be found via recursion)
                i += 2 + len(inner_cmd) + 1  # $( + content + )
                continue
        i += 1

    # Extract from `...` - backtick command substitution (legacy syntax)
    # Backticks cannot be nested, so a simple pattern works
    backtick_pattern = r'`([^`]+)`'
    for match in re.finditer(backtick_pattern, command):
        inner_cmd = match.group(1).strip()
        if inner_cmd:
            subshell_commands.append(inner_cmd)

    return subshell_commands


def extract_all_commands(command: str) -> list[str]:
    """
    Recursively extract all commands from a bash command string.

    This combines subcommand extraction (splitting on shell operators)
    with subshell extraction (commands inside $() or backticks) to
    provide a comprehensive list of all commands that will be executed.

    This is the recommended function for security hooks that need to
    inspect all commands, including those hidden in subshells.

    Args:
        command: A bash command string, possibly compound with subshells.

    Returns:
        List of all individual commands, including those from subshells.

    Example:
        >>> extract_all_commands("echo $(rm foo) && ls")
        ['echo $(rm foo)', 'ls', 'rm foo']
        >>> extract_all_commands("cat `echo secret` | grep pass")
        ['cat `echo secret`', 'grep pass', 'echo secret']
    """
    if not command:
        return []

    all_commands = []

    # First, extract top-level subcommands (split on operators)
    subcommands = extract_subcommands(command)
    all_commands.extend(subcommands)

    # Then, extract commands from subshells within the original command
    subshell_cmds = extract_subshell_commands(command)

    # Recursively process subshell commands (they may contain nested subshells
    # or chained operators)
    for subcmd in subshell_cmds:
        all_commands.extend(extract_all_commands(subcmd))

    return all_commands
