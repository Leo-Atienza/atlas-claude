# Animation Recipes

> Companion to [motion-design](motion-design.md) — that file owns WHETHER something animates (the frequency gate), the duration/easing tables, and the per-component settings. This file is the cookbook: copy-pasteable recipes for entrances and interactions that feel amazing. Scroll-driven storytelling is a different register entirely — see [scroll-storytelling](scroll-storytelling.md); nothing here applies to pinned scenes.

Run motion-design's "Should this animate at all?" gate before reaching for any recipe below. A recipe you didn't need is slop with good easing.

## Page-Load Choreography

The first 800ms decide whether the page feels designed or assembled. ONE orchestrated entrance per page — hero first, content follows. Product register gets none: users are mid-task and won't wait for a show.

**The GSAP timeline recipe.** One timeline, position-offset so elements overlap instead of queueing:

```js
const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 0.8 } });
tl.from(".hero-title", { yPercent: 30, opacity: 0 })
  .from(".hero-sub",   { y: 24, opacity: 0 }, "-=0.55")
  .from(".hero-cta",   { y: 16, opacity: 0 }, "-=0.5")
  .from(".hero-media", { y: 32, opacity: 0 }, "-=0.45");
```

Stagger windows: **0.05–0.12s between siblings.** Below 0.05s the group reads as one blob; above 0.12s it reads as a queue. The last element lands inside the 800ms budget — motion-design's entrance ceiling is not negotiable because the timeline is pretty.

**SplitText line-mask reveal** — the highest-craft text entrance. Lines, NOT per-letter: letter-by-letter is a gimmick unless the brief explicitly demands it.

```js
document.fonts.ready.then(() => {
  const split = SplitText.create(".hero-title", { type: "lines", mask: "lines" });
  gsap.from(split.lines, { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.08 });
});
```

**Font-loading coordination is not optional.** SplitText measures line breaks at split time — splitting before the web font arrives means wrong breaks AND a visible FOUT re-jank mid-animation. Gate every text entrance on `document.fonts.ready`; for non-split reveals, hold the hero invisible via a class and lift it inside the promise.

**CSS-only fallback** for simple pages — `@starting-style` gives mount animation with zero JS (Chrome 117+, Safari 17.5+, Firefox 129+; older browsers skip the entrance and show full content, which is the correct fallback):

```css
.hero-title {
  transition: opacity 0.6s var(--ease-out-quart), translate 0.6s var(--ease-out-quart);
  @starting-style { opacity: 0; translate: 0 24px; }
}
```

Stagger siblings with `transition-delay: calc(var(--i) * 80ms)` — the same custom-property trick as motion-design's stagger section.

**`@starting-style` cannot gate on `fonts.ready`:** it only applies at first render/insertion, so a later-added class never triggers it. For fonts-coordinated entrances use class-gated transitions (the hold-invisible-via-a-class pattern above); reserve `@starting-style` for elements mounted later — dialogs, confirmations, list insertions. (Audit note: audit-rules.md harvest rules AR-15/16 print candidates by design — "zero hits" applies to violation rules.)

**The font payload IS the entrance budget.** Gating on `fonts.ready` means every unused font byte delays your choreography. Request only what the page uses: drop unused italic axes (an italic axis nobody set doubles a variable font), prefer static weights when only 2–3 are used over a full variable range, and subset single-glyph display families with `&text=` (a one-ampersand family is ~1KB subsetted, ~80KB whole). Field-verified: trimming exactly this took a page from FCP 3.2s / perf 86 to FCP 1.7s / perf 93 with zero visual change. Preconnect both `fonts.googleapis.com` and `fonts.gstatic.com` (crossorigin).

`prefers-reduced-motion`: the whole choreography collapses to a 200ms crossfade. Wire it once at the timeline level (`gsap.matchMedia()`), not per tween.

## Micro-Interaction Pattern Library

Restraint first (adapted from pbakaus's delight directives): delight enhances usability — it never obscures it. ONE delight moment per view. Anything that delays the user gets cut, no matter how good it looks.

**Button press** — scale down on press, spring back on release:

```css
.btn { transition: scale 160ms var(--ease-out-quart); }
.btn:active { scale: 0.97; }
```

0.95–0.98 is the range; below 0.95 is cartoon. The release transition IS the spring return — never a keyframe.

**Card hover lift** — translate plus shadow, 150–250ms ease-out:

```css
.card { transition: translate 200ms var(--ease-out-quart), box-shadow 200ms var(--ease-out-quart); }
.card:hover { translate: 0 -3px; box-shadow: 0 8px 24px color-mix(in oklch, var(--ink) 12%, transparent); }
```

NEVER scale a whole card past 1.03 — large surfaces magnify motion, and a zooming card reads as a toy.

**Link underline draw** — the transform-origin swap makes the line draw in and exit in the same direction:

```css
.link { position: relative; }
.link::after {
  content: ""; position: absolute; inset: auto 0 -2px; height: 1px;
  background: currentColor; transform: scaleX(0); transform-origin: right;
  transition: transform 250ms var(--ease-out-quart);
}
.link:hover::after { transform: scaleX(1); transform-origin: left; }
```

**Input focus ring expansion** — grow the ring out of the border, don't pop it on:

```css
.input { transition: box-shadow 150ms ease-out, border-color 150ms ease-out; }
.input:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in oklch, var(--accent) 18%, transparent);
}
```

**Icon-button feedback:** the button press recipe, plus at most ONE semantic transform — a refresh icon may rotate, a chevron may flip. Decorative wiggles fail the delight rule.

**Toggle/switch:** the thumb travels with spring feel (next section); the track color crossfades in ~150ms. The state must stay legible at a glance with animation off entirely.

## Springs vs Duration-Easing

Two timing models. Choosing wrong is why interactions feel dead or entrances feel nervous.

| Model | Use for | Why |
|-------|---------|-----|
| **Spring** | Interaction-driven, interruptible motion: drag, toggles, reorder, swipe-dismiss, hover-follow | Springs preserve velocity when interrupted — they re-aim mid-flight instead of restarting from zero |
| **Duration + ease** | Entrances, exits, state changes | Choreography wants predictable, composable timing |

**In React, springs = Motion** — the motion-animation skill (SK-047), imports from `motion/react`:

```jsx
<motion.div layout transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />
```

Prefer `duration` + `bounce` over raw stiffness/damping configs. Keep bounce subtle (≤0.3) and reserve it for drag-release and genuinely playful moments.

**Vanilla spring feel via CSS `linear()`** (all modern browsers) — encode the spring curve as easing points:

```css
:root { --spring-out: linear(0, 0.37 5.6%, 0.64 10.4%, 0.88 15.5%, 1.03 21.2%, 1.07 27%, 1.04 35.4%, 1.01 45.2%, 1); }
.switch-thumb { transition: translate 400ms var(--spring-out); }
```

Generate the points with a spring-to-`linear()` tool rather than hand-tuning.

Bounce/elastic easing on entrances stays banned (SKILL.md motion DON'Ts). A spring on a user-driven toggle is physics; an elastic hero entrance is 2015.

## View Transitions Recipes

The browser-native crossfade-and-morph engine. Use it where a DOM swap would otherwise hard-cut.

**Same-document** — theme switches, tab panels, list reorders:

```js
function update(render) {
  if (!document.startViewTransition) return render();  // progressive enhancement
  document.startViewTransition(render);
}
```

Shared-element morphs: name the moving element and the browser animates position/size between old and new snapshots:

```css
.active-tab-indicator { view-transition-name: tab-indicator; }
::view-transition-group(tab-indicator) { animation-duration: 250ms; }
```

Names must be unique per page at snapshot time — for lists, assign `view-transition-name: item-${id}` inline per element.

**Cross-document (MPA)** — page-to-page morphs with zero JS, opted into from CSS:

```css
@view-transition { navigation: auto; }
```

Support, stated honestly: same-document works in all majors (Chrome 111+, Safari 18+, Firefox 144+). Cross-document is Chrome 126+ / Safari 18.2+ — **Firefox is same-document only.** Both degrade to a normal swap or navigation; never build a flow that REQUIRES the morph to make sense (same rule as scroll-storytelling § View Transitions).

**Next.js App Router:** call the native API from a small client component wrapping the state change or `router.push`. React's `<ViewTransition>` component is still experimental as of June 2026 — do not ship it.

## The 60fps Smoothness Checklist

"Smoothly" is a guarantee, not an adjective. Every animated surface passes ALL of these before it ships:

- [ ] **Compositor-only properties** — transform and opacity (motion-design's two-property rule). The box-shadow/border-color recipes above are bounded to small paint areas; keep them that way.
- [ ] **No layout reads inside animation loops.** `getBoundingClientRect`/`offsetHeight` inside a rAF tick forces synchronous layout. Batch all reads before all writes, once per tick.
- [ ] **`will-change` just-in-time** — added on `:hover`/`.animating`/timeline start, removed when done. Never page-wide.
- [ ] **SVG animates via transform, not path attributes.** Animating `d`/`cx`/`points` re-tessellates every frame; wrap the shape in a `<g>` and transform that. (Deliberate path morphing belongs to gsap-advanced's MorphSVG.)
- [ ] **Tested at 4x CPU throttle.** DevTools → Performance → 4x slowdown. If it stutters there, it stutters on a mid-range Android.
- [ ] **One driver per element** — SALA: a property is owned by GSAP OR Motion OR a CSS transition, never two (gsap-advanced § orchestration).
- [ ] **Interruptible by construction.** Hover-out mid-hover-in must re-aim, not snap or restart — transitions and springs, never restarting keyframes (motion-design's toast note is this rule in component form).
- [ ] **`prefers-reduced-motion` path exists** and was tested by actually toggling the OS setting.

---

**Attribution:** delight/restraint rules adapted from pbakaus/impeccable @ `1863a44` (Apache-2.0). Spring, press-feedback, and interruption principles paraphrased from Emil Kowalski's design-engineering material — ideas and numeric facts only, zero verbatim text (source has no license). All other content is original synthesis. Full ledger: [../NOTICE.md](../NOTICE.md).
