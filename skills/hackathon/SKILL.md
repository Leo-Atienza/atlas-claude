# /hackathon — End-to-end hackathon workflow

> Opinionated system for hackathons. Compensates for inexperience with prescriptive phases, battle-tested stacks, and baked-in anti-scope-creep enforcement.

**Primary goal**: ship a working, deployed, demo-able project by the submission deadline — not the most ambitious project, the **most complete** one.

---

## When to invoke

Trigger with `/hackathon` or any sub-command `/hackathon:<phase>`. Plain-English triggers:
- "starting a hackathon", "joining a hackathon", "hackathon setup"
- "I have X hours to build something"
- "lock scope", "hackathon scope lock", "what should I build"
- "hackathon demo prep", "pitch script"

---

## Phase map (the workflow)

| # | Sub-command | Purpose | Timing |
|---|---|---|---|
| 0 | `/hackathon:init` | Event metadata, timeline, rules | T-24h, ~15 min |
| 1 | `/hackathon:ideate` | Score 5-10 ideas, pick 1 + stack | First 45 min |
| 2 | `/hackathon:scope` | LOCK MUST-HAVES + pitch before code | 30 min, HARD LOCK |
| 2b | `/hackathon:team` | (if `--team`) split tracks, kanban | After scope, 20 min |
| 3 | `/hackathon:scaffold` | Live-deployed blank URL | <15 min |
| 4 | `/hackathon:build` | Demo-moment-first vertical slice | 60-70% of event |
| 5 | `/hackathon:polish` | Visual QA, error states, perf | Final 2-3 hours |
| 6 | `/hackathon:demo` | Video + screenshots + README | T-60 min |
| 7 | `/hackathon:pitch` | 60-sec pitch script + checklist | T-30 min |
| 8 | `/hackathon:retro` | Learnings → G-FAIL/G-PAT | Post-event |

---

## Routing — what to do if invoked without a sub-command

When the user types bare `/hackathon` or a plain-English trigger, inspect `.hackathon/` state to infer the next phase:

```
if no .hackathon/ folder                       → /hackathon:init
elif .hackathon/event.yaml and no scope.md     → /hackathon:ideate
elif scope.md but no package.json/app.json     → /hackathon:scaffold
elif scaffolded but no live URL confirmed      → /hackathon:scaffold (re-run deploy)
elif scaffolded and >2h until deadline         → /hackathon:build
elif <3h until deadline and no README.md       → /hackathon:polish
elif <90 min until deadline                    → /hackathon:demo
elif <30 min until deadline                    → /hackathon:pitch
elif deadline passed                           → /hackathon:retro
```

Always announce the inferred phase and offer an escape: *"I'm assuming you want `/hackathon:<phase>` based on state. Use `/hackathon:<other>` to override."*

---

## The five hackathon failure modes this skill prevents

1. **Scope creep** → Phase 2 hard-lock + `/hackathon:build` checks every feature against `scope.md`
2. **Tech stack bikeshedding** → Phase 1 auto-tags a preset; Phase 3 scaffolds it in <15 min
3. **No deploy until hour 20** → Phase 3 mandates live URL *before* writing features
4. **Pitch written at minute -5** → Phase 2 forces pitch-draft *before* any code
5. **Live-demo-only depends on API** → Phase 6 records video fallback

See `references/failure-modes.md` for the full list and prevention rules.

---

## Stack presets (auto-selected from theme in Phase 1)

5 equal-priority presets; Phase 1 tags the recommended one based on the event theme. See `references/stack-presets.md`.

- **`web-ai`** — Next.js + Vercel AI SDK + shadcn
- **`saas`** — Next.js + Supabase + Stripe + shadcn
- **`mobile`** — Expo + Supabase + EAS Preview
- **`data-viz`** — Next.js + Observable Plot + Recharts
- **`agent`** — Next.js + AI SDK tool-use + streaming UI

Default fallback when theme is stack-agnostic: `web-ai` (user's fastest path).

---

## State — `.hackathon/` folder

Created by `/hackathon:init` in the hackathon project's root directory.

| File | Written by | Purpose |
|---|---|---|
| `event.yaml` | `init` | Event metadata, deadline, judging, timeline checkpoints |
| `scope.md` | `scope` | Locked MUST-HAVES, demo moment, pitch draft |
| `scope-log.md` | `scope --amend` | Timestamped record of scope changes (for retro) |
| `demo-moment.md` | `scope` | The one 10-second clip judges must see |
| `timeline.md` | `init` | Reverse-engineered phase checkpoints from deadline |
| `failures-log.md` | `build` | Things mocked/faked due to 30-min stuck rule |
| `team.md` | `team` | (if `--team`) teammate tracks + kanban |
| `demo/` | `demo` | Screenshots, video path, final commit SHA + URL |

---

## Load supporting references on-demand

Per sub-command:
- `/hackathon:ideate`, `/hackathon:scope` → load `references/judging-rubrics.md`
- `/hackathon:scaffold` → load `references/stack-presets.md`
- `/hackathon:build` → load `references/failure-modes.md`
- Any phase → `references/mcp-cheatsheet.md` for MCP tool lookup

---

## Reuse existing skills

- `/new-web` → scaffold (web-ai / saas / data-viz / agent presets)
- `/new-mobile-app` → scaffold (mobile preset)
- `/flow:quick` → build-phase small tasks
- `/flow:debug` → build-phase stuck debugging
- `frontend-design` SKILL → polish phase CSS/animation
- `next-best-practices` SKILL → build-phase quality rules
- `handoff` SKILL → retro phase structure
- KNOWLEDGE G-ERR/G-FAIL → auto-loaded by `/new-web`, inherited

---

## Plain-English trigger reference

| Utterance | Route |
|---|---|
| "starting a hackathon", "just joined a hackathon" | `/hackathon:init` |
| "what should I build", "give me ideas for [theme]" | `/hackathon:ideate` |
| "lock scope", "scope this", "commit to an MVP" | `/hackathon:scope` |
| "scaffold this", "spin up the project" | `/hackathon:scaffold` |
| "add teammates", "split the work" | `/hackathon:team` |
| "next feature", "what should I work on" | `/hackathon:build` |
| "polish this", "demo prep" | `/hackathon:polish` |
| "record demo", "hero screenshots" | `/hackathon:demo` |
| "write pitch", "60-second script" | `/hackathon:pitch` |
| "retro", "what did I learn" | `/hackathon:retro` |
