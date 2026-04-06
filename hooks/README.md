# Hooks Contract

All hooks receive JSON on stdin and respond via stdout + exit code.

## Shared Utilities — `lib.js`

All Node hooks import from `lib.js` instead of defining their own helpers:

```js
const { paths, loadThresholds, readJsonSafe, writeJsonSafe,
  appendLine, ensureDir, rotateIfLarge, readStdin,
  blockTool, injectContext } = require('./lib');
```

| Export | Purpose |
|--------|---------|
| `paths.logs/cache/tmp/claude/hooks` | Standard directory constants |
| `loadThresholds()` | Load context-thresholds.json (cached) |
| `readJsonSafe(path, fallback)` | Parse JSON file, return fallback on error |
| `writeJsonSafe(path, data)` | Write JSON to file |
| `appendLine(path, line)` | Append line to file |
| `ensureDir(dir)` | mkdir -p equivalent |
| `rotateIfLarge(path, maxBytes?)` | Rotate file if > maxBytes (default 2MB) |
| `readStdin(callback)` | Collect stdin, parse JSON, call callback |
| `blockTool(reason)` | PreToolUse: emit block decision |
| `injectContext(message)` | PostToolUse/Failure: emit additionalContext |

## Input (stdin)

```json
{
  "session_id": "string",
  "tool_name": "string",
  "tool_input": { ... }
}
```

Additional fields vary by event (`hook_event_name`, `tool_response`, etc.).

## Output by Hook Type

### PreToolUse — Block a tool call
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "decision": "block",
    "reason": "Why it was blocked"
  }
}
```

### PreToolUse — Ask user for confirmation
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "decision": "ask",
    "reason": "Why approval is needed"
  }
}
```

### PreToolUse — Inject context (allow + inform)
```json
{ "additionalContext": "Message visible to the agent" }
```

### PostToolUse — Inject context
```json
{ "additionalContext": "Message visible to the agent" }
```

### PostToolUseFailure — Inject context
```json
{ "additionalContext": "Message visible to the agent" }
```

**Note**: PostToolUse and PostToolUseFailure both use top-level `additionalContext`, NOT nested under `hookSpecificOutput`.

### Allow silently (any hook type)
```
process.exit(0)   // JS — no stdout
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

## Active Hooks and Their Log Files

| Hook | Event | Matcher | Log Files |
|------|-------|---------|-----------|
| `context-guard.js` | PreToolUse | Write\|Edit\|MultiEdit\|Bash\|Agent | `logs/security-bypass.jsonl`, `logs/context-guard.jsonl` |
| `cctools bash_hook.py` | PreToolUse | Bash | (blocks only, no logs) |
| `cctools file_length_limit_hook.py` | PreToolUse | Write\|Edit | (blocks only, no logs) |
| `cctools read_env_protection_hook.py` | PreToolUse | Read | (blocks only, no logs) |
| `auto-formatter` | PostToolUse | Write\|Edit\|MultiEdit | (no logs) |
| `post-tool-monitor.js` | PostToolUse | Write\|Edit\|MultiEdit\|Bash\|Agent | `logs/failures.jsonl`, `logs/error-patterns.json`, `logs/hook-health.jsonl`, `logs/tool-call-counts.json`, `cache/efficiency-*.json` |
| `tool-failure-handler.js` | PostToolUseFailure | * | `logs/tool-failures.jsonl`, `logs/tool-health.json` |
| `session-start.sh` | SessionStart | * | (stdout only) |
| `session-stop.sh` | Stop | * | `.last-session-handoff` |
| `precompact-reflect.sh` | PreCompact | * | (stdout only) |
| `claudio` | Notification | * | (external) |
| `statusline.js` | StatusLine | * | `/tmp/claude-ctx-*.json` (bridge file) |

## Languages

| Language | When to use |
|----------|-------------|
| **JS (Node)** | Default for all new hooks. Fast startup, native JSON, shared lib.js |
| **Python** | Complex logic, regex-heavy scanning (cctools safety hooks) |
| **Bash** | File existence checks, simple conditionals (session lifecycle) |

## Adding a New Hook

1. Write the hook using `lib.js` utilities and the output contract above
2. Register it in `settings.json` under the appropriate event
3. Add a test to `scripts/smoke-test.sh`
4. Prefer extending `post-tool-monitor.js` for new PostToolUse telemetry
