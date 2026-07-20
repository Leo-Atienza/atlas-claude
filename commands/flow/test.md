---
name: flow:test
description: "E2E testing by project type"
argument-hint: "[PR|route|page] [--browser|--xcode|--both]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
End-to-end testing for web and mobile projects.

Replaces: compound:test-browser, compound:test-xcode

Auto-detects project type and runs appropriate tests.
- `--browser`: Force browser testing (Playwright/agent-browser)
- `--xcode`: Force Xcode simulator testing
- `--both`: Run both
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Detect Project Type

1. Check for package.json (web/Node.js)
2. Check for Podfile/xcodeproj (iOS)
3. Check for build.gradle (Android)
4. Determine test runner: playwright, jest, vitest, xcode, etc.

## Step 2: Identify Affected Pages/Routes

1. If PR/branch specified: get changed files
2. Map changed files to affected routes/pages
3. If specific route/page specified: test that directly

## Step 3: Run Tests

### Browser Testing
Use agent-browser CLI or Playwright:
1. Start dev server if needed
2. Navigate to affected pages
3. Verify rendering, interactions, forms
4. Capture screenshots for comparison
5. Check console for errors

### Xcode Testing
1. Build for simulator
2. Run UI tests
3. Capture results

## Step 4: Report

```
Test Results:
  Pages tested: {count}
  Pass: {count} | Fail: {count}

  {detailed results per page}
  {screenshots if captured}
```

</process>
