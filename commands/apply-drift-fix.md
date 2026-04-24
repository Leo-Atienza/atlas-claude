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

### `kind: skill_unused`
- Confirm archive is desired (the skill has had 0 invocations since the hook started logging).
- Move to archive:
  ```bash
  mkdir -p ~/.claude/skills/_archived
  mv ~/.claude/skills/<target> ~/.claude/skills/_archived/<target>
  ```
- Remove the skill from `skills/ACTIVE-DIRECTORY.md` and update any component-count references (run `/health` afterward to re-sync).

## 3. Mark the proposal resolved

After the user confirms the action is complete, append an `outcome` to the proposal history:

```bash
node -e '
  const fs = require("fs"), p = process.env.HOME + "/.claude/cache/last-drift-proposal.json";
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (j.current) {
    j.current.resolved_at = new Date().toISOString();
    j.current.outcome = process.argv[1] || "applied";
  }
  j.history = j.history || [];
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
