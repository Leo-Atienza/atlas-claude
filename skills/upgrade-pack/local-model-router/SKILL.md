---
name: local-model-router
description: >-
  Applies a three-tier routing policy using only local Ollama models (free/local-first).
  Trigger on offload easy tasks, latency/cost concerns, offline/privacy-sensitive work,
  routing policy decisions, and local tier selection.
disable-model-invocation: true
---

# Local model router

Canon lives in `%USERPROFILE%\.cursor\OLLAMA_ROUTING.md` — follow that file before improvising routing.

## Default tiers (local-only)

### Easy -> smallest local coder model

Signals: trivial docstrings, renaming, micro-refactors (<30 LOC), summaries of small pasted snippets.

### Medium -> larger local coder model

Signals: focused module explanation, bounded tests (<3 files touched), narrowing unknown root-cause hypotheses.

### Hard -> strongest local model OR pause and ask

Signals: ambiguous multi-file regressions, security-sensitive audits, roadmap-level architecture spanning services.

If local quality is insufficient, ask for explicit approval before any paid/cloud path.

### Privacy overrides

Treat as **stay local**: secrets, HIPAA/PCI, sensitive customer payloads, unpublished roadmap, embargoed exploits. Fail closed.

## MCP + CLI integration

| Surface | Capability |
|---------|-------------|
| Cursor MCP (`ollama-local`) | Lightweight tool calls into local inference |
| Ollama CLI (`ollama run`) | Manual local fallback without MCP |

## Windows reminders

Ensure Ollama service is reachable at `OLLAMA_HOST` (defaults to `http://127.0.0.1:11434`). If MCP server fails (`npx -y ollama-mcp`), rely on manual local CLI.
