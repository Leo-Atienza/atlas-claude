# create-atlas-env

Scaffold **ATLAS** (Autonomous Task, Learning & Agent System) into `~/.claude/` with a single command.

ATLAS is a productivity layer for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that adds hooks, skills, workflows, agents, and progressive learning to your Claude Code environment.

## Quick Start

```bash
npx create-atlas-env
```

That's it. The installer will:
- Ask for install mode (full or minimal)
- Create directories and copy config files to `~/.claude/`
- Never overwrite existing files (safe to re-run)

## Install Modes

**Full** (default) — everything ATLAS offers:
- Hooks (context management, security gate, session lifecycle, status line)
- Rules (code quality, git conventions, security, testing)
- Scripts (auto-continuation, smoke test)
- Commands (Flow workflow, continue, new project)
- Skills (self-evolve, smart-swarm, project-init)
- Agents (smart-swarm-coordinator)
- Scheduled tasks (weekly maintenance, dream, cleanup)

**Minimal** — core infrastructure only:
- Hooks, rules, scripts
- CLAUDE.md and settings.json

## CLI Flags

```bash
npx create-atlas-env --full      # skip prompt, full install
npx create-atlas-env --minimal   # skip prompt, minimal install
```

## After Install

1. Review `~/.claude/CLAUDE.md` and customize for your workflow
2. Review `~/.claude/settings.json` and adjust hooks/permissions
3. Run `bash ~/.claude/scripts/smoke-test.sh` to verify
4. Start Claude Code — ATLAS activates automatically

## Updating

```bash
npx create-atlas-env@latest
```

Only new files are added. Existing files are never overwritten, so your customizations are preserved.

## Requirements

- Node.js >= 18
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed

## License

MIT
