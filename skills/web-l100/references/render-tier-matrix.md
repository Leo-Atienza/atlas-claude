# Render Tier Decision Matrix — Full Reference

## Tier Classification Flowchart

```
START → Does it call streamText/useChat/AI SDK?
  YES → T4 (Generative)
  NO  → Does it use useState/useEffect/onClick/event handlers?
    YES → Can CSS do it instead? (Step 2 CSS-First Check)
      YES → T0 (Static)
      NO  → T3 (Interactive)
    NO  → Does it read cookies/headers/searchParams/user session?
      YES → T2 (Dynamic)
      NO  → Does it fetch data that changes over time?
        YES → T1 (Cached) — use 'use cache' + cacheLife
        NO  → T0 (Static)
```

## Tier Details

### T0: Static
- **Renders:** Build time
- **Served from:** CDN edge, instant
- **JS shipped:** Zero
- **Cache:** Forever (until redeploy)
- **Examples:** Navigation, footer, legal pages, marketing copy, icons, brand assets
- **Pattern:** Plain JSX, no async, no hooks, no imports from 'react' client APIs

### T1: Cached
- **Renders:** Server, cached with `use cache` directive
- **Served from:** Cache (memory, Redis, KV), revalidates on schedule
- **JS shipped:** Zero (Server Component)
- **Cache:** Configurable via `cacheLife()` — minutes, hours, days, weeks, max
- **Examples:** Blog posts, product listings, analytics stats, catalog, FAQs
- **Pattern:** `async function` with `'use cache'` + `cacheLife()` + `cacheTag()`

### T2: Dynamic
- **Renders:** Request time, streamed via Suspense
- **Served from:** Server, fresh per request
- **JS shipped:** Zero (Server Component, but runtime-dependent)
- **Cache:** None (or `use cache: private` for per-user cache)
- **Examples:** User preferences, notification count, cart items, auth-dependent UI
- **Pattern:** Wrap in `<Suspense fallback={<Skeleton />}>`, reads cookies/headers inside

### T3: Interactive
- **Renders:** Client-side after hydration
- **Served from:** Bundled JS
- **JS shipped:** Component code + framework runtime
- **Cache:** N/A (client-side state)
- **Examples:** Form inputs, drag-and-drop, charts, animated components, modals with complex state
- **Pattern:** `'use client'` directive, hooks, event handlers, Motion/GSAP

### T4: Generative
- **Renders:** AI streaming, token-by-token
- **Served from:** AI provider → server → client stream
- **JS shipped:** AI SDK client + component renderers
- **Cache:** Optional (cache AI responses with `use cache` for common queries)
- **Examples:** Chat interfaces, AI-generated summaries, smart search results, content generation
- **Pattern:** `streamText()` server-side, `useChat()` client-side, tool invocations → components

## Common Mistakes

| Mistake | Correct Tier |
|---|---|
| Using `'use client'` for a nav with no interactivity | T0 — remove the directive |
| Using useState for a dark mode toggle | T0 — use `light-dark()` + `color-scheme` CSS |
| Using useEffect + IntersectionObserver for scroll reveal | T0 — use CSS `animation-timeline: view()` |
| Using JS for tooltip positioning | T0 — use Popover API + Anchor Positioning |
| Fetching user data in a client component | T2 — fetch in Server Component, pass as props |
| Caching user-specific data with `use cache` | T2 — use `use cache: private` or extract to T2 |
| Using `revalidate: 0` everywhere | T2 — but ask: can any of this be T1 with cacheLife? |
