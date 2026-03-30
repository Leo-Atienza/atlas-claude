---
name: skill-usage-audit
description: Monthly audit of archived skills — auto-unarchive used skills, auto-remove unused ones
---

You are running the monthly skill usage audit. All actions are automatic — no user confirmation needed.

## Steps

1. **Read detection logs** — Read `~/.claude/logs/skill-watcher.jsonl` to see which archived skills were detected in projects over the past month.

2. **Check session history** — Read `~/.claude/projects/<PROJECT_MEMORY_DIR>/memory/sessions/sessions-index.md` and scan for sessions that used technologies matching archived skills.

3. **Auto-apply decisions** (no confirmation needed):
   - **Detected 1+ times** → UNARCHIVE immediately: edit `~/.claude/skills/REGISTRY.md`, move entry from Archived section back to its Active section, remove `[ARCHIVED]` tag
   - **Never detected in 3+ months** → REMOVE: delete the skill directory and remove its entry from REGISTRY.md
   - **Never detected, < 3 months archived** → KEEP archived, no action

4. **Rotate logs** — Keep only last 500 lines of skill-watcher.jsonl.

5. **Output summary table**:
```
| Skill ID | Name | Detections | Action |
|----------|------|------------|--------|
```
