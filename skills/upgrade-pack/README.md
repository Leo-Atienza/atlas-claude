# Upgrade pack (mirror of `~/.cursor/skills`)

Canonical copies of the global agent upgrade skills live under:

`%USERPROFILE%\.cursor\skills\`

This directory mirrors the same `SKILL.md` files for Claude Code / tooling that loads `~/.claude/skills/**` but not Cursor’s personal skill path.

| Skill | Purpose |
|-------|---------|
| `session-lifecycle-manager` | Checkpoint + handoff scaffolding |
| `memory-capture-router` | Obsidian vault routing + capture |
| `local-model-router` | Ollama vs cloud tier selection |
| `review-findings-deduper` | Collapse redundant review output |
| `workflow-orchestrator` | Discover → implement → verify → review |

Update both locations when you revise a skill until you introduce automation to sync them.
