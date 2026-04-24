---
name: observe
description: "Render the 6-section ATLAS observability dashboard (tool health, safety hooks, skill usage, scheduled tasks, action graph, cleanup)."
allowed-tools:
  - Read
  - Bash
  - Write
---

<objective>
Refresh the scheduled-tasks cache, then render the full 6-section dashboard from existing telemetry. This is the time-series complement to `/health`'s point-in-time diagnostic — run it whenever you want to see how the system is actually behaving.
</objective>

<process>

## 1. Refresh the scheduled-tasks cache

Section 4 of the dashboard depends on a cache the script can't populate itself (the MCP tool lives in-session). Call the MCP list tool and persist the result:

```
mcp__scheduled-tasks__list_scheduled_tasks
```

Write the raw response to `~/.claude/cache/scheduled-tasks-latest.json` with this shape:

```json
{
  "refreshed_at": "<ISO-8601 now>",
  "tasks": [ /* the tasks array returned by the MCP call, verbatim */ ]
}
```

If the MCP tool is unavailable or errors, skip this step — the dashboard section will show `no scheduled-tasks cache` and the rest still renders.

## 2. Render the dashboard

Invoke the emitter. Pipe stdout directly to chat — **do not** reformat, summarize, or truncate:

```bash
node ~/.claude/scripts/observability.js
```

Flags you can pass through on request:
- `--json` — machine-readable output (for piping into other tools).
- `--section=<name>` — restrict to one section. Valid: `tool_health`, `safety_hooks`, `skill_usage`, `scheduled_tasks`, `action_graph`, `cleanup`.

## 3. Flag anything that warrants action

After the table renders, add a short `## Signals` block below the dashboard **only if** any of the following are true:

- A tool in section 1 has `streak ≥ 3` — suggest investigating that tool or temporarily disabling the MCP server if applicable.
- Section 3 reports any skill in the "Unused (≥30d)" list that has never been used since its creation — suggest `/skill-archive` as a potential follow-up.
- Section 4 has a task marked `⚠ drift` — suggest re-triggering it via `mcp__scheduled-tasks__update_scheduled_task` or investigating the cron.
- Section 6 reports any cleanup rule with errors in the last 7 days — point at `hooks/cleanup-runner.js` or the rule's extracted script.

If nothing is actionable, omit the Signals block entirely. The raw table is the deliverable.

</process>
