---
name: drizzle-neon
description: "Drizzle ORM 0.45 + Neon serverless Postgres for Next.js 16: schemas, HTTP vs WebSocket connections, migrations, RSC patterns, and this environment's Neon MCP tools."
version: 1.0.0
license: MIT
---

# Drizzle ORM + Neon Postgres for Next.js 16

The 2026 serverless-native database stack. SQL-like TypeScript queries, types inferred from schema, ~60KB Drizzle client (vs Prisma's ~500KB+), zero codegen step, first-class edge runtime support.

## Version pairing (verified 2026-07-04 via `npm view`)

| Package | Version | Notes |
|---|---|---|
| `drizzle-orm` | `^0.45` | Core ORM, runtime-only ~60KB. Stable line (0.45.2 as of 2026-07-04). **v1.0 is RC-only** (1.0.0-rc.4, 2026-06-27 — relations v2, codec system, drizzle-kit SDK + MCP server); stay on 0.45 until GA, then follow the [v1 upgrade guide](https://orm.drizzle.team/docs/upgrade-v1). |
| `drizzle-kit` | latest | CLI for migrations + studio |
| `@neondatabase/serverless` | latest | Neon's HTTP/WebSocket driver — edge-native |
| `dotenv` (or use Next.js env) | optional | Local env loading for migration scripts |

## Install

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

Add to `.env.local`:

```bash
DATABASE_URL=postgresql://user:pass@ep-cool-name.region.neon.tech/dbname?sslmode=require
```

(Get this from Neon dashboard or via the `neon-postgres` Anthropic skill / `mcp__MCP_DOCKER__get_connection_string` MCP tool.)

## Schema

**`db/schema.ts`** — the single source of truth. Types are inferred from here:

```ts
import { pgTable, text, timestamp, uuid, integer, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
}));

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  published: boolean('published').notNull().default(false),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Inferred types — use these everywhere
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

## Connection — pick the right driver

Neon offers two transport modes via `@neondatabase/serverless`. Choose by runtime:

### HTTP (recommended default — Vercel Edge + Node)

```ts
// db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

Works everywhere. One round-trip per query (no transactions across queries). Best for stateless Vercel handlers.

### WebSocket pool (when you need multi-statement transactions)

```ts
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

Required for `db.transaction(async (tx) => { ... })`. Slightly heavier — uses persistent WebSocket. Edge-compatible.

## Queries (SQL-shaped TypeScript)

```ts
import { db } from '@/db';
import { users, posts } from '@/db/schema';
import { eq, and, desc, ilike } from 'drizzle-orm';

// SELECT
const allUsers = await db.select().from(users);

const user = await db.select().from(users).where(eq(users.email, 'a@b.com')).limit(1);

const recentPosts = await db
  .select()
  .from(posts)
  .where(and(eq(posts.published, true), ilike(posts.title, '%next%')))
  .orderBy(desc(posts.createdAt))
  .limit(20);

// JOIN
const postsWithAuthors = await db
  .select({
    post: posts,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(users.id, posts.authorId))
  .where(eq(posts.published, true));

// INSERT (typed via NewPost)
const [created] = await db
  .insert(posts)
  .values({ authorId: user[0].id, title: 'Hello', body: 'World' })
  .returning();

// UPDATE
await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, created.id));

// DELETE
await db.delete(posts).where(eq(posts.id, created.id));
```

## Relational queries (eager loading with types)

```ts
// db/schema.ts (additional)
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));

// Query:
const u = await db.query.users.findFirst({
  where: eq(users.id, '...'),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
      limit: 5,
    },
  },
});
// u is typed as User & { posts: Post[] } — no manual type annotation
```

## Migrations — push (dev) vs migrate (prod)

**`drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Dev workflow — `drizzle-kit push`

```bash
npx drizzle-kit push
```

Diffs your schema against the live DB and applies changes directly. No migration files. Fast iteration. **Never use in production** — destructive changes (column drops, type changes) execute without review.

### Production workflow — `drizzle-kit migrate`

```bash
npx drizzle-kit generate    # writes SQL migration to db/migrations/
# Review the SQL
npx drizzle-kit migrate     # applies pending migrations
```

Committed migration files give you a reviewable, reversible audit trail. Run `migrate` in CI as a deploy step before the new server starts.

### Drizzle Studio (local DB GUI)

```bash
npx drizzle-kit studio   # localhost browser GUI for your DB
```

Faster than psql for ad-hoc browsing.

## Next.js 16 + RSC patterns

### Server Component direct query (cheapest)

```tsx
// app/posts/page.tsx
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function PostsPage() {
  const rows = await db
    .select({ post: posts, author: users.name })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  return (
    <ul>
      {rows.map(({ post, author }) => (
        <li key={post.id}>{post.title} by {author}</li>
      ))}
    </ul>
  );
}
```

### With Cache Components (`use cache`)

```tsx
async function getPublishedPosts() {
  'use cache';
  cacheLife('hours');
  cacheTag('posts');
  return db.select().from(posts).where(eq(posts.published, true));
}
```

Pair with `revalidateTag('posts')` from a Server Action after a mutation — fresh data on next read, no client refetch needed.

### Server Action with optimistic invalidation

```tsx
'use server';

import { db } from '@/db';
import { posts } from '@/db/schema';
import { revalidateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.insert(posts).values({
    authorId: '...',
    title: formData.get('title') as string,
    body: formData.get('body') as string,
  });
  revalidateTag('posts');
}
```

## ATLAS Neon MCP tools (already available)

This environment ships with Neon MCP tools — use them BEFORE writing manual `psql` queries:

| Tool | Purpose |
|---|---|
| `mcp__MCP_DOCKER__list_projects` | List your Neon projects |
| `mcp__MCP_DOCKER__describe_project` | Connection strings, branches, roles |
| `mcp__MCP_DOCKER__get_connection_string` | Pull a `DATABASE_URL` for any branch |
| `mcp__MCP_DOCKER__run_sql` | One-shot SQL — handy for inspection |
| `mcp__MCP_DOCKER__run_sql_transaction` | Multi-statement |
| `mcp__MCP_DOCKER__describe_table_schema` | Inspect a table's columns/indexes |
| `mcp__MCP_DOCKER__prepare_database_migration` / `complete_database_migration` | Branch-based safe migrations (test on a branch, then merge) |
| `mcp__MCP_DOCKER__prepare_query_tuning` / `complete_query_tuning` | EXPLAIN-driven index suggestions |

The `anthropic-skills:neon-postgres` skill is also active — load it for Neon-specific features (auth, branching, data API).

## Common bugs

| Symptom | Cause | Fix |
|---|---|---|
| `DATABASE_URL is undefined` | Edge runtime, env not loaded | Use `process.env.DATABASE_URL!` and ensure it's set in Vercel project env (not just `.env.local`) |
| `transaction is not a function` | Using `neon-http` driver | Switch to `neon-serverless` (WebSocket pool) for transactions |
| `drizzle-kit push` hangs | Neon endpoint cold | Wait 10s for cold start; or hit the DB with a `SELECT 1` first |
| Schema drift after `push` | Forgot to `git add db/schema.ts` | The schema file IS the source of truth — always commit it |
| Types not updating in IDE | TS server cached | Restart TS server (`Cmd+Shift+P → TypeScript: Restart`) |
| Slow first query in serverless | Connection pool cold | Use the HTTP driver (no pool), or warm up via a route handler called by Vercel Cron |

## When NOT to use Drizzle / Neon

- You want a managed admin UI for non-devs → Supabase (Postgres + Auth + Studio in one)
- You need offline-first / sync → use PowerSync, Yjs, or Replicache + Postgres backend
- You're on Cloudflare D1 / Turso → Drizzle still works (just swap driver), but skip Neon entirely

## Sources

- [Drizzle ORM docs](https://orm.drizzle.team/)
- [Drizzle Neon tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [`drizzle-orm` on npm](https://www.npmjs.com/package/drizzle-orm)
