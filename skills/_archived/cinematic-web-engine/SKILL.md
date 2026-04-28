<!--
id: SK-096
name: cinematic-web-engine
description: Cinematic Web Engine — unified animation orchestration across GSAP, Lenis, Anime.js, Barba.js, Spline, Three.js/R3F via SALA, Layer Ownership, Motion Tokens, and performance budgets
keywords: cinematic, orchestrator, sala, animation-loop, layer-ownership, motion-tokens, gsap-lenis, animation-architecture, web-animation, 3d-web, page-transition, unified-animation, awwwards
version: 1.0.0
-->

# Cinematic Web Engine

## When to Use This Skill

Load when building a **premium web experience that uses MORE THAN ONE animation library simultaneously**. If you are only using GSAP, only using Motion, or only using Three.js, load the individual skill instead. This skill teaches how to **orchestrate multiple animation tools** without conflicts, clock drift, or performance regressions.

**This skill extends Vanguard** (SK-083). Load Vanguard first for Render Tiers and CSS-First principles, then load this skill for the animation orchestration layer.

**Individual skill references:**
- GSAP Core (SK-042) + Advanced (SK-044) — timelines, ScrollTrigger, plugins
- Lenis (SK-048) — smooth momentum scroll
- Motion (SK-047) — React component animation
- Anime.js (SK-093) — lightweight batch animation
- Barba.js (SK-094) — MPA page transitions
- Spline (SK-095) — design-driven 3D
- Three.js/R3F (SK-007) — code-driven 3D

---

## The Three Laws of Cinematic Web

### Law 1: One Clock (SALA)

All animation systems read from GSAP's ticker. No independent `requestAnimationFrame` loops. One clock = zero drift between scroll position and animation progress.

### Law 2: One Owner

Each DOM element is animated by **exactly one tool**. GSAP and Motion both write to `element.style` — if two tools animate the same property on the same element, they fight. One tool per element, no exceptions.

### Law 3: One Budget

Total animation JavaScript < **120KB gzipped**. Every library earns its bytes or gets cut. Decorative weight that doesn't serve the user gets removed.

---

## Single Animation Loop Architecture (SALA)

The core technical innovation. All animation systems share GSAP's RAF ticker — no independent loops.

### Why SALA Matters

Without SALA, each library runs its own `requestAnimationFrame`:
- Lenis updates scroll position in frame N
- GSAP reads scroll position from frame N-1 (one frame behind)
- Three.js renders with frame N-2 data

Result: visible jitter between scroll, animation, and 3D. SALA eliminates this by making all systems read from the same clock in the same frame.

### Complete SALA Implementation

```typescript
// lib/sala.ts — Single Animation Loop Architecture
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

interface SALAInstance {
  lenis: Lenis;
  destroy: () => void;
}

export function initSALA(): SALAInstance {
  // 1. Lenis reads from GSAP's ticker (NOT its own RAF)
  const lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);

  const lenisRaf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(lenisRaf);
  gsap.ticker.lagSmoothing(0);

  // 2. Three.js/R3F: set frameloop="never" on Canvas,
  //    then advance from GSAP ticker (see R3F SALA Sync section)

  // 3. Anime.js: use engine.tick() in GSAP ticker if needed

  return {
    lenis,
    destroy() {
      lenis.destroy();
      gsap.ticker.remove(lenisRaf);
    },
  };
}
```

### React / Next.js SALA Provider

```tsx
// providers/SALAProvider.tsx
'use client';
import { useEffect, useRef, createContext, useContext } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';

gsap.registerPlugin(ScrollTrigger);

const SALAContext = createContext<{ lenisRef: React.RefObject<LenisRef | null> } | null>(null);

export function SALAProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <SALAContext.Provider value={{ lenisRef }}>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
        {children}
      </ReactLenis>
    </SALAContext.Provider>
  );
}

export const useSALA = () => useContext(SALAContext);
```

### R3F SALA Sync Component

```tsx
// components/SALASync.tsx
'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';

export function SALASync() {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    const tick = () => advance(performance.now() / 1000);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);

  return null;
}

// Usage:
// <Canvas frameloop="never">
//   <SALASync />
//   {/* Scene content */}
// </Canvas>
```

---

## Layer Ownership Model

Extended from Vanguard's Animation Layer Cake. Each layer has a **single owner** — the tool responsible for animating elements at that level.

```
Layer 5 — 3D Immersion
  Code-driven:   Three.js / R3F + Drei (SK-007)
  Design-driven:  Spline (SK-095)
  Sync:           frameloop="never", advanced from GSAP ticker via SALA

Layer 4 — Scroll Choreography
  Owner:          GSAP ScrollTrigger + Lenis (SK-042/044 + SK-048)
  Use for:        Pinned sections, scrubbed timelines, parallax, SplitText reveals
  Sync:           Lenis → GSAP ticker via SALA

Layer 3 — Batch & Lightweight
  Owner:          Anime.js (SK-093)
  Use for:        >20 element stagger reveals, text effects, simple micro-sequences
  Fallback:       ScrollTrigger.batch() if Anime.js not in project

Layer 2 — React Component
  Owner:          Motion / Framer Motion (SK-047)
  Use for:        Modals, drawers, tabs, cards, list reorders, hover states, exit animations
  Note:           Motion owns React component lifecycle animation

Layer 1 — CSS-Native (ZERO JavaScript)
  Owner:          Pure CSS
  Use for:        Transitions on transform+opacity, scroll-driven animations (animation-timeline: view())
  Cost:           0 bytes JS, GPU-composited

Layer 0 — Page Transitions
  MPA:            Barba.js (SK-094) — GSAP timeline hooks, prefetch
  SPA/Next.js:    ViewTransition API + Motion AnimatePresence
  Sync:           Barba kills ScrollTriggers + Lenis on leave, recreates on enter
```

### Ownership Conflict Resolution

When two tools could handle the same element:

| Conflict | Resolution | Reason |
|----------|-----------|--------|
| GSAP vs Motion on same element | GSAP for scroll-driven, Motion for interaction-driven | GSAP owns scroll axis, Motion owns user input |
| Anime.js vs GSAP for stagger | Anime.js if >20 elements + simple; GSAP if timeline control needed | Anime.js is lighter for batch operations |
| CSS vs any JS for hover | CSS always wins for hover states | Zero JS, zero overhead |
| CSS `animation-timeline` vs ScrollTrigger | CSS for simple reveals, ScrollTrigger for orchestrated sequences | CSS is T0 (free), ScrollTrigger is T3 |
| Spline vs R3F | Spline for designer-owned visuals, R3F for developer-owned features | Ownership follows who iterates on the asset |
| Motion vs GSAP for modal | Motion for standard modals, GSAP if complex choreography | Motion's AnimatePresence handles exit natively |

**Cardinal rule:** If you catch yourself adding a second animation tool to an element, stop and choose one.

---

## Motion Token System

Unified easing/timing tokens that produce **visually identical motion** across all libraries. Define once, use everywhere — ensures consistent motion language across the entire site.

```typescript
// lib/motion-tokens.ts

export const cinematicTokens = {
  snappy: {
    gsap:   { duration: 0.4, ease: 'back.out(1.4)' },
    motion: { type: 'spring' as const, stiffness: 400, damping: 30 },
    anime:  { duration: 400, easing: 'easeOutBack' },
    css:    '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  standard: {
    gsap:   { duration: 0.6, ease: 'power3.out' },
    motion: { type: 'spring' as const, stiffness: 300, damping: 25 },
    anime:  { duration: 600, easing: 'easeOutCubic' },
    css:    '0.6s cubic-bezier(0.33, 1, 0.68, 1)',
  },
  gentle: {
    gsap:   { duration: 0.8, ease: 'power2.out' },
    motion: { type: 'spring' as const, stiffness: 200, damping: 20 },
    anime:  { duration: 800, easing: 'easeOutQuad' },
    css:    '0.8s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  cinematic: {
    gsap:   { duration: 1.2, ease: 'expo.out' },
    motion: { type: 'spring' as const, stiffness: 100, damping: 20 },
    anime:  { duration: 1200, easing: 'easeOutExpo' },
    css:    '1.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

// Usage examples — consistent motion regardless of which library owns the element:

// GSAP (Layer 4 — scroll choreography)
gsap.to('.hero-text', { ...cinematicTokens.cinematic.gsap, y: 0, autoAlpha: 1 });

// Motion (Layer 2 — React component)
// <motion.div transition={cinematicTokens.snappy.motion} />

// Anime.js (Layer 3 — batch stagger)
animate('.card', { translateY: [30, 0], opacity: [0, 1], ...cinematicTokens.standard.anime });

// CSS (Layer 1 — zero JS)
// .element { transition: transform ${cinematicTokens.standard.css}; }
```

**Rule:** `cinematicTokens.snappy` for ALL interactive elements (buttons, cards, toggles). Never `ease-in-out` on anything a user touches — always ease-out for responsiveness.

---

## Performance Budget

```
Total Animation Budget: 120KB gzipped
├── GSAP Core + ScrollTrigger: ~52KB  (mandatory — the animation backbone)
├── Lenis:                      ~3KB  (mandatory — smooth scroll)
├── Motion:                    ~18KB  (if React project)
├── Anime.js:                  ~17KB  (optional — Layer 3 batch animations)
├── Remaining for 3D:          ~30KB  (budget for 3D runtime)
│   ├── Three.js/R3F: lazy-loaded, code-split (not in initial bundle)
│   └── Spline: lazy-loaded, IntersectionObserver (not in initial bundle)
└── Barba.js:                   ~7KB  (MPA only, not needed in SPA)
```

### Frame Budget

16ms per frame (60fps). SALA guarantees a single RAF, so all animation work must complete within one frame:

```
GSAP ticker fires →
  1. Lenis.raf() updates scroll position (~0.1ms)
  2. ScrollTrigger.update() reads scroll, fires triggers (~0.5ms)
  3. GSAP tweens execute (~1-3ms)
  4. Anime.js animations execute (~0.5ms)
  5. R3F advance() renders 3D scene (~2-8ms)
  ─────────────────────────────────
  Total: must stay under 16ms
```

### Core Web Vitals Targets

- **LCP < 2.5s** — lazy-load 3D, inline critical CSS, PPR shell
- **INP < 200ms** — no long animation tasks > 50ms
- **CLS < 0.1** — dimensions on all animated elements before animation starts

### Monitoring

```typescript
// Frame budget monitor (dev only)
gsap.ticker.add(() => {
  const fps = gsap.ticker.fps;
  if (fps < 55) console.warn(`Frame drop: ${fps.toFixed(0)}fps`);
});

// Three.js draw call monitor
console.log(renderer.info.render.calls, 'draw calls');
console.log(renderer.info.render.triangles, 'triangles');
```

---

## Project Templates

### Template A: MPA Marketing Site (Full Cinematic)

Barba.js + GSAP + Lenis + Anime.js + Spline hero

```bash
npm install @barba/core @barba/prefetch gsap lenis animejs @splinetool/runtime
# Bundle: ~79KB (no Motion needed — not React)
```

```
Layers active: L0 (Barba), L1 (CSS), L3 (Anime.js), L4 (GSAP+Lenis), L5 (Spline)
```

### Template B: Next.js App (SPA + Interactive 3D)

ViewTransition + Lenis + GSAP + Motion + R3F

```bash
npm install gsap @gsap/react lenis motion three @react-three/fiber @react-three/drei
# Core bundle: ~73KB (Three.js/R3F lazy-loaded separately)
```

```
Layers active: L0 (ViewTransition), L1 (CSS), L2 (Motion), L4 (GSAP+Lenis), L5 (R3F)
```

### Template C: Portfolio / Showcase (Minimal)

Lenis + GSAP + Motion + CSS scroll-driven animations

```bash
npm install gsap @gsap/react lenis motion
# Bundle: ~73KB
```

```
Layers active: L0 (ViewTransition), L1 (CSS), L2 (Motion), L4 (GSAP+Lenis)
```

---

## Integration Recipes

### Recipe 1: GSAP + Lenis + ScrollTrigger (The Foundation)

Every cinematic site starts here. See SALA implementation above, plus:

```typescript
// Scroll-driven parallax with GSAP + Lenis
gsap.to('.hero-image', {
  y: -200,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

// SplitText character reveal
SplitText.create('.heading', {
  type: 'chars',
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.chars, {
      opacity: 0,
      y: 40,
      rotateX: -90,
      stagger: 0.02,
      duration: 0.8,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: self.elements[0],
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  },
});
```

### Recipe 2: Barba.js + GSAP + Lenis (MPA Transitions)

See full implementation in **barba-js** (SK-094). Key pattern: kill ScrollTriggers + Lenis on leave, recreate on enter.

### Recipe 3: Three.js/R3F + GSAP Scroll-Driven 3D

Camera position and shader uniforms driven by scroll:

```tsx
function ScrollDriven3D() {
  const meshRef = useRef<Mesh>(null!);

  useGSAP(() => {
    gsap.to(meshRef.current.rotation, {
      y: Math.PI * 2,
      scrollTrigger: {
        trigger: '.scene-section',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    });
    gsap.to(meshRef.current.position, {
      z: -5,
      scrollTrigger: {
        trigger: '.scene-section',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.4, 100, 16]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
```

### Recipe 4: Motion + GSAP on the Same Page

Ownership boundaries — Motion handles React components, GSAP handles scroll:

```tsx
// Modal (Motion owns this — AnimatePresence for exit)
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={cinematicTokens.snappy.motion}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>

// Scroll section (GSAP owns this — ScrollTrigger for scrub)
// These are DIFFERENT elements — no ownership conflict
useGSAP(() => {
  gsap.to('.parallax-bg', {
    y: -200,
    scrollTrigger: { trigger: '.section', scrub: true },
  });
});
```

### Recipe 5: Anime.js Batch Reveals + GSAP Scroll Detection

Use GSAP ScrollTrigger for scroll detection, Anime.js for the element animation:

```typescript
import { animate } from 'animejs';
import { stagger } from 'animejs/stagger';

ScrollTrigger.batch('.reveal-card', {
  onEnter: (elements) => {
    animate(elements, {
      opacity: [0, 1],
      translateY: [40, 0],
      delay: stagger(60),
      ...cinematicTokens.standard.anime,
    });
  },
  start: 'top 85%',
  once: true,
});
```

---

## prefers-reduced-motion Strategy

Unified approach across all 6 libraries. One `gsap.matchMedia()` context handles everything:

```typescript
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: reduce)', () => {
  // 1. Kill Lenis smooth scroll — use native scroll
  lenis?.destroy();

  // 2. Set all GSAP animations to instant
  gsap.globalTimeline.timeScale(100);

  // 3. Disable Anime.js animations
  // (don't initialize Anime.js animations in this context)

  // 4. Spline/Three.js — render static frame only
  // (set frameloop="demand" and don't call advance)

  // 5. Motion — set instant transitions
  // Pass { duration: 0 } to all motion transitions

  // 6. CSS — browser handles prefers-reduced-motion natively
  // (no action needed if using @media queries)

  return () => {
    // Cleanup when user toggles preference back
  };
});

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Full cinematic experience
  initSALA();
  initAnimations();
});
```

---

## Debugging & Diagnostics

### GSAP DevTools (Dev Only)

```typescript
if (process.env.NODE_ENV === 'development') {
  gsap.registerPlugin(GSDevTools);
  GSDevTools.create({ animation: masterTimeline });
}
```

### ScrollTrigger Markers

```typescript
ScrollTrigger.defaults({ markers: process.env.NODE_ENV === 'development' });
```

### Lenis Velocity Monitor

```typescript
lenis.on('scroll', ({ velocity }) => {
  if (Math.abs(velocity) > 10) console.warn('High scroll velocity:', velocity);
});
```

### Three.js Stats

```typescript
import Stats from 'three/addons/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);
gsap.ticker.add(() => stats.update());
```

### Frame Budget Overlay (Dev Only)

```typescript
if (process.env.NODE_ENV === 'development') {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;right:0;background:black;color:lime;padding:4px 8px;font:12px monospace;z-index:9999';
  document.body.appendChild(overlay);
  gsap.ticker.add(() => {
    overlay.textContent = `${gsap.ticker.fps.toFixed(0)}fps`;
    overlay.style.color = gsap.ticker.fps < 55 ? 'red' : 'lime';
  });
}
```

---

## Best Practices

- Initialize SALA before any animations — it must be the first thing that runs
- Never let two animation tools write to the same element's properties
- Use Motion Tokens for consistent motion language across all libraries
- Lazy-load 3D (Three.js/R3F and Spline) — never in the initial bundle
- Kill all ScrollTriggers and Lenis before page transitions
- Use `gsap.matchMedia()` as the single source of truth for responsive + reduced-motion
- Monitor frame budget in development — fix drops before they ship
- Cap DPR at 1.5 for 3D scenes — users can't perceive the difference above this

## Do Not

- Run multiple `requestAnimationFrame` loops — use SALA
- Animate the same CSS property from two different tools on the same element
- Ship GSDevTools or ScrollTrigger markers to production
- Use Spline for more than one scene per page
- Use Barba.js in a React/Next.js SPA — use ViewTransition API
- Exceed 120KB gzipped for total animation JavaScript
- Skip `prefers-reduced-motion` handling — it's an accessibility requirement
- Use `ease-in-out` on interactive elements — always use ease-out for responsiveness
