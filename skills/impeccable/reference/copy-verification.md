# Copy Verification — fact drift & tells, over the built output

The gate that caught what four other passes missed. On a real client build, two fabrications
("four years running shifts", an invented founding month) survived the initial write, a 21-agent
design workflow with adversarial judges, a full /ghost prose pass, and the author's own review.
One agent whose only job was to diff the rendered copy against the source PDFs caught both in
ninety seconds. Style and tone passes are where facts silently mutate — a rewrite for rhythm
turns "two years" into "four years" and nobody re-reads the résumé.

**Trigger:** any build presenting real-world claims — a portfolio, an about page, a case study,
a CV, team bios, a company timeline. No real-world claims (a demo, a tool UI with only interface
copy) → skip; this gate is about facts, not style.

## Step 1 — extract the substrate (never sweep source)

All checks run over text extracted from the BUILT output, not source files: source carries
comments, JSX and prop strings that both hide real hits and manufacture false ones (a grep for a
route code over source returned two hits that were a substring inside a city name; the same
check over rendered text returned zero).

```bash
node ~/.claude/skills/impeccable/scripts/extract-copy.mjs --html dist/ --out _copy.txt
# hydration-dependent copy (no prerender): --url http://localhost:3000 instead of --html
```

The extract includes TITLE / META / OG / ALT / ARIA-LABEL lines — those carry claims too.
Deterministic sweeps (dash count, banned phrases, glyph coverage vs a font subset's allow-list)
run over this same file.

## Step 2 — run the pair (two agents, one job each)

Launch both in parallel (Agent tool). Each gets `_copy.txt` plus, for fact-drift, the source
documents. Do not merge them into one agent — the tell-hunter reads for register, the
fact-checker reads for referents, and one agent doing both does neither well.

**tell-hunter** — prompt template:

> Read the rendered site copy at `<path to _copy.txt>`. Hunt AI writing tells: em/en dashes,
> repeated sentence formulas, rule-of-three runs, "isn't just X — it's Y" constructions,
> register drift between sections, hedging filler, and any phrase that sounds like a model
> rather than the person. Report each hit with the exact line quoted and a proposed rewrite in
> the page's own register. Report NOTHING else — no design opinions, no fact checks.

**fact-drift** — prompt template:

> Read the rendered site copy at `<path to _copy.txt>`. Then read the source documents:
> `<paths — résumé PDF, LinkedIn export, brand doc, prior site>`. Check EVERY name, date, range,
> title, employer, credential, quantity, and scope verb in the copy against those sources.
> Source hierarchy when they conflict: the newest self-authored document wins. Two rules:
> (1) any statistic or number not present in a source is the WORST failure class — flag it even
> if plausible; (2) scope verbs are claims — "ran" vs "supported" is a seniority claim; flag any
> upgrade the sources don't support. Report each finding as: the copy's line quoted → the
> source's version quoted (or "NOT IN ANY SOURCE") → severity. Report nothing about style.

## Step 3 — resolve and re-extract

Every fact-drift finding is fixed from the SOURCE's version, never negotiated toward the copy's
rhythm. After fixes, re-run the extract and re-run any deterministic sweeps (the fix pass is
itself a style pass — it can reintroduce dashes or tells). The audit receipt states: substrate
path, both agents run, findings count, all resolved.

Source hierarchy matters because sources conflict: on a real client build a LinkedIn export
superseded a résumé on dates and locations, and surfaced an entire promotion ladder the résumé
had flattened. When no source covers a claim the client added verbally, record it in the
project's `.impeccable.md` as client-stated so the next pass doesn't flag it.
