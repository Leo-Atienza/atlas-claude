# Knowledge Store — Page 1: Patterns (G-PAT)

> Reusable engineering patterns validated in production. Each entry includes what, why, how, and when to apply.

---

## G-PAT-001: Skill Over Source Patch
**Date**: 2026-02-27 | **Tags**: #skills #workflow #maintenance

Create skills/commands instead of editing third-party workflow files — survives updates. Never edit files inside third-party skill directories. Create a wrapper skill in your own namespace that extends the behavior, and use CLAUDE.md auto-activation to invoke it.

**Related**: G-PAT-003, G-PAT-004, G-PREF-005

---

## G-PAT-002: Language-Agnostic Hooks
**Date**: 2026-02-27 | **Tags**: #hooks #config #cross-platform

Detect project type before running formatters so hooks work across all projects:
```bash
(test -f pubspec.yaml && dart format . 2>/dev/null) || \
(test -f package.json && npm run format 2>/dev/null) || true
```
Check for marker files (`pubspec.yaml`, `package.json`, `Cargo.toml`), chain with `||`, always end with `|| true`.

---

## G-PAT-003: Auto-Activation via CLAUDE.md
**Date**: 2026-02-27 | **Tags**: #skills #automation #claude-md

Skills work best when triggered automatically via CLAUDE.md trigger tables, not explicit invocation. Match on observable context (file extensions, keywords, project markers). Skills should be idempotent — safe to activate when not strictly needed.

---

## G-PAT-004: Skill-Workflow Integration
**Date**: 2026-02-27 | **Tags**: #skills #documentation #flow

Skills that complement workflows should document: position statement ("runs after Phase X"), input/output contract, and file hierarchy placement relative to `.flow/`, `docs/`, etc.

---

## G-PAT-005: Systematic Visual QA Workflow
**Date**: 2026-03-08 | **Tags**: #qa #visual-testing #claude-preview #ui

Claude Preview MCP sequence for UI auditing:
1. `preview_start` → serve dev server
2. `preview_screenshot` → capture light state
3. `preview_eval` → switch to dark theme
4. `preview_screenshot` → capture dark state
5. `preview_resize({ preset: 'mobile' })` → 375x812
6. `preview_screenshot` → capture mobile
7. Repeat per page/component

Always check: hero, grid cards, nav, footer — most breakpoint-sensitive areas.

---

## G-PAT-007: Client Wrapper for next/dynamic ssr:false
**Date**: 2026-03-09 | **Tags**: #nextjs #dynamic-import #server-components #ssr

`next/dynamic` with `ssr:false` cannot be used directly in Server Components. Create a `'use client'` wrapper:
```tsx
'use client';
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('@/components/MyComponent'), { ssr: false, loading: () => <Fallback /> });
export default function ComponentWrapper() { return <Component />; }
```
Then import the wrapper in the Server Component.

**Related**: G-SOL-004, G-FAIL-002

---

## G-PAT-008: Stop Hook Pre-Commit Verification
**Date**: 2026-03-09 | **Tags**: #hooks #preview-mcp #qa #workflow

When Stop hook fires "[Preview Required]": `preview_start` → `preview_screenshot` each changed page → `preview_console_logs` → only then commit. Don't skip pages or ignore console errors.

---

## G-PAT-010: Magic UI Tailwind v3 Adaptation
**Date**: 2026-03-09 | **Tags**: #magic-ui #tailwind #framer-motion

Three changes needed: (1) `motion/react` → `framer-motion`, (2) `gap-(--gap)` → inline `style={{ gap: "var(--gap)" }}`, (3) container queries → CSS pseudo-element alternatives. Confirmed working: marquee, number-ticker, word-rotate, animated-gradient-text.

**Related**: G-FAIL-004

---

## G-PAT-011: Skill File Architecture
**Date**: 2026-03-10 | **Tags**: #skills #architecture #file-structure

Complex skills use 2-file pattern: auto-loaded `SKILL.md` (~350 lines) for principles/decisions + on-demand `references/` for code recipes. Split when a skill exceeds ~200 lines and not every invocation needs all content.

---

## G-PAT-012: Animation Tech Stack Decision Tree
**Date**: 2026-03-10 | **Tags**: #animation #css #framer-motion #gsap #lenis

Hierarchy (simplest → most powerful):
1. CSS transitions/animations → hover, reveals, shimmer
2. CSS `animation-timeline: scroll()` → off main thread scroll effects
3. CSS `@starting-style` → entry/exit without JS
4. Framer Motion → React orchestration, gestures, layout
5. GSAP (free since Apr 2025) → complex timelines, SplitText, MorphSVG
6. Lenis (2.13 KB) → smooth scroll baseline

Never reach for higher complexity when simpler works.

---

## G-PAT-013: IaC Generator-Validator Pair
**Date**: 2026-03-10 | **Tags**: #devops #iac #skills #validation

Every DevOps artifact gets two skills: generator creates it, validator checks it. Validators check syntax, security, best practices, misconfigurations. Never ship unvalidated IaC. 31 pairs cover Dockerfile, Terraform, K8s, Helm, GitHub Actions, Ansible, etc.

---

## G-PAT-014: API Route Security Boundary
**Date**: 2026-03-10 | **Tags**: #api #security #validation #backend

Validate all input at API route handlers, trust internal code. Validate: request body schema (Zod), path/query params, auth tokens, authorization, file uploads, rate limits. Do NOT add validation at every internal layer — that's maintenance burden and masks the real boundary.

---

## G-PAT-015: Database Migration Safety
**Date**: 2026-03-10 | **Tags**: #database #migrations #devops

Rules: (1) Every `up` must have working `down`, (2) `CREATE INDEX CONCURRENTLY`, (3) Column removal is two deploys (remove code first, then drop column), (4) Never rename columns — add new, backfill, migrate, drop old, (5) One logical change per migration, (6) No data transforms in schema migrations.

Red flags: `DROP TABLE` without backup, `NOT NULL` without default, `RENAME COLUMN`, multiple unrelated changes.

---

## G-PAT-016: CSS data-attribute Variant Theming
**Date**: 2026-03-11 | **Tags**: #css #data-attribute #theming #gradients #tailwind

Use `data-tone="web"` + CSS `[data-tone="web"] { ... }` for per-category gradients. Beats dynamic Tailwind classes (purged at build), inline styles (SSR issues), JS class switching (pre-hydration). Naming: `data-tone` for content categories, `data-variant` for UI variants, `data-status` for states.

---

## G-PAT-017: Sticky Header Layout Stability
**Date**: 2026-03-11 | **Tags**: #css #layout #header #performance #sticky

Never change header height on scroll — triggers layout recalc on every transition frame. Fix: fixed `h-16` inner container, `transition-[border-color,box-shadow]` instead of `transition-all`. Only animate `transform`, `opacity`, `border-color`, `box-shadow` on scroll-reactive elements. Never `height`, `font-size`, `padding`.

**Related**: G-ERR-009, G-SOL-005

---

## G-PAT-018: Web Accessibility Baseline Checklist
**Date**: 2026-03-15 | **Tags**: #accessibility #a11y #css

High-impact, low-effort items:
1. **Skip-to-content link** — `sr-only focus:not-sr-only` before header
2. **Touch delay elimination** — `touch-action: manipulation` AFTER `@tailwind utilities;`
3. **Form a11y** — `autoComplete`, `role="alert"` for errors, `role="status"` for success
4. **Keyboard overlays** — `role="button"`, `tabIndex`, `onKeyDown` for Enter/Space
5. **Decorative SVGs** — `aria-hidden="true"`
6. **Reduced motion** — `@media (prefers-reduced-motion: reduce)` block

---

## G-PAT-024: Slot-Based Shared Components
**Date**: 2026-04-04 | **Tags**: #react #components #architecture

When 3+ pages share layout structures, use slot-based component with `left`/`right`/`children` props instead of variant-based logic. Slot-based grows O(1), variant-based grows O(n) with each new page.

```tsx
interface SharedHeaderProps {
  position?: 'fixed' | 'sticky';
  left?: React.ReactNode;
  right?: React.ReactNode;
  mobileLinks?: React.ReactNode;
}
```

---

## G-PAT-025: Wave-Based Execution for Large Upgrades
**Date**: 2026-04-04 | **Tags**: #workflow #refactoring #agents

Organize large changes into dependency-ordered waves. Items within a wave are independent (parallelizable), but depend on previous waves. Delegate mechanical work (4+ files) to subagents, keep architectural work with primary agent. Verify after all waves: `tsc` + build + tests + grep. Don't organize by file type — organize by dependency.

---

## G-PAT-026: CSS Spring Approximation Without JS
**Date**: 2026-04-04 | **Tags**: #css #animation #springs

Spring presets via `cubic-bezier`:
- Snappy: `cubic-bezier(0.34, 1.56, 0.64, 1)` — buttons, chips
- Standard: `cubic-bezier(0.22, 1, 0.36, 1)` — cards, panels
- Bouncy: `cubic-bezier(0.68, -0.55, 0.27, 1.55)` — toggles

Stagger grids with 60ms intervals, cap at 8 items. Use CSS springs for simple entrance/exit; Motion/GSAP for layout animations and complex choreography.

---

## G-PAT-027: Verification-Before-Completion
**Date**: 2026-04-05 | **Tags**: #workflow #qa #agents

Always verify work actually succeeds before reporting done: run tests, check build, confirm behavior matches spec. Never trust "it should work." The subagent pattern makes this explicit — every task dispatch must include a verification step, and the dispatcher checks the result before marking complete. Apply this even without subagents: run the test, check the output, verify the file exists.

**Source**: obra/superpowers

---

## G-PAT-028: Bite-Sized Task Plans
**Date**: 2026-04-05 | **Tags**: #workflow #planning #agents

Break work into 2-5 minute tasks with: exact file paths, complete code specs, verification steps. Each task independently testable. This prevents context drift and makes it possible to delegate tasks to fresh subagents that have no prior context. The specificity is the point — vague tasks produce vague results.

**Source**: obra/superpowers (writing-plans)

---

## G-PAT-029: Token Optimization
**Date**: 2026-04-05 | **Tags**: #agents #performance #cost

Model selection by task complexity: Haiku for mechanical transforms (renames, formatting, boilerplate), Sonnet for integration work (multi-file changes with logic), Opus for architecture decisions and complex debugging. Prompt slimming: remove redundant context, don't paste entire files when a line range suffices. Background process management: use `run_in_background` for independent tasks, don't poll.

**Source**: Everything Claude Code (community patterns)

---

## G-PAT-030: Continuous Learning Loop
**Date**: 2026-04-05 | **Tags**: #workflow #knowledge #memory

After sessions: auto-extract patterns with confidence scoring (high/medium/low). Only persist high-confidence patterns that help future sessions. Skip routine work — most sessions don't produce novel knowledge. The bar: "Would knowing this have saved time if I'd known it at the start of this session?" If no, don't save it.

**Source**: Everything Claude Code (community patterns)

---

## G-PAT-031: Context Compression Strategy
**Date**: 2026-04-05 | **Tags**: #agents #context #performance

Sandbox tool output — don't dump raw results into context. Index with FTS5. Retrieve only relevant pieces via BM25 search. Progressive disclosure: summary first, details on demand. This is what Context Mode MCP implements: 98% context reduction by sandboxing tool outputs and restoring relevant context after compaction.

**Source**: Context Engineering (mksglu/context-mode)

---

## G-PAT-032: Skeleton Loading Generation
**Date**: 2026-04-05 | **Tags**: #frontend #loading #ux

Auto-generate skeleton screens from DOM snapshots: `getBoundingClientRect()` on visible elements → flat array of `{x, y, w, h, r}` bone objects → render as gray rectangles with pulse animation. Multi-breakpoint capture (375/768/1280px). This produces accurate content-shaped loading states instead of generic spinners. Works with any framework — the bone data is just JSON.

**Source**: Boneyard (amorim/boneyard)

---

## G-PAT-033: Single Animation Loop Architecture (SALA)
**Date**: 2026-04-07 | **Tags**: #animation #performance #gsap #architecture | **Confidence**: [HIGH]

When combining multiple animation libraries (GSAP, Lenis, Three.js/R3F, Anime.js), sync all to a single `requestAnimationFrame` via GSAP's ticker. Each library disables its own RAF: Lenis uses `autoRaf: false` + `lenis.raf(time * 1000)`, R3F uses `frameloop="never"` + `advance()`, Anime.js uses `tick()`. Result: zero clock drift between scroll position and animation progress, single 16ms frame budget.

```typescript
gsap.ticker.add((time) => lenis.raf(time * 1000));  // Lenis
gsap.ticker.add(() => r3fAdvance(performance.now() / 1000));  // R3F
gsap.ticker.lagSmoothing(0);  // Critical for smooth scroll
```

**When to apply**: Any project using 2+ animation tools that share visual timing. Skip for single-library projects.

**Source**: Cinematic Web Engine (SK-096)

---

## G-PAT-034: Layer Ownership Model
**Date**: 2026-04-07 | **Tags**: #animation #architecture #conflicts | **Confidence**: [HIGH]

When multiple animation libraries coexist, assign each DOM element to exactly one animation tool. Both GSAP and Motion write to `element.style` — letting two tools animate the same property causes jitter. Assign ownership by layer: L5=3D (Three.js), L4=scroll choreography (GSAP+ScrollTrigger), L3=batch reveals (Anime.js), L2=React component animation (Motion), L1=CSS-native (zero JS), L0=page transitions. If a conflict is unavoidable, use `gsap.set(el, { clearProps: 'all' })` before transferring ownership.

**When to apply**: Any page mixing GSAP + Motion/Framer Motion, or any project with 3+ animation tools.

**Source**: Cinematic Web Engine (SK-096)

---

## G-PAT-035: Motion Token System
**Date**: 2026-04-07 | **Tags**: #animation #design-system #easing | **Confidence**: [MEDIUM]

Define 4 semantic motion tokens (snappy/standard/gentle/cinematic) with equivalent values across all animation tools. Example: `snappy` = GSAP `duration: 0.3, ease: 'back.out(1.4)'` = Motion `stiffness: 400, damping: 30` = CSS `cubic-bezier(0.34, 1.56, 0.64, 1)`. This ensures visual consistency when different components use different libraries. Store in a shared `springs.ts`/`motion-tokens.ts` file.

**When to apply**: Multi-library animation projects where visual consistency across tool boundaries matters.

**Source**: Cinematic Web Engine (SK-096)

---

## G-PAT-036: Tailwind CSS v4 Custom Properties via @theme inline
**Date**: 2026-04-12 | **Tags**: #tailwind #css #custom-properties #nextjs

Tailwind CSS v4 removed `tailwind.config.ts` extend for custom theme values. Instead, define custom properties directly in CSS using `@theme inline`:
```css
@theme inline {
  --color-accent: oklch(0.65 0.18 15);
  --font-heading: 'Playfair Display', serif;
  --spacing-section: 5rem;
}
```
These become Tailwind utility classes automatically: `text-accent`, `font-heading`, `py-section`. The `inline` keyword makes them cascade with the rest of CSS. Do NOT import/configure these in a JS config file — it no longer applies in v4.

**When to apply**: Any project using Tailwind CSS v4 that needs custom colors, fonts, or spacing tokens.

---

## G-PAT-037: Observability over Audit
**Date**: 2026-04-24 | **Tags**: #observability #telemetry #systems #atlas #v7 | **Confidence**: [HIGH]

Build the consumer before you instrument. ATLAS v6.x added five telemetry streams — `tool-health.json`, `safety-hook-counts.json`, `action-graph-stats.jsonl`, `cleanup.jsonl`, and a placeholder for skill usage — but nothing read them. Drift was caught only when a human ran a manual ULTRATHINK audit. v7.0 inverted the loop: added a single reader (`scripts/observability.js` → `/observe`) that renders the streams as a 6-section dashboard, plus a self-surfacing layer (`drift-proposer.js`) that emits at most one DRIFT advisory per session when thresholds cross. Result: the system proposes fixes instead of waiting to be audited.

**The rule:** every telemetry write must have a named consumer before it ships. If you're emitting `foo.jsonl` and no dashboard, alert, or scheduled job reads it, you're building debt, not observability. The logs are free; the discipline is naming the reader up front.

**Corollary for drift proposers:** cap noise aggressively — per-session max, per-kind cooldown, silencable kinds. A noisy proposer is worse than none, because users learn to ignore it.

**When to apply**: any long-running system (hooks, scheduled jobs, agent pipelines) where state drifts faster than humans can audit manually. Dashboards + self-surfacing beats periodic audits.

**Related**: G-PAT-027 (Verification-Before-Completion), G-PAT-025 (Wave-Based Execution)
**Source**: ATLAS v7.0 Consolidation & Observability release (2026-04-24)
