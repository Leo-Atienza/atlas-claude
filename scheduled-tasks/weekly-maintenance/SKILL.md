---
name: weekly-maintenance
description: Weekly system maintenance: analyze mistakes, health check, version updates
---

Run weekly system maintenance:

1. Run /analyze-mistakes — review failure patterns from the past week
2. Run /health — check system health, registry integrity, version updates
3. If /health finds outdated skill packs or CLI tools, show the user and offer to update
4. Update SYSTEM_VERSION.md component counts by running: ls ~/.claude/hooks/*.py ~/.claude/hooks/*.sh ~/.claude/hooks/*.js | wc -l (hooks), ls ~/.claude/commands/*.md ~/.claude/commands/flow/*.md | wc -l (commands)
5. Summarize: "Weekly maintenance complete. {N} failures analyzed, {N} health issues found, {N} updates available."