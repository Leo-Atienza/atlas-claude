# Knowledge-Write Protocol (canonical)

Single source of truth for how `/reflect`, `/remember`, and `/done` allocate IDs and
append entries to the vault engineering files. Those commands reference this file so the
id-allocation and entry format never drift. (`/analyze-mistakes` is the read-only auditor — it
follows these conventions but never writes. `/learn` was folded into `/remember` in v10,
2026-07-20 — error capture routes through /remember's routing-rules.)

Vault engineering files live at `<your-vault-path>/wiki/engineering/`:

| Category | Spoken label | `**Type**` field value | File |
|---|---|---|---|
| Pattern          | G-PAT  | `pattern`    | patterns.md |
| Solution         | G-SOL  | `solution`   | solutions.md |
| Error            | G-ERR  | `error`      | errors.md |
| Preference       | G-PREF | `preference` | preferences.md |
| Failed approach  | G-FAIL | `failure`    | failures.md |

The G-* labels are conversational shorthand (commands, routing rules). The literal `**Type**`
field in an entry MUST be the lowercase singular word — `validate-knowledge.js` enforces
`VALID_TYPES = {pattern, solution, error, preference, failure}` and fails the scoreboard on
anything else (verified 2026-06-09, the hard way).

## 1. Allocate the next ID (global, numeric, never reused)

IDs are **unified** across all 5 files as `KNOWLEDGE-NNN` (not per-category). Take the global
numeric max across every file and increment by 1:

```bash
grep -h "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/*.md 2>/dev/null \
  | sed -E 's/^## (KNOWLEDGE-[0-9]+).*/\1/' | sort -V | tail -1
```

Do **not** `tail -1` a single file's lexical order, and do **not** grep only one file — both
under-allocate and risk a duplicate id. (`/system-doctor`'s `knowledge` validator fails loudly
on duplicate `KNOWLEDGE-NNN` ids.)

## 2. Duplicate check before writing

`grep "^## KNOWLEDGE-" <type>.md` for the same topic/tags. If an entry already covers the class,
UPDATE it in place (bump `**Date**`, add evidence) instead of allocating a new id. Contradictions
are corrected in place with an `**Updated {date}**:` note, never silently overwritten.

## 3. Entry format (append to the matching file from the table above)

```markdown
## KNOWLEDGE-NNN: <Title>
**Date**: YYYY-MM-DD | **Type**: error | **Tags**: #tag1 #tag2

<Body. Errors: what went wrong + root cause + correct approach. Solutions: fenced code with a
language tag. Failures: what was tried + WHY it failed. Patterns/Preferences: when it applies +
how to apply. Always generalize/redact client & project specifics.>

**Related**: <KNOWLEDGE-NNN ids, or "None">

---
```

The category is carried by the **Type** field (lowercase: `pattern` / `solution` / `error` /
`preference` / `failure` — see the table in §0), **not** by the H2 header — the header is always
`## KNOWLEDGE-NNN:`. Confidence tag for `/remember` engineering writes: `[HIGH]` (proven 3+) /
`[MEDIUM]` (once) / `[LOW]` (theoretical).

## 4. Index — do not hand-edit

There is **no** `KNOWLEDGE-DIRECTORY.md`. The folder index `engineering/_index.md` is
auto-maintained by `scripts/wiki-hot-refresh.js` / the `wiki-manage` skill; new H2 entries are surfaced
automatically. The optional Memory Graph MCP mirror is written separately (see `/reflect` Phase 4d).
