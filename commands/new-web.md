# /new-web — Start a new web project

You are handling: **$ARGUMENTS**

Execute autonomously from start to finish. This is the fast path for web projects — the user's primary workflow.

---

## Step 1 — Scaffold the project

If no project directory exists yet, scaffold with the user's preferred stack:

```bash
npx create-next-app@latest <project-name> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

After scaffolding, `cd` into the project directory.

## Step 2 — Load your stack skills

Read these SKILL.md files for the session (do NOT skip):
1. `~/.claude/skills/frontend-design/SKILL.md` — animation, CSS patterns, visual quality
2. `~/.claude/skills/next-best-practices/SKILL.md` — RSC, data patterns, async APIs

Also activate from REGISTRY.md: SK-005, SK-029, FS-002, FS-020, FS-021.

## Step 3 — Apply known lessons (auto-load from knowledge base)

Read `~/.claude/projects/C--Users-leooa--claude/memory/INDEX.md` and scan for tags matching: `#nextjs`, `#tailwind`, `#css`, `#framer-motion`, `#daisy-ui`, `#animation`, `#performance`, `#scroll`.

For every matching G-ERR and G-FAIL topic, read the topic file and apply the lesson proactively. Key known issues:

- **G-ERR-005**: `last:` pseudo-class trap with animation wrappers — don't use `last:mb-0` on individually-wrapped items
- **G-ERR-008**: Stale `.next` cache — kill node + rm -rf .next before rebuilding if dev server was running
- **G-ERR-009**: `backdrop-blur` on sticky/fixed elements causes scroll jank — use solid bg instead
- **G-ERR-010**: Framer Motion `whileInView` + `animate` conflict — use separate conditional JSX paths
- **G-FAIL-002**: `next/dynamic` with `ssr: false` cannot be used in Server Components — wrap in client component
- **G-FAIL-003**: Mouse-tracking animations (MagicCard style) cause scroll lag with 3+ instances
- **G-FAIL-006**: Preview MCP headless browser doesn't fire IntersectionObserver — use fallback timers
- **G-PAT-009**: DaisyUI v4 uses oklch channels — use `oklch(var(--b2))` not `hsl(var(--b2))`
- **G-SOL-005**: Remove `scroll-behavior: smooth` from html when using Framer Motion `whileInView`
- **G-SOL-013**: Add scroll-to-top on refresh via `history.scrollRestoration='manual'` in head

## Step 4 — Generate project CLAUDE.md

If no `./CLAUDE.md` exists:
1. Read `skills/project-init/SKILL.md` for the Next.js template
2. Generate `./CLAUDE.md` with project-specific conventions
3. Include the G-ERR/G-FAIL lessons as inline warnings

## Step 5 — Classify scope and execute

| Scope | Route |
|---|---|
| Landing page, portfolio, simple site | `/flow:quick` or just build it |
| Multi-page app with API routes | `/flow:plan` → `/flow:go` |
| Full SaaS with auth, DB, payments | `/flow:start --depth deep` |

## Step 6 — Quality gates (automatic, do not skip)

- TDD: write failing test before production code
- Security: run `sharp-edges` on changed files
- Visual QA: if Claude Preview MCP is available, run screenshot → dark mode → mobile check
- Tests: run and confirm passing before claiming done

## Step 7 — Wrap up

- If changes exist, ask: "Commit now? [y/n]"
- Summarize what was built in 2-3 sentences

---

**Plain English triggers** (Claude recognizes these without the slash command):
"new website", "new web app", "new next app", "new nextjs", "build a site", "create a landing page", "new portfolio", "new frontend"
