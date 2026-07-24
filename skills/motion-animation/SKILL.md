---
name: motion-animation
description: "Motion (motion.dev, ex-Framer Motion; `motion` package v12+, MIT) — React spring-physics animation: springs, layout/layoutId, AnimatePresence exit animations, gestures, useScroll. Use for interaction-driven React animation (toggles, drag, hover-follow, reordering) where interruptible springs beat duration-easing; GSAP (SK-042/SK-044) owns timelines, scroll choreography, and non-React. Imports are `motion/react`. See impeccable reference/animation-recipes.md for when springs vs easing."
user-invocable: true
---

# Motion Animation Skill (SK-047)

## When to Use This Skill

Apply when animating in React. Motion is the de-facto React animation standard (2.5x faster than GSAP for unknown-value animations, 6x faster between different value types). **Use Motion for React projects, GSAP for non-React or complex timelines/SVG morphing.** Auto-activate when code imports `motion`, `framer-motion`, `AnimatePresence`, or `useScroll`.

**Related skills:** GSAP (SK-042/SK-044) for non-React, complex timelines, ScrollTrigger with Lenis.

---

## Motion vs GSAP Decision Guide

| Criteria | Choose Motion | Choose GSAP |
|----------|--------------|-------------|
| Framework | React/Next.js | Any (vanilla, Vue, Svelte, Webflow) |
| Layout animations | Yes (automatic) | Manual measurement |
| Exit animations | AnimatePresence (built-in) | Manual with callbacks |
| Complex timelines | Basic sequencing | Full timeline control |
| SVG morphing | Limited | MorphSVG plugin |
| Scroll-driven | useScroll + useTransform | ScrollTrigger (more powerful) |
| Bundle | ~85KB | ~78KB (core + ScrollTrigger) |
| Performance | 2.5x faster unknown values | Faster for known-value tweens |

---

## Installation

```bash
npm install motion  # Motion v11+ (the new package name)
# or
npm install framer-motion  # Legacy package, still works
```

**New since v12.41 (Jun 2026):** `animateView()` — Motion's View Transitions API wrapper — is now in the free core library (previously Motion+ Early Access).

---

## Core: `<motion.div>`

```tsx
import { motion } from 'motion/react';

// Basic animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
/>

// Hover + tap
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

---

## Spring Physics (L100 — always prefer over easing)

```tsx
// Spring presets
transition={{ type: 'spring', stiffness: 400, damping: 30 }}  // snappy
transition={{ type: 'spring', stiffness: 300, damping: 20 }}  // standard
transition={{ type: 'spring', stiffness: 200, damping: 15 }}  // bouncy
transition={{ type: 'spring', bounce: 0.25 }}                  // shorthand

// Named spring presets for consistency
const springs = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  gentle: { type: 'spring', stiffness: 200, damping: 20 },
  bouncy: { type: 'spring', stiffness: 300, damping: 10 },
} as const;
```

**Rule: Never use `ease-in-out` for interactive elements. Springs only for buttons, cards, sheets, toggles.**

---

## Layout Animations (Motion's Killer Feature)

```tsx
// Automatic layout animation — just add layout prop
<motion.div layout>
  {items.map(item => (
    <motion.div key={item.id} layout>
      {item.name}
    </motion.div>
  ))}
</motion.div>

// Shared layout animation between components
<motion.div layoutId="card" /> // in list
<motion.div layoutId="card" /> // in detail — Motion auto-animates between

// Layout with content change
<motion.div layout="position"> // only animate position, not size
<motion.div layout="size">    // only animate size
```

---

## AnimatePresence (Exit Animations)

```tsx
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait"> {/* wait = exit before enter */}
  {showPanel && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  )}
</AnimatePresence>

// mode="popLayout" — remove exiting elements from layout flow immediately
// mode="sync" — animate enter and exit simultaneously
```

---

## Scroll Animations

```tsx
import { useScroll, useTransform, motion } from 'motion/react';

function ParallaxHero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return <motion.div style={{ y, opacity }} />;
}

// Scroll-triggered element animation
function FadeInOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'] // when element enters/exits viewport
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return <motion.div ref={ref} style={{ opacity }}>{children}</motion.div>;
}
```

---

## Gesture Animations

```tsx
<motion.div
  drag                    // enable drag on both axes
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
  dragElastic={0.2}       // rubber-band effect at constraints
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
  whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
  onDragEnd={(e, info) => {
    if (Math.abs(info.velocity.x) > 500) dismissCard();
  }}
/>
```

---

## Variants (Orchestrated Animations)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i} variants={item}>{i}</motion.li>
  ))}
</motion.ul>
```

---

## View Transitions Integration

```tsx
// Combine Motion with View Transitions API
function navigateWithTransition(href: string) {
  if (!document.startViewTransition) {
    router.push(href);
    return;
  }
  document.startViewTransition(() => router.push(href));
}
// Use motion.div with layoutId for element-level transitions
// Use View Transitions API for page-level transitions
```

---

## Vanilla Motion (non-React — the SAME `motion` package)

Motion also ships a framework-agnostic API — use it in vanilla pages, hyperframes (HTML→video, non-React), or anywhere you'd otherwise pull in a lightweight GSAP. **Zero extra dependency** (same `motion` install, different import — `motion` not `motion/react`).

```js
import { animate, scroll, inView, stagger } from 'motion';

// Mini (~2.3KB, native browser animations) → Hybrid (adds transforms, CSS vars, SVG paths, sequences)
animate('.box', { opacity: [0, 1], y: [20, 0] }, { duration: 0.5, ease: 'easeOut' });

// Scroll-linked (ScrollTimeline-backed — runs off the main thread where supported)
scroll(animate('.parallax', { y: [-100, 100] }), { target: document.querySelector('#hero') });

// Fire once on viewport entry (the non-React whileInView)
inView('.reveal', (el) => { animate(el, { opacity: 1, y: 0 }); }, { amount: 0.3 });

// Stagger a group
animate('.item', { opacity: 1 }, { delay: stagger(0.05) });
```

- `animate()` returns playback controls (`.pause()/.play()/.cancel()/.complete()`, `.time`, `.speed`) and sequences via an array with the `at` offset.
- `scroll()` / `inView()` are the vanilla equivalents of `useScroll` / whileInView; `animateView()` wraps the **View Transitions API** for page-level transitions (free core since v12.41).
- **On the motion ladder:** in non-React contexts, reach for vanilla Motion before GSAP; GSAP still owns complex timelines + SVG morph (SK-044/SK-149).

---

## Performance Tips

- Use `transform` properties (`x`, `y`, `scale`, `rotate`) — GPU-composited
- Avoid animating `width`, `height`, `top`, `left` — triggers layout
- Use `layout` prop sparingly on large lists — measure cost
- `useMotionValue` + `useTransform` for scroll-linked — no re-renders
- `will-change: transform` is added automatically by Motion
- For lists > 100 items, animate only visible items

---

## Common Patterns

### Modal with backdrop

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
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </>
  )}
</AnimatePresence>
```

### Tab content switch

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

### Number counter

```tsx
import { useMotionValue, useTransform, animate } from 'motion/react';

function Counter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  useEffect(() => { animate(count, target, { duration: 2 }); }, [target]);
  return <motion.span>{rounded}</motion.span>;
}
```
