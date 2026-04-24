# /hackathon:pitch — 60-second pitch script with timer markers

You are handling: **$ARGUMENTS**

The pitch was drafted in `/hackathon:scope` and refined during build. This command **assembles the final script** from all artifacts — demo moment, README, stack highlights — and produces speaker notes ready to present.

---

## Step 1 — Pre-flight

1. Read `.hackathon/scope.md` (pitch draft section), `.hackathon/demo-moment.md`, `.hackathon/event.yaml`, `.hackathon/chosen-idea.md`.
2. Read the project `./README.md` (written during `/hackathon:demo`).
3. Read `~/.claude/skills/hackathon/templates/pitch.md` as the output skeleton.

If any prerequisite is missing → *"Run the prerequisite phase first."* and point them there.

## Step 2 — Assemble the 60-second structure

Fill the template slots with your best draft, then show the user. Structure:

| Time | Section | Source material | What judges need |
|---|---|---|---|
| 0:00–0:05 | **Hook** | Problem-statement inversion or surprising stat | "This is worth my 60 sec" |
| 0:05–0:15 | **Problem** | scope.md Problem block | Empathy + stakes |
| 0:15–0:25 | **Solution** | scope.md Solution block | One-liner + mechanism |
| 0:25–0:50 | **Live demo** (25 sec) | demo-moment.md + live URL walk-through | The wow |
| 0:50–0:55 | **Tech highlight** | README "How we built it" | Credibility for tech judges |
| 0:55–1:00 | **Ask / Team** | event.yaml team + one ask (feedback, users, hiring) | Memorable close |

**Demo section is load-bearing — protect its 25 seconds ruthlessly.** If the hook + problem + solution exceed 25 sec combined, cut words until they fit.

## Step 3 — Draft speaker notes

Write two versions:
1. **Full prose** (what you'd say in a quiet room, naturally)
2. **Compressed bullets** (what fits on index cards / a second monitor for glancing)

Rules for phrasing:
- **Active voice**: "We built..." not "It was built..."
- **Short sentences**: if a line takes > 6 sec to speak, cut it.
- **Numbers > adjectives**: "20× faster" beats "incredibly fast"
- **Zero jargon for judges**: if you'd explain a word to your grandma, it's safe; if not, cut it.

## Step 4 — Live demo walkthrough (the 25-sec core)

Script the EXACT actions on-screen with timestamps. This is a mini-storyboard:

```
[0:25] Switch to browser, show live URL.
[0:27] Point to {{element}} — "Watch what happens when I..."
[0:30] Click {{primary_action}}.
[0:32] {{outcome}} appears — PAUSE 2 sec. Let judges see it.
[0:38] Scroll to {{secondary_detail}} — "And notice how it also..."
[0:45] Back to hero shot.
```

Include fallback instructions:
- If browser hangs: have video ready at `{{video_url}}` — "Here's a recording" and keep talking over it.
- If LLM API slow: toggle `MOCK_MODE=true` env var (if wired) — script should NOT change.
- If Vercel is down: open the recorded video directly. Have it in a tab BEFORE presenting.

## Step 5 — Q&A prep

Hackathon judges ask predictable questions. Pre-answer these in one sentence each:

1. **"How did you build this in {{event_duration}}?"** — Name the speed-enabling choices (pre-built stack, shadcn, Claude Code).
2. **"What was the hardest part?"** — Pull from `.hackathon/failures-log.md`; pick one real blocker + how you solved it.
3. **"What's the business model / who uses this?"** — 1-sentence target user + 1-sentence monetization (or "open-source" if no monetization).
4. **"How is this different from {{obvious_competitor}}?"** — 1-sentence unique angle.
5. **"What's next?"** — 1 bullet tied to the demo moment (deeper, not wider).

Write answers to `.hackathon/qa-prep.md`.

## Step 6 — Write the final pitch file

Fill `~/.claude/skills/hackathon/templates/pitch.md` → write to `.hackathon/pitch-final.md`:

```markdown
# {{project_name}} — 60-sec Pitch

Event: {{event_name}} | Team: {{team}} | Deadline: {{deadline}}

## Timing
0:00 — Hook
0:05 — Problem
0:15 — Solution
0:25 — LIVE DEMO (25 sec)
0:50 — Tech
0:55 — Ask

## Full script
{{full_prose_pitch}}

## Compressed bullets (index-card version)
{{bullet_pitch}}

## Live demo storyboard
{{step-by-step actions with timestamps}}

## Q&A prep
{{top 5 likely questions with 1-sentence answers}}

## Fallbacks
- Video URL: {{video_url}}
- Mock-mode flag: {{if available}}
- Offline demo: {{plan}}
```

## Step 7 — Rehearsal checklist

Print for the user to practice:
```
🎤 Rehearsal checklist — do this 2-3 times before presenting:

□ Practice with a timer. If you exceed 60 sec, cut filler words.
□ Practice the demo walkthrough ON THE LIVE URL. Not in dev mode.
□ Practice the fallback (play the video) once — muscle memory.
□ Practice saying the hook without reading. First impression = memorized.
□ Record yourself on phone, watch playback. Fix any "ums" + pace.
□ Practice Q&A with a teammate or Claude ("grill me on this pitch").
```

## Step 8 — Summary + next

```
✅ Pitch ready

Script:       .hackathon/pitch-final.md
Q&A prep:     .hackathon/qa-prep.md
Time target:  60 sec (live demo = 25 sec protected)
Fallback:     {{video_url or "WARNING: no video recorded"}}

Next: rehearse 2-3 times, then present. After the event → /hackathon:retro
```

---

**Plain English triggers**: "write the pitch", "prep the presentation", "pitch script",
"60 second pitch", "what do I say to judges"
