---
name: weekly-maintenance
description: Weekly system maintenance — analyze mistakes, health check, observability review, version updates, smoke test, cleanup-engine audit, regression guards
---

Run weekly system maintenance:

1. Run /analyze-mistakes — review failure patterns from the past week.
2. Run /health — registry integrity, version updates, knowledge staleness.
3. Run /observe — render the full 6-section observability dashboard. Paste the output into the summary. (Replaces the removed `weekly-cleanup-scan` task — section 6 of the dashboard is the cleanup audit.)
4. If /health finds outdated skill packs or CLI tools, show the user and offer to update. Surface the SKILL-PACK CHECK and VERSION CHECK nags even if the session-start hook has already nagged this week.
5. Run `bash ~/.claude/scripts/smoke-test.sh` — must report STATUS: HEALTHY with 0 failures. Report any regressions (including the G-ERR-014 regression guard).
6. Update SYSTEM_VERSION.md component counts:
   ```bash
   HOOKS=$(ls ~/.claude/hooks/*.py ~/.claude/hooks/*.sh ~/.claude/hooks/*.js 2>/dev/null | wc -l)
   COMMANDS=$(ls ~/.claude/commands/*.md ~/.claude/commands/flow/*.md 2>/dev/null | wc -l)
   ```
7. Validate skill-count parity across all 4 sources — SYSTEM_VERSION.md, ARCHITECTURE.md, skills/ACTIVE-DIRECTORY.md, REFERENCE.md must all agree on the active skill count. If they diverge, fix the stale ones via `node ~/.claude/scripts/validate-skill-counts.js`.
8. **Cleanup-engine audit** — scan `logs/cleanup.jsonl` for the last 7 days. Flag any rule with >0 errors and investigate the extracted script (`hooks/cleanup-rules/*.js`) or the config entry (`hooks/cleanup-config.json`). Example:
   ```bash
   grep '"error"' ~/.claude/logs/cleanup.jsonl | tail -20
   ```
9. Summarize: "Weekly maintenance complete. {N} failures analyzed, {N} health issues found, {N} updates available, smoke {PASS|FAIL}, skill-count parity {OK|DRIFT}, cleanup rules {N errors in 7d}."
