# /hackathon:scope — Lock scope before code (HARD LOCK)

You are handling: **$ARGUMENTS**

Args: `[--amend]` (force 1-in-1-out trade when scope is already locked)

This is the **most important phase**. More hackathons die from scope creep than any other failure.

---

## Step 1 — Pre-flight

1. Read `.hackathon/event.yaml`, `.hackathon/chosen-idea.md`. If either missing → `/hackathon:init` or `/hackathon:ideate` first.
2. If `.hackathon/scope.md` EXISTS and no `--amend` flag → print: *"Scope is already locked. Use `/hackathon:scope --amend` to change it (requires 1-in-1-out trade)."* and exit.
3. Load `~/.claude/skills/hackathon/references/judging-rubrics.md` for axis mapping.
4. Load `~/.claude/skills/hackathon/templates/scope.md` as the output template.

## Step 2 — Define the demo moment

Ask the user: *"In ONE sentence, what's the 10-second clip judges must see work? If this clip fails, the project fails."*

Probe until the answer is:
- Concrete (not "AI that helps users" — specific action + observable outcome)
- Visual/audio observable (judges watch it happen on screen)
- Buildable in the available time

Write to `.hackathon/demo-moment.md`.

## Step 3 — Enumerate MUST-HAVES (max 5)

For the demo moment to land, what features are required? List each with:
- Feature name
- Estimated hours
- Rubric axis it targets (from `judging-rubrics.md`)

Constraints:
- Max 5 MUST-HAVES
- Sum of hours ≤ 60% of `duration_hours` (leave 40% for deploy, polish, demo-prep, buffer)
- Every feature maps to ≥ 1 rubric axis — if it doesn't, it shouldn't be there

If the user proposes > 5 → force-rank and move bottom entries to NICE-TO-HAVES.
If sum > 60% → force-cut until it fits.

## Step 4 — Capture NICE-TO-HAVES and EXPLICITLY CUT

NICE-TO-HAVES: features you'd add IF time permits after MUST-HAVES ship.
EXPLICITLY CUT: features the user proposed that were rejected — record with reasoning to prevent re-proposing mid-build.

## Step 5 — Draft the 60-sec pitch NOW

Before writing any code, fill the pitch structure:
- Hook (5s), Problem (10s), Solution (10s), Live demo (25s), Tech highlight (5s), Ask/team (5s)

This pitch lives inside `.hackathon/scope.md`. If you can't write a compelling pitch now, the idea isn't ready — revisit `/hackathon:ideate`.

## Step 6 — Write `.hackathon/scope.md`

Fill the `templates/scope.md` template with captured values. Mark status: `LOCKED at {{now_iso}}`.

Also write `.hackathon/scope-log.md` with initial entry:
```
{{timestamp}} — INITIAL LOCK
MUST-HAVES: [list]
Pitch drafted: yes
```

## Step 7 — Handle `--amend` mode

If invoked with `--amend`:
1. Read current `.hackathon/scope.md`
2. Ask: *"What feature do you want to add?"*
3. Then: *"Which existing MUST-HAVE do you cut to make room? (cutting a smaller one is not cheating — it's discipline)"*
4. Apply the trade, rewrite `scope.md`, append to `scope-log.md`:
   ```
   {{timestamp}} — AMENDMENT
   Added: {{new_feature}}
   Removed: {{cut_feature}}
   Reason: {{why}}
   ```
5. Reject amendments that exceed 5 MUST-HAVES or exceed 60% time budget.

## Step 8 — Summary + next

```
✅ Scope LOCKED

Demo moment: {{one_sentence}}

MUST-HAVES (5):
  1. {{f1}} — {{hours}}h — {{axis}}
  2. {{f2}} — {{hours}}h — {{axis}}
  3. {{f3}} — {{hours}}h — {{axis}}
  4. {{f4}} — {{hours}}h — {{axis}}
  5. {{f5}} — {{hours}}h — {{axis}}
Total: {{sum}}h / {{duration}}h (buffer: {{buffer}}h)

NICE-TO-HAVES: {{count}}
CUT: {{count}}

Files: .hackathon/scope.md, .hackathon/demo-moment.md, .hackathon/scope-log.md

Next: {{if --team on init: /hackathon:team else /hackathon:scaffold}}
```

---

**Plain English triggers**: "lock scope", "scope this", "commit to MVP",
"what are we actually building", "scope lock hackathon"
