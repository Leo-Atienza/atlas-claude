# /hackathon:team — Split MUST-HAVES across teammates (only when `--team` set)

You are handling: **$ARGUMENTS**

This sub-phase only runs if `--team` was set on `/hackathon:init`. Otherwise, skip to `/hackathon:scaffold` or `/hackathon:build`.

---

## Step 1 — Pre-flight

1. Read `.hackathon/event.yaml` → check `team.mode == "team"` and `team.size > 1`. If solo, say *"Team mode not enabled. Re-run `/hackathon:init --team` to unlock team coordination."* and exit.
2. Read `.hackathon/scope.md` — team split happens AFTER scope lock.
3. If `.hackathon/team.md` exists → ask *"Team roster already exists. Update (y/n)?"* before overwriting.

## Step 2 — Capture roster

Ask in a single message:
```
For each teammate, give me:
1. Name
2. Primary skills (e.g., "frontend/React", "backend/Python", "design", "ML/LLM", "devops")
3. Availability hours (how many hours they can actually commit to THIS event)
4. Timezone (if not co-located)
5. Preferred comms (Slack DM, Discord, in-person, etc.)
```

If the user only provides names, probe for skills — without that info, parallel tracks won't work.

## Step 3 — Assign parallel tracks

For each MUST-HAVE in `scope.md`, assign a **primary owner** and (optionally) a **pair partner**. Rules:
- Owners should match skill: frontend features → frontend-skilled teammate; LLM prompts → ML-skilled.
- Never assign the demo moment's critical path to the least-available person.
- If two features touch the same file (e.g., the main page), serialize them — one person after the other.
- If you have fewer teammates than MUST-HAVES, bundle adjacent features under one owner.

Explicitly mark which features can run **in parallel** and which are **blocked** (e.g., "F3 depends on F1's API shape — start after F1 ships").

## Step 4 — Define check-in cadence

Pick one based on event duration:
- < 12 hr event → every 2 hr
- 12–36 hr event → every 4 hr
- > 36 hr event → every 6 hr + one mandatory mid-event demo walkthrough

Check-in format (copy-paste for teammates):
```
📍 [HH:MM] {{name}}
- Working on: {{feature}}
- Done since last: {{bullet}}
- Blocked by: {{blocker or "nothing"}}
- Next 2 hrs: {{plan}}
```

## Step 5 — Write `.hackathon/team.md`

```markdown
# Team Board — {{event_name}}

**Roster:** {{names}}
**Check-in cadence:** every {{N}} hours
**Comms:** {{channel}}

## Parallel tracks

| Feature | Owner | Pair | Depends on | Target ETA |
|---|---|---|---|---|
| {{f1}} | {{owner}} | {{pair or "—"}} | — | {{iso}} |
| {{f2}} | ... | ... | ... | ... |

## Shared infra (assign ONE owner)

- Deploy config (Vercel/EAS): {{owner}}
- Database schema / seed data: {{owner}}
- CLAUDE.md + scope-log: {{owner}}
- Pitch deck + video edit: {{owner}}

## Conflict avoidance

- Critical files (only ONE person edits at a time): {{list, e.g., app/page.tsx, lib/db.ts}}
- Use feature branches named `{{initials}}/{{feature-slug}}`; rebase before merging to main.

## Check-ins log

(append each check-in here during build)
```

## Step 6 — Generate git workflow per teammate

For each teammate, print their first commands:
```
🧑‍💻 {{name}} — you own: {{features}}

git checkout -b {{initials}}/{{first_feature_slug}}
# Build your feature
git add -A && git commit -m "feat({{feature}}): {{what}}"
git push -u origin {{initials}}/{{first_feature_slug}}
# Open PR on GitHub; squash-merge to main when green
```

Remind: **no force pushes, no rebasing shared branches during the event.** When in doubt, merge not rebase.

## Step 7 — Summary + next

```
✅ Team board ready — {{n}} teammates, {{tracks}} parallel tracks

Blockers detected: {{list any dependency chains}}
First check-in:   {{timestamp}}

Files: .hackathon/team.md

Next: /hackathon:scaffold (if not yet done) else /hackathon:build
```

---

**Plain English triggers**: "split the work", "assign features to teammates",
"team kanban", "who does what"
