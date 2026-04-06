# Knowledge Store — Page 2: Solutions (G-SOL)

> Solved problems with full context. Each entry includes the problem, solution, and key details.

---

## G-SOL-001: Mobile Nav Drawer Testing
**Date**: 2026-03-08 | **Tags**: #testing #mobile #nav #preview-mcp

Repeatable Preview MCP sequence for mobile nav drawer:
1. `preview_resize({ preset: 'mobile' })` → 375x812
2. `preview_click('button[aria-label="Open menu"]')` → open drawer
3. `preview_screenshot()` → verify opened
4. `preview_snapshot()` → check nav links
5. Close via eval: `document.getElementById('nav-drawer').checked = false` (DaisyUI)
6. `preview_screenshot()` → verify closed

Test in both light and dark themes.

---

## G-SOL-003: preview_inspect for Computed CSS Debugging
**Date**: 2026-03-09 | **Tags**: #debugging #css #tailwind #preview-mcp

When a Tailwind class has no visible effect, use `preview_inspect` with `styles` param:
```js
preview_inspect({ selector: ".my-element", styles: ["margin-bottom", "padding"] })
```
Reveals computed values that screenshots can't show. Diagnosed G-ERR-005 (margin-bottom: 0px on all items due to `last:mb-0` in wrappers).

---

## G-SOL-005: scroll-behavior smooth vs Framer Motion Fix
**Date**: 2026-03-09 | **Tags**: #css #framer-motion #scroll #ux

`scroll-behavior: smooth` in CSS conflicts with Framer Motion `whileInView` on pages with 20+ animated components. Causes scroll jank + double-click navigation. Fix: remove `scroll-behavior: smooth` from CSS. Keep `scroll-padding-top` for anchor offset.

---

## G-SOL-006: Equal Height Grid Cards with h-full
**Date**: 2026-03-09 | **Tags**: #tailwind #css #grid #layout

Add `h-full` to card elements inside CSS Grid so all cards stretch to tallest card's height. Grid makes cells same height by default, but the card inside still sizes to its content unless `h-full` forces it to fill the cell.

---

## G-SOL-007: Framer Motion Mouse-Tracking Scroll Lag Fix
**Date**: 2026-03-10 | **Tags**: #framer-motion #performance #scroll #server-components

MagicCard-style `onMouseMove` + `getBoundingClientRect()` + `useMotionValue` fires expensive ops on every mouse event. With 3+ cards in viewport during scroll = lag. Fix: remove mouse-tracking wrapper, replace with CSS-only `group-hover:` Tailwind. Drop `'use client'` to convert to server component.

**Related**: G-FAIL-003

---

## G-SOL-008: CSS Gradient Heading with background-clip:text
**Date**: 2026-03-09 | **Tags**: #css #animation #gradient #typography #performance

GPU-composited animated gradient headings: `bg-gradient-to-r bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient`. Keyframe animates `background-position` — compositor thread only, no layout/paint. Scroll-lag free.

```js
// tailwind.config.js
animation: { 'gradient': 'gradient 8s linear infinite' },
keyframes: { gradient: { to: { backgroundPosition: '200% center' } } }
```

---

## G-SOL-009: CSS Scroll-Driven Animations
**Date**: 2026-03-10 | **Tags**: #css #scroll #animation #performance

`animation-timeline: scroll()` runs scroll-linked animations off main thread (50%→2% CPU). For viewport-triggered: `animation-timeline: view()` + `animation-range: entry 0% entry 100%`. Chrome 115+, Edge 115+. Use `@supports` for progressive enhancement.

---

## G-SOL-010: CSS @starting-style Entry/Exit
**Date**: 2026-03-10 | **Tags**: #css #animation #entry-exit #starting-style

CSS-only entry/exit animations for `display: none` toggling, replacing JS AnimatePresence:
```css
.dialog { opacity: 1; transition: opacity 0.3s, display 0.3s allow-discrete;
  @starting-style { opacity: 0; } }
.dialog[hidden] { opacity: 0; }
```
Chrome 117+, Firefox 129+, Safari 17.5+. Use for modals, dropdowns, tooltips. AnimatePresence for complex orchestration.

---

## G-SOL-011: @property for Animatable Custom Properties
**Date**: 2026-03-10 | **Tags**: #css #animation #custom-properties #gradient

Register custom properties with `@property` syntax type to enable smooth interpolation:
```css
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
```
Enables animating gradient angles, color stops. Without registration, CSS custom properties are strings that snap. Useful types: `<angle>`, `<color>`, `<number>`, `<percentage>`, `<length>`. Chrome 85+, Safari 15.4+.

---

## G-SOL-012: Next.js 15 Contact Form: useActionState + Resend
**Date**: 2026-03-11 | **Tags**: #nextjs #server-actions #forms #resend #react19

Three-file pattern: (1) Server Action with Resend SDK (`'use server'`), (2) Client form using `useActionState` from `'react'` (not react-dom), (3) env vars for `RESEND_API_KEY` + `CONTACT_EMAIL`. Key: `replyTo: email` so replies go to sender. `onboarding@resend.dev` works on free tier.

---

## G-SOL-013: Scroll-to-Top on Refresh
**Date**: 2026-03-13 | **Tags**: #javascript #scroll #ux

Inline IIFE in `<head>` (runs before paint):
```js
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
```
Prevents browser scroll-restore on refresh. Must run in `<head>`, not in `useEffect` (too late, causes flicker).

---

## G-SOL-014: BlurFade IntersectionObserver Fallback Timer
**Date**: 2026-03-15 | **Tags**: #framer-motion #intersectionobserver #animation

`useEffect` timer checks opacity after `1500 + (delay * 1000)` ms. If still 0, sets `forceVisible` state. Uses TWO separate render paths — `whileInView` for normal, plain `animate` for fallback (see G-ERR-010 for why combined props don't work). Ensures content visibility when IntersectionObserver fails.

**Related**: G-ERR-010, G-FAIL-006

---

## G-SOL-015: fromMap Resilience Pattern (Flutter DB)
**Date**: 2026-03-31 | **Tags**: #flutter #database #sqflite #error-handling

Wrap `Model.fromMap(map)` in try-catch in the loading layer. Skip corrupted rows with `debugPrint` warning instead of crashing the entire load:
```dart
results.map((map) { try { return Income.fromMap(map); } catch (e) { debugPrint('Skip: $e'); return null; } }).whereType<Income>().toList();
```
Keep models strict (throwing) — only the loading layer gains resilience.

---

## G-SOL-016: URL-Persisted Filters in Next.js 15
**Date**: 2026-04-04 | **Tags**: #nextjs #filters #url-state

Custom hook syncing filter state to URL search params. Short param names (`q`, `src`, `smin`), only persist non-default values, `useTransition` for non-blocking URL updates, `router.replace(pathname)` for clear-all. Critical: `useSearchParams()` requires `<Suspense>` wrapper in parent server component.

Result: `/dashboard/JH-1234?q=react&src=greenhouse&smin=80`

---

## G-SOL-017: Animated Component Unmount (No Library)
**Date**: 2026-04-04 | **Tags**: #react #animation #css

Leaving state pattern: `setLeaving(true)` → `setTimeout(onClose, 150)` matching CSS duration. `animation-fill-mode: forwards` prevents flash-back. All close triggers must route through the same handler. Reset `leaving = false` before `onClose` to prevent stale state on reopen.

---

## G-SOL-018: Run Neon Migrations Without psql
**Date**: 2026-04-04 | **Tags**: #neon #postgres #migrations

Use `@neondatabase/serverless` from Node.js when psql isn't installed:
```js
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE t DROP COLUMN IF EXISTS col`;
```
Each call is a separate transaction. For atomicity, use Neon MCP `run_sql_transaction`.
