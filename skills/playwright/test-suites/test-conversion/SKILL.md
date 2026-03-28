---
name: test-conversion
description: Analyze conversion optimization, cognitive load, and trust signals. Use when user wants to audit conversion funnels, reduce friction, analyze cognitive load, check trust signals, or optimize CTAs.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Conversion & Cognitive Load Analysis

Run 30 conversion optimization test cases across 3 parallel agents covering friction analysis, cognitive load, and trust signals.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-conversion/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents

### Agent 1: Friction (`-s=conv-friction`)

Analyzes friction in conversion flows and step counting.

```bash
playwright-cli -s=conv-friction open "$URL"
playwright-cli -s=conv-friction tracing-start
playwright-cli -s=conv-friction snapshot --filename="$OUTDIR/snapshots/friction-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-CV1 | Steps to primary conversion | Navigate the primary conversion path (sign up, purchase, contact), count clicks/pages from landing to completion |
| TC-CV2 | Form field count — flag >7 fields | `run-code` to count form fields (input, select, textarea). Each field = friction. Flag forms with >7 |
| TC-CV3 | Mandatory vs optional fields ratio | `run-code` to count required vs optional fields. High required:total ratio = more friction |
| TC-CV4 | Auto-fill support on address/payment | `run-code` to check autocomplete attributes on address/payment fields for proper values (street-address, cc-number, etc.) |
| TC-CV5 | Progress indicator in multi-step flows | If multi-step form: verify progress bar/step indicator shows current position |
| TC-CV6 | Save & continue later option | If long form: check for save/continue later functionality |
| TC-CV7 | Guest checkout available | If e-commerce: verify guest checkout option exists (no forced registration) |
| TC-CV8 | One-click actions where possible | Check for streamlined actions (one-click purchase, one-tap copy, quick add-to-cart) |
| TC-CV9 | Error recovery — clicks to recover | Trigger a form error, count clicks needed to fix and resubmit |
| TC-CV10 | Exit intent — recovery mechanisms | Check for exit-intent patterns (leave-page popups, cart abandonment emails, "are you sure?" prompts) |

```bash
playwright-cli -s=conv-friction tracing-stop
playwright-cli -s=conv-friction close
```

### Agent 2: Cognitive (`-s=conv-cognitive`)

Analyzes cognitive load and choice architecture.

```bash
playwright-cli -s=conv-cognitive open "$URL"
playwright-cli -s=conv-cognitive tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-CV11 | Choice overload — >7 options without categorization | `run-code` to find menus/select dropdowns/lists with >7 items, check if they have categories/groups (Miller's Law) |
| TC-CV12 | Information density — text blocks ≤5 lines | `run-code` to find text blocks (paragraphs), flag those >5 lines without visual break (heading, bullet, image) |
| TC-CV13 | Visual clutter score — elements per viewport | `run-code` to count distinct visible elements per viewport section. Flag >50 elements in viewport |
| TC-CV14 | Competing CTAs — max 1 primary per section | `run-code` to find primary-styled buttons per viewport section. Flag if >1 primary CTA competes |
| TC-CV15 | Information hierarchy — important info prominent | `run-code` to rank content by computed emphasis (size × weight × contrast). Verify most important content ranks highest |
| TC-CV16 | Scannability — headings, bullets, short paragraphs | `run-code` to check content structure: headings every ~300px of content, bullet lists used, paragraphs <150 words |
| TC-CV17 | Cognitive tunneling — single clear path | Check if each page section has one clear next action (not multiple competing paths) |
| TC-CV18 | Progressive disclosure | Check if complex information is hidden behind "Learn more", accordions, or tabs (not dumped all at once) |
| TC-CV19 | Hick's Law — categorization helps | For large option sets: verify categories/filters reduce decision complexity |
| TC-CV20 | Recognition over recall — familiar patterns | `run-code` to check for standard UI patterns: magnifying glass for search, hamburger for menu, X for close, shopping cart icon |

```bash
playwright-cli -s=conv-cognitive tracing-stop
playwright-cli -s=conv-cognitive close
```

### Agent 3: Trust (`-s=conv-trust`)

Analyzes trust signals and social proof.

```bash
playwright-cli -s=conv-trust open "$URL"
playwright-cli -s=conv-trust tracing-start
playwright-cli -s=conv-trust snapshot --filename="$OUTDIR/snapshots/trust-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-CV21 | Trust badges near conversion points | `run-code` to find trust badges/seals (SSL, security, payment icons) near forms and CTAs |
| TC-CV22 | Security indicators on sensitive forms | Find payment/login forms, check for lock icon, HTTPS indicator, security messaging nearby |
| TC-CV23 | Social proof visible | `run-code` to find testimonials, reviews, star ratings, user counts ("10,000+ users"), case studies |
| TC-CV24 | Contact information accessible | Check for phone number, email, physical address in footer or contact page. Verify reachable in ≤2 clicks |
| TC-CV25 | Privacy policy linked near data collection | Find forms that collect data, check for nearby privacy policy link |
| TC-CV26 | Money-back guarantee / free trial messaging | Find pricing/purchase areas, check for guarantee/trial messaging |
| TC-CV27 | Brand/partner logos visible | `run-code` to find logo grids, "trusted by", "as seen in" sections |
| TC-CV28 | Professional design quality | Check for: no broken images (`run-code` to find images with naturalWidth=0), consistent styling (reuse consistency results), no placeholder/lorem ipsum text |
| TC-CV29 | Clear pricing — no hidden fees | If pricing exists: verify prices are visible, total is clear, no "*" without explanation |
| TC-CV30 | Urgency/scarcity used ethically | Check for countdown timers, "only X left", "limited time". Flag if these appear manipulative (fake urgency, always-present countdown) |

```bash
playwright-cli -s=conv-trust tracing-stop
playwright-cli -s=conv-trust close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include a conversion scorecard:

| Category | Score | Key Issues |
|----------|-------|------------|
| Friction | X/10 | 12 form fields, 5 steps to purchase |
| Cognitive Load | X/10 | Menu has 15 uncategorized items |
| Trust Signals | X/10 | No testimonials, missing security badges |
| **Overall** | **X/30** | ... |

Include a conversion funnel analysis:
- Landing page → Sign up: X clicks, Y friction points
- Estimated drop-off points based on friction/cognitive load

Group results:
1. Friction Analysis (TC-CV1 through TC-CV10)
2. Cognitive Load (TC-CV11 through TC-CV20)
3. Trust Signals (TC-CV21 through TC-CV30)

## Cleanup

```bash
playwright-cli -s=conv-friction close 2>/dev/null
playwright-cli -s=conv-cognitive close 2>/dev/null
playwright-cli -s=conv-trust close 2>/dev/null
```
