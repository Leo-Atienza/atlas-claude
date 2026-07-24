---
description: Promote a Living Memory entry to the Obsidian Wiki vault as a synthesis page, with a back-link memory inserted for round-trip discoverability
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# /memory:promote-to-wiki

Promote a high-value memory from `~/.claude/projects/<your-cwd-slug>/memory/` into `<your-vault-path>/wiki/synthesis/` as a fully-linked synthesis page, then write a back-link memory so future retrieval surfaces both.

Use this when:
- A memory has crystallized enough to be a durable, transferable concept (not user-/project-specific)
- A reflection-cascade output (`memory/reflection/weekly-*.md` or `quarterly-*.md`) deserves long-form wiki treatment
- You want a memory's content to be searchable from `obsidian_simple_search` and follow `[[wikilinks]]`

## Usage

```
/memory:promote-to-wiki <memory_id_or_path>
```

`<memory_id>` accepts either:
- A 12-char+ memory id from `index.db` (e.g., `01939a8c5f2c9a3f4b1e`)
- A path or filename under `memory/` (e.g., `semantic/feedback_thorough_reviews.md`, `feedback_thorough_reviews.md`)

## Process

### Step 1 — Resolve the memory

Look up the source file:

```bash
node ~/.claude/hooks/memory-retrieve.js --query "$ARGUMENTS" --top 1 --json --no-bump
```

If the user passed a filename, fall back to a direct file lookup with `Glob` under `memory/**/*.md`. Read the file and parse frontmatter — keep `name`, `description`, `type`, `originSessionId`, `valid_from`, and the body text.

### Step 2 — Read Wiki schema rules

```bash
cat <your-vault-path>/CLAUDE.md
```

Note: the wiki-manage skill that ships with the system is currently archived at `~/.claude/skills/_archived/wiki-manage/`. If the user wants the full skill back, restore it via `mv ~/.claude/skills/_archived/wiki-manage/ ~/.claude/skills/wiki-manage/`. For a single promotion, the inline procedure here is sufficient.

### Step 3 — Draft the synthesis page

Path: `<your-vault-path>/wiki/synthesis/{slug-from-memory-name}.md`

Slug rules: kebab-case from the memory's `name` frontmatter, max 6 words, no punctuation. If a file already exists at that path, ask the user whether to merge (preferred) or version (`{slug}-v2.md`).

Frontmatter (per Wiki CLAUDE.md schema):

```yaml
---
title: "{memory.name}"
type: synthesis
sources: ["memory/{relative_path_from_memory_dir}"]
related: []        # fill in after running the next-paragraph step
kg_entities: []    # extract via atlas-kg if relevant; otherwise leave empty
created: {today YYYY-MM-DD}
updated: {today YYYY-MM-DD}
---
```

Body:
- One-line summary at the top (paraphrase the memory's `description`, do not quote)
- The memory's body, lightly edited to:
  - Strip user-specific framing ("user prefers" → "{topic} works better as ...")
  - Replace `**Why:**` / `**How to apply:**` blocks with prose paragraphs
  - Insert `[[wikilinks]]` to any wiki pages the memory references — discover them with `Glob <your-vault-path>/wiki/**/*.md` then check matched titles
- Closing "Sources" section listing the original memory path

### Step 4 — Update Wiki index, hot, log

Per Wiki CLAUDE.md:

1. Append a row to `<your-vault-path>/wiki/index.md` for the new page
2. Add the new page (or update its mtime) in `<your-vault-path>/wiki/hot.md`
3. Append one operation row to `<your-vault-path>/wiki/log.md`:
   `YYYY-MM-DD · promote · synthesis/{slug}.md · sourced from memory/{relative_path}`

### Step 5 — Write the back-link memory

Create a tiny new memory at `~/.claude/projects/<your-cwd-slug>/memory/semantic/reference_wiki-{slug}.md` that points back to the wiki page. This makes the round-trip discoverable from `/memory:search`:

```yaml
---
name: "Wiki: {memory.name}"
description: Synthesis page in the Obsidian Wiki (vault → wiki/synthesis/{slug}.md). Promoted from {original memory filename} on {today}.
type: reference
importance: 4
confidence: HIGH
originSessionId: "{current session id, or 'manual-promote'}"
valid_from: "{nowIso()}"
wiki_path: "wiki/synthesis/{slug}.md"
source_memory: "{original memory relative path}"
---

This memory is a back-pointer to a promoted Wiki synthesis. The full content lives in the wiki vault — open it via Obsidian, or:

```
cat <your-vault-path>/wiki/synthesis/{slug}.md
```
```

The PostToolUse `memory-write-watch.js` hook will index this back-link automatically.

### Step 6 — Confirm

Print one line:
```
✓ Promoted: memory/{rel} → wiki/synthesis/{slug}.md (back-link memory: semantic/reference_wiki-{slug}.md)
```

Run `node ~/.claude/hooks/memory-regen-index.js` so MEMORY.md picks up the back-link before the user's next session.

## Refusal cases

- Memory has `confidence: UNVERIFIED` → ask the user to verify first via `/memory:review`; promotion enshrines content into long-form, so unverified facts shouldn't propagate.
- Memory's `type` is `episodic` → episodic memories are session digests, not durable concepts; refuse and suggest running `/memory:review` to extract durable facts first.
- The synthesis target file already exists AND user did not specify a merge strategy → ask explicitly (merge vs version).
