# Next.js SaaS Template

## Stack
- Next.js 16 (App Router, RSC, Cache Components)
- Better Auth (email / OAuth / 2FA / passkeys) — or Supabase Auth
- Stripe (Payments: Checkout, Subscriptions, Customer Portal)
- Drizzle ORM + Neon (SQL-first, type inference)
- Resend + React Email (Transactional email)
- Tailwind v4 + shadcn/ui + GSAP
- Vitest + Playwright

## File Structure
```
src/
  app/
    (auth)/login/page.tsx, signup/page.tsx
    (dashboard)/layout.tsx, page.tsx
    api/webhooks/stripe/route.ts
  components/ui/ (shadcn), shared/, layouts/
  lib/auth/ (better-auth), db/index.ts + schema.ts (Drizzle)
    stripe/config.ts, webhooks.ts
  types/
```

## Setup Checklist
- [ ] Neon database + Drizzle schema (`drizzle-kit push`)
- [ ] Better Auth config (or Supabase project + RLS)
- [ ] Stripe products + webhook endpoint
- [ ] Auth middleware
- [ ] Email templates

## MCP Servers to Activate
Per-project (re-add via `INSTALLED.md`): `stripe`, `resend`. DB via Neon tools in `MCP_DOCKER`. (`prisma` / `supabase` MCPs are no longer user-scope.)

## Skills to Load
**impeccable** (SK-102 — the web build/design entry point), SK-029 (Next best practices), SK-030 (Cache Components), SK-131 (Better Auth), SK-130 (Drizzle + Neon), SK-040 (Tailwind v4), SK-042 (GSAP)
