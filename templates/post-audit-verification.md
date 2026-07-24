<!-- Template: generate plans/<slug>-triple-check-prompt.md as the FINAL deliverable
     of every system audit (skills/audit Step 6). Fill every {PLACEHOLDER}.
     Born v8.15.0 from the v8.14 triple-check, which confirmed that audit's fixes
     but still found 4 misses PLUS a new instance of the audit's own headline bug
     class hiding in a surface the sweep didn't cover. An audit is not complete
     until its verification prompt exists. -->
<!-- keep -->
# TRIPLE-CHECK the {VERSION} audit — verify every fix is EFFECTIVE, repair what isn't

> **How to use (the user):** start a FRESH session in `~/.claude` and paste:
> *"Run the triple-check in plans/{THIS-FILENAME}. ULTRATHINK."*
> Everything below is instructions for that session.

## Mission

Treat every claim of the {VERSION} session as **unverified**. Prove each fix is present AND effective at runtime, hunt regressions the fixes may have introduced, and repair what you find — same discipline as the audit itself: verify before acting; doctor-green gate after each wave of ≤5 changes; mv-to-trash never rm; every count from fresh ground truth. Pre-authorized to fix; only destructive/irreversible actions or genuine scope changes need the user.

**Records to read first (claims, not truth):** `SYSTEM_CHANGELOG.md` §{VERSION} · {PLAN-OR-LEDGER-PATH} · {WIKI-AUDIT-PAGE} · {KNOWLEDGE-IDS}. **Rollback source:** {BACKUP-DIR}.

## Layer 0 — Free evidence from YOUR OWN session start

Your session start is itself the first test bed. For each fix that should change SessionStart output, state the expectation and check it:
{SESSIONSTART-EXPECTATIONS — e.g. "cache block renders", "no X advisory unless doctor is red", "statusline renders"}

## Layer 1 — Runtime effectiveness of behavior-layer fixes

1. Re-run every fixture the audit used, AND `node scripts/hook-fixtures.js` (8/8+ required — if the audit added or changed an emitter, EXTEND hook-fixtures.js to cover it as part of this check).
2. **Live-delivery proofs — derive probes from the ACTUAL wiring, never guess:** read settings.json (matchers, `if:` conditions, `async` flags, hook order) BEFORE designing a probe. A probe that doesn't satisfy the real trigger conditions proves nothing either way (v8.14 lesson: `echo "git commit test"` can never fire an `if: "Bash(git commit*)"` hook — the command must START with the pattern; `git commit --dry-run` fired it).
3. Sweep for the audit's bug class in EVERY surface it can live, not just where it was fixed: `hooks/*.js`, inline `settings*.json` commands, vendored packs, and docs/comments (comments are belief-propagators — a stale one recreates the bug in the next edit).
4. Regression hunt in the opposite direction: fixes that make silent things LOUD can spam — skim your own session + `logs/hook-health.jsonl` for abnormal frequency before declaring healthy.

## Layer 2 — Every code fix, end-to-end

For each fix listed in the changelog: one runtime proof (fixture, test matrix via direct import, or live probe) OR an explicit static re-read quoting file:line. Adversarially test at least one validator/checker-type fix — make it FAIL on purpose against a scratch COPY (never sabotage a live safety hook; the classifier will rightly refuse) and confirm it reports honestly. A checker that has never been seen failing proves nothing (KNOWLEDGE-144).

## Layer 3 — Lifecycle trace, prompt → session end

SessionStart → UserPromptSubmit → PreToolUse → PostToolUse → Stop → SessionEnd → PreCompact, each with evidence (fresh log rows, artifact mtimes, delivered context blocks). Distinguish **NOT-VERIFIABLE-YET** (needs a future event — a weekly firing, this session's own SessionEnd; say exactly when it becomes checkable) from **broken**. Distinguish policy-expiry from data loss before alarming about absent files (check the cleanup receipts in `logs/cleanup.jsonl`).

## Layer 4 — Registry, cleanup, and docs truth

- `node scripts/system-snapshot.js` then `node scripts/system-doctor.js` — green required BEFORE touching anything; investigate any red first.
- Every count on every doc surface vs fresh `cache/system-ground-truth.json`: {COUNT-SURFACES-AND-EXPECTED-VALUES}.
- `node hooks/cleanup-runner.js --dry-run` — read every `would_delete` critically; deletion of live-looking data is the regression class that matters most.
- Spot-check ≥5 changelog claims at random, including ones with no dedicated checklist row.
- Dead-reference sweep using the audit's own retired-name list: {RETIRED-NAMES-GREP} — classify each hit as intentional-historical, false-positive, or MISS (fix the misses).

## Layer 5 — Report + repair protocol

Produce a table: **claim → verification method → CONFIRMED-EFFECTIVE / REGRESSED-REFIXED / STILL-BROKEN / NOT-VERIFIABLE-YET**. For anything repaired: wave discipline, doctor gate, `node --check`/`bash -n`/`py_compile` on touched files, append a `## [{VERSION}+patch]` CHANGELOG entry + update the wiki audit page. settings.json edits are classifier-gated: attempt each ONCE; on denial, produce the exact queued diff for the user and move on. If something the audit changed was BETTER before, restore it from {BACKUP-DIR} and document why. End in plain sentences: what was confirmed, what needed re-fixing, and whether the system is genuinely in the state the {VERSION} report promised.
