<!--
id: SK-094
name: barba-js
description: Barba.js page transitions — MPA smooth transitions, GSAP orchestration, view lifecycle, prefetch, cross-page animation choreography
keywords: barba, page-transition, mpa, smooth-transition, view-lifecycle, prefetch, cross-page, pjax, history-api, leave-enter
version: 1.0.0
-->

# Barba.js Page Transitions

## When to Use This Skill

Use Barba.js for **Layer 0** in the Cinematic Web Engine (SK-096): smooth page transitions in **Multi-Page Architecture (MPA)** sites. Barba.js intercepts link clicks, fetches the next page via XHR, and swaps a container element — creating SPA-like transitions on traditional server-rendered sites.

**CRITICAL: Barba.js is MPA-only.** It is NOT compatible with:
- Next.js (App Router or Pages Router)
- React SPAs (React Router, TanStack Router)
- Any client-side routed framework

**For SPAs/Next.js, use instead:**
- `<ViewTransition>` component (React 19+ / Next.js 15+) — see SK-054
- Motion `AnimatePresence` — see SK-047
- View Transitions API (native browser) — see SK-054

**Good fit for:** Static sites (Astro, 11ty, Hugo), WordPress, PHP sites, vanilla HTML/JS sites, agency portfolio sites.

## Installation

```bash
npm install @barba/core @barba/prefetch
```

Optional: `@barba/css` for CSS-only transitions (no JS needed).

## Core Concepts

```html
<!-- Required DOM structure -->
<body>
  <!-- Wrapper: persists across pages -->
  <div data-barba="wrapper">
    <nav><!-- Navigation persists --></nav>

    <!-- Container: gets swapped on transition -->
    <main data-barba="container" data-barba-namespace="home">
      <!-- Page content -->
    </main>
  </div>
</body>
```

- **Wrapper** (`data-barba="wrapper"`): The persistent outer element. Never animated.
- **Container** (`data-barba="container"`): The content that gets swapped. This is what you animate.
- **Namespace** (`data-barba-namespace`): Identifies the page type for per-page transitions.

## Basic Setup

```javascript
import barba from '@barba/core';

barba.init({
  transitions: [{
    leave({ current }) {
      // Animate current page out — return a Promise or GSAP timeline
      return gsap.to(current.container, { opacity: 0, duration: 0.5 });
    },
    enter({ next }) {
      // Animate next page in
      return gsap.from(next.container, { opacity: 0, duration: 0.5 });
    },
  }],
});
```

## GSAP Orchestration (Primary Pattern)

The canonical pattern: return GSAP timelines from Barba hooks.

```javascript
import barba from '@barba/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

barba.init({
  transitions: [{
    name: 'fade-slide',

    leave({ current }) {
      // 1. Kill all ScrollTriggers before page leaves
      ScrollTrigger.getAll().forEach(t => t.kill());

      // 2. Animate out — return timeline (Barba waits for it)
      const tl = gsap.timeline();
      tl.to(current.container, { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' });
      return tl;
    },

    enter({ next }) {
      // 3. Animate in
      const tl = gsap.timeline();
      tl.from(next.container, { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' });
      return tl;
    },

    afterEnter() {
      // 4. Re-initialize page-specific animations
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    },
  }],
});
```

### Critical: ScrollTrigger Cleanup

**Always kill ScrollTriggers on page leave.** Stale triggers from the previous page will cause layout issues and memory leaks.

```javascript
leave({ current }) {
  // Kill ALL ScrollTriggers
  ScrollTrigger.getAll().forEach(t => t.kill());
  // Kill all GSAP tweens
  gsap.killTweensOf('*');
  return gsap.to(current.container, { opacity: 0, duration: 0.4 });
},
```

## Lenis Integration

Destroy and recreate Lenis on each page transition:

```javascript
import Lenis from 'lenis';

let lenis;

function initLenis() {
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

barba.init({
  transitions: [{
    leave({ current }) {
      // Destroy Lenis before page leave
      lenis?.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
      return gsap.to(current.container, { opacity: 0, duration: 0.4 });
    },
    afterEnter() {
      // Recreate Lenis for new page
      window.scrollTo(0, 0);
      initLenis();
      // Initialize page-specific animations here
    },
  }],
});

// Initial page load
initLenis();
```

## Named Transitions

Route-specific transitions using `from`/`to` namespace rules:

```javascript
barba.init({
  transitions: [
    {
      name: 'home-to-project',
      from: { namespace: ['home'] },
      to: { namespace: ['project'] },
      leave({ current }) {
        return gsap.timeline()
          .to('.grid-item', { scale: 0.8, opacity: 0, stagger: 0.05 })
          .to(current.container, { opacity: 0 }, '-=0.2');
      },
      enter({ next }) {
        return gsap.timeline()
          .from(next.container, { opacity: 0 })
          .from('.project-hero', { y: 100, opacity: 0, duration: 0.8 }, '-=0.3');
      },
    },
    {
      name: 'default',
      // Fallback for all other routes
      leave({ current }) {
        return gsap.to(current.container, { opacity: 0, duration: 0.3 });
      },
      enter({ next }) {
        return gsap.from(next.container, { opacity: 0, duration: 0.3 });
      },
    },
  ],
});
```

## View Lifecycle

Per-page initialization using views:

```javascript
barba.init({
  views: [
    {
      namespace: 'home',
      beforeEnter() {
        // Runs before enter transition
      },
      afterEnter() {
        // Initialize home-specific JS (carousels, scroll animations, etc.)
        initHomeAnimations();
      },
      beforeLeave() {
        // Cleanup before leaving home
        destroyHomeAnimations();
      },
    },
    {
      namespace: 'about',
      afterEnter() {
        initAboutAnimations();
      },
    },
  ],
  transitions: [/* ... */],
});
```

## Prefetch Plugin

Prefetch pages on link hover for near-instant transitions:

```javascript
import barba from '@barba/core';
import barbaPrefetch from '@barba/prefetch';

barba.use(barbaPrefetch);

barba.init({
  // prefetch is now active — pages are fetched on hover
  transitions: [/* ... */],
});
```

## CSS Transitions (No JS)

For simple transitions without JavaScript:

```javascript
import barba from '@barba/core';
import barbaCss from '@barba/css';

barba.use(barbaCss);

barba.init({
  transitions: [{
    name: 'fade',
    // CSS classes are automatically added/removed:
    // .fade-leave, .fade-leave-active, .fade-leave-to
    // .fade-enter, .fade-enter-active, .fade-enter-to
  }],
});
```

```css
.fade-leave-active,
.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-leave-to,
.fade-enter {
  opacity: 0;
}
```

## Hooks Reference

| Hook | Timing | Use For |
|------|--------|---------|
| `beforeLeave` | Before leave animation | Cleanup, kill animations |
| `leave` | Leave animation | Animate current page out |
| `afterLeave` | After leave completes | Remove event listeners |
| `beforeEnter` | Before enter animation | Prepare next page DOM |
| `enter` | Enter animation | Animate next page in |
| `afterEnter` | After enter completes | Initialize page JS, scroll reset |

All hooks receive `{ current, next, trigger }` data object.

## Preventing Links

```html
<!-- Barba ignores these -->
<a href="/file.pdf" data-barba-prevent>Download PDF</a>
<a href="/external" data-barba-prevent="self">External</a>

<!-- Entire section -->
<div data-barba-prevent="all">
  <a href="/link1">Ignored</a>
  <a href="/link2">Ignored</a>
</div>
```

## Limitations

- **No React/Next.js/SPA compatibility** — Barba manages routing, conflicts with client-side routers
- **Analytics re-firing** — Must manually trigger page views in `afterEnter`
- **Script re-execution** — Inline `<script>` tags in the new page don't auto-execute; use view lifecycle hooks
- **Third-party widgets** — May need reinitialization (chat widgets, embeds, etc.)
- **Low maintenance** — Functionally complete but last npm publish was ~2 years ago
- **Small community** — ~491 GitHub stars; limited recent community content

## Best Practices

- Always kill ScrollTriggers and GSAP tweens in `leave` or `beforeLeave`
- Always reset scroll position in `afterEnter` (`window.scrollTo(0, 0)`)
- Always destroy and recreate Lenis on page transition
- Use `@barba/prefetch` for perceived performance improvement
- Keep transitions under 800ms total — users notice delays beyond this
- Use `data-barba-prevent` on download links, external links, and auth pages

## Do Not

- Use Barba.js in a React/Next.js/SPA project — use ViewTransition API instead
- Forget to kill ScrollTriggers on page leave — causes memory leaks and broken layouts
- Animate the wrapper element — only animate containers and their children
- Skip `afterEnter` initialization — page-specific JS won't run
- Use both `leave` and `once` transitions without testing the initial page load
