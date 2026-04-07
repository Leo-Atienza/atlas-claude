<!--
id: SK-093
name: anime-js
description: Anime.js v4 — modular lightweight animation with ScrollObserver, draggable, text effects, WAAPI engine, TypeScript
keywords: anime, animejs, lightweight-animation, waapi, scroll-observer, text-animation, stagger, svg-animation, draggable, batch-animation
version: 1.0.0
-->

# Anime.js v4

## When to Use This Skill

Use Anime.js for **Layer 3** in the Cinematic Web Engine (SK-096): batch stagger reveals, lightweight micro-sequences, text effects, and simple scroll-linked animations. Anime.js is ~17KB gzipped with excellent tree-shaking (17 submodules).

**Choose Anime.js when:** >20 elements need staggered reveal, you need simple text/SVG animation, you want the smallest bundle for lightweight effects, or you need MIT licensing.

**Choose GSAP instead when:** you need complex timeline nesting, ScrollTrigger pinning/scrub, plugin ecosystem (Flip, Draggable, MorphSVG), or Webflow integration.

**Choose Motion instead when:** you need React component animation (springs, layout, gestures, exit).

**Risk note:** Solo maintainer (Julian Garnier). Bus factor risk. Fallback: GSAP `ScrollTrigger.batch()` covers the primary stagger-reveal use case.

## Installation

```bash
npm install animejs
```

v4 is TypeScript-first with 17 tree-shakeable submodules.

## Core API

### animate()

```typescript
import { animate } from 'animejs';

// Basic animation
animate('.box', {
  translateX: 250,
  rotate: '1turn',
  duration: 800,
  easing: 'easeInOutQuad',
});

// Multiple properties with different timings
animate('.element', {
  translateX: { value: 250, duration: 800 },
  rotate: { value: '1turn', duration: 1800 },
  scale: [
    { value: 1.4, duration: 200, easing: 'easeInOutQuad' },
    { value: 1, duration: 600, easing: 'easeOutElastic' },
  ],
});
```

### Modular Imports (Tree-Shaking)

```typescript
// Import only what you need — sideEffects: false
import { animate } from 'animejs';                    // Core
import { timeline } from 'animejs/timeline';           // Timeline
import { stagger } from 'animejs/stagger';             // Stagger utility
import { createDraggable } from 'animejs/draggable';   // Draggable
import { onScroll } from 'animejs/scroll';             // Scroll observer
import { createScope } from 'animejs/scope';           // React scope
import { svg } from 'animejs/svg';                     // SVG utilities
import { utils } from 'animejs/utils';                 // Utility functions
```

### Targets

```typescript
// CSS selector
animate('.class', { ... });

// DOM element
animate(document.querySelector('#id'), { ... });

// NodeList / Array
animate(document.querySelectorAll('.items'), { ... });

// Object properties
const obj = { value: 0 };
animate(obj, { value: 100, duration: 1000, update: () => el.textContent = obj.value });
```

## Stagger

```typescript
import { stagger } from 'animejs/stagger';

// Basic stagger
animate('.item', {
  translateY: [-20, 0],
  opacity: [0, 1],
  delay: stagger(100),           // 100ms between each
});

// From center
animate('.item', {
  scale: [0, 1],
  delay: stagger(100, { from: 'center' }),
});

// Grid stagger
animate('.grid-item', {
  scale: [0, 1],
  delay: stagger(50, { grid: [14, 5], from: 'center' }),
});

// Range stagger (distributes evenly)
animate('.item', {
  translateX: stagger([0, 300]),  // First: 0, last: 300, rest interpolated
});
```

## Easing

```typescript
// Built-in easings
'linear'
'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo'
'easeInBack' | 'easeOutBack' | 'easeInOutBack'
'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic'
'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce'

// Spring physics (v4)
'spring(mass, stiffness, damping, velocity)'
'spring(1, 100, 10, 0)'

// Steps
'steps(5)'

// Cubic bezier
'cubicBezier(0.25, 0.1, 0.25, 1.0)'
```

## Timeline

```typescript
import { timeline } from 'animejs/timeline';

const tl = timeline({
  defaults: { duration: 600, easing: 'easeOutExpo' },
});

tl.add('.first', { translateX: 250 })
  .add('.second', { translateY: 50 }, '-=400')    // overlap by 400ms
  .add('.third', { rotate: '1turn' }, '+=200');   // delay 200ms after previous

// Control
tl.play();
tl.pause();
tl.reverse();
tl.seek(500);   // ms
tl.restart();
```

## ScrollObserver

Anime.js v4's lightweight scroll-linked animation. Simpler than GSAP ScrollTrigger — no pinning, no scrub smoothing. Good for basic reveals.

```typescript
import { onScroll } from 'animejs/scroll';

// Trigger animation on scroll
onScroll({
  target: '.reveal-section',
  enter: 'top 80%',     // when top of target hits 80% of viewport
  leave: 'bottom 20%',
  onEnter: () => animate('.reveal-section .item', {
    opacity: [0, 1],
    translateY: [30, 0],
    delay: stagger(80),
  }),
});

// Scroll-linked progress
onScroll({
  target: '.parallax-section',
  sync: true,  // ties animation progress to scroll position
  onUpdate: (progress) => {
    // progress: 0 to 1
  },
});
```

## Text Animation

```typescript
import { animate } from 'animejs';

// Character-by-character reveal
animate('.heading', {
  text: {
    value: 'Hello World',
    type: 'chars',     // 'chars' | 'words' | 'lines'
  },
  opacity: [0, 1],
  translateY: [20, 0],
  delay: stagger(30),
  duration: 400,
  easing: 'easeOutExpo',
});
```

## SVG Animation

```typescript
import { svg } from 'animejs/svg';

// Path drawing (stroke-dashoffset)
animate('#path', {
  strokeDashoffset: [svg.getLength('#path'), 0],
  duration: 2000,
  easing: 'easeInOutQuad',
});

// Motion along path
animate('.dot', {
  translateX: svg.pathMotion('#curve', 'x'),
  translateY: svg.pathMotion('#curve', 'y'),
  rotate: svg.pathMotion('#curve', 'angle'),
  duration: 3000,
  easing: 'linear',
});
```

## Draggable

```typescript
import { createDraggable } from 'animejs/draggable';

const draggable = createDraggable('.drag-item', {
  container: '#bounds',
  snap: { x: 50, y: 50 },       // Snap to grid
  releaseEase: 'easeOutElastic', // Spring on release
  onDrag: (x, y) => {},
  onRelease: (x, y) => {},
});

// Cleanup
draggable.destroy();
```

## React Integration

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { createScope } from 'animejs/scope';
import { animate } from 'animejs';

function AnimatedComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope(containerRef.current!);
    scope.add(() => {
      animate('.item', {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100),
      });
    });
    return () => scope.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <div className="item">A</div>
      <div className="item">B</div>
      <div className="item">C</div>
    </div>
  );
}
```

## WAAPI Engine

v4 uses the Web Animations API under the hood for hardware-accelerated animations on `transform` and `opacity`. This means the browser's compositor handles these properties off the main thread when possible.

## Performance

- **Bundle:** ~17KB full, significantly less with tree-shaking (import only needed submodules)
- **Tree-shaking:** `sideEffects: false`, 17 individual export paths
- **GPU acceleration:** WAAPI integration for compositor-friendly properties
- **TypeScript:** Full type definitions included

### When to Choose Anime.js Over GSAP

| Scenario | Anime.js | GSAP |
|----------|----------|------|
| Bundle matters most | ~17KB tree-shakeable | ~52KB (core + ScrollTrigger) |
| MIT license required | MIT | Custom (free, but restrictive) |
| Simple stagger reveals | Excellent | Overkill |
| Complex timelines | Limited nesting | Unlimited nesting |
| Scroll pinning/scrub | Not available | ScrollTrigger |
| Plugin ecosystem | Minimal | Extensive (Flip, Morph, etc.) |

## Best Practices

- Import only the submodules you need — never `import * from 'animejs'`
- Use `createScope()` in React for automatic cleanup
- Prefer WAAPI-friendly properties: `transform`, `opacity`
- For >5 elements, use `stagger()` instead of manual delays
- Combine with GSAP ScrollTrigger for scroll-driven orchestration (Anime.js handles the element animation, ScrollTrigger handles the scroll detection)

## Do Not

- Use Anime.js for complex nested timelines — use GSAP instead
- Use Anime.js ScrollObserver for pinned sections — use GSAP ScrollTrigger
- Mix Anime.js and GSAP on the same element's properties (one owner per element)
- Forget cleanup in React — always call `scope.revert()` in useEffect return
