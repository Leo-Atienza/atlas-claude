---
description: "Ask the whole brain — one query across vault, atlas-kg, graphify, catalog, and the session working set, with deterministic rank fusion (+ semantic layer when indexed)"
argument-hint: "<topic or question>"
---

# /recall — unified retrieval across every ATLAS knowledge layer

!`node ~/.claude/scripts/recall.js "$ARGUMENTS"`

The block above is the fused result: each line shows `target  score  (sources) — note`.
Targets hit by MULTIPLE independent layers (e.g. `vault+graph+kg`) are the most
trustworthy — corroboration is the ranking signal.

Follow-ups:
- **Read the top vault page(s)** (paths are vault-relative under `<your-vault-path>/wiki/`) before answering from memory.
- `atlas-kg:` entries → `node ~/.claude/hooks/atlas-kg.js query "<entity>"` for the full temporal fact set.
- Multiple graph nodes matched → `wiki/graphify-out/GRAPH_REPORT.md` has the cluster view.
- Need synthesis rather than retrieval → wiki-manage QUERY mode (SK-101; LLM mode, follows wikilinks).
- Zero hits → try `/deep-recall <query>` (full-vault semantic tier incl. session-log) before concluding the brain doesn't know.

Flags (pass inside the argument string): `--json` machine output · `--no-semantic` lexical only · `--semantic-only` debug the embedding layer.
