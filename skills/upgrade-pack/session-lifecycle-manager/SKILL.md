---
name: session-lifecycle-manager
description: >-
  Manages Cursor/Codex session boundaries via checkpoints and handoffs. Use when
  resuming work, multitasking across repos, noticing repeated context resets, requesting
  a handoff bundle, splitting discovery from implementation phases, or after long idle gaps.
disable-model-invocation: true
---

# Session lifecycle manager

## When this applies

User says: checkpoint, resume, handoff, recap, stale context, new chat, summarize where we left off, continuation.

## Procedure

1. **Snapshot** — In ≤8 bullets capture:
   - Goal + definition of done
   - Repo(s) / branch / key paths touched
   - Commands already run (+ outcomes)
   - Open risks / hypotheses
   - Next 2 executable steps
2. **Persist** — Offer to append a dated block to `%USERPROFILE%\Documents\Wiki\inbox\YYYY-MM-DD-session-<slug>.md` using vault frontmatter (`type: coding-note`, `status: draft`).
3. **Handoff artifact** — If requested, bundle:
   ```
   CONTEXT.md (bullets above)
   + links/paths list
   + commands to rerun verification
   ```
4. **Reset rule** — If quality drops (loops, contradictory edits), reopen with snapshot only rather than quoting entire prior chat verbatim.

## Anti-patterns

- Continuing without writing down branch + verification command after flaky builds.
- Pasting mega-threads into fresh conversations — use structured snapshot instead.

## Codex parity

Paste the Snapshot bullets at the top of the CLI transcript when spawning Codex-only runs.
