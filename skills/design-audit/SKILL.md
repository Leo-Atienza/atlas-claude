---
name: design-audit
description: "Run technical quality checks across accessibility, performance, theming, responsive design, and anti-patterns. Generates a scored report with P0-P3 severity ratings and actionable plan. Use when the user wants an accessibility check, performance audit, or technical quality review of a frontend interface."
---

## Preparation

Load the `frontend-design` skill (SK-005) — it contains design principles, anti-patterns, and reference modules that this audit checks against.

---

Run systematic **technical** quality checks and generate a comprehensive report. Don't fix issues — document them for other skills to address.

This is a code-level audit, not a design critique. Check what's measurable and verifiable in the implementation.

## Runtime Audit (optional — if a deployed URL is available)

If the page is deployed and accessible via URL, run a **Lighthouse MCP audit** before the code-level scan to gather runtime data:
1. Use Lighthouse MCP to audit the URL for Performance, Accessibility, SEO, Best Practices
2. Note the Lighthouse scores and any critical axe-core violations
3. Use these as ground truth when scoring the code-level dimensions below — Lighthouse runtime data takes precedence over code-level guesses for Performance and Accessibility scores

If no URL is available (local dev only), skip this step and proceed with code-level analysis.

## Diagnostic Scan

Run comprehensive checks across 5 dimensions. Score each dimension 0-4.

### 1. Accessibility (A11y)

**Check for**: Contrast ratios < 4.5:1, missing ARIA (roles, labels, states), keyboard navigation gaps (focus indicators, tab order, traps), semantic HTML issues (heading hierarchy, landmarks, divs-as-buttons), missing/poor alt text, form issues (inputs without labels, poor error messaging).

**Score**: 0=Inaccessible (fails WCAG A), 1=Major gaps, 2=Partial, 3=Good (WCAG AA mostly met), 4=Excellent (WCAG AA fully met)

### 2. Performance

**Check for**: Layout thrashing (read/write loops), expensive animations (animating width/height instead of transform/opacity), missing lazy loading, unnecessary imports, unnecessary re-renders, missing memoization.

**Score**: 0=Severe issues, 1=Major problems, 2=Partial, 3=Good, 4=Excellent

### 3. Theming

**Check for**: Hard-coded colors not using tokens, broken dark mode, inconsistent token usage, values that don't update on theme change.

**Score**: 0=No theming, 1=Minimal tokens, 2=Partial, 3=Good, 4=Excellent

### 4. Responsive Design

**Check for**: Fixed widths that break on mobile, touch targets < 44x44px, horizontal scroll/overflow, text scaling failures, missing breakpoints.

**Score**: 0=Desktop-only, 1=Major issues, 2=Partial, 3=Good, 4=Excellent

### 5. Anti-Patterns (CRITICAL)

Check against ALL the **DON'T** guidelines in the frontend-design skill. Look for AI slop tells: AI color palette, gradient text, glassmorphism, hero metrics, identical card grids, generic fonts, gray on color, nested cards, bounce easing, redundant copy.

**Score**: 0=AI slop gallery (5+ tells), 1=Heavy AI aesthetic (3-4), 2=Some tells (1-2), 3=Mostly clean, 4=No AI tells

## Generate Report

### Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | ? | [most critical issue or "—"] |
| 2 | Performance | ? | |
| 3 | Responsive Design | ? | |
| 4 | Theming | ? | |
| 5 | Anti-Patterns | ? | |
| **Total** | | **??/20** | **[Rating band]** |

**Rating bands**: 18-20 Excellent, 14-17 Good, 10-13 Acceptable, 6-9 Poor, 0-5 Critical

### Anti-Patterns Verdict
**Start here.** Pass/fail: Does this look AI-generated? List specific tells. Be brutally honest.

### Executive Summary
- Audit Health Score: **??/20** ([rating band])
- Total issues found (count by severity: P0/P1/P2/P3)
- Top 3-5 critical issues
- Recommended next steps

### Detailed Findings by Severity

Tag every issue with **P0-P3 severity**:
- **P0 Blocking**: Prevents task completion — fix immediately
- **P1 Major**: Significant difficulty or WCAG AA violation — fix before release
- **P2 Minor**: Annoyance, workaround exists — fix in next pass
- **P3 Polish**: Nice-to-fix, no real user impact — fix if time permits

For each issue: **[P?] Issue name** — Location, Category, Impact, Standard violated, Recommendation.

### Patterns & Systemic Issues

Identify recurring problems that indicate systemic gaps: "Hard-coded colors in 15+ components," "Touch targets consistently <44px."

### Positive Findings

Note what's working well — good practices to maintain and replicate.

## Recommended Actions

List fixes in priority order (P0 first):
1. **[P?]** Brief description (specific context from findings)

End with `design-polish` as the final step if any fixes were recommended.

**NEVER**: Report issues without explaining impact. Provide generic recommendations. Skip positive findings. Report false positives without verification.
