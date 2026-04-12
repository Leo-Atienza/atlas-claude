# /db-schema -- Design and validate database schema

You are handling: **$ARGUMENTS**

Execute autonomously. Design, generate migration, apply, seed.

---

## Step 1 -- Understand the data model

If not clear from the arguments, ask these questions (max 3):
- What entities exist and their relationships?
- What queries will be most frequent?
- Multi-tenant or single-tenant?

Skip questions if the domain is obvious from context or arguments.

## Step 2 -- Load database skills

1. Read `skills/fullstack-dev/postgres-pro/SKILL.md` -- Postgres patterns
2. Read `skills/fullstack-dev/sql-pro/SKILL.md` -- SQL optimization
3. If Supabase: read `skills/fullstack-dev/supabase-pro/SKILL.md` -- RLS, Auth
4. If Prisma in use: check Prisma MCP for schema sync

## Step 3 -- Design the schema

### 3a. Entity-Relationship Diagram

Generate a Mermaid ERD in the project docs:

```mermaid
erDiagram
    USER ||--o{ POST : creates
    POST ||--o{ COMMENT : has
    ...
```

### 3b. SQL DDL

Follow these conventions:
- **Primary keys**: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- **Timestamps**: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`
- **Soft delete**: `deleted_at timestamptz` (if needed)
- **Text**: Prefer `text` over `varchar` (Postgres has no performance difference)
- **Enums**: Use Postgres enums or check constraints (prefer check constraints for easier migration)
- **Foreign keys**: Always specify `ON DELETE` behavior (CASCADE, SET NULL, or RESTRICT)
- **Indexes**: Add for columns used in WHERE, JOIN, ORDER BY. Use `EXPLAIN ANALYZE` to verify.
- **Naming**: snake_case for everything. Plural table names. `_id` suffix for foreign keys.

### 3c. RLS Policies (if Supabase)

For each table:
- SELECT: who can read? (own rows, team rows, public)
- INSERT: who can create?
- UPDATE: who can modify? (owner only, team admins)
- DELETE: who can delete? (owner only, admin only)

### 3d. TypeScript Types

Generate matching TypeScript interfaces/types for the client:
- Row type (full database row)
- Insert type (omit generated fields)
- Update type (partial, omit immutable fields)

## Step 4 -- Apply via migration

Detect available tools and use the best one:

### Supabase MCP (preferred if Supabase project)
1. Use `apply_migration` with the DDL
2. Use `generate_typescript_types` for client types
3. Verify with `describe_table_schema`

### Neon MCP (via MCP_DOCKER)
1. Use `prepare_database_migration` (creates temp branch)
2. Use `run_sql` to apply DDL on temp branch
3. Verify with `describe_table_schema`
4. Use `complete_database_migration` to merge to main

### Prisma MCP
1. Update `schema.prisma` to match design
2. Run `npx prisma migrate dev --name <migration-name>`
3. Run `npx prisma generate` for client types

### Raw SQL (fallback)
1. Write migration file: `migrations/YYYYMMDD_<name>.sql`
2. Apply manually or via project's migration tool

## Step 5 -- Create update trigger

Add auto-update for `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table:
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON <table_name>
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Step 6 -- Seed data

Generate a seed script with realistic test data:
- Use faker-like patterns (not lorem ipsum)
- Cover edge cases: empty strings, null optionals, maximum lengths
- Create related records in correct order (respect foreign keys)
- 10-50 rows per table (enough to test queries)

## Step 7 -- Validate

- Run seed script successfully
- Test key queries with `EXPLAIN ANALYZE` -- flag sequential scans on large tables
- Verify RLS policies block unauthorized access (if Supabase)
- Verify foreign key constraints work (try deleting referenced rows)
- Security: no SQL injection in any dynamic queries

## Step 8 -- Wrap up

- Summarize: tables created, relationships, indexes, RLS policies
- Output the Mermaid ERD for documentation
- Suggest: monitoring slow queries, adding indexes as usage patterns emerge
