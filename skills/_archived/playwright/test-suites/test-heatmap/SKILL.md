---
name: test-heatmap
description: Analyze attention patterns, visual hierarchy, and interaction prediction. Use when user wants to analyze UX layout, visual hierarchy, CTA placement, click target analysis, or attention scoring.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Attention & Interaction Prediction

Run 24 UX analysis test cases across 3 parallel agents covering layout patterns, interaction mapping, and attention scoring. Uses computational analysis of element positions, sizes, and styles to predict user attention patterns.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-heatmap/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents

### Agent 1: Layout (`-s=heat-layout`)

Analyzes layout patterns and visual hierarchy.

```bash
playwright-cli -s=heat-layout open "$URL"
playwright-cli -s=heat-layout tracing-start
playwright-cli -s=heat-layout screenshot --filename="$OUTDIR/screenshots/layout-full.png"
playwright-cli -s=heat-layout snapshot --filename="$OUTDIR/snapshots/layout-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-HM1 | F-pattern compliance | `run-code` to map element positions — check if primary content follows F-shape: strong top horizontal bar, left-aligned content, decreasing right engagement. Score elements by (y-position × x-position) weight |
| TC-HM2 | Z-pattern for landing pages | `run-code` to check if hero section follows Z: top-left (logo/brand) → top-right (nav/CTA) → bottom-left (features) → bottom-right (CTA). Analyze element positions in quadrants |
| TC-HM3 | Above-fold content percentage | `run-code` to measure viewport height, calculate percentage of critical content (h1, CTAs, hero) visible without scrolling |
| TC-HM4 | Visual hierarchy scoring | `run-code` to rank elements by: `(fontSize * fontWeight/400) × contrastRatio × (1/distanceFromTop)`. Output ranked list of attention-grabbing elements |
| TC-HM5 | Whitespace balance | `run-code` to divide viewport into grid cells, calculate content density per cell. Flag overcrowded cells (>80% filled) and empty cells (>90% empty in content areas) |
| TC-HM6 | Grid alignment | `run-code` to collect left-edge x-positions of content blocks. Check if they cluster around consistent grid lines (within ±4px) |
| TC-HM7 | Gutenberg diagram | `run-code` to divide viewport into 4 quadrants. Verify: top-left (primary optical area) has logo/headline, bottom-right (terminal area) has CTA |
| TC-HM8 | Reading flow | `run-code` to order content blocks by position. Verify top→bottom, left→right flow for LTR pages. Check `dir` attribute for RTL |

```bash
playwright-cli -s=heat-layout tracing-stop
playwright-cli -s=heat-layout close
```

### Agent 2: Interaction (`-s=heat-interaction`)

Analyzes click targets and interaction mapping.

```bash
playwright-cli -s=heat-interaction open "$URL"
playwright-cli -s=heat-interaction tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-HM9 | CTA prominence — largest/most contrasting | `run-code` to find all interactive elements, rank by: `area × contrastRatio`. Primary CTA should be #1 or #2 |
| TC-HM10 | CTA positioning — above fold, terminal area | `run-code` to get primary CTA bounding box, verify it's within viewport height and in center or bottom-right quadrant |
| TC-HM11 | Fitts's Law — large + near cursor | `run-code` to measure button sizes. Frequently-used buttons (submit, CTA, nav) should be larger than utility buttons (settings, close) |
| TC-HM12 | Click target density — not overcrowded | `run-code` to find clusters of interactive elements. Flag areas where >5 interactive elements within 100x100px |
| TC-HM13 | Click target dead zones | `run-code` to find large areas (>200x200px) between interactive elements with no clickable targets |
| TC-HM14 | Button hierarchy — visually distinct | `run-code` to categorize buttons by styling (background-color, border, size). Verify primary/secondary/tertiary are visually differentiated |
| TC-HM15 | Interactive element spacing ≥8px | `run-code` to measure gaps between adjacent interactive elements. Flag gaps <8px |
| TC-HM16 | Hover areas match visual size | `run-code` to compare element visible size vs clickable area (padding, computed dimensions). Flag mismatches |

```bash
playwright-cli -s=heat-interaction tracing-stop
playwright-cli -s=heat-interaction close
```

### Agent 3: Attention (`-s=heat-attention`)

Scores attention distribution and detects dead zones.

```bash
playwright-cli -s=heat-attention open "$URL"
playwright-cli -s=heat-attention tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-HM17 | Color contrast attention | `run-code` to rank elements by contrast ratio vs their background. Verify highest-contrast elements are important content (not decorative) |
| TC-HM18 | Size-based attention | `run-code` to rank elements by visual area. Verify largest elements are primary content (hero, h1, CTA), not ads or decorative |
| TC-HM19 | Animation attention | `run-code` to find elements with CSS animation/transition. Verify animated elements are intentional attention-grabbers (loading, CTA pulse), not distracting (ads, decoration) |
| TC-HM20 | Isolation effect — CTA whitespace | `run-code` to measure whitespace around primary CTA. Verify ≥24px padding on all sides from other content |
| TC-HM21 | Image focal points toward CTA | `run-code` to check hero image position relative to CTA. Verify image is adjacent to (not covering) CTA |
| TC-HM22 | Competing elements — no dual CTAs | `run-code` to find equally-styled primary CTAs in same viewport section. Flag if 2+ primary CTAs compete |
| TC-HM23 | Banner blindness zones | `run-code` to check if critical content is placed in typical ad zones: right sidebar 300px, top banner 90px, bottom banner. Flag important content in these zones |
| TC-HM24 | Scroll depth prediction | `run-code` to calculate page height vs viewport. If page is >3x viewport, verify most important content is in top 50% |

```bash
playwright-cli -s=heat-attention tracing-stop
playwright-cli -s=heat-attention close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include an attention map summary:
- **Visual hierarchy ranking**: Top 10 elements by predicted attention
- **CTA effectiveness score**: Position × size × contrast
- **Problem areas**: Dead zones, competing elements, misplaced content
- **Recommendations**: Specific layout adjustments with reasoning

Group results:
1. Layout Patterns (TC-HM1 through TC-HM8)
2. Interaction Mapping (TC-HM9 through TC-HM16)
3. Attention Scoring (TC-HM17 through TC-HM24)

## Cleanup

```bash
playwright-cli -s=heat-layout close 2>/dev/null
playwright-cli -s=heat-interaction close 2>/dev/null
playwright-cli -s=heat-attention close 2>/dev/null
```
