# Hooks Contract

All hooks receive JSON on stdin and respond via stdout + exit code.

## Shared Utilities — `lib.js` + `lib/` (v8.5)

Domain libs live in `lib/` (since v8.5, 2026-06-09):

| Module | Exports | Used by |
|--------|---------|---------|
| `lib/slug.js` | `entitySlug` (FROZEN — keys atlas-kg entities.json), `canonKey` (cross-system matching), `cwdSlug` (FROZEN — keys handoffs/session-hot; bash twin in session-stop.sh, parity-asserted by smoke-test) | atlas-kg.js, session-handoff.js, atlas-kg-vault-sync.js, recall.js, recall-embed-index.js |
| `lib/session.js` | `readHandoff`, `readTodos`, `getDigest` | wiki-session-log.js (the designated home for session-state readers — next consumer lands here, not as another private copy) |
| `lib/git.js` | `getGitState(cwd)` | session-handoff.js |
| `lib/ollama.js` | `ollamaGenerate`, `ollamaEmbed`, `isBreakerOpen`, `MODELS` (fast/deep/embed tiers) — ONE system-wide circuit breaker at `cache/ollama-breaker.json` (session-transcript-log.py reads the same file) | pre-read-local-llm.js, session-handoff.js, recall.js, recall-embed-index.js, transcript-distill-weekly.js |

All Node hooks import generic helpers from `lib.js` instead of defining their own:

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
| `blockTool(reason)` | PreToolUse: emit `permissionDecision: "deny"` (v8.14 — the old nested `decision` key was unrecognized and silently ignored) |
| `injectContext(message, hookEventName?)` | Any context-capable event: emit `hookSpecificOutput.additionalContext` with the event name captured from stdin (v8.14 — the old bare top-level `{additionalContext}` was unrecognized and silently dropped) |

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

> **v8.14 correction — the shapes previously documented here were WRONG and caused a system-wide silent failure.** The harness parses hook stdout as JSON and silently drops unrecognized keys. The old `decision`/`reason` nested form and the bare top-level `{additionalContext}` were both unrecognized — every message emitted in those shapes was a no-op (KNOWLEDGE-162). The shapes below match the current hooks reference.

### PreToolUse — Deny a tool call
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Why it was blocked"
  }
}
```
(`permissionDecision` accepts `"allow" | "deny" | "ask"` — use `"ask"` for user-confirmation flows.)

### Inject context — ALL context-capable events (PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, SessionStart, Stop)
```json
{
  "hookSpecificOutput": {
    "hookEventName": "<the event this hook is wired to>",
    "additionalContext": "Message visible to the agent"
  }
}
```

**Note**: there is NO valid top-level `additionalContext` — it must be inside `hookSpecificOutput` with the correct `hookEventName`. `lib.js` `injectContext()` handles this automatically (event name captured from the stdin payload). PermissionDenied ignores hook stdout entirely.

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
| `cctools bash_hook.py` | PreToolUse | Bash | Unified gate: runs 6 checks (rm-block, git-add, git-checkout, git-commit, env-file, secret-patterns). Imports `rm_block_hook.py` — do NOT register as a separate hook. Git checks are gated by the `allow_git_hook.py` session flag. Blocks only, no logs. |
| `cctools file_length_limit_hook.py` | PreToolUse | Write\|Edit | (blocks only, no logs) |
| `cctools read_env_protection_hook.py` | PreToolUse | Read | (blocks only, no logs) |
| `skill-usage-log.js` | PreToolUse | Skill | `logs/skill-usage.jsonl` (v7.0 — appends `{ts, skill, cwd, session_id}` per Skill invocation; feeds `/observe` "Skill usage" section and `drift-proposer.js` skill_unused detector; fail-open) |
| graph hint (inline bash) | PreToolUse | Glob\|Grep | (stdout only — prefers CRG `.code-review-graph/graph.db` → MCP tools, falls back to graphify `graphify-out/graph.json` → `GRAPH_REPORT.md`) |
| `allow_git_hook.py` | UserPromptSubmit | * | (session-scoped git approval, no logs) |
| `auto-formatter` | PostToolUse | Write\|Edit\|MultiEdit | (no logs) |
| CRG auto-update (inline bash) | PostToolUse | Write\|Edit\|MultiEdit | (stdout only — if `.code-review-graph/graph.db` exists, runs `uvx code-review-graph update` backgrounded with 3s timeout, fail-open) |
| `pre-commit-gate.js` | PreToolUse | Bash | (stdout only — warns if build+test not run before commit) |
| `tsc-check.js` | PostToolUse | Write\|Edit\|MultiEdit | (stdout only — TS errors as additionalContext) |
| `post-tool-monitor.js` | PostToolUse | Read\|Glob\|Grep\|Write\|Edit\|MultiEdit\|Bash\|Agent | `logs/tool-failures.jsonl`, `logs/error-patterns.json`, `logs/hook-health.jsonl`, `logs/tool-call-counts.json`, `cache/efficiency-*.json` (efficiency counts/failure logging stay bounded to expensive tools via `MATCH_EXPENSIVE` guard; Read/Glob/Grep only feed action-graph logging) |
| `tool-failure-handler.js` | PostToolUseFailure | * | `logs/tool-failures.jsonl`, `logs/tool-health.json` (MCP failures tagged with `is_mcp: true`) |
| `system-detect.js` | SessionStart | * | `cache/system-detect-<cwd_slug>.json` (v8.6 — Capability System proposer: scores CWD vs `systems/registry.json` detect signals, bounded depth-3 walk + ~200-fs-op budget, prints at most one `SYSTEM:` advisory, never auto-activates; 24h per-CWD throttle file doubles as recoverable last-proposal; inline registry regen via mtime guard; profile-gated `system-detect`, fail-open) |
| `session-start.sh` | SessionStart | * | (stdout only — v7.0 delegates §7a–§7k bespoke cleanup to `cleanup-runner.js`, and fires `drift-proposer.js` §8a after §8 stale-temp cleanup) |
| `cleanup-runner.js` | SessionStart (§7a via session-start.sh) | * | `logs/cleanup.jsonl` (v7.0 — declarative engine, 13 rules in `cleanup-config.json`, 9 modes; `--dry-run` supported; fail-open per rule) |
| `drift-proposer.js` | SessionStart (§8a via session-start.sh) | * | `cache/last-drift-proposal.json` (v7.0 — at most 1 DRIFT advisory per session when thresholds in `drift-thresholds.json` cross; 24h per-kind cooldown; `/apply-drift-fix` consumes) |
| `session-stop.sh` | Stop | * | `handoffs/<cwd-slug>.md` (per-CWD — `/`, `\`, `:` → `_`) |
| `scripts/progressive-learning/precompact-reflect.sh` | PreCompact | * | (stdout only — Tier 2: action-graph digest injection + state.json snapshot) |
| `claudio` | Notification | * | (external) |
| `statusline.js` | StatusLine | * | `/tmp/claude-ctx-*.json` (bridge file) |
| `session-reminders.js` | PreToolUse \| PostToolUse | varies by `--reminder` flag | Unified session-throttled reminder dispatcher (merged 2026-05-15 — absorbed `build-ship-verify-reminder.js` + `ui-edit-design-check-reminder.js`). State: single JSON per session at `cache/session-reminders-<session_id>.json`. Variants: **`--reminder=build-ship-verify`** (PostToolUse Bash) — injects /ship-verify (SK-128) reminder when bash matches flutter/gradle/npm/pnpm/bun/yarn build, next/vite/turbo build, vercel/netlify deploy, gh-pages, npm publish, eas build, xcodebuild. **`--reminder=ui-edit-design-check`** (PreToolUse Write\|Edit\|MultiEdit) — injects /design-check (SK-127) reminder when path matches UI extensions (.tsx/.jsx/.vue/.svelte/.astro/.dart/.swift/.kt/.java/layouts/*.xml) or sits under UI dirs (screens/components/pages/widgets/views/app/(groups)/ui). Both throttled once/session, fail-open, non-blocking. |
| `open-ended-scope-guard.js` | UserPromptSubmit | * | (stdout only — fires when prompt contains "finish/continue/wrap up the app/project/work/implementation" WITHOUT a bounded signal like "step N", "phase N", "wave N", "R6/R7", "plan in X.md", "but only", "just the", "specifically", "only N"; injects scope-plan reminder; fail-open). Added 2026-05-15 per Insights friction fix. |
| `web-intent-router.js` | UserPromptSubmit | * | (stdout only — fires the user's two natural-language web doors at INTENT time, which `web-project-context.js` cannot: that one needs a `package.json`, so a NEW site in an empty folder never triggers it, and SessionStart cannot catch an ask made mid-session. Requires an action verb + a site noun in one clause; `META_VETO` suppresses system/brain/config talk. NEW → `commands/new-web.md`; EXISTING → `.impeccable.md` + cook-log. A ≤3-line SIGNPOST, never orders, per `webdev-brain-routes-not-mandates`. Matcher unit-tested in `scripts/test-validators.js`; fail-open). Added 2026-07-23. |
| `verify-before-answer.js` | UserPromptSubmit | * | (stdout only — injects the standing "verify external/time-sensitive facts before asserting" reminder on every prompt. Self-scoping: the wording tells Claude to search only when the answer depends on an external fact and to skip purely local code/logic work, so it never forces a wasteful search on "fix this typo".) |
| `path-validator.js` | PreToolUse | Read | (blocks + stdout — two merged jobs since 2026-05-15, absorbing `wave-2-contamination-guard.js` to save a Node bootstrap per Read: (1) blind-test contamination guard, blocking `plans/_blind-tests/**` unless `BLIND_TEST_OPERATOR=1`, soft-warning when CWD is `~/.claude/`; (2) path validation.) |
| `preview-health-gate.js` | PreToolUse | `mcp__Claude_Browser__.*` \| `mcp__Claude_Preview__preview_.*` | (stdout only — reads the tool-health tally in `logs/tool-health.json` (kept by `post-tool-monitor.js`) and, when preview has been failing recently (screenshot timeouts, navigate/snapshot errors), injects a NON-BLOCKING advisory steering toward the Playwright fallback. Never blocks — preview can still be the right call.) |
| `deletion-guard.js` | PostToolUse | Edit\|MultiEdit | (stdout only — F-13, v10. Fires when an edit's `old_string` contains a symbol definition (method, function, `toString`, CSS class) the `new_string` lacks, injecting a once-per-file-per-session advisory pointing at the CLAUDE.md deletion protocol. Born from the 2× JavaFX `toString()` regression, where both times there were zero grep-visible call sites. Not on Write — no old-content diff there.) |
| `user-rejection-log.js` | PostToolUseFailure \| PermissionRequest \| PermissionDenied | * | `logs/user-rejections.jsonl` (captures user denials of tool calls — high-signal moments where the user disagreed with a proposed action, flagged by the 2026-05-13 Insights report as otherwise-lost signal.) |
| `archived-skill-offer.js` | SessionStart | * | (stdout only — v10 U3-8: the consumer for `archived-skills-manifest.json`, which had 60+ detection patterns and no consumer, making aggressive archiving safe. Checks cwd against each archived skill's `detect_files` (literal paths + simple prefixes, bounded fs ops) and `detect_packages` (one package.json read); on first match injects ONE advisory naming the archived skill and how to restore it.) |
| `system-doctor-advisory.js` | SessionStart | * | (stdout only — reads the latest result from `cache/system-ground-truth.json` and surfaces a one-line DRIFT advisory if any validator is red OR the snapshot is stale (mtime > 7 days). Replaced the narrower `detect-orphan-hooks.js` with a surface covering every validator in the manifest.) |
| `ensure-frontend-mcp.js` | SessionStart | * | (`scripts/`, not `hooks/` — auto-provisions the 5 UI-component MCP servers (shadcn, heroui, aceternity, magicuidesign-mcp, iconify) into a frontend project's own `.mcp.json` at project scope. They were demoted from global user scope on 2026-05-28 (jazzy-wren audit) to cut tool-surface bloat; this restores them only in projects that actually need them, detected via package.json frontend deps.) |

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

## Unified Bash Safety Gate

`bash_hook.py` is the sole PreToolUse/Bash hook. It imports and runs six blockers in sequence on every Bash call:

| Check | Source module | What it does |
|-------|---------------|--------------|
| `check_rm_command` | `rm_block_hook.py` | Blocks `rm` — enforces "Never use rm, always use mv to trash" |
| `check_git_add_command` | `git_add_block_hook.py` | Blocks `git add -A` / `git add .` — prompts for specific paths |
| `check_git_checkout_command` | `git_checkout_safety_hook.py` | Blocks destructive `git checkout` on files with uncommitted changes |
| `check_git_commit_command` | `git_commit_block_hook.py` | Returns `ask` unless a session allow-flag exists |
| `check_env_file_access` | `env_file_protection_hook.py` | Blocks reads/writes targeting `.env*` files |
| `check_secret_patterns` | `bash_hook.py` inline | Blocks commands containing obvious secret patterns |

**Session allow-flag**: `allow_git_hook.py` (UserPromptSubmit) creates a session-scoped flag file in Python's temp dir (`C:\tmp\claude\allow-git-*.{session_id}` on Windows) whenever the user's prompt mentions git. `check_git_commit_command` reads that flag and converts the `ask` decision into allow for the remainder of the session. Flags are pruned on SessionStart.

**Do NOT register these as separate hooks in `settings.json`** — it causes each check to run twice per Bash call. `bash_hook.py` is the single entry point.

**To disable all safety checks for debugging**: set `BYPASS_SAFETY_HOOKS=1` in the environment (see Security section below). Bypass events are logged to `logs/security-bypass.jsonl`.

**To override per-project**: create `<project>/.claude/settings.json` with a replacement PreToolUse/Bash block. Project-scope overrides layer on top of user-scope settings.

## Security: BYPASS_SAFETY_HOOKS

`context-guard.js` checks for `BYPASS_SAFETY_HOOKS=1` in environment variables. When set, **all security checks are skipped** (`.env` write detection, AWS key blocking, context budget enforcement).

- Bypass events are logged to `logs/security-bypass.jsonl`
- **Do NOT set this in `settings.json` env vars** — use only for emergency debugging
- This is an escape hatch, not a workflow toggle. If you need to bypass a specific check, modify the check itself
