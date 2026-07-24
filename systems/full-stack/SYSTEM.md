---
id: SYS-WEB
name: full-stack
title: Full-Stack (Web) System
domain: web
when_to_use: Next.js / React / TS web apps, dashboards, landing pages, full-stack web features.
status: active
skills:
  - SK-029   # Next.js Best Practices
  - SK-030   # Next.js Cache & PPR
  - SK-031   # Next.js Upgrade
  - SK-040   # Tailwind v4 Web Setup
  - SK-034   # Web Interface Guidelines
  - SK-116   # TypeScript Expert (Read-target)
  - SK-129   # Vercel AI SDK 7
  - SK-130   # Drizzle + Neon
  - SK-131   # Better Auth
  - SK-007   # Three.js (R3F)
  - SK-005   # Frontend Design System
  - SK-042   # GSAP
  - SK-044   # GSAP Advanced (ScrollTrigger + SALA orchestration)
  - SK-048   # Lenis Smooth Scroll
  - SK-047   # Motion v12 (React spring interactions)
  - SK-133   # UI/UX Catalog (design lookup layer)
  - SK-056   # Vitest
  - SK-080   # Design Polish
  - SK-102   # Impeccable
  - SK-127   # Design Check (pre-flight)
  - SK-117   # SQL Expert (Read-target)
  - SK-120   # API Designer (Read-target)
  - SK-123   # PostgreSQL Expert (Read-target)
  - SK-028   # Deploy to Vercel
  - SK-115   # Code Review
  - SK-143   # HyperFrames (HTML→video rendering; dir is upstream-CLI-managed — see INSTALLED.md §v8.20.0)
preferred_mcp:
  - vercel
  - lighthouse
  - context-mode
  - code-review-graph
  - MCP_DOCKER
knowledge_domains: [web]
commands: [new-web]
agents: [security-sentinel]   # flow agents archived v10 — planning/execution use plan files + the Workflow tool; security review stays via the security-sentinel agent (compound-engineering, evidenced)
rules: [RULES-GIT, RULES-SECURITY, RULES-TESTING]
companions: [design-ui]
detect:
  detect_files:
    - next.config.js
    - next.config.ts
    - next.config.mjs
    - "app/**/page.tsx"
    - vercel.json
  detect_packages: [next, "@vercel/*", tailwindcss, drizzle-orm, better-auth]
  priority: 50
---
# Full-Stack (Web) System

**The chef model (user request, 2026-07-11; chef role clarified 2026-07-21).** **Claude is the chef** — the decider and orchestrator. This manifest is not an actor; it is the **loadout + checklist** the chef consults. The **brain** is `<your-vault-path>/wiki/web-dev/` (hub + 9 cortex pages + architecture): it is the chef's **main reference** — it *informs*, it does not drive. **Skills and plugins are ingredients; MCP servers and scripts are the knives** — tools on call, there when the chef needs them, silent when it doesn't. Nothing here plans the meal *for* Claude: Claude reads the brain, decides the menu, and reaches for whichever capabilities that menu actually needs.

**What Claude decides, and what is not negotiable.** Claude owns the **route** — the archetype, the costume, which skills/MCPs load, how deep the loop runs, what to skip. Claude does **not** own the **gates**: the correctness floor (audit BLOCKs, `web-preflight.mjs`, WCAG 2.2 AA + reduced-motion, lighthouse on public work, `/ship-verify` before any "done") stands regardless of route. Judgment governs the *shape* of the work; it never waives verification (CLAUDE.md § *Lazy-dev vs the gates*). Deciding the route is orchestration — skipping the gates is just shipping blind. A bugfix never enters the kitchen: the brain routes, the task decides ([[webdev-brain-routes-not-mandates]]).

## The chef's reference loop (Claude runs it by judgment — a bugfix/copy tweak skips straight to the work)

> These five steps are a **reference sequence, not a script to execute verbatim.** Claude decides how much of it a task earns: a public launch runs all five; a component tweak may run none of 1–3. What never scales away is step 4's gates on anything that ships.

0. **THE TWO DOORS — the user's plain words are the trigger (user request, 2026-07-22).** He says **"create a website"** → run the new-site procedure first (`commands/new-web.md`: scaffold + starter tokens + professional baseline + vendored contrast gate — Claude fires it on the ask; the slash is internal plumbing, never something the user types). He says **"upgrade/improve this website"** → read `.impeccable.md` + the cook-log, classify the ask (visual re-costume / feature / smoothness-perf), and retrofit any missing gate baseline proportionally (vendored `check-contrast.mjs` + manifest; copy sweeps; `templates/web-pro/` CI when a remote exists). Design DIRECTION is local either way — the costume decision tree, reference-sites, consultation (teach 2b). **Mockups are LOCAL; Claude Design is OPTIONAL (revised 2026-07-23 — replaces the 07-22 "mandatory creation studio" rule).** When the direction is still open or the user asks to see options, build an **option board** here per impeccable `reference/option-boards.md` — 3+ atomic variations on a stable-id board he can point at ("more like 2a but with the serif from 1c"), opened in the preview pane. Reach for Claude Design only for a shareable `claude.ai/design` link a human can comment on, or *Start from code* import — the two things with no local equivalent. **If you do use it:** access is ONE account toggle (claude.ai/design/settings → *Claude product access* → On, or `/design consent`); it inherits the Claude session, and **`/design-login` does not exist — never tell the user to run it.** `claude mcp get claude-design` reporting `× Failed to connect` means consent is ungranted, not broken; confirm with a real call (`list_design_systems`). Select **`ATLAS House Rules`** (built-ins never used), `compile-design-system.mjs --check` first — STALE → recompile + re-push via `DesignSync`. Output = reference → `design-check` → craft → gates. Then:
1. **PLAN from the brain — before loading any skill.** Hub `web-dev/web-dev-system.md` → the loadout row for this prompt's archetype in `capability-map.md` § Task Router → the stage sequence from `build-workflow.md` → pins/constraints from `stack.md` + `principles.md` → the last few `cook-log.md` entries (what got sent back last time). Style unfixed, no brand? Pick the costume now: `design-systems-reference.md` (brand register), `design-language-library.md` (13 complete looks + house-made, rendered proof in its gallery), or — brief wants *new/unlike-anything* — **synthesize one** via `design-synthesis.md` (dissect→recombine→prove; costlier, reach for it deliberately). Then **study 2-3 live exemplars for the chosen register in `reference-sites.md`** (decompose their moves — palette / type / layout / motion — adapt, never clone) and **commit the build to a one-sentence art-direction thesis, pushed past safe** (`principles.md` § *Commit to a point of view* — clearing the detectors is not a POV; real exemplars + a committed thesis are what separate "amazing" from "AI slop"). Emit the **menu** — ≤6 lines: deliverable(s), loadout (skills + MCPs), the thesis, gates, stop condition — then cook to it, nothing beyond it.
2. **MISE EN PLACE.** Design-led work without `.impeccable.md` → `/impeccable teach` first — which now includes the **design consultation** (teach Step 2b): the structured costume + theme question series the user answers before any new site (look source → mood → gallery-pick / register / synthesize / chef's-choice → theme with derived-recommendation-first). Its answers feed step 1's menu. Read `cache/knowledge-view-web.md` — errors + failures before patterns (CLAUDE.md rule).
3. **COOK — Claude calls the ingredients it needs.** UI craft normally routes through SK-102 `/impeccable craft` — the deepest procedure library and the default *when Claude judges this a real design build*; it is a tool Claude calls, not a turnstile it must pass through. Never raw generic styling either way. Framework: SK-029/030 (Next.js), SK-040 (Tailwind v4), SK-130 (Drizzle+Neon), SK-131 (Better Auth), SK-129 (AI SDK). Motion per the ladder: SK-042/044/047/048. Video deliverable → SK-143 hyperframes router. Design reference in hand → `/design-check` (SK-127) BEFORE code. The skills own their content — don't re-derive it.
4. **TASTE — the gates, per build-workflow.** audit-rules grep (zero BLOCK) → `web-preflight.mjs` exit 0 → `check-contrast.mjs` exit 0 (token-defining builds — every shipped pair computed, never asserted) → `extract-copy.mjs` + the fact-drift/tell-hunter pair (real-world-claims builds; impeccable `reference/copy-verification.md`) → lighthouse (≥90 public) → `verify-browsers.mjs` (3 engines) → `/ship-verify` (SK-128) before any "done". **Plus the positive gate:** does the page *express its one-sentence thesis* (state it — does it deliver?), not merely dodge tells — a clean-but-beige pass is a fail. Scale to surface: internal tool ≠ public launch.
5. **PLATE & LEARN.** Deliver with proof (screenshot / receipt / scores). Append the build to `web-dev/cook-log.md` (archetype, costume, gates, post-delivery edits when known — the user's after-edits are the highest-signal feedback). Genuinely new pattern or failure → `wiki/engineering/` KNOWLEDGE entry — the brain that plans the next build must include this one.

Standing preferences while active: `RULES-GIT` / `RULES-SECURITY` / `RULES-TESTING` for matching work. Preferred MCP (advisory — registration is global): vercel (deploys), lighthouse (perf), context-mode (token-efficient context), code-review-graph (impact), MCP_DOCKER gateway (Context7 docs, Neon, Playwright). Stack defaults: TypeScript, Next.js App Router, Tailwind v4, Drizzle + Neon, Vercel — verify versions via Context7 before coding. Brand-led / design-critical work → activate companion `design-ui` for the craft-pipeline digest.
