---
name: test-states
description: Test UI states and dynamic behavior including loading, empty, error, overlay, and animation states. Use when user wants to test modals, toasts, loading spinners, empty states, error handling, or animations.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# UI States & Dynamic Behavior

Run 35 test cases across 4 parallel agents covering loading states, empty/error states, overlays, and animations.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-states/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 4 Subagents

### Agent 1: Loading (`-s=states-loading`)

Tests loading, skeleton, and transition states.

```bash
playwright-cli -s=states-loading open "$URL"
playwright-cli -s=states-loading tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-ST1 | Loading spinner appears during async ops | `run-code` to intercept network requests (delay responses), check for spinner/loading indicator |
| TC-ST2 | Skeleton screens render before data loads | `run-code` to intercept API calls (delay response), check for skeleton CSS (animated pulse/shimmer) |
| TC-ST3 | No FOUC (Flash of Unstyled Content) | `run-code` to observe page load, check if unstyled flash occurs (watch for style recalculation) |
| TC-ST4 | No layout shift when content loads | `run-code` to measure CLS during page load via PerformanceObserver |
| TC-ST5 | Progressive loading — above-fold first | `run-code` to check if above-fold images/content load before below-fold |
| TC-ST6 | Optimistic UI — updates before server response | `run-code` to intercept a mutation request (delay it), check if UI updates immediately |
| TC-ST7 | Loading states on buttons (prevent double-click) | Click a submit button, check if it shows loading state / becomes disabled |

```bash
playwright-cli -s=states-loading tracing-stop
playwright-cli -s=states-loading close
```

### Agent 2: Empty/Error (`-s=states-empty`)

Tests empty states, error states, and edge cases.

```bash
playwright-cli -s=states-empty open "$URL"
playwright-cli -s=states-empty tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-ST8 | Empty state shown for empty lists/tables | `run-code` to mock API returning empty array, check for empty state UI |
| TC-ST9 | Empty state has helpful CTA | When empty state shown, check for action button/link (e.g., "Add your first item") |
| TC-ST10 | 404 page exists and is helpful | Navigate to `$URL/nonexistent-page-xyz-404`, verify custom 404 page with navigation back |
| TC-ST11 | 500 error page exists (no stack trace) | `run-code` to mock API returning 500, check error page doesn't show stack trace |
| TC-ST12 | Network error state (offline/timeout) | `run-code` to set page offline mode, trigger action, check for error UI |
| TC-ST13 | Permission denied state | `run-code` to mock API returning 403, check for appropriate UI |
| TC-ST14 | Session expired state + redirect | `run-code` to mock API returning 401, check for redirect to login or session expired message |
| TC-ST15 | Partial failure — some items load, some don't | `run-code` to mock mixed success/failure responses, verify partial UI renders |

```bash
playwright-cli -s=states-empty tracing-stop
playwright-cli -s=states-empty close
```

### Agent 3: Overlays (`-s=states-overlay`)

Tests modals, toasts, tooltips, and dropdowns.

```bash
playwright-cli -s=states-overlay open "$URL"
playwright-cli -s=states-overlay tracing-start
playwright-cli -s=states-overlay snapshot --filename="$OUTDIR/snapshots/overlay-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-ST16 | Modal opens/closes correctly | Find and click modal trigger, verify modal appears. Click close, verify dismissed |
| TC-ST17 | Modal traps focus (Tab cycles within) | Open modal, Tab repeatedly, verify focus stays within modal via `run-code` checking activeElement |
| TC-ST18 | Modal closes on Escape | Open modal, `press Escape`, verify modal dismissed |
| TC-ST19 | Modal closes on backdrop click | Open modal, click outside modal content area, verify dismissed |
| TC-ST20 | Body scroll locked when modal open | Open modal, `run-code` to check `document.body.style.overflow` is `hidden` |
| TC-ST21 | Multiple modals stack correctly | If multiple modals possible: open two, verify z-index stacking, top modal is interactive |
| TC-ST22 | Toast/notification appears + auto-dismisses | Trigger toast (e.g., form submit), verify it appears then disappears after timeout |
| TC-ST23 | Multiple toasts stack (don't overlap) | Trigger multiple toasts, verify they stack vertically without overlapping |
| TC-ST24 | Tooltip shows on hover + keyboard focus | `hover` over tooltip trigger, verify tooltip appears. Tab to it, verify also appears |
| TC-ST25 | Dropdown closes on outside click | Open dropdown, click outside it, verify it closes |
| TC-ST26 | Dropdown closes on Escape | Open dropdown, `press Escape`, verify it closes |
| TC-ST27 | Context menu doesn't go off-screen | `run-code` to find context menus/dropdowns near edges, verify they reposition to stay in viewport |

```bash
playwright-cli -s=states-overlay tracing-stop
playwright-cli -s=states-overlay close
```

### Agent 4: Animation (`-s=states-animation`)

Tests animations, transitions, and motion.

```bash
playwright-cli -s=states-animation open "$URL"
playwright-cli -s=states-animation tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-ST28 | Animations are smooth (no jank) | `run-code` with requestAnimationFrame to measure frame timing, flag >16ms gaps |
| TC-ST29 | `prefers-reduced-motion` disables animations | `run-code`: `page.emulateMedia({reducedMotion:'reduce'})`, verify animations disabled via computed transition/animation styles |
| TC-ST30 | Transitions complete (not stuck mid-animation) | `run-code` to observe transition elements, verify they reach final state |
| TC-ST31 | Hover effects work | `hover` over interactive elements, `run-code` to check style changes (color, background, transform) |
| TC-ST32 | Active/pressed states visible on buttons | `run-code` to simulate mousedown on buttons, check for active state styles |
| TC-ST33 | Scroll-triggered animations fire | `run-code` to scroll page, check if animation classes are added to elements entering viewport |
| TC-ST34 | Page transitions in SPA (not abrupt) | Navigate between pages, check for transition effects (fade, slide) rather than abrupt replacement |
| TC-ST35 | Micro-interactions smooth | Find toggle switches/checkboxes, interact, check for smooth animation via `run-code` |

```bash
playwright-cli -s=states-animation tracing-stop
playwright-cli -s=states-animation close
```

## Report Generation

After all 4 agents complete, merge results into `$OUTDIR/report.md` following the standard report format.

Group results by agent category:
1. Loading (TC-ST1 through TC-ST7)
2. Empty/Error (TC-ST8 through TC-ST15)
3. Overlays (TC-ST16 through TC-ST27)
4. Animation (TC-ST28 through TC-ST35)

## Cleanup

```bash
playwright-cli -s=states-loading close 2>/dev/null
playwright-cli -s=states-empty close 2>/dev/null
playwright-cli -s=states-overlay close 2>/dev/null
playwright-cli -s=states-animation close 2>/dev/null
```
