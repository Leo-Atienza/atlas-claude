<!--
id: SK-085
name: streaming-cache
description: Streaming & Cache Architecture — Next.js 16 compositional cache slots, React 19.2 Activity + ViewTransition, streaming SSR, cache lifetime bubbling, selective hydration. Load for data architecture and rendering strategy.
keywords: streaming, cache, ppr, activity, view-transition, cache-slots, compositional, selective-hydration, suspense, cache-lifetime, use-cache-remote, react-19
version: 1.0.0
-->

# Streaming & Cache Architecture

## When to Use This Skill

Load when designing data architecture or rendering strategy for a Next.js 16 app. This skill teaches **how to architect with caching and streaming** — the compositional patterns, not the API surface.

**For cache API reference** (`use cache`, `cacheLife`, `cacheTag`): load `next-cache-components` (SK-030).
**For the full architecture overview**: load `web-l100` (SK-083) for Render Tiers and the streaming pipeline.

---

## Compositional Cache Slots

> Deep patterns: [references/compositional-cache.md](references/compositional-cache.md)

The key Next.js 16 insight: a cached component can accept `children` and other `ReactNode` props. The cached shell renders once, but dynamic children stream independently.

```tsx
// Cached layout shell — renders once, CDN-cached
async function DashboardShell({ children }: { children: React.ReactNode }) {
  'use cache'
  cacheLife('days')

  const nav = await db.navigation.findMany();
  return (
    <div className="dashboard">
      <Sidebar items={nav} />
      <main>{children}</main>  {/* Dynamic children stream through the cached shell */}
    </div>
  );
}

// Page composes cached shell with dynamic content
export default function DashboardPage() {
  return (
    <DashboardShell>
      {/* T1: Cached stats */}
      <StatsPanel />

      {/* T2: Dynamic user content — streams independently */}
      <Suspense fallback={<ActivitySkeleton />}>
        <UserActivity />
      </Suspense>
    </DashboardShell>
  );
}
```

The shell cache is not polluted by dynamic children — each Suspense boundary resolves independently.

### Pattern: Shared Layout, Per-User Content

```tsx
async function ProductPage({ id }: { id: string }) {
  return (
    <CachedProductLayout id={id}>
      {/* User-specific: cannot be cached globally */}
      <Suspense fallback={<PriceSkeleton />}>
        <PersonalizedPrice productId={id} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <UserReviews productId={id} />
      </Suspense>
    </CachedProductLayout>
  );
}

async function CachedProductLayout({ id, children }: { id: string; children: React.ReactNode }) {
  'use cache'
  cacheLife('hours')
  cacheTag(`product-${id}`)

  const product = await db.products.findUnique({ where: { id } });
  return (
    <article>
      <h1>{product.name}</h1>
      <ProductImages images={product.images} />
      <p>{product.description}</p>
      {children}
    </article>
  );
}
```

---

## `use cache: remote`

For serverless deployments where in-memory cache doesn't persist across invocations:

```tsx
async function getPopularProducts() {
  'use cache: remote'  // Uses platform cache (Redis, KV, Vercel Data Cache)
  cacheLife('hours')
  cacheTag('popular-products')

  return db.products.findMany({
    orderBy: { sales: 'desc' },
    take: 20,
  });
}
```

**When to use:**
- `use cache` (default) — single-server or persistent process (good for dev, Node.js long-running)
- `use cache: remote` — serverless, edge, multi-region (Vercel, Cloudflare, AWS Lambda)
- `use cache: private` — per-user cache, allows cookies/headers access

---

## React `<Activity>`

> Deep patterns: [references/activity-component.md](references/activity-component.md)

`<Activity>` keeps component trees in memory without rendering them to the DOM. React 19.2+.

### Pre-render Anticipated Routes

```tsx
import { Activity } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      {/* Pre-render settings page in background */}
      <Activity mode="hidden">
        <SettingsPage />
      </Activity>
    </>
  );
}
```

When user navigates to Settings, the component is already rendered — instant transition.

### Keep Tabs Alive

```tsx
function TabPanel({ tabs, activeTab }: { tabs: Tab[]; activeTab: string }) {
  return (
    <div>
      {tabs.map(tab => (
        <Activity key={tab.id} mode={tab.id === activeTab ? 'visible' : 'hidden'}>
          <TabContent tab={tab} />
        </Activity>
      ))}
    </div>
  );
}
```

Switching tabs is instant — state, scroll position, and input values are preserved. No unmount/remount cycle.

### Background Data Prefetch

```tsx
<Activity mode="hidden">
  {/* This Suspense boundary fetches data in the background */}
  <Suspense fallback={null}>
    <ExpensiveDataComponent />
  </Suspense>
</Activity>
```

Data fetches at lower priority, doesn't block visible content.

---

## React `<ViewTransition>`

> Deep patterns: [references/view-transition-component.md](references/view-transition-component.md)

First-class React component for View Transitions. React 19.2+, Next.js 16+.

```tsx
import { ViewTransition } from 'react';

function ProductCard({ product }: { product: Product }) {
  return (
    <ViewTransition name={`product-${product.id}`}>
      <Link href={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
      </Link>
    </ViewTransition>
  );
}

// On the detail page, same ViewTransition name = shared element transition
function ProductDetail({ product }: { product: Product }) {
  return (
    <ViewTransition name={`product-${product.id}`}>
      <img src={product.image} alt={product.name} className="hero-image" />
    </ViewTransition>
  );
}
```

### Enable in Next.js 16

```ts
// next.config.ts
const nextConfig: NextConfig = {
  viewTransition: true,
};
```

Next.js auto-triggers view transitions on route changes.

### CSS Customization

```css
::view-transition-old(*) {
  animation-duration: 200ms;
}
::view-transition-new(*) {
  animation-duration: 300ms;
}

/* Specific named transition */
::view-transition-group(product-hero) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Cache Lifetime Bubbling

When cache boundaries are nested, the most conservative (shortest) lifetime wins:

```tsx
async function PageLayout() {
  'use cache'
  cacheLife('days')  // Layout wants to cache for days

  return (
    <div>
      <Header />
      <StockTicker />  {/* But this caches for seconds */}
      <Footer />
    </div>
  );
}

async function StockTicker() {
  'use cache'
  cacheLife('seconds')  // This pulls the outer cache down to seconds

  const prices = await fetchStockPrices();
  return <div>{/* ... */}</div>;
}
```

**The fix:** Move volatile components to Suspense boundaries instead of nesting caches:

```tsx
async function PageLayout() {
  'use cache'
  cacheLife('days')  // Layout stays cached for days

  return (
    <div>
      <Header />
      <Suspense fallback={<TickerSkeleton />}>
        <StockTicker />  {/* Dynamic — doesn't affect layout cache */}
      </Suspense>
      <Footer />
    </div>
  );
}
```

**Rule:** Never nest a short-lived cache inside a long-lived cache. Use Suspense to isolate volatile data.

---

## Selective Hydration

React 19 streams HTML and hydrates `<Suspense>` boundaries independently:

1. Static shell arrives instantly (PPR)
2. Each Suspense boundary hydrates when its data arrives
3. If user interacts with a not-yet-hydrated component, React **prioritizes hydrating that component**
4. Hidden `<Activity>` components hydrate at lowest priority

### Architecture Implication

Wrap each independent data source in its own Suspense boundary:

```tsx
export default function Dashboard() {
  return (
    <>
      <StaticHeader />  {/* T0 — no Suspense needed */}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />  {/* T1 or T2 — independent data source */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Charts />  {/* T2 — different data, different timing */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed />  {/* T2 — slowest data, streams last */}
      </Suspense>
    </>
  );
}
```

Each section appears as soon as its data is ready. The user sees a progressively complete page, not a loading spinner.
