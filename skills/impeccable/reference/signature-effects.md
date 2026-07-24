# Signature Effects — Shader Gradients, Liquid Metal, Liquid Glass & 3D

> Recipes consume published npm packages; no upstream source is vendored here. Package licenses (incl. one source-available noncompete) and verified versions are in the table at the bottom and in ../NOTICE.md.

## Why This Matters

A flawless type scale and a 60-30-10 palette get you to "clean." One well-placed signature effect — a gradient that breathes behind the hero, a chrome wordmark that flows, a single glass panel that refracts what's under it — is what gets you to "crafted," the thing a visitor screenshots. It is also the fastest route back to slop if you spray it everywhere. These effects are a scalpel, not a coat of paint.

The discipline here is the SAME as motion-design.md's "Should this animate at all?" gate: earn it, place it on the one surface that deserves it, and keep everything around it calm.

## The Gate: Does This Surface Earn a Signature Effect?

Run before reaching for any library on this page. Fail one → ship it without the effect.

1. **One signature moment per page.** A liquid hero backdrop AND a glass card AND a liquid-metal logo AND a 3D scene on the same page is a carnival, not a design. Pick the single highest-intent surface (usually the hero backdrop OR the logo OR one focal card) and let it be the show. Everything else stays still.
2. **It serves the brand, not the demo.** The effect has to express the SAME 3 brand words that chose the typeface and the motion personality (SKILL.md font procedure). A liquid-metal treatment on a calm-clinical healthcare portal is wrong no matter how good it looks. If the effect would feel identical on any project, it's decoration — cut it.
3. **It inherits the brand palette.** Every shader on this page ships with a rainbow/purple-pink default that IS the banned AI palette (SKILL.md `<color_rules>`). You must override the colors with brand-derived hexes. A default-palette MeshGradient is an audit failure, not a feature.
4. **It never costs the content.** The effect sits BEHIND text and never degrades contrast, never blocks the LCP element, never steals the main thread from first paint. Text legibility and Core Web Vitals win every time.
5. **It has a static fallback.** `prefers-reduced-motion`, no-WebGL, and SSR all must resolve to a still, on-brand frame — never a blank rectangle, never a layout jump.

If it survives all five, build it. If you're unsure, the restrained version (static gradient mesh from imagery-and-assets.md) is the lazy-senior-dev default and is never wrong.

## Pick The Technique

| The brief wants… | Reach for | Weight | License |
|---|---|---|---|
| Ambient animated gradient **backdrop** (hero, section, full-page) | paper `MeshGradient` (default) | ~zero-dep canvas | PolyForm Shield ⚠ |
| Same, but you need an **MIT-clean** dep or a true 3D camera-driven gradient | `@shadergradient/react` | heavy (pulls R3F + three) | MIT |
| **Liquid-metal / chrome** logo, wordmark, or icon | paper `LiquidMetal` | ~zero-dep canvas | PolyForm Shield ⚠ |
| A single **glass** focal surface that refracts content under it | `liquid-glass-react` | light, Chromium-only displacement | MIT |
| **3D scene** — configurator, spatial concept, depth-is-the-message | load **threejs** (SK-007) | heavy (three ~600KB) | MIT |
| Image filters (fluted glass, water, dithering, halftone) on a **photo/logo** | paper `FlutedGlass` / `Water` / `Dithering` / `ImageDithering` | ~zero-dep canvas | PolyForm Shield ⚠ |
| A **preset 3D backdrop** fast, or a ready-made animated component | `vanta` (+ `three`) / `react-bits` (copy-in) | ~120KB / per-component | MIT / MIT + Commons Clause |
| A **drawn line** that reveals on scroll, threading sections of a narrative page | SVG path + dashoffset (§F — DrawSVG SK-044, or CSS `animation-timeline: view()`) | ~zero | — |

⚠ **PolyForm Shield 1.0.0** (paper-design): source-available, free for any purpose *except building a product that competes with paper.design*. Fine for portfolio, marketing, course, hackathon, and client sites. If the project itself is a design tool / shader product, use the MIT alternative (shadergradient) or a CSS mesh instead.

---

## A. Animated Gradient Backdrop

The highest-leverage effect: a slow, breathing gradient behind a hero reads as premium with almost no risk, as long as the colors are yours and the text stays readable.

### A1 — paper `MeshGradient` (default: light, zero-dep)

```bash
npm i @paper-design/shaders-react
```

```tsx
// components/HeroBackdrop.tsx
'use client';

import { MeshGradient, StaticMeshGradient } from '@paper-design/shaders-react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

// Colors are DERIVED FROM the brand palette — never the package default
// ['#e0eaff','#241d9a','#f75092','#9f50d3'], which is the banned AI rainbow.
const BRAND_GRADIENT = ['#0b0f1a', '#13233f', '#2f5bd0', '#0b0f1a'];

export default function HeroBackdrop() {
  const reduced = usePrefersReducedMotion();
  const common = {
    colors: BRAND_GRADIENT,
    distortion: 0.8,
    swirl: 0.55,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const,
  };
  // Reduced motion / no-anim path resolves to a still on-brand frame.
  return reduced
    ? <StaticMeshGradient {...common} />
    : <MeshGradient {...common} speed={0.15} grainOverlay={0.04} />;
}
```

```tsx
// app/page.tsx — backdrop sits BEHIND content, never blocks the LCP text
import HeroBackdrop from '@/components/HeroBackdrop';

export default function Page() {
  return (
    <main className="relative min-h-screen isolate">
      <HeroBackdrop />
      <section className="relative z-10 mx-auto max-w-[68ch] px-6 py-32">
        <h1 className="text-balance text-5xl font-semibold tracking-tight">Real headline from the brief</h1>
        {/* … */}
      </section>
    </main>
  );
}
```

Verified props (`MeshGradient`, pre-1.0 API): `colors: string[]`, `distortion` (def 0.8), `swirl` (def 0.1), `speed` (def 1 — **drop to 0.1–0.2 for ambient**, 1 is frantic), `grainMixer`, `grainOverlay`, `frame`, plus `style`/`...props`. `StaticMeshGradient` takes the same colors for the still fallback.

Tuning notes:
- **Speed is the #1 tell.** Ambient backdrops live at `speed: 0.1–0.2`. Anything faster reads as a screensaver.
- **2–4 colors, all in one hue family** (or a deliberate analogous pair). 4 clashing hues = the rainbow default by another name.
- Add `grainOverlay: 0.03–0.06` to kill the plasticky flat-gradient look — same reasoning as the SVG grain in imagery-and-assets.md.
- Mark the file `'use client'` — it renders a `<canvas>` and drives a rAF loop.

### A2 — `@shadergradient/react` (MIT alternative; true R3F 3D gradient)

Use when you need an MIT-clean dependency, or want the camera-driven 3D gradient look (the swirling glass-blob aesthetic). It is built on React-Three-Fiber, so it is **heavy** (`three` ~600KB) and follows the threejs SSR rules exactly.

```bash
npm i @shadergradient/react @react-three/fiber three three-stdlib camera-controls
```

```tsx
// components/GradientScene.tsx
'use client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

export default function GradientScene() {
  const reduced = usePrefersReducedMotion();
  return (
    <ShaderGradientCanvas style={{ position: 'absolute', inset: 0 }}>
      <ShaderGradient
        control="props"
        color1="#0b0f1a" color2="#2f5bd0" color3="#13233f"  // brand-derived
        uSpeed={reduced ? 0 : 0.1} uStrength={1.4} cDistance={3.2} cPolarAngle={120}
        type="waterPlane" animate={reduced ? 'off' : 'on'}  // 'off' = static frame of the same gradient
      />
    </ShaderGradientCanvas>
  );
}
```

```tsx
// app/page.tsx — R3F MUST be client-only or you get `window is not defined` at build
import dynamic from 'next/dynamic';
const GradientScene = dynamic(() => import('@/components/GradientScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0b0f1a]" />, // on-brand still fallback
});
```

R3F version pairing is non-negotiable: **`@react-three/fiber@9` ↔ React 19** (Next 16 default); v8 is the React 18 line. Full SSR rules, perf defaults, and bug table live in the **threejs** skill (SK-007) — load it whenever you touch shadergradient or any R3F.

Heads-up: shadergradient declares only `react`/`react-dom` as peer deps — `@react-three/fiber`, `three`, `three-stdlib`, and `camera-controls` are **not** declared peers (they ship as its devDeps), so npm gives no missing-peer warning. Install them explicitly, exactly as the command above does, or the build fails at import.

---

## B. Liquid-Metal Logo / Wordmark — paper `LiquidMetal`

The reusable form of paper-design's "liquid-logo" demo. Feed it your logo silhouette (SVG/PNG, ideally a solid shape on transparent) and it flows like mercury. Best as a one-time hero reveal of the brand mark, not a permanently-looping nav logo.

```tsx
// components/LiquidMark.tsx
'use client';
import { LiquidMetal } from '@paper-design/shaders-react';

export default function LiquidMark() {
  return (
    <LiquidMetal
      image="/brand/logo-silhouette.svg"   // solid shape, transparent bg
      colorBack="#0b0f1a"                    // match the surface behind it
      colorTint="#cfd6e6"                    // brand-tinted chrome, not pure #fff
      speed={0.4} softness={0.12} repetition={2} contour={0.5}
      shiftRed={0.25} shiftBlue={0.3} angle={70}
      style={{ width: 260, height: 260 }}
    />
  );
}
```

Verified props (`LiquidMetal`, pre-1.0): `image`, `colorBack` (def `#AAAAAC`), `colorTint` (def `#ffffff`), `speed` (def 1), `softness` (0.1), `repetition` (2), `shiftRed`/`shiftBlue` (0.3), `distortion` (0.07), `contour` (0.4), `angle` (70), `shape` ('diamond'), plus sizing (`fit`, `scale`, `rotation`, `offsetX/Y`). Sibling logo-animation shaders: `Water`, `GemSmoke`, `Heatmap`.

When NOT to: small UI logos (<48px — the effect is illegible), anywhere the mark must stay crisp for recognition, or as ambient loop in a header (fails motion-design's frequency gate — the user sees the header on every scroll). One reveal, then settle to the static mark.

---

## C. Liquid Glass Focal Surface — `liquid-glass-react`

Apple-style glass with real edge-bending refraction of whatever is behind it. This is the *purposeful* exception to SKILL.md's ban on glassmorphism — that ban is about glass-blur sprayed on every card as decoration. ONE glass surface, placed over content worth refracting (a gradient backdrop, an image, a 3D scene), is a deliberate focal effect and is allowed.

```bash
npm i liquid-glass-react   # MIT, React >=19
```

```tsx
'use client';
import LiquidGlass from 'liquid-glass-react';

export default function GlassPanel() {
  return (
    <LiquidGlass
      displacementScale={64}
      blurAmount={0.06}
      saturation={140}
      cornerRadius={24}
      elasticity={0.15}
      overLight={false}   // set true when the panel sits over a LIGHT background
    >
      <div className="p-8">
        <h3 className="text-lg font-medium">Floating control</h3>
        <p className="text-sm opacity-80">Glass over a real backdrop — not a flat color.</p>
      </div>
    </LiquidGlass>
  );
}
```

Non-negotiable guards:
- **Cross-browser:** the displacement/refraction renders **in Chromium only**. Safari and Firefox fall back to a plain frosted blur (no edge-bending). So the design must still read with just blur — never make the refraction load-bearing for legibility. Verify in all three engines at craft Step 4b.
- **Needs something behind it.** Glass over a solid color is pointless — it must sit over a gradient/image/scene or the effect is invisible. This pairs naturally with effect A (gradient backdrop).
- **Contrast still applies.** Text on glass must hit WCAG AA against the *lightest* thing that can show through. Add a subtle scrim inside the panel if the backdrop is busy.
- One per view. Two glass panels overlapping is the slop the original ban warns about.

---

## D. 3D / WebGL Scene — load threejs (SK-007)

Full 3D (a product configurator, a spatial concept, a hero where depth IS the message) belongs to the **threejs** skill — it owns the verified Next 16 SSR pattern, R3F/drei version pairing, GLTF loading, scroll-driven scenes, perf defaults, and the bug table. This page only owns the *gate*:

3D earns its place ONLY when depth carries meaning. A configurator, a spatial walkthrough, a single hero object the product is actually about → yes. A floating torus-knot behind a SaaS headline → expensive slop (imagery-and-assets.md decision tree, branch 3). shadergradient (effect A2) is the bridge case: R3F under the hood, but it's a gradient, not a scene — treat its weight and SSR rules as 3D.

---

## E. Fast drop-ins — Vanta preset backdrops & react-bits effects

When speed matters more than a bespoke effect, two catalogs give you an animated backdrop or component in minutes. **Both are subject to the same five-point gate above** — one signature moment per page, sits behind content, static fallback — plus the load-bearing rule: **re-color / re-tune every preset to the brand tokens.** Shipping either at its stock defaults is the recognizable slop the audit catches.

### E1 — Vanta (`vanta`) — preset 3D backgrounds
Drop-in three.js backdrops: `WAVES`, `BIRDS`, `FOG`, `CLOUDS`, `CLOUDS2`, `NET`, `GLOBE`, `TOPOLOGY`, `TRUNK`, `CELLS`, `RINGS`, `HALO`, `DOTS`. MIT, ~120KB (mostly three). Prefer MeshGradient/shadergradient (A1/A2) for a *distinctive* hero; reach for Vanta when a preset genuinely fits the concept or you need it fast.

```bash
npm i vanta three
```

```tsx
// components/VantaBackdrop.tsx — client-only; pass THREE explicitly (Vanta otherwise expects a global)
'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min';

export default function VantaBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const [fx, setFx] = useState<any>(null);
  useEffect(() => {
    if (fx || !ref.current) return;
    setFx(FOG({
      el: ref.current, THREE,
      // BRAND colors — override the defaults; the stock palette IS the tell
      highlightColor: 0x2f5bd0, midtoneColor: 0x13233f, lowlightColor: 0x0b0f1a, baseColor: 0x0b0f1a,
      blurFactor: 0.6, speed: 1.0, zoom: 0.9,
    }));
    return () => { if (fx) fx.destroy(); };
  }, [fx]);
  return <div ref={ref} className="absolute inset-0 -z-10" aria-hidden />;
}
```

```tsx
// import client-only so `next build` never touches window/WebGL on the server
import dynamic from 'next/dynamic';
const VantaBackdrop = dynamic(() => import('@/components/VantaBackdrop'), {
  ssr: false, loading: () => <div className="absolute inset-0 -z-10 bg-[#0b0f1a]" />,
});
```

Guards: **pass `THREE` in the options** (don't rely on `window.THREE`); it renders behind content, never as the LCP element; give it a still on-brand `loading` fallback; Vanta has **no built-in reduced-motion** — add a `prefers-reduced-motion` branch that renders the static fallback instead of initializing. **Version trap:** Vanta uses older three internals — if an effect throws with a modern `three`, pin `three` to the version Vanta's README ships, or use an A/A2 shader instead.

### E2 — react-bits — copy-in animated components
139 animated React components — text (BlurText, SplitText), backgrounds (Aurora, Ballpit, Threads), UI & animations. **Copy-in, you own the code** (like shadcn), 4 variants — use **TS-TW** on this stack:

```bash
npx shadcn@latest add @react-bits/Aurora-TS-TW
```

MIT + Commons Clause (build freely; don't resell the components — the code lives in the project that renders it, never in a shared stash). Same class as the auto-bundled aceternity/magicui — it plugs into the existing shadcn CLI + MCP workflow. Treat every react-bits piece as a **starting point**: change colors/type/easing to the brand tokens and cut what you don't use — shipping `Aurora` or `Ballpit` at its defaults reads as "a react-bits site" (AR-class slop). Its background effects still obey the one-signature-per-page gate.

**Pick from the full index, not from memory:** `wiki/web-dev/react-bits-catalog.md` lists all 139 by category with each one's **real dependency cost** — 32 are zero-dep (pure React/CSS), 52 want `motion`/`gsap`, 31 pull `ogl` (~50KB), 24 drag in `three` + R3F. Exhaust the free tier before spending bundle on a backdrop: `Waves`, `Lightning`, `DotField`, `StarBorder`, `ElectricBorder`, `SpotlightCard` cost nothing. Anything in the `3D` tier is a §D-class decision, not a drop-in. (⚠ `Lanyard` reports no deps upstream but actually imports the whole R3F stack — treat as 3D.)

More free copy-in libraries in this exact class — **Magic UI, Aceternity UI (free components), Cult UI, Eldora UI, Animata** (all MIT / free-for-commercial, verified) — are catalogued on the web-dev brain's `resources.md` § *Copy-in component libraries*, with the same "adapt to brand, never ship raw" rule. (`ui.buoucoding.com` was checked and **excluded** — proprietary license, not free for commercial use.)

## F. Drawn-line scroll reveal — SVG path + dashoffset

An SVG path that draws itself as the page scrolls: `stroke-dasharray: <len>; stroke-dashoffset: <len> → 0`, scrubbed by GSAP ScrollTrigger / DrawSVG (SK-044) — or pure CSS via `animation-timeline: view()` where supported (Firefox needs the JS fallback; see the build-workflow watchlist). Earns its place on narrative/marketing scroll pages as a connective thread between sections. Same ration as everything in this file: it IS the page's one signature effect, not an addition to one.

**The load-bearing rule — the single most-cited complaint about this effect in the field: the line NEVER crosses text.** Keep it low-opacity (≤0.25), z-index *below* content, and route the path through gutters/whitespace; a decorative stroke over a heading or body copy is an instant readability fail, and no scroll choreography buys it back. Reduced motion: show the completed path statically (the same `both`-fill discipline as any drawn rule — duration-zeroing alone leaves a dashoffset-hidden path invisible). Color: a hairline/structure tone from the page's own tokens, never a new accent.

(Added 2026-07-17 from the design-brief deltas — the one effect the gradient/glass/metal/3D set didn't cover.)

## Shared: SSR Pattern, Reduced Motion, Perf Budget

**`usePrefersReducedMotion`** — dependency-free, SSR-safe (server snapshot = `false`). Used by every recipe above:

```tsx
// lib/use-prefers-reduced-motion.ts
import { useSyncExternalStore } from 'react';
const QUERY = '(prefers-reduced-motion: reduce)';
const sub = (cb: () => void) => {
  const m = window.matchMedia(QUERY);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
export const usePrefersReducedMotion = () =>
  useSyncExternalStore(sub, () => window.matchMedia(QUERY).matches, () => false);
```

**SSR rule (all of these):** anything driving a `<canvas>`, WebGL, or rAF must live in a `'use client'` component. R3F-based effects (shadergradient, threejs) additionally MUST be imported via `next/dynamic` with `{ ssr: false }`, or `next build` throws `window is not defined`. The lighter canvas shaders (paper) tolerate being a normal client component, but still render only after hydration — give them an on-brand `loading`/placeholder color so there's no flash.

**Perf budget:**
- Backdrop effects render behind content with `position: absolute; inset: 0` and the content layered at `z-10` — the effect must never be the LCP element.
- Cap to one WebGL/canvas context per page; each is real GPU + main-thread cost.
- Pause offscreen where the API allows (`speed={0}`/static swap) — a backdrop scrolled out of view should not keep burning frames.
- Measure with Lighthouse at craft Step 4a. If the effect drops performance below 90 on a content site, it loses — swap to the CSS mesh.

---

## Anti-Slop Bans (Match-and-Refuse)

- **Default shader palettes.** `MeshGradient`'s `['#e0eaff','#241d9a','#f75092','#9f50d3']` and shadergradient's stock pink/orange ARE the banned AI rainbow. Shipping any shader with its default colors is an audit failure.
- **Frantic speed.** `speed: 1` on an ambient backdrop. Ambient = `0.1–0.2`.
- **Stacking effects.** Gradient + glass + liquid-metal + 3D on one page. One signature moment, full stop.
- **Effect over unreadable text.** Animated color shifting behind body copy, or a gradient that drops headline contrast below AA. The content always wins.
- **Looping a logo forever.** Liquid-metal or 3D logo cycling in a header the user sees on every scroll. Reveal once; settle to static.
- **Blank-rectangle fallback.** No `prefers-reduced-motion` / no-WebGL still frame. A dead grey box where the hero should be is worse than no effect.

---

## Verified Packages (npm view, 2026-07-04)

| Package | Version | License | React | Notes |
|---|---|---|---|---|
| `@paper-design/shaders-react` | 0.0.77 | **PolyForm Shield 1.0.0** (noncompete, source-available) | 18 \|\| 19 | Zero-dep canvas shaders; 29 components incl. `MeshGradient`, `LiquidMetal`, `FlutedGlass`, `Water`, `Dithering`. Pre-1.0 API may shift — pin the version. |
| `@shadergradient/react` | 2.4.20 | MIT | 18 \|\| 19 | Needs `@react-three/fiber` + `three` + `three-stdlib` + `camera-controls`. R3F v9 ↔ React 19. |
| `liquid-glass-react` | 1.1.1 | MIT | >=19 | Displacement is **Chromium-only**; Safari/Firefox degrade to frosted blur. |
| `@react-three/fiber` | 9.6.1 | MIT | >=19 <19.3 | The 3D base — see threejs skill (SK-007). The bare `react-three-fiber` name is the deprecated old package; always use the scoped `@react-three/*`. |

---

**Avoid**: Shipping any shader at its default palette or default speed. More than one signature effect per page. Glass with nothing behind it, or as load-bearing legibility in Safari/Firefox. R3F effects imported without `dynamic({ ssr: false })`. Looping logo/3D in high-frequency UI. Any effect without a `prefers-reduced-motion` still frame. Using paper-design shaders in a product that competes with paper.design.
