# atlas-kg — operational knowledge graph

A small temporal knowledge graph describing the system's own operation: which
components exist, how they relate, and when each fact was true. It is the
operational companion to the prose knowledge vault.

The live graph contents are **not published** (they describe one person's sessions
and projects). This file documents the format so you can grow your own — the files
are created on demand, so an empty directory is a valid starting state.

## Files

| File | Contents |
|---|---|
| `entities.json` | Map of `entityId` -> entity record |
| `triples.json` | Map of `tripleId` -> relation record |
| `snapshots/` | Timestamped copies written before migrations |

## Entity record

```json
{
  "id": "atlas",
  "name": "ATLAS",
  "type": "system",
  "properties": {},
  "created_at": "2026-04-07T12:59:30.616Z",
  "updated_at": "2026-04-07T13:54:00.500Z"
}
```

`type` is a free-form tag. Common values in practice: `system`, `component`,
`integration`, `session`.

## Triple record

Relations are **temporal**: `valid_from` / `valid_to` let a fact expire without
being deleted, so the graph can answer "what was true then?" A `valid_to` of `null`
means still true.

```json
{
  "id": "t_atlas_integrated_temporal_knowledge_graph_4e2c6362",
  "subject": "atlas",
  "subject_name": "ATLAS",
  "predicate": "integrated",
  "object": "temporal_knowledge_graph",
  "object_name": "temporal_knowledge_graph",
  "valid_from": "2026-04-07",
  "valid_to": null,
  "confidence": 1,
  "source": "<where this fact came from>",
  "created_at": "2026-04-07T12:59:30.616Z"
}
```

The `id` convention is `t_<subject>_<predicate>_<object>_<short-hash>`, which keeps
ids readable and stable enough to dedupe against.

`confidence` is `0..1`. Facts asserted by automation should carry a lower confidence
than ones a human confirmed.

## Maintenance

A weekly scheduled task (`atlas-kg-sync`) refreshes the graph and mirrors a readable
view into the knowledge vault. See `scheduled-tasks/` and `RUNTIME-STATE.md`.
