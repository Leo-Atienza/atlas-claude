---
name: test-cross-browser
description: Test cross-browser consistency across Chromium, Firefox, and WebKit. Use when user wants to verify browser compatibility, cross-browser layout, or browser-specific issues.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Cross-Browser Consistency

Run 10 test cases across 3 parallel agents — one per browser engine (Chromium, Firefox, WebKit). Each agent runs the identical test suite for direct comparison.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-cross-browser/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents (one per browser)

### Agent 1: Chromium (`-s=xb-chromium`)

```bash
playwright-cli -s=xb-chromium open "$URL" --browser=chrome
playwright-cli -s=xb-chromium tracing-start
playwright-cli -s=xb-chromium screenshot --filename="$OUTDIR/screenshots/chromium-initial.png"
playwright-cli -s=xb-chromium snapshot --filename="$OUTDIR/snapshots/chromium-initial.yaml"
```

### Agent 2: Firefox (`-s=xb-firefox`)

```bash
playwright-cli -s=xb-firefox open "$URL" --browser=firefox
playwright-cli -s=xb-firefox tracing-start
playwright-cli -s=xb-firefox screenshot --filename="$OUTDIR/screenshots/firefox-initial.png"
playwright-cli -s=xb-firefox snapshot --filename="$OUTDIR/snapshots/firefox-initial.yaml"
```

### Agent 3: WebKit (`-s=xb-webkit`)

```bash
playwright-cli -s=xb-webkit open "$URL" --browser=webkit
playwright-cli -s=xb-webkit tracing-start
playwright-cli -s=xb-webkit screenshot --filename="$OUTDIR/screenshots/webkit-initial.png"
playwright-cli -s=xb-webkit snapshot --filename="$OUTDIR/snapshots/webkit-initial.yaml"
```

## Test Cases — Each Agent Runs ALL

| TC | Test | How to Check |
|----|------|-------------|
| TC-XB1 | Page renders — a11y tree structure matches | `snapshot`, compare structural elements across browser snapshots |
| TC-XB2 | Forms — fill + submit works | Find form, fill fields with `fill`, `click` submit, verify success state |
| TC-XB3 | Navigation — links, back/forward | Click nav links, `go-back`, `go-forward`, verify correct pages load |
| TC-XB4 | JS feature support | `run-code` to test: `typeof fetch`, `typeof Promise`, `typeof IntersectionObserver`, `typeof ResizeObserver` — all should return `'function'` |
| TC-XB5 | CSS consistency — element dimensions within 5px | `run-code` to measure key element bounding rects, compare across browsers (±5px tolerance) |
| TC-XB6 | CSS Grid/Flexbox renders correctly | `run-code` to find Grid/Flexbox containers, verify children layout (positions, sizes) |
| TC-XB7 | Custom fonts load correctly | `run-code` to check `document.fonts.ready`, then verify computed font-family matches expected |
| TC-XB8 | Animations/transitions render | `run-code` to check for elements with CSS animation/transition, verify they have non-zero duration |
| TC-XB9 | Scroll behavior — smooth/snap | `run-code` to check `scroll-behavior` and `scroll-snap-type` CSS properties are applied |
| TC-XB10 | Input types — date/color/range | `run-code` to find specialized input types, verify they render natively (have shadow DOM or platform UI) |

After running all tests:

```bash
playwright-cli -s=<session> screenshot --filename="$OUTDIR/screenshots/<browser>-final.png"
playwright-cli -s=<session> tracing-stop
playwright-cli -s=<session> close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Use a comparison matrix:

| Test Case | Chromium | Firefox | WebKit | Consistent? |
|-----------|----------|---------|--------|-------------|
| TC-XB1 | ✅ | ✅ | ✅ | ✅ |
| TC-XB2 | ✅ | ✅ | ❌ | ❌ |
| ... | ... | ... | ... | ... |

Highlight inconsistencies with details:
- Which browser failed
- What the difference was (dimensions, behavior, missing feature)
- Suggested fix (polyfill, vendor prefix, fallback)

## Cleanup

```bash
playwright-cli -s=xb-chromium close 2>/dev/null
playwright-cli -s=xb-firefox close 2>/dev/null
playwright-cli -s=xb-webkit close 2>/dev/null
```
