---
description: Ingest a source (URL, file path, or pasted text) into the personal Obsidian wiki at <your-vault-path>/. Compiles raw → wiki/source/, updates entity/concept pages, refreshes index/log/hot.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# /wiki-ingest

Invoke the **`wiki-manage`** skill (SK-101) in **INGEST mode**.

## Arguments

```
/wiki-ingest <url-or-path-or-pasted-text>
```

- URL → fetched via `WebFetch`, saved to `<your-vault-path>/raw/articles/YYYY-MM-DD-{slug}.md`
- File path → copied verbatim to `raw/articles/`, `raw/papers/`, or `raw/clips/` based on classification
- Pasted text → saved with a slug derived from the first heading

## Procedure

Read the full procedure in [skills/wiki-manage/SKILL.md](../skills/wiki-manage/SKILL.md) under **Mode 1: INGEST**. The skill handles:

1. Source classification (article / paper / clip / meeting-notes / dataset)
2. Save to `raw/{subdir}/YYYY-MM-DD-{slug}.md` (immutable)
3. Discuss 3-5 key takeaways with the user before writing pages (human-in-the-loop)
4. Determine which entity / concept / source pages are affected (read existing first)
5. Create or update wiki pages with bidirectional `[[wikilinks]]`
6. Update `wiki/index.md` (add rows, bump `total_pages:`)
7. Append to `wiki/log.md`
8. Refresh `wiki/hot.md`
9. Optional KG bridge via `node ~/.claude/hooks/atlas-kg.js add ...` for high-confidence factual triples

## Quality check before reporting done

- Raw file saved and immutable
- At least one wiki page created/updated
- All new pages have complete frontmatter (title / type / sources / related / created / updated)
- `index.md` reflects the new pages
- `log.md` has the ingest row
- Wikilinks bidirectional
