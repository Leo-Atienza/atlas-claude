<!--
id: SK-055
name: tanstack-ecosystem
description: TanStack Query + Form + Router — server state, type-safe forms, and routing for React
keywords: tanstack, react-query, tanstack-query, tanstack-form, tanstack-router, server-state, caching, mutations, optimistic-updates, data-fetching
version: 1.0.0
-->

# TanStack Ecosystem

## When to Use This Skill

Apply when implementing data fetching, server state management, forms, or routing in React/Next.js. TanStack Query + Zustand is the 2026 default stack (replaces Redux + custom fetching). Auto-activate on keywords: tanstack, react-query, useQuery, useMutation, queryClient.

**Stack recommendation:**
- Server/async state → TanStack Query v5
- Client state → Zustand (simple) or Jotai (atomic)
- Forms → TanStack Form or React Hook Form (both excellent)
- Routing → TanStack Router (standalone) or Next.js App Router (Next.js projects)

---

## TanStack Query v5

**Installation:**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Provider Setup:**
```tsx
// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 min before refetch
        gcTime: 5 * 60 * 1000,      // 5 min garbage collection (was cacheTime)
        retry: 1,
        refetchOnWindowFocus: false, // disable for most apps
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient(); // SSR: always new
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Basic Query:**
```tsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isPending, isError, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    enabled: !!userId,  // only fetch when userId exists
  });

  if (isPending) return <Skeleton />;
  if (isError) return <Error message={error.message} />;
  return <Profile user={user} />;
}
```

**Query Key Conventions:**
```ts
// Hierarchical keys enable smart invalidation
['users']                    // all users
['users', 'list', { page }]  // paginated list
['users', userId]            // single user
['users', userId, 'posts']   // user's posts

// Invalidate all user queries:
queryClient.invalidateQueries({ queryKey: ['users'] });
// Invalidate specific user:
queryClient.invalidateQueries({ queryKey: ['users', userId] });
```

**Mutations with Optimistic Updates:**
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDTO) => fetch('/api/users', {
      method: 'PATCH', body: JSON.stringify(data),
    }).then(r => r.json()),

    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['users', newData.id] });
      const previous = queryClient.getQueryData(['users', newData.id]);
      queryClient.setQueryData(['users', newData.id], (old: User) => ({
        ...old, ...newData,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['users', context?.previous?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

**Infinite Queries (Pagination / Infinite Scroll):**
```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts', 'infinite'],
  queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam, limit: 20 }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});

// Flatten pages for rendering
const allPosts = data?.pages.flatMap(page => page.items) ?? [];
```

**Prefetching (SSR / Next.js):**
```tsx
// In Server Component or loader
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserList />
    </HydrationBoundary>
  );
}
```

**Dependent Queries:**
```tsx
const { data: user } = useQuery({ queryKey: ['user', id], queryFn: fetchUser });
const { data: projects } = useQuery({
  queryKey: ['projects', user?.orgId],
  queryFn: () => fetchProjects(user!.orgId),
  enabled: !!user?.orgId, // only runs after user loads
});
```

**Polling / Auto-Refetch:**
```tsx
useQuery({
  queryKey: ['status'],
  queryFn: fetchStatus,
  refetchInterval: 5000,                    // every 5s
  refetchIntervalInBackground: false,       // pause when tab hidden
});
```

---

## TanStack Form

**Installation:**
```bash
npm install @tanstack/react-form @tanstack/zod-form-adapter zod
```

**Basic Form with Zod Validation:**
```tsx
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
});

function CreateUserForm() {
  const form = useForm({
    defaultValues: { name: '', email: '' },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      await createUser(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="name"
        validators={{ onChange: userSchema.shape.name }}
      >
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors?.map((err, i) => (
              <span key={i} className="error">{err}</span>
            ))}
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
        validators={{ onChange: userSchema.shape.email }}
      >
        {(field) => (
          <div>
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors?.map((err, i) => (
              <span key={i} className="error">{err}</span>
            ))}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Submit'}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

**Nested / Array Fields:**
```tsx
<form.Field name="addresses" mode="array">
  {(field) => (
    <div>
      {field.state.value.map((_, i) => (
        <form.Field key={i} name={`addresses[${i}].street`}>
          {(subField) => <input value={subField.state.value} onChange={...} />}
        </form.Field>
      ))}
      <button onClick={() => field.pushValue({ street: '', city: '' })}>
        Add Address
      </button>
    </div>
  )}
</form.Field>
```

---

## TanStack Router (Standalone React Projects)

**Installation:**
```bash
npm install @tanstack/react-router
```

**File-based routing with full type safety:**
```tsx
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
export const Route = createRootRoute({ component: () => <><Outlet /></> });

// routes/users/$userId.tsx
import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/users/$userId')({
  loader: ({ params }) => fetchUser(params.userId), // type-safe params
  component: function UserPage() {
    const user = Route.useLoaderData(); // type-safe data
    return <div>{user.name}</div>;
  },
});
```

**Search params (type-safe):**
```tsx
import { z } from 'zod';
export const Route = createFileRoute('/products')({
  validateSearch: z.object({
    page: z.number().default(1),
    sort: z.enum(['price', 'name']).default('name'),
  }),
  component: function Products() {
    const { page, sort } = Route.useSearch(); // fully typed
    return <ProductList page={page} sort={sort} />;
  },
});
```

---

## Integration Patterns

**Query + Form (create/edit flow):**
```tsx
function EditUser({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });
  const mutation = useUpdateUser();

  const form = useForm({
    defaultValues: user ?? { name: '', email: '' },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });
  // render form...
}
```

**Query Keys Factory Pattern:**
```ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
// Usage: useQuery({ queryKey: userKeys.detail(userId), ... })
// Invalidate: queryClient.invalidateQueries({ queryKey: userKeys.lists() })
```

---

## Performance Tips

- Set appropriate `staleTime` — 0 means always refetch, Infinity means never
- Use `placeholderData` for instant skeleton-to-content transitions
- `select` option to transform/filter data without re-renders on unchanged subsets
- `structuralSharing` (default true) prevents unnecessary re-renders via deep comparison
- Prefetch on hover for anticipated navigation
- Use `queryClient.ensureQueryData` in loaders for SSR hydration
