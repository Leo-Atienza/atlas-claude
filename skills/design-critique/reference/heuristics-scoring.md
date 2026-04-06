# Heuristics Scoring Guide

Score each of Nielsen's 10 Usability Heuristics on a 0-4 scale. Be honest — a 4 means genuinely excellent, not "good enough."

## Scoring Criteria

### 1. Visibility of System Status
Keep users informed about what's happening through timely, appropriate feedback.

**Check for**: Loading indicators, action confirmation, progress indicators, current location in nav, form validation feedback.

| Score | Criteria |
|-------|----------|
| 0 | No feedback — user is guessing what happened |
| 1 | Rare feedback — most actions produce no visible response |
| 2 | Partial — some states communicated, major gaps remain |
| 3 | Good — most operations give clear feedback, minor gaps |
| 4 | Excellent — every action confirms, progress is always visible |

### 2. Match Between System and Real World
Speak the user's language. Follow real-world conventions.

| Score | Criteria |
|-------|----------|
| 0 | Pure tech jargon, alien to users |
| 1 | Mostly confusing |
| 2 | Mixed — some plain language, some jargon |
| 3 | Mostly natural — occasional term needs context |
| 4 | Speaks the user's language fluently throughout |

### 3. User Control and Freedom
Users need clear "emergency exits" from unwanted states.

| Score | Criteria |
|-------|----------|
| 0 | No escape — trapped in unwanted states |
| 1 | Minimal — some back navigation, no undo |
| 2 | Partial — cancel exists but inconsistent |
| 3 | Good — undo/cancel available, minor gaps |
| 4 | Excellent — full undo, easy escape from any state |

### 4. Consistency and Standards
Same action = same result everywhere.

| Score | Criteria |
|-------|----------|
| 0 | Inconsistent — every page feels different |
| 1 | Major inconsistencies in core patterns |
| 2 | Mostly consistent, some deviations |
| 3 | Good — internal consistency, follows platform norms |
| 4 | Excellent — perfectly consistent, follows all conventions |

### 5. Error Prevention
Prevent errors before they happen.

| Score | Criteria |
|-------|----------|
| 0 | No prevention — errors are easy and costly |
| 1 | Minimal — confirmation on destructive actions only |
| 2 | Some — constraints on inputs, some validation |
| 3 | Good — smart defaults, inline validation, constraints |
| 4 | Excellent — errors nearly impossible through design |

### 6. Recognition Rather Than Recall
Minimize memory load with visible options.

| Score | Criteria |
|-------|----------|
| 0 | Must remember everything — hidden features |
| 1 | Heavy recall required |
| 2 | Some visible options, some hidden |
| 3 | Good — most options visible, good suggestions |
| 4 | Excellent — zero recall needed, everything discoverable |

### 7. Flexibility and Efficiency of Use
Accelerators for experts alongside novice paths.

| Score | Criteria |
|-------|----------|
| 0 | One rigid path for everyone |
| 1 | Minimal flexibility |
| 2 | Some shortcuts or customization |
| 3 | Good — keyboard shortcuts, bulk actions available |
| 4 | Excellent — fully customizable, expert-friendly |

### 8. Aesthetic and Minimalist Design
Every element serves a purpose.

| Score | Criteria |
|-------|----------|
| 0 | Cluttered, competing elements everywhere |
| 1 | Significant noise and decoration |
| 2 | Some visual noise |
| 3 | Clean — minor unnecessary elements |
| 4 | Every element earns its place |

### 9. Help Users Recognize, Diagnose, and Recover from Errors
Clear error messages with cause + fix.

| Score | Criteria |
|-------|----------|
| 0 | "Error 500" with no guidance |
| 1 | Generic messages without specifics |
| 2 | Some helpful messages, inconsistent |
| 3 | Good — clear errors with recovery paths |
| 4 | Excellent — errors prevent data loss, suggest fixes |

### 10. Help and Documentation
Contextual help when needed.

| Score | Criteria |
|-------|----------|
| 0 | No help available |
| 1 | Separate docs, hard to find |
| 2 | Some contextual help |
| 3 | Good — tooltips, help accessible in context |
| 4 | Excellent — progressive help, rarely needed |

## Severity Ratings

| Severity | Description | Action |
|----------|-------------|--------|
| **P0 Blocking** | Prevents task completion | Fix immediately |
| **P1 Major** | Significant difficulty or WCAG AA violation | Fix before release |
| **P2 Minor** | Annoyance, workaround exists | Fix in next pass |
| **P3 Polish** | Nice-to-fix, no real user impact | Fix if time permits |
