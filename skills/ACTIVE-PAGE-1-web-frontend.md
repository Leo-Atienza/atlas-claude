# Active Skills — Page 1: Web, Frontend & Design

> These skills are always available. Load on-demand when a task matches their domain.

> **Stack target (verified 2026-05-15):** Next.js 16.2.6 LTS · React 19.2.6 · Tailwind CSS v4.3 · Vercel Pro

## Web Frameworks

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-029 | Next.js Best Practices | `skills/next-best-practices/SKILL.md` | RSC patterns, async APIs, App Router conventions, data fetching (targets v16) |
| SK-030 | Next.js Cache & PPR | `skills/next-cache-components/SKILL.md` | Cache Components, PPR, `use cache`, cacheLife/cacheTag (Next 16+) |
| SK-031 | Next.js Upgrade Guide | `skills/next-upgrade/SKILL.md` | Migration to v16.2.6 LTS, May 2026 security advisory, codemod set |
| SK-040 | Tailwind v4 Web Setup | `skills/tailwind-setup/SKILL.md` | Next.js 16 + Tailwind v4.3 (PostCSS, `@theme`, dark mode, scrollbars, `@container-size`, new palettes) |
| SK-034 | Web Interface Guidelines | `skills/web-design-guidelines/SKILL.md` | Web design compliance review and interface quality checks |
| SK-116 | TypeScript Expert | `skills/fullstack-dev/typescript-pro/SKILL.md` | Strict TypeScript, generics, conditional types, type safety patterns |
| SK-145 | Clone Website | `skills/clone-website/SKILL.md` | Reverse-engineer/clone a live site section-by-section: browser MCP extracts CSS/assets/behavior → parallel builder agents rebuild it as a Next.js 16 + shadcn + Tailwind v4 codebase. Complements impeccable (original design). Clone only sites you have the right to; never for impersonation. |

> For Expo / React Native Tailwind setup, use `expo-tailwind-setup` instead — that's a different skill ID and lives on Page 3 (native).

## Data / Auth / AI (full-stack additions, 2026-05-15)

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-129 | Vercel AI SDK 7 | `skills/vercel-ai-sdk/SKILL.md` | generateText/Object, streamText/Object, Agent abstraction with tool loops (v7: durable WorkflowAgent), useChat hook — Anthropic-first, provider-neutral |
| SK-130 | Drizzle + Neon | `skills/drizzle-neon/SKILL.md` | SQL-first TypeScript ORM (~60KB) + Neon serverless Postgres for Next.js 16 — RSC-safe queries, push vs migrate, ATLAS Neon MCP tools |
| SK-131 | Better Auth | `skills/better-auth/SKILL.md` | 2026 Lucia successor — email + OAuth + 2FA + passkeys + organizations, edge-native, Drizzle adapter |

## 3D / WebGL

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-007 | Three.js (R3F) | `skills/threejs/SKILL.md` | React Three Fiber 9 + Drei in Next.js 16 — verified SSR-safe install (`dynamic + ssr:false + 'use client'`), scene/GLTF/scroll recipes, perf defaults, common-bug table |

## Animation & Motion

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-005 | Frontend Design System | `skills/frontend-design/SKILL.md` | Production-grade frontend interfaces with animation, CSS, responsive design |
| SK-042 | GSAP Core Animation | `skills/gsap/SKILL.md` | Tweens, timelines, utilities, GSAP performance optimization |
| SK-044 | GSAP Advanced | `skills/gsap-advanced/SKILL.md` | ScrollTrigger scroll-driven animation, plugins (Flip, Draggable, SplitText), React/Vue/Svelte integration + SALA orchestration & canvas frame-scrub — restored 2026-06-11; use per impeccable reference/scroll-storytelling.md |
| SK-048 | Lenis Smooth Scroll | `skills/lenis-smooth-scroll/SKILL.md` | 3KB smooth momentum scroll, GSAP-ticker sync, ReactLenis — the scroll-storytelling base layer (restored 2026-06-11) |
| SK-047 | Motion Animation | `skills/motion-animation/SKILL.md` | Motion v12 (`motion/react`) spring-physics React interactions — springs, layout/layoutId, AnimatePresence, gestures; springs-vs-easing guidance in impeccable reference/animation-recipes.md (restored 2026-06-11) |

## Testing & Quality

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-056 | Vitest Testing Framework | `skills/vitest-testing/SKILL.md` | Fast unit testing + Testing Library + test pyramid patterns |
| SK-115 | Code Review | `skills/context-engineering-kit/code-review/` | Unified code review (sub-skills: review-local-changes/, review-pr/) |

## Design Intelligence & QA Pipeline

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-133 | UI/UX Catalog | `skills/ui-ux-catalog/SKILL.md` | Searchable catalog: UI styles, 161 industry palettes, 57 font pairings, product-category reasoning rules — impeccable's Layer-2 lookup; reflex-font bans always win (added 2026-06-11, vendored MIT) |
| SK-080 | Design Polish | `skills/design-polish/SKILL.md` | Final quality pass: 20-item checklist across alignment, typography, color, states, motion, code quality + audit-rules grep sheet |

> **Design QA workflow**: Build (real copy first) → audit-rules grep sheet (zero hits) → fix → `/polish` (final pass) → ship. The deterministic detector pass lives at `skills/impeccable/reference/audit-rules.md`. (Pre-v7.0.2 critique/audit stages were absorbed into `/polish` after `design-audit/` and `design-critique/` were archived.)

## Security (Always Active on PRs)

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-112 | Sharp Edges Scanner | `skills/trailofbits-security/plugins/sharp-edges/skills/sharp-edges/SKILL.md` | API footguns, dangerous defaults, fail-open patterns |
| SK-113 | Differential Risk Review | `skills/trailofbits-security/plugins/differential-review/skills/differential-review/SKILL.md` | Risk classification on diffs, attack scenario generation |
| SK-114 | Insecure Defaults Detector | `skills/trailofbits-security/plugins/insecure-defaults/skills/insecure-defaults/SKILL.md` | Hardcoded secrets, weak crypto defaults, fail-open detection |
