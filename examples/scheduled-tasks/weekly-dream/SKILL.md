---
name: weekly-dream
description: Weekly memory consolidation and memory-maintenance sweep — runs /dream, plus MEMORY.md index sanity, orphaned memory cleanup, stale-date checks (absorbed from weekly-memory-maintenance)
---

You are running the weekly automatic memory consolidation (dream) and maintenance sweep.

## 0. Memory-maintenance pre-check (absorbed from the removed `weekly-memory-maintenance` task)

Before dreaming, sanity-check the memory directory:

```bash
MEM_DIR=~/.claude/projects/C--Users-leooa--claude/memory
ls "$MEM_DIR"/*.md 2>/dev/null | wc -l            # count memory files
grep -c "^- \[" "$MEM_DIR/MEMORY.md" 2>/dev/null  # count indexed entries
```

Flag and report (do not auto-delete):
- Memory files on disk not linked from `MEMORY.md` (orphaned).
- `MEMORY.md` entries pointing at missing files (broken links).
- Any `project_*.md` not touched in 60+ days (candidate for archiving after dream runs).
- `MEMORY.md` over 200 lines or 25 KB — dream below will trim.

## 1. Run /dream

Execute the /dream skill. This is a scheduled maintenance task — no user interaction needed. Follow its phases:

1. Orient — `ls` memory directory, read `MEMORY.md`, skim topic files.
2. Gather recent signal — check session logs, failure logs, drifted memories.
3. Consolidate — merge, update, delete contradicted facts.
4. Prune and index — keep `MEMORY.md` under 200 lines and 25 KB.

## 2. Record completion

```bash
date +%s > ~/.claude/cache/dream-last-run
```

## 3. Summary

Output a brief report combining:
- Dream summary (what changed).
- Memory-maintenance findings (orphans, broken links, stale entries from §0).
