---
description: "Deep semantic search over the ENTIRE vault (2k+ notes incl. session-log, handoffs, transcripts, graph) via the local TurboQuant index — the tier /recall deliberately skips. Use when /recall comes up thin or the answer likely lives in past session history."
argument-hint: "<topic or question>"
---

# /deep-recall — full-corpus semantic search (TurboQuant, offline)

!`python ~/.claude/scripts/semantic/recall_semantic.py search "$ARGUMENTS" -k 8`

The block above is pure **semantic** (meaning-based) similarity — it finds notes
by concept even with zero keyword overlap, and unlike `/recall` it searches the
**whole vault**, including `session-log/`, `handoffs/`, `transcripts/`, and
`graph/`. Scores are estimated cosine (0–1); ~0.5+ is a strong hit on this corpus.

How this differs from `/recall`:
- `/recall` = fast, fused, 5-source lexical + light semantic over the ~1,014
  **knowledge pages** (personal/engineering/concept/...). Corroboration-ranked.
- `/deep-recall` = single-source semantic over **all ~2,079 notes**. Best for
  "have I dealt with anything *like* this before?" and recovering past sessions.

Follow-ups:
- **Read the top path(s)** (vault-relative under `<your-vault-path>/wiki/`) before answering from memory.
- Want lexical corroboration + atlas-kg/graph fusion instead → `/recall <topic>`.
- Need LLM synthesis that follows wikilinks → wiki-manage QUERY mode (skill SK-101; the /wiki-query command retired v10).
- Results feel stale (new notes since last build) → refresh the index:
  `python ~/.claude/scripts/semantic/recall_semantic.py index` (incremental — only changed notes re-embed).

Note: runs 100% locally (Ollama `qwen3-embedding:0.6b`, 1024-dim). One embed call
per query (~0.3–1s). If the index is missing, it will say so — run the `index`
command above once to build it.
