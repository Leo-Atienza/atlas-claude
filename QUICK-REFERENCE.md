# Quick Reference

| I want to... | Use |
|---|---|
| Start a new project/feature | `/new` or `/flow:start [desc]` |
| Resume previous work | `/resume` or `/continue` |
| Do a one-off task | `/task [desc]` or just describe it |
| Fix a bug | `/flow:debug [desc]` |
| Ship code (commit + push + PR) | `/ship` or `/flow:ship` |
| End my session | `/done` |
| Consolidate memories | `/dream` |
| Plan before building | `/flow:plan` then `/flow:go` |
| Run a complex multi-agent task | `/flow:smart-swarm [desc]` |
| Review code / PR | `/code-review:code-review` |
| Check system health | `/health` |
| Learn from a mistake | `/learn` |
| Research a library/framework | Ask directly (Context7 + WebSearch auto-activate) |
| Create a new skill | `/skill-creator` |
| Schedule a recurring task | `/schedule` |

## Key Files

| File | What it does |
|---|---|
| `CLAUDE.md` | Master agent instructions |
| `settings.json` | Hooks, permissions, env vars |
| `skills/REGISTRY.md` | All skills, MCP servers, plugins |
| `hooks/README.md` | Hook contract documentation |
| `hooks/post-tool-monitor.js` | Central PostToolUse telemetry hub |
| `hooks/context-guard.js` | PreToolUse context budget enforcer |
| `hooks/security-gate.sh` | Write/Edit secret scanner |
| `hooks/cctools-safety-hooks/bash_hook.py` | Bash command safety scanner |

## Session Lifecycle

```
SessionStart hooks -> work -> PreCompact (if long) -> PostCompact -> Stop hooks
                                                                      |
                                                              /reflect + /dream
```

## Context Budget Cascade

`65% WARNING` -> `70% AUTO-CONTINUATION` -> `72% GUARD (tools blocked)` -> `75% CRITICAL (stop)`
