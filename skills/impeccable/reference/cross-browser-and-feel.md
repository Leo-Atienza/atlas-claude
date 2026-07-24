# Cross-Browser & Feel Verification

> The verification gate that a single Chromium screenshot and a Lighthouse score are blind to. Runs a build across **three engines** and **proves motion actually played** — not just that the script ran. This is where Apple-grade work either holds up or quietly breaks for half your audience.

A Lighthouse 100 and a beautiful headless-Chrome screenshot tell you nothing about Safari, nothing about Firefox, and nothing about whether your entrance animation *visibly moved* or silently no-op'd. Those are exactly the failures that reach real users. Run this before presenting any animated, scroll-driven, or public-facing build.

## The three engines (and why each one matters)

| Engine | Covers | The failures it catches that Chromium hides |
|--------|--------|---------------------------------------------|
| **Chromium** | Chrome, Edge, Brave, Electron | Baseline — most of your testing already happens here |
| **WebKit** | **Safari (macOS + every iOS browser)** | `position: sticky` inside `overflow` containers, `backdrop-filter`, canvas DPR scaling, `100vh` vs dynamic viewport, smooth-scroll inertia, date/time inputs, `-webkit-` fallbacks. **This is the iPhone audience — non-negotiable.** |
| **Firefox** | Firefox | CSS scroll-driven animations (`animation-timeline` is **flag-only in Firefox** → your `@supports` fallback MUST carry the page), scrollbar width/gutter, subgrid, some `mask`/`clip-path` cases |

WebKit is the one people skip and the one that bites — there is no Safari on Windows, so without this you are *never* seeing what iPhone users see. The Playwright WebKit engine is the real thing.

## The tool

`skills/impeccable/scripts/verify-browsers.mjs` — renders a URL across all three engines at desktop (1280×800) and mobile (390×844), captures a scroll-through **video** per engine, **frame-diffs** the scroll to prove motion, runs a `prefers-reduced-motion: reduce` pass, and collects per-engine console + page errors.

```bash
node skills/impeccable/scripts/verify-browsers.mjs http://localhost:PORT/ ./_xb
```

Output: `summary.json` + screenshots (`<engine>-<viewport>-top.png`, `-bottom.png`, `-reduced-motion.png`) + videos (`video/<engine>/*.webm`). **Exit 0** = every engine rendered, zero console/page errors, and motion was observed. **Exit 1** = an engine failed, errored, or scrolled with zero visual change (dead animation).

### One-time setup (free)

```bash
npm i -g playwright
playwright install chromium firefox webkit
```

**The version-match trap (field-verified):** Playwright's browser *builds* are pinned to the Playwright *JS version*. If the global `playwright` is v1.60 but the cached browsers are from an older version, launch fails with `Executable doesn't exist at …-1223\…`. Fix: always run `playwright install` from the **same** playwright that runs the script (the global one). The script resolves playwright from the global npm root via `createRequire` precisely so the runner and the browsers stay matched.

## Reading the result

- **`desktopScrollDelta`** — mean per-frame pixel change across the scroll-through. This is the *feel* proof. A storytelling/animated page should show a healthy delta (the Mara kettle benchmark scored 91–97 across all three engines — the canvas scrub genuinely animating). **A delta near 0 on a page that was supposed to move means the animation is dead** — the script ran, `will-change` was set, and nothing visibly happened. That is the single hardest failure to catch by eye and the reason this metric exists. (A deliberately static page legitimately scores ~0 — you decide whether the page was supposed to move.)
- **`reducedMotionOk`** — content still renders with `prefers-reduced-motion`. If false, your entrance is gating content visibility on an animation that reduced-motion users never receive — a real accessibility break.
- **`consoleErrors` / `pageErrors`** — per engine. A WebKit-only error here is the classic "works in Chrome, blank on iPhone" bug, caught before the user finds it.
- **The videos** — watch them. The frame-diff proves *something* moved; the video tells you whether it moved *well*. This is the only objective substitute for sitting in front of the running page.

## Per-engine fix patterns (when something breaks)

- **WebKit sticky fails** → an ancestor has `overflow: hidden/auto/scroll`; sticky cannot escape it. Move the scroll context or drop the overflow (cross-ref scroll-storytelling.md's sticky trap).
- **WebKit canvas blurry** → set the canvas backing store to `width * devicePixelRatio` and scale the context; never rely on CSS sizing alone (cross-ref scroll-storytelling.md canvas recipe).
- **Firefox reveal missing** → you leaned on `animation-timeline` without a fallback. Content must be fully visible without it; gate the animation in `@supports (animation-timeline: scroll())`, never the content (cross-ref animation-recipes.md / scroll-storytelling.md).
- **WebKit `100vh` too tall on mobile** → use `100dvh` (dynamic viewport) or `svh`; iOS Safari's `100vh` excludes then includes the toolbar.
- **Mobile tap delay / hover stuck** → `:hover` styles latch on touch; pair every `:hover` with a `@media (hover: hover)` guard.

## When to run it

- **Always:** any public-facing site, any page with scroll-driven motion or a choreographed entrance, anything an iPhone will open.
- **Skip:** throwaway internal tools, a static artifact you'll screenshot once. Don't spend three engines on a page nobody scrolls.

Wire-in: this is **craft.md Step 4b** (after the deterministic audit, before presenting an animated/public build) and a **design-polish** pre-ship item. The audit-rules grep sheet checks the *code*; this checks the *rendered result* in the engines real people use.

---

*Original synthesis from verified browser-support documentation (MDN, caniuse, WebKit/Mozilla release notes) plus this system's own field findings (the Mara kettle benchmark: clean across Chromium/Firefox/WebKit, motion 91–97). Verified 2026-06. The `verify-browsers.mjs` script is original. See ../NOTICE.md.*
