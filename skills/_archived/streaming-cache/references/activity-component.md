# React `<Activity>` Component — Deep Patterns

## Overview

`<Activity>` (React 19.2+) keeps component trees in memory without attaching them to the DOM. The Fiber tree is preserved but DOM nodes are detached. When mode switches to `'visible'`, nodes re-attach instantly.

```tsx
import { Activity } from 'react';

<Activity mode="visible">  {/* Rendered and visible */}
  <Component />
</Activity>

<Activity mode="hidden">   {/* In memory, DOM detached */}
  <Component />
</Activity>
```

## Patterns

### Pre-render Anticipated Navigation

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html>
      <body>
        {children}

        {/* Pre-render likely next routes based on current page */}
        {pathname === '/dashboard' && (
          <Activity mode="hidden">
            <SettingsPage />
          </Activity>
        )}
        {pathname === '/products' && (
          <Activity mode="hidden">
            <CartPage />
          </Activity>
        )}
      </body>
    </html>
  );
}
```

### Persistent Tabs (No Unmount/Remount)

```tsx
function TabbedInterface({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <nav role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {tabs.map(tab => (
        <Activity key={tab.id} mode={tab.id === activeTab ? 'visible' : 'hidden'}>
          <div role="tabpanel">
            <TabContent tab={tab} />
          </div>
        </Activity>
      ))}
    </div>
  );
}
```

Benefits:
- Scroll position preserved per tab
- Form input values retained
- Data fetch results cached in component state
- No re-mount flickering

### Background Data Prefetch

```tsx
function SmartPrefetch({ href, children }: { href: string; children: React.ReactNode }) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  return (
    <>
      <Link
        href={href}
        onMouseEnter={() => setShouldPrefetch(true)}
      >
        {children}
      </Link>

      {shouldPrefetch && (
        <Activity mode="hidden">
          <Suspense fallback={null}>
            <PrefetchedPage href={href} />
          </Suspense>
        </Activity>
      )}
    </>
  );
}
```

## Hydration Priority

React hydrates `<Activity mode="hidden">` content at the **lowest priority**. It never blocks visible content. The priority order:

1. Visible interactive content (user is interacting)
2. Visible Suspense boundaries
3. Hidden Activity content (background, idle time)

## Rules

1. **Hidden content does not receive focus** — focus management is automatic
2. **Effects don't run** while hidden — `useEffect` fires when mode becomes `'visible'`
3. **Refs are accessible** while hidden — DOM nodes exist in memory
4. **Use sparingly** — each hidden tree consumes memory; limit to 2-3 pre-rendered routes
5. **Combine with Suspense** — wrap data-fetching components in Suspense inside Activity
