---
name: workflow-orchestrator
description: >-
  Runs a repeatable plan-execute-verify-review chain for repeatable multi-step workflows
  hitting build/test/review tooling. Trigger on ship this feature safely, guarded rollout,
  add tests review PR, multitask decomposition, deterministic delivery pipeline for tasks.
disable-model-invocation: true
---

# Workflow orchestrator

Use this whenever a job feels like mini-project management inside the IDE.

## Phases (always explicit)

### 1. Discover (≤10 bullets)

Enumerate unknowns + risks + impacted surfaces.

### 2. Implement (vertical slices)

Work in checkpoints; each checkpoint must compile / lint locally relevant scope.

### 3. Verify

Run the cheapest checks first (`format/lint/unit`) before integrations. Record commands + timestamps in session snapshot (see **session-lifecycle-manager** skill).

### 4. Review (before PR)

Reuse **review-findings-deduper** for overlapping outputs between local tools and reviewer bots.

## Exit checklist

| Gate | Requirement |
|------|-------------|
| Behaviour | Acceptance criteria enumerated + evidenced |
| Safety | Sensitive paths enumerated + audited |
| Rollback | How to unwind documented |
| Memory | Optionally update vault `fixes/`/`playbooks/` |

## Multitasking

If Cursor parallel agents available, split **independent lanes** early; merge only after verifying non-overlapping file ownership.
