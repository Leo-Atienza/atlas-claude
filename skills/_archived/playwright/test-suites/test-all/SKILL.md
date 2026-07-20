---
name: test-all
description: Run the complete UI testing suite — all 15 test skills across functional testing and UX design quality. Use when user wants a comprehensive site audit, full test suite, or complete quality assessment.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Full UI Testing Suite — Master Orchestrator

Runs all 15 testing skills in 5 phased parallel waves, producing a unified summary report with ~482 test cases.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/full-suite/$TIMESTAMP"
mkdir -p "$OUTDIR"
```

## Execution Phases

Execute sub-skills by spawning subagents. Each sub-skill internally spawns its own parallel agents.

### Phase 1 — Core Functional (5 skills in parallel)

Launch 5 subagents simultaneously:

| Subagent | Skill | Command | Test Cases |
|----------|-------|---------|------------|
| 1 | Forms | `/test-forms $URL` | 27 |
| 2 | Accessibility | `/test-a11y $URL` | 40 |
| 3 | Responsive | `/test-responsive $URL` | 72 |
| 4 | Security | `/test-security $URL` | 55 |
| 5 | Links | `/test-links $URL` | 23 |

**Wait for all Phase 1 to complete before proceeding.**

### Phase 2 — Extended Functional (3 skills in parallel)

| Subagent | Skill | Command | Test Cases |
|----------|-------|---------|------------|
| 6 | User Flows | `/test-flows $URL` | 30 |
| 7 | Cross-Browser | `/test-cross-browser $URL` | 30 |
| 8 | UI States | `/test-states $URL` | 35 |

**Wait for all Phase 2 to complete before proceeding.**

### Phase 3 — Performance & SEO (2 skills in parallel)

| Subagent | Skill | Command | Test Cases |
|----------|-------|---------|------------|
| 9 | Performance | `/test-perf $URL` | 25 |
| 10 | SEO | `/test-seo $URL` | 27 |

**Wait for all Phase 3 to complete before proceeding.**

### Phase 4 — UX Design Quality (4 skills in parallel)

| Subagent | Skill | Command | Test Cases |
|----------|-------|---------|------------|
| 11 | Heatmap | `/test-heatmap $URL` | 24 |
| 12 | UX Writing | `/test-ux-writing $URL` | 26 |
| 13 | Consistency | `/test-consistency $URL` | 30 |
| 14 | Conversion | `/test-conversion $URL` | 30 |

**Wait for all Phase 4 to complete before proceeding.**

### Phase 5 — Regression (sequential)

| Subagent | Skill | Command | Test Cases |
|----------|-------|---------|------------|
| 15 | Regression | `/test-regression $URL` | 8 |

Runs last because it benefits from comparing against results from previous phases.

## Unified Report

After all phases complete, aggregate results from each sub-skill's `report.md` into a unified summary.

### Report Location

`$OUTDIR/summary.md`

### Report Template

```markdown
# Full UI Testing Suite — Summary Report

**URL**: $URL
**Date**: $TIMESTAMP
**Total Phases**: 5
**Total Skills**: 15
**Total Test Cases**: ~482

## Executive Summary

| Category | Skills | Tests | Passed | Failed | Skipped |
|----------|--------|-------|--------|--------|---------|
| **A: Functional** | 11 | ~372 | X | X | X |
| **B: UX Quality** | 4 | ~110 | X | X | X |
| **Total** | **15** | **~482** | **X** | **X** | **X** |

## Critical Failures (Action Required)

List all Critical severity failures across all skills:

| Skill | Test Case | Description | Severity |
|-------|-----------|-------------|----------|
| Security | TC-S1 | Reflected XSS in search input | Critical |
| A11y | TC-A11 | 5 buttons unreachable via keyboard | Critical |
| ... | ... | ... | ... |

## Results by Skill

### Category A: UI Functional Testing

#### /test-forms — Form Validation
- **Score**: X/27
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-forms/<timestamp>/report.md)

#### /test-a11y — Accessibility
- **Score**: X/40
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-a11y/<timestamp>/report.md)

#### /test-responsive — Responsive Design
- **Score**: X/72
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-responsive/<timestamp>/report.md)

#### /test-security — Security
- **Score**: X/55
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-security/<timestamp>/report.md)

#### /test-links — Link Integrity
- **Score**: X/23
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-links/<timestamp>/report.md)

#### /test-flows — User Flows
- **Score**: X/30
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-flows/<timestamp>/report.md)

#### /test-cross-browser — Cross-Browser
- **Score**: X/30
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-cross-browser/<timestamp>/report.md)

#### /test-states — UI States
- **Score**: X/35
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-states/<timestamp>/report.md)

#### /test-perf — Performance
- **Score**: X/25
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-perf/<timestamp>/report.md)

#### /test-seo — SEO
- **Score**: X/27
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-seo/<timestamp>/report.md)

#### /test-regression — Regression
- **Score**: X/8
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-regression/<timestamp>/report.md)

### Category B: UX Design Quality

#### /test-heatmap — Attention & Interaction
- **Score**: X/24
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-heatmap/<timestamp>/report.md)

#### /test-ux-writing — Micro-Copy Quality
- **Score**: X/26
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-ux-writing/<timestamp>/report.md)

#### /test-consistency — Design System
- **Score**: X/30
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-consistency/<timestamp>/report.md)

#### /test-conversion — Conversion Optimization
- **Score**: X/30
- **Critical**: X | **Major**: X | **Minor**: X | **Info**: X
- [Full Report](../test-conversion/<timestamp>/report.md)

## Top Recommendations

Prioritized list of fixes based on severity and impact:

1. **[Critical]** Fix XSS vulnerability in search input (TC-S1)
2. **[Critical]** Add keyboard navigation to all buttons (TC-A11)
3. **[Major]** Add CSRF tokens to all forms (TC-S23)
4. ...

## Evidence Index

All evidence is stored under `test-results/`:
- `test-forms/<timestamp>/` — Form testing evidence
- `test-a11y/<timestamp>/` — Accessibility evidence
- `test-responsive/<timestamp>/` — Responsive screenshots
- `test-security/<timestamp>/` — Security scan evidence
- ... (all 15 skills)
```

## Cleanup

After all phases complete and report is generated:

```bash
playwright-cli close-all 2>/dev/null
playwright-cli kill-all 2>/dev/null
```

## Phase Dependencies

```
Phase 1 (parallel) ──→ Phase 2 (parallel) ──→ Phase 3 (parallel) ──→ Phase 4 (parallel) ──→ Phase 5 (sequential)
  forms                 flows                  perf                   heatmap                regression
  a11y                  cross-browser          seo                    ux-writing
  responsive            states                                        consistency
  security                                                            conversion
  links
```

Phases are sequential to:
1. Avoid overwhelming the system with ~53 concurrent browser sessions
2. Allow later phases to reference earlier results
3. Regression (Phase 5) compares against all prior data

## Error Handling

If a sub-skill fails:
- Log the failure in the summary report
- Continue with remaining skills (don't abort the entire suite)
- Mark the failed skill's results as "ERROR" in the summary table
- Include the error details in the report for debugging
