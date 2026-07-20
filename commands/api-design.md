# /api-design -- Design and generate API from spec

You are handling: **$ARGUMENTS**

Execute autonomously. Design the API, generate code, validate.

---

## Step 1 -- Determine API type and route

| Input | Route |
|-------|-------|
| User describes endpoints in words | Design OpenAPI spec first (Step 3) |
| User provides OpenAPI/Swagger spec URL | Use OpenAPI MCP to auto-consume |
| User provides OpenAPI spec file | Parse and generate (Step 4) |
| User wants to consume existing API | Use OpenAPI MCP (set OPENAPI_SPEC_URL) |

## Step 2 -- Load API skills

1. Read `skills/fullstack-dev/api-designer/SKILL.md` -- API design patterns
2. If GraphQL: read `skills/fullstack-dev/graphql-architect/SKILL.md`
3. If Supabase backend: read `skills/fullstack-dev/supabase-pro/SKILL.md`
4. If consuming external API: configure OpenAPI MCP with spec URL

## Step 3 -- Design the API spec (if creating new API)

Write an OpenAPI 3.1 spec with:

1. **Resources** -- nouns, not verbs. RESTful structure:
   - `GET /resources` -- list (with pagination, filtering)
   - `GET /resources/:id` -- get single
   - `POST /resources` -- create
   - `PATCH /resources/:id` -- partial update
   - `DELETE /resources/:id` -- delete (or soft-delete)

2. **Request/Response schemas**:
   - TypeScript-friendly types (camelCase properties)
   - Consistent envelope: `{ data, error, meta }` or flat
   - Pagination: cursor-based preferred, offset for simple cases
   - RFC 7807 error responses with `type`, `title`, `status`, `detail`

3. **Authentication**:
   - Bearer token (Supabase JWT) or API key
   - Document required scopes/roles per endpoint

4. **Rate limiting** headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

Save spec as `openapi.yaml` or `openapi.json` in project root.

## Step 4 -- Generate implementation

Based on detected or specified stack:

### Next.js App Router (default)
- Generate `app/api/` route handlers
- Use `NextRequest`/`NextResponse` patterns
- Add Zod validation for request bodies
- Add middleware for auth verification

### Supabase Edge Functions
- Generate `supabase/functions/` handlers
- Use Deno runtime patterns
- Wire to Supabase Auth for JWT verification
- Set up RLS policies for data access

### Standalone (Hono/Express)
- Generate route handlers with Hono (preferred) or Express
- Add OpenAPI validation middleware
- Wire auth middleware

## Step 5 -- Generate TypeScript client

Create a typed API client:
1. Generate types from OpenAPI spec
2. Create fetch-based client with:
   - Type-safe request/response
   - Error handling with typed errors
   - Auth header injection
   - Optional: TanStack Query hooks for React

## Step 6 -- Generate tests

For each endpoint:
1. Unit test with mocked dependencies (Vitest)
2. Integration test hitting real/test database
3. Edge cases: auth failures, validation errors, not found, rate limits

## Step 7 -- Validate

- Run all tests: `npx vitest run`
- Security review: check for injection, auth bypass, IDOR, mass assignment
- If Supabase: verify RLS policies cover all access patterns
- If applicable: run with OpenAPI MCP to verify spec matches implementation

## Step 8 -- Wrap up

- Summarize endpoints created, auth requirements, and testing status
- Suggest: API documentation generation, rate limiting setup, monitoring
