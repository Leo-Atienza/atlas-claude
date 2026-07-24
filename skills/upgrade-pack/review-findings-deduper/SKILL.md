---
name: review-findings-deduper
description: >-
  Consolidates duplicated findings from overlapping review passes (bots, lint, peers,
  subagents). Use before shipping when multiple validators produced redundant items,
  when triaging reviewer spam, merging PR commentary, prioritizing rework queues.
disable-model-invocation: true
---

# Review findings deduper

## Inputs

Structured list or pasted markdown containing items with optional severity + file path.

## Steps

1. **Normalize taxonomy** → map synonyms to buckets: correctness, regression risk, UX, perf, accessibility, portability, observability, security.
2. **Dedup key** → use `(file,line_range,rule_signature)` triples whenever possible else `(file,code_symbol,rule_signature)`.
3. **Collapse** overlapping messages into one actionable paragraph **with citations** referencing source reviewers.
4. **Prioritize matrix**

| Quadrant | Action |
|-----------|--------|
| High severity ∩ easy fix | Immediate |
| High severity ∩ hard fix | Plan + spikes |
| Low severity ∪ nit | Backlog toggle |
| Flaky/low confidence | Mark `needs-more-data` |

5. Emit **Markdown table**:

```
| Priority | Canonical finding | Sources merged | Owners | Acceptance check |
|-----------|---------------------|----------------|-------|---------------------|
```

6. Optionally append distilled row to `%USERPROFILE%\Documents\Wiki\patterns\review-dedupe-log.md`.

## Guards

Never drop unique security regressions purely because wording differs — escalate those manually.
