---
description: Rebuild the Living Memory SQLite index from markdown source-of-truth
allowed-tools:
  - Bash
---

# /memory:rebuild

Rebuild the Living Memory derived index (SQLite + sqlite-vec) from the markdown files in `~/.claude/projects/<your-cwd-slug>/memory/`. Markdown is the source of truth — this command is non-destructive to the markdown.

## What this does

1. Drops `~/.claude/memory/index.db` if `--rebuild` is passed (default: drift-check only)
2. Reads every `.md` file in the memory directory
3. Hashes each body, upserts a `memories` row, refreshes FTS5 entry
4. Embeds via Ollama (`embeddinggemma:300m`, 256-dim) if reachable; skips embeddings otherwise
5. Writes summary to `~/.claude/cache/memory/last-rebuild.json`

## Usage

```bash
node ~/.claude/hooks/memory-indexer.js --rebuild       # full rebuild from scratch
node ~/.claude/hooks/memory-indexer.js --check-drift   # re-embed only changed files (default)
node ~/.claude/hooks/memory-indexer.js --reembed-all   # force re-embedding (after model change)
node ~/.claude/hooks/memory-indexer.js --json          # machine-readable summary on stdout
```

## When to run

- After hand-editing a memory markdown file (the PostToolUse hook covers normal edits — this is the manual override)
- After installing or changing the embedding model
- After restoring memory markdown files from backup
- When `/memory:health` reports `MEMORY.md vs DB drift`

## Recovery

If the SQLite index is corrupted or accidentally deleted, simply run with `--rebuild`:

```bash
rm ~/.claude/memory/index.db ~/.claude/memory/index.db-wal ~/.claude/memory/index.db-shm 2>/dev/null
node ~/.claude/hooks/memory-indexer.js --rebuild --json
```

This recreates the entire index in <60s for a corpus of <100 memories. Markdown is never touched.

---

**Run it:**

!`node ~/.claude/hooks/memory-indexer.js --rebuild --json`
