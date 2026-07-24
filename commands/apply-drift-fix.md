---
name: apply-drift-fix
description: "Read the most recent drift proposal (cache/last-drift-proposal.json) and help the user act on it — archive a skill, disable an MCP server, re-run a scheduled task, or fix a broken cleanup rule."
allowed-tools:
  - Read
  - Bash
  - Edit
  - Write
---

<objective>
The SessionStart drift-proposer writes its most recent proposal to `cache/last-drift-proposal.json`. This command reads that proposal and helps the user act on it safely.
</objective>

<process>

## 1. Load the most recent proposal

```bash
cat ~/.claude/cache/last-drift-proposal.json 2>/dev/null || echo "no proposal yet"
```

If there's no `current` proposal (file missing, empty, or `current` is null), report: "No active drift proposal — the system is clean or the proposer hasn't run this session." and stop.

## 2. Present the proposal

Show the user:
- Kind (`kind`)
- Target (`target`)
- Human-readable message (`message`)
- Suggested command (`apply_command`)
- How long ago it was emitted (`ts_iso`)

Ask what they want to do. Default actions per kind:

### `kind: scheduled_task_drift`
- Option A: trigger a manual run — `mcp__scheduled-tasks__update_scheduled_task { taskId: <target>, fireAt: <now+30s> }` then set it back to cronExpression afterward. OR simply re-enable if disabled.
- Option B: investigate why the previous fire never happened (check `lastRun` exit code, cron expression sanity).
- Option C: silence — add `"scheduled_task_drift"` to `silenced_kinds` in `hooks/drift-thresholds.json`.

### `kind: cleanup_rule_errors`
- Open `hooks/cleanup-config.json` and find the rule entry named in `target`.
- Open the matching script in `hooks/cleanup-rules/<name>.js` (if `mode: "custom"`) or inspect the relevant handler in `hooks/cleanup-runner.js`.
- Run a dry-run focused on this rule only: `node ~/.claude/hooks/cleanup-runner.js --dry-run --only=<target>`.
- Propose a fix; apply with the user's approval.

### `kind: tool_failure_streak`
- If the target is an MCP tool (`mcp__*`): locate the server in `.mcp.json` or the project's `.mcp.json` and ask whether to disable it.
- Otherwise: investigate the most recent failure payloads in `logs/tool-failures.jsonl`:
  ```bash
  grep -F '"<target>"' ~/.claude/logs/tool-failures.jsonl | tail -5
  ```

### `kind: mcp_server_unused` (v8.5)
- The target server logged 0 tool calls since `extra.since` (data is `_meta.since`-gated, so this is ≥30 days of real measurement, not a cold counter).
- Confirm it isn't an interactive-auth server you use rarely-but-deliberately (claude.ai connectors don't appear in local counts).
- Option A: disable — find the server in `~/.claude/.mcp.json` or `~/.claude.json` `mcpServers` and remove its entry (back the file up first: copy to `TRASH/` with a timestamp). If it's a plugin server, flip the plugin off in settings.json `enabledPlugins` instead (settings.json edits need explicit user authorization).
- Option B: keep — note `extra.unused_count` for the rest of the list, resolve as "deferred".
- Option C: silence — add `"mcp_server_unused"` to `silenced_kinds`.

### `kind: permission_friction` (v8.5)
- The target pattern (e.g. `Bash(npx:*)`) hit ≥N permission dialogs in 7d with **zero denials** — the user always says yes.
- Option A: add the suggested rule (or a tighter variant) to `permissions.allow` in `~/.claude/settings.json` — REQUIRES explicit user authorization (settings.json is classifier-protected; present the exact diff).
- Option B: decline — the user may want to keep approving that pattern; resolve as "deferred" and the 24h cooldown prevents re-nagging.

### `kind: skill_unused`
- Confirm archive is desired (the skill has had 0 invocations since the hook started logging).
- Move to archive:
  ```bash
  mkdir -p ~/.claude/skills/_archived
  mv ~/.claude/skills/<target> ~/.claude/skills/_archived/<target>
  ```
- **Update all six surfaces** (the validator only catches 4 of these — drift in the other 2 is silent):
  1. `skills/ACTIVE-DIRECTORY.md` — header `Total active skills: **N**` and the matching index row for the skill
  2. `skills/ACTIVE-PAGE-{1|2|...}-*.md` — remove the `| SK-NNN | ... |` row from whichever page contained it
  3. `ARCHITECTURE.md` — `(N active skill entries...)` count AND the `ACTIVE-PAGE-{n}-*.md — ... (M skills)` per-page count for the affected page
  4. `REFERENCE.md` — `Active skill index (N skills: X Core + Y Available)` row
  5. `SYSTEM_VERSION.md` — `| Skills (in ACTIVE-DIRECTORY) | N | <date> |` row
  6. `skills/ARCHIVE-DIRECTORY.md` — `Active (N): ...` census line at the bottom (legacy v6→v7 reduction tracker; **not** checked by the validator, drifts silently)
- After editing: re-split `9 Core + 27 Available` style counts so they still sum to the new total. Bump the date stamps where present.
- Run `node ~/.claude/scripts/validate-skill-counts.js` to confirm the 4 validated surfaces agree. The validator does **not** check surface 6 (ARCHIVE-DIRECTORY census) — verify it manually.
- Note: `/health` auto-updates `last_health_check` and component-count rows, but does **not** auto-bump the `version:` field. Bump that manually when archive corresponds to a versioned release.

## 3. Mark the proposal resolved

After the user confirms the action is complete, append an `outcome` to the proposal history:

```bash
node -e '
  const fs = require("fs"), p = process.env.HOME + "/.claude/cache/last-drift-proposal.json";
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (j.current) {
    j.current.resolved_at = new Date().toISOString();
    j.current.outcome = process.argv[1] || "applied";
    j.history = j.history || [];
    j.history.push(j.current);   // v8.14 fix: actually append to history…
    j.current = null;            // …and clear current so it is not re-presented
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
' "<applied|deferred|silenced>"
```

## 4. Verify

If the fix was mechanical (skill archive, cleanup config edit), run the relevant verifier:
- Skill archive: `node ~/.claude/scripts/validate-skill-counts.js`
- Cleanup rule fix: `node ~/.claude/hooks/cleanup-runner.js --dry-run`
- Scheduled task re-trigger: `mcp__scheduled-tasks__list_scheduled_tasks` to confirm `lastRunAt` updated.

Report what changed and what still requires attention.

</process>
