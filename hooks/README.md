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
| `context-guard.js` | PreToolUse | Read\|Write\|Edit\|MultiEdit\|Bash\|Agent | `logs/security-bypass.jsonl`, `logs/context-guard.jsonl` (Read → duplicate-read advisory via atlas-action-graph; Write/Edit/MultiEdit → security gate; all → context budget) |
| `cctools bash_hook.py` | PreToolUse | Bash | (blocks only, no logs) |
| `cctools file_length_limit_hook.py` | PreToolUse | Write\|Edit | (blocks only, no logs) |
| `cctools read_env_protection_hook.py` | PreToolUse | Read | (blocks only, no logs) |
| graph hint (inline bash) | PreToolUse | Glob\|Grep | (stdout only — prefers CRG `.code-review-graph/graph.db` → MCP tools, falls back to graphify `graphify-out/graph.json` → `GRAPH_REPORT.md`) |
| `allow_git_hook.py` | UserPromptSubmit | * | (session-scoped git approval, no logs) |
| `auto-formatter` | PostToolUse | Write\|Edit\|MultiEdit | (no logs) |
| CRG auto-update (inline bash) | PostToolUse | Write\|Edit\|MultiEdit | (stdout only — if `.code-review-graph/graph.db` exists, runs `uvx code-review-graph update` backgrounded with 3s timeout, fail-open) |
| `pre-commit-gate.js` | PreToolUse | Bash | (stdout only — warns if build+test not run before commit) |
| `tsc-check.js` | PostToolUse | Write\|Edit\|MultiEdit | (stdout only — TS errors as additionalContext) |
| `post-tool-monitor.js` | PostToolUse | Read\|Glob\|Grep\|Write\|Edit\|MultiEdit\|Bash\|Agent | `logs/failures.jsonl`, `logs/error-patterns.json`, `logs/hook-health.jsonl`, `logs/tool-call-counts.json`, `cache/efficiency-*.json` (efficiency counts/failure logging stay bounded to expensive tools via `MATCH_EXPENSIVE` guard; Read/Glob/Grep only feed action-graph logging) |
| `tool-failure-handler.js` | PostToolUseFailure | * | `logs/tool-failures.jsonl`, `logs/tool-health.json` (MCP failures tagged with `is_mcp: true`) |
| `session-start.sh` | SessionStart | * | (stdout only) |
| `session-stop.sh` | Stop | * | `handoffs/<cwd-slug>.md` (per-CWD — `/`, `\`, `:` → `_`) |
| `scripts/progressive-learning/precompact-reflect.sh` | PreCompact | * | (stdout only — Tier 2: action-graph digest injection + state.json snapshot) |
| `claudio` | Notification | * | (external) |
| `statusline.js` | StatusLine | * | `/tmp/claude-ctx-*.json` (bridge file) |

### Shared modules used by hooks (not hooks themselves)

| Module | Purpose | Storage |
|--------|---------|---------|
| `atlas-kg.js` | Temporal knowledge graph — entities, triples, validity windows | `~/.claude/atlas-kg/{entities,triples}.json` + snapshots |
| `atlas-extractor.js` | Heuristic regex classifier: handoff text → G-PAT/G-SOL/G-ERR/G-PREF/G-FAIL candidates | (caller-managed) |
| `atlas-action-graph.js` | In-session retrieval log + priority queue. Feeds duplicate-read advisory in `context-guard.js` and logging from `post-tool-monitor.js`. **Tier 2:** reference scanner (`post-tool-monitor.js` §5 flattens `tool_input` and calls `markUsed` with 3-tier direct/canonical/substring matching; `used_count` capped at `retrieved_count × 3`); `compactDigest` injected as `additionalContext` at PreCompact; state-file snapshots to `snapshots/`. **Tier 3:** `statsRollup` JSONL writer at session-stop; cross-session `carryoverDigest` at session-start (48h guard); `pruneOldSessions(7)` on every SessionStart. Separate keys for `read:`/`glob:`/`grep:`. Skips `/tmp/**`. mtime-aware. | `~/.claude/atlas-action-graph/${session_id}.jsonl` + `${session_id}.state.json` + `snapshots/` + `~/.claude/logs/action-graph-stats.jsonl` |

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

## Security: BYPASS_SAFETY_HOOKS

`context-guard.js` checks for `BYPASS_SAFETY_HOOKS=1` in environment variables. When set, **all security checks are skipped** (`.env` write detection, AWS key blocking, context budget enforcement).

- Bypass events are logged to `logs/security-bypass.jsonl`
- **Do NOT set this in `settings.json` env vars** — use only for emergency debugging
- This is an escape hatch, not a workflow toggle. If you need to bypass a specific check, modify the check itself
