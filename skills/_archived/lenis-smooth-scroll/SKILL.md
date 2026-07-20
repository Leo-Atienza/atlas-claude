<!--
id: SK-048
name: lenis-smooth-scroll
description: Lenis — lightweight smooth scroll library (3KB) with GSAP and framework integration
keywords: lenis, smooth-scroll, momentum-scroll, scroll, gsap-integration, scroll-trigger, horizontal-scroll, virtual-scroll
version: 1.1.0
-->

## When to Use This Skill
Apply when implementing smooth momentum scrolling. Lenis (3KB) is the 2026 industry standard, replacing locomotive-scroll and custom implementations. **Always pair with GSAP ScrollTrigger for scroll-driven animations.** Auto-activate on keywords: smooth-scroll, lenis, momentum-scroll, scroll-hijack.

## Installation
```bash
npm install lenis
```

## Basic Setup
```js
import Lenis from 'lenis';

const lenis = new Lenis({
  duration: 1.2,          // scroll duration (seconds)
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // default easing
  orientation: 'vertical', // 'vertical' | 'horizontal'
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  infinite: false,         // infinite scroll mode
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

## GSAP ScrollTrigger Integration (Primary Use Case)
```js
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();

// Sync Lenis with GSAP's ticker
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Now use ScrollTrigger as normal — Lenis handles the smooth scroll physics
gsap.to('.hero', {
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
  y: -100,
  opacity: 0,
});
```

## React / Next.js Integration
```tsx
// components/SmoothScroll.tsx
'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}

// With GSAP in React
'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useLenisGsap() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return lenisRef;
}
```

## Horizontal Scroll
```js
const lenis = new Lenis({
  orientation: 'horizontal',
  gestureOrientation: 'both', // allow both mouse wheel and touch
  wrapper: document.querySelector('.horizontal-wrapper'),
  content: document.querySelector('.horizontal-content'),
});
```

## Scroll-To (Programmatic)
```js
// Scroll to element
lenis.scrollTo('#section-2');
lenis.scrollTo(document.querySelector('.target'));

// Scroll to position
lenis.scrollTo(500);          // 500px
lenis.scrollTo('top');        // scroll to top
lenis.scrollTo('bottom');     // scroll to bottom

// With options
lenis.scrollTo('#section', {
  offset: -100,              // offset in px
  duration: 2,               // override default duration
  easing: (t) => t,          // linear for this scroll
  immediate: false,           // true = instant, no animation
  lock: false,                // prevent user from scrolling during animation
  onComplete: () => {},       // callback when scroll completes
});
```

## Events and Methods
```js
// Listen to scroll events
lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
  console.log({ scroll, velocity, progress });
});

// Control
lenis.stop();               // pause scrolling
lenis.start();              // resume scrolling
lenis.destroy();            // cleanup

// Properties
lenis.scroll;               // current scroll position
lenis.progress;             // 0 to 1
lenis.velocity;             // current velocity
lenis.isScrolling;          // boolean
lenis.direction;            // 1 (down) or -1 (up)
```

## CSS Required
```css
html.lenis, html.lenis body {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}
.lenis.lenis-stopped {
  overflow: hidden;
}
```

## Performance Notes
- Lenis is 3KB gzipped — negligible bundle cost
- Uses native `scrollTo` under the hood — no fake scroll containers
- `[data-lenis-prevent]` attribute on elements that need native scroll (e.g., modals, code blocks)
- Destroy on cleanup — prevent memory leaks in SPA navigation
- Pair with `content-visibility: auto` on long pages for render optimization

## Common Patterns

**Scroll-locked sections (snap):**
```js
// Pair with GSAP ScrollTrigger pin
gsap.to('.panel', {
  scrollTrigger: {
    trigger: '.panel',
    start: 'top top',
    pin: true,
    pinSpacing: true,
    snap: 1,
  },
});
```

**Infinite scroll:**
```js
const lenis = new Lenis({ infinite: true });
```

**Disable on mobile (if needed):**
```js
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const lenis = new Lenis({ smoothWheel: !isMobile });
```

## ReactLenis Wrapper (Official)

The official React wrapper from `lenis/react`. Use with `autoRaf: false` when integrating with GSAP (SALA pattern).

```tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
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
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
```

**Critical:** `autoRaf: false` prevents Lenis from running its own RAF loop — GSAP's ticker drives it instead (Single Animation Loop Architecture). See **cinematic-web-engine** (SK-096) for the full SALA pattern.

### useLenis Hook

Access the Lenis instance inside any component:

```tsx
import { useLenis } from 'lenis/react';

function ScrollProgress() {
  useLenis(({ scroll, progress, velocity }) => {
    // Runs on every scroll frame
    console.log({ scroll, progress, velocity });
  });
  return null;
}
```
