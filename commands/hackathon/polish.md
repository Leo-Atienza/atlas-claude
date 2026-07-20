# /hackathon:polish — Judge-readiness in 2-3 hours

You are handling: **$ARGUMENTS**

**Rule:** a broken-looking demo loses more points than a missing feature. Polish = lived-in feel + graceful failure.

---

## Step 1 — Pre-flight

1. Read `.hackathon/scope.md`. Confirm all MUST-HAVES are shipped (or explicitly mocked via failures-log).
2. Read `.hackathon/event.yaml` → `deploy.live_url`.
3. If the demo moment is not working end-to-end on the live URL → **STOP** this command. Go back to `/hackathon:build` and fix it first.

## Step 2 — Visual QA sweep (Claude Preview MCP)

Use the Claude Preview MCP systematically:

1. `preview_start` the live URL.
2. `preview_screenshot` at default desktop viewport → inspect for: alignment, overflow, broken images, placeholder text, console errors.
3. `preview_resize` to 375x667 (mobile) → screenshot again → check responsive issues.
4. `preview_resize` to 1440x900 (desktop large) → screenshot.
5. Toggle dark mode if supported (`preview_eval` + `document.documentElement.classList.toggle('dark')`) → screenshot.
6. `preview_console_logs` → fix any red errors (warnings can wait).
7. `preview_network` → any 500s or failed fetches? Fix or mock.

Save screenshots to `.hackathon/screenshots/polish-pass-1/{{viewport}}.png`.

## Step 3 — The three states

For every interactive component, verify all three render well:

**Loading state** — skeleton or spinner, never blank. Use shadcn `Skeleton` for lists, inline spinners for buttons.

**Empty state** — never "No data yet." Always a hero message + CTA + seed content. Pull from `src/lib/seed.ts` if real data isn't there.

**Error state** — wrap every async call in a try/catch. Show a friendly message with a retry button. For mock LLM failures, cached fallback responses.

## Step 4 — Error boundaries + Sentry

Add a top-level error boundary:
- Next.js: `app/error.tsx` + `app/global-error.tsx` with a branded fallback UI
- Expo: `<ErrorBoundary>` from `expo-router` around the root stack

Wire **Sentry MCP** for runtime error capture:
1. `find_organizations` → pick one.
2. `create_project` if no project exists for this hackathon.
3. `create_dsn` → grab the DSN.
4. Install: `npm i @sentry/nextjs` (or `@sentry/react-native`).
5. Add DSN to env → run the init wizard.

If Sentry takes > 15 min, skip it — a graceful UI fallback is more important.

## Step 5 — Performance audit (Lighthouse MCP)

Run **Lighthouse MCP** `get_performance_score` on the live URL. Thresholds:
- Performance ≥ 70 (mobile score)
- Accessibility ≥ 90
- Best Practices ≥ 90

Fixes ranked by impact:
- LCP > 4s → add `next/image` with `priority` for hero, compress seed images
- CLS > 0.1 → set explicit `width`/`height` on all images, reserve layout for async content
- Missing alt text → iconify icons with `aria-label`, images with `alt`
- Contrast fails → swap color pair

Don't aim for 100s — aim for "nothing red on the report."

## Step 6 — Demo-moment-specific polish

Walk through the 10-second demo moment ONE more time:
- Is the primary action *visually obvious*? (big button, clear CTA)
- Is the outcome *visually rewarding*? (animation, color change, sound)
- Does it work on cold load? (refresh tab, run it) — demos fail from session/cache assumptions

If the demo moment uses an LLM: **cache one canonical response** so if the API is down at demo time, you can flip a `MOCK_MODE=true` env var and still ship.

## Step 7 — Polish log

Append to `.hackathon/polish-log.md`:
```
{{timestamp}} — Polish pass {{N}}
Fixes: {{count}}
Lighthouse (perf/a11y/bp): {{scores}}
Remaining visible issues: {{list}}
Demo moment cold-load tested: {{yes/no}}
```

## Step 8 — Summary + next

```
✅ Polish complete

Live URL:         {{url}}
Lighthouse perf:  {{score}} (target ≥70)
Accessibility:    {{score}} (target ≥90)
Error tracking:   {{sentry/none}}
Three-states:     {{loading+empty+error coverage}}
Screenshots:      .hackathon/screenshots/

Next: /hackathon:demo — record video + finalize README
```

---

**Plain English triggers**: "polish the app", "make it look good", "pre-demo polish",
"fix the rough edges", "error states"
