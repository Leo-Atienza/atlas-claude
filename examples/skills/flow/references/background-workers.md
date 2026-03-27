# Background Worker Pool — Flow Integration

Adapted from Ruflo's context-triggered background workers pattern.
When `/flow:go` executes waves, automatically spawn background agents
for quality assurance that run in parallel with implementation agents.

## Worker Definitions

| Worker | Agent Type | Trigger | Run Mode |
|--------|-----------|---------|----------|
| Security Scanner | `flow-verifier` | After each wave completes | `run_in_background: true` |
| Test Coverage | `flow-uat` | After final wave | `run_in_background: true` |
| Pattern Learner | `flow-learnings-researcher` | After phase completion | `run_in_background: true` |

## When to Spawn Background Workers

### During `/flow:go` Wave Execution

**After Wave 1 completes** (while Wave 2 is starting):
```
Spawn background security worker:
  Agent: flow-verifier (or security-sentinel)
  Model: sonnet (Tier 3 — per tier-routing rules)
  Prompt: "Review files modified in Wave 1 for security issues.
           Read the SUMMARY.md files in .flow/phases/{N}-*/
           and check changed files for OWASP Top 10 issues.
           Write findings to .flow/phases/{N}-*/SECURITY-NOTES.md"
  run_in_background: true
```

**After final wave completes** (before presenting results):
```
Spawn background test coverage worker:
  Agent: flow-uat
  Model: sonnet
  Prompt: "Run tests and verify coverage for the phase.
           Read SUMMARY.md files to find what was implemented.
           Run test suites. Write results to .flow/phases/{N}-*/TEST-REPORT.md"
  run_in_background: true
```

### During `/flow:verify`

**While verifier runs** (in parallel):
```
Spawn background pattern learner:
  Agent: flow-learnings-researcher
  Model: haiku (Tier 2 — lightweight research)
  Prompt: "Check if the patterns used in this phase match
           any known solutions in .flow/solutions/.
           If novel patterns were used, note them for /flow:compound."
  run_in_background: true
```

## Integration Protocol

1. **Orchestrator spawns implementation agents** (foreground, parallel per wave)
2. **After each wave**: spawn 1 background security worker on completed files
3. **After final wave**: spawn 1 background test worker
4. **Collect background results**: when presenting the phase completion summary,
   check if background workers have finished. If yes, include their findings.
   If still running, note "Background quality checks in progress..."
5. **Never block on background workers** — they are advisory, not gating

## Cost Budget

Background workers add ~30-60K tokens per phase execution.
This is offset by catching issues early (before `/flow:verify`).

- Security worker: ~20K tokens (sonnet, focused scope)
- Test worker: ~30K tokens (sonnet, runs tests)
- Pattern learner: ~10K tokens (haiku, read-only)

**Hard cap**: Maximum 2 background workers active simultaneously during `/flow:go`.

## What Workers Do NOT Do

- They do NOT modify code (read-only analysis)
- They do NOT block wave execution
- They do NOT replace `/flow:verify` (they complement it)
- They do NOT run for `quick` depth tasks (overhead not worth it)

## Depth Integration

| Flow Depth | Background Workers |
|------------|-------------------|
| quick | None — too much overhead |
| standard | Security scanner only (after final wave) |
| deep | Security scanner (per wave) + test coverage (final wave) |
| epic | All three workers active |
