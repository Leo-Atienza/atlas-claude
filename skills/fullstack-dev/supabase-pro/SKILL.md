---
name: supabase-pro
description: Supabase Auth, RLS, Storage, Edge Functions, Realtime, TypeScript patterns for Next.js and React Native
keywords: [supabase, rls, row level security, edge functions, supabase auth, supabase storage, realtime]
version: 1.0.0
---

# Supabase Pro

Expert-level Supabase patterns for Next.js App Router and React Native/Expo.

## 1. Client Initialization

Install: `npm install @supabase/supabase-js @supabase/ssr`

**Never use `@supabase/auth-helpers`** — it is deprecated. Use `@supabase/ssr` for all SSR/cookie-based auth.

### Browser Client (Client Components)

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (Server Components, Route Handlers, Server Actions)

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

### Middleware (Auth session refresh)

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'] };
```

## 2. Auth Flows

### Sign Up

```ts
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: { data: { full_name: 'John Doe' } },
});
```

### Sign In (Email/Password)

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### OAuth (Google, GitHub, etc.)

```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
});
```

Auth callback route:
```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
```

### Server-side Auth Check

```ts
// In any Server Component or Route Handler
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
```

**Rule**: Always use `getUser()` (hits Supabase Auth server) over `getSession()` (reads JWT locally, can be spoofed).

## 3. Row Level Security (RLS)

**Every table gets RLS enabled. No exceptions.**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Common Policy Patterns

```sql
-- User owns row
CREATE POLICY "Users can read own data" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Team access
CREATE POLICY "Team members can read" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
  );

-- Public read, authenticated write
CREATE POLICY "Anyone can read" ON posts
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can write" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Service role bypass (for server-side admin ops)
-- Use supabase service role key, NOT anon key
```

## 4. Realtime Subscriptions

### Postgres Changes (row-level)

```ts
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: '*', // INSERT | UPDATE | DELETE
    schema: 'public',
    table: 'messages',
    filter: 'room_id=eq.123',
  }, (payload) => {
    console.log('Change:', payload);
  })
  .subscribe();

// Cleanup
return () => { supabase.removeChannel(channel); };
```

### Broadcast (ephemeral, no DB)

```ts
const channel = supabase.channel('room-1');
channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
  setCursors(payload);
}).subscribe();

// Send
channel.send({ type: 'broadcast', event: 'cursor', payload: { x: 100, y: 200 } });
```

### Presence (who's online)

```ts
const channel = supabase.channel('room-1');
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  setOnlineUsers(Object.values(state).flat());
}).subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: user.id, name: user.name });
  }
});
```

## 5. Storage

### Upload

```ts
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
```

### Download / Public URL

```ts
// Public bucket
const { data } = supabase.storage.from('public-assets').getPublicUrl('hero.png');

// Private bucket — signed URL (expires)
const { data, error } = await supabase.storage
  .from('private-docs')
  .createSignedUrl('report.pdf', 3600); // 1 hour
```

### Image Transforms

```ts
const { data } = supabase.storage.from('avatars').getPublicUrl('avatar.png', {
  transform: { width: 200, height: 200, resize: 'cover' },
});
```

## 6. Edge Functions (Deno)

```ts
// supabase/functions/send-welcome/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { email } = await req.json();
  // ... send welcome email

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Invoke from client:
```ts
const { data, error } = await supabase.functions.invoke('send-welcome', {
  body: { email: 'user@example.com' },
});
```

Deploy: `supabase functions deploy send-welcome`
Secrets: `supabase secrets set RESEND_API_KEY=re_xxx`

## 7. TypeScript Types

```bash
# Generate types from your schema
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts

# Or from local DB
supabase gen types typescript --local > lib/database.types.ts
```

Usage:
```ts
import { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type InsertProfile = Database['public']['Tables']['profiles']['Insert'];

// Typed client
const supabase = createClient<Database>(url, key);
const { data } = await supabase.from('profiles').select('*'); // data: Profile[]
```

**Rule**: Regenerate types after every migration.

## 8. Migration Workflow

```bash
# Create new migration
supabase migration new add_profiles_table

# Edit: supabase/migrations/TIMESTAMP_add_profiles_table.sql

# Apply locally
supabase db reset  # destructive, resets + applies all migrations

# Push to remote
supabase db push

# Branch-based development (Supabase branching)
supabase branches create feat/user-profiles
supabase db push --branch feat/user-profiles
# Merge via dashboard when ready
```

## Quick Reference

| Task | Command / Pattern |
|------|-------------------|
| Create client (browser) | `createBrowserClient()` from `@supabase/ssr` |
| Create client (server) | `createServerClient()` with cookie handlers |
| Auth check (server) | `supabase.auth.getUser()` — never `getSession()` |
| Enable RLS | `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` |
| Generate types | `supabase gen types typescript --project-id X` |
| New migration | `supabase migration new name` |
| Deploy edge fn | `supabase functions deploy fn-name` |
| Set secrets | `supabase secrets set KEY=value` |
