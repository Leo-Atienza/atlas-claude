# {{project_name}} — Hackathon Project CLAUDE.md

This CLAUDE.md is for the hackathon project itself. It inherits from `~/.claude/CLAUDE.md` but adds hackathon-specific rules that are NORMALLY too aggressive but CORRECT here.

**Event:** {{event_name}}
**Deadline:** {{deadline_iso}}
**Stack preset:** {{stack_preset}}
**Demo moment:** {{demo_moment_one_sentence}}

---

## Hackathon mode: rules that override defaults

### Speed over correctness (within reason)

- **Skip writing tests** unless testing is part of the demo moment
- **One commit per feature** — no branching, no PRs, push straight to main
- **No type-strict refactoring** — if TypeScript yells, `any` is acceptable, fix later
- **No abstractions** — repeat code 3x is fine; premature DRY kills hackathons
- **No unused-code cleanup** — retro handles this

### Scope lock (HARD)

- MUST-HAVES are in `.hackathon/scope.md` — if a feature isn't there, don't build it
- To add a feature: run `/hackathon:scope --amend` and cut something else
- Flag any scope deviation the user proposes with: *"This isn't in scope.md. Amend or cut?"*

### 30-minute stuck rule

If any feature is >30 min over its estimate:
1. Stop debugging
2. Mock the output (return fake data that looks real)
3. Log it in `.hackathon/failures-log.md`
4. Move on to the next MUST-HAVE

### Deploy from minute 1

- Vercel (or EAS) auto-deploy on push
- If deploy breaks, FIX IMMEDIATELY before writing new features
- Red builds = broken demo = 0 judging score

### Seed mock data

- `src/lib/seed.ts` (or equivalent) contains ≥20 realistic-looking rows
- All views must render something even with empty user state
- Never show "No data yet" empty states without a CTA or sample content

---

## Stack-specific rules

{{stack_specific_rules — injected based on preset: web-ai, saas, mobile, data-viz, agent}}

---

## What judges see

`.hackathon/scope.md` defines what matters. At any decision point, ask: *"Does this help the demo moment land?"* If no → cut it.

Primary judging axes for this event:
{{judging_rubric_from_event_yaml}}

---

## Commands you'll use

- `/hackathon:build` — next feature per scope priority
- `/hackathon:scope --amend` — if you truly need to change scope
- `/flow:quick [task]` — one-off small changes
- `/flow:debug [symptom]` — when stuck (BEFORE the 30-min rule fires)
- `/hackathon:polish` — when close to deadline
- `/hackathon:demo` — to capture video + screenshots
- `/hackathon:pitch` — final pitch script
