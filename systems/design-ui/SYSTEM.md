---
id: SYS-DSGN
name: design-ui
title: Design & UI Craft System
domain: design
when_to_use: Visual/UX-heavy website work — landing pages, marketing sites, portfolios, brand-led UI where design quality IS the deliverable. Activate manually.
status: active
skills:
  - SK-102   # Impeccable — primary craft tool (craft/teach)
  - SK-005   # Frontend Design principles library
  - SK-133   # UI/UX Catalog — Layer-2 lookup (bans win)
  - SK-080   # Design Polish (pre-ship pass)
  - SK-127   # Design Check (pre-flight diff)
  - SK-034   # Web Interface Guidelines (fetch-fresh audit)
  - SK-042   # GSAP core
  - SK-044   # GSAP Advanced — ScrollTrigger/Flip/SplitText + SALA orchestration
  - SK-048   # Lenis Smooth Scroll — scroll-storytelling base layer
  - SK-047   # Motion v12 — spring-physics React interactions
  - SK-007   # Three.js (R3F) — only when 3D earns its place
  - SK-040   # Tailwind v4 @theme tokens
preferred_mcp: [lighthouse, Claude_Browser, Context7, MCP_DOCKER, vercel, shadcn, unsplash]
commands: [impeccable, new-web]
agents: []
rules: [RULES-GIT]
companions: []
---
# Design & UI Craft System

While this system is active:

- **Mockups are LOCAL; Claude Design is an OPTIONAL tool, never the default (revised 2026-07-23 — replaces the 07-22 "mandatory creation studio" rule).** New site or visual update → direction decided locally (costume tree, reference-sites, consultation), then build the exploration **here**: an **option board** per impeccable `reference/option-boards.md` — 3+ atomic variations on a stable-id board the user can point at ("more like 2a but with the serif from 1c"), opened in the preview pane. Reach for Claude Design only for the two things with no local equivalent: a shareable `claude.ai/design` link a human can comment on, or *Start from code* import. **If you do use it:** access is ONE account toggle — claude.ai/design/settings → *Claude product access* → On (or `/design consent`); it inherits the Claude session, there is no separate login, and **`/design-login` does not exist** — never tell the user to run it. `claude mcp get claude-design` reports `× Failed to connect` when consent is merely ungranted, so never read that as broken; confirm with a real call (`list_design_systems` is cheapest). Select **`ATLAS House Rules`** (built-ins never used); `compile-design-system.mjs --check` first — STALE means recompile + re-push via `DesignSync`. Output is a reference feeding the gate below, never shipped code.
- **The gates are non-negotiable; the route is Claude's.** Design reference exists → `/design-check` (SK-127) gate FIRST. Real design work normally builds through `/impeccable craft` — Claude's default call in this system, not a turnstile — and **never** raw generic styling. Before presenting → run the deterministic audit (`skills/impeccable/reference/audit-rules.md` grep sheet, zero hits) + `lighthouse` (a11y/SEO ≥ 90 for public sites). Pre-ship → `/design-polish` (SK-080).
- **Three-layer precedence**: impeccable's procedure (font ritual, absolute bans, bold direction) is supreme; the ui-ux-catalog (SK-133) supplies candidate palettes/pairings/styles as starting points only — any row with a reflex-banned font is rejected; the audit rules are the gate.
- **Real content always**: write actual copy from the brief before markup (impeccable reference/copywriting.md). Placeholder text at audit time = build failure.
- **Imagery**: run the decision tree in impeccable reference/imagery-and-assets.md; real attributed photography or deliberate no-imagery — never stock clichés or uncanny AI photos.
- **Motion**: gate every animation with motion-design.md § "Should this animate at all?". Scroll-driven motion (SK-044 ScrollTrigger) belongs on storytelling/marketing surfaces only, never product UI.
- **Component/icon sourcing — session connectors** (intentionally not in `preferred_mcp`; prefer when registered): 21st-dev magic (spend the 100 free credits/mo on hero/complex components), aceternity (animated sections), heroui (component docs), iconify (ONE icon family per project). An `unsplash` MCP is documented in INSTALLED.md (needs free API key) — use it for real photography when registered.
- **Screenshots**: Claude_Browser (preview pane) → playwright-cli skill → MCP_DOCKER browser tools (the design-check fallback chain).
- **Static art / posters**: use `anthropic-skills:canvas-design` (ecosystem symlink; the local duplicate was archived v8.14.0).
- New design knowledge: stamp `**Domain**: design` via /remember; a knowledge view unlocks once ≥5 entries exist.
