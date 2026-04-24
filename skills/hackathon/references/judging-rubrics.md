# Hackathon Judging Rubrics

Common criteria across MLH, Devpost, and corporate-sponsored hackathons. Use this in `/hackathon:ideate` to score ideas on *rubric fit*, and in `/hackathon:scope` to make sure the demo moment lands on judging axes.

---

## Universal 4-axis rubric (used by ~80% of events)

| Axis | Weight | What judges look for |
|---|---|---|
| **Technical impressiveness** | 25% | Novel engineering, non-trivial integration, working multi-system flow |
| **Design / UX** | 25% | Visual polish, intuitive flow, mobile-responsive, loading/error states |
| **Originality / creativity** | 25% | Not a clone of existing products; unexpected angle on the theme |
| **Impact / usefulness** | 25% | Real problem, real users, real outcome |

Some events weight these differently — read rules in `/hackathon:init`.

---

## Common additional axes (check per event)

| Axis | When it appears |
|---|---|
| **Theme fit** | All themed hackathons — mandatory |
| **Use of sponsor tech** | Corporate-sponsored events (e.g., "must use Vercel", "must use Anthropic API") |
| **Presentation quality** | Live-judged events — your pitch matters |
| **Completeness** | "It works end-to-end" gets real weight |
| **Scalability** | Less important at 24h events; critical at 48h+ corporate ones |
| **Social / ethical impact** | Mission-driven hackathons (MLH GoodHack, etc.) |

---

## What ACTUALLY wins (meta-patterns across winners)

After scanning Devpost winners:

1. **One obvious "wow" moment in the demo** — judges remember the 10-second clip, not the architecture
2. **Tight, rehearsed 60-sec pitch** — hook in 5 seconds, demo starts by second 20
3. **A problem statement a judge can relate to personally** — not "businesses have a pain", but "have you ever..."
4. **Live-deployed URL** — judges prefer clicking a link over watching a local demo
5. **README with screenshots at the top** — first-round async judging is often README-only
6. **Working on first try during live demo** — a crash during presentation is fatal
7. **Creative naming + simple logo** — memorable brand > forgettable name on a great app

---

## What loses (common rejection patterns)

1. "Coming soon" / "This would do X" — judges score what they see, not what you describe
2. Requires signup to try — adds friction at the worst time
3. Broken empty states — "see, there's no data yet" kills the impression
4. Localhost-only with "it works on my machine"
5. Pitch says "we pivoted from X" — judges don't care about your process
6. Over-engineered tech on a simple problem — looks like overkill, not impressive

---

## Rubric-optimization rules for `/hackathon:scope`

When defining MUST-HAVES, ensure each feature maps to ≥ 1 rubric axis:

| Feature type | Axis it hits |
|---|---|
| Live AI / streaming output | Technical + Originality |
| Realtime collaboration | Technical + Design |
| Mobile-responsive polish | Design |
| Novel data source integration | Technical + Originality |
| Personal emotional connection | Impact |
| Unique visual design | Design + Originality |
| Working end-to-end flow | Completeness |

If any MUST-HAVE doesn't hit any axis → cut it or redesign it.

---

## Per-platform specifics

### Devpost
- README.md description is load-bearing — judges read it async
- Screenshots embedded at top of README win clicks
- "Inspiration" / "What it does" / "How we built it" fields — fill all
- Video demo field — 3 min max, usually 60-90 sec wins

### MLH
- Sponsor prize tracks stack with main prize — always opt into applicable ones
- Team size caps (usually 4) — check at `/hackathon:init`
- "Good hack" ethical criterion at MLH events

### Corporate events (Vercel, Anthropic, etc.)
- Must use sponsor tech (weight: 100% — disqualification if missed)
- Bonus for blog-post-worthy use case (sponsor will amplify winners)
- Showcase unusual or novel API use, not basic integration
