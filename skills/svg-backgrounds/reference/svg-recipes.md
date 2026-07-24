# SVG Background Recipes

Emit-ready inline SVG for the 15 Haikei background families. Haikei (app.haikei.app) is a
popular SVG background generator with **no API**, so these are hand-authored, technique-equivalent
equivalents you paste directly — no export step, no dependency.

## House rules (read once)

- **One background effect per section.** Signature-effect restraint: a wave *or* a blob field *or* a
  blurry gradient — never two competing generative textures in the same viewport.
- **Place it behind content.** Every snippet below carries `class="bg"`. Add this once:

  ```css
  .bg  { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .fg  { position: relative; z-index: 1; }           /* your content wrapper */
  :root { --bg: #0b1020; --bg-2: #131a33; --accent: #6366f1;
          --accent-2: #ec4899; --accent-3: #22d3ee; }
  ```

  The parent must be `position: relative; overflow: hidden;`. Every `fill` reads a CSS custom
  property with a hard-coded fallback, so a snippet renders even before you define the vars —
  then re-tunes instantly when you do.
- **`preserveAspectRatio` is deliberate.** `none` = stretch to fill (waves / peaks / steps —
  distortion is invisible on abstract bands). `xMidYMid slice` = cover without distortion
  (blobs / scatters / gradients / low-poly — where squashing would read as a bug).
- **Animation is opt-in and gated.** Static first. If you animate, wrap it in
  `@media (prefers-reduced-motion: reduce)` — see the last section.

---

## 1. Blob

One organic closed-bezier shape. A soft hero anchor behind a heading or a floating card.

```html
<svg class="bg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <path fill="var(--accent, #6366f1)" d="M400 120
    C520 120 610 190 660 300
    C710 410 720 520 650 600
    C580 680 450 700 340 670
    C230 640 140 560 120 450
    C100 340 150 230 250 170
    C310 133 340 120 400 120 Z"/>
</svg>
```

**Knobs** — control-point spread (rounder vs. spikier); `fill` color; add `opacity="0.85"` or a
second offset copy in `--accent-2` for depth.

---

## 2. Blob Scene

A single large blob over a flat/gradient field — the blob *is* the composition. Full-panel hero.

```html
<svg class="bg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="600" fill="var(--bg, #0b1020)"/>
  <path fill="var(--accent, #6366f1)" d="M620 90
    C740 110 860 180 890 300
    C920 420 860 540 740 590
    C620 640 470 620 380 540
    C290 460 260 330 320 230
    C380 130 500 70 620 90 Z"/>
</svg>
```

**Knobs** — blob position (pull it off-canvas for a cropped edge); background `--bg` vs. a
`linearGradient`; layer a second smaller blob in `--accent-2` at `opacity="0.6"`.

---

## 3. Blob Scatter

Several small blobs at pseudo-random positions and opacities. Ambient texture, not a focal point.

```html
<svg class="bg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path id="blob" d="M45 6 C66 6 86 22 88 44 C90 66 74 84 52 88 C30 92 10 76 8 54 C6 32 24 6 45 6 Z"/>
  </defs>
  <use href="#blob" transform="translate(60 70) scale(1.1)"  fill="var(--accent, #6366f1)"  opacity="0.55"/>
  <use href="#blob" transform="translate(320 40) scale(0.7)" fill="var(--accent-2, #ec4899)" opacity="0.40"/>
  <use href="#blob" transform="translate(640 90) scale(1.4)" fill="var(--accent, #6366f1)"  opacity="0.30"/>
  <use href="#blob" transform="translate(180 300) scale(0.9)" fill="var(--accent-3, #22d3ee)" opacity="0.45"/>
  <use href="#blob" transform="translate(520 340) scale(1.2)" fill="var(--accent, #6366f1)"  opacity="0.35"/>
  <use href="#blob" transform="translate(740 400) scale(0.6)" fill="var(--accent-2, #ec4899)" opacity="0.50"/>
</svg>
```

**Knobs** — blob count and `scale` range; `opacity` spread (keep it low — texture, not confetti);
one accent hue vs. a two/three-color mix.

---

## 4. Wave

A single clean wave divider between two sections. The workhorse.

```html
<svg class="bg" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="var(--accent, #6366f1)" d="M0 160
    C240 80 480 240 720 200
    C960 160 1200 40 1440 120
    L1440 320 L0 320 Z"/>
</svg>
```

**Knobs** — wave amplitude (spread of the C control-point Y values); crest count (add more C
segments); flip vertically by anchoring `L…0` at the top instead of the bottom for a top divider.

---

## 5. Layered Waves

2–4 translucent waves stacked at stepped opacity over a background — soft depth at a section base.

```html
<svg class="bg" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="320" fill="var(--bg, #0b1020)"/>
  <path fill="var(--accent, #6366f1)" opacity="0.35" d="M0 120
    C360 40 720 200 1080 140 C1260 110 1350 90 1440 110 L1440 320 L0 320 Z"/>
  <path fill="var(--accent, #6366f1)" opacity="0.60" d="M0 180
    C300 120 600 240 960 190 C1200 158 1320 150 1440 170 L1440 320 L0 320 Z"/>
  <path fill="var(--accent, #6366f1)" d="M0 240
    C360 200 720 290 1080 250 C1260 232 1350 230 1440 245 L1440 320 L0 320 Z"/>
</svg>
```

**Knobs** — layer count (2–4); opacity ramp (`0.35 → 0.6 → 1` reads as receding depth); vertical
offset between layers (tighter = denser).

---

## 6. Stacked Waves

Opaque wave bands filling the whole height — wavy horizontal stripes, a full-bleed background.

```html
<svg class="bg" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="600" fill="var(--bg, #0b1020)"/>
  <path fill="var(--accent, #6366f1)" opacity="0.20" d="M0 90  C480 10 960 170 1440 90  L1440 600 L0 600 Z"/>
  <path fill="var(--accent, #6366f1)" opacity="0.40" d="M0 210 C480 130 960 290 1440 210 L1440 600 L0 600 Z"/>
  <path fill="var(--accent, #6366f1)" opacity="0.60" d="M0 330 C480 250 960 410 1440 330 L1440 600 L0 600 Z"/>
  <path fill="var(--accent, #6366f1)" opacity="0.80" d="M0 450 C480 370 960 530 1440 450 L1440 600 L0 600 Z"/>
</svg>
```

**Knobs** — band count and vertical spacing; opacity ramp direction (light-top vs. light-bottom);
give each band its own `fill` var for a multi-hue gradient stack.

---

## 7. Blurry Gradient

Overlapping color orbs pushed through a Gaussian blur — the "aurora / mesh gradient" glow.

```html
<svg class="bg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--bg, #0b1020)"/>
      <stop offset="1" stop-color="var(--bg-2, #131a33)"/>
    </linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="90"/>
    </filter>
  </defs>
  <rect width="900" height="600" fill="url(#field)"/>
  <g filter="url(#soft)">
    <circle cx="250" cy="200" r="180" fill="var(--accent, #6366f1)"   opacity="0.70"/>
    <circle cx="680" cy="380" r="200" fill="var(--accent-2, #ec4899)" opacity="0.60"/>
    <circle cx="480" cy="120" r="140" fill="var(--accent-3, #22d3ee)" opacity="0.50"/>
  </g>
</svg>
```

**Knobs** — `stdDeviation` (blur radius — higher = smoother, more diffuse); orb count / positions;
per-orb hue and opacity. The filter region is padded to `200%` so the blur never clips at the edge.

---

## 8. Circle Scatter

Repeated circles at varied radius and opacity — clean dotted / bokeh texture.

```html
<svg class="bg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <g fill="var(--accent, #6366f1)">
    <circle cx="80"  cy="90"  r="34" opacity="0.50"/>
    <circle cx="220" cy="140" r="26" opacity="0.35"/>
    <circle cx="360" cy="70"  r="44" opacity="0.60"/>
    <circle cx="520" cy="120" r="20" opacity="0.30"/>
    <circle cx="660" cy="90"  r="52" opacity="0.70"/>
    <circle cx="760" cy="200" r="30" opacity="0.40"/>
    <circle cx="120" cy="260" r="40" opacity="0.55"/>
    <circle cx="300" cy="300" r="22" opacity="0.30"/>
    <circle cx="470" cy="270" r="36" opacity="0.50"/>
    <circle cx="620" cy="320" r="28" opacity="0.40"/>
    <circle cx="180" cy="430" r="48" opacity="0.65"/>
    <circle cx="360" cy="470" r="24" opacity="0.35"/>
    <circle cx="540" cy="440" r="40" opacity="0.55"/>
    <circle cx="700" cy="470" r="32" opacity="0.45"/>
  </g>
</svg>
```

**Knobs** — count and radius range; opacity spread; swap `fill` to `none` + `stroke` for outline
rings instead of solid dots.

---

## 9. Polygon Scatter

Repeated triangles at random rotation/scale — a crystalline, angular ambient field.

```html
<svg class="bg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><polygon id="tri" points="0,-28 24,14 -24,14"/></defs>
  <use href="#tri" transform="translate(90 110) rotate(10) scale(1.0)"  fill="var(--accent, #6366f1)"   opacity="0.50"/>
  <use href="#tri" transform="translate(250 80) rotate(120) scale(0.8)" fill="var(--accent-2, #ec4899)" opacity="0.40"/>
  <use href="#tri" transform="translate(410 140) rotate(40) scale(1.2)" fill="var(--accent, #6366f1)"   opacity="0.60"/>
  <use href="#tri" transform="translate(560 90) rotate(200) scale(0.7)" fill="var(--accent-3, #22d3ee)" opacity="0.35"/>
  <use href="#tri" transform="translate(700 150) rotate(75) scale(1.1)" fill="var(--accent, #6366f1)"   opacity="0.55"/>
  <use href="#tri" transform="translate(150 300) rotate(150) scale(0.9)" fill="var(--accent-2, #ec4899)" opacity="0.45"/>
  <use href="#tri" transform="translate(330 340) rotate(20) scale(1.3)" fill="var(--accent, #6366f1)"   opacity="0.60"/>
  <use href="#tri" transform="translate(500 300) rotate(260) scale(0.8)" fill="var(--accent-3, #22d3ee)" opacity="0.40"/>
  <use href="#tri" transform="translate(650 360) rotate(95) scale(1.0)" fill="var(--accent, #6366f1)"   opacity="0.50"/>
  <use href="#tri" transform="translate(760 280) rotate(310) scale(0.7)" fill="var(--accent-2, #ec4899)" opacity="0.35"/>
</svg>
```

**Knobs** — swap the `#tri` points for a hexagon/square/diamond; `rotate`/`scale` spread; count and
hue mix. Add `stroke="var(--accent)" fill="none"` for wireframe polygons.

---

## 10. Symbol Scatter

One repeated glyph (here a plus / spark) strewn across the field — playful branded texture.

```html
<svg class="bg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><g id="spark"><path d="M-3,-10 H3 V-3 H10 V3 H3 V10 H-3 V3 H-10 V-3 H-3 Z"/></g></defs>
  <use href="#spark" transform="translate(70 80) rotate(0) scale(1.2)"  fill="var(--accent, #6366f1)"   opacity="0.55"/>
  <use href="#spark" transform="translate(230 60) rotate(30) scale(0.8)" fill="var(--accent-2, #ec4899)" opacity="0.40"/>
  <use href="#spark" transform="translate(400 120) rotate(15) scale(1.4)" fill="var(--accent, #6366f1)"  opacity="0.60"/>
  <use href="#spark" transform="translate(560 70) rotate(45) scale(0.9)" fill="var(--accent-3, #22d3ee)" opacity="0.45"/>
  <use href="#spark" transform="translate(710 140) rotate(20) scale(1.1)" fill="var(--accent, #6366f1)"  opacity="0.50"/>
  <use href="#spark" transform="translate(140 280) rotate(60) scale(1.0)" fill="var(--accent-2, #ec4899)" opacity="0.40"/>
  <use href="#spark" transform="translate(320 330) rotate(10) scale(1.3)" fill="var(--accent, #6366f1)"  opacity="0.55"/>
  <use href="#spark" transform="translate(490 290) rotate(50) scale(0.8)" fill="var(--accent-3, #22d3ee)" opacity="0.40"/>
  <use href="#spark" transform="translate(640 350) rotate(25) scale(1.1)" fill="var(--accent, #6366f1)"  opacity="0.50"/>
  <use href="#spark" transform="translate(750 250) rotate(70) scale(0.9)" fill="var(--accent-2, #ec4899)" opacity="0.45"/>
</svg>
```

**Knobs** — replace the `#spark` path with any glyph (star, cross, dot, logo mark); count and
`scale` range; keep opacity low so it stays texture, not a pattern-fill.

---

## 11. Low Poly Grid

Tessellated triangles with a subtle fill ramp — the classic faceted "crystal gradient".

```html
<svg class="bg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <g fill="var(--accent, #6366f1)">
    <polygon points="0,0 200,0 200,200"     opacity="0.40"/>
    <polygon points="0,0 200,200 0,200"     opacity="0.48"/>
    <polygon points="200,0 400,0 200,200"   opacity="0.52"/>
    <polygon points="400,0 400,200 200,200" opacity="0.60"/>
    <polygon points="400,0 600,0 600,200"   opacity="0.64"/>
    <polygon points="400,0 600,200 400,200" opacity="0.72"/>
    <polygon points="0,200 200,200 0,400"     opacity="0.56"/>
    <polygon points="200,200 200,400 0,400"   opacity="0.64"/>
    <polygon points="200,200 400,200 400,400" opacity="0.70"/>
    <polygon points="200,200 400,400 200,400" opacity="0.78"/>
    <polygon points="400,200 600,200 400,400" opacity="0.84"/>
    <polygon points="600,200 600,400 400,400" opacity="0.92"/>
  </g>
</svg>
```

**Knobs** — grid density (subdivide the cells for finer facets); opacity ramp direction (this one
runs top-left → bottom-right); for a truer low-poly look, jitter each interior vertex by ±20px and
give alternating triangles `--accent` / `--accent-2`. Add `stroke="var(--bg)" stroke-width="1"` to
etch the facet edges.

---

## 12. Layered Peaks

Translucent angular ridges (diagonals) at a section base — a stylized mountain range.

```html
<svg class="bg" viewBox="0 0 1440 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="400" fill="var(--bg, #0b1020)"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.35" points="0,250 180,140 360,230 540,120 720,220 900,110 1080,210 1260,130 1440,220 1440,400 0,400"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.60" points="0,300 180,210 360,290 540,200 720,285 900,195 1080,280 1260,205 1440,285 1440,400 0,400"/>
  <polygon fill="var(--accent, #6366f1)"                 points="0,345 180,290 360,340 540,285 720,335 900,280 1080,330 1260,290 1440,335 1440,400 0,400"/>
</svg>
```

**Knobs** — peak count (more X-samples = jaggier); amplitude (ridge Y range); layer count and
opacity ramp. Peaks use **diagonal** segments — that's what separates them from Steps.

---

## 13. Stacked Peaks

Opaque angular bands filling the full height — receding ridgelines, full-bleed.

```html
<svg class="bg" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="600" fill="var(--bg, #0b1020)"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.25" points="0,120 288,60 576,150 864,70 1152,140 1440,80 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.45" points="0,230 288,180 576,255 864,190 1152,250 1440,200 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.65" points="0,340 288,300 576,365 864,310 1152,360 1440,320 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.85" points="0,450 288,420 576,470 864,425 1152,465 1440,435 1440,600 0,600"/>
</svg>
```

**Knobs** — band count and vertical spacing; ridge amplitude; opacity ramp (light-back →
dark-front sells the depth). Per-band `fill` vars give a colored range.

---

## 14. Layered Steps

Translucent right-angle staircases at a base — a blocky, architectural divider.

```html
<svg class="bg" viewBox="0 0 1440 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="400" fill="var(--bg, #0b1020)"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.35" points="0,200 180,200 180,160 360,160 360,220 540,220 540,170 720,170 720,230 900,230 900,180 1080,180 1080,240 1260,240 1260,190 1440,190 1440,400 0,400"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.60" points="0,260 180,260 180,225 360,225 360,285 540,285 540,235 720,235 720,295 900,295 900,245 1080,245 1080,305 1260,305 1260,255 1440,255 1440,400 0,400"/>
  <polygon fill="var(--accent, #6366f1)"                 points="0,320 180,320 180,290 360,290 360,345 540,345 540,300 720,300 720,350 900,350 900,305 1080,305 1080,355 1260,355 1260,315 1440,315 1440,400 0,400"/>
</svg>
```

**Knobs** — step width (X stride) and rise (Y jump); layer count and opacity ramp. Steps use only
**horizontal + vertical** segments (right angles) — that's the Steps-vs-Peaks tell.

---

## 15. Stacked Steps

Opaque staircase bands filling the full height — a bold, blocky full-bleed background.

```html
<svg class="bg" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="600" fill="var(--bg, #0b1020)"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.25" points="0,110 288,110 288,70 576,70 576,140 864,140 864,90 1152,90 1152,150 1440,150 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.45" points="0,230 288,230 288,190 576,190 576,255 864,255 864,205 1152,205 1152,260 1440,260 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.65" points="0,350 288,350 288,310 576,310 576,370 864,370 864,320 1152,320 1152,375 1440,375 1440,600 0,600"/>
  <polygon fill="var(--accent, #6366f1)" opacity="0.85" points="0,470 288,470 288,435 576,435 576,490 864,490 864,440 1152,440 1152,495 1440,495 1440,600 0,600"/>
</svg>
```

**Knobs** — step stride/rise; band count and spacing; opacity ramp or per-band `fill` vars.

---

## Animating (optional, gated)

Static SVG is the default. If a wave/peak/step *earns* gentle motion, animate a transform and
**always** cut it under reduced-motion. For a seamless horizontal drift, author the path ~120px
wider than the viewBox (or duplicate the crest) so the loop wraps without a seam:

```css
@keyframes bg-drift { from { transform: translateX(0); } to { transform: translateX(-120px); } }
.bg-anim { animation: bg-drift 14s linear infinite; will-change: transform; }
@media (prefers-reduced-motion: reduce) { .bg-anim { animation: none; } }
```

For anything richer than a drift or a slow opacity pulse (particles, flow, noise), stop reaching for
SVG — escalate to `generative-canvas.md`, and only if it earns the page's one hero slot.
