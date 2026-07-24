# API Service Template

## Stack
- Next.js 16 API Routes (App Router) or standalone Node
- Drizzle ORM + Neon (serverless Postgres)
- Zod (validation)
- Vitest (testing)

## File Structure
```
src/
  app/api/v1/[resource]/route.ts
  lib/db/index.ts, db/schema.ts
  lib/validators/
  lib/services/
  types/
```

## Setup Checklist
- [ ] Neon database provisioned
- [ ] Drizzle schema + `drizzle-kit` migrations (push for dev, generate/migrate for prod)
- [ ] Zod validators for all inputs
- [ ] Error handling middleware (RFC 7807)
- [ ] Auth middleware
- [ ] Rate limiting

## Skills to Load
SK-130 (Drizzle + Neon), SK-120 (API Designer), SK-056 (Vitest)
