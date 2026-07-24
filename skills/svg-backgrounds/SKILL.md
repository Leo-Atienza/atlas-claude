---
name: svg-backgrounds
description: "Emit-ready SVG background generators — Haikei-equivalent waves/blobs/blurry-gradients/low-poly/peaks/steps/scatters — plus animated generative-canvas techniques (particles/flow-fields/noise/L-systems). Reach for hero & section backgrounds, dividers, ambient texture."
license: "SVG recipes original (technique-equivalent to app.haikei.app output); generative-canvas MIT (genjutsu)"
metadata:
  vendored_from: "genjutsu canvas-generative © AThevon, MIT @a2b8b09; SVG recipes authored"
---

# SVG Backgrounds

Drop-in backgrounds for hero sections, section dividers, and ambient page texture — without a trip to
a generator tool. Two tiers:

- **Static inline SVG** (default) — 15 Haikei-equivalent families: Blob, Blob Scene, Blob Scatter,
  Wave, Layered/Stacked Waves, Blurry Gradient, Circle/Polygon/Symbol Scatter, Low Poly Grid,
  Layered/Stacked Peaks, Layered/Stacked Steps. Zero JS, zero deps, colored via CSS custom
  properties, one paste.
- **Animated `<canvas>`** (only when it earns it) — particles, noise fields, flow fields, L-systems,
  fractals, generative grids/Voronoi.

## Why this exists

Haikei (app.haikei.app) is the go-to SVG background generator but has **no API** — you can't emit
from it programmatically. These recipes reproduce the same output families as hand-tunable inline
SVG you drop straight into a build.

## Escalation rule — static first

1. **Reach for static SVG.** It covers ~all background needs: waves, gradients, blobs, faceted
   grids, angular dividers. Renders instantly, costs nothing per frame, scales crisply.
2. **Escalate to animated canvas only if motion is the point** *and* the page has a free hero slot.
   Canvas is real per-frame CPU with a teardown burden — worth it for a signature flow field or
   particle field, wasteful for anything a CSS drift or a static SVG already conveys.

## The two hard rules

- **One background effect per section.** Signature-effect restraint — a wave *or* a blob field *or*
  a blurry gradient, never two generative textures competing in one viewport.
- **One animated canvas per page, max.** Everything else stays SVG or CSS.

## How to drop it in

Background sits behind content, absolutely positioned; the parent clips and establishes the
stacking context:

```css
.section { position: relative; overflow: hidden; }
.bg      { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
.fg      { position: relative; z-index: 1; }
```

Colors flow from CSS custom properties (`--bg`, `--accent`, `--accent-2`, `--accent-3`) with
fallbacks baked into every snippet, so a recipe renders before you theme it and re-tunes the moment
you do.

## Accessibility

Any animated variant (canvas, or a CSS-driven SVG drift) **must** honor
`@media (prefers-reduced-motion: reduce)` — cut the motion, keep a static first frame. The canvas
mount helper does this for you.

## Hand-tuning

For bespoke one-off shapes, `app.haikei.app` is still the best manual playground — generate, then
paste the exported SVG and swap its hard-coded fills for `var(--accent …)` to fit the system.

## Reference files

- **`reference/svg-recipes.md`** — all 15 families, each with a complete copy-paste `<svg>`, the
  right `preserveAspectRatio`, and 2–3 tuning knobs. Plus the gated CSS-animation pattern.
- **`reference/generative-canvas.md`** — the animated canvas techniques (distilled from genjutsu,
  MIT): a shared DPR-aware / reduced-motion / self-cleaning mount helper, then particles, noise
  fields, flow fields, L-systems, fractals, and generative grids/Voronoi.

> In the ATLAS web-dev system: a signature-effects sibling (impeccable reference/signature-effects.md) — one signature background per page; re-tune colors to brand, never ship a recognizable preset raw.
