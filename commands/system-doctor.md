---
description: Unified system validator scoreboard — runs every scripts/validate-*.js and aggregates results
allowed-tools:
  - Bash
---

# /system-doctor

One-stop self-diagnostics for the ATLAS system. Runs every validator in the canonical manifest `scripts/lib/validators.js` (v10 added `agents`) and emits a markdown scoreboard plus per-validator drill-down.

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
| `knowledge` | Vault `engineering/` entry counts are consistent and carry no duplicate `KNOWLEDGE-NNN` IDs |
| `skill-collisions` | No description-trigger collisions, frontmatter non-conformance, or over-broad scopes across skills |
| `references` | Every script/hook referenced by automation (`settings.json`, `cleanup-config.json`, scheduled-tasks, `session-*.sh`) exists on disk |
| `systems` | Capability System manifests (`systems/*/SYSTEM.md`): skill/MCP/command/agent/rule refs resolve, detect patterns bounded, `registry.json` value-coherent, ids unique (self-skips when `systems/` absent) |

## Run it

!`node ~/.claude/scripts/system-doctor.js`

## Flags

- `--json` — emit structured JSON instead of markdown (for tooling)
- `--strict` — exit non-zero on warnings too (default: only on drift)

## When to run

- After ATLAS infrastructure changes (hooks, skills, settings, REFERENCE.md, ARCHITECTURE.md edits).
- Before publishing a session handoff with system-level changes.
- Weekly via the `weekly-validator-sweep` scheduled task (registered, `enabled:true`, cron `30 3 * * 0` — Sundays 03:30; refreshes the snapshot then runs the scoreboard).
- SessionStart surfacing is automatic via `hooks/system-doctor-advisory.js` (reads the snapshot; nudges only on red/stale — the old `ATLAS_HEALTH_BLOCK=1` env gate was never wired and is retired, v8.14).
