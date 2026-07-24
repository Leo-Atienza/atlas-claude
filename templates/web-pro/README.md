# web-pro templates — ATLAS v9 Wave 5 (C1–C10)

The CI-enforcement + regression + ops layer that turns the elite web-dev *craft*
layer into *agency-grade delivery*. Everything here is a route the web-dev brain
points to ([[capability-map]] rows + build-workflow gates) — **proportional**: a
bugfix/component skips these; a site/page build routes to them.

All pins verified **2026-07-12** (v9 Wave 0). Every tool free — caps stated.

| File | Item | What / free-tier |
|---|---|---|
| `web-quality.yml` | C1 | GitHub Actions: lint→tsc→**contrast gate**→test→build→Playwright(+axe+VR)→size-limit→lhci. Public repos unlimited; private 2,000 Linux-min/mo. The contrast step runs the project-vendored `scripts/check-contrast.mjs` (copied in by `/new-web`; source of truth in impeccable) against `contrast-pairs.json` — skips cleanly when absent. |
| `lighthouserc.js` | C2 | `@lhci/cli` assertions: perf ≥0.9 mobile, others ≥0.95, LCP ≤2500ms, CLS ≤0.1. temporary-public-storage = free. |
| `.size-limit.json` | C10 | 200 KB gzipped First Load JS budget (2026 norm). Pair `@next/bundle-analyzer` for diagnosis. |
| `playwright.config.ts` | C3 | Visual regression (`toHaveScreenshot`, animations off, per-breakpoint + dark). **Baselines generated in CI/Linux only** — never local Windows. |
| `a11y.spec.ts` | C4 | `@axe-core/playwright`, WCAG 2.2 AA tags. The 2.2-only criteria (focus-not-obscured, target ≥24px, dragging, accessible auth) stay in web-preflight's manual tail. |
| `copy.spec.ts` | C4b (v10.1.4) | Rendered-copy sweep over `document.body.innerText` (never source): zero em dashes (allowlist for deliberate ones) + no placeholder copy. Deterministic subset only — fact-drift/tell-hunter (impeccable `copy-verification.md`) stays in-session; agents can't run in CI. |
| `next.config.security.ts` | C6 | HSTS/nosniff/Referrer-Policy/Permissions-Policy + CSP guidance (nonce via `proxy.ts` for dynamic; hash/SRI for static). |
| `seo-pack.ts` | C5 | App-Router `manifest.ts` + JSON-LD (schema-dts, XSS-escaped) + `opengraph-image.tsx` (next/og). NOT next-sitemap. |

## C7 — post-ship ops routes (the system currently ships blind)
Recipes, no new machinery — add to `resources.md` + the build-workflow **Measure** stage:
- **Error tracking:** Sentry Developer tier — **5k errors/mo, 1 user, 30-day retention, hard-stops at cap** (verified 2026-07-12). GlitchTip = self-host escape hatch (Sentry-SDK-compatible).
- **Field CWV** (closes the recorded THE-gap): `@vercel/speed-insights` — the user is Vercel **Pro** so Hobby caps don't bind. `[the user: enable per-project in the Vercel dashboard + re-auth the vercel MCP — the one step only you can do.]`
- **Uptime:** Uptime Kuma (self-host, unlimited) or UptimeRobot free (50 monitors @5min; ToS = non-commercial only).
- **Analytics:** Vercel Web Analytics (Pro) or Plausible/Umami self-host. The existing "analytics ⇒ privacy-policy page" rule covers compliance.

## C9 — taste-feedback loop (crown seam, wired in the sous-chef)
cook-log's "post-delivery edits" field IS an A1 correction signal. Over months, "beautiful
by default without the user editing after" becomes measurable (scorecard: post-delivery edit
rate ↓) and self-improving (his palate → injected design instincts via A3). The parts exist
after Wave 3; cook-log entries feed behavior-mine.

## C8 — `create-atlas-web` (the biggest single lever)
A GitHub template repo pre-wired with EVERYTHING above + Next 16 + Tailwind v4 +
starter-tokens.css + designed 404/error/loading + robots/sitemap/manifest/JSON-LD/OG +
Vitest + Playwright(+axe+VR) + lighthouserc + size-limit + flat ESLint + security headers +
optional Sentry + a ~60-line project CLAUDE.md (definition-of-done). Day-one output starts
ABOVE the bar. `[the user — conservative default this run: build it in a LOCAL dir, run every gate
locally, STOP before `gh repo create` — repo creation + naming waits for you.]` The full
scaffold + acceptance run (preflight --strict 0 + LH ≥90/95 + CI green) is a live-environment
step best done with you awake; these template files are its building blocks.

## Stack refresh (verified 2026-07-12, folded into web-dev/stack.md)
ESLint **10.7.0** (flat-config only). Playwright **1.61.1** (+ Test Agents planner/generator/
healer — the *healer* is a VR-baseline-maintenance candidate). Vitest **4.1.10** (Browser Mode
+ `toMatchScreenshot` — a component-VRT alternative to the Playwright VR harness). Next head
**16.2.10**, security floor **16.2.6**.
