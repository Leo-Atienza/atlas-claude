# Active Skills Directory

> Lookup: scan this table → find the skill → note its Page → open that page for full details.
> Loading: read the relevant page on-demand, never all at start.
> Tiers: **Core** = weekly use, prioritize in suggestions. **Available** = on-demand when task matches.
> Total active skills: **53** (5 Core + 48 Available) — last updated 2026-07-20 (repo-integration round 3: +SK-146 css-keyframe-animations, +SK-147 svg-backgrounds, +SK-148 motion-principles, +SK-149 gsap-plugins, +SK-150 design-dna, +SK-151 threejs-imperative — see INSTALLED.md § round 3. Prior v10.0.0 inventory: 9 zero-evidence skills archived, SK-116 retiered, flow/hackathon command families bundled into `_archived/`).
> History: `skills/CHANGELOG.md` (append-only — adoption/archival receipts live there, never in this header).
>
> **Related metadata files:**
> - `skills/SYMLINKS.md` — symlinks pointing to `~/.agents/skills/` (Anthropic + community ecosystem)
> - `skills/archived-skills-manifest.json` — detection patterns for auto-offering archived skills (consumer: `hooks/archived-skill-offer.js`)
> - `skills/ARCHIVE-DIRECTORY.md` — domain-bundled archive of retired skills
> - `skills/CHANGELOG.md` — append-only adoption/archival history (split from this header, v10)
>
> **SK-116/117/120/123 note:** these 4 rows (TypeScript / SQL / API / PostgreSQL Experts) resolve into the vendored `skills/fullstack-dev/` bundle — page-documented reference docs (SK-117/120/123 are Read-targets for `/api-design` + `/db-schema`), **not Skill-tool-invocable** like the native top-level skills. The bundle's other four registry rows (SK-118 Next.js / SK-119 React / SK-121 Testing / SK-122 Debugging) were deprecated 2026-06-09 as stack-stale and eclipsed by native/symlinked skills — see ARCHIVE-DIRECTORY.md.

## Core Skills

| ID | Name | Purpose | Page |
|----|------|---------|------|
| SK-042 | GSAP Core Animation | Tweens, timelines, utilities, performance | 1 |
| SK-056 | Vitest Testing Framework | Fast unit testing + Testing Library + test pyramid | 1 |
| SK-115 | Code Review | Unified code review (local + PR) | 1 |
| SK-112 | Sharp Edges Scanner | API footguns, dangerous defaults, fail-open patterns | 1 |
| SK-113 | Differential Risk Review | Risk classification on diffs, attack scenarios | 1 |

## Available Skills

| ID | Name | Purpose | Page |
|----|------|---------|------|
| SK-005 | Frontend Design System | Production-grade frontend interfaces, animation, CSS | 1 |
| SK-116 | TypeScript Expert | Strict TypeScript reference doc (fullstack-dev bundle Read-target; retiered from Core 2026-07-20 — zero invocations, it is not Skill-tool-invocable) | 1 |
| SK-028 | Deploy to Vercel | Deploy apps/websites to Vercel | 2 |
| SK-029 | Next.js Best Practices | RSC, data patterns, async APIs, App Router conventions | 1 |
| SK-030 | Next.js Cache & PPR | Cache Components, PPR, use cache, cacheLife | 1 |
| SK-031 | Next.js Upgrade Guide | Step-by-step Next.js version migration | 1 |
| SK-034 | Web Interface Guidelines | Web design compliance review and interface quality checks | 1 |
| SK-129 | Vercel AI SDK 7 | generateText/Object, streamText/Object, Agent + tools (durable WorkflowAgent), useChat — Anthropic-first | 1 |
| SK-130 | Drizzle + Neon | SQL-first TypeScript ORM + Neon serverless Postgres for Next.js 16 (RSC-safe) | 1 |
| SK-131 | Better Auth | 2026 successor to Lucia — email/OAuth/2FA/passkeys, edge-native, Drizzle adapter | 1 |
| SK-007 | Three.js (R3F) | React Three Fiber + Drei in Next.js 16 — SSR-safe install, scene/loader/scroll recipes | 1 |
| SK-040 | Tailwind v4 Web Setup | Next.js 16 + Tailwind v4.3 setup (PostCSS, @theme, dark mode, v4.3 utilities) | 1 |
| SK-140 | Skill Vet | Discover (skills.sh) → adversarially vet (license/safety/non-redundancy, default-refute) → safely vendor external skills; scratch-dir-only clone rule + registration checklist for skills.sh sweeps | 2 |
| SK-144 | Claude Real Video | Watch/analyze a video → scene-aware deduped keyframes + transcript so the model can "see"/"read" it; local `crv` CLI (ffmpeg + faster-whisper), no API keys | 2 |
| SK-145 | Clone Website | Reverse-engineer/clone a live site section-by-section via browser MCP + parallel builder agents; outputs a Next.js 16 + shadcn + Tailwind v4 codebase (complements impeccable's original-design flow) | 1 |
| SK-080 | Design Polish | Final quality pass: 20-item checklist, ship-ready verification | 1 |
| SK-101 | Wiki Manager | Karpathy LLM Wiki for `Documents/Wiki/` — ingest, query, lint, evolve, scaffold | 2 |
| SK-102 | Impeccable (Craft) | Distinctive, production-grade frontend interfaces — craft/teach flow | 1 |
| SK-109 | Graphify (Mixed-Corpus) | Turn any folder → queryable knowledge graph (docs + papers + images + code) via `/graphify` | 2 |
| SK-110 | Handoff | End-of-session: build, test, commit, push, handoff doc via `/handoff` | 2 |
| SK-114 | Insecure Defaults Detector | Hardcoded secrets, weak defaults, fail-open detection | 1 |
| SK-117 | SQL Expert | SQL optimization, strategic indexes, query planning | 2 |
| SK-120 | API Designer | REST API design, OpenAPI 3.1, RFC 7807 error responses | 2 |
| SK-123 | PostgreSQL Expert | PostgreSQL optimization, administration, extensions | 2 |
| SK-134 | Tactile (Mobile Craft) | Distinctive, production-grade mobile/app UI — craft/teach flow; supersedes SK-126 and loads it as its principles library | `skills/tactile/SKILL.md` |
| SK-126 | Mobile App Design | iOS HIG + Material 3 + Stitch glassmorphism + RN translation pitfalls + 22-item review checklist for mobile screens (tactile's principles library) | `skills/mobile-app-design/SKILL.md` |
| SK-127 | Design Check (pre-flight) | Front-loaded visual diff before any UI code — captures gap list against Stitch/Figma/screenshot, requires sign-off before changes; Playwright fallback when the browser preview is degraded | `skills/design-check/SKILL.md` |
| SK-128 | Ship Verify | Verify-before-done for builds/deploys/tests/git/APK pipelines — never trusts UP-TO-DATE messages, checks artifact existence + size + mtime + sha | `skills/ship-verify/SKILL.md` |
| SK-135 | App Store Review | Apple App Store Review Guidelines preflight — scans Swift/ObjC/RN/Expo code for rejection patterns (IAP, privacy/ATT, UGC, private APIs) across all 5 guideline sections; run before EAS Submit / fastlane release | `skills/app-store-review/SKILL.md` |
| SK-136 | Fastlane Deploy | Native iOS/Android release via Fastlane — TestFlight, App Store submission, Match code signing, automated screenshots; for non-EAS / bare-RN / CI pipelines (iOS lanes need macOS) | `skills/fastlane/SKILL.md` |
| SK-137 | Upgrading React Native | Bare/ejected RN version bumps via Upgrade Helper template diffs — package.json deps, native iOS/Android config (CocoaPods, Gradle), breaking-API migration; for managed Expo prefer `upgrading-expo` | `skills/upgrading-react-native/SKILL.md` |
| SK-138 | RN Brownfield Migration | Embed React Native/Expo into an existing native iOS/Android app — incremental adoption, XCFramework/AAR packaging, phased host integration (bare + Expo tracks) | `skills/react-native-brownfield-migration/SKILL.md` |
| SK-139 | RN GitHub Actions CI | GitHub Actions patterns for RN iOS-simulator / Android-emulator cloud builds + artifact download via gh CLI/API; complements `expo-cicd-workflows` (EAS) and `fastlane` | `skills/github-actions/SKILL.md` |
| SK-142 | Self-Evolve | Capability-gap detection → autonomously create skills, add free MCP servers, or organize agent teams; auto-triggered meta capability wired into SYS-META (promoted from intentionally-unrowed, v8.14.0); step 0 checks INSTALLED.md § Parked capabilities (v8.20.0) | `skills/self-evolve/SKILL.md` |
| SK-143 | HyperFrames (HTML→Video) | First video capability: deterministic HTML/CSS/GSAP → MP4/WebM/alpha-overlay/deck rendering (headless Chrome + FFmpeg, zero keys, no GPU) — intent router that lazy-installs 11 workflow skills (promo, site tour, explainer, PR video, captions, motion graphics, lyric video, slideshow). ⚠ dir is upstream-CLI-managed: NEVER edit its SKILL.md; ATLAS vet + routing notes live in INSTALLED.md §v8.20.0 | `skills/hyperframes/SKILL.md` |
| SK-132 | PPTX → PDF | Faithful PowerPoint→PDF conversion — renders via PowerPoint COM (installed) / LibreOffice; single + batch, `--json`, `--self-test`; `/pptx-to-pdf` command | `skills/pptx-to-pdf/SKILL.md` |
| SK-044 | GSAP Advanced | ScrollTrigger scroll-driven animation + plugins (Flip, Draggable, SplitText) + React/Vue/Svelte integration — restored 2026-06-11 for storytelling-scroll archetypes | `skills/gsap-advanced/SKILL.md` |
| SK-133 | UI/UX Catalog | Searchable design-intelligence catalog (UI styles, industry palettes, font pairings, reasoning rules) — impeccable's lookup layer; bans always win | `skills/ui-ux-catalog/SKILL.md` |
| SK-048 | Lenis Smooth Scroll | 3KB MIT smooth momentum scroll — foundation of the scroll-storytelling stack; pairs with SK-044 via GSAP-ticker sync (restored 2026-06-11) | `skills/lenis-smooth-scroll/SKILL.md` |
| SK-047 | Motion Animation | Motion v12 (`motion/react`) — spring-physics React interactions: springs, layout/layoutId, AnimatePresence, gestures (restored 2026-06-11); + vanilla `animate()`/`scroll()`/`inView()` for non-React | `skills/motion-animation/SKILL.md` |
| SK-146 | CSS Keyframe Animations | The Animista CSS `@keyframes` catalog (50+ entrance/exit/attention/text micro-animations) — the CSS-first bottom rung of the motion ladder; emit before reaching for Motion/GSAP. BSD-2 | `skills/css-keyframe-animations/SKILL.md` |
| SK-147 | SVG Backgrounds | 15 Haikei-equivalent SVG background families (waves/blobs/blurry-gradient/low-poly/peaks/steps/scatters) as inline SVG + animated generative-canvas (particles/flow-fields/noise/L-systems) | `skills/svg-backgrounds/SKILL.md` |
| SK-148 | Motion Principles | Motion-director principles (personality archetypes, duration/easing tables, emotion→motion, stagger budgets) — the why/how-much planning layer above the mechanics (LottieFiles, MIT) | `skills/motion-principles/SKILL.md` |
| SK-149 | GSAP Plugins | Official GreenSock plugin catalog beyond SK-044 — ScrollSmoother/Observer/Inertia/MotionPath/CustomEase/Physics2D/GSDevTools/Pixi + advanced ScrollTrigger (MIT) | `skills/gsap-plugins/SKILL.md` |
| SK-150 | Design DNA | Extract a reference UI (image/URL) → portable 3-dimension profile (tokens + style + visual_effects taxonomy); extract-then-build complement to design-check (zanwei, MIT) | `skills/design-dna/SKILL.md` |
| SK-151 | Three.js (imperative) | Raw/vanilla Three.js + GLSL reference (10 topics) for hand-written WebGL outside R3F — lane distinct from SK-007. ⚠ license UNCONFIRMED, local reference only | `skills/threejs-imperative/SKILL.md` |
| — | Rules: Git | On-demand git workflow rules | `skills/RULES-GIT.md` |
| — | Rules: Security | On-demand security rules + triggers | `skills/RULES-SECURITY.md` |
| — | Rules: Testing | On-demand testing rules | `skills/RULES-TESTING.md` |
