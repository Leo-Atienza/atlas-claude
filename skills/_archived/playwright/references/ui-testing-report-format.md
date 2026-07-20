# Standard Report Format

## Report Template

Every skill produces a `report.md` in its output directory:

```markdown
# <Skill Name> Test Report

**URL**: <tested URL>
**Date**: <timestamp>
**Duration**: <total time>

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | <N> |
| Passed | <N> |
| Failed | <N> |
| Skipped | <N> |

## Results by Category

### <Category Name>

| Test Case | Description | Status | Severity | Evidence |
|-----------|-------------|--------|----------|----------|
| TC-XX1 | <description> | ✅ PASS | — | [screenshot](screenshots/TC-XX1.png) |
| TC-XX2 | <description> | ❌ FAIL | Critical | [screenshot](screenshots/TC-XX2.png) |
| TC-XX3 | <description> | ⏭️ SKIP | — | N/A (no forms found) |

## Failed Tests — Details

### TC-XX2: <Test Name>
- **Severity**: Critical / Major / Minor / Info
- **Description**: What was tested
- **Expected**: What should have happened
- **Actual**: What actually happened
- **Evidence**: [screenshot](screenshots/TC-XX2.png) | [snapshot](snapshots/TC-XX2.yaml) | [trace](traces/trace-XX2.trace)
- **Fix Suggestion**:
  ```html
  <!-- Example fix -->
  <button aria-label="Submit form">Submit</button>
  ```

## Skipped Tests

List any tests skipped and why (e.g., "No forms found on page", "Feature not present").

## Evidence Index

- Screenshots: `screenshots/`
- Snapshots: `snapshots/`
- Traces: `traces/`
- Videos: `videos/` (if captured)
```

## Severity Ratings

| Severity | Criteria | Examples |
|----------|----------|----------|
| **Critical** | Blocks core functionality, security vulnerability, data loss risk | XSS vulnerability, broken login, missing CSRF tokens |
| **Major** | Significant UX impact, accessibility barrier, SEO penalty | Missing alt text, broken navigation, no error messages |
| **Minor** | Cosmetic issues, minor UX friction, best practice deviation | Inconsistent spacing, missing hover states, verbose error text |
| **Info** | Recommendations, optimization opportunities | Performance hints, SEO suggestions, design improvements |

## Fix Suggestions

Always include actionable fix suggestions with code examples:
- HTML/CSS fixes for accessibility and SEO issues
- Security header configurations
- JavaScript fixes for interaction bugs
- Design pattern recommendations for UX issues
