<!--
id: SK-057
name: web-l100
description: L100 Web — orchestration guide for building iPhone-smooth websites using Motion, GSAP, Lenis, View Transitions, and modern APIs
keywords: l100, premium-web, animation-architecture, smooth, iphone, apple, motion-gsap, scroll-animation, page-transition, skeleton, hero, landing-page, awwwards
version: 1.0.0
-->

# L100 Web — Building iPhone-Smooth Websites

## When to Use This Skill

**Auto-activate when:** building a website, landing page, product page, dashboard, or any web UI where quality matters. This is the CONDUCTOR skill — it tells you which specialist skill to load and when.

**This skill does NOT replace specialist skills.** It orchestrates them. Load this first, then load the specialist skill for the specific technique you need.

## The Skill Map

| Task | Load Skill | ID |
|------|-----------|-----|
| React component animations | `motion-animation` | SK-047 |
| Scroll timelines, pins, SplitText | `gsap` + `gsap-advanced` | SK-042/044 |
| Smooth momentum scroll | `lenis-smooth-scroll` | SK-048 |
| Native browser APIs (popover, dialog, view transitions) | `web-platform-apis` | SK-054 |
| Data fetching, caching, mutations | `tanstack-ecosystem` | SK-055 |
| Unit/component testing | `vitest-testing` | SK-056 |
| Advanced JS/TS patterns | `advanced-javascript` | SK-045 |
| Next.js architecture | `next-best-practices` | SK-029 |
| React performance (62 rules) | `vercel-react-best-practices` | SK-033 |
| Design aesthetics, typography, color | `frontend-design` | SK-005 |
| shadcn components | shadcn MCP | MCP-002 |
| Deployment | `deploy-to-vercel` | SK-028 |

---

## The Layer Cake — Which Tool Owns Which Layer

Every animated element belongs to exactly ONE layer. Never let two tools fight over the same element.

```
Layer 5 — 3D / WebGL / Canvas
  → Three.js + React Three Fiber + GSAP driving shader uniforms
  → Product visualizers, backgrounds, particle effects
  → Canvas/SVG text layout: @chenglou/pretext (off-DOM measurement, no reflow)

Layer 4 — Complex Scroll Timelines
  → GSAP ScrollTrigger + Lenis
  → Pinned sections, scrubbed timelines, parallax, SplitText reveals

Layer 3 — Scroll Reveals (simple)
  → CSS Scroll-Driven Animations (zero JS, GPU-composited)
  → OR ScrollTrigger.batch() for staggered reveals
  → Fade-ins, content reveals, progress bars

Layer 2 — React Component Animations
  → Motion (framer-motion)
  → Modals, drawers, tabs, card hovers, list reorders, entrances

Layer 1 — Micro-interactions
  → Pure CSS transitions on transform + opacity
  → Button hovers, focus rings, skeleton pulses, nav highlights

Layer 0 — Page Transitions
  → View Transitions API (progressive) + Motion AnimatePresence (fallback)
```

**Rule:** GSAP and Motion both write to `element.style`. If both animate the same property on the same element, the last write wins = flickering. Assign one tool per element.

---

## The Animation Decision Matrix

| Situation | Tool | Why |
|---|---|---|
| React component entrance | Motion `initial/animate` | Spring physics, declarative |
| Button/card hover | Motion `whileHover` + spring | No refs needed, springs |
| Modal/drawer open/close | Motion `AnimatePresence` | Exit animations built-in |
| List reorder / layout shift | Motion `layout` prop | Automatic measurement |
| Page transition | `template.tsx` AnimatePresence + View Transitions API | Cross-browser |
| Parallax in React | Motion `useScroll` + `useTransform` | No re-renders |
| Text character/word reveal | GSAP `SplitText` | Can't do this in Motion |
| Pinned scroll section | GSAP `ScrollTrigger` + Lenis | Full timeline control |
| Multi-element scroll choreography | GSAP timeline + `ScrollTrigger` | Sequencing |
| "Animate once on enter" (many elements) | `ScrollTrigger.batch()` | Efficient batching |
| Simple fade-in (no JS needed) | CSS `animation-timeline: view()` | Zero bundle cost |
| Smooth scroll momentum | Lenis | 3KB, native scrollTo |
| WebGL shader animation | GSAP `ticker` driving uniforms | Precise control |
| Mouse follower / cursor lag | `gsap.quickTo()` | 60fps with lag |
| SVG morph | GSAP `MorphSVG` | No alternative |
| Skeleton loading | Pure CSS shimmer | No JS, no layout shift |
| `prefers-reduced-motion` | `gsap.matchMedia()` | Kill animations safely |

---

## Project Setup (Next.js)

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

```css
/* globals.css — required for Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
```

### Page Transitions

```tsx
// app/template.tsx — re-renders on every navigation
'use client';
import { motion, AnimatePresence } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

```css
/* Progressive: View Transitions API when available */
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: 200ms ease both fade-out; }
::view-transition-new(root) { animation: 300ms ease both fade-in; }
@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }
```

---

## Spring Tokens — Define Once, Use Everywhere

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

**Cardinal rule:** `springs.motion.snappy` for ALL interactive elements (buttons, toggles, cards, drawers). Never `ease-in-out` on anything a user touches.

---

## Hero Section Pattern

Motion handles structural entrance. GSAP handles text splitting. CSS handles decorative effects.

```tsx
'use client';
import { useRef } from 'react';
import { motion } from 'motion/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { springs } from '@/lib/springs';

gsap.registerPlugin(SplitText);

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const split = SplitText.create(headingRef.current, {
      type: 'words,chars',
      mask: 'chars',
    });
    gsap.from(split.chars, {
      yPercent: 110,
      stagger: { amount: 0.4, from: 'start' },
      duration: 0.7,
      ease: 'power3.out',
      delay: 0.3,
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="hero">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.motion.standard, delay: 0.1 }}
        className="hero__eyebrow"
      >
        Introducing v2.0
      </motion.p>

      <h1 ref={headingRef} className="hero__heading">
        Build something extraordinary
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.motion.snappy, delay: 0.7 }}
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={springs.motion.snappy}
          className="hero__cta"
        >
          Get started
        </motion.button>
      </motion.div>
    </section>
  );
}
```

---

## Scroll Section Patterns

### Pinned Product Showcase (GSAP)

```tsx
'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=3000',
        pin: true,
        scrub: 1,
      },
    });

    tl.from('.product-3d', { y: 80, opacity: 0, duration: 1 });
    tl.from('.feature-item', {
      x: -40, opacity: 0, stagger: 0.15, duration: 0.6,
    }, '<0.3');
    tl.to('.section-bg', { backgroundColor: '#0a0a0a', duration: 0.5 }, '<');

  }, { scope: containerRef });

  return <section ref={containerRef} className="product-showcase">{/* ... */}</section>;
}
```

### Staggered Card Reveals (GSAP Batch)

```tsx
useGSAP(() => {
  ScrollTrigger.batch('.card', {
    onEnter: (elements) =>
      gsap.from(elements, {
        opacity: 0, y: 30, stagger: 0.1,
        duration: 0.6, ease: 'power2.out',
      }),
    start: 'top 85%',
    once: true,
  });
});
```

### Simple Fade-In (CSS Only — Zero JS)

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal {
  animation: fade-in-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
```

### Parallax (Motion — React)

```tsx
function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);

  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
```

---

## Component Patterns

### Modal (Motion)

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
      />
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={springs.motion.snappy}
      />
    </>
  )}
</AnimatePresence>
```

### Tab Switch (Motion)

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {tabContent[activeTab]}
  </motion.div>
</AnimatePresence>
```

### Card with Hover (Motion container, GSAP text)

```tsx
function Card({ title }: { title: string }) {
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const split = SplitText.create(textRef.current, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 100, stagger: 0.05, duration: 0.5, ease: 'power3.out',
      scrollTrigger: { trigger: textRef.current, start: 'top 80%', once: true },
    });
  });

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={springs.motion.snappy}
      className="card"
    >
      <h3 ref={textRef}>{title}</h3>
    </motion.div>
  );
}
```

### List with Layout Animation (Motion)

```tsx
<motion.ul layout>
  <AnimatePresence>
    {items.map(item => (
      <motion.li
        key={item.id}
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -200 }}
        transition={springs.motion.standard}
      >
        {item.name}
      </motion.li>
    ))}
  </AnimatePresence>
</motion.ul>
```

---

## Loading & Perceived Performance

### Skeleton Screens (CSS only, no spinners)

```css
.skeleton {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted-foreground) / 0.1) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Hero Image (BlurHash + Progressive)

```tsx
function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative">
      <div className={cn('hero-blur', loaded && 'opacity-0')} />
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn('hero-img', loaded ? 'opacity-100' : 'opacity-0')}
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
```

### Speculation Rules (Prerender Next Pages)

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "href_matches": "/products/*" },
    "eagerness": "moderate"
  }],
  "prefetch": [{
    "where": { "href_matches": "/*" },
    "eagerness": "conservative"
  }]
}
</script>
```

### Native APIs First

| Old pattern | L100 replacement |
|---|---|
| Custom JS modal | `<dialog>` + `showModal()` |
| JS tooltip library (Tippy, Popper) | Popover API + CSS Anchor Positioning |
| JS scroll reveal library | CSS `animation-timeline: view()` |
| Custom dropdown positioning | CSS `position-anchor` + `position-area` |
| Preloading via JS | Speculation Rules API |

---

## Responsive: Mobile Simplification

Premium sites reduce animation complexity on mobile. Desktop gets full choreography; mobile gets simple entrance fades.

```typescript
const mm = gsap.matchMedia();

mm.add({
  isDesktop: '(min-width: 1024px)',
  isMobile: '(max-width: 1023px)',
  reduceMotion: '(prefers-reduced-motion: reduce)',
}, (context) => {
  const { isDesktop, reduceMotion } = context.conditions!;

  if (reduceMotion) {
    gsap.set('.animated', { clearProps: 'all' });
    return;
  }

  if (isDesktop) {
    // Full: SplitText, parallax, pins, horizontal scroll
    initDesktopAnimations();
  } else {
    // Mobile: fade + translateY only, no pins, no parallax
    ScrollTrigger.batch('.reveal', {
      onEnter: (els) => gsap.from(els, {
        opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out',
      }),
      start: 'top 90%',
      once: true,
    });
  }
});
```

```typescript
// Disable Lenis on touch — native iOS momentum is better
const lenis = new Lenis({
  smoothWheel: !('ontouchstart' in window),
});
```

---

## Performance Checklist

### GPU & Rendering
- [ ] Only animate `transform` + `opacity` (GPU-composited)
- [ ] `will-change` only on elements animating immediately on load — remove after
- [ ] `content-visibility: auto` on below-fold sections (call `ScrollTrigger.refresh()` when revealed)
- [ ] No layout thrashing — never read then write DOM in a loop
- [ ] Virtual lists: use `@chenglou/pretext` for item height measurement — avoids reflow per item
- [ ] Canvas/SVG text: use `@chenglou/pretext` `layout()` instead of DOM `getBoundingClientRect`

### Bundle
- [ ] Total animation JS < 80KB gzipped
- [ ] Tree-shake Motion imports: `import { motion } from 'motion/react'`
- [ ] GSAP plugins loaded only where used (dynamic import for SplitText, MorphSVG)
- [ ] Decorative canvas/3D initialized via `requestIdleCallback` (not on load)

### Core Web Vitals
- [ ] LCP < 2.5s — hero image `fetchPriority="high"`, inline critical CSS
- [ ] INP < 200ms — no long tasks > 50ms, use `scheduler.yield()` in heavy operations
- [ ] CLS < 0.1 — `width`/`height` or `aspect-ratio` on all media, no injected content above fold

### Loading
- [ ] Skeleton screens, not spinners
- [ ] BlurHash or tiny placeholder for images
- [ ] Optimistic updates for mutations (UI changes immediately, syncs in background)
- [ ] Speculation Rules for predicted navigation

### Accessibility
- [ ] `prefers-reduced-motion` kills all non-essential animation
- [ ] `gsap.matchMedia()` wraps all scroll animations
- [ ] `[data-lenis-prevent]` on scrollable sub-containers (modals, code blocks)
- [ ] Focus management in modals (`<dialog>` handles this natively)

### React 19+
- [ ] React Compiler enabled (`reactCompiler: true`)
- [ ] No manual `useMemo`/`useCallback`/`React.memo` (compiler handles it)
- [ ] Server Components for static content, Client Components only for interactivity
- [ ] `use cache` for cacheable server functions (Next.js 16)

---

## The Full L100 Stack Summary

```
Design:       frontend-design (SK-005) — aesthetics, typography, color
Components:   shadcn/ui + Aceternity UI + Magic UI (MCP)
Framework:    Next.js 16 App Router (SK-029) + React 19 Compiler
Styling:      Tailwind CSS v4
Animation:    Motion (SK-047) + GSAP (SK-042/044) + Lenis (SK-048)
Scroll:       Lenis foundation → GSAP ScrollTrigger orchestration → CSS Scroll-Driven for simple reveals
Transitions:  View Transitions API (SK-054) + AnimatePresence fallback
Data:         TanStack Query (SK-055) + Zustand (client state)
Testing:      Vitest (SK-056) + Playwright (SK-009)
Performance:  vercel-react-best-practices (SK-033) — 62 rules
Modern JS:    advanced-javascript (SK-045) — TC39, TypeScript patterns
Native APIs:  web-platform-apis (SK-054) — popover, dialog, anchor, speculation
Text Measure: @chenglou/pretext — off-DOM height/layout for virtualization + Canvas/SVG
Deployment:   Vercel (SK-028) or Netlify (MCP)
```
