---
name: flow:verify
description: "Goal-backward verification — checks GOALS achieved, not tasks completed"
argument-hint: "[phase-number] [--audit]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Verify that phase goals were ACHIEVED, not just that tasks were COMPLETED.

Replaces: gsd:verify-work, gsd:audit-milestone

Core principle: Task completion =/= Goal achievement. A component can exist without being imported. An API can exist without being called.

**Modes:**
- Default: Goal-backward verification of a single phase
- `--audit`: Full milestone audit (requirement coverage + cross-phase integration)
</objective>

<context>
$ARGUMENTS

Reference files:
@~/.claude/skills/flow/references/truth-verification.md
</context>

<process>

## Step 1: Load Context

1. Read `.flow/state.yaml` for current position
2. Determine phase to verify (argument or current phase)
3. Read all PLAN.md files for the phase (extract must_haves)
4. Read all SUMMARY.md files for execution results
5. Read `.flow/REQUIREMENTS.md` for requirement mappings

## Step 2: Goal-Backward Verification

Spawn **flow-verifier** agent with phase context.

The verifier checks must_haves at three levels:

### Level 1: Existence
Does the file/endpoint/component exist?
```bash
[ -f "path/to/file" ]
```

### Level 2: Substantive
Is it real implementation, not a stub?
- Check file length against min_lines
- Verify no TODO/FIXME/placeholder markers
- Check for actual logic (not empty functions)

### Level 3: Wired
Is it connected to the rest of the system?
- Check imports/exports
- Verify API calls reach endpoints
- Confirm UI routes to pages
- Check database connections

### Truths Verification
For each truth in must_haves.truths:
- Derive what must exist for the truth to hold
- Check at all three levels

### Artifacts Verification
For each artifact in must_haves.artifacts:
- Verify path exists
- Check exports match expected
- Verify min_lines met

### Key Links Verification
For each link in must_haves.key_links:
- Verify `from` file references `to` target
- Check via pattern matches

## Step 2b: Confidence Scoring

After all checks complete, compute a weighted confidence score per `truth-verification.md`:
- Existence checks: weight 1.0
- Substantive checks: weight 1.5
- Wired checks: weight 2.0
- Truth checks: weight 2.0

`confidence = weighted_passed / weighted_total`

Apply thresholds (all automatic, never block):
- >= 0.95: HIGH CONFIDENCE → auto-pass, proceed to ship
- 0.80-0.94: MODERATE → auto-pass with advisory, report gaps but proceed
- 0.60-0.79: LOW → auto-proceed, flag gaps prominently, offer gap closure
- < 0.60: FAILED → auto-trigger `/flow:plan {N} --gaps` → re-verify

## Step 3: Write Verification Report

Write `.flow/phases/{N}-{name}/VERIFICATION.md`:
```markdown
# Phase {N} Verification

## Confidence Score: {score} ({HIGH|MODERATE|LOW|FAILED})

## Status: {PASS|GAPS_FOUND}

## Must-Haves

### Truths
| Truth | Status | Evidence |
|---|---|---|
| {truth} | PASS/FAIL | {file:line or reason} |

### Artifacts
| Path | Exists | Substantive | Min Lines |
|---|---|---|---|
| {path} | Y/N | Y/N | {actual}/{min} |

### Key Links
| From | To | Via | Wired |
|---|---|---|---|
| {file} | {target} | {pattern} | Y/N |

## Gaps
{List of specific gaps with remediation suggestions}

## Requirements Coverage
| Requirement | Plans | Status |
|---|---|---|
| {REQ-01} | {plan list} | COVERED/GAP |
```

## Step 4: Handle Gaps

If gaps found:
1. Present gaps to user
2. Offer: "Create fix plans? (`/flow:plan {N} --gaps`)"
3. If yes: route to `/flow:plan` in gap closure mode
4. Execute fixes with `/flow:go {N} --gaps-only`
5. Re-verify

## Step 5: Milestone Audit (--audit flag)

If `--audit` specified, additionally:
1. Check ALL phases, not just one
2. Verify requirement coverage across entire milestone
3. Spawn integration checker to verify cross-phase wiring:
   - Phase 1 exports used by Phase 3?
   - APIs have consumers?
   - Data flows complete end-to-end?
4. Write `.flow/v{version}-MILESTONE-AUDIT.md`

## Step 6: Update State

Update `.flow/state.yaml`:
- Record verification result
- Update quality scores in `.flow/metrics/quality-scores.yaml`
- If PASS: position.status = "complete"
- If GAPS: position.status = "verifying" (gaps need fixing)

</process>
