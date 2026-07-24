# Animista Keyframe Catalog

Emit-ready pure-CSS `@keyframes` — the Animista (animista.net) library. Copy a block, apply the
shorthand as a class, ship. No JS, no dependencies.

## How to use

```html
<div class="slide-in-top">…</div>
```
```css
/* 1. paste the @keyframes block  2. apply the shorthand on a class */
.slide-in-top { animation: slide-in-top 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }

/* 3. ALWAYS gate motion — non-negotiable accessibility floor */
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
```

- **`both`** keeps the element at the keyframe end-state (fill-mode) — entrances/exits need it.
- **`-webkit-` prefixes are optional in 2026** (Safari 9-era only); omit them. All blocks below are unprefixed.
- **Provenance:** every `@keyframes` block and its `timing-function` is verbatim from source. **Durations** are Animista's published defaults — most entrances sit at **0.3–0.7s**; `fade`, `bounce`, and `text-focus` run ~1–1.5s by design; loops carry their own feel. Duration is the one knob you freely tune.
- **Don't stack more than one motion personality per element.** One entrance, optionally one attention loop after it settles — never two competing transforms.
- **Excluded:** `tada` and `foundation` are animate.css, *not* Animista — deliberately absent.
- The two cubic-beziers Animista leans on: `cubic-bezier(0.250, 0.460, 0.450, 0.940)` (calm ease-out) and `cubic-bezier(0.680, -0.550, 0.265, 1.550)` (overshoot/back).

---

# Entrances

## slide — basic directional slide (element moves from rest toward a direction)

```css
/* .slide-top  →  animation: slide-top 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes slide-top {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-100px); }
}
```
All 8 directions share `0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both`; only the end transform changes:

| variant | 100% transform |
|---|---|
| `slide-top` | `translateY(-100px)` |
| `slide-bottom` | `translateY(100px)` |
| `slide-left` | `translateX(-100px)` |
| `slide-right` | `translateX(100px)` |
| `slide-tr` / `slide-tl` | `translateY(-100px) translateX(±100px)` |
| `slide-br` / `slide-bl` | `translateY(100px) translateX(±100px)` |

Depth siblings: **`slide-fwd-center`** `translateZ(0)→translateZ(160px)` (`0.45s cubic-bezier(0.250,0.460,0.450,0.940)`), **`slide-bck-center`** `translateZ(0)→translateZ(-400px)` (`0.45s cubic-bezier(0.470,0.000,0.745,0.715)`). **`slide-rotate-hor-top`** pairs slide+flip: `translateY(0) rotateX(0)→translateY(-150px) rotateX(-90deg)` (`0.5s cubic-bezier(0.250,0.460,0.450,0.940)`).

## slide-in — enter from off-screen (with fade)

```css
/* .slide-in-top  →  animation: slide-in-top 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes slide-in-top {
  0%   { transform: translateY(-1000px); opacity: 0; }
  100% { transform: translateY(0);       opacity: 1; }
}
```
8 directions, same shorthand; start transform flips sign per direction (`top` −1000Y, `bottom` +1000Y, `left` −1000X, `right` +1000X, corners combine ±1000 on both axes), all landing at `translate…(0); opacity: 1`. Sub-families (swap the enter feel): `slide-in-bck-*` / `slide-in-fwd-*` add `translateZ`; `slide-in-blurred-*` add `filter: blur(…)` easing off to `blur(0)`; `slide-in-elliptic-*` arc in via `scale` + `border-radius`.

## scale-up — grow into place (Animista's basic "scale in")

```css
/* .scale-up-center  →  animation: scale-up-center 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; */
@keyframes scale-up-center {
  0%   { transform: scale(0.5); }
  100% { transform: scale(1); }
}
```
Directional variants add a `transform-origin` (kept identical at 0% and 100%) so growth anchors to an edge/corner:

| variant | transform-origin |
|---|---|
| `scale-up-top` | `50% 0` |
| `scale-up-tr` / `scale-up-tl` | `100% 0` / `0 0` |
| `scale-up-right` / `scale-up-left` | `100% 50%` / `0 50%` |
| `scale-up-bottom` | `50% 100%` |
| `scale-up-br` / `scale-up-bl` | `100% 100%` / `0 100%` |

One-axis siblings: `scale-up-hor-center` `scaleX(0.4)→scaleX(1)`, `scale-up-ver-center` `scaleY(0.4)→scaleY(1)`.

## scale-in — scale from zero (with opacity held)

```css
/* .scale-in-center  →  animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes scale-in-center {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```
Same 8 origins + `hor`/`ver` one-axis variants as `scale-up`.

## rotate — spin in place

```css
/* .rotate-center  →  animation: rotate-center 0.6s ease-in-out both; */
@keyframes rotate-center {
  0%   { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}
```
- **Anchored** (`rotate-top/right/bottom/left/tr/tl/br/bl`): `0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955)`, identical `rotate(0)→rotate(360deg)` plus a `transform-origin` (`top`, `right`, `100% 100%`, …).
- **`rotate-90-cw`** `rotate(0)→rotate(90deg)`; **`rotate-90-ccw`** `→rotate(-90deg)` (`0.4s cubic-bezier(0.250,0.460,0.450,0.940)`); anchored 90° variants add origins.
- **`rotate-diagonal-1`** 3-step 3D tumble (`0.4s linear`): `rotate3d(1,1,0,0) → rotate3d(1,1,0,-180deg) → rotate3d(1,1,0,-360deg)`. `rotate-diagonal-2` uses axis `(-1,1,0)`.

## rotate-scale — spin while pulsing size

```css
/* .rotate-scale-up  →  animation: rotate-scale-up 0.65s linear both; */
@keyframes rotate-scale-up {
  0%   { transform: scale(1) rotateZ(0); }
  50%  { transform: scale(2) rotateZ(180deg); }
  100% { transform: scale(1) rotateZ(360deg); }
}
```
Variants swap the rotation axis: `rotate-scale-up-hor` → `rotateX`, `rotate-scale-up-ver` → `rotateY`, `rotate-scale-up-diag-1/2` → `rotate3d(1,1,0,…)` / `(-1,1,0,…)`. `rotate-scale-down` mirrors the mid scale to `0.5`.

## flip — 180° card flip

```css
/* .flip-horizontal-bottom  →  animation: flip-horizontal-bottom 0.4s cubic-bezier(0.455, 0.030, 0.515, 0.955) both; */
@keyframes flip-horizontal-bottom {
  0%   { transform: rotateX(0); }
  100% { transform: rotateX(-180deg); }
}
```
Same shorthand across the family; axis + sign set the pivot:

| variant | 100% transform |
|---|---|
| `flip-horizontal-bottom` / `-top` | `rotateX(-180deg)` / `rotateX(180deg)` |
| `flip-vertical-right` / `-left` | `rotateY(180deg)` / `rotateY(-180deg)` |
| `flip-horizontal-fwd` / `-bck` | adds `translateZ(0→160px)` / `(0→-260px)` |
| `flip-diagonal-1-tr` | `rotate3d(1,1,0,0) → rotate3d(1,1,0,180deg)` |

**flip-2** (`0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955)`) is a "peel" — it slides while flipping and shifts `transform-origin`:
```css
@keyframes flip-2-hor-top-fwd {
  0%   { transform: translateY(0) translateZ(0) rotateX(0);                transform-origin: 50% 0; }
  100% { transform: translateY(-100%) translateZ(160px) rotateX(-180deg); transform-origin: 50% 100%; }
}
```

## flip-scale — flip with a mid-air zoom

```css
/* .flip-scale-up-hor  →  animation: flip-scale-up-hor 0.5s linear both; */
@keyframes flip-scale-up-hor {
  0%   { transform: scale(1) rotateX(0); }
  50%  { transform: scale(2.5) rotateX(-90deg); }
  100% { transform: scale(1) rotateX(-180deg); }
}
```
`-ver` swaps to `rotateY`; `-diag-1/2` use `rotate3d`. **flip-scale-2** adds a travel + origin walk:
```css
@keyframes flip-scale-2-hor-top {
  0%   { transform: translateY(0)    rotateX(0)      scale(1); transform-origin: 50% 0; }
  50%  { transform: translateY(-50%) rotateX(-90deg) scale(2); transform-origin: 50% 50%; }
  100% { transform: translateY(-100%) rotateX(-180deg) scale(1); transform-origin: 50% 100%; }
}
```

## swing — hinge on an edge

```css
/* .swing-top-fwd  →  animation: swing-top-fwd 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes swing-top-fwd {
  0%   { transform: rotateX(0);      transform-origin: top; }
  100% { transform: rotateX(180deg); transform-origin: top; }
}
```
`-fwd` swings +180°, `-bck` swings −180°. Axis + origin per hinge: `top/bottom` → `rotateX`, origin `top`/`bottom`; `left/right` → `rotateY`, origin `left bottom`/`right bottom`; corners → `rotate3d(±1,1,0,180deg)` with origin `100% 100%`, etc.

## swirl-in — rotate + scale from nothing

```css
/* .swirl-in-fwd  →  animation: swirl-in-fwd 0.6s ease-out both; */
@keyframes swirl-in-fwd {
  0%   { transform: rotate(-540deg) scale(0); opacity: 0; }
  100% { transform: rotate(0) scale(1);       opacity: 1; }
}
```
Directional variants (`swirl-in-bl-fwd`, `swirl-in-bottom-bck`, …) add a `transform-origin`; `-bck` variants reverse the spin direction.

## slit-in — 3D shutter opening toward you

```css
/* .slit-in-vertical  →  animation: slit-in-vertical 0.45s ease-out both; */
@keyframes slit-in-vertical {
  0%   { transform: translateZ(-800px) rotateY(90deg); opacity: 0; }
  54%  { transform: translateZ(-160px) rotateY(87deg); opacity: 1; }
  100% { transform: translateZ(0) rotateY(0); }
}
```
`slit-in-horizontal` swaps `rotateY`→`rotateX`; `slit-in-diagonal-1/2` use `rotate3d(1,1,0,…)` / `(1,-1,0,…)`.

## roll-in — barrel in from the side

```css
/* .roll-in-left  →  animation: roll-in-left 0.6s ease-out both; */
@keyframes roll-in-left {
  0%   { transform: translateX(-800px) rotate(-540deg); opacity: 0; }
  100% { transform: translateX(0) rotate(0deg);         opacity: 1; }
}
```
`roll-in-right` mirrors signs; `roll-in-top/bottom` roll on `translateY`. **Blurred** flavor overshoots harder and adds motion blur:
```css
/* .roll-in-blurred-left  →  animation: roll-in-blurred-left 0.65s cubic-bezier(0.230, 1.000, 0.320, 1.000) both; */
@keyframes roll-in-blurred-left {
  0%   { transform: translateX(-1000px) rotate(-720deg); filter: blur(50px); opacity: 0; }
  100% { transform: translateX(0) rotate(0deg);          filter: blur(0);    opacity: 1; }
}
```

## bounce-in — drop and settle (per-keyframe easing; no top-level timing function)

```css
/* .bounce-in-top  →  animation: bounce-in-top 1.1s both; */
@keyframes bounce-in-top {
  0%   { transform: translateY(-500px); animation-timing-function: ease-in;  opacity: 0; }
  38%  { transform: translateY(0);      animation-timing-function: ease-out; opacity: 1; }
  55%  { transform: translateY(-65px);  animation-timing-function: ease-in; }
  72%  { transform: translateY(0);      animation-timing-function: ease-out; }
  81%  { transform: translateY(-28px);  animation-timing-function: ease-in; }
  90%  { transform: translateY(0);      animation-timing-function: ease-out; }
  95%  { transform: translateY(-8px);   animation-timing-function: ease-in; }
  100% { transform: translateY(0);      animation-timing-function: ease-out; }
}
```
`bounce-in-bottom/left/right` swap the axis/sign of the incoming distance; `bounce-in-fwd`/`-bck` bounce on `scale`.

## fade-in — opacity, optionally with a nudge

```css
/* .fade-in  →  animation: fade-in 1.2s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; */
@keyframes fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
```
Directional fades add a small travel (same shorthand): `fade-in-top` `translateY(-50px)→0`, `bottom` `+50→0`, `left`/`right` `translateX(∓50)→0`, corners combine; `fade-in-bck`/`-fwd` use `translateZ(-80px)`/`(80px)`.

## puff-in — un-blur and settle from oversize

```css
/* .puff-in-center  →  animation: puff-in-center 0.7s cubic-bezier(0.470, 0.000, 0.745, 0.715) both; */
@keyframes puff-in-center {
  0%   { transform: scale(2); filter: blur(4px); opacity: 0; }
  100% { transform: scale(1); filter: blur(0px); opacity: 1; }
}
```
Directional variants add a `transform-origin`; `puff-in-hor`/`-ver` puff on one axis.

---

# Exits

Exits are the reverse of their entrance twin (`0%`↔`100%`) and use the same shorthand — swap opacity `1→0` and travel outward.

```css
/* .slide-out-top  →  animation: slide-out-top 0.5s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes slide-out-top {
  0%   { transform: translateY(0);       opacity: 1; }
  100% { transform: translateY(-1000px); opacity: 0; }
}
/* .scale-out-center  →  animation: scale-out-center 0.5s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes scale-out-center {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 1; }
}
/* .fade-out  →  animation: fade-out 1s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes fade-out { 0% { opacity: 1; } 100% { opacity: 0; } }
/* .puff-out-center  →  animation: puff-out-center 1s cubic-bezier(0.165, 0.840, 0.440, 1.000) both; */
@keyframes puff-out-center {
  0%   { transform: scale(1); filter: blur(0px); opacity: 1; }
  100% { transform: scale(2); filter: blur(4px); opacity: 0; }
}
/* .swirl-out-bck  →  animation: swirl-out-bck 0.6s ease-in both; */
@keyframes swirl-out-bck {
  0%   { transform: rotate(0) scale(1);         opacity: 1; }
  100% { transform: rotate(-540deg) scale(0);   opacity: 0; }
}
/* .slit-out-vertical  →  animation: slit-out-vertical 0.45s ease-in both; */
@keyframes slit-out-vertical {
  0%   { transform: translateZ(0) rotateY(0);            opacity: 1; }
  54%  { transform: translateZ(-160px) rotateY(87deg);   opacity: 1; }
  100% { transform: translateZ(-800px) rotateY(90deg);   opacity: 0; }
}
/* .roll-out-right  →  animation: roll-out-right 0.5s ease-in both; */
@keyframes roll-out-right {
  0%   { transform: translateX(0) rotate(0deg);       opacity: 1; }
  100% { transform: translateX(1000px) rotate(540deg); opacity: 0; }
}
```

**bounce-out** is *not* a plain reverse — it re-bounces before leaving:
```css
/* .bounce-out-bottom  →  animation: bounce-out-bottom 1.5s both; */
@keyframes bounce-out-bottom {
  0%   { transform: translateY(0);    animation-timing-function: ease-out; }
  5%   { transform: translateY(30px); animation-timing-function: ease-in; }
  15%  { transform: translateY(0);    animation-timing-function: ease-out; }
  25%  { transform: translateY(38px); animation-timing-function: ease-in; }
  38%  { transform: translateY(0);    animation-timing-function: ease-out; }
  52%  { transform: translateY(75px); animation-timing-function: ease-in; }
  70%  { transform: translateY(0);    animation-timing-function: ease-out; }
  85%  { opacity: 1; }
  100% { transform: translateY(800px); opacity: 0; }
}
```
`scale-down-center` (`1→0.5`, `0.4s cubic-bezier(0.250,0.460,0.450,0.940)`) is the basic scale exit twin of `scale-up-center`. Other `-out` families (`fade-out-*`, `puff-out-*`, `roll-out-*`, `slit-out-*`, `bounce-out-top/left/right`) follow the same reverse-of-entrance rule.

---

# Attention / loops

Add `infinite` to loop (some source shorthands already carry it, noted below). Attention motion should fire *after* the entrance settles — never simultaneously.

```css
/* .pulsate-fwd  →  animation: pulsate-fwd 0.5s ease-in-out infinite both; */
@keyframes pulsate-fwd {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```
`pulsate-bck` dips to `scale(0.9)` at 50%.

```css
/* .heartbeat  →  animation: heartbeat 1.5s ease-in-out infinite both; */
@keyframes heartbeat {
  from { transform: scale(1);    transform-origin: center center; animation-timing-function: ease-out; }
  10%  { transform: scale(0.91); animation-timing-function: ease-in; }
  17%  { transform: scale(0.98); animation-timing-function: ease-out; }
  33%  { transform: scale(0.87); animation-timing-function: ease-in; }
  45%  { transform: scale(1);    animation-timing-function: ease-out; }
}
```

```css
/* .ping  →  animation: ping 0.8s ease-in-out infinite both; */
@keyframes ping {
  0%   { transform: scale(0.2); opacity: 0.8; }
  80%  { transform: scale(1.2); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
}
```

```css
/* .blink-1  →  animation: blink-1 0.8s both;  (add `infinite` to loop) */
@keyframes blink-1 {
  0%, 50%, 100% { opacity: 1; }
  25%, 75%      { opacity: 0; }
}
```

```css
/* .flicker-1  →  animation: flicker-1 3s linear infinite both; */
@keyframes flicker-1 {
  0%, 100%, 41.99%, 43.01%, 47.99%, 49.01% { opacity: 1; }
  42%, 43%, 48%, 49%                        { opacity: 0; }
}
```

```css
/* .shake-horizontal  →  animation: shake-horizontal 0.8s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;  (add `infinite`) */
@keyframes shake-horizontal {
  0%, 100%            { transform: translateX(0); }
  10%, 30%, 50%, 70%  { transform: translateX(-10px); }
  20%, 40%, 60%       { transform: translateX(10px); }
  80%                 { transform: translateX(8px); }
  90%                 { transform: translateX(-8px); }
}
```
`shake-vertical` uses `translateY`; `shake-lr` rotates on `rotateY`; corner variants add a slight rotate.

```css
/* .vibrate-1  →  animation: vibrate-1 0.3s linear infinite both; */
@keyframes vibrate-1 {
  0%   { transform: translate(0); }
  20%  { transform: translate(-2px, 2px); }
  40%  { transform: translate(-2px, -2px); }
  60%  { transform: translate(2px, 2px); }
  80%  { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

```css
/* .wobble-hor-bottom  →  animation: wobble-hor-bottom 0.8s both;  (add `infinite`) */
@keyframes wobble-hor-bottom {
  0%, 100% { transform: translateX(0%); transform-origin: 50% 50%; }
  15%      { transform: translateX(-30px) rotate(-6deg); }
  30%      { transform: translateX(15px)  rotate(6deg); }
  45%      { transform: translateX(-15px) rotate(-3.6deg); }
  60%      { transform: translateX(9px)   rotate(2.4deg); }
  75%      { transform: translateX(-6px)  rotate(-1.2deg); }
}
```
`wobble-hor-top` anchors origin at top; `wobble-ver-left/right` wobble on `translateY` + rotate.

```css
/* .jello-horizontal  →  animation: jello-horizontal 0.9s both;  (add `infinite`) */
@keyframes jello-horizontal {
  0%   { transform: scale3d(1, 1, 1); }
  30%  { transform: scale3d(1.25, 0.75, 1); }
  40%  { transform: scale3d(0.75, 1.25, 1); }
  50%  { transform: scale3d(1.15, 0.85, 1); }
  65%  { transform: scale3d(0.95, 1.05, 1); }
  75%  { transform: scale3d(1.05, 0.95, 1); }
  100% { transform: scale3d(1, 1, 1); }
}
```
`jello-vertical` swaps the axis ratios; `jello-diagonal-1/2` add `skew`.

---

# Shadows

## shadow-drop — lift the element off the page

```css
/* .shadow-drop-center  →  animation: shadow-drop-center 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes shadow-drop-center {
  0%   { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
  100% { box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.35); }
}
```
Directional variants cast the shadow opposite the light (same shorthand): `shadow-drop-top` `0 -12px 20px -12px rgba(0,0,0,0.35)`, `bottom` `0 12px …`, `left` `-12px 0 …`, `right` `12px 0 …`, corners offset both. **shadow-drop-2** also pushes the element forward and casts on two sides:
```css
@keyframes shadow-drop-2-lr {
  0%   { transform: translateZ(0);    box-shadow: 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0); }
  100% { transform: translateZ(50px); box-shadow: -12px 0 20px -12px rgba(0,0,0,0.35), 12px 0 20px -12px rgba(0,0,0,0.35); }
}
```
(`-tb` casts top+bottom; `-center` all around.)

## shadow-inset — carve an inner shadow

```css
/* .shadow-inset-center  →  animation: shadow-inset-center 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes shadow-inset-center {
  0%   { box-shadow: inset 0 0 0 0 rgba(0, 0, 0, 0); }
  100% { box-shadow: inset 0 0 14px 0 rgba(0, 0, 0, 0.5); }
}
```
Directional: `shadow-inset-top` `inset 0 6px 14px -6px rgba(0,0,0,0.5)`, `bottom`/`left`/`right` rotate the offset; corners offset both axes.

## shadow-pop — stamped stepped-shadow pop (with counter-travel)

```css
/* .shadow-pop-tr  →  animation: shadow-pop-tr 0.3s cubic-bezier(0.470, 0.000, 0.745, 0.715) both; */
@keyframes shadow-pop-tr {
  0%   { box-shadow: 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e, 0 0 #3e3e3e;
         transform: translateX(0) translateY(0); }
  100% { box-shadow: 1px -1px #3e3e3e, 2px -2px #3e3e3e, 3px -3px #3e3e3e, 4px -4px #3e3e3e, 5px -5px #3e3e3e, 6px -6px #3e3e3e, 7px -7px #3e3e3e, 8px -8px #3e3e3e;
         transform: translateX(-8px) translateY(8px); }
}
```
Four corner variants (`tr`, `tl`, `br`, `bl`) — flip the sign of each shadow layer's x/y and the counter-`translate` to point the stack outward from that corner.

---

# Text

## text-focus-in — un-blur into legibility

```css
/* .text-focus-in  →  animation: text-focus-in 1s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes text-focus-in {
  0%   { filter: blur(12px); opacity: 0; }
  100% { filter: blur(0px);  opacity: 1; }
}
```

## focus-in-expand — un-blur while letter-spacing opens

```css
/* .focus-in-expand  →  animation: focus-in-expand 0.8s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes focus-in-expand {
  0%   { letter-spacing: -0.5em; filter: blur(12px); opacity: 0; }
  100% {                          filter: blur(0px);  opacity: 1; }
}
```
`focus-in-contract` starts from wide (`letter-spacing: 1em`) and tightens; `-bck`/`-fwd` add `translateZ`.

## tracking-in / tracking-out — letter-spacing reveal & hide

```css
/* .tracking-in-expand  →  animation: tracking-in-expand 0.7s cubic-bezier(0.215, 0.610, 0.355, 1.000) both; */
@keyframes tracking-in-expand {
  0%   { letter-spacing: -0.5em; opacity: 0; }
  40%  { opacity: 0.6; }
  100% { opacity: 1; }
}
/* .tracking-out-contract  →  animation: tracking-out-contract 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both; */
@keyframes tracking-out-contract {
  0%   { opacity: 1; }
  50%  { opacity: 1; }
  100% { letter-spacing: -0.5em; opacity: 0; }
}
```
`tracking-in-contract` starts wide (`1em`) and closes in; `tracking-out-expand` fades while spreading. `-bck`/`-fwd`/`-top`/`-bottom` add depth or vertical drift.

## text-pop-up — lift text on a long drop-shadow

```css
/* .text-pop-up-top  →  animation: text-pop-up-top 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; */
@keyframes text-pop-up-top {
  0%   { transform: translateY(0);     transform-origin: 50% 50%; text-shadow: none; }
  100% { transform: translateY(-50px); transform-origin: 50% 50%;
         text-shadow: 0 1px 0 #cccccc, 0 2px 0 #cccccc, 0 3px 0 #cccccc, 0 4px 0 #cccccc, 0 5px 0 #cccccc, 0 6px 0 #cccccc, 0 7px 0 #cccccc, 0 8px 0 #cccccc, 0 9px 0 #cccccc, 0 50px 30px rgba(0, 0, 0, 0.3); }
}
```
Directional variants (`bottom/left/right/tr/tl/br/bl`) change the `translate` direction and the shadow's growth axis.

## text-shadow-drop — soft blurred text-shadow appears

```css
/* .text-shadow-drop-center  →  animation: text-shadow-drop-center 0.6s both; */
@keyframes text-shadow-drop-center {
  0%   { text-shadow: 0 0 0 rgba(0, 0, 0, 0); }
  100% { text-shadow: 0 0 18px rgba(0, 0, 0, 0.35); }
}
```
Directional variants offset the shadow (`top` `0 -6px 18px`, `right` `6px 0 18px`, corners both axes).

## text-shadow-pop — hard stepped text-shadow (3D extrude) with counter-travel

```css
/* .text-shadow-pop-top  →  animation: text-shadow-pop-top 0.6s both; */
@keyframes text-shadow-pop-top {
  0%   { text-shadow: 0 0 #555555, 0 0 #555555, 0 0 #555555, 0 0 #555555, 0 0 #555555, 0 0 #555555, 0 0 #555555, 0 0 #555555;
         transform: translateY(0); }
  100% { text-shadow: 0 -1px #555555, 0 -2px #555555, 0 -3px #555555, 0 -4px #555555, 0 -5px #555555, 0 -6px #555555, 0 -7px #555555, 0 -8px #555555;
         transform: translateY(8px); }
}
```
Eight directions — flip each layer's x/y sign and the counter-`translate` to aim the extrusion (`bottom`, `left`, `right`, `tr/tl/br/bl`).
