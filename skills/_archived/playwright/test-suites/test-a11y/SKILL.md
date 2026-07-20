---
name: test-a11y
description: Run comprehensive WCAG 2.1 AA+ accessibility tests on a URL. Use when user wants to test accessibility, a11y compliance, screen reader support, or keyboard navigation.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Accessibility Testing (WCAG 2.1 AA+)

Run 40 accessibility test cases across 4 parallel agents covering document structure, keyboard navigation, content accessibility, and dynamic content.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-a11y/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 4 Subagents

Launch 4 subagents in parallel. Each opens its own browser session and runs its test cases independently.

### Agent 1: Structure (`-s=a11y-structure`)

Tests document structure and semantic HTML.

```bash
playwright-cli -s=a11y-structure open "$URL"
playwright-cli -s=a11y-structure tracing-start
playwright-cli -s=a11y-structure snapshot --filename="$OUTDIR/snapshots/structure-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-A1 | ARIA labels on all interactive elements | `run-code` to find interactive elements (button, a, input, select, textarea) without aria-label, aria-labelledby, or visible label |
| TC-A2 | ARIA roles correct (not generic) | `run-code` to find elements with `role="generic"` or missing roles on custom widgets |
| TC-A3 | Heading hierarchy (single h1, no skipped levels) | `run-code` to get all heading levels, verify single h1 and no gaps (h1→h3 without h2) |
| TC-A4 | Landmark regions (main, nav, aside, header, footer) | `run-code` to check for presence of landmark roles/elements |
| TC-A5 | Skip navigation link | `run-code` to find first focusable element, check if it's a skip-nav link targeting #main or similar |
| TC-A6 | Page `<title>` present and descriptive | `eval "document.title"` — verify non-empty, not generic ("Untitled", "Home") |
| TC-A7 | `<html lang>` attribute set | `eval "document.documentElement.lang"` — verify present and valid BCP 47 |
| TC-A8 | Lists use `<ul>`/`<ol>` not styled `<div>` | `run-code` to find div elements styled as lists (list-style, bullet-like content) |
| TC-A9 | Tables have `<th>` headers + scope/caption | `run-code` to find tables, check for th elements, scope attributes, caption |
| TC-A10 | No duplicate IDs | `run-code` to collect all element IDs, find duplicates |

```bash
playwright-cli -s=a11y-structure screenshot --filename="$OUTDIR/screenshots/structure-final.png"
playwright-cli -s=a11y-structure tracing-stop
playwright-cli -s=a11y-structure close
```

### Agent 2: Keyboard (`-s=a11y-keyboard`)

Tests keyboard navigation and focus management.

```bash
playwright-cli -s=a11y-keyboard open "$URL"
playwright-cli -s=a11y-keyboard tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-A11 | All interactive elements reachable via Tab | `run-code` to count interactive elements, then Tab through page counting focused elements |
| TC-A12 | Tab order follows visual/logical order | Tab through elements, record positions via `run-code`, verify order matches visual layout |
| TC-A13 | Focus visible indicator on all focusable elements | Tab to each element, `run-code` to check computed outline/box-shadow style isn't `none` |
| TC-A14 | Modal focus trapping (Tab cycles within) | If modal exists: open it, Tab repeatedly, verify focus stays within modal container |
| TC-A15 | Focus returns to trigger on modal close | Open modal, close it (Escape), verify `document.activeElement` is the trigger button |
| TC-A16 | Dropdown keyboard navigation (Arrow keys, Enter, Escape) | Find dropdown, press Enter to open, ArrowDown to navigate, Enter to select, Escape to close |
| TC-A17 | No keyboard traps (can always Tab out) | Tab through entire page, verify focus eventually returns to browser chrome or loops to start |
| TC-A18 | Escape closes overlays/menus | Open any overlay/menu, press Escape, verify it closes |
| TC-A19 | Enter/Space activate buttons and links | Focus each button/link, press Enter and Space, verify activation |
| TC-A20 | Custom widgets have keyboard support | Find elements with ARIA widget roles, verify keyboard interaction works |

```bash
playwright-cli -s=a11y-keyboard screenshot --filename="$OUTDIR/screenshots/keyboard-final.png"
playwright-cli -s=a11y-keyboard tracing-stop
playwright-cli -s=a11y-keyboard close
```

### Agent 3: Content (`-s=a11y-content`)

Tests text, images, and media accessibility.

```bash
playwright-cli -s=a11y-content open "$URL"
playwright-cli -s=a11y-content tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-A21 | All `<img>` have alt text (or alt="" for decorative) | `run-code` to find img elements without alt attribute |
| TC-A22 | Color contrast ≥4.5:1 normal text, ≥3:1 large (AA) | `run-code` to sample text elements, get computed color + background-color, calculate ratio |
| TC-A23 | Color contrast ≥7:1 / ≥4.5:1 (AAA) | Same as TC-A22 but with AAA thresholds |
| TC-A24 | Information not conveyed by color alone | `run-code` to find elements relying solely on color (error fields with only red border, no icon/text) |
| TC-A25 | Form inputs have visible labels | `run-code` to find inputs, check for associated visible label element or aria-label |
| TC-A26 | Form `<label for>` correctly associated | `run-code` to find labels with `for` attribute, verify matching input ID exists |
| TC-A27 | Error messages programmatically associated | `run-code` to find error messages, check aria-describedby or aria-errormessage on associated input |
| TC-A28 | Required fields indicated in accessible way | `run-code` to find required inputs, verify aria-required="true" or required attribute + visible indicator |
| TC-A29 | Links have descriptive text (no "click here") | `run-code` to find links with generic text: "click here", "read more", "here", "link" |
| TC-A30 | Text resizable to 200% without loss | `run-code` to set `document.documentElement.style.fontSize='200%'`, check for overflow |

```bash
playwright-cli -s=a11y-content screenshot --filename="$OUTDIR/screenshots/content-final.png"
playwright-cli -s=a11y-content tracing-stop
playwright-cli -s=a11y-content close
```

### Agent 4: Dynamic (`-s=a11y-dynamic`)

Tests dynamic content, live regions, and state changes.

```bash
playwright-cli -s=a11y-dynamic open "$URL"
playwright-cli -s=a11y-dynamic tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-A31 | ARIA live regions for dynamic updates | `run-code` to find elements with aria-live attribute or role="alert/status/log" |
| TC-A32 | Loading states announced to screen readers | Trigger loading state, check for aria-busy="true" or aria-live region with loading text |
| TC-A33 | Error messages announced via aria-live | Trigger form error, verify error container has aria-live="assertive" or role="alert" |
| TC-A34 | Accordion/disclosure uses aria-expanded | Find accordion/disclosure patterns, verify aria-expanded toggles on open/close |
| TC-A35 | Tabs use proper tablist/tab/tabpanel roles | Find tab components, verify role="tablist", role="tab", role="tabpanel", aria-selected |
| TC-A36 | Carousel/slider keyboard accessible | If carousel exists: verify Arrow key navigation, pause button, focus management |
| TC-A37 | Tooltips accessible via keyboard + screen reader | Find tooltips, verify they show on focus (not just hover), have role="tooltip" |
| TC-A38 | `prefers-reduced-motion` respected | `run-code` to emulate reduced motion, check if animations are disabled |
| TC-A39 | Autocomplete/combobox uses aria-activedescendant | Find combobox patterns, verify aria-activedescendant updates on selection |
| TC-A40 | Progress indicators have accessible labels | Find progress bars/spinners, verify aria-label, aria-valuenow, role="progressbar" |

```bash
playwright-cli -s=a11y-dynamic screenshot --filename="$OUTDIR/screenshots/dynamic-final.png"
playwright-cli -s=a11y-dynamic tracing-stop
playwright-cli -s=a11y-dynamic close
```

## Report Generation

After all 4 agents complete, merge results into `$OUTDIR/report.md` following the standard report format (see references/report-format.md).

Group results by agent category:
1. Structure (TC-A1 through TC-A10)
2. Keyboard (TC-A11 through TC-A20)
3. Content (TC-A21 through TC-A30)
4. Dynamic (TC-A31 through TC-A40)

## Cleanup

```bash
playwright-cli -s=a11y-structure close 2>/dev/null
playwright-cli -s=a11y-keyboard close 2>/dev/null
playwright-cli -s=a11y-content close 2>/dev/null
playwright-cli -s=a11y-dynamic close 2>/dev/null
```
