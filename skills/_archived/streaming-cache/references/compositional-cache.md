# Compositional Cache Slots — Deep Patterns

## The Core Concept

A cached component can accept `ReactNode` props. The cached shell renders once, but children passed through are not part of the cache — they stream independently.

```tsx
async function CachedShell({ sidebar, children }: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  'use cache'
  cacheLife('days')

  const config = await db.siteConfig.findFirst();
  return (
    <div className="layout" data-theme={config.theme}>
      <header><Logo /><Nav items={config.nav} /></header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <footer>{config.footer}</footer>
    </div>
  );
}
```

The shell (header, nav, footer, theme) is cached. The `sidebar` and `children` slots are dynamic holes that resolve independently.

## Patterns

### E-Commerce Product Page
```tsx
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CachedProductShell id={id}>
      <Suspense fallback={<PriceSkeleton />}>
        <PersonalizedPrice productId={id} />  {/* User-specific pricing */}
      </Suspense>
      <Suspense fallback={<StockSkeleton />}>
        <StockLevel productId={id} />  {/* Real-time inventory */}
      </Suspense>
    </CachedProductShell>
  );
}

async function CachedProductShell({ id, children }: { id: string; children: React.ReactNode }) {
  'use cache'
  cacheLife('hours')
  cacheTag(`product-${id}`)

  const product = await db.products.findUnique({ where: { id } });
  return (
    <article>
      <ProductImages images={product.images} />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {children}  {/* Price and stock stream in independently */}
      <ProductSpecs specs={product.specs} />
    </article>
  );
}
```

### Dashboard with Cached Layout
```tsx
export default function Dashboard() {
  return (
    <CachedDashboardLayout>
      <Suspense fallback={<MetricsSkeleton />}>
        <LiveMetrics />  {/* Real-time, no cache */}
      </Suspense>
      <CachedRecentOrders />  {/* Cached separately, hourly */}
      <Suspense fallback={<AlertsSkeleton />}>
        <ActiveAlerts />  {/* Dynamic, per-request */}
      </Suspense>
    </CachedDashboardLayout>
  );
}
```

### Multi-Slot Layout
```tsx
async function AppLayout({
  header,
  sidebar,
  children,
  footer,
}: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  'use cache'
  cacheLife('weeks')  // Layout structure rarely changes

  return (
    <div className="app-layout">
      <div className="app-header">{header}</div>
      <div className="app-sidebar">{sidebar}</div>
      <div className="app-content">{children}</div>
      <div className="app-footer">{footer}</div>
    </div>
  );
}
```

## Rules

1. **Cache keys include all serializable props** — but `ReactNode` props (children) are excluded from the key
2. **Inner caches don't pollute outer caches** — a Suspense boundary inside a cached shell resolves independently
3. **Cache tag invalidation** is granular — invalidating `product-123` doesn't affect other products
4. **Don't nest short-lived caches inside long-lived ones** — use Suspense to isolate volatile data
