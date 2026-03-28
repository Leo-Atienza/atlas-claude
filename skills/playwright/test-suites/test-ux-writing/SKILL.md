---
name: test-ux-writing
description: Analyze micro-copy, CTA text, error messages, and content quality. Use when user wants to audit UX writing, button labels, error messages, form labels, or content clarity.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Micro-Copy & Content Quality

Run 26 UX writing test cases across 3 parallel agents covering CTAs/buttons, feedback messages, and labels/content. Uses accessibility tree snapshots to extract and analyze all user-facing text.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-ux-writing/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents

### Agent 1: CTAs (`-s=uxw-cta`)

Analyzes CTA text, button labels, and action language.

```bash
playwright-cli -s=uxw-cta open "$URL"
playwright-cli -s=uxw-cta tracing-start
playwright-cli -s=uxw-cta snapshot --filename="$OUTDIR/snapshots/cta-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-UW1 | CTAs use action verbs | `run-code` to get all button/submit/CTA text. Check for action verbs (Get, Start, Download, Sign, Create, etc.) vs passive text (Submit, OK, Yes, No) |
| TC-UW2 | CTAs are specific | `run-code` to flag generic CTA text: "Click Here", "Submit", "Go", "OK", "Continue". Prefer "Download PDF", "Create Account", "Get Started" |
| TC-UW3 | Primary CTA text ≤4 words | `run-code` to find primary CTA buttons, check word count ≤ 4 |
| TC-UW4 | Button text matches expected action | `run-code` to check if button text aligns with surrounding context (a "Delete" button shouldn't say "OK") |
| TC-UW5 | Destructive actions have clear warning | `run-code` to find buttons with destructive keywords (delete, remove, cancel, reset). Check for warning language or confirmation |
| TC-UW6 | Confirmation dialogs explain consequences | If confirmation modals exist: check dialog text explains what will happen, not just "Are you sure?" |
| TC-UW7 | Cancel/dismiss clearly labeled | `run-code` to find cancel/dismiss buttons, verify they use "Cancel", "Close", "Dismiss" — not "No", "X" without aria-label |
| TC-UW8 | No double negatives | `run-code` to find text containing double negatives: "Don't unsubscribe", "Not uncheck", "Disable off". Flag confusing constructions |

```bash
playwright-cli -s=uxw-cta tracing-stop
playwright-cli -s=uxw-cta close
```

### Agent 2: Feedback (`-s=uxw-feedback`)

Analyzes error messages, success messages, and help text.

```bash
playwright-cli -s=uxw-feedback open "$URL"
playwright-cli -s=uxw-feedback tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-UW9 | Error messages explain what went wrong | Trigger form errors (submit empty required fields), check error text is specific (not just "Error" or "Invalid") |
| TC-UW10 | Error messages suggest how to fix | Check error messages include correction hint: "Enter a valid email address" vs just "Invalid email" |
| TC-UW11 | Error messages use plain language | Check error messages for technical jargon: "400 Bad Request", "NaN", "null", "undefined", "exception", "runtime" |
| TC-UW12 | Success messages confirm what happened | Trigger success action, verify message confirms outcome: "Your profile has been saved" vs "Success" |
| TC-UW13 | Loading text is specific | Find loading indicators, check for specific text: "Loading your dashboard" vs generic "Loading..." |
| TC-UW14 | Empty states explain + suggest action | Navigate to empty state, verify text explains why empty AND suggests next action |
| TC-UW15 | Help text/tooltips are concise | Find help text elements (title attributes, tooltips, helper text), verify ≤20 words |
| TC-UW16 | Inline validation is immediate and clear | Type invalid input, check if validation message appears inline near the field, not at top of form |

```bash
playwright-cli -s=uxw-feedback tracing-stop
playwright-cli -s=uxw-feedback close
```

### Agent 3: Content (`-s=uxw-content`)

Analyzes labels, placeholders, instructions, and terminology consistency.

```bash
playwright-cli -s=uxw-content open "$URL"
playwright-cli -s=uxw-content tracing-start
playwright-cli -s=uxw-content snapshot --filename="$OUTDIR/snapshots/content-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-UW17 | Form labels are descriptive | `run-code` to get all form labels. Flag generic labels: "Name", "Field 1", "Input". Prefer "Full name", "Company name" |
| TC-UW18 | Placeholder is example format, not label | `run-code` to check placeholders: should be examples ("john@example.com") not labels ("Enter your email"). Flag inputs where placeholder IS the only label |
| TC-UW19 | Required fields indicated clearly | `run-code` to find required fields, verify asterisk (*) or "required" text + legend explaining the indicator |
| TC-UW20 | Consistent terminology | `run-code` to collect all text, check for inconsistent terms: "Sign in" vs "Log in" vs "Sign on", "Account" vs "Profile" |
| TC-UW21 | No jargon or technical terms | `run-code` to scan user-facing text for technical terms: "API", "JSON", "null", "undefined", "exception", "runtime" |
| TC-UW22 | Numbers formatted for locale | `run-code` to find displayed numbers, check for proper formatting (commas for thousands, appropriate decimal separators) |
| TC-UW23 | Dates formatted clearly | `run-code` to find date displays, flag ambiguous formats (is 01/02/2024 Jan 2 or Feb 1?). Prefer "January 2, 2024" |
| TC-UW24 | Sentence case preferred over ALL CAPS | `run-code` to find text in ALL CAPS (excluding brand names/acronyms). Flag buttons, headings, labels in ALL CAPS |
| TC-UW25 | Links have descriptive text (not bare URLs) | `run-code` to find links where displayed text is a raw URL (https://...). Should use descriptive text |
| TC-UW26 | Legal/policy text is accessible | `run-code` to find legal/privacy/terms text, check font-size ≥12px and not hidden behind complex navigation |

```bash
playwright-cli -s=uxw-content tracing-stop
playwright-cli -s=uxw-content close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include a UX writing scorecard:

| Category | Score | Key Issues |
|----------|-------|------------|
| CTAs & Buttons | X/8 | ... |
| Feedback Messages | X/8 | ... |
| Content & Labels | X/10 | ... |
| **Overall** | **X/26** | ... |

For each failed test, include:
- **Current text**: What it says now
- **Suggested improvement**: What it should say
- **Reasoning**: Why the change improves UX

Group results:
1. CTAs & Buttons (TC-UW1 through TC-UW8)
2. Feedback Messages (TC-UW9 through TC-UW16)
3. Content & Labels (TC-UW17 through TC-UW26)

## Cleanup

```bash
playwright-cli -s=uxw-cta close 2>/dev/null
playwright-cli -s=uxw-feedback close 2>/dev/null
playwright-cli -s=uxw-content close 2>/dev/null
```
