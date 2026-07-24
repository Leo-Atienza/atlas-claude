---
name: css-keyframe-animations
description: >-
  Emit-ready pure-CSS @keyframes catalog — the Animista library. 50+ entrance,
  exit, attention, and text micro-animations (slide/scale/rotate/flip/swing/swirl/
  slit/roll/bounce/fade/puff, pulsate/heartbeat/ping/shake/vibrate/wobble/jello,
  shadow-drop/pop/inset, text-focus/tracking/pop). The lowest rung of the motion
  ladder — a copy-paste keyframe here beats importing Motion or GSAP. Use for
  entrance & attention micro-motion: fade-in a card, pulse a badge, un-blur a
  heading. Verbatim keyframe math + Animista's favored cubic-beziers, reduced-
  motion gated.
license: BSD-2-Clause
metadata:
  vendored_from: "github:MADEiN83/react-animista@4946134 + github:Bigetion/animista-css-generator@6243845; keyframe data © animista.net, BSD-2-Clause/FreeBSD — free personal+commercial, no attribution required"
---

# CSS Keyframe Animations (Animista)

Pure-CSS `@keyframes` for entrance, exit, attention, and text micro-motion. Zero
dependencies, zero JS — copy a block, apply a class, ship.

## When to use

Reach here **first** for entrance and attention micro-motion — an element appearing
(fade/slide/scale/flip in), leaving (the `-out` twins), asking for attention (pulse,
shake, heartbeat), or a heading revealing itself (text-focus, tracking, pop). This is
the **CSS-first bottom rung**: a `@keyframes` block costs nothing and beats pulling in
a JS animation library for a one-shot reveal or a looping accent. Escalate only when
the motion genuinely needs it (see routing note).

## How to emit

1. Open **`reference/catalog.md`**, find the family, copy its `@keyframes` block.
2. Apply the ready shorthand on a class: `animation: <name> <duration> <timing> both;`
   (durations are Animista defaults — mostly 0.3–0.7s; tune freely).
3. **Always** ship the reduced-motion gate alongside it:

```css
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
```

This is a non-negotiable accessibility floor — vestibular-sensitive users get no motion.

## Rules

- **One motion personality per element.** One entrance; optionally one attention loop
  *after* it settles. Never two competing transforms at once.
- `-webkit-` prefixes are optional in 2026 (Safari 9-era) — omit them; the catalog is unprefixed.
- Directional families (slide/scale/rotate/flip/swing/roll/…) share one shorthand across
  all 8 directions — only the transform axis/origin changes. The catalog gives the
  canonical direction in full plus a compact variant table.
- `tada` / `foundation` are animate.css, not Animista — not in scope.

**Catalog:** [`reference/catalog.md`](reference/catalog.md) — families, verbatim keyframes, and shorthands.

> In the ATLAS web-dev system: this is the lowest rung of the motion ladder (KNOWLEDGE-010) — reach here for entrance/attention micro-motion before Motion (SK-047) or GSAP (SK-042/044). impeccable auto-reaches it during craft.
