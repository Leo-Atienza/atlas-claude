---
name: test-consistency
description: Audit design system consistency across pages. Use when user wants to check visual consistency, design tokens, component reuse, color palette, typography, spacing, or cross-page uniformity.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Design System Consistency

Run 30 design consistency test cases across 3 parallel agents covering visual tokens, component patterns, and cross-page uniformity. Extracts computed styles from matched elements across multiple pages and compares for variance.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-consistency/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Page Discovery

Before testing, discover pages to compare:

```bash
playwright-cli -s=cons-discover open "$URL"
playwright-cli -s=cons-discover run-code "async page => {
  const links = await page.locator('a[href]').all();
  const hrefs = await Promise.all(links.map(l => l.getAttribute('href')));
  const origin = new URL(page.url()).origin;
  const internal = [...new Set(hrefs.filter(h => h && (h.startsWith('/') || h.startsWith(origin))).map(h => h.startsWith('/') ? origin + h : h))];
  return internal.slice(0, 10); // Test up to 10 pages
}"
playwright-cli -s=cons-discover close
```

Store discovered page URLs for agents to iterate over.

## Parallel Execution — 3 Subagents

### Agent 1: Visual (`-s=cons-visual`)

Tests colors, typography, and spacing consistency.

```bash
playwright-cli -s=cons-visual open "$URL"
playwright-cli -s=cons-visual tracing-start
```

**Test Cases:**

For each test, `run-code` extracts computed styles across multiple pages and checks for consistency.

| TC | Test | How to Check |
|----|------|-------------|
| TC-DC1 | Color palette — max N unique colors (flag >15) | `run-code` to collect all computed `color`, `background-color`, `border-color` values from all elements. Count unique colors |
| TC-DC2 | Brand colors consistent across pages | Visit each discovered page, collect primary colors (h1, CTA, nav background), verify same hex values |
| TC-DC3 | Font families — max 3 unique | `run-code` to collect all computed `font-family` values, count unique families |
| TC-DC4 | Font size scale — consistent scale | `run-code` to collect all font-size values, check if they follow a consistent scale (e.g., 12/14/16/20/24/32) |
| TC-DC5 | Font weights consistent | `run-code` to collect font-weight values, check for unnecessary variety (not random 400/500/600) |
| TC-DC6 | Line heights — consistent ratio | `run-code` to compute lineHeight/fontSize ratio for text elements, verify consistent ratios |
| TC-DC7 | Spacing scale — consistent | `run-code` to collect margin and padding values, check if they follow a scale (4/8/16/24/32/48px) |
| TC-DC8 | Border radius consistent | `run-code` to collect border-radius values from similar components (buttons, cards, inputs), verify consistency |
| TC-DC9 | Shadow styles consistent | `run-code` to collect box-shadow values, verify consistent shadow patterns |
| TC-DC10 | Icon sizing consistent | `run-code` to find SVG/icon elements, measure dimensions, verify consistent sizes |

```bash
playwright-cli -s=cons-visual tracing-stop
playwright-cli -s=cons-visual close
```

### Agent 2: Components (`-s=cons-components`)

Tests component pattern consistency.

```bash
playwright-cli -s=cons-components open "$URL"
playwright-cli -s=cons-components tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-DC11 | Buttons — same style for same type across pages | Visit multiple pages, collect button styles (background, color, padding, border-radius) by type (primary, secondary), compare |
| TC-DC12 | Input fields — same height, padding, border | Collect input styles across pages, verify consistent dimensions and borders |
| TC-DC13 | Cards — consistent padding, shadow, radius | Find card-like containers, compare styling across instances |
| TC-DC14 | Navigation — same structure/style on all pages | Visit each page, compare nav element structure and styling |
| TC-DC15 | Footer — identical across pages | Visit each page, compare footer structure and content |
| TC-DC16 | Headings — same style for same level | Compare h1, h2, h3 styles across pages — same level should have same styling |
| TC-DC17 | Links — same color/underline treatment | Collect link styles, verify consistent color and text-decoration |
| TC-DC18 | Alerts/badges — consistent colors for severity | Find alert/badge components, verify error=red, warning=yellow, success=green consistently |
| TC-DC19 | Avatar/image — consistent sizing and shape | Find avatar/profile image components, verify consistent dimensions and border-radius |
| TC-DC20 | Table styling — consistent headers, rows, borders | If tables exist: compare table styling across instances |

```bash
playwright-cli -s=cons-components tracing-stop
playwright-cli -s=cons-components close
```

### Agent 3: Pages (`-s=cons-pages`)

Tests cross-page layout consistency.

```bash
playwright-cli -s=cons-pages open "$URL"
playwright-cli -s=cons-pages tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-DC21 | Page layout — consistent content width | Visit each page, measure main content container width, verify consistent |
| TC-DC22 | Header height — same on all pages | Visit each page, measure header height, verify consistent |
| TC-DC23 | Sidebar width — consistent if present | If sidebar exists: measure width across pages |
| TC-DC24 | Content padding — same on all pages | Measure main content padding across pages |
| TC-DC25 | Background colors — consistent page backgrounds | Compare body/main background-color across pages |
| TC-DC26 | Loading patterns — same spinner/skeleton | If loading states exist: compare loading indicator styling across features |
| TC-DC27 | Error patterns — same error style everywhere | If error states visible: compare error message styling |
| TC-DC28 | Empty state patterns — consistent across features | If empty states exist: compare empty state UI patterns |
| TC-DC29 | Animation patterns — same easing/duration | Compare transition-duration and transition-timing-function across similar components |
| TC-DC30 | Responsive breakpoints — same across pages | `run-code` to check CSS media queries across loaded stylesheets, verify same breakpoint values |

```bash
playwright-cli -s=cons-pages tracing-stop
playwright-cli -s=cons-pages close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include a consistency scorecard:

| Category | Score | Variance Issues |
|----------|-------|----------------|
| Visual Tokens | X/10 | 23 unique colors (target ≤15) |
| Components | X/10 | Button styles vary across 3 pages |
| Cross-Page | X/10 | Header height differs on /about |
| **Overall** | **X/30** | ... |

For each inconsistency, include:
- **Where**: Which pages/elements are inconsistent
- **Values found**: List of varying values (e.g., font-sizes: 14px, 15px, 16px)
- **Suggested fix**: Standardize to which value and why

Group results:
1. Visual Tokens (TC-DC1 through TC-DC10)
2. Component Patterns (TC-DC11 through TC-DC20)
3. Cross-Page Uniformity (TC-DC21 through TC-DC30)

## Cleanup

```bash
playwright-cli -s=cons-discover close 2>/dev/null
playwright-cli -s=cons-visual close 2>/dev/null
playwright-cli -s=cons-components close 2>/dev/null
playwright-cli -s=cons-pages close 2>/dev/null
```
