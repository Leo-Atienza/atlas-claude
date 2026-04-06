# API Service Template

## Stack
- Next.js API Routes or standalone Node
- Prisma + Neon (serverless Postgres)
- Zod (validation)
- Vitest (testing)

## File Structure
```
src/
  app/api/v1/[resource]/route.ts
  lib/prisma/client.ts, schema.prisma
  lib/validators/
  lib/services/
  types/
```

## Setup Checklist
- [ ] Neon database provisioned
- [ ] Prisma schema + generate types
- [ ] Zod validators for all inputs
- [ ] Error handling middleware (RFC 7807)
- [ ] Auth middleware
- [ ] Rate limiting

## Skills to Load
FS-028, FS-012, FS-052, SK-056
