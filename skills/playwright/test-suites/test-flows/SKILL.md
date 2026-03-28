---
name: test-flows
description: Test user flows, authentication, navigation, and SPA behavior. Use when user wants to test login flows, registration, browser history, pagination, search, CRUD operations, or routing.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# User Flows, Navigation & SPA Behavior

Run 30 test cases across 4 parallel agents covering authentication, registration, SPA navigation, and data flows.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-flows/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces" "$OUTDIR/videos"
```

## Credentials

Credentials must come from arguments or environment variables:
```bash
# From $ARGUMENTS: /test-flows https://app.com user@example.com password123
TEST_URL=$(echo "$ARGUMENTS" | awk '{print $1}')
TEST_USER_ARG=$(echo "$ARGUMENTS" | awk '{print $2}')
TEST_PASS_ARG=$(echo "$ARGUMENTS" | awk '{print $3}')

URL="${TEST_URL:-http://localhost:3000}"
USER="${TEST_USER_ARG:-$TEST_USER}"
PASS="${TEST_PASS_ARG:-$TEST_PASS}"
```

If no credentials provided, auth-related tests should be **skipped** (not failed) with a note in the report.

## Parallel Execution — 4 Subagents

### Agent 1: Auth (`-s=flows-auth`, `--persistent`)

Tests authentication flows. Uses persistent profile to maintain session state.

```bash
playwright-cli -s=flows-auth open "$URL" --persistent
playwright-cli -s=flows-auth tracing-start
playwright-cli -s=flows-auth video-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-FL1 | Login→dashboard→settings→logout full chain | Fill login form, submit, navigate to dashboard, then settings, then logout. Verify each page loads correctly |
| TC-FL2 | Session persistence (navigate away/back) | After login, navigate to external URL, come back, verify still logged in |
| TC-FL3 | "Remember me" functionality | If checkbox exists: login with "remember me", close browser, reopen, verify still logged in |
| TC-FL4 | Social login buttons present/functional | Check for OAuth buttons (Google, GitHub, Facebook), verify they link to valid OAuth endpoints |
| TC-FL5 | 2FA/MFA flow (if present) | If 2FA UI exists: verify the flow is navigable (OTP input, verification page) |
| TC-FL6 | Account lockout after failed attempts | Attempt 5+ failed logins with wrong password, check for lockout or rate-limit message |

```bash
playwright-cli -s=flows-auth video-stop "$OUTDIR/videos/auth-flow.webm"
playwright-cli -s=flows-auth state-save "$OUTDIR/auth-state.json"
playwright-cli -s=flows-auth tracing-stop
playwright-cli -s=flows-auth close
```

### Agent 2: Register (`-s=flows-register`)

Tests registration and account management flows.

```bash
playwright-cli -s=flows-register open "$URL"
playwright-cli -s=flows-register tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-FL7 | Registration end-to-end | Navigate to registration page, fill all fields, submit, verify success |
| TC-FL8 | Password reset flow | Navigate to "forgot password", enter email, verify confirmation page/message |
| TC-FL9 | Email verification flow | If email verification exists: check for verification prompt after registration |
| TC-FL10 | Profile edit + save | If profile page exists: edit a field, save, reload, verify change persisted |
| TC-FL11 | Account deletion flow | If account deletion exists: navigate to it, verify confirmation dialog |
| TC-FL12 | Password strength indicator | On registration/password change: type passwords of varying strength, verify indicator updates |

```bash
playwright-cli -s=flows-register tracing-stop
playwright-cli -s=flows-register close
```

### Agent 3: Navigation (`-s=flows-navigation`)

Tests SPA navigation and browser behavior.

```bash
playwright-cli -s=flows-navigation open "$URL"
playwright-cli -s=flows-navigation tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-FL13 | Browser back button works in SPA | Navigate 2-3 pages, `go-back`, verify previous page content loads correctly |
| TC-FL14 | Browser forward button works | `go-back` then `go-forward`, verify correct page loads |
| TC-FL15 | Deep linking — direct URL to nested page | Open a deep URL directly (e.g., `$URL/settings/profile`), verify it loads correctly |
| TC-FL16 | 404 page for invalid routes | Navigate to `$URL/nonexistent-page-xyz`, verify 404 page with navigation |
| TC-FL17 | Breadcrumb navigation accuracy | If breadcrumbs exist: click each breadcrumb link, verify correct page |
| TC-FL18 | Scroll position restored on back | Scroll down on page, navigate away, `go-back`, check scroll position restored |
| TC-FL19 | Anchor links scroll to correct position | Find `#` links, click them, verify page scrolls to target element |
| TC-FL20 | Hash changes update URL | Click anchor link, verify URL hash updates in browser |
| TC-FL21 | Refresh preserves state | Fill form or apply filter, `reload`, verify state preserved |
| TC-FL22 | Protected routes redirect to login | If auth exists: navigate to protected route without login, verify redirect to login page |

```bash
playwright-cli -s=flows-navigation tracing-stop
playwright-cli -s=flows-navigation close
```

### Agent 4: Data (`-s=flows-data`)

Tests data flows — pagination, search, CRUD operations.

```bash
playwright-cli -s=flows-data open "$URL"
playwright-cli -s=flows-data tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-FL23 | Pagination — all pages load, no duplicates | If pagination exists: navigate pages, collect items, verify no duplicates across pages |
| TC-FL24 | Infinite scroll — items append, no gaps | If infinite scroll exists: scroll down, verify new items append without gaps or duplicates |
| TC-FL25 | Search — results display, empty state shown | If search exists: search for known term (verify results), search for gibberish (verify empty state) |
| TC-FL26 | Search — debounce works | If search exists: type rapidly, check network requests aren't fired per keystroke (use `network`) |
| TC-FL27 | Sort/filter — changes reflected | If sort/filter exists: apply sort, verify order changes. Apply filter, verify items filtered |
| TC-FL28 | CRUD — create/read/update/delete cycle | If CRUD exists: create item, verify appears. Edit item, verify updated. Delete item, verify removed |
| TC-FL29 | Optimistic update — UI updates before server | If CRUD exists: `run-code` to intercept mutation request (add delay), verify UI updates immediately |
| TC-FL30 | Stale data — refresh shows updated data | Load page, `run-code` to modify data via API, reload, verify updated data shown |

```bash
playwright-cli -s=flows-data tracing-stop
playwright-cli -s=flows-data close
```

## Report Generation

After all 4 agents complete, merge results into `$OUTDIR/report.md`.

Note skipped tests prominently (especially auth tests when no credentials provided).

Group results:
1. Authentication (TC-FL1 through TC-FL6)
2. Registration (TC-FL7 through TC-FL12)
3. Navigation (TC-FL13 through TC-FL22)
4. Data Flows (TC-FL23 through TC-FL30)

## Cleanup

```bash
playwright-cli -s=flows-auth close 2>/dev/null
playwright-cli -s=flows-register close 2>/dev/null
playwright-cli -s=flows-navigation close 2>/dev/null
playwright-cli -s=flows-data close 2>/dev/null
```
