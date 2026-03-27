---
name: weekly-dream
description: Weekly memory consolidation — runs /dream to orient, gather signal, merge, and prune memory files
---

You are running the weekly automatic memory consolidation (dream).

Run the /dream skill now. This is a scheduled maintenance task — no user interaction needed.

Follow the dream skill phases:
1. Orient — ls memory directory, read MEMORY.md, skim topic files
2. Gather recent signal — check session logs, failure logs, drifted memories
3. Consolidate — merge, update, delete contradicted facts
4. Prune and index — keep MEMORY.md under 200 lines and 25KB

After completing, update the dream timestamp:
```bash
date +%s > /tmp/claude-dream-last-run
```

Output a brief dream summary of what changed.