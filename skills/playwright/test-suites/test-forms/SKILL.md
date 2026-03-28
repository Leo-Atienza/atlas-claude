---
name: test-forms
description: Run comprehensive form validation and input testing on a URL. Use when user wants to test forms, input fields, validation, file uploads, or submit behavior.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Form Validation & Input Testing

Run 27 form test cases across 4 parallel agents covering happy paths, validation, boundary values, and advanced input scenarios.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-forms/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Pre-check: Discover Forms

Before spawning agents, discover forms on the page:

```bash
playwright-cli -s=forms-discovery open "$URL"
playwright-cli -s=forms-discovery run-code "async page => {
  const forms = await page.locator('form').count();
  const inputs = await page.locator('input, select, textarea').count();
  return { forms, inputs };
}"
playwright-cli -s=forms-discovery snapshot --filename="$OUTDIR/snapshots/forms-discovery.yaml"
playwright-cli -s=forms-discovery close
```

If no forms or inputs found, generate a report noting "No forms found" and skip test execution.

## Parallel Execution — 4 Subagents

### Agent 1: Happy Path (`-s=forms-happy`)

Tests valid submissions, success states, and form reset.

```bash
playwright-cli -s=forms-happy open "$URL"
playwright-cli -s=forms-happy tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-F1 | Valid submission with all field types | Fill all fields with valid data, submit, verify success (no errors, redirect or success message) |
| TC-F2 | Form reset/clear button | Fill fields, click reset/clear button, verify all fields emptied |
| TC-F3 | Submit button disabled→enabled→loading states | Check initial disabled state (if applicable), fill required fields, verify enabled, click and check loading state |
| TC-F4 | Success confirmation (message/redirect/toast) | Submit valid form, verify success indicator appears (toast, message, redirect to new URL) |

```bash
playwright-cli -s=forms-happy tracing-stop
playwright-cli -s=forms-happy close
```

### Agent 2: Validation (`-s=forms-validation`)

Tests required fields, invalid formats, and error display.

```bash
playwright-cli -s=forms-validation open "$URL"
playwright-cli -s=forms-validation tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-F5 | Empty required fields (each individually) | Submit form without filling each required field, verify error appears per field |
| TC-F6 | Invalid email formats | Fill email field with `notanemail`, `@missing`, `user@`, verify validation error |
| TC-F7 | Invalid phone/URL/number formats | Fill fields with invalid formats per type, verify validation |
| TC-F8 | Error message display + clearing on correction | Trigger error, correct the field, verify error clears |
| TC-F9 | Real-time vs on-submit validation | Type invalid input, check if error shows immediately (blur/keyup) or only on submit |
| TC-F10 | Server-side validation messages | Submit form, check for server-returned error messages (not just client-side HTML5 validation) |

```bash
playwright-cli -s=forms-validation tracing-stop
playwright-cli -s=forms-validation close
```

### Agent 3: Boundary (`-s=forms-boundary`)

Tests boundary values, special characters, and edge cases.

```bash
playwright-cli -s=forms-boundary open "$URL"
playwright-cli -s=forms-boundary tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-F11 | Min/max length enforcement | Fill with text shorter/longer than limits, verify validation |
| TC-F12 | Special characters (`<>&"'`) | Fill fields with special chars, submit, verify no encoding issues or XSS |
| TC-F13 | Unicode/emoji (`日本語 🎉`) | Fill fields with unicode/emoji, submit, verify accepted and displayed correctly |
| TC-F14 | XSS payloads in fields | Fill with `<script>alert(1)</script>`, `<img onerror=alert(1)>`, verify sanitized |
| TC-F15 | SQL injection strings | Fill with `' OR 1=1--`, `'; DROP TABLE users--`, verify no error/unexpected behavior |
| TC-F16 | Extremely long input (10000+ chars) | Fill field with 10000+ character string, verify handled (truncated or error) |
| TC-F17 | Whitespace-only input | Fill required fields with only spaces, verify validation catches it |
| TC-F18 | Copy-paste formatted text | Use `run-code` to paste rich text into fields, verify handled correctly |
| TC-F19 | Multi-step form state persistence | If multi-step: fill step 1, go to step 2, go back, verify step 1 data retained |

```bash
playwright-cli -s=forms-boundary tracing-stop
playwright-cli -s=forms-boundary close
```

### Agent 4: Advanced (`-s=forms-advanced`)

Tests file uploads, autocomplete, autofill, and submission edge cases.

```bash
playwright-cli -s=forms-advanced open "$URL"
playwright-cli -s=forms-advanced tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-F20 | File upload (valid types) | If file input exists: upload a valid file, verify accepted |
| TC-F21 | File upload (invalid types/oversized) | Upload wrong file type or oversized file, verify rejection message |
| TC-F22 | Drag-and-drop file upload | If drop zone exists: test drag-and-drop via `run-code` with DataTransfer API |
| TC-F23 | Autocomplete suggestions | If autocomplete field exists: type partial text, verify suggestions appear |
| TC-F24 | Browser autofill compatibility | Check `autocomplete` attributes on input fields for proper values |
| TC-F25 | Duplicate submission prevention | Click submit button rapidly twice, verify only one submission (button disabled or request deduplicated) |
| TC-F26 | Form submission via Enter key | Focus on input, press Enter, verify form submits |
| TC-F27 | CAPTCHA/honeypot fields present | Check for CAPTCHA elements or hidden honeypot fields (hidden input with tabindex=-1) |

```bash
playwright-cli -s=forms-advanced tracing-stop
playwright-cli -s=forms-advanced close
```

## Report Generation

After all 4 agents complete, merge results into `$OUTDIR/report.md` following the standard report format (see references/report-format.md).

Group results by agent category:
1. Happy Path (TC-F1 through TC-F4)
2. Validation (TC-F5 through TC-F10)
3. Boundary (TC-F11 through TC-F19)
4. Advanced (TC-F20 through TC-F27)

## Cleanup

```bash
playwright-cli -s=forms-discovery close 2>/dev/null
playwright-cli -s=forms-happy close 2>/dev/null
playwright-cli -s=forms-validation close 2>/dev/null
playwright-cli -s=forms-boundary close 2>/dev/null
playwright-cli -s=forms-advanced close 2>/dev/null
```
