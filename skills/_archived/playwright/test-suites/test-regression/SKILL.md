---
name: test-regression
description: Run regression detection by comparing current page state against stored baselines. Use when user wants to detect regressions, compare before/after states, check for structural changes, or run baseline comparisons. Use --baseline flag to capture initial baseline.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Regression Detection

Compare current page state against stored baselines to detect structural, visual, performance, and content regressions.

## Setup

```bash
ARGS="$ARGUMENTS"
URL=$(echo "$ARGS" | awk '{print $1}')
URL="${URL:-http://localhost:3000}"
BASELINE_FLAG=$(echo "$ARGS" | grep -o '\-\-baseline' || true)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-regression/$TIMESTAMP"
BASELINE_DIR="test-results/baselines"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
mkdir -p "$BASELINE_DIR"
```

## Mode Detection

This skill operates in two modes:

### Baseline Mode (`--baseline`)
Captures initial baselines for future comparison. Run this first on a known-good state.

```
/test-regression https://example.com --baseline
```

### Comparison Mode (default)
Compares current state against stored baselines. Run this after changes.

```
/test-regression https://example.com
```

## Baseline Capture Mode

When `--baseline` flag is detected:

```bash
playwright-cli -s=reg-baseline open "$URL"
playwright-cli -s=reg-baseline snapshot --filename="$BASELINE_DIR/baseline-snapshot.yaml"
playwright-cli -s=reg-baseline screenshot --filename="$BASELINE_DIR/baseline-screenshot.png"
```

Capture baseline data:

```bash
playwright-cli -s=reg-baseline run-code "async page => {
  const data = {
    url: page.url(),
    title: await page.title(),
    timestamp: new Date().toISOString(),
    // Structural data
    headings: await page.locator('h1,h2,h3,h4,h5,h6').allTextContents(),
    navLinks: await page.locator('nav a').count(),
    forms: await page.locator('form').count(),
    images: await page.locator('img').count(),
    buttons: await page.locator('button, [role=button], input[type=submit]').count(),
    // Performance baseline
    loadTime: await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart),
    domNodes: await page.evaluate(() => document.querySelectorAll('*').length),
    // Console errors
    consoleErrors: [],
    // Key element dimensions
    dimensions: await page.evaluate(() => {
      const els = document.querySelectorAll('nav, main, header, footer, h1, [class*=hero], [class*=cta]');
      return Array.from(els).slice(0, 20).map(el => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, class: el.className.toString().slice(0, 50), width: Math.round(r.width), height: Math.round(r.height) };
      });
    })
  };
  return JSON.stringify(data, null, 2);
}"
```

Save the returned JSON to `$BASELINE_DIR/baseline-data.json`.

```bash
playwright-cli -s=reg-baseline console  # Capture any baseline console errors
playwright-cli -s=reg-baseline close
```

Generate baseline report noting what was captured.

## Comparison Mode — Parallel Execution

When running without `--baseline`, spawn 1 agent per page. For single-page testing:

### Agent: Regression Check (`-s=reg-compare`)

```bash
playwright-cli -s=reg-compare open "$URL"
playwright-cli -s=reg-compare tracing-start
playwright-cli -s=reg-compare snapshot --filename="$OUTDIR/snapshots/current-snapshot.yaml"
playwright-cli -s=reg-compare screenshot --filename="$OUTDIR/screenshots/current-screenshot.png"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-RG1 | Structural diff — a11y tree comparison | Compare current snapshot YAML against `$BASELINE_DIR/baseline-snapshot.yaml`. Report added/removed/changed elements |
| TC-RG2 | Page existence — all baselined URLs return 200 | Fetch the baselined URL, verify 200 status (not 404/500) |
| TC-RG3 | Critical elements still present | Compare current nav links, forms, buttons, headings counts against baseline. Flag if any decreased |
| TC-RG4 | Console errors — new errors not in baseline | `console` output, compare against baseline console errors. Flag any new errors |
| TC-RG5 | Network errors — new failed requests | `network` output, check for failed requests not present in baseline |
| TC-RG6 | Performance regression — load time ±20% | `run-code` to measure load time, compare against baseline. Flag if >20% slower |
| TC-RG7 | Layout regression — element dimensions ±10% | `run-code` to measure key element dimensions, compare against baseline dimensions |
| TC-RG8 | Content regression — text diff on key sections | `run-code` to extract heading text, nav text, footer text, compare against baseline |

```bash
playwright-cli -s=reg-compare tracing-stop
playwright-cli -s=reg-compare close
```

## Diff Analysis

For each test case, generate a diff report:

```markdown
### TC-RG1: Structural Diff

**Status**: REGRESSION DETECTED

Changes found:
- ADDED: 2 new buttons in header
- REMOVED: sidebar navigation (was 5 links, now 0)
- CHANGED: h1 text from "Dashboard" to "Home"

### TC-RG6: Performance

**Status**: WARNING

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Load Time | 1200ms | 1600ms | +33% WARNING |
| DOM Nodes | 850 | 920 | +8% OK |
```

## Report Generation

After comparison, generate `$OUTDIR/report.md`:

- **Regression Summary**: How many tests regressed vs stable
- **Diff details**: Per-test comparison with baseline
- **Severity**: Critical (structural removal), Major (performance regression >20%), Minor (dimension shift), Info (new additions)
- **Evidence links**: Screenshots, snapshots for visual comparison

## Multi-Page Regression

For testing multiple pages, parse URLs from a pages list file or discover via crawling:

```bash
# If multiple URLs provided: /test-regression https://example.com/page1 https://example.com/page2
# Spawn one agent per page: -s=reg-page1, -s=reg-page2, etc.
```

## Cleanup

```bash
playwright-cli -s=reg-baseline close 2>/dev/null
playwright-cli -s=reg-compare close 2>/dev/null
```
