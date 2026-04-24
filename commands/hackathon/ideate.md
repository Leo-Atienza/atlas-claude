# /hackathon:ideate — Generate and score ideas

You are handling: **$ARGUMENTS**

Read `.hackathon/event.yaml` first. If missing → redirect to `/hackathon:init`.

---

## Step 1 — Load context

1. Read `.hackathon/event.yaml` for theme, judging rubric, required tech, team mode
2. Read `~/.claude/skills/hackathon/references/judging-rubrics.md` for axis patterns
3. Read `~/.claude/skills/hackathon/references/stack-presets.md` for available presets

## Step 2 — Generate 5–10 ideas

For the event's theme, brainstorm 5–10 distinct ideas. Each idea must:
- Satisfy any `required_tech` constraint
- Fit the event duration (scope matches hours available)
- Have a clear "demo moment" (the 10-second judge-wow)
- NOT be a clone of commonly-built hackathon projects for this theme

Use **Firecrawl MCP** `firecrawl_search` for "devpost {theme} winners" to avoid duplicating existing projects — aim for angles that have NOT been done.

## Step 3 — Score each idea

For each idea, score on 5 axes (1–5, 5 = best):

| Axis | What it measures |
|---|---|
| Buildability | Can be finished in `duration_hours` with team size |
| Wow factor | How memorable the demo moment is |
| Rubric fit | How many judging axes it hits |
| Demo-ability | Can be shown clearly in 60 seconds |
| Stack fit | User's familiarity penalty (Next.js = 5, unfamiliar = 2) |

Compute total = sum of axes. Anything ≤ 15/25 is auto-cut.

## Step 4 — Tag stack preset per idea

For each surviving idea, assign the best preset from `stack-presets.md`:
- Chat/streaming AI → `web-ai`
- Users + data + payments → `saas`
- Phone-first → `mobile`
- Charts/maps/analysis → `data-viz`
- Multi-step LLM with tools → `agent`

## Step 5 — Present as ranked table

```
Idea ranking (out of 25):

| # | Idea | Build | Wow | Rubric | Demo | Stack | Total | Preset |
|---|---|---|---|---|---|---|---|---|
| 1 | {{name}} | 5 | 5 | 4 | 5 | 4 | 23 | web-ai |
| 2 | {{name}} | 4 | 5 | 5 | 4 | 5 | 23 | agent |
...

Top 3 pick recommendations:
1. {{idea_1}} — strongest demo moment, {{why}}
2. {{idea_2}} — widest rubric fit, {{why}}
3. {{idea_3}} — easiest to finish, {{why}}
```

## Step 6 — Prompt user to pick

Ask: *"Pick 1 idea to commit to, or type 'more' for another round of ideation."*

If user picks: write the chosen idea + preset to `.hackathon/chosen-idea.md` with fields:
- `title`, `one_liner`, `demo_moment_sketch`, `stack_preset`, `rationale`

Next step pointer:
```
✅ Idea locked: {{title}} (preset: {{stack_preset}})

Next: /hackathon:scope — define the 60-sec pitch + MUST-HAVES before any code.
```

---

**Plain English triggers**: "what should I build", "hackathon ideas for [theme]",
"brainstorm", "ideate", "give me ideas"
