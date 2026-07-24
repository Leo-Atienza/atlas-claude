---
name: weekly-cleanup-scan
description: Weekly cleanup scan — hooks, disk usage, stale files, MCP health
---

Weekly Cleanup Scan — System Hygiene Check

## Tasks

1. **Stale Plan Files**: Check ~/.claude/plans/ for .md files older than 14 days. Report them (don't auto-delete — user may want to keep).

2. **Orphaned Worktree Directories**: Check for worktree directories in project repos. List any that exist but aren't checked out.

3. **Disk Usage Report**:
   ```bash
   du -sh ~/.claude/skills/
   du -sh ~/.claude/plugins/
   du -sh ~/.claude/projects/
   du -sh ~/.claude/plans/
   du -sh ~/.claude/scheduled-tasks/ 2>/dev/null
   ```

4. **Hook Integrity**: Verify all scripts referenced in settings.json exist:
   - ~/.claude/hooks/session-start.sh
   - ~/.claude/hooks/session-stop.sh
   - ~/.claude/hooks/security-gate.sh
   - ~/.claude/hooks/context-monitor.js
   - ~/.claude/hooks/statusline.js
   - ~/.claude/hooks/mistake-capture.py
   - ~/.claude/hooks/verify-completion.py
   - ~/.claude/hooks/post-compact-dream-check.sh
   - ~/.claude/scripts/progressive-learning/precompact-reflect.sh
   - ~/.claude/bin/claudio

5. **MCP Server Health**: Check that TOOL_SEARCH is still enabled in settings.json env vars. Verify no duplicate MCP servers have been re-added to .mcp.json.

6. **Plugin Check**: List enabled plugins from settings.json. Flag any that appear unused.

7. **Report**: Output a concise summary with action items if issues found.