# Three-Tier Model Routing
> Adapted from Ruflo's tiered intelligence routing. Reduces token costs 30-50%.

## Routing Rules

When spawning agents via the Agent tool, select the model tier based on task complexity:

| Tier | Model | When to Use | Examples |
|------|-------|-------------|---------|
| **Tier 1 — Bash** | No LLM | Deterministic transforms, regex, file ops | Variable rename, import sort, format, file move |
| **Tier 2 — Haiku** | `model: "haiku"` | Medium tasks with clear patterns | Test generation, doc updates, simple code review, type additions |
| **Tier 3 — Sonnet** | `model: "sonnet"` | Standard implementation work | Feature implementation, bug fixes, refactoring |
| **Tier 4 — Opus** | default (inherit) | Complex reasoning, architecture, multi-step | Architecture design, security audit, full system implementation |

## Decision Flow

```
Is the task a deterministic transform (rename, format, move)?
  → YES: Use Bash directly. No agent needed.
  → NO: Continue...

Is the task pattern-matching with clear input/output (generate docs, simple tests)?
  → YES: Spawn agent with model: "haiku"
  → NO: Continue...

Is the task standard implementation (single concern, well-defined)?
  → YES: Spawn agent with model: "sonnet"
  → NO: Use Opus (default)
```

## Integration with Smart Swarm

When smart-swarm scores a task:
- **SOLO (0-4)**: Tier 1 or 2 — try Bash first, then haiku agent
- **DUO (5-7)**: Tier 2-3 — haiku for tests, sonnet for implementation
- **TEAM (8-11)**: Tier 3 — sonnet for most agents, opus for coordinator
- **SWARM (12-15)**: Tier 3-4 — sonnet for executors, opus for planning/verification

## Integration with Flow Depth

| Flow Depth | Default Agent Tier |
|------------|-------------------|
| quick | Tier 2 (haiku) for execution, Tier 3 (sonnet) if complex |
| standard | Tier 3 (sonnet) |
| deep | Tier 3 (sonnet) executors, Tier 4 (opus) planners/verifiers |
| epic | Tier 4 (opus) for all critical-path agents |

## Cost Awareness

Estimated token cost per agent:
- Haiku: ~5K-15K tokens (fast, cheap)
- Sonnet: ~20K-50K tokens (balanced)
- Opus: ~50K-100K tokens (thorough)

When spawning multiple agents, prefer lower tiers for independent subtasks.
Do NOT downgrade when: security auditing, architecture decisions, complex debugging.
