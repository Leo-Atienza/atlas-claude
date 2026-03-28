---
name: test-responsive
description: Run responsive design and visual adaptation tests across 4 viewports. Use when user wants to test responsive layout, mobile design, viewport behavior, dark mode, or print styles.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Responsive Design & Visual Adaptation

Run 18 responsive test cases across 4 parallel agents — one per viewport size. Each agent runs the full test suite at its assigned viewport.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-responsive/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 4 Subagents (one per viewport)

### Agent 1: Mobile (`-s=resp-320`)

```bash
playwright-cli -s=resp-320 open "$URL"
playwright-cli -s=resp-320 resize 320 568
playwright-cli -s=resp-320 tracing-start
playwright-cli -s=resp-320 screenshot --filename="$OUTDIR/screenshots/320-initial.png"
playwright-cli -s=resp-320 snapshot --filename="$OUTDIR/snapshots/320-initial.yaml"
```

### Agent 2: Tablet (`-s=resp-768`)

```bash
playwright-cli -s=resp-768 open "$URL"
playwright-cli -s=resp-768 resize 768 1024
playwright-cli -s=resp-768 tracing-start
playwright-cli -s=resp-768 screenshot --filename="$OUTDIR/screenshots/768-initial.png"
playwright-cli -s=resp-768 snapshot --filename="$OUTDIR/snapshots/768-initial.yaml"
```

### Agent 3: Laptop (`-s=resp-1024`)

```bash
playwright-cli -s=resp-1024 open "$URL"
playwright-cli -s=resp-1024 resize 1024 768
playwright-cli -s=resp-1024 tracing-start
playwright-cli -s=resp-1024 screenshot --filename="$OUTDIR/screenshots/1024-initial.png"
playwright-cli -s=resp-1024 snapshot --filename="$OUTDIR/snapshots/1024-initial.yaml"
```

### Agent 4: Desktop (`-s=resp-1440`)

```bash
playwright-cli -s=resp-1440 open "$URL"
playwright-cli -s=resp-1440 resize 1440 900
playwright-cli -s=resp-1440 tracing-start
playwright-cli -s=resp-1440 screenshot --filename="$OUTDIR/screenshots/1440-initial.png"
playwright-cli -s=resp-1440 snapshot --filename="$OUTDIR/snapshots/1440-initial.yaml"
```

## Test Cases — Each Agent Runs ALL

| TC | Test | How to Check |
|----|------|-------------|
| TC-R1 | No horizontal overflow | `run-code`: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` |
| TC-R2 | Navigation transforms (hamburger ↔ full nav) | At 320: check for hamburger/menu button. At 1440: check for full nav links visible |
| TC-R3 | Images/media scale within viewport | `run-code` to find img/video/iframe elements, check none have width > viewport width |
| TC-R4 | Touch targets ≥48x48px (mobile) / ≥44x44px (WCAG) | `run-code` to measure all interactive element bounding boxes on mobile viewports |
| TC-R5 | Font sizes ≥12px, line heights readable | `run-code` to sample text elements, check computed fontSize ≥12px, lineHeight ratio ≥1.4 |
| TC-R6 | No text truncation hiding critical content | `run-code` to find elements with `overflow:hidden` + `text-overflow:ellipsis`, flag critical content (headings, CTAs, prices) |
| TC-R7 | Modals/dialogs fit within viewport | If modal exists: open it, `run-code` to check modal dimensions ≤ viewport |
| TC-R8 | Fixed/sticky elements don't overlap content | `run-code` to find `position:fixed/sticky` elements, check they don't cover more than 20% of viewport |
| TC-R9 | Tables responsive (scroll or stack) | `run-code` to find tables, check for horizontal scroll wrapper or responsive stacking |
| TC-R10 | Videos/embeds maintain aspect ratio | `run-code` to find video/iframe elements, check aspect ratio is reasonable (not squished) |
| TC-R11 | Dark mode renders correctly | `run-code` to emulate dark color scheme: `page.emulateMedia({colorScheme:'dark'})`, take screenshot |
| TC-R12 | Dark mode text contrast maintained | In dark mode: sample text elements, verify contrast ratio ≥4.5:1 |
| TC-R13 | Dark mode images/icons visible | In dark mode: check for images/SVGs that may be invisible on dark backgrounds |
| TC-R14 | Print styles — `@media print` present | `run-code` to check for print stylesheets or `@media print` rules |
| TC-R15 | Print styles — no cut-off content | `run-code` to emulate print: `page.emulateMedia({media:'print'})`, take screenshot |
| TC-R16 | RTL layout mirrors correctly | Check if page has `dir="rtl"` or RTL lang; if so, verify layout mirroring |
| TC-R17 | Landscape orientation — no breakage | `resize` to landscape dimensions (e.g., 568x320 for mobile), check no overflow or overlap |
| TC-R18 | Zoom 200% — no overlap/horizontal scroll | `run-code` to set `document.documentElement.style.zoom = '200%'`, check for overflow |

After running all tests at the assigned viewport, each agent captures evidence:

```bash
playwright-cli -s=<session> screenshot --filename="$OUTDIR/screenshots/<viewport>-final.png"
playwright-cli -s=<session> tracing-stop
playwright-cli -s=<session> close
```

## Report Generation

After all 4 agents complete, merge results into `$OUTDIR/report.md`.

Use a matrix format showing pass/fail per test case per viewport:

| Test Case | 320×568 | 768×1024 | 1024×768 | 1440×900 |
|-----------|---------|----------|----------|----------|
| TC-R1 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| TC-R2 | ... | ... | ... | ... |

## Cleanup

```bash
playwright-cli -s=resp-320 close 2>/dev/null
playwright-cli -s=resp-768 close 2>/dev/null
playwright-cli -s=resp-1024 close 2>/dev/null
playwright-cli -s=resp-1440 close 2>/dev/null
```
