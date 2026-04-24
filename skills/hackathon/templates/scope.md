# Scope Lock — {{project_name}}

**Status:** LOCKED at {{timestamp}}
**Amendments:** see `scope-log.md`

---

## The demo moment (one sentence)

> {{the_10_second_clip_judges_must_see}}

If this doesn't work at judging time, the whole project fails. Build this FIRST.

---

## MUST-HAVES (max 5, ranked by demo criticality)

Each feature maps to ≥1 rubric axis (see `references/judging-rubrics.md`).

| # | Feature | Rubric axis | Est. hours | Status |
|---|---|---|---|---|
| 1 | {{feature_1}} | {{axis}} | {{h}} | [ ] |
| 2 | {{feature_2}} | {{axis}} | {{h}} | [ ] |
| 3 | {{feature_3}} | {{axis}} | {{h}} | [ ] |
| 4 | {{feature_4}} | {{axis}} | {{h}} | [ ] |
| 5 | {{feature_5}} | {{axis}} | {{h}} | [ ] |

Total estimated hours: {{sum}}
Event duration: {{event_hours}}h
Buffer: {{event_hours - sum}}h (must be ≥ 30% of event for polish + demo prep)

---

## NICE-TO-HAVES (only if buffer remains)

- {{nice_1}}
- {{nice_2}}

---

## EXPLICITLY CUT (resist the urge)

These were considered and rejected. Do not build them without a scope amendment.

- {{cut_1}} — reason: {{why}}
- {{cut_2}} — reason: {{why}}

---

## 60-second pitch draft (written BEFORE code)

**Hook (5s):** {{attention_grabber_question_or_statistic}}

**Problem (10s):** {{the_pain_in_one_sentence_and_who_feels_it}}

**Solution (10s):** {{what_the_project_does_in_plain_english}}

**Live demo (25s):** {{the_demo_moment_script — what to click, what to say}}

**Tech highlight (5s):** {{one_impressive_technical_detail}}

**Ask / team (5s):** {{call_to_action_and_team_credit}}

---

## Amendment protocol

- Cannot silently add a feature during `/hackathon:build`
- To amend: run `/hackathon:scope --amend`, which FORCES a 1-in-1-out trade
- Every amendment appends to `.hackathon/scope-log.md` with timestamp + reason
- Retro (`/hackathon:retro`) reviews the amendment log for learnings
