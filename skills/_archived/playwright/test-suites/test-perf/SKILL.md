---
name: test-perf
description: Run performance and Core Web Vitals testing on a URL. Use when user wants to test page speed, LCP, CLS, INP, load times, asset optimization, or runtime performance.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Performance & Core Web Vitals

Run 25 performance test cases across 3 parallel agents covering page load/CWV, runtime performance, and asset optimization.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-perf/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents

### Agent 1: Loading (`-s=perf-loading`)

Tests page load performance and Core Web Vitals.

```bash
playwright-cli -s=perf-loading open "$URL"
playwright-cli -s=perf-loading tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-P1 | Time to first meaningful paint | `run-code` to read `performance.getEntriesByType('paint')` for first-contentful-paint timing |
| TC-P2 | LCP ≤2.5s | `run-code` with PerformanceObserver for `largest-contentful-paint` entry, check `startTime ≤ 2500` |
| TC-P3 | FID/INP ≤200ms | `run-code` with PerformanceObserver for `first-input` and `event` entries, check delay ≤ 200ms |
| TC-P4 | CLS ≤0.1 | `run-code` with PerformanceObserver for `layout-shift` entries (no `hadRecentInput`), sum values, check ≤ 0.1 |
| TC-P5 | Time to Interactive (TTI) | `run-code` to measure time until main thread is idle: `performance.timing.domInteractive - performance.timing.navigationStart` |
| TC-P6 | Total page weight <3MB | `run-code` to sum `performance.getEntriesByType('resource').map(r => r.transferSize)`, check < 3MB |
| TC-P7 | DOM node count <1500 | `run-code`: `document.querySelectorAll('*').length`, flag if >1500 |
| TC-P8 | Render-blocking resources count | `run-code` to find `<link rel="stylesheet">` in `<head>` without `media` attr and `<script>` without `defer`/`async` |

```bash
playwright-cli -s=perf-loading tracing-stop
playwright-cli -s=perf-loading close
```

### Agent 2: Runtime (`-s=perf-runtime`)

Tests runtime performance and interaction responsiveness.

```bash
playwright-cli -s=perf-runtime open "$URL"
playwright-cli -s=perf-runtime tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-P9 | Long tasks (>50ms) detected | `run-code` with PerformanceObserver for `longtask` entries, report count and durations |
| TC-P10 | Memory usage / leaks | `run-code`: `performance.memory` (Chrome only) — check `usedJSHeapSize`, compare before/after interactions |
| TC-P11 | Scroll performance (no jank) | `run-code` to scroll page while measuring frame timing via requestAnimationFrame, flag >16ms gaps |
| TC-P12 | Animation frame rate | `run-code` to measure 60 frames via requestAnimationFrame, calculate avg fps, flag <30fps |
| TC-P13 | Input responsiveness | `run-code` to measure time from click event to next paint via PerformanceObserver `event` entries |
| TC-P14 | Lazy loading works | `run-code` to check images below fold have `loading="lazy"` and aren't loaded until scroll |
| TC-P15 | Skeleton/loading states appear before content | `run-code` to intercept network requests, verify skeleton UI renders while data loads |

```bash
playwright-cli -s=perf-runtime tracing-stop
playwright-cli -s=perf-runtime close
```

### Agent 3: Assets (`-s=perf-assets`)

Tests asset optimization and network efficiency.

```bash
playwright-cli -s=perf-assets open "$URL"
playwright-cli -s=perf-assets tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-P16 | Images use modern formats (WebP/AVIF) | `run-code` to check image `src` extensions and `Content-Type` from performance entries |
| TC-P17 | Images have explicit width/height | `run-code` to find `<img>` elements without `width` and `height` attributes (causes CLS) |
| TC-P18 | Images lazy loaded | `run-code` to find below-fold images, check for `loading="lazy"` attribute |
| TC-P19 | CSS/JS minified | `run-code` to fetch CSS/JS resources, check file size and whitespace ratio |
| TC-P20 | Gzip/Brotli compression enabled | `run-code` to check `Content-Encoding` header on resources via performance entries |
| TC-P21 | Browser caching headers | `run-code` to fetch resources and check `Cache-Control`, `ETag`, `Expires` headers |
| TC-P22 | No unused CSS/JS (coverage) | `run-code` with `page.coverage.startCSSCoverage()` / `startJSCoverage()`, report unused percentage |
| TC-P23 | Font loading strategy | `run-code` to check `@font-face` rules for `font-display: swap` or `optional` |
| TC-P24 | Preconnect/prefetch hints | `run-code` to find `<link rel="preconnect/prefetch/preload">` for third-party origins |
| TC-P25 | HTTP/2 or HTTP/3 used | `run-code` to check `nextHopProtocol` from `performance.getEntriesByType('resource')` |

```bash
playwright-cli -s=perf-assets tracing-stop
playwright-cli -s=perf-assets close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include a performance scorecard:

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | Xs | ≤2.5s | ✅/❌ |
| CLS | X | ≤0.1 | ✅/❌ |
| INP | Xms | ≤200ms | ✅/❌ |
| Page Weight | XMB | <3MB | ✅/❌ |
| DOM Nodes | X | <1500 | ✅/❌ |

Group detailed results:
1. Loading (TC-P1 through TC-P8)
2. Runtime (TC-P9 through TC-P15)
3. Assets (TC-P16 through TC-P25)

## Cleanup

```bash
playwright-cli -s=perf-loading close 2>/dev/null
playwright-cli -s=perf-runtime close 2>/dev/null
playwright-cli -s=perf-assets close 2>/dev/null
```
