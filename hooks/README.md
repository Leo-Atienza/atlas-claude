# Hooks Contract

All hooks receive JSON on stdin and respond via stdout + exit code.

## Input (stdin)

```json
{
  "session_id": "string",
  "tool_name": "string",
  "tool_input": { ... }
}
```

Additional fields vary by event (`hook_event_name`, `tool_output`, etc.).

## Output (stdout)

### Allow silently (no output)
```
process.exit(0)   // JS
sys.exit(0)       // Python
exit 0            // Bash
```

### Inject context (allow + inform)
```json
{ "additionalContext": "Message visible to the agent" }
```

### Block a tool call (PreToolUse only)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Why it was blocked"
  }
}
```

### Ask user for confirmation (PreToolUse only)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Why approval is needed"
  }
}
```

### Block with legacy format
```json
{ "decision": "block", "reason": "Why" }
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success (allow or block decision was written to stdout) |
| non-zero | Hook error — system treats as allow (fail-open) |

## Error Handling

- **Never block on hook errors** — catch all exceptions, exit 0
- **Timeouts** are set in `settings.json` per hook (default varies)
- **Fail-open**: if a hook crashes, the tool call proceeds

## Languages

| Language | When to use |
|----------|-------------|
| **JS (Node)** | Default for all new hooks. Fast startup, native JSON |
| **Python** | Complex logic, regex-heavy scanning (bash_hook.py, verify-completion.py) |
| **Bash** | File existence checks, simple conditionals (session-start.sh, security-gate.sh) |

## File Locations

| Path | Purpose |
|------|---------|
| `hooks/` | Active hooks registered in settings.json |
| `hooks/cctools-safety-hooks/` | Safety hook suite (bash, git, env, rm checks) |
| `logs/hook-health.jsonl` | Hook execution timing (written by post-tool-monitor.js) |

## Adding a New Hook

1. Write the hook following the stdin/stdout contract above
2. Register it in `settings.json` under the appropriate event
3. Add a test to `scripts/smoke-test.sh`
4. Update `skills/REGISTRY.md`

Prefer extending `post-tool-monitor.js` for new PostToolUse telemetry instead of creating a new hook.
