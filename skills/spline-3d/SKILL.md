<!--
id: SK-095
name: spline-3d
description: Spline 3D runtime — design-to-web 3D scenes, lazy loading, event handling, React/Next.js integration, performance optimization
keywords: spline, 3d-design, spline-runtime, interactive-3d, design-to-code, splinecode, 3d-web, react-spline, next-spline, vendor-lock-in
version: 1.0.0
-->

# Spline 3D Runtime

## When to Use This Skill

Use Spline for **Layer 5 "design-driven"** 3D in the Cinematic Web Engine (SK-096). Spline is a visual 3D design tool with a web runtime — designers create scenes in the Spline app, export `.splinecode` files, and developers embed them on the web.

**Choose Spline when:** a designer iterates on 3D visuals, you need a hero section showcase, or you want interactive 3D without writing Three.js code.

**Choose Three.js/R3F instead when:** you need programmatic control over geometry/shaders, custom WebGL effects, game-like interactivity, or open-source tooling. See **threejs** (SK-007).

**Vendor lock-in warning:** The Spline runtime is **closed-source** (proprietary). You cannot inspect, audit, or fork the code. If Spline, Inc. changes pricing or sunsets the product, your scenes become unusable. Always have a Three.js/R3F fallback path for critical features.

## Installation

```bash
# Vanilla JS
npm install @splinetool/runtime

# React
npm install @splinetool/react-spline

# Next.js (includes SSR handling)
npm install @splinetool/react-spline
```

## Vanilla JS Setup

```javascript
import { Application } from '@splinetool/runtime';

const canvas = document.getElementById('canvas3d');
const spline = new Application(canvas);

spline.load('https://your-cdn.com/scene.splinecode').then(() => {
  // Scene loaded — interact with objects
  const button = spline.findObjectByName('Button');
  console.log(button.position, button.rotation, button.scale);
});
```

## React Integration

```tsx
'use client';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';
import { useRef } from 'react';

export function HeroScene() {
  const splineRef = useRef<Application>();

  function onLoad(spline: Application) {
    splineRef.current = spline;
    // Access objects after load
    const obj = spline.findObjectByName('Logo');
  }

  return (
    <Spline
      scene="https://your-cdn.com/scene.splinecode"
      onLoad={onLoad}
    />
  );
}
```

## Next.js Integration

Lazy-load to avoid SSR issues and reduce initial bundle:

```tsx
// components/SplineScene.tsx
'use client';
import Spline from '@splinetool/react-spline';

export default function SplineScene() {
  return <Spline scene="https://your-cdn.com/scene.splinecode" />;
}

// app/page.tsx
import dynamic from 'next/dynamic';

const SplineScene = dynamic(() => import('@/components/SplineScene'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gradient-to-b from-gray-900 to-black animate-pulse" />
  ),
});

export default function Page() {
  return (
    <section className="relative h-[600px]">
      <SplineScene />
    </section>
  );
}
```

## Event Handling

```tsx
function InteractiveScene() {
  function onMouseDown(e: any) {
    // e.target.name — name of the Spline object
    if (e.target.name === 'Button') {
      console.log('Button clicked!');
    }
  }

  function onMouseHover(e: any) {
    // Fires when hovering over interactive objects
    console.log('Hovering:', e.target.name);
  }

  return (
    <Spline
      scene="/scene.splinecode"
      onMouseDown={onMouseDown}
      onMouseHover={onMouseHover}
    />
  );
}
```

### Available Events

| Event | Description |
|-------|-------------|
| `onMouseDown` | Click/tap on an object |
| `onMouseUp` | Release click on an object |
| `onMouseHover` | Mouse enters an object |
| `onKeyDown` | Keyboard press (when canvas focused) |
| `onKeyUp` | Keyboard release |
| `onLoad` | Scene fully loaded |

### Controlling Objects Programmatically

```typescript
const spline = splineRef.current;

// Find objects
const obj = spline.findObjectByName('Cube');
const objs = spline.findObjectsByType('Mesh');

// Modify properties
obj.position.x = 100;
obj.rotation.y = Math.PI / 4;
obj.scale.set(1.5, 1.5, 1.5);
obj.visible = false;

// Trigger Spline events
spline.emitEvent('mouseDown', 'Button');

// Set variables (if defined in Spline)
spline.setVariable('score', 42);
```

## Performance Optimization

**This is the critical section.** Spline scenes are heavy — the runtime alone is 500KB+, and complex scenes add more. Without optimization, Lighthouse scores crater.

### Lazy Loading with IntersectionObserver

Only initialize Spline when the section scrolls into view:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false });

export function LazySplineScene({ scene }: { scene: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }  // Start loading 200px before visible
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[600px]">
      {isVisible ? (
        <Spline scene={scene} />
      ) : (
        <div className="h-full bg-gray-900 animate-pulse" />
      )}
    </div>
  );
}
```

### Self-Host Scene Files

Always self-host `.splinecode` files on your own CDN. Never rely on Spline's default CDN for production:

1. Export as `.splinecode` from Spline app
2. Upload to your CDN (Vercel, Cloudflare R2, S3)
3. Reference the self-hosted URL

### Scene Optimization (In Spline Editor)

- Reduce polygon count — use simplified geometry for web
- Minimize materials — each material = separate draw call
- Reduce texture sizes — max 1024x1024 for web scenes
- Limit lights — 2-3 lights maximum
- Disable shadows if not critical
- Remove unused objects from the scene

### Performance Budget

| Item | Size | Note |
|------|------|------|
| Spline runtime | ~500KB | Fixed cost, cannot reduce |
| Simple scene | 200-500KB | Hero section, product showcase |
| Complex scene | 1-5MB | Interactive demos, games |

**Rule:** Use Spline for exactly ONE hero/showcase section per page. Never scatter multiple Spline scenes across a page. For additional 3D elements, use Three.js/R3F (lighter, more control).

## GSAP Integration

Drive Spline object properties from GSAP animations:

```typescript
const spline = splineRef.current;
const obj = spline.findObjectByName('Hero');

// Animate Spline object position with GSAP
gsap.to(obj.position, {
  x: 100,
  y: 50,
  duration: 1.5,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
  },
});

// Animate rotation on scroll
gsap.to(obj.rotation, {
  y: Math.PI * 2,
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});
```

## Limitations

- **Closed-source runtime** — cannot inspect, audit, or fork
- **Large bundle** — 500KB+ minimum, plus scene file weight
- **No WebGPU path** — stuck on WebGL, no next-gen renderer support
- **No custom shaders** — limited to Spline's built-in materials
- **No offline/self-contained** — runtime loads from npm, scenes from URL
- **Vendor lock-in** — scenes are proprietary `.splinecode` format
- **Mobile performance** — complex scenes struggle on lower-end mobile devices
- **No tree-shaking** — runtime is monolithic

For full 3D control, custom shaders, WebGPU, or open-source requirements, use **Three.js/R3F** (SK-007).

## Best Practices

- Always lazy-load with IntersectionObserver — never initialize on page load
- Self-host `.splinecode` files on your CDN
- Optimize scenes in Spline editor (polygons, materials, textures)
- Use for ONE hero/showcase section per page maximum
- Provide a static fallback (image or CSS gradient) while loading
- Test on mobile devices — complex scenes may need a static fallback on mobile
- Keep GSAP-driven Spline animations simple (position, rotation, scale only)

## Do Not

- Use multiple Spline scenes on one page — each creates a WebGL context
- Skip lazy loading — the 500KB+ runtime blocks initial page load
- Build critical features solely on Spline — vendor lock-in risk
- Expect Spline to handle interactive 3D games — use Three.js/R3F instead
- Use Spline for below-fold decorative elements — the weight isn't justified
