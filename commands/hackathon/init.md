# /hackathon:init — Event setup + reverse-engineered timeline

You are handling: **$ARGUMENTS**

Args: `[event-name]` `[--team]` `[--duration <hours>]`

Execute autonomously. Ask only the questions the user *must* answer — everything else, assume a reasonable default and flag it.

---

## Step 1 — Capture event metadata

Ask the user ONE message containing all questions at once (so they can paste answers in bulk):

```
To set up your hackathon, I need:
1. Event name (e.g., "MLH Global Hack Week")
2. Theme / track (e.g., "AI agents for daily life")
3. Platform (devpost / mlh / lablab.ai / corporate / other)
4. Event URL (link to rules)
5. Start datetime (absolute, with timezone)
6. Submission deadline (absolute, with timezone)
7. Team size (1 = solo, or list members)
8. Required tech (any mandatory APIs/SDKs, comma-separated — or "none")
9. Prize tracks you'd like to qualify for (or "main prize only")
```

If `--team` flag set, also ask for teammates: names + skills + availability hours.

## Step 2 — Research the event

If event_url provided, use **Firecrawl MCP** `firecrawl_scrape` to pull the event page:
- Extract: judging rubric axes + weights
- Extract: submission requirements
- Extract: any tech constraints

If a Devpost URL, also `firecrawl_search` for "{event_name} past winners" to surface winning patterns (save as notes, don't copy).

## Step 3 — Write `.hackathon/event.yaml`

Create the `.hackathon/` directory in the current working directory. Copy `~/.claude/skills/hackathon/templates/event.yaml` and fill in captured values.

## Step 4 — Reverse-engineer the timeline

From `deadline_iso` backward, compute checkpoints and write to `.hackathon/timeline.md`:

```
pitch_practiced_by    = deadline - 30 min
submission_by         = deadline - 15 min (buffer for form issues)
demo_recorded_by      = deadline - 90 min
polish_starts         = deadline - 3 hours
demo_moment_working_by = deadline - 5 hours (or 60% through event, whichever is earlier)
scaffold_deployed_by  = start + 2 hours
scope_locked_by       = start + 75 min
ideate_by             = start + 45 min
```

For events < 12 hours, compress proportionally. Never let `scaffold_deployed_by` exceed start + 15% of event duration.

## Step 5 — Seed project CLAUDE.md

Copy `~/.claude/skills/hackathon/templates/project-claude.md` → `./CLAUDE.md` in the project root (once the folder is scaffolded in Phase 3). For now, copy it into `.hackathon/project-claude.md` for later use.

## Step 6 — Summary + next step

Print:

```
✅ Hackathon initialized

Event:     {{name}}
Theme:     {{theme}}
Duration:  {{duration}}h  ({{start}} → {{deadline}})
Team:      {{mode}} ({{size}})
Required:  {{required_tech}}

Timeline (reverse-engineered):
  Ideate by:         {{ideate_by}}
  Scope locked by:   {{scope_locked_by}}
  Scaffold live by:  {{scaffold_deployed_by}}
  Demo moment by:    {{demo_moment_working_by}}
  Polish starts:     {{polish_starts}}
  Demo recorded by:  {{demo_recorded_by}}
  Submit by:         {{submission_by}}

Files written:
  .hackathon/event.yaml
  .hackathon/timeline.md
  .hackathon/project-claude.md (seeded)

Next: /hackathon:ideate — generate 5-10 scored ideas for the theme.
```

---

**Plain English triggers**: "starting a hackathon", "just joined a hackathon",
"hackathon setup", "set up hackathon event", "init hackathon"
