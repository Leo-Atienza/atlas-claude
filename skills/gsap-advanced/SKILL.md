<!--
id: SK-044
name: gsap-advanced
description: GSAP advanced — ScrollTrigger, plugins (Flip, Draggable, SplitText), React/framework integration
keywords: scrolltrigger, flip, draggable, splittext, usegsap, gsap react, gsap vue, gsap svelte, scroll animation
version: 2.1.0
-->

# GSAP Advanced

## When to Use This Skill

Apply when building scroll-driven animations (ScrollTrigger), using GSAP plugins (Flip, Draggable, SplitText, DrawSVG, MorphSVG, etc.), or integrating GSAP in React, Vue, or Svelte. For core tweens, timelines, and utilities see **gsap** (SK-042). For MPA page transitions with GSAP timeline hooks, see **barba-js** (SK-094).

**Status (2025):** GSAP was acquired by Webflow. All plugins are now **free for all use cases** — no more "Club GreenSock" paywall.

---

## ScrollTrigger

### Registration

Register once before any ScrollTrigger usage:

```javascript
gsap.registerPlugin(ScrollTrigger);
```

### Basic Trigger

```javascript
gsap.to(".box", {
  x: 500,
  duration: 1,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",   // when top of trigger hits center of viewport
    end: "bottom center",
    toggleActions: "play reverse play reverse"
  }
});
```

**start / end** format: `"triggerPosition viewportPosition"` (e.g. `"top top"`, `"center 80%"`). Can also be a number (px from top of scroller) or `"max"`. Use `"clamp(top bottom)"` (v3.12+) to prevent exceeding page bounds. Can be a function receiving the ScrollTrigger instance.

### Key Config Options

| Property | Description |
|---|---|
| **trigger** | Element whose position defines activation (required) |
| **start** | When trigger becomes active. Default `"top bottom"` (`"top top"` if pinned) |
| **end** | When trigger ends. Default `"bottom top"`. Use `endTrigger` for a different element |
| **scrub** | Link to scroll. `true` = direct; number = seconds to "catch up" |
| **toggleActions** | Four actions: onEnter, onLeave, onEnterBack, onLeaveBack. Values: `"play"`, `"pause"`, `"resume"`, `"reset"`, `"restart"`, `"complete"`, `"reverse"`, `"none"`. Default `"play none none none"` |
| **pin** | `true` = pin trigger. Animate children, not the pinned element itself |
| **pinSpacing** | Default `true`; adds spacer to prevent layout collapse |
| **horizontal** | `true` for horizontal scroll |
| **scroller** | Custom scroll container; default is viewport |
| **markers** | `true` for dev markers. Remove in production |
| **once** | Kill ScrollTrigger after first end-pass; animation keeps running |
| **id** | Unique id for `ScrollTrigger.getById(id)` |
| **refreshPriority** | Create ScrollTriggers top-to-bottom; set this when order differs |
| **toggleClass** | Add/remove class when active: string or `{ targets, className }` |
| **snap** | Snap to progress values: number, array, `"labels"`, or config object |
| **containerAnimation** | For fake horizontal scroll (see below) |
| **onEnter/onLeave/onEnterBack/onLeaveBack** | Callbacks; receive ScrollTrigger instance |
| **onUpdate** | Fires when progress changes |

### Scrub

```javascript
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",
    start: "top center",
    end: "bottom center",
    scrub: true   // or number for lag smoothness (e.g. scrub: 1)
  }
});
```

### Pinning

```javascript
scrollTrigger: {
  trigger: ".section",
  start: "top top",
  end: "+=1000",
  pin: true,
  scrub: 1
}
```

`pinSpacing: false` only when layout is managed separately.

### Timeline + ScrollTrigger

Put ScrollTrigger on the **timeline**, not on child tweens:

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "+=2000",
    scrub: 1,
    pin: true
  }
});
tl.to(".a", { x: 100 }).to(".b", { y: 50 }).to(".c", { opacity: 0 });
```

### ScrollTrigger.batch()

Batches callbacks for multiple elements firing at the same time (good alternative to IntersectionObserver):

```javascript
ScrollTrigger.batch(".box", {
  onEnter: (elements, triggers) => {
    gsap.to(elements, { opacity: 1, y: 0, stagger: 0.15 });
  },
  onLeave: (elements, triggers) => {
    gsap.to(elements, { opacity: 0, y: 100 });
  },
  start: "top 80%",
  interval: 0.1,    // max collection window in seconds
  batchMax: 4       // max per batch
});
```

Batched callbacks receive `(elements, triggers)` arrays (not a single ScrollTrigger instance).

### Standalone ScrollTrigger

```javascript
ScrollTrigger.create({
  trigger: "#id",
  start: "top top",
  end: "bottom 50%+=100px",
  onUpdate: self => console.log(self.progress.toFixed(3), self.direction)
});
```

### Fake Horizontal Scroll (containerAnimation)

Pin a section; animate content horizontally as user scrolls vertically. **The horizontal tween must use `ease: "none"`** — critical, breaks sync otherwise.

```javascript
const scrollTween = gsap.to(".horizontal-el", {
  xPercent: () => -(scrollingEl.offsetWidth - window.innerWidth),
  ease: "none",  // REQUIRED
  scrollTrigger: {
    trigger: ".horizontal-el",
    pin: ".horizontal-el-parent",
    start: "top top",
    end: "+=1000",
    scrub: true
  }
});

// Trigger nested elements based on horizontal position
gsap.to(".nested-el", {
  y: 100,
  scrollTrigger: {
    containerAnimation: scrollTween,
    trigger: ".nested-wrapper",
    start: "left center",
    toggleActions: "play none none reset"
  }
});
```

Pinning and snapping are not available on `containerAnimation`-based ScrollTriggers.

### ScrollTrigger.scrollerProxy()

Override scroll reads/writes for third-party smooth scroll libraries:

```javascript
ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (arguments.length) scrollbar.scrollTop = value;
    return scrollbar.scrollTop;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  }
});
scrollbar.addListener(ScrollTrigger.update);
```

### Refresh and Cleanup

```javascript
ScrollTrigger.refresh();                         // after layout changes
ScrollTrigger.getAll().forEach(t => t.kill());   // kill all
ScrollTrigger.getById("my-id")?.kill();          // kill by id
```

Refresh is automatically debounced on viewport resize (200ms). Create ScrollTriggers top-to-bottom on the page; if creating in a different order, set `refreshPriority`.

---

## Plugins

### Registration

Register all plugins once before use:

```javascript
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(ScrollToPlugin, Flip, Draggable);
```

In React, register at app level (not inside a component that re-renders).

### Scroll — ScrollToPlugin

```javascript
gsap.registerPlugin(ScrollToPlugin);
gsap.to(window, { duration: 1, scrollTo: { y: 500 } });
gsap.to(window, { duration: 1, scrollTo: { y: "#section", offsetY: 50 } });
gsap.to(scrollContainer, { duration: 1, scrollTo: { x: "max" } });
```

### ScrollSmoother

> **2026 recommendation:** Prefer **Lenis** (SK-048, 3KB gzipped) over ScrollSmoother (~24KB) for smooth scrolling. Lenis uses native scroll, preserves `position: sticky`, and has better community support. Both integrate with GSAP's ticker — see **cinematic-web-engine** (SK-096) for the canonical SALA pattern.

Smooth scroll wrapper. Requires ScrollTrigger and specific DOM structure:

```html
<body>
  <div id="smooth-wrapper">
    <div id="smooth-content"><!-- ALL CONTENT --></div>
  </div>
</body>
```

Register after ScrollTrigger; see GSAP docs for full setup.

### Flip (Layout Transitions)

Capture state → DOM change → animate from old state to new:

```javascript
gsap.registerPlugin(Flip);

const state = Flip.getState(".item");
// change DOM (reorder, add/remove classes)
Flip.from(state, { duration: 0.5, ease: "power2.inOut" });
```

Key `Flip.from` options: `absolute` (use `position: absolute` during flip), `scale` (default `true`, avoids stretch), `nested`, `simple`, `duration`, `ease`.

Learn more: https://gsap.com/docs/v3/Plugins/Flip

### Draggable

```javascript
gsap.registerPlugin(Draggable, InertiaPlugin);

Draggable.create(".box", { type: "x,y", bounds: "#container", inertia: true });
Draggable.create(".knob", { type: "rotation" });
```

Key options: `type` (`"x"`, `"y"`, `"x,y"`, `"rotation"`), `bounds`, `inertia`, `edgeResistance`, `onDragStart`, `onDrag`, `onDragEnd`, `onThrowComplete`.

### Observer

Normalizes pointer/scroll input for swipe/gesture logic:

```javascript
gsap.registerPlugin(Observer);
Observer.create({
  target: "#area",
  onUp: () => {},
  onDown: () => {},
  tolerance: 10   // px before direction detected
});
```

### SplitText

Splits text into chars, words, and/or lines for per-unit animation:

```javascript
gsap.registerPlugin(SplitText);

const split = SplitText.create(".heading", { type: "words,chars" });
gsap.from(split.chars, { opacity: 0, y: 20, stagger: 0.03, duration: 0.4 });
// Cleanup: split.revert() or let gsap.context() handle it
```

With `autoSplit` and `onSplit` (v3.13+) for responsive re-splitting:

```javascript
SplitText.create(".split", {
  type: "lines",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.lines, { y: 100, opacity: 0, stagger: 0.05, duration: 0.5 });
  }
});
```

Key options:

| Option | Description |
|---|---|
| **type** | `"chars"`, `"words"`, `"lines"` (comma-separated). Only split what's animated |
| **autoSplit** | Re-split on font load or width change; use with `onSplit()` |
| **onSplit(self)** | Callback on each split; return a tween for auto cleanup on re-split |
| **mask** | `"lines"`, `"words"`, or `"chars"` — wraps in overflow:clip wrapper |
| **aria** | `"auto"` (default), `"hidden"`, `"none"` |
| **charsClass/wordsClass/linesClass** | CSS class; append `"++"` for incremented classes |

Tips: Split after fonts load or use `autoSplit: true`. Avoid `text-wrap: balance`. SplitText does not support SVG `<text>`.

Learn more: https://gsap.com/docs/v3/Plugins/SplitText/

### ScrambleText

```javascript
gsap.registerPlugin(ScrambleTextPlugin);
gsap.to(".text", {
  duration: 1,
  scrambleText: { text: "New message", chars: "01", revealDelay: 0.5 }
});
```

### SVG Plugins

**DrawSVG** — reveals/hides stroke by animating `stroke-dashoffset`:

```javascript
gsap.registerPlugin(DrawSVGPlugin);
gsap.from("#path", { duration: 1, drawSVG: 0 });              // draw in
gsap.to("#path", { duration: 1, drawSVG: "20% 80%" });        // stroke in middle only
```

Value = visible segment (`"start end"` in % or length). Element must have visible stroke set via CSS/attributes.

**MorphSVG** — morphs SVG shapes (path data); start/end need not have same point count:

```javascript
gsap.registerPlugin(MorphSVGPlugin);
MorphSVGPlugin.convertToPath("circle, rect, ellipse");  // convert primitives first
gsap.to("#diamond", { duration: 1, morphSVG: "#lightning", ease: "power2.inOut" });
```

Key `morphSVG` options: `shape` (required), `type` (`"linear"` or `"rotational"`), `shapeIndex` (fix twisted morphs), `smooth` (v3.14+), `map`.

**MotionPath** — animates element along SVG path:

```javascript
gsap.registerPlugin(MotionPathPlugin);
gsap.to(".dot", {
  duration: 2,
  motionPath: { path: "#path", align: "#path", alignOrigin: [0.5, 0.5], autoRotate: true }
});
```

### Easing Plugins

- **CustomEase** — custom cubic-bezier or SVG path curves (see gsap core skill)
- **EasePack** — adds SlowMo, RoughEase, ExpoScaleEase
- **CustomWiggle** / **CustomBounce** — wiggle/bounce easing variants

### Development

**GSDevTools** — timeline scrubber UI; development only, do not ship:

```javascript
gsap.registerPlugin(GSDevTools);
GSDevTools.create({ animation: tl });
```

---

## React Integration

### Installation

```bash
npm install gsap @gsap/react
```

### useGSAP Hook (Preferred)

```javascript
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP); // register once at app level

const containerRef = useRef(null);

useGSAP(() => {
  gsap.to(".box", { x: 100 });
  gsap.from(".item", { opacity: 0, stagger: 0.1 });
}, { scope: containerRef }); // scope scopes selectors to container
```

With dependencies and `revertOnUpdate`:

```javascript
useGSAP(() => {
  // gsap code
}, {
  dependencies: [endX],
  scope: container,
  revertOnUpdate: true  // revert + re-run when dependency changes
});
```

### Context-Safe Callbacks

Animations created inside event handlers (after useGSAP executes) won't be in the context. Wrap with `contextSafe`:

```javascript
useGSAP((context, contextSafe) => {
  const onClick = contextSafe(() => {
    gsap.to(ref.current, { rotation: 180 });
  });
  ref.current.addEventListener("click", onClick);
  return () => ref.current.removeEventListener("click", onClick);
}, { scope: container });
```

### gsap.context() in useEffect (fallback)

```javascript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
  }, containerRef);
  return () => ctx.revert();
}, []);
```

### SSR (Next.js)

- Keep all GSAP code inside `useGSAP` or `useEffect` — runs client-side only
- Do not call `gsap.*` or `ScrollTrigger.*` during server render

---

## Vue Integration

### Vue 3 (Composition API / script setup)

```javascript
import { onMounted, onUnmounted, ref } from "vue";
import { gsap } from "gsap";

const container = ref(null);
let ctx;

onMounted(() => {
  if (!container.value) return;
  ctx = gsap.context(() => {
    gsap.to(".box", { x: 100, duration: 0.6 });
    gsap.from(".item", { autoAlpha: 0, y: 20, stagger: 0.1 });
  }, container.value);
});

onUnmounted(() => ctx?.revert());
```

Template: `<div ref="container">...</div>`

---

## Svelte Integration

```javascript
import { onMount } from "svelte";
import { gsap } from "gsap";

let container;

onMount(() => {
  if (!container) return;
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
    gsap.from(".item", { autoAlpha: 0, stagger: 0.1 });
  }, container);
  return () => ctx.revert(); // onMount cleanup = component destroy
});
```

Template: `<div bind:this={container}>...</div>`

---

## Framework Principles (All Frameworks)

- **Create** tweens/ScrollTriggers after DOM is ready (onMounted, onMount, useGSAP)
- **Revert** in cleanup (onUnmounted, onMount return, useGSAP cleanup) — kills animations and reverts inline styles
- **Scope selectors** — always pass the container to `gsap.context(callback, scope)` or `useGSAP({ scope })`
- **Register plugins** once at app level, not inside components that re-render
- **ScrollTrigger.refresh()** after layout changes (data load, dynamic content); use nextTick (Vue) or tick (Svelte) for DOM-update-dependent refreshes

---

## Best Practices

- ✅ `gsap.registerPlugin(ScrollTrigger)` once before any usage
- ✅ In React, use `useGSAP()` from `@gsap/react`; wrap event-handler animations in `contextSafe()`
- ✅ In Vue/Svelte, use `gsap.context(callback, containerRef)` and call `ctx.revert()` on destroy
- ✅ Use `scrub` for scroll-linked progress **or** `toggleActions` for discrete play/reverse — not both on the same trigger
- ✅ Use `ease: "none"` on the horizontal tween when using `containerAnimation`
- ✅ Create ScrollTriggers top-to-bottom; set `refreshPriority` when order differs
- ✅ Call `ScrollTrigger.refresh()` after DOM/layout changes; viewport resize is auto-handled
- ✅ Put ScrollTrigger on the timeline or top-level tween, never on child tweens
- ✅ Revert `SplitText` instances on unmount; use `autoSplit` + `onSplit` for responsive layouts

## Do Not

- ❌ Put ScrollTrigger on a child tween inside a timeline — put it on the timeline itself
- ❌ Nest ScrollTriggered animations inside a parent timeline
- ❌ Use `scrub` and `toggleActions` together on the same ScrollTrigger
- ❌ Use any ease other than `"none"` on the horizontal tween when using `containerAnimation`
- ❌ Create ScrollTriggers in random order without setting `refreshPriority`
- ❌ Leave `markers: true` in production
- ❌ Use a plugin in a tween without registering it first with `gsap.registerPlugin()`
- ❌ Ship GSDevTools to production
- ❌ Target by selector without a scope in React/Vue/Svelte components
- ❌ Skip cleanup — stray tweens and ScrollTriggers keep running and leak
- ❌ Run GSAP or ScrollTrigger during SSR

## Learn More

- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://gsap.com/docs/v3/Plugins/
- https://gsap.com/resources/React
