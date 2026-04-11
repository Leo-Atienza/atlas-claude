---
name: next-cache-components
description: Next.js 16 Cache Components - PPR, use cache directive, cacheLife, cacheTag, updateTag
---

# Cache Components (Next.js 16+)

Cache Components enable Partial Prerendering (PPR) - mix static, cached, and dynamic content in a single route.

## Enable Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

This replaces the old `experimental.ppr` flag.

---

## Three Content Types

With Cache Components enabled, content falls into three categories:

### 1. Static (Auto-Prerendered)

Synchronous code, imports, pure computations - prerendered at build time:

```tsx
export default function Page() {
  return (
    <header>
      <h1>Our Blog</h1>  {/* Static - instant */}
      <nav>...</nav>
    </header>
  )
}
```

### 2. Cached (`use cache`)

Async data that doesn't need fresh fetches every request:

```tsx
async function BlogPosts() {
  'use cache'
  cacheLife('hours')

  const posts = await db.posts.findMany()
  return <PostList posts={posts} />
}
```

### 3. Dynamic (Suspense)

Runtime data that must be fresh - wrap in Suspense:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <BlogPosts />  {/* Cached */}

      <Suspense fallback={<p>Loading...</p>}>
        <UserPreferences />  {/* Dynamic - streams in */}
      </Suspense>
    </>
  )
}

async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value
  return <p>Theme: {theme}</p>
}
```

---

## `use cache` Directive

### File Level

```tsx
'use cache'

export default async function Page() {
  // Entire page is cached
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Component Level

```tsx
export async function CachedComponent() {
  'use cache'
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Function Level

```tsx
export async function getData() {
  'use cache'
  return db.query('SELECT * FROM posts')
}
```

---

## Cache Profiles

### Built-in Profiles

```tsx
'use cache'                    // Default: 5m stale, 15m revalidate
```

```tsx
'use cache: remote'           // Platform-provided cache (Redis, KV)
```

```tsx
'use cache: private'          // For compliance, allows runtime APIs
```

### `use cache: remote` — Platform Cache

For serverless deployments (Vercel, Cloudflare) where in-memory cache doesn't persist:

```tsx
async function getPopularProducts() {
  'use cache: remote'  // Uses platform cache (Redis, KV store)
  cacheLife('hours')
  cacheTag('popular')

  return db.products.findMany({ orderBy: { sales: 'desc' }, take: 20 });
}
```

Use `remote` for: serverless, edge, multi-region. Use default `use cache` for: long-running Node.js.

### `cacheLife()` - Custom Lifetime

```tsx
import { cacheLife } from 'next/cache'

async function getData() {
  'use cache'
  cacheLife('hours')  // Built-in profile
  return fetch('/api/data')
}
```

Built-in profiles: `'default'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`

### Inline Configuration

```tsx
async function getData() {
  'use cache'
  cacheLife({
    stale: 3600,      // 1 hour - serve stale while revalidating
    revalidate: 7200, // 2 hours - background revalidation interval
    expire: 86400,    // 1 day - hard expiration
  })
  return fetch('/api/data')
}
```

---

## Cache Invalidation

### `cacheTag()` - Tag Cached Content

```tsx
import { cacheTag } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheTag('products')
  return db.products.findMany()
}

async function getProduct(id: string) {
  'use cache'
  cacheTag('products', `product-${id}`)
  return db.products.findUnique({ where: { id } })
}
```

### `updateTag()` - Immediate Invalidation

Use when you need the cache refreshed within the same request:

```tsx
'use server'

import { updateTag } from 'next/cache'

export async function updateProduct(id: string, data: FormData) {
  await db.products.update({ where: { id }, data })
  updateTag(`product-${id}`)  // Immediate - same request sees fresh data
}
```

### `revalidateTag()` - Background Revalidation

Use for stale-while-revalidate behavior:

```tsx
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  await db.posts.create({ data })
  revalidateTag('posts')  // Background - next request sees fresh data
}
```

---

## Runtime Data Constraint

**Cannot** access `cookies()`, `headers()`, or `searchParams` inside `use cache`.

### Solution: Pass as Arguments

```tsx
// Wrong - runtime API inside use cache
async function CachedProfile() {
  'use cache'
  const session = (await cookies()).get('session')?.value  // Error!
  return <div>{session}</div>
}

// Correct - extract outside, pass as argument
async function ProfilePage() {
  const session = (await cookies()).get('session')?.value
  return <CachedProfile sessionId={session} />
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
  'use cache'
  // sessionId becomes part of cache key automatically
  const data = await fetchUserData(sessionId)
  return <div>{data.name}</div>
}
```

### Exception: `use cache: private`

For compliance requirements when you can't refactor:

```tsx
async function getData() {
  'use cache: private'
  const session = (await cookies()).get('session')?.value  // Allowed
  return fetchData(session)
}
```

---

## Cache Key Generation

Cache keys are automatic based on:
- **Build ID** - invalidates all caches on deploy
- **Function ID** - hash of function location
- **Serializable arguments** - props become part of key
- **Closure variables** - outer scope values included

```tsx
async function Component({ userId }: { userId: string }) {
  const getData = async (filter: string) => {
    'use cache'
    // Cache key = userId (closure) + filter (argument)
    return fetch(`/api/users/${userId}?filter=${filter}`)
  }
  return getData('active')
}
```

---

## Complete Example

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export default function DashboardPage() {
  return (
    <>
      {/* Static shell - instant from CDN */}
      <header><h1>Dashboard</h1></header>
      <nav>...</nav>

      {/* Cached - fast, revalidates hourly */}
      <Stats />

      {/* Dynamic - streams in with fresh data */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <Notifications />
      </Suspense>
    </>
  )
}

async function Stats() {
  'use cache'
  cacheLife('hours')
  cacheTag('dashboard-stats')

  const stats = await db.stats.aggregate()
  return <StatsDisplay stats={stats} />
}

async function Notifications() {
  const userId = (await cookies()).get('userId')?.value
  const notifications = await db.notifications.findMany({
    where: { userId, read: false }
  })
  return <NotificationList items={notifications} />
}
```

---

## Migration from Previous Versions

| Old Config | Replacement |
|-----------|-------------|
| `experimental.ppr` | `cacheComponents: true` |
| `dynamic = 'force-dynamic'` | Remove (default behavior) |
| `dynamic = 'force-static'` | `'use cache'` + `cacheLife('max')` |
| `revalidate = N` | `cacheLife({ revalidate: N })` |
| `unstable_cache()` | `'use cache'` directive |

### Migrating `unstable_cache` to `use cache`

`unstable_cache` has been replaced by the `use cache` directive in Next.js 16. When `cacheComponents` is enabled, convert `unstable_cache` calls to `use cache` functions:

**Before (`unstable_cache`):**

```tsx
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (id) => getUser(id),
  ['my-app-user'],
  {
    tags: ['users'],
    revalidate: 60,
  }
)

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCachedUser(id)
  return <div>{user.name}</div>
}
```

**After (`use cache`):**

```tsx
import { cacheLife, cacheTag } from 'next/cache'

async function getCachedUser(id: string) {
  'use cache'
  cacheTag('users')
  cacheLife({ revalidate: 60 })
  return getUser(id)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCachedUser(id)
  return <div>{user.name}</div>
}
```

Key differences:
- **No manual cache keys** - `use cache` generates keys automatically from function arguments and closures. The `keyParts` array from `unstable_cache` is no longer needed.
- **Tags** - Replace `options.tags` with `cacheTag()` calls inside the function.
- **Revalidation** - Replace `options.revalidate` with `cacheLife({ revalidate: N })` or a built-in profile like `cacheLife('minutes')`.
- **Dynamic data** - `unstable_cache` did not support `cookies()` or `headers()` inside the callback. The same restriction applies to `use cache`, but you can use `'use cache: private'` if needed.

---

## Compositional Cache Slots

A cached component can accept `children` and other `ReactNode` props. The cached shell renders once, but dynamic children stream independently — no cache key pollution.

```tsx
async function CachedLayout({ children }: { children: React.ReactNode }) {
  'use cache'
  cacheLife('days')

  const nav = await db.navigation.findMany();
  return (
    <div className="layout">
      <Sidebar items={nav} />
      <main>{children}</main>  {/* Children stream through the cached shell */}
    </div>
  );
}

export default function Page() {
  return (
    <CachedLayout>
      <CachedStats />  {/* T1: cached separately */}
      <Suspense fallback={<Skeleton />}>
        <UserContent />  {/* T2: dynamic, streams in */}
      </Suspense>
    </CachedLayout>
  );
}
```

> For full compositional cache architecture patterns, load `streaming-cache` (SK-085).

---

## Cache Lifetime Bubbling

When cache boundaries are nested, the most conservative (shortest) lifetime wins:

```tsx
async function OuterCache() {
  'use cache'
  cacheLife('days')  // Wants to cache for days...

  return <InnerCache />;  // ...but inner cache pulls it down
}

async function InnerCache() {
  'use cache'
  cacheLife('seconds')  // This wins — outer cache also revalidates in seconds
}
```

**Fix:** Use Suspense to isolate volatile data instead of nesting short-lived caches:

```tsx
async function OuterCache() {
  'use cache'
  cacheLife('days')  // Stays cached for days

  return (
    <div>
      <StaticContent />
      <Suspense fallback={<Skeleton />}>
        <VolatileContent />  {/* Dynamic — doesn't affect outer cache */}
      </Suspense>
    </div>
  );
}
```

---

## Limitations

- **Edge runtime not supported** - requires Node.js
- **Static export not supported** - needs server
- **Non-deterministic values** (`Math.random()`, `Date.now()`) execute once at build time inside `use cache`

For request-time randomness outside cache:

```tsx
import { connection } from 'next/server'

async function DynamicContent() {
  await connection()  // Defer to request time
  const id = crypto.randomUUID()  // Different per request
  return <div>{id}</div>
}
```

Sources:
- [Cache Components Guide](https://nextjs.org/docs/app/getting-started/cache-components)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [unstable_cache (legacy)](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
