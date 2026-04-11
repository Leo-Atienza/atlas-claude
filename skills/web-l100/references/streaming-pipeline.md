# Streaming Pipeline — Detailed Architecture

## The Flow

```
1. Browser requests URL
2. CDN serves PPR static shell instantly (T0)
   ├── <header>, <nav>, <footer> — already in HTML
   ├── <Suspense> holes with skeleton fallbacks
   └── Cache slot boundaries marked

3. Server fills cache slots (T1)
   ├── 'use cache' functions execute (or serve from cache)
   ├── cacheLife determines freshness
   └── Results stream into the shell

4. Server fills dynamic Suspense boundaries (T2)
   ├── cookies()/headers() read at request time
   ├── Each <Suspense> boundary hydrates independently
   └── User interactions prioritize hydrating the interacted component

5. Client hydrates interactive islands (T3)
   ├── 'use client' components receive bundled JS
   ├── Motion/GSAP initialize animations
   └── Event handlers become active

6. AI streams fill generative slots (T4)
   ├── streamText() produces tokens
   ├── Tool invocations map to React components
   └── Progressive rendering shows partial results
```

## Page Architecture Pattern

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { Activity } from 'react';

export default function DashboardPage() {
  return (
    <>
      {/* T0: Static shell — instant from CDN */}
      <header><h1>Dashboard</h1></header>
      <nav>{/* Static nav links */}</nav>

      {/* T1: Cached content — fast, revalidates hourly */}
      <Stats />
      <RecentPosts />

      {/* T2: Dynamic — streams with fresh per-request data */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <Notifications />
      </Suspense>

      <Suspense fallback={<ActivityFeedSkeleton />}>
        <ActivityFeed />
      </Suspense>

      {/* T3: Interactive — hydrated client island */}
      <DashboardCharts />

      {/* T4: Generative — AI-streamed content */}
      <Suspense fallback={<AISummarySkeleton />}>
        <AIDailySummary />
      </Suspense>

      {/* Pre-render anticipated route offscreen */}
      <Activity mode="hidden">
        <SettingsPage />
      </Activity>
    </>
  );
}
```

## Speculation Rules + View Transitions

The power combination for native-app-quality navigation:

```tsx
// app/layout.tsx — add to <head>
<script
  type="speculationrules"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    prerender: [{
      where: { and: [
        { href_matches: '/*' },
        { not: { href_matches: '/api/*' } },
        { not: { href_matches: '/checkout*' } },
      ]},
      eagerness: 'moderate', // 200ms hover dwell
    }],
    prefetch: [{
      where: { href_matches: '/*' },
      eagerness: 'conservative', // mousedown/touchstart
    }],
  })}}
/>
```

```css
/* globals.css — enable cross-document View Transitions */
@view-transition { navigation: auto; }

::view-transition-old(root) {
  animation: 200ms ease-out both fade-out;
}
::view-transition-new(root) {
  animation: 300ms ease-out both fade-in;
}

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none; }
}
```

Result: user hovers a link → page prerenders in background → user clicks → View Transition smoothly reveals the already-rendered page. Near-zero perceived latency.
