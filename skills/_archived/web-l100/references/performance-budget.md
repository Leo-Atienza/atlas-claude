# Performance Budget — Complete Checklist

## Core Web Vitals Targets (2026)

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| INP | < 200ms | 200-500ms | > 500ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |

## GPU & Rendering
- [ ] Only animate `transform` + `opacity` (GPU-composited)
- [ ] `will-change` only on elements animating immediately on load — remove after
- [ ] `content-visibility: auto` on below-fold sections
- [ ] Call `ScrollTrigger.refresh()` when content-visibility sections reveal
- [ ] No layout thrashing — never read then write DOM in a loop
- [ ] Canvas/SVG text: use `@chenglou/pretext` `layout()` instead of `getBoundingClientRect`

## Bundle Targets
- [ ] Total animation JS < 80KB gzipped (GSAP ~28KB + ScrollTrigger ~24KB + Lenis ~3KB + Motion ~18KB)
- [ ] Tree-shake Motion imports: `import { motion } from 'motion/react'`
- [ ] GSAP plugins loaded only where used (dynamic import for SplitText, MorphSVG)
- [ ] Decorative canvas/3D initialized via `requestIdleCallback` (not on load)
- [ ] No CSS-in-JS runtime — use Tailwind CSS v4 + CSS Nesting

## LCP Optimization
- [ ] Hero image: `fetchPriority="high"` + `loading="eager"` (NOT lazy)
- [ ] Inline critical CSS or use PPR to serve static shell instantly
- [ ] Preload hero fonts: `<link rel="preload" as="font" crossorigin>`
- [ ] Server-side render LCP element (never behind client-side fetch)
- [ ] Use `<Image>` component with priority for above-fold images

## INP Optimization
- [ ] No long tasks > 50ms on main thread
- [ ] Use `scheduler.yield()` to break up heavy computations
- [ ] Event handlers: immediate visual feedback, defer expensive work
- [ ] Debounce rapid-fire events (scroll, resize, input) at 16ms
- [ ] Offload computation to Web Workers for data processing

## CLS Prevention
- [ ] `width` + `height` or `aspect-ratio` on ALL images and media
- [ ] No dynamically injected content above the fold
- [ ] Font display: use `font-display: optional` or `size-adjust` for FOUT prevention
- [ ] Skeleton screens match final layout dimensions exactly
- [ ] Reserve space for ads and dynamic embeds

## Loading Strategy
- [ ] Skeleton screens (CSS shimmer), never spinners
- [ ] BlurHash or tiny placeholder for images
- [ ] Optimistic updates for mutations (UI changes immediately)
- [ ] Speculation Rules for predicted navigation
- [ ] `<Activity mode="hidden">` for anticipated route pre-rendering

## Streaming Optimization
- [ ] PPR enabled: static shell served instantly from CDN
- [ ] Each independent data source wrapped in its own `<Suspense>`
- [ ] Skeleton fallbacks for every Suspense boundary
- [ ] `use cache` with appropriate `cacheLife` for non-volatile data
- [ ] `cacheTag` for surgical invalidation on mutations

## Accessibility & Motion
- [ ] `prefers-reduced-motion` kills all non-essential animation
- [ ] `gsap.matchMedia()` wraps all scroll animations
- [ ] `[data-lenis-prevent]` on scrollable sub-containers
- [ ] Focus management: `<dialog>` handles modals natively
- [ ] Keyboard navigation works for all interactive elements

## React 19+ Specifics
- [ ] React Compiler enabled: `reactCompiler: true`
- [ ] No manual `useMemo`/`useCallback`/`React.memo`
- [ ] Server Components for static content
- [ ] Client Components only for genuine interactivity
- [ ] `use cache` for cacheable server functions
