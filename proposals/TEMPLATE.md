---
type: <skill-dedupe | mcp-prune | hook-change | schedule-change | doc-fix>
status: <pending | approved | rejected | deferred>
created: <YYYY-MM-DD>
expires: <YYYY-MM-DD>
manual_spec: false
evidence: ["<what observation triggered this>"]
rollback: "<the exact action that undoes this if it goes wrong>"
tags: [proposal]
---

## Proposal: <one-line summary>

### Problem

What was observed, with numbers. Proposals are meant to be driven by telemetry
rather than hunches — "skill X has zero invocations in 60 days across the usage
ledger" beats "skill X feels unused".

### Proposed change

The specific edit: files touched, settings keys changed, tasks enabled or disabled.

### Evidence

Where the numbers came from, so the claim can be re-checked later rather than
taken on trust.

### Rollback

The concrete command or edit that restores the prior state. A proposal without a
credible rollback should be rejected on that basis alone.

---

## How this directory works

This is the **proposal queue** — the only sanctioned path for the system to modify
itself. Automation writes proposals here; a human reviews them with
`/review-proposals` and approves, rejects, or defers each one. Nothing in this
directory applies itself.

Live proposals are **not published** — they describe one person's system decisions.
This template is the format. An empty directory is a valid starting state.

Two properties are worth preserving if you adapt this:

- **Expiry.** A proposal that sits unreviewed past `expires` is stale by definition;
  acting on month-old telemetry is worse than not acting.
- **Human in the loop.** The value is in the queue being reviewed, not in the queue
  existing. Auto-applying proposals turns a safety mechanism into an unsupervised
  agent editing its own configuration.
