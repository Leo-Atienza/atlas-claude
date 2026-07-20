# /hackathon:scaffold — Live URL in under 15 min

You are handling: **$ARGUMENTS**

Args: `[--stack <preset>]` (override the preset tagged during `/hackathon:ideate`)

**Goal:** blank-but-branded app live on a public URL before any feature code is written.

---

## Step 1 — Pre-flight

1. Read `.hackathon/event.yaml` and `.hackathon/chosen-idea.md`. If either missing → redirect to earlier phase.
2. Read `.hackathon/scope.md`. If missing → *"Scope must be locked before scaffolding. Run `/hackathon:scope` first."* and exit.
3. Resolve preset: `--stack` flag wins; else use `stack_preset` from `.hackathon/chosen-idea.md`.
4. Load `~/.claude/skills/hackathon/references/stack-presets.md` — locate the preset block.

## Step 2 — Scaffold per preset

Use the `scaffold_command` from the preset block. All scaffolds happen in the project root (the folder containing `.hackathon/`).

| Preset | Command |
|---|---|
| `web-ai` | `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` then `npm i ai @ai-sdk/anthropic @ai-sdk/openai` |
| `saas` | `npx create-next-app@latest . --typescript --tailwind --app` then `npx supabase init` + `npm i @supabase/ssr @supabase/supabase-js stripe` |
| `mobile` | `npx create-expo-app@latest . --template tabs` then `npx expo install @supabase/supabase-js expo-secure-store` |
| `data-viz` | `npx create-next-app@latest . --typescript --tailwind --app` then `npm i @observablehq/plot d3 recharts` |
| `agent` | `npx create-next-app@latest . --typescript --tailwind --app` then `npm i ai @ai-sdk/anthropic zod` |

If the directory is not empty (user has existing files), chain to `/new-web` or scaffold into a subfolder after asking.

## Step 3 — Install UI kit + seed mock data

All Next.js presets: run `npx shadcn@latest init` with defaults (New York, Neutral, CSS vars). Expo preset: skip shadcn (use NativeWind if not already via template).

Use MCPs to grab specific components rather than generating from scratch:
- **shadcn MCP** `get_add_command_for_items` for button/card/input/dialog
- **21st-dev MCP** `21st_magic_component_builder` for the one hero component that sells the demo
- **heroui / aceternity MCP** only if the preset block calls them out
- **iconify MCP** `search_icons` + `get_icon` for all icons (never hand-ship SVGs)

Seed mock data to `src/lib/seed.ts` (or `lib/seed.ts` for app-dir without src): 20+ realistic-looking rows matching the demo moment's data shape. Every view must render something on empty state.

## Step 4 — Wire env vars

Create `.env.local` from the preset's `env_template`. Fill keys:
- `web-ai` / `agent`: `ANTHROPIC_API_KEY` (prompt user — never guess)
- `saas`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (if payments in scope)
- `mobile`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `data-viz`: none required for mock data

Also create `.env.example` with keys listed but values blank — committed to git.

## Step 5 — Deploy to live URL

**Next.js presets (web-ai, saas, data-viz, agent):**
1. Use **Vercel MCP** `deploy_to_vercel` with the project directory.
2. Capture deployed URL; write to `.hackathon/event.yaml` under `deploy.live_url`.
3. Set env vars in Vercel via dashboard or `vercel env add` — never commit secrets.

**Mobile (expo):**
1. `eas build:configure` then `eas update --branch preview --message "initial scaffold"`.
2. Capture the Expo preview URL + QR code link; write to `event.yaml` under `deploy.live_url`.

**Checkpoint:** open the URL in a browser (preview_start + preview_screenshot) to confirm the page renders. If the build is red, **FIX BEFORE PROCEEDING** — a red scaffold is a red demo.

## Step 6 — Copy CLAUDE.md into the project root

Copy `.hackathon/project-claude.md` → `./CLAUDE.md`. Fill placeholders:
- `{{project_name}}` from event.yaml
- `{{event_name}}`, `{{deadline_iso}}`, `{{stack_preset}}` from event.yaml + chosen-idea.md
- `{{demo_moment_one_sentence}}` from `.hackathon/demo-moment.md`
- `{{stack_specific_rules}}` from the preset block in `stack-presets.md`
- `{{judging_rubric_from_event_yaml}}` from event.yaml `judging` block

## Step 7 — First commit

```
git init
git add .
git commit -m "scaffold: initial {{preset}} app for {{event_name}}"
git branch -M main
```

If user has a GitHub repo to push to (check `event.yaml` for `repo_url`): `git remote add origin {{url}}` + `git push -u origin main`. Otherwise prompt: *"Create a GitHub repo now? (y/n — needed for Vercel auto-deploy on push)"* and use **MCP_DOCKER** `create_repository` if yes.

## Step 8 — Summary + next

```
✅ Scaffold complete — {{wall_clock_minutes}} min

Preset:      {{preset}}
Live URL:    {{live_url}}
GitHub:      {{repo_url or "local only"}}
Seed data:   {{count}} rows in src/lib/seed.ts
CLAUDE.md:   written to project root

Next: {{if --team on init: /hackathon:team else /hackathon:build}}
```

If wall clock exceeded 15 min: add a `failures-log.md` entry noting what slowed things down (for retro).

---

**Plain English triggers**: "scaffold the project", "set up the app", "start coding",
"deploy a blank site", "spin up the stack"
