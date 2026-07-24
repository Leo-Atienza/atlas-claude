---
description: Review the sous-chef's proposal queue (the ONLY self-modification path) — approve / reject / defer each
---

# /review-proposals

The single governance surface for everything the system proposes about itself (A4, v9). Nothing is ever auto-applied; every self-generated behavior change lands in `~/.claude/proposals/` and is reviewed here, with the user.

## Procedure

1. **List the queue:**
   ```bash
   node ~/.claude/scripts/proposals.js expire   # first drop anything past its 30d expiry
   node ~/.claude/scripts/proposals.js list
   ```
   If empty, say "No open proposals" and stop.

2. **For each open proposal**, show it on one screen (`cat ~/.claude/proposals/<slug>.md`) and summarize: what it changes, the evidence, the rollback. Note whether it is a **MANUAL SPEC** (`manual_spec: true` — touches CLAUDE.md or hooks).

3. **Ask the user** approve / reject / defer for each (batch related ones with AskUserQuestion). Record the decision:
   ```bash
   node ~/.claude/scripts/proposals.js resolve <slug> approve|reject|defer "<reason>"
   ```

4. **Apply approved proposals:**
   - **MANUAL SPEC (rule-change / hook-change):** apply the edit yourself, in this session, with the user watching — never via a script. These govern the agent; they are applied deliberately, one at a time, and re-verified (doctor 11/11).
   - **Non-manual (automation / skill-archive / autonomy-promotion / pref-veto):** apply the change if it is safe and reversible; state the rollback. Skill archives use the `mv` (never `rm`) archive flow; autonomy promotions edit the A5 governance doc.
   - After applying any registry-affecting change, run the propagation sweep + `node ~/.claude/scripts/system-doctor.js` (must stay 11/11).

5. **Report:** N approved / N rejected / N deferred; which were applied; `node ~/.claude/scripts/proposals.js stats` (flag any muted type).

## Guardrails
- Hard cap 5 open (oldest auto-expires). A proposal type under 30% acceptance (≥4 resolved) is **muted** — it stops generating; tell the user when that happens so he knows a channel went quiet by design.
- Proposals never touch `CLAUDE.md`/hooks automatically — those are specs, applied by a human-present session.
- The vault is local-only: approved vault changes commit with a `proposal:` prefix, never push.
