# Knowledge Store — Page 5: Failed Approaches (G-FAIL)

> Approaches that were tried and failed. Each entry explains what was tried, why it failed, and what works instead.

---

## G-FAIL-001: last:mb-0 on Per-Item Wrappers
**Date**: 2026-03-09 | **Tags**: #tailwind #css #pseudo-class

**Tried**: `last:mb-0` on items individually wrapped in AnimateIn/Framer Motion to remove trailing margin.
**Failed because**: Each wrapper is a single-child container, so every item is `:last-child` of its own wrapper — ALL margins zeroed.
**Instead**: Omit `last:mb-0` entirely. Section padding handles trailing space. Never use `first:`/`last:`/`odd:`/`even:` on individually-wrapped list items.

**Related**: G-ERR-005

---

## G-FAIL-002: next/dynamic ssr:false in Server Component
**Date**: 2026-03-09 | **Tags**: #nextjs #ssr #server-components

**Tried**: `next/dynamic` with `{ ssr: false }` directly in a Server Component.
**Failed because**: `ssr: false` uses client-only React APIs that require a client boundary. Error: *"ssr: false is only allowed in Client Components."*
**Instead**: Extract `dynamic()` into a `'use client'` wrapper file (G-PAT-007).

---

## G-FAIL-003: MagicCard Mouse-Tracking on Scroll-Heavy Layouts
**Date**: 2026-03-10 | **Tags**: #framer-motion #performance #magic-ui

**Tried**: MagicCard `getBoundingClientRect()` + Framer Motion per-card mouse-tracking glow effect on card grids.
**Failed because**: N cards × (reflow + motion update + render) per scroll tick. 3+ cards = visible scroll lag.
**Instead**: CSS-only hover effects via `group-hover:`. Safe use: single hero/featured component only.

**Related**: G-SOL-007

---

## G-FAIL-004: ShimmerButton @container Queries (Tailwind v3)
**Date**: 2026-03-09 | **Tags**: #magic-ui #tailwind #container-queries

**Tried**: Copy-pasting Magic UI ShimmerButton into Tailwind v3 project.
**Failed because**: Uses `@container-[size]` classes requiring Tailwind v4 or `@tailwindcss/container-queries` plugin. Silently ignored — no shimmer renders.
**Instead**: CSS `::before` pseudo-element shimmer with `translateX` animation (GPU-composited).

---

## G-FAIL-005: preview_eval Relative URL Navigation
**Date**: 2026-03-11 | **Tags**: #preview-mcp #javascript #url

**Tried**: `window.location.href = '/contact'` in `preview_eval`.
**Failed because**: Preview MCP context doesn't resolve relative URLs. Error: "not a valid URL".
**Instead**: Full absolute URL: `window.location.href = 'http://localhost:3000/contact'`.

---

## G-FAIL-006: Preview Tool IntersectionObserver Doesn't Fire
**Date**: 2026-03-15 | **Tags**: #preview-mcp #framer-motion #headless

**Tried**: Using `whileInView`/`useInView` animations in Claude Preview MCP headless Chromium.
**Failed because**: Headless Chromium doesn't fire IntersectionObserver entries. All elements stay at `opacity: 0`.
**Instead**: Use `preview_snapshot` (accessibility tree) to confirm content exists. Use G-SOL-014 (BlurFade fallback timer) to ensure content visibility regardless.

**Related**: G-ERR-010, G-SOL-014

