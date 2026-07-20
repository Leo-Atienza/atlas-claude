# /hackathon:demo — Video, screenshots, README, frozen deploy

You are handling: **$ARGUMENTS**

**Rule:** after this command, you DO NOT touch the live URL code. The deploy is frozen. A last-minute "one more fix" kills more demos than judges' questions.

---

## Step 1 — Pre-flight

1. Read `.hackathon/scope.md`, `.hackathon/event.yaml`, `.hackathon/demo-moment.md`.
2. Confirm `/hackathon:polish` completed (look for `.hackathon/polish-log.md` entries).
3. If demo moment broken on live URL → **STOP**. Fix in `/hackathon:build`, then re-polish, then retry.

## Step 2 — Capture hero screenshots

Use **Claude Preview MCP** to capture 3-5 hero shots of the live URL. Save to `.hackathon/screenshots/final/`:

1. **Hero shot** — the landing page showing the demo moment's result (what judges see first)
2. **Interaction shot** — mid-action (button clicked, data flowing, result appearing)
3. **Result shot** — the payoff (outcome of the demo moment)
4. **Mobile shot** (if responsive) — same flow on 375px viewport
5. **Detail shot** — one impressive technical bit (chart, streaming text, map)

Each screenshot: `preview_resize` → `preview_screenshot` → save with a descriptive filename (`01-hero.png`, `02-interaction.png`, etc.).

## Step 3 — Record 60-second demo video

**This is manual** — Claude cannot record OS video. Generate a script for the user:

```markdown
# 60-second demo script for {{project_name}}

**Recording tool:** Loom (web), OBS (desktop), macOS QuickTime, or Windows Xbox Game Bar
**Resolution:** 1920x1080 (or scaled to that)
**Audio:** clear mic, silent room

## Script (speak naturally):

0:00–0:05 — [show project name + one-liner on screen]
"Hi, I'm {{name}}. This is {{project_name}} — {{one_liner}}."

0:05–0:15 — [cut to landing page]
"The problem: {{problem_statement}}."

0:15–0:25 — [start demo interaction]
"Watch what happens when I {{trigger_action}}..."

0:25–0:45 — [DEMO MOMENT — 10-20 seconds of the magic]
[Let the app speak for itself. No narration over the key moment.]

0:45–0:55 — [cut back to face or app wide-shot]
"Built with {{stack_highlight}}. {{one_tech_detail}}."

0:55–1:00 — [end card with live URL + team]
"Try it at {{live_url}}. Thanks!"

## Post-production
- Trim dead air at start/end
- Upload to YouTube (unlisted) or Loom
- Save URL to .hackathon/event.yaml under demo.video_url
```

Print this script and prompt user: *"Record this, upload, paste the URL back so I can save it."*

## Step 4 — Generate README.md

Load `~/.claude/skills/hackathon/templates/readme.md`. Fill placeholders from all state files:
- `{{project_name}}` — from event.yaml + chosen-idea.md
- `{{one_sentence_elevator_pitch}}` — from scope.md (the "Solution" line in the pitch)
- `{{live_url}}` — from event.yaml
- `{{video_url}}` — prompt user (from Step 3)
- `{{event_name}}`, `{{date}}` — from event.yaml
- `{{hero_screenshot_path}}` — `.hackathon/screenshots/final/01-hero.png`
- `{{stack_list_with_purpose}}` — from chosen-idea.md + scaffold details
- `{{screenshots_1-3}}` — from Step 2
- `{{demo_moment_described}}` — from demo-moment.md, padded to 2-3 sentences
- `{{impressive_technical_choice}}` — pick from actual code (e.g., "streaming LLM response with tool-use + Vercel Edge")
- `{{inspiration}}`, `{{challenges}}`, `{{learned}}`, `{{whats_next}}` — prompt user for each (2 sentences max)

Write to `./README.md` in the project root (NOT in `.hackathon/`).

## Step 5 — Upload screenshots + video to project

For GitHub README to render screenshots, move them into `./public/screenshots/` (Next.js) or `./assets/screenshots/` (Expo) and update paths in README.md.

Commit: `docs: add submission README + screenshots`. Push.

## Step 6 — Freeze the deploy

1. Capture final commit SHA: `git rev-parse HEAD` → write to `.hackathon/event.yaml` under `deploy.final_sha`.
2. Capture live URL → already in event.yaml, confirm it's reachable (`curl -I {{url}}`).
3. Lock it in by writing a marker file: `.hackathon/DEMO-FROZEN.md`:
   ```
   FROZEN AT: {{iso_timestamp}}
   COMMIT: {{sha}}
   LIVE URL: {{url}}
   VIDEO URL: {{url}}
   
   ⚠️ DO NOT push new code to main. If something breaks, revert, do not patch.
   ```

## Step 7 — Submission checklist

Print the final checklist for the user:

```
📋 Submission checklist for {{platform}} ({{devpost/mlh/etc}}):

□ Project title: {{name}}
□ Elevator pitch (short): {{one_liner}}
□ Full description: see README.md
□ Built with (tech tags): {{stack_tags}}
□ Live demo URL: {{live_url}}  ← test in incognito
□ Source code URL: {{github_url}}  ← confirm public
□ Video URL: {{video_url}}  ← confirm plays
□ Team members added: {{list}}
□ Category / prize tracks selected: {{from event.yaml}}
□ Cover image uploaded: use .hackathon/screenshots/final/01-hero.png
□ Submission submitted (not draft): {{yes/no}}
```

## Step 8 — Summary + next

```
✅ Demo artifacts ready

Screenshots:  .hackathon/screenshots/final/ ({{n}} images)
Video script: printed above — needs manual record + upload
README.md:    written to project root
Deploy:       FROZEN at commit {{sha_short}}
Live URL:     {{url}}

Submit the form on {{platform}}, then → /hackathon:pitch
```

---

**Plain English triggers**: "record the demo", "prep submission", "make the video",
"generate the README", "finalize for judges"
