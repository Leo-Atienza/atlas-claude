# /new-web — Start a new web project

You are handling: **$ARGUMENTS**

> **This is an INTERNAL procedure, not a command the user types (user request, 2026-07-22).** He says
> "create a website" in plain language — recognizing that ask is the trigger, and Claude runs
> this file automatically as the new-site door (the sibling door, "upgrade/improve this
> website", routes through the chef loop + retrofit instead). Never answer his ask by
> suggesting he run `/new-web`.

Execute autonomously from start to finish. This is the fast path for web projects — the user's primary workflow.

---

## Step 1 — Scaffold the project

If no project directory exists yet, scaffold with the user's preferred stack:

```bash
npx create-next-app@latest <project-name> --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

After scaffolding, `cd` into the project directory.

### Current target versions (verified 2026-07-04)

| Package | Version | Notes |
|---|---|---|
| `next` | `^16.2.6` (floor) — install latest 16.x | Security floor, May 2026 (head 16.2.10, Jul 2026). < 16.2.6 has unpatched CVEs (incl. CVE-2026-29057). |
| `react` / `react-dom` | `^19.2.7` | Latest stable (Jul 2026). |
| `tailwindcss` | `^4.3` | v4.3 adds scrollbar utilities, `@container-size`, mauve/olive/mist/taupe palettes. |
| `@tailwindcss/postcss` | `^4.3` | PostCSS plugin (default in `create-next-app`). |
| `typescript` | `latest` | + `@types/react@latest`, `@types/react-dom@latest`. |

If `create-next-app` resolves an older `next`, run `npm install next@latest react@latest react-dom@latest` immediately after scaffolding.

## Step 1a — Seed the impeccable design tokens (so the project is designed, not default)

Every new project starts from the impeccable starter tokens — one OKLCH `@theme` block (spacing, brand + brand-tinted neutral ramp, semantic roles via `light-dark()`, plus the typography / radius / shadow / z-index tiers the specs leave as prose). All default semantic pairings are WCAG-AA verified, so the build looks designed before a single component is styled. (Runtime-proven 2026-06-25: pastes clean into a fresh Next 16 + Tailwind v4 app, renders light/dark, retints from one hue, and passes a live axe AA pass across Chromium/Firefox/WebKit.)

Replace the scaffold's default `globals.css` (its throwaway `--background`/`--foreground` + `body` boilerplate conflicts with the token layer — overwrite, don't append) with the Tailwind import + the starter tokens + a token-wired body base:

```bash
# create-next-app --src-dir → src/app/globals.css; otherwise app/globals.css
GLOBALS=$(ls src/app/globals.css app/globals.css 2>/dev/null | head -1)
{ echo '@import "tailwindcss";'; echo; cat ~/.claude/skills/impeccable/starter-tokens.css; \
  printf '\nbody {\n  background-color: var(--color-surface);\n  color: var(--color-text);\n  font-family: var(--font-body);\n}\n'; } > "$GLOBALS"
```

Then seed the contrast gate with the canonical starter pairs, so `npm run check:contrast` is green from day one (both schemes; extend the pairs whenever the palette grows — both grounds for every new ink). The engine is VENDORED into the project (shadcn-style copy-in) so the gate runs on CI runners and other clones, not just this machine — `~/.claude` stays the source of truth, the project copy is what ships:

```bash
# self-contained fence: re-derive GLOBALS — shell vars do NOT survive across
# separately-run fences, and an unset $GLOBALS writes "css": [""] into the manifest
GLOBALS=$(ls src/app/globals.css app/globals.css 2>/dev/null | head -1)
mkdir -p scripts
cp ~/.claude/skills/impeccable/scripts/check-contrast.mjs scripts/check-contrast.mjs
cat > contrast-pairs.json <<EOF
{
  "_how": "Every ink-on-ground pair the site ships, [ink, ground, min]. Both grounds for every ink. Engine vendored at scripts/check-contrast.mjs (source: impeccable skill).",
  "css": ["$GLOBALS"],
  "palette": {
    "surface": "--color-surface", "surfaceRaised": "--color-surface-raised",
    "text": "--color-text", "textMuted": "--color-text-muted",
    "primary": "--color-primary", "primaryFg": "--color-primary-foreground",
    "success": "--color-success", "warning": "--color-warning",
    "error": "--color-error", "info": "--color-info"
  },
  "pairs": [
    ["text", "surface", 4.5], ["text", "surfaceRaised", 4.5],
    ["textMuted", "surface", 4.5], ["textMuted", "surfaceRaised", 4.5],
    ["primaryFg", "primary", 4.5],
    ["success", "surface", 4.5], ["warning", "surface", 4.5],
    ["error", "surface", 4.5], ["info", "surface", 4.5]
  ],
  "banned": []
}
EOF
npm pkg set scripts.check:contrast="node scripts/check-contrast.mjs"
npm run check:contrast   # must exit 0 on a fresh scaffold (verified 2026-07-22, both schemes)
```

Then change exactly the three things the token file calls out — nothing else is required:
- **`--brand-h`** — one hue (0–360) retints the whole palette (brand, neutrals, surfaces, borders, shadows). Warm yellow-green hues (~90–140) make brand more luminous and can drop white-on-brand below AA — there, lower brand `L` to ~0.45 or use a dark `--color-brand-foreground`.
- **The three faces** — wire real fonts via `next/font` and expose them as the variables the tokens read: `--font-display-face`, `--font-body-face`, `--font-mono-face` (set each as the loader's `variable`, put the classes on `<html>`). Avoid the AR-14 AI triad (Space Grotesk / Geist / Instrument Serif).
- A signature effect (animated gradient backdrop, etc.) is opt-in per `impeccable/reference/signature-effects.md` — if you add one over light/dark text, give its container an on-brand fallback background so the text stays legible before the canvas paints.

Verify before shipping: `node ~/.claude/skills/impeccable/scripts/verify-browsers.mjs <url> --a11y` runs the cross-browser + motion check plus a live axe WCAG 2.2 AA pass (Chromium); the a11y verdict reports independently of the render/motion verdict.

## Step 1b — Professional baseline (write-if-absent; the scaffold ships NONE of these)

`create-next-app` gives you a working page, not a professional site. Add the completeness layer up front, token-styled so even the failure states look designed (`APP` = `src/app` or `app`, matching the scaffold):

- `APP/not-found.tsx` — designed 404: headline + one line of help + link home (tokens: `--color-surface` bg, `--color-text`, spacing scale).
- `APP/error.tsx` — `'use client'` error boundary receiving `({ error, reset })` with a designed recovery state + reset button, same tokens.
- `APP/robots.ts` — default-allow + sitemap reference. Public sites: apply the AI-crawler split — block training bots (GPTBot, ClaudeBot, CCBot, Bytespider), allow retrieval bots (Claude-SearchBot, Claude-User, OAI-SearchBot, PerplexityBot) — see `wiki/web-dev/principles.md` § machine-discoverability.
- `APP/sitemap.ts` — routes from a `NEXT_PUBLIC_SITE_URL` base (localhost fallback + TODO for the real domain).

Then prove the baseline landed: `node ~/.claude/skills/impeccable/scripts/web-preflight.mjs` — a fresh scaffold + Steps 1a/1b must show **zero FAILs** (WARNs for og-image / `.impeccable.md` are expected until teach/craft run).

## Step 2 — Load your stack skills

Read these SKILL.md files for the session (do NOT skip):
1. `~/.claude/skills/frontend-design/SKILL.md` — animation, CSS patterns, visual quality
2. `~/.claude/skills/next-best-practices/SKILL.md` — RSC, data patterns, async APIs
3. `~/.claude/skills/tailwind-setup/SKILL.md` — Next.js 16 + Tailwind v4.3 setup, dark mode, v4.3 utilities
4. `~/.claude/skills/next-cache-components/SKILL.md` — only if the project will use PPR/Cache Components

Load on-demand based on project requirements:
- DB needed → `~/.claude/skills/drizzle-neon/SKILL.md` (Drizzle + Neon, pairs with Neon MCP)
- Auth needed → `~/.claude/skills/better-auth/SKILL.md` (Lucia successor; works with Drizzle adapter above)
- AI features needed → `~/.claude/skills/vercel-ai-sdk/SKILL.md` (AI SDK 7 with Anthropic provider)
- 3D / WebGL hero scene → `~/.claude/skills/threejs/SKILL.md` (R3F + Drei, SSR-safe pattern is non-obvious — load this)

Also activate from `skills/ACTIVE-DIRECTORY.md`: SK-005, SK-029, SK-030, SK-129, SK-130, SK-131. (v8.14: was "REGISTRY.md" + FS-002/020/021 — that file never existed and the FS ids are retired fullstack-dev rows.)

## Step 3 — Apply known lessons (auto-load from knowledge base)

Read `<your-vault-path>/wiki/engineering/{errors,failures,patterns,solutions}.md` and grep for tags matching: `#nextjs`, `#tailwind`, `#css`, `#framer-motion`, `#daisy-ui`, `#animation`, `#performance`, `#scroll`.

For every matching entry in `errors.md` or `failures.md`, read the entry body and apply the lesson proactively. Key known issues:

- **KNOWLEDGE-051**: `last:` pseudo-class trap with animation wrappers — don't use `last:mb-0` on individually-wrapped items
- **KNOWLEDGE-053**: Stale `.next` cache — kill node + trash the `.next` dir (`mv .next /c/tmp/trash/.next-$(date +%s)` — rm is hook-blocked) before rebuilding if dev server was running
- **KNOWLEDGE-054**: `backdrop-blur` on sticky/fixed elements causes scroll jank — use solid bg instead
- **KNOWLEDGE-055**: Framer Motion `whileInView` + `animate` conflict — use separate conditional JSX paths
- **KNOWLEDGE-069**: `next/dynamic` with `ssr: false` cannot be used in Server Components — wrap in client component
- **KNOWLEDGE-070**: Mouse-tracking animations (MagicCard style) cause scroll lag with 3+ instances
- **KNOWLEDGE-073**: Preview MCP headless browser doesn't fire IntersectionObserver — use fallback timers
- **DaisyUI v4 oklch channels**: use `oklch(var(--b2))` not `hsl(var(--b2))` (no canonical knowledge entry — record one if you hit this again)
- **KNOWLEDGE-032**: Remove `scroll-behavior: smooth` from html when using Framer Motion `whileInView`
- **KNOWLEDGE-040**: Add scroll-to-top on refresh via `history.scrollRestoration='manual'` in head
- **Tailwind v4.3 utilities available** (no plugin needed): `scrollbar-thin/none/thumb-*/track-*` for scrollbar styling, `@container-size` for size-based container queries, palettes `mauve`/`olive`/`mist`/`taupe` for warmer/cooler neutrals than the standard five.
- **Security floor**: any project on `next` < 16.2.6 has 13 unpatched CVEs from the May 2026 advisory (HTTP-proxy request smuggling, middleware/proxy bypass, Cache Components DoS). Upgrade BEFORE deploying to production. Use `next-upgrade` skill if currently older.

## Step 4 — Generate project CLAUDE.md

If no `./CLAUDE.md` exists:
1. Use a Next.js-appropriate CLAUDE.md template (App Router conventions, key scripts, RSC boundaries)
2. Generate `./CLAUDE.md` with project-specific conventions
3. Include the G-ERR/G-FAIL lessons as inline warnings

## Step 5 — Classify scope and execute

| Scope | Route |
|---|---|
| Landing page, portfolio, simple site | Just build it |
| Multi-page app with API routes | Brief plan → execute |
| Full SaaS with auth, DB, payments | Plan file in `plans/` → execute wave-by-wave |

## Step 6 — Quality gates (automatic, do not skip)

- Completeness: `node ~/.claude/skills/impeccable/scripts/web-preflight.mjs` exit 0 — include the receipt in the wrap-up (impeccable craft.md step 4c)
- TDD: write failing test before production code
- Security: run `sharp-edges` on changed files
- Visual QA: if the browser preview (`mcp__Claude_Browser__*`) is available, run screenshot → dark mode → mobile check
- Tests: run and confirm passing before claiming done

## Step 7 — Wrap up

- If changes exist, ask: "Commit now? [y/n]"
- Summarize what was built in 2-3 sentences

---

**Plain English triggers** (Claude recognizes these without the slash command):
"new website", "new web app", "new next app", "new nextjs", "build a site", "create a landing page", "new portfolio", "new frontend"
