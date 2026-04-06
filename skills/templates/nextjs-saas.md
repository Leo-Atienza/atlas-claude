# Next.js SaaS Template

## Stack
- Next.js 15+ (App Router, RSC)
- Supabase (Auth + DB + Storage + Realtime)
- Stripe (Payments: Checkout, Subscriptions, Customer Portal)
- Prisma (ORM, type generation)
- Resend + React Email (Transactional email)
- shadcn/ui + Motion + GSAP + Lenis
- Vitest + Playwright

## File Structure
```
src/
  app/
    (auth)/login/page.tsx, signup/page.tsx
    (dashboard)/layout.tsx, page.tsx
    api/webhooks/stripe/route.ts
  components/ui/ (shadcn), shared/, layouts/
  lib/supabase/client.ts, server.ts
    stripe/config.ts, webhooks.ts
    prisma/client.ts
  types/
```

## Setup Checklist
- [ ] Supabase project + RLS policies
- [ ] Stripe products + webhook endpoint
- [ ] Prisma schema + generate types
- [ ] Supabase gen types typescript
- [ ] Auth middleware
- [ ] Email templates

## MCP Servers to Activate
supabase, stripe, prisma, resend, shadcn

## Skills to Load
SK-029, SK-032, FS-020, FS-060, FS-061, SK-047, SK-042
