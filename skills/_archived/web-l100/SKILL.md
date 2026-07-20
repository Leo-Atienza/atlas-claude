<!--
id: SK-083
name: web-l100
description: Vanguard Web Architecture — orchestrates the entire web stack through Render Tiers (Static → Cached → Dynamic → Interactive → Generative). CSS-First principle, streaming pipeline, automated CWV. Load this for ANY web project.
keywords: vanguard, l100, web-architecture, render-tiers, css-first, streaming, ppr, animation, performance, cwv, premium-web, landing-page, dashboard, website
version: 2.1.0
-->

# Vanguard Web Architecture

## The Thesis

The web platform hit an inflection point. Three converging trends killed the old model:

1. **CSS Ascendancy** — CSS now handles popovers, anchor positioning, scroll animations, container responsiveness, parent-aware styling, and specificity architecture. JavaScript is retreating to business logic.
2. **Streaming Everything** — PPR streams static shells instantly. Suspense streams dynamic content. AI SDK streams text, objects, and components. Everything is incremental and progressive.
3. **Zero-JS First** — Ship zero JavaScript by default. Add it only for genuine interactivity. Every byte of JS you ship is a byte the user pays for.

**This skill is the CONDUCTOR.** It tells you which specialist skill to load and when. Load this first, then load the specialist skill for the specific technique you need.

---

## The Decision System

Run this at the START of every web task.

### Step 1: Classify Every Component by Render Tier

| Tier | Renders | JS Shipped | Example |
|------|---------|-----------|---------|
| **T0: Static** | Build time, CDN forever | None | Nav, footer, marketing copy, icons |
| **T1: Cached** | Server, `use cache` + cacheLife | None | Blog posts, product cards, stats, catalog |
| **T2: Dynamic** | Request time, Suspense-wrapped | None (server) | User prefs, notifications, cart count |
| **T3: Interactive** | Client hydration | Minimal | Animations, forms, drag-and-drop, charts |
| **T4: Generative** | AI streaming, progressive | AI SDK | Chat, generated summaries, smart search |

**Classification rules:**
- Does it read cookies/headers/searchParams? → **T2** minimum
- Does it use useState/useEffect/onClick? → **T3** minimum
- Does it call streamText/useChat? → **T4**
- Does it fetch data that changes? → **T1** with cacheLife
- None of the above? → **T0**

**Cardinal rule: Start at T0, only escalate when forced.**

### Step 2: CSS-First Check (for would-be T3 components)

Before making a component T3 (client-side), ask:

| Can CSS do it? | How | Tier drops to |
|---|---|---|
| Parent-aware styling | `:has()` selector | T0 |
| Component-responsive layout | Container Queries `@container` | T0 |
| Dropdown / tooltip / menu | Popover API + Anchor Positioning | T0 |
| Scroll detection (sticky, scrollable) | scroll-state queries | T0 |
| Modal with focus trap | `<dialog>` + `showModal()` | T0 |
| Scroll reveal / parallax | `animation-timeline: view()` | T0 |
| Dark mode toggle | `light-dark()` + `color-scheme` | T0 |
| Height animation | `grid-template-rows` transition | T0 |

If none apply → T3 is correct. Load the appropriate specialist skill.

### Step 3: Streaming Architecture

Arrange tiers in the page, outermost to innermost:

```
T0 Static Shell (instant from CDN — nav, layout, footer)
  └─ T1 Cache Slots (use cache boundaries — content, stats)
      └─ T2 Suspense Boundaries (skeleton → streamed content)
          └─ T3 Client Islands (hydrated interactive components)
              └─ T4 AI Streams (progressive token-by-token rendering)
```

- Use `<Activity mode="hidden">` to pre-render anticipated T2/T3 content offscreen
- Use `<ViewTransition>` for smooth navigation between pages
- Use Speculation Rules for near-zero-latency predicted navigations

### Step 4: Animation Layer (T3 components only)

Use the Layer Cake to assign one animation tool per element:

```
Layer 5 — 3D / WebGL / Canvas
  → Three.js / R3F + Drei (SK-007) for code-driven 3D
  → Spline (SK-095) for design-driven 3D
  → GSAP driving shader uniforms, frameloop synced via SALA

Layer 4 — Complex Scroll Timelines
  → GSAP ScrollTrigger + Lenis (SK-042/044 + SK-048)
  → Pinned sections, scrubbed timelines, SplitText reveals

Layer 3 — Scroll Reveals & Batch Animation
  → CSS animation-timeline: view() (zero JS, GPU-composited) — THIS IS T0!
  → Anime.js (SK-093) for >20 element stagger reveals, text effects
  → OR ScrollTrigger.batch() for staggered reveals

Layer 2 — React Component Animations
  → Motion (SK-047) — modals, drawers, tabs, hovers, list reorders, entrances, layoutId

Layer 1 — Micro-interactions
  → Pure CSS transitions on transform + opacity — THIS IS T0!

Layer 0 — Page Transitions
  → MPA: Barba.js (SK-094) — GSAP timeline hooks, prefetch
  → SPA/Next.js: View Transitions API + Motion AnimatePresence (fallback)

→ For multi-library orchestration, load **cinematic-web-engine** (SK-096) — SALA, Layer Ownership, Motion Tokens
```

**Rule:** GSAP and Motion both write to `element.style`. Never let two tools animate the same property on the same element. One tool per element.

---

## The Skill Map

| Tier | Task | Load Skill | ID |
|------|------|-----------|-----|
| T0 | CSS-first components, :has(), @layer, container queries | `css-first-ui` | SK-084 |
| T0-T1 | Cache architecture, `use cache`, cacheLife, cacheTag | `next-cache-components` | SK-030 |
| T1-T2 | Streaming, `<Activity>`, `<ViewTransition>`, cache hierarchy | `streaming-cache` | SK-085 |
| T3 | React component animations (springs, layout, gestures) | `motion-animation` | SK-047 |
| T3 | Scroll timelines, pins, SplitText, Flip | `gsap` + `gsap-advanced` | SK-042/044 |
| T3 | Smooth momentum scroll | `lenis-smooth-scroll` | SK-048 |
| T3 | Data fetching, caching, mutations | `tanstack-ecosystem` | SK-055 |
| T4 | AI streaming UI, tool→component, generative UI | `ai-native-ui` | SK-086 |
| T3 | Batch stagger reveals, text effects | `anime-js` | SK-093 |
| T3 | MPA page transitions (GSAP orchestrated) | `barba-js` | SK-094 |
| T3 | Design-driven 3D scenes (Spline editor) | `spline-3d` | SK-095 |
| All | Multi-library animation orchestration | `cinematic-web-engine` | SK-096 |
| All | Native browser APIs (popover, dialog, view transitions) | `web-platform-apis` | SK-054 |
| All | Design aesthetics, typography, color, anti-slop | `frontend-design` | SK-005 |
| All | Next.js App Router conventions | `next-best-practices` | SK-029 |
| All | React composition patterns | `vercel-composition-patterns` | SK-032 |
| All | React/Next.js performance (62 rules) | `vercel-react-best-practices` | SK-033 |
| All | Testing | `vitest-testing` | SK-056 |
| All | Build tooling (Biome, Lightning CSS, Turbopack) | `modern-build-pipeline` | SK-087 |
| All | shadcn components | shadcn MCP | MCP |
| All | Deployment | `deploy-to-vercel` | SK-028 |

---

## CSS-First Replacement Matrix

Before reaching for a JS library, check if CSS can do it natively.

| Old JS Pattern | CSS-First Replacement | JS Savings |
|---|---|---|
| Floating UI / Popper.js / Tippy.js | Popover API + CSS Anchor Positioning | ~15KB |
| Custom dropdown positioning | `position-anchor` + `position-area` + `position-try-fallbacks` | ~15KB |
| IntersectionObserver scroll reveals (AOS) | `animation-timeline: view()` | ~8KB |
| Custom modal + focus trap library | `<dialog>` + `showModal()` | ~5KB |
| JS responsive logic / resize observer | Container Queries `@container` | varies |
| JS parent-aware class toggling | `:has()` selector | varies |
| JS scroll detection (header shrink, etc.) | scroll-state queries `@container scroll-state(stuck)` | varies |
| JS specificity management | `@layer` architecture | 0 (architecture) |
| JS color mode toggle | `light-dark()` + `color-scheme` property | ~2KB |
| CSS-in-JS runtime (styled-components) | Tailwind CSS v4 + CSS Nesting | ~20KB runtime |
| PostCSS + autoprefixer + cssnano | Lightning CSS | faster builds |
| ESLint + Prettier (2 configs) | Biome 2.0 (1 config, 100x faster) | faster DX |
| `<link rel="prefetch">` | Speculation Rules API | smarter prefetching |
| `history.pushState` + `popstate` | Navigation API (progressive) | cleaner API |

---

## Animation Decision Matrix

| Situation | Tool | Why |
|---|---|---|
| React component entrance | Motion `initial/animate` | Spring physics, declarative |
| Button/card hover | Motion `whileHover` + spring | No refs, springs |
| Modal/drawer open/close | Motion `AnimatePresence` | Exit animations built-in |
| List reorder / layout shift | Motion `layout` prop | Automatic measurement |
| Shared element between routes | Motion `layoutId` | Cross-component animation |
| Page transition | `<ViewTransition>` + AnimatePresence fallback | Native + progressive |
| Parallax in React | Motion `useScroll` + `useTransform` | Zero re-renders |
| Text character/word reveal | GSAP `SplitText` + `autoSplit` | Can't do in Motion |
| Pinned scroll section | GSAP `ScrollTrigger` + Lenis | Full timeline control |
| Multi-element scroll choreography | GSAP timeline + `ScrollTrigger` | Sequencing |
| Batch entrance reveals | `ScrollTrigger.batch()` | Efficient batching |
| Simple fade-in (no JS needed) | CSS `animation-timeline: view()` | **Zero bundle cost** |
| Smooth scroll momentum | Lenis | 3KB, native scrollTo |
| WebGL shader animation | GSAP `ticker` driving uniforms | Precise control |
| Mouse follower / cursor lag | `gsap.quickTo()` | 60fps with lag |
| SVG morph | GSAP `MorphSVG` | No alternative |
| Skeleton loading | Pure CSS shimmer | No JS, no layout shift |
| `prefers-reduced-motion` | `gsap.matchMedia()` | Kill animations safely |

---

## Project Setup

```bash
npm install gsap @gsap/react lenis motion
# Bundle: GSAP ~28KB + ScrollTrigger ~24KB + Lenis ~3KB + Motion ~18KB = ~73KB gzipped
```

### Foundation: Lenis + GSAP Sync

```typescript
// lib/lenis.ts
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLenis(): Lenis {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
```

```tsx
// app/providers.tsx
'use client';
import { useEffect, useRef } from 'react';
import { initLenis } from '@/lib/lenis';
import type Lenis from 'lenis';

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    lenisRef.current = initLenis();
    return () => lenisRef.current?.destroy();
  }, []);

  return <>{children}</>;
}
```

### Lenis CSS (required)

```css
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
```

### Disable Lenis on Touch

```typescript
const lenis = new Lenis({ smoothWheel: !('ontouchstart' in window) });
```

---

## Spring Tokens

```typescript
// lib/springs.ts
export const springs = {
  motion: {
    snappy:   { type: 'spring', stiffness: 400, damping: 30 } as const,
    standard: { type: 'spring', stiffness: 300, damping: 25 } as const,
    gentle:   { type: 'spring', stiffness: 200, damping: 20 } as const,
    bouncy:   { type: 'spring', stiffness: 300, damping: 10 } as const,
  },
  gsap: {
    snappy:   { duration: 0.4, ease: 'back.out(1.4)' },
    standard: { duration: 0.6, ease: 'power3.out' },
    gentle:   { duration: 0.8, ease: 'power2.out' },
    bouncy:   { duration: 0.7, ease: 'elastic.out(1, 0.5)' },
  },
} as const;
```

**Cardinal rule:** `springs.motion.snappy` for ALL interactive elements. Never `ease-in-out` on anything a user touches.

---

## Performance Budget

> Full checklist: [references/performance-budget.md](references/performance-budget.md)

### Core Web Vitals Targets
- **LCP < 2.5s** — hero image `fetchPriority="high"`, inline critical CSS, PPR shell
- **INP < 200ms** — no long tasks > 50ms, use `scheduler.yield()` for heavy operations
- **CLS < 0.1** — `width`/`height` or `aspect-ratio` on all media, no injected content above fold

### Bundle Targets
- Total animation JS < 80KB gzipped
- Tree-shake Motion: `import { motion } from 'motion/react'`
- GSAP plugins loaded dynamically where used
- Decorative canvas/3D via `requestIdleCallback`

### Streaming + Navigation
- Speculation Rules for predicted navigations (Shopify: 180ms faster)
- View Transitions for smooth visual handoff between routes
- `<Activity mode="hidden">` for offscreen pre-rendering of likely next routes
- `content-visibility: auto` on below-fold sections

### React 19+
- React Compiler enabled (`reactCompiler: true`)
- No manual `useMemo`/`useCallback`/`React.memo` (compiler handles it)
- Server Components for static content, Client Components only for interactivity
- `use cache` for cacheable server functions

### Responsive: Mobile Simplification

```typescript
const mm = gsap.matchMedia();
mm.add({
  isDesktop: '(min-width: 1024px)',
  isMobile: '(max-width: 1023px)',
  reduceMotion: '(prefers-reduced-motion: reduce)',
}, (context) => {
  const { isDesktop, reduceMotion } = context.conditions!;
  if (reduceMotion) { gsap.set('.animated', { clearProps: 'all' }); return; }
  if (isDesktop) { initDesktopAnimations(); }
  else {
    ScrollTrigger.batch('.reveal', {
      onEnter: (els) => gsap.from(els, {
        opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out',
      }),
      start: 'top 90%', once: true,
    });
  }
});
```

---

## The Full Vanguard Stack

```
Architecture:  Vanguard (SK-083) — Render Tiers, CSS-First, streaming pipeline
Design:        frontend-design (SK-005) — aesthetics, typography, color, anti-slop
CSS Engine:    css-first-ui (SK-084) — @layer, container queries, :has(), native components
Components:    shadcn/ui + Aceternity UI + Magic UI (MCP)
Framework:     Next.js 16 App Router + React 19.2 Compiler
Streaming:     streaming-cache (SK-085) — PPR, Activity, ViewTransition, cache hierarchy
Styling:       Tailwind CSS v4 + CSS Nesting + Lightning CSS
Animation:     Motion (SK-047) + GSAP (SK-042/044) + Lenis (SK-048) + Anime.js (SK-093) — orchestrated by Cinematic Web Engine (SK-096)
3D:            Three.js/R3F (SK-007) + Spline (SK-095) — lazy-loaded, SALA-synced
Scroll:        Lenis → GSAP ScrollTrigger → CSS Scroll-Driven (simple reveals)
Transitions:   View Transitions API + Barba.js (SK-094, MPA) + AnimatePresence fallback
Data:          TanStack Query (SK-055) + Server Actions + Zustand (client state)
AI:            ai-native-ui (SK-086) — streaming UI, generative components
Testing:       Vitest (SK-056) + Playwright (SK-009)
Performance:   vercel-react-best-practices (SK-033) + Speculation Rules + Activity
Build:         modern-build-pipeline (SK-087) — Biome, Lightning CSS, Turbopack
Native APIs:   web-platform-apis (SK-054) — popover, dialog, anchor, scroll-driven
Deployment:    Vercel (SK-028)
```
