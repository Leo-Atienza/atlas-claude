# /hackathon:retro — Post-event learnings → G-FAIL / G-PAT

You are handling: **$ARGUMENTS**

Post-event, same day ideally (memory is still sharp). The goal: compound learnings so the NEXT hackathon starts from a better baseline.

---

## Step 1 — Pre-flight

1. Read every `.hackathon/` file:
   - `event.yaml`, `scope.md`, `scope-log.md`
   - `build-log.md`, `failures-log.md`, `polish-log.md`
   - `demo-moment.md`, `pitch-final.md`, `qa-prep.md`
2. Read project `README.md`, `./CLAUDE.md`.
3. Pull git log: `git log --oneline` → see actual commit cadence vs plan.

## Step 2 — Prompt the user for subjective retro

Ask in one message:
```
Post-event retro — answer honestly, 1-2 sentences each:

1. Did you win / place / get a shoutout? (win / placed #X / no / other)
2. What ONE thing worked better than expected?
3. What ONE thing blew up that you didn't see coming?
4. What did judges actually ask / react to?
5. If you did it again tomorrow, what's the one rule you'd add to hackathon-mode CLAUDE.md?
6. Anything new to add to the "known hackathon failure modes" list?
```

## Step 3 — Extract objective metrics

From the state files, compute:
- **Scope integrity**: MUST-HAVES shipped / MUST-HAVES planned. Count amendments from `scope-log.md`.
- **Time budget**: actual hours spent on build vs planned hours (sum of feature estimates).
- **Stuck events**: count entries in `failures-log.md`. List top 3 blockers.
- **Checkpoint health**: from `build-log.md`, what % of 2-hr checkpoints had the demo moment working end-to-end?
- **Commit cadence**: commits / hour of build phase.
- **Deploy reliability**: count of red Vercel/EAS builds during the event.

## Step 4 — Synthesize learnings

Produce 3 categories of output:

### Category A — Patterns worked (→ G-PAT knowledge entries)
Any approach that worked 3x or more in this event → save as a knowledge entry with `[MEDIUM]` confidence. Format:
```
G-PAT-{{id}}: {{pattern_name}}
Confidence: [MEDIUM — observed 1 event]
Context: {{hackathon_preset or theme}}
Pattern: {{what}}
Evidence: {{specific moment in this hackathon}}
```

### Category B — Mistakes avoided / to avoid (→ G-FAIL / G-ERR)
Anything that burned ≥ 30 min → save with `[HIGH]` if it's the kind of thing you know you'll repeat:
```
G-FAIL-{{id}}: {{failure_name}}
Cause: {{what_went_wrong}}
Symptom: {{how_you_noticed}}
Prevention: {{one_sentence_rule}}
Source: {{event_name}} {{date}}
```

### Category C — Skill updates (→ this skill's own files)
Updates to make in `~/.claude/skills/hackathon/`:
- New failure mode → append to `references/failure-modes.md` (F-16, F-17, ...)
- Stack preset that failed → annotate `references/stack-presets.md` with a "known issue" note
- Timeline formula that was wrong → update `commands/init.md`
- Better pitch structure → update `templates/pitch.md`
- CLAUDE.md rule that saved time → update `templates/project-claude.md`

## Step 5 — Confirm each learning with the user

For each extracted item, ask: *"Save this as {{type}} knowledge? (y/n/edit)"* — do not auto-save. User must confirm. The `feedback_selective_memory_saving.md` preference applies: noise over convenience.

Accepted entries go to:
- `~/.claude/topics/G-PAT/` for patterns
- `~/.claude/topics/G-FAIL/` for failures
- Update `~/.claude/topics/KNOWLEDGE-DIRECTORY.md` with new entries
- Skill updates go directly into the skill's files (these are maintenance, not memories)

## Step 6 — Write `.hackathon/retro.md`

```markdown
# Retro — {{event_name}} ({{date}})

## Outcome
{{win / place / learning event}}

## Metrics
| Metric | Value |
|---|---|
| MUST-HAVES shipped | {{X}}/{{Y}} |
| Scope amendments | {{N}} |
| Stuck events (>30 min) | {{N}} |
| Time over budget | {{+/- hours}} |
| Demo-moment-green checkpoints | {{%}} |
| Commits | {{N}} |
| Red builds | {{N}} |

## Top 3 wins
1. {{what_worked}}
2. ...
3. ...

## Top 3 pains
1. {{what_blew_up}}
2. ...
3. ...

## Judges' reactions
{{what they asked, what landed, what flopped}}

## Skill updates applied
- {{file}}: {{change}}
- ...

## Knowledge saved
- G-PAT-{{id}}: {{pattern}}
- G-FAIL-{{id}}: {{failure}}
```

## Step 7 — Session handoff

Chain into `/handoff` at the end — commit all `.hackathon/` artifacts + README + retro for archival. The `.hackathon/` folder becomes a permanent record of how this event went.

Optional: archive the project by moving `.hackathon/` → `.hackathon-{{event_slug}}-archived/` so the next event starts with a clean folder.

## Step 8 — Summary + next

```
✅ Retro complete

Metrics:           .hackathon/retro.md
Knowledge saved:   {{n}} entries to ~/.claude/topics/
Skill updates:     {{n}} files in ~/.claude/skills/hackathon/
Archive:           {{yes/no — .hackathon → .hackathon-{{slug}}-archived}}

For your NEXT hackathon, these updates take effect automatically.

Optional: /handoff to commit + archive.
```

---

**Plain English triggers**: "hackathon retro", "post-event retro", "what did we learn",
"save hackathon lessons", "capture learnings"
