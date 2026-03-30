---
name: weekly-memory-maintenance
description: Weekly memory maintenance — prune sessions >30, check INDEX/topics consistency, evolution health
---

Weekly Memory Maintenance — Automated Knowledge System Health Check

## Tasks

1. **Session Pruning**: Check session count in `~/.claude/projects/<PROJECT_MEMORY_DIR>/memory/sessions/sessions-index.md`. If >30 entries, prune oldest sessions AFTER verifying their learnings exist in topic files. Delete the session .md files and remove rows from sessions-index.md.

2. **INDEX ↔ Topics Consistency**:
   - Read INDEX.md and extract all entry IDs (G-PAT-xxx, G-SOL-xxx, G-ERR-xxx, G-PREF-xxx, G-FAIL-xxx)
   - List all files in topics/ directory
   - Report any orphaned topic files (file exists but no INDEX entry)
   - Report any missing topic files (INDEX entry exists but no file)
   - Auto-fix orphans by adding INDEX entries if the topic file has valid content

3. **Conflict Resolution Reminder**: Check `conflicts.md` for unresolved conflicts. If any exist >7 days old, flag them for user attention.

4. **Evolution Health**: Read `evolution.md` and report:
   - Total saves, promotions, milestones, refinements
   - Whether any patterns are approaching "proven" status (2+ confirmations)

5. **Report**: Output a concise summary of actions taken and any issues found.

## Paths
- MEMORY: ~/.claude/projects/<PROJECT_MEMORY_DIR>/memory
- INDEX: {MEMORY}/INDEX.md
- TOPICS: {MEMORY}/topics/
- SESSIONS: {MEMORY}/sessions/
- SESSIONS_INDEX: {SESSIONS}/sessions-index.md
- CONFLICTS: {MEMORY}/conflicts.md
- EVOLUTION: {MEMORY}/evolution.md