---
name: better-auth
description: "Better Auth 1.6 for Next.js 16 (Lucia's 2026 successor): email/password, OAuth, magic links, passkeys, 2FA, organizations. Edge-native; pairs with Drizzle + Neon."
version: 1.0.0
license: MIT
---

# Better Auth for Next.js 16

The recommended auth library for new TypeScript projects in 2026 — replaces both Lucia (officially sunset by its maintainer, who redirected users to better-auth) and NextAuth/Auth.js for greenfield apps. Plugin-based, ships only what you import, designed from day one for edge runtimes (Vercel Edge, Cloudflare Workers, Bun).

## Version pairing (verified 2026-07-04 via `npm view`)

| Package | Version | Notes |
|---|---|---|
| `better-auth` | `^1.6` | Core + email/password + sessions. Stable line (1.6.23 as of 2026-07-04). |
| `drizzle-orm` | `^0.45` | DB adapter (Drizzle is recommended). Alternatives: `@better-auth/prisma`, `@better-auth/mongoose` |
| `@better-auth/cli` (optional) | latest | Schema generator: writes Drizzle schema from your auth config |

> **1.7 is in RC** (announced 2026-06-26; npm stable is still 1.6.x) and is **breaking**: MCP support moves to `@better-auth/mcp`, `validAudiences` → protected resources, the deprecated `oidcProvider` plugin is removed, stricter PKCE, proxy-header trust off by default. New in 1.7: DPoP-bound tokens, OIDC back-channel logout, built-in i18n, a Drizzle-v1-relations adapter. Stay on 1.6 until 1.7 GA, then follow the [1.7 upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide).

## Install

```bash
npm install better-auth
# DB driver: pick one (matches your existing setup)
npm install drizzle-orm @neondatabase/serverless
```

Add to `.env.local`:

```bash
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL=http://localhost:3000

# OAuth (only what you actually use)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Server setup

**`lib/auth.ts`** — the canonical config:

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/auth-schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,    // set true once you wire up email sender
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    cookieCache: { enabled: true, maxAge: 60 * 5 },   // 5min in-memory cache, big perf win
  },
});

export type Session = typeof auth.$Infer.Session;
```

## DB schema (auto-generated)

```bash
npx @better-auth/cli generate
```

This writes `db/auth-schema.ts` with `user`, `session`, `account`, `verification` tables typed for Drizzle. Commit it.

Then push to your DB:

```bash
npx drizzle-kit push    # dev
# or: npx drizzle-kit generate && npx drizzle-kit migrate    # prod
```

## Route handler — mounts auth endpoints

**`app/api/auth/[...all]/route.ts`**

```ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

This single file exposes:
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `GET /api/auth/callback/github`
- (and every other endpoint from enabled plugins)

## Client setup

**`lib/auth-client.ts`**

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

## Sign-up / Sign-in components

```tsx
'use client';

import { signUp, signIn } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  async function action(formData: FormData) {
    const { error } = await signUp.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    });
    if (error) return setError(error.message);
    router.push('/dashboard');
  }

  return (
    <form action={action} className="space-y-3">
      <input name="name" required className="w-full rounded border px-3 py-2" placeholder="Name" />
      <input name="email" type="email" required className="w-full rounded border px-3 py-2" placeholder="Email" />
      <input name="password" type="password" required className="w-full rounded border px-3 py-2" placeholder="Password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-zinc-900 px-3 py-2 text-white">Sign up</button>
    </form>
  );
}
```

OAuth (one button):

```tsx
'use client';
import { signIn } from '@/lib/auth-client';

export function GitHubButton() {
  return (
    <button onClick={() => signIn.social({ provider: 'github', callbackURL: '/dashboard' })}>
      Continue with GitHub
    </button>
  );
}
```

## Reading the session

### In a Server Component (most common)

```tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  return <h1>Hello {session.user.name}</h1>;
}
```

### In a Client Component (reactive)

```tsx
'use client';
import { useSession } from '@/lib/auth-client';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  if (isPending) return <div>…</div>;
  if (!session) return <a href="/sign-in">Sign in</a>;
  return <div>{session.user.email}</div>;
}
```

### In a Route Handler / Server Action

```ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response('Unauthorized', { status: 401 });
  // …
}
```

## Middleware — protecting routes

**`middleware.ts`** (Next.js root)

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

Middleware only checks for cookie presence (fast — no DB hit). The actual session validation happens inside the route via `auth.api.getSession()`.

> Note: in Next.js 16, the root middleware file moved from `middleware.ts` → `proxy.ts` (with the same API). Use whichever your project is on; the `next-upgrade` codemod handles the rename.

## Plugins (opt-in features)

```ts
import { twoFactor, organization, magicLink, passkey } from 'better-auth/plugins';

export const auth = betterAuth({
  // ... base config
  plugins: [
    twoFactor(),                                    // TOTP 2FA
    magicLink({ sendMagicLink: async ({ email, url }) => sendEmail({ to: email, body: url }) }),
    passkey(),                                      // WebAuthn / Touch ID / Face ID
    organization({ allowUserToCreateOrganization: true }),
  ],
});
```

Each plugin auto-extends the schema (re-run `npx @better-auth/cli generate` after adding) and exposes its own endpoints.

## Common bugs

| Symptom | Cause | Fix |
|---|---|---|
| `BETTER_AUTH_SECRET is required` at runtime | Env not set in Vercel | Add `BETTER_AUTH_SECRET` to project env on Vercel dashboard |
| OAuth callback URL mismatch | Forgot to register `https://yourapp.vercel.app/api/auth/callback/github` in the OAuth app | Add the exact callback URL in GitHub/Google OAuth settings |
| `Cookie not set` after sign-in in prod | Cookie domain mismatch | Set `BETTER_AUTH_URL` to your actual production URL (no trailing slash) |
| `Cannot find module 'better-auth/next-js'` | Old version | `npm install better-auth@latest` (^1.6) |
| Session always `null` in Server Component | Forgot `await headers()` | Next 16 requires async — `headers: await headers()` |
| Drizzle adapter complains about missing tables | Didn't push schema | Run `npx drizzle-kit push` after `cli generate` |

## When NOT to use Better Auth

- Existing NextAuth/Auth.js project that works fine → don't migrate (NextAuth v5 is solid; better-auth's edge is mainly for greenfield)
- Need enterprise SSO / SAML / SCIM out of the box → Clerk or WorkOS will save you weeks
- "Just sign in with Google" and nothing else, ever → NextAuth v5 is 5 lines and zero schema work

## When to choose Better Auth

- New project on Next.js + Drizzle + Neon (the user's primary stack)
- You want email/password + OAuth + 2FA without piecing together libraries
- You're targeting edge runtimes
- You want a typed session and don't want vendor lock-in

## Sources

- [Better Auth docs](https://www.better-auth.com/docs/introduction)
- [Better Auth + Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [`better-auth` on npm](https://www.npmjs.com/package/better-auth)
- [Lucia → Better Auth migration rationale (maintainer note)](https://lucia-auth.com/)
