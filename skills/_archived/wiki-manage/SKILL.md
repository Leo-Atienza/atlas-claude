---
name: wiki-manage
description: "Manage the personal knowledge wiki (Obsidian vault at Documents/Wiki/) and per-project wikis. Five modes: ingest (compile source into wiki pages), query (search and retrieve knowledge), lint (health check), evolve (refine schema), scaffold (init project wiki). Triggers on: '/wiki-ingest', '/wiki-query', '/wiki-lint', '/wiki-evolve', 'add to my wiki', 'ingest this article', 'what does my wiki say about', 'wiki health check'. Also auto-triggered by /new and /flow:start for project wiki scaffolding."
---

# Wiki Manager (SK-101)

Personal knowledge wiki based on the Karpathy LLM Wiki pattern. Knowledge is compiled once at ingest time, not re-derived on every query.

## Decision Tree

```
Input Analysis
+-- Source material provided (URL, file, pasted text) --> INGEST
+-- Question about knowledge --> QUERY
+-- "health", "check", "lint" --> LINT
+-- "schema", "evolve", "refine" --> EVOLVE
+-- New project being created --> SCAFFOLD
+-- Ambiguous --> Ask user which mode
```

---

## Global Wiki Paths

| Path | Purpose |
|------|---------|
| `&lt;your-wiki-path&gt;\` | Vault root (bash: `~/Documents/Wiki/`) |
| `raw/` | Immutable source drops (articles/, papers/, clips/) |
| `wiki/index.md` | Page catalog — read first on every query |
| `wiki/log.md` | Append-only activity trail |
| `wiki/hot.md` | Warm cache of recent pages |
| `wiki/overview.md` | Schema and usage guide |
| `wiki/entity/` | People, tools, projects, organizations |
| `wiki/concept/` | Ideas, theories, frameworks |
| `wiki/source/` | Compiled notes from raw/ sources |
| `wiki/synthesis/` | Cross-source analysis |

## Tooling

Use **native Claude Code file tools** — no Obsidian MCP required:

| Operation | Tool |
|-----------|------|
| Read a wiki page | `Read` |
| Write a new page | `Write` |
| Update a page | `Edit` |
| List pages in a dir | `Bash`: `ls ~/Documents/Wiki/wiki/**/*.md` or `find ~/Documents/Wiki/wiki -name "*.md"` |
| Search page content | `Grep` across path `&lt;your-wiki-path&gt;\wiki\` |
| Save raw source | `Write` to `raw/{subdir}/YYYY-MM-DD-{slug}.md` |

Obsidian MCP (`mcp__obsidian__*` or `mcp__MCP_DOCKER__obsidian_*`) may be used as an enhancement if available, but is never required.

## Frontmatter Schema

```yaml
---
title: "Page title"
type: entity|concept|source|synthesis
sources: []          # raw/ filenames or URLs
related: []          # [[wikilinks]]
kg_entities: []      # optional atlas-kg entity IDs
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

---

## Mode 1: INGEST

**Trigger:** User provides content — URL, file path, pasted text, meeting notes.

### Steps

1. **Classify source**: article | paper | clip | meeting-notes | dataset
2. **Save to raw/**:
   - Filename: `YYYY-MM-DD-{slug}.md` (lowercase kebab-case)
   - Place in appropriate subfolder: `raw/articles/`, `raw/papers/`, or `raw/clips/`
   - Add source frontmatter: `type: raw`, `source_url:`, `ingested_at:`
   - If URL provided: fetch content via WebFetch, convert to markdown
   - **NEVER overwrite existing raw/ files** — they are immutable
3. **Discuss key takeaways**: Before writing any wiki pages, present 3-5 key takeaways and ask what to emphasize. This is the human-in-the-loop moment.
4. **Determine affected pages**: What entities, concepts, and source pages does this touch? Read existing pages before deciding to update vs create.
5. **Create/update wiki pages**:
   - Create `wiki/source/{slug}.md` with compiled summary
   - Create or update entity pages in `wiki/entity/`
   - Create or update concept pages in `wiki/concept/`
   - Add `[[wikilinks]]` bidirectionally between related pages
   - **Always read existing page first** before patching — never truncate existing knowledge
6. **Update index.md**: Add rows for new pages, update summaries for modified pages. Update `total_pages:` count.
7. **Append to log.md**: `| {date} | ingest | {page} | {source description} |`
8. **Update hot.md**: Add/refresh recently touched pages
9. **Optional KG bridge**: For high-confidence factual relationships, call:
   ```
   node ~/.claude/hooks/atlas-kg.js add "{entity}" "{predicate}" "{object}" --from="{date}"
   ```
   Only for clear facts (e.g., "GPT-4o has_capability multimodal"), not opinions or claims.

### Quality Check
After ingest, verify:
- [ ] Raw file saved and immutable
- [ ] At least one wiki page created/updated
- [ ] All new pages have complete frontmatter
- [ ] index.md reflects the new pages
- [ ] log.md has the ingest entry
- [ ] Wikilinks are bidirectional

---

## Mode 2: QUERY

**Trigger:** User asks about something that might be in the wiki.

### Steps

1. **Check hot.md** — `Read &lt;your-wiki-path&gt;\wiki\hot.md` (warm cache)
2. **Read index.md** — `Read &lt;your-wiki-path&gt;\wiki\index.md` — scan for matching titles/summaries
3. **Search vault** — `Grep` with keyword pattern across `&lt;your-wiki-path&gt;\wiki\`
4. **Read matched pages** — `Read` each matched file path
5. **Follow wikilinks** — if matched pages have `related:` entries, `Read` those pages one hop deep
6. **Synthesize response** — combine knowledge from multiple pages. Always cite sources as `[[Page Title]]` wikilinks.
7. **Offer to file back** — if the synthesis is valuable (comparison, analysis, new insight), offer to save as `wiki/synthesis/{slug}.md`
8. **Append to log.md**: `| {date} | query | - | {search terms} |`

### If No Results Found
- Tell the user what was searched and that no matching pages exist
- Suggest: "Want me to research this and ingest it into the wiki?"
- Do NOT make up answers from training data — the wiki is the source of truth for this system

---

## Mode 3: LINT

**Trigger:** `/wiki-lint` or "wiki health check"

### Steps

1. **List all pages** — `Bash`: `find ~/Documents/Wiki/wiki -name "*.md"`
2. **Check each page for** (`Read` each file):
   - Valid YAML frontmatter (title, type, created, updated present)
   - `sources:` references actual files in `raw/` (not phantom)
   - `related:` wikilinks resolve to real pages (not broken)
   - `updated:` date older than 90 days (stale)
   - Page appears in `wiki/index.md` (not orphaned from index)
3. **Check index.md** — every entry points to a real page (no phantom entries)
4. **Check for missing pages** — concepts or entities mentioned in text but lacking their own page
5. **Report findings** as a table:

   | Severity | Issue | Page | Details |
   |----------|-------|------|---------|
   | error | broken-wikilink | page.md | [[Missing Page]] not found |
   | warning | stale | old-page.md | Not updated in 120 days |
   | info | missing-page | - | "React Server Components" mentioned but no page exists |

6. **Do NOT auto-fix** — report only, await user instruction (Review vs Implement rule)
7. **Append to log.md**: `| {date} | lint | - | {issues_found} issues found |`

---

## Mode 4: EVOLVE

**Trigger:** `/wiki-evolve` or "refine the wiki schema"

### Steps

1. Read `wiki/overview.md` for current schema
2. Read a sample of wiki pages to assess current conventions
3. Analyze: Are page types sufficient? Is frontmatter serving its purpose? Are naming conventions consistent?
4. Propose changes with rationale — present as a diff or table
5. Wait for approval before applying any changes
6. If approved: update `wiki/overview.md`, update `CLAUDE.md` in vault root, patch affected pages
7. Append to log.md: `| {date} | evolve | - | {description of change} |`

---

## Mode 5: SCAFFOLD

**Trigger:** Called by `/new` or `/flow:start` when creating a new project. Also callable directly.

### Steps

1. Check if `wiki/` already exists in the project root — if yes, skip (idempotent)
2. Create project wiki structure:

```
project-root/
├── wiki/
│   ├── index.md        # project-scoped page catalog
│   ├── log.md          # project activity trail
│   ├── decisions/      # architecture decisions, trade-offs
│   ├── context/        # domain context, requirements, research
│   └── synthesis/      # cross-cutting analysis
├── raw/
│   └── .gitkeep        # project-scoped source docs
```

3. Bootstrap `wiki/index.md`:

```yaml
---
title: Project Wiki Index
type: index
updated: {today}
total_pages: 0
---
```

With empty tables for Decisions, Context, Synthesis.

4. Bootstrap `wiki/log.md`:

```
| Date | Action | Page | Notes |
|------|--------|------|-------|
| {today} | init | - | Project wiki initialized |
```

5. Project wiki frontmatter is simplified:

```yaml
---
title: "Page title"
type: decision|context|synthesis
related: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

6. Add `wiki/` and `raw/` to project `.gitignore` if appropriate, or leave tracked (project-dependent)

### Project Wiki vs Global Wiki
- **Project wiki** — scoped to one project. Decisions, context, synthesis about that project.
- **Global wiki** — cross-project personal knowledge. Articles, research, learning materials.
- They don't overlap. Project wikis don't have entity/concept pages. Global wiki doesn't track project decisions.
