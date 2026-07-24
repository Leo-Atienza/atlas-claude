---
name: wiki-manage
description: "Manage the personal knowledge wiki (Obsidian vault at Documents/Wiki/) and per-project wikis. Five modes: ingest (compile source into wiki pages), query (search and retrieve knowledge), lint (health check), evolve (refine schema), scaffold (init project wiki). Triggers on: '/wiki-ingest', '/wiki-query', '/wiki-lint', '/wiki-evolve', 'add to my wiki', 'ingest this article', 'what does my wiki say about', 'wiki health check'. Also auto-triggered by /new for project wiki scaffolding."
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
| `<your-vault-path>/` | Vault root (bash: `<your-vault-path>/`) |
| `raw/` | Immutable source drops (articles/, papers/, clips/) |
| `wiki/index.md` | Page catalog — read first on every query |
| `wiki/log.md` | Append-only activity trail |
| `wiki/hot.md` | Warm cache of recent pages |
| `wiki/overview.md` | Schema and usage guide |
| `wiki/entity/` | People, tools, projects, organizations |
| `wiki/concept/` | Ideas, theories, frameworks |
| `wiki/source/` | Compiled notes from raw/ sources |
| `wiki/synthesis/` | Cross-source analysis |
| `wiki/personal/` | Personal facts, procedures, profile, project-state, references, reflections, arcs (post-consolidation 2026-05-14) |
| `wiki/engineering/` | Patterns, solutions, errors, preferences, failures from coding work |
| `wiki/session-log/handoffs/` | Archived per-session handoffs |
| `wiki/session-log/transcripts/` | Full per-session chat logs (auto-written by SessionEnd hook) |

After the brain consolidation (2026-05-14), the vault contains personal + engineering knowledge in addition to external knowledge. The full schema (universal + type-specific extensions, per-type body templates) lives in `[[brain-consolidation]]` (`wiki/personal/arcs/brain-consolidation.md`). New types: feedback, procedure, profile, project-state, reference, reflection, preference, pattern, solution, error, failure, handoff, transcript, plan, folder-index.

## Tooling

When the **Obsidian MCP** server is loaded (`mcp__obsidian__*`), prefer those tools — they wrap the vault as a first-class resource and see Obsidian's runtime state (active file, search index, plugin data). Native file tools (Read/Write/Glob/Grep) remain the fallback when MCP is offline or doesn't cover the operation.

**Preferred — Obsidian MCP** (when `mcp__obsidian__obsidian_list_files_in_vault` resolves via ToolSearch; requires the Obsidian app to be RUNNING — the bridge process alone isn't enough, calls refuse on port 27124 when the app is closed):

| Operation | Tool |
|-----------|------|
| List pages in a dir | `mcp__obsidian__obsidian_list_files_in_dir` (vault root: `obsidian_list_files_in_vault`) |
| Read a wiki page | `mcp__obsidian__obsidian_get_file_contents` (batch: `obsidian_batch_get_file_contents`) |
| Search page content | `mcp__obsidian__obsidian_simple_search` (structured: `obsidian_complex_search`) |
| Append to a page (e.g. log row) | `mcp__obsidian__obsidian_append_content` |
| Patch a page section | `mcp__obsidian__obsidian_patch_content` |
| Recent changes | `mcp__obsidian__obsidian_get_recent_changes` |

(v8.14: tool ids are double-prefixed `mcp__obsidian__obsidian_*`; the old single-prefix names — and `search`/`get_active_file` — don't exist.)

The MCP requires Obsidian to be running with the **Local REST API** community plugin enabled. If a call returns connection refused, fall back to the native tools below or open Obsidian.

**Fallback — native file tools** (always available, used when MCP is offline or for paths outside the vault like `raw/` writes):

| Operation | Tool |
|-----------|------|
| Read a wiki page | `Read` |
| Write a new page | `Write` |
| Update a page | `Edit` |
| List pages in a dir | `Bash`: `ls <your-vault-path>/wiki/**/*.md` or `find <your-vault-path>/wiki -name "*.md"` |
| Search page content | `Grep` across path `<your-vault-path>/wiki\` |
| Save raw source | `Write` to `raw/{subdir}/YYYY-MM-DD-{slug}.md` |

**CLI fallback — Obsidian CLI** (when MCP is unavailable AND native search isn't enough):

| Operation | Command |
|-----------|---------|
| Index search returning vault-relative paths | `bash ~/.claude/hooks/wiki-search-cli.sh "<query>" [limit]` |
| Read a vault file | `obsidian vault=Wiki read path=<vault-rel-path>` (or just `Read` the absolute path) |
| Append to a vault file | `obsidian vault=Wiki append path=<vault-rel-path> content="..."` |
| List files | `obsidian vault=Wiki files folder=<subdir>` |

Backed by Obsidian's first-class CLI (`Obsidian.com` on Windows). Works without the Local REST API plugin and **launches Obsidian if not already running** — survives the cron-fires-while-Obsidian-closed case that breaks `mcp-obsidian`. The hook script wraps `obsidian vault=Wiki search query="..." path=wiki limit=N format=json` and returns a JSON array of vault-relative paths. For line context, `Grep` the returned paths.

**Installer caveat:** `search:context` (grep-style with line text) silently exits 127 on installer 1.11.7. The hook uses plain `search` instead. After upgrading the Obsidian installer to 1.12.7+, swap `search` → `search:context` in the hook to get inline line context.

Decision order when both are available: **MCP** for vault writes/structured patches (`append_content`, `patch_content`) — it's faster and doesn't spawn a shell; **CLI** for search and ops where MCP coverage is thin or scheduled (cron) reliability matters.

The legacy Docker-based variant `mcp__MCP_DOCKER__obsidian_*` is not currently wired; if it appears in a future deferred-tool list, treat it as equivalent to `mcp__obsidian__*`.

## Companion Skills (`kepano/obsidian-skills`)

Stored at `~/.claude/skills/_external/obsidian-skills/skills/`. These are Steph Ango's official Obsidian skills — referenced, not activated. **Read the relevant SKILL.md before doing the matching operation:**

| When you're about to… | Read this SKILL.md first |
|---|---|
| Ingest a URL — fetch and clean a web article | `_external/obsidian-skills/skills/defuddle/SKILL.md` (purpose-built; prefer over `WebFetch` for HTML pages, fallback to crawl4ai `crwl` then `firecrawl_scrape` if Defuddle is unavailable; do NOT use for `.md` URLs) |
| Write or edit a wiki page — wikilinks, embeds, callouts, frontmatter | `_external/obsidian-skills/skills/obsidian-markdown/SKILL.md` |
| Drive the vault from the shell — read, create, search, plugin ops | `_external/obsidian-skills/skills/obsidian-cli/SKILL.md` (refines the `obsidian vault=Wiki …` patterns above) |
| Build a `.base` table/card view across pages (synthesis) | `_external/obsidian-skills/skills/obsidian-bases/SKILL.md` |
| Build a `.canvas` mind map / visual MOC | `_external/obsidian-skills/skills/json-canvas/SKILL.md` |

These skills replace ~80% of the wikilink/frontmatter content that would otherwise live inline in this SKILL.md. **Don't copy-paste their content here** — read the kepano SKILL.md at use-time and follow it.

## Frontmatter Schema

```yaml
---
title: "Page title"
type: entity|concept|source|synthesis
tier: primary|secondary|reference  # source pages only
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

1. **Classify source**: article | paper | presentation | spreadsheet | clip | meeting-notes | dataset
   - `article` — blog post, essay, news piece (HTML or markdown)
   - `paper` — academic paper, whitepaper, internal doc, Word doc (`.pdf`, `.docx`)
   - `presentation` — slide deck, talk (`.pptx`)
   - `spreadsheet` — workbook, dataset with structure (`.xlsx`)
   - `clip` — Web Clipper output (markdown with `type: raw` + `source_url` frontmatter)
   - `meeting-notes` — agent-generated meeting transcript summary
   - `dataset` — raw structured data dump (CSV/JSON not in spreadsheet form)
2. **Save to raw/**:
   - Filename: `YYYY-MM-DD-{slug}.md` for markdown, `YYYY-MM-DD-{slug}.{ext}` for binary
   - Place in appropriate subfolder by classification:
     - `article` / `clip` → `raw/articles/`
     - `paper` (`.pdf`, `.docx`) → `raw/papers/`
     - `presentation` (`.pptx`) → `raw/presentations/`
     - `spreadsheet` (`.xlsx`) → `raw/spreadsheets/`
     - `clip` (Web Clipper) → `raw/clips/` if it's a non-article web capture, else `raw/articles/`
   - Add source frontmatter (markdown only): `type: raw`, `source_url:`, `ingested_at:`. Binary formats (PDF/DOCX/PPTX/XLSX) keep their native form in raw/; the compiled `wiki/source/{slug}.md` page carries the metadata.
   - If URL provided: prefer Defuddle for plain articles (see Companion Skills); otherwise **crawl4ai** — `"$HOME/AppData/Roaming/Python/Python313/Scripts/crwl.exe" <url> -o markdown` (local, free, no credit ceiling; handles JS-heavy pages, deep crawls, screenshots/PDF — added v8.20.0). Fallback order: crawl4ai → Firecrawl MCP (`mcp__MCP_DOCKER__firecrawl_scrape`, 500 credits/mo) → WebFetch (HTTP 400 "effort parameter" as of 2026-05) → manual paste.
   - **For binary formats (`.pdf`, `.docx`, `.pptx`, `.xlsx`):** route to the matching extractor (Stage 12, 2026-05-05) before compile:
     - `.pdf` → `uv run ~/.claude/scripts/wiki-extract-pdf.py "<abs path>"` → markdown to stdout
     - `.docx` → `uv run ~/.claude/scripts/wiki-extract-docx.py "<abs path>"` → markdown to stdout
     - `.pptx` → `uv run ~/.claude/scripts/wiki-extract-pptx.py "<abs path>"` → markdown to stdout (one `## Slide N` per slide)
     - `.xlsx` → `uv run ~/.claude/scripts/wiki-extract-xlsx.py "<abs path>"` → schema map; use `--sheet "<name>" [--range A1:E20]` to drill specific sheets/ranges (progressive reveal — first map, then zoom)
     - Each extractor declares its deps inline via PEP-723; first invocation per format is ~10–60s while uv resolves wheels, then cached.
   - **NEVER overwrite existing raw/ files** — they are immutable
2a. **If the file already exists in `raw/articles/` from Web Clipper** (frontmatter has `type: raw` AND `source_url`): skip step 2's fetch entirely — Web Clipper has already saved the page AND already run Defuddle internally on it (Defuddle and Web Clipper are both kepano projects; Web Clipper integrates Defuddle for content extraction). Consume the file as-is. Reference `_external/obsidian-skills/skills/defuddle/SKILL.md` only as background on what Web Clipper did — do NOT call `defuddle parse <url> --md` again. (Defuddle CLI takes URLs, not files; re-fetching would either duplicate the work or — if the page has changed — silently diverge from the saved raw.)
3. **Discuss key takeaways**: Before writing any wiki pages, present 3-5 key takeaways and ask what to emphasize. This is the human-in-the-loop moment.
4. **Determine affected pages**: What entities, concepts, and source pages does this touch? Read existing pages before deciding to update vs create.
5. **Create/update wiki pages**:
   - Create `wiki/source/{slug}.md` with compiled summary
     - **Classify the source's tier** at creation time (`primary` / `secondary` / `reference`) — see `wiki/overview.md` Schema → Source Tier for definitions and heuristics. Tier is required for source pages; defer or skip ingest if you can't confidently classify.
     - **Per-format compile heuristics** (Stage 12, 2026-05-05):
       - **Article / clip / meeting-notes:** standard summary — what's novel, key claims, quotable lines, where it fits in the wiki's existing graph. Existing convention.
       - **Paper (PDF/DOCX):** emphasize **abstract + conclusions + method**. The extractor emits `## Page N` (PDF) or `## Heading` markers (DOCX); use them to locate the abstract and conclusions sections. Capture method/approach in 2–4 lines. Quotable claims ≤15 words verbatim, the rest paraphrased. Tier: papers from canonical authors → `primary`; substantive third-party analyses → `secondary`; one-pagers / marketing PDFs → `reference`.
       - **Presentation (PPTX):** preserve slide structure — keep the `## Slide N` headings the extractor produces, summarize each section's bullets. Cluster related slides into thematic groupings. Note speaker notes (`> **Notes:** …` blocks the extractor surfaces) when they materially differ from slide bullets. Tier: lecture decks from canonical authors → `primary`; internal corp decks → `secondary`; marketing decks → `reference`. **Known limit (per script header):** charts, embedded images, SmartArt are NOT extracted; if missing content is load-bearing, mark tier accordingly.
       - **Spreadsheet (XLSX):** progressive reveal. First emit the schema map (extractor's default output: workbook structure + per-sheet dimensions + merged cell counts + first 5 non-empty rows). Then drill via `--sheet "<name>"` (and optionally `--range A1:E20`) into the sheets that matter. Compile the wiki source page as **schema-overview → narrative-of-what-it-tracks → sample-rows-and-key-derivations**. Don't try to flatten the whole workbook into one table — call out structure (sheets / sections) explicitly. Tier: authoritative datasets / canonical reference workbooks → `primary`; internal working sheets with original analysis → `secondary`; one-off scratch sheets → `reference`.
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

1. **Check hot.md** — `Read <your-vault-path>/wiki\hot.md` (warm cache)
2. **Read index.md** — `Read <your-vault-path>/wiki\index.md` — scan for matching titles/summaries
3. **Search vault** — `Grep` with keyword pattern across `<your-vault-path>/wiki\`
4. **Read matched pages** — `Read` each matched file path
5. **Follow wikilinks** — if matched pages have `related:` entries, `Read` those pages one hop deep
6. **Synthesize response** — combine knowledge from multiple pages. Always cite sources as `[[Page Title]]` wikilinks. **Tier-aware citation order:** lead with `primary`-tier sources, treat `reference`-tier as expansion or context, not standalone authority (full schema in `wiki/overview.md` Schema → Source Tier). If a topic has only reference-tier coverage, name that gap explicitly.
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

1. **Run the persisted checker** (one engine, two doors — `/wiki-lint` runs the same script; never improvise scan code, per v10 F-07):
   ```bash
   node ~/.claude/scripts/wiki-lint.js
   ```
   It covers, deterministically and CRLF-safely: frontmatter validity, `related:` wikilink resolution (error severity), broken md-links, phantom index rows, stale pages (>90d), orphans, unresolved body wikilinks (info — aspirational links are a vault convention). Auto-generated pages (`graph/`, `graphify-out/`, `session-log/`, hot.md, "Regenerated by" banners) are skipped by design. `--json` for machine output.
2. **Web-dev stack freshness** (only if `web-dev/stack.md` exists) — its version pins go stale weekly. For each pinned package in its tables (`next`, `react`, `react-dom`, `tailwindcss`, `@react-three/fiber`, `three`, `gsap`, `motion`, `lenis`, `drizzle-orm`, `better-auth`, `ai`, `vitest`, and the signature-effects packages), run `npm view <pkg> version` and compare to the pin. Report `warning` if a pin is behind the latest, `error` if a pin is below the stated security floor (e.g. `next` < 16.2.6). An `npm view` failure (offline / rate-limit) is `info: unknown`, never a drift claim. Report-only — never edit the pins (a real bump is a deliberate human action via next-upgrade / drizzle-neon / etc.).
3. **App-dev stack freshness** (only if `app-dev/stack.md` exists) — same discipline as step 2 for the mobile/desktop pins. Packages: `expo` (SDK = expo major; `warning` if the pinned SDK major is behind npm latest), `expo-router`, `react-native`, `eas-cli`, `@react-navigation/native`, `react-native-reanimated`, `react-native-gesture-handler`, `nativewind` (check `dist-tags` too — flag if a stable v5 ships, ending the v4/v5-preview trap), `react-native-css`, `@supabase/supabase-js`, `@tauri-apps/cli`, `@tauri-apps/api`. Report-only — never edit the pins (a real bump is a deliberate action via upgrading-expo / upgrading-react-native).
4. **Report** — present the script's findings table as-is, appending any freshness rows from steps 2–3 in the same format:

   | Severity | Issue | Page | Details |
   |----------|-------|------|---------|
   | error | broken-wikilink | page.md | [[Missing Page]] not found |
   | warning | stale | old-page.md | Not updated in 120 days |
   | info | missing-page | - | "React Server Components" mentioned but no page exists |
   | warning | stale-pin | web-dev/stack.md | next pinned 16.2.9, npm latest 16.3.1 |

5. **Do NOT auto-fix** — report only, await user instruction (Review vs Implement rule)
6. **Append to log.md**: `| {date} | lint | - | {issues_found} issues found |`

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

**Trigger:** Called by `/new` when creating a new project. Also callable directly.

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
