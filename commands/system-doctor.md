---
description: Unified system validator scoreboard — runs every scripts/validate-*.js and aggregates results
allowed-tools:
  - Bash
---

# /system-doctor

One-stop self-diagnostics for the ATLAS system. Runs all 9 validators in `scripts/validate-*.js` (listed in the `scripts/lib/validators.js` manifest) and emits a markdown scoreboard plus per-validator drill-down.

## Validators run

| Validator | What it checks |
|---|---|
| `skill-counts` | 4 doc surfaces agree on active-skill count + depth-aware filesystem breakdown |
| `cross-listed-skills` | No skill ID appears in BOTH ACTIVE-DIRECTORY and ARCHIVE-DIRECTORY |
| `archive-counts` | Every `_archived/<slug>/` is referenced in ARCHIVE-DIRECTORY (and vice versa) |
| `symlinks` | Every entry in `SYMLINKS.md` resolves to an existing target |
| `archive-manifest` | Every detection pattern in `archived-skills-manifest.json` resolves to a `_archived/<slug>/` dir |
| `commands` | Every slash command in `REFERENCE.md` exists as a file or plugin command |
| `hooks` | Every `hooks/*.js` is wired in `settings.json`, called from another script, or referenced from a scheduled task |
| `knowledge` | Engineering knowledge entry IDs are unique and `**Type**` values valid |
| `references` | Every script/hook referenced by automation (`settings.json`, `cleanup-config.json`, scheduled-tasks, `session-*.sh`, `CLAUDE.md`, `REFERENCE.md`) exists on disk |

## Run it

!`node ~/.claude/scripts/system-doctor.js`

## Flags

- `--json` — emit structured JSON instead of markdown (for tooling)
- `--strict` — exit non-zero on warnings too (default: only on drift)

## When to run

- After ATLAS infrastructure changes (hooks, skills, settings, REFERENCE.md, ARCHITECTURE.md edits).
- Before publishing a session handoff with system-level changes.
- Weekly via the `weekly-validator-sweep` scheduled task — **NOTE (2026-05-16): defined at `scheduled-tasks/weekly-validator-sweep/SKILL.md` but not currently registered in the scheduled-tasks plugin.** Register interactively via `mcp__scheduled-tasks__create_scheduled_task` with `cronExpression: "30 3 * * 0"` to activate. Until then, the snapshot only refreshes on demand.
- On every SessionStart when `ATLAS_HEALTH_BLOCK=1`.