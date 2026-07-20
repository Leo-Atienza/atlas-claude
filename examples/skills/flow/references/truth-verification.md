# Truth Verification Gate — Confidence Scoring

Adapted from Ruflo's 0.95 accuracy threshold with auto-rollback.
Adds a quantitative confidence score to `/flow:verify` output.

## Confidence Scoring Model

After the flow-verifier agent completes its three-level checks
(Existence → Substantive → Wired), compute a confidence score:

```
confidence = (passed_checks / total_checks)

Where checks are weighted:
  - Existence checks:    weight 1.0 each
  - Substantive checks:  weight 1.5 each (more important)
  - Wired checks:        weight 2.0 each (most important)
  - Truth checks:        weight 2.0 each

confidence = weighted_passed / weighted_total
```

## Thresholds and Actions

| Confidence | Status | Action |
|------------|--------|--------|
| >= 0.95 | HIGH CONFIDENCE | Auto-pass. Proceed to ship. |
| 0.80 - 0.94 | MODERATE CONFIDENCE | Auto-pass with advisory. List what's missing but proceed. |
| 0.60 - 0.79 | LOW CONFIDENCE | Auto-proceed but flag gaps prominently. Offer gap closure. |
| < 0.60 | VERIFICATION FAILED | Auto-trigger gap closure (`/flow:plan {N} --gaps`). |

## Integration with `/flow:verify`

### Step 3 Enhancement: Verification Report

Add confidence section to VERIFICATION.md:

```markdown
## Confidence Score

**Overall: {score}** ({status})

| Check Type | Passed | Total | Weighted Score |
|------------|--------|-------|---------------|
| Existence | {n}/{m} | {weighted} |
| Substantive | {n}/{m} | {weighted} |
| Wired | {n}/{m} | {weighted} |
| Truths | {n}/{m} | {weighted} |

{action recommendation based on threshold}
```

### Step 4 Enhancement: Threshold-Gated Actions

Replace the current gap handling with threshold-aware logic:

```
IF confidence >= 0.95:
  "Phase {N} verified with HIGH CONFIDENCE ({score}).
   Ready for /flow:ship or /flow:review."
  → Auto-proceed. No user input needed.

ELIF confidence >= 0.80:
  "Phase {N} verified with MODERATE CONFIDENCE ({score}).
   Advisory: {list_advisory_items}
   Proceeding — run /flow:plan {N} --gaps if you want to fix these."
  → Auto-proceed. Report advisory items but do NOT ask.

ELIF confidence >= 0.60:
  "Phase {N} has LOW CONFIDENCE ({score}).
   Gaps found: {list_failing_checks}
   Auto-generating gap closure plans..."
  → Auto-proceed to /flow:plan {N} --gaps. Do NOT block.

ELSE (< 0.60):
  "Phase {N} VERIFICATION FAILED ({score}).
   Critical gaps: {list_all_failures}
   Auto-generating gap closure plans..."
  → Auto-trigger /flow:plan {N} --gaps → /flow:go {N} --gaps-only → re-verify.

ELSE:
  "Phase {N} VERIFICATION FAILED ({score}).
   {list_all_failures}
   Must fix gaps before proceeding: /flow:plan {N} --gaps"
```

### Step 6 Enhancement: Quality Metrics

Record confidence in `.flow/metrics/quality-scores.yaml`:

```yaml
- phase: {N}
  scores:
    verification_confidence: {score}
    verification_status: "HIGH|MODERATE|LOW|FAILED"
    checks_passed: {n}
    checks_total: {m}
    timestamp: {ISO 8601}
```

## Auto-Rollback (Epic Depth Only)

For `/flow:start --depth epic` projects, if confidence < 0.60:

1. Record the failing state
2. Offer: "Rollback to last known-good state? (git reset to pre-phase commit)"
3. If yes: `git reset --soft {pre_phase_commit}` (preserve changes as unstaged)
4. If no: continue with gap closure

This is gated behind explicit user confirmation — never auto-rollback silently.

## Historical Tracking

Over time, the confidence scores in quality-scores.yaml build a velocity trend:
- Improving confidence across phases = healthy project
- Declining confidence = accumulating technical debt
- `/flow:status --health` can report this trend

## Integration with Agent Profiler

When verification runs, also log which agents produced the verified code:
- HIGH confidence work → boost those agents' reliability scores
- FAILED verification → reduce reliability for responsible agents

This creates a feedback loop: agents that produce verifiable code get
preferred in future tier routing decisions.
