---
name: impeccable
description: the user's primary skill for building or beautifying any web UI — web components, pages, artifacts, posters, landing pages, dashboards, or full apps. Produces distinctive, production-grade code that avoids generic AI aesthetics, grounded in project context first. Prefer this over the raw frontend-design skill (SK-005) for any actual build — impeccable supersedes it and loads it as its principles library. Call with 'craft' for the full shape-then-build flow, or 'teach' to set up design context.
user-invocable: true
argument-hint: "[craft|teach]"
license: Apache 2.0. Based on Anthropic's frontend-design skill. See NOTICE.md for attribution.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Context Gathering Protocol

Design skills produce generic output without project context. You MUST have confirmed design context before doing any design work.

**Required context** (every design skill needs at minimum):
- **Target audience**: Who uses this product and in what context?
- **Use cases**: What jobs are they trying to get done?
- **Brand personality/tone**: How should the interface feel?

Individual skills may require additional context. Check the skill's preparation section for specifics.

**CRITICAL**: You cannot infer this context by reading the codebase. Code tells you what was built, not who it's for or what it should feel like. Only the creator can provide this context.

**Gathering order:**
1. **Check current instructions (instant)**: If your loaded instructions already contain a **Design Context** section, proceed immediately.
2. **Check .impeccable.md (fast)**: If not in instructions, read `.impeccable.md` from the project root. If it exists and contains the required context, proceed.
3. **Run impeccable teach (REQUIRED)**: If neither source has context, you MUST run /impeccable teach NOW before doing anything else. Do NOT skip this step. Do NOT attempt to infer context from the codebase instead.

---

## Design Direction

Commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work. The key is intentionality, not intensity.

**The one exception — exploration.** When the direction is genuinely still open, or the user asked to see options, there is a second mode: build 3+ atomic variations meant to be *recombined* rather than judged, on a stable-id board the user can point at. See [option-boards.md](reference/option-boards.md). It is scaffolding with an exit condition — once a direction is picked, record it and return to commit-to-one above.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Typography
→ *Consult [typography reference](reference/typography.md) for OpenType features, web font loading, and the deeper material on scales.*

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font.

<typography_principles>
Always apply these — do not consult a reference, just do them:

- Use a modular type scale with fluid sizing (clamp) for headings on marketing/content pages. Use fixed `rem` scales for app UIs and dashboards (no major design system uses fluid type in product UI).
- Use fewer sizes with more contrast. A 5-step scale with at least a 1.25 ratio between steps creates clearer hierarchy than 8 sizes that are 1.1× apart.
- Line-height scales inversely with line length. Narrow columns want tighter leading, wide columns want more. For light text on dark backgrounds, ADD 0.05-0.1 to your normal line-height — light type reads as lighter weight and needs more breathing room.
- Cap line length at ~65-75ch. Body text wider than that is fatiguing.
</typography_principles>

<font_selection_procedure>
DO THIS BEFORE TYPING ANY FONT NAME.

The model's natural failure mode is "I was told not to use Inter, so I will pick my next favorite font, which becomes the new monoculture." Avoid this by performing the following procedure on every project, in order:

Step 1. Read the brief once. Write down 3 concrete words for the brand voice (e.g., "warm and mechanical and opinionated", "calm and clinical and careful", "fast and dense and unimpressed", "handmade and a little weird"). NOT "modern" or "elegant" — those are dead categories.

Step 2. List the 3 fonts you would normally reach for given those words. Write them down. They are most likely from this list:

<reflex_fonts_to_reject>
Fraunces
Newsreader
Lora
Crimson
Crimson Pro
Crimson Text
Playfair Display
Cormorant
Cormorant Garamond
Syne
IBM Plex Mono
IBM Plex Sans
IBM Plex Serif
Space Mono
Space Grotesk
Inter
DM Sans
DM Serif Display
DM Serif Text
Outfit
Plus Jakarta Sans
Instrument Sans
Instrument Serif
</reflex_fonts_to_reject>

Reject every font that appears in the reflex_fonts_to_reject list. They are your training-data defaults and they create monoculture across projects. **Syne in particular is the most overused "distinctive" display font and is an instant AI design tell. Never use it.**

**Exception — an established brand system (2026-07-21).** This list targets *your reflex*, not a deliberate identity. When a listed face is already the documented type of a **named, established brand system the user owns or the client brings** — that choice **stands**, and you match it rather than "correcting" it. The test is **provenance, not the name**: a face is exempt when it was deliberately chosen and recorded in a brand system; it stays banned when you reached for it because it came to mind first. Never silently repaint an existing brand to satisfy this list. If you believe an established face is genuinely wrong for the work, say so and let the user decide. (The original example — the user's Atelier Design System in Claude Design — was deleted 2026-07-22; the principle stands for real client brands.)

Step 3. Browse a font catalog with the 3 brand words in mind. Sources: Google Fonts, Pangram Pangram, Future Fonts, Adobe Fonts, ABC Dinamo, Klim Type Foundry, Velvetyne. The ui-ux-catalog skill (SK-133) holds 57 searchable font pairings — a valid candidate source, but every returned row is subject to this procedure: any pairing containing a reflex_fonts_to_reject font is rejected outright, and the final pick must still pass Step 4. Look for something that fits the brand as a *physical object* — a museum exhibit caption, a hand-painted shop sign, a 1970s mainframe terminal manual, a fabric label on the inside of a coat, a children's book printed on cheap newsprint. Reject the first thing that "looks designy" — that's the trained reflex too. Keep looking.

Step 4. Cross-check the result. The right font for an "elegant" brief is NOT necessarily a serif. The right font for a "technical" brief is NOT necessarily a sans-serif. The right font for a "warm" brief is NOT Fraunces. If your final pick lines up with your reflex pattern, go back to Step 3.
</font_selection_procedure>

<typography_rules>
DO use a modular type scale with fluid sizing (clamp) on headings.
DO vary font weights and sizes to create clear visual hierarchy.
DO vary your font choices across projects. If you used a serif display font on the last project, look for a sans, monospace, or display face on this one.

DO NOT use overused fonts like Inter, Roboto, Arial, Open Sans, or system defaults — but also do not simply switch to your second-favorite. Every font in the reflex_fonts_to_reject list above is banned. Look further.
DO NOT use Syne. Ever. It is an instant AI design tell.
DO NOT use monospace typography as lazy shorthand for "technical/developer" vibes.
DO NOT put large icons with rounded corners above every heading. They rarely add value and make sites look templated.
DO NOT use only one font family for the entire page. Pair a distinctive display font with a refined body font.
DO NOT use a flat type hierarchy where sizes are too close together. Aim for at least a 1.25 ratio between steps.
DO NOT set long body passages in uppercase. Reserve all-caps for short labels and headings.
</typography_rules>

### Color & Theme
→ *Consult [color reference](reference/color-and-contrast.md) for the deeper material on contrast, accessibility, and palette construction.*

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. For industry-specific palette candidates, query the ui-ux-catalog skill (SK-133) — catalog rows are starting points only: adapt hexes into OKLCH and tint per the color reference; never paste a catalog palette raw.

<color_principles>
Always apply these — do not consult a reference, just do them:

- Use OKLCH, not HSL. OKLCH is perceptually uniform: equal steps in lightness *look* equal, which HSL does not deliver. As you move toward white or black, REDUCE chroma — high chroma at extreme lightness looks garish. A light blue at 85% lightness wants ~0.08 chroma, not the 0.15 of your base color.
- Tint your neutrals toward your brand hue. Even a chroma of 0.005-0.01 is perceptible and creates subconscious cohesion between brand color and UI surfaces. The hue you tint toward should come from THIS brand, not from a "warm = friendly" or "cool = tech" formula. Pick the brand's actual hue first, then tint everything toward it.
- The 60-30-10 rule is about visual *weight*, not pixel count. 60% neutral / surface, 30% secondary text and borders, 10% accent. Accents work BECAUSE they're rare. Overuse kills their power.
- When a palette carries more than one accent, hold chroma and lightness CONSTANT and vary only hue. Accents that share a chroma/lightness pair read as one family; accents that drift on all three axes read as unrelated stickers dropped on the same page.
</color_principles>

<theme_selection>
Theme (light vs dark) should be DERIVED from audience and viewing context, not picked from a default. Read the brief and ask: when is this product used, by whom, in what physical setting?

- A perp DEX consumed during fast trading sessions → dark
- A hospital portal consumed by anxious patients on phones late at night → light
- A children's reading app → light
- A vintage motorcycle forum where users sit in their garage at 9pm → dark
- An observability dashboard for SREs in a dark office → dark
- A wedding planning checklist for couples on a Sunday morning → light
- A music player app for headphone listening at night → dark
- A food magazine homepage browsed during a coffee break → light

Do not default everything to light "to play it safe." Do not default everything to dark "to look cool." Both defaults are the lazy reflex. The correct theme is the one the actual user wants in their actual context.
</theme_selection>

<color_rules>
DO use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes.
DO tint your neutrals toward your brand hue. Even a subtle hint creates subconscious cohesion.

DO NOT use gray text on colored backgrounds; it looks washed out. Use a shade of the background color instead.
DO NOT use pure black (#000) or pure white (#fff). Always tint; pure black/white never appears in nature.
DO NOT use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds.
DO NOT use gradient text for impact — see <absolute_bans> below for the strict definition. Solid colors only for text.
DO NOT default to dark mode with glowing accents. It looks "cool" without requiring actual design decisions.
DO NOT default to light mode "to be safe" either. The point is to choose, not to retreat to a safe option.
</color_rules>

### Layout & Space
→ *Consult [spatial reference](reference/spatial-design.md) for the deeper material on grids, container queries, and optical adjustments.*
→ *Consult [layout archetypes](reference/layout-archetypes.md) when choosing page structure — proven skeletons with their premium-vs-slop tells. Pick one, commit, break it deliberately in one place.*

Create visual rhythm through varied spacing, not the same padding everywhere. Embrace asymmetry and unexpected compositions. Break the grid intentionally for emphasis.

<spatial_principles>
Always apply these — do not consult a reference, just do them:

- Use a 4pt spacing scale with semantic token names (`--space-sm`, `--space-md`), not pixel-named (`--spacing-8`). Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. 8pt is too coarse — you'll often want 12px between two values.
- Use `gap` instead of margins for sibling spacing. It eliminates margin collapse and the cleanup hacks that come with it.
- Vary spacing for hierarchy. A heading with extra space above it reads as more important — make use of that. Don't apply the same padding everywhere.
- Self-adjusting grid pattern: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` is the breakpoint-free responsive grid for card-style content.
- Container queries are for components, viewport queries are for page layout. A card in a sidebar should adapt to the sidebar's width, not the viewport's.
</spatial_principles>

<spatial_rules>
DO create visual rhythm through varied spacing: tight groupings, generous separations.
DO use fluid spacing with clamp() that breathes on larger screens.
DO use asymmetry and unexpected compositions; break the grid intentionally for emphasis.

DO NOT wrap everything in cards. Not everything needs a container.
DO NOT nest cards inside cards. Visual noise; flatten the hierarchy.
DO NOT use identical card grids (same-sized cards with icon + heading + text, repeated endlessly).
DO NOT use the hero metric layout template (big number, small label, supporting stats, gradient accent).
DO NOT center everything. Left-aligned text with asymmetric layouts feels more designed.
DO NOT use the same spacing everywhere. Without rhythm, layouts feel monotonous.
DO NOT let body text wrap beyond ~80 characters per line. Add a max-width like 65–75ch so the eye can track easily.
</spatial_rules>

### Visual Details

<absolute_bans>
These CSS patterns are NEVER acceptable. They are the most recognizable AI design tells. Match-and-refuse: if you find yourself about to write any of these, stop and rewrite the element with a different structure entirely.

BAN 1: Side-stripe borders on cards/list items/callouts/alerts
  - PATTERN: `border-left:` or `border-right:` with width greater than 1px
  - INCLUDES: hard-coded colors AND CSS variables
  - FORBIDDEN: `border-left: 3px solid red`, `border-left: 4px solid #ff0000`, `border-left: 4px solid var(--color-warning)`, `border-left: 5px solid oklch(...)`, etc.
  - WHY: this is the single most overused "design touch" in admin, dashboard, and medical UIs. It never looks intentional regardless of color, radius, opacity, or whether the variable name is "primary" or "warning" or "accent."
  - REWRITE: use a different element structure entirely. Do not just swap to box-shadow inset. Reach for full borders, background tints, leading numbers/icons, or no visual indicator at all.

BAN 2: Gradient text
  - PATTERN: `background-clip: text` (or `-webkit-background-clip: text`) combined with a gradient background
  - FORBIDDEN: any combination that makes text fill come from a `linear-gradient`, `radial-gradient`, or `conic-gradient`
  - WHY: gradient text is decorative rather than meaningful and is one of the top three AI design tells
  - REWRITE: use a single solid color for text. If you want emphasis, use weight or size, not gradient fill.
</absolute_bans>

DO: Use intentional, purposeful decorative elements that reinforce brand.
DO NOT: Use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, callouts, or alerts. See <absolute_bans> above for the strict CSS pattern.
DO NOT: Use glassmorphism everywhere (blur effects, glass cards, glow borders used decoratively rather than purposefully). ONE purposeful refracting glass surface over real content is a deliberate focal effect — see [signature effects](reference/signature-effects.md). The ban is on glass-as-default-decoration, not on the technique existing.
DO NOT: Use sparklines as decoration. Tiny charts that look sophisticated but convey nothing meaningful.
DO NOT: Use rounded rectangles with generic drop shadows. Safe, forgettable, could be any AI output.
DO NOT: Use modals unless there's truly no better alternative. Modals are lazy.

The deterministic version of every visual check lives in [audit rules](reference/audit-rules.md) — 47 detector rules with a copy-pasteable grep sheet. Run it before presenting any build. Its completeness sibling is `scripts/web-preflight.mjs` — what a professional site must *have* (404/error/loading states, favicon set, metadata + lang, robots/sitemap/OG, real font strategy, no placeholder copy, Next security floor); run per [craft flow](reference/craft.md) step 4c, exit 0 before presenting. Two more gates with persisted engines: `scripts/check-contrast.mjs` computes every shipped ink/ground pair from the real tokens (hex/rgb/hsl/oklch/`light-dark()`, banned-pairs list — a spec *claiming* AA is worth nothing), and `scripts/extract-copy.mjs` + [copy verification](reference/copy-verification.md) run the fact-drift/tell-hunter pair over the BUILT output for any build carrying real-world claims.

### Motion
→ *Consult [motion reference](reference/motion-design.md) for timing, easing, reduced motion, and the motion-personality map.*
→ *Consult [animation recipes](reference/animation-recipes.md) for page-load choreography, the micro-interaction pattern library, springs vs easing, View Transitions, and the 60fps smoothness checklist.*

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Derive the motion personality from the same 3 brand words as the font procedure — mixed motion personalities on one page read as slop.

**DO**: Use motion to convey state changes: entrances, exits, feedback
**DO**: Use exponential easing (ease-out-quart/quint/expo) for natural deceleration
**DO**: For height animations, use grid-template-rows transitions instead of animating height directly
**DON'T**: Animate layout properties (width, height, padding, margin). Use transform and opacity only
**DON'T**: Use bounce or elastic easing. They feel dated and tacky; real objects decelerate smoothly

### Signature Effects
→ *Consult [signature effects reference](reference/signature-effects.md) for shader gradients, liquid-metal logos, liquid glass, and 3D — verified install commands, turnkey SSR-safe recipes, decision-gates, and per-library licenses.*

The premium layer that takes a build from "clean" to "crafted": an animated shader gradient breathing behind the hero (paper `MeshGradient` or `@shadergradient/react`), a liquid-metal wordmark (`LiquidMetal`), a single refracting glass panel (`liquid-glass-react`), or a real 3D scene (threejs, SK-007). They are scalpels, not paint — same restraint as the motion gate above.

**DO**: Reach for one when the brief wants a hero / landing / launch surface to feel distinctive — and place exactly ONE signature moment per page, on the highest-intent surface.
**DO**: Derive every shader's colors from the brand palette and run it slow (`speed` 0.1–0.2). The packages' default palettes ARE the banned AI rainbow; their default speeds read as screensavers.
**DON'T**: Stack effects, ship a default palette, animate behind body text, or skip the `prefers-reduced-motion` still frame. Decoration-everywhere is exactly the slop these would otherwise become.

### Interaction
→ *Consult [interaction reference](reference/interaction-design.md) for forms, focus, and loading patterns.*

Make interactions feel fast. Use optimistic UI: update immediately, sync later.

**DO**: Use progressive disclosure. Start simple, reveal sophistication through interaction (basic options first, advanced behind expandable sections; hover states that reveal secondary actions)
**DO**: Design empty states that teach the interface, not just say "nothing here"
**DO**: Make every interactive surface feel intentional and responsive
**DON'T**: Repeat the same information (redundant headers, intros that restate the heading)
**DON'T**: Make every button primary. Use ghost buttons, text links, secondary styles; hierarchy matters

### Responsive
→ *Consult [responsive reference](reference/responsive-design.md) for mobile-first, fluid design, and container queries.*

**DO**: Use container queries (@container) for component-level responsiveness
**DO**: Adapt the interface for different contexts, not just shrink it
**DON'T**: Hide critical functionality on mobile. Adapt the interface, don't amputate it

### UX Writing
→ *Consult [ux-writing reference](reference/ux-writing.md) for labels, errors, and empty states.*

**DO**: Make every word earn its place
**DON'T**: Repeat information users can already see

### Marketing Copy
→ *Consult [copywriting reference](reference/copywriting.md) for persuasive page copy — distinct from UX Writing above. Homepage/landing/pricing copy templates, CTA formulas, the Seven Sweeps editing loop.*

**DO**: Write the actual copy from the brief BEFORE building layout. Real copy shapes structure; placeholder copy produces placeholder design.
**DON'T**: Ship weasel words ("seamless", "empower", "unlock") or lorem ipsum — placeholder text found at audit is a build failure.

### Imagery & Assets
→ *Consult [imagery reference](reference/imagery-and-assets.md) for the photography/illustration/3D/none decision tree, free sourcing with attribution, color-grading toward brand hue, and the OG-image recipe.*

**DO**: Run the imagery decision tree before sourcing anything; deliberately-no-imagery is a valid answer.
**DON'T**: Use generic stock clichés or uncanny AI-generated photos — they are instant slop tells.

### SEO & Meta
→ *Consult [seo-and-meta reference](reference/seo-and-meta.md) for head conventions, Open Graph/Twitter cards, JSON-LD templates, and crawlability — any public-facing site needs these to look finished.*

**DO**: Ship real OG images, favicons, titles, and structured data — a site with default meta looks machine-generated in every link preview.

---

## The AI Slop Test

**Critical quality check**: If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

Review the DON'T guidelines above. They are the fingerprints of AI-generated work from 2024-2025.

Then run the deterministic pass: the [audit rules](reference/audit-rules.md) grep sheet. Zero detector hits are required before presenting any build.

---

## Implementation Principles

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

Build with real content from the very first pass: never lorem ipsum, never `[placeholder]`. If the brief lacks copy, write it (see reference/copywriting.md) before writing markup — placeholder text found at audit time is a build failure, not a TODO.

Remember: Claude is capable of extraordinary creative work. Don't hold back. Show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## Craft Mode

If this skill is invoked with the argument "craft" (e.g., `/impeccable craft [feature description]`), follow the [craft flow](reference/craft.md). Pass any additional arguments as the feature description.

---

## Teach Mode

If this skill is invoked with the argument "teach" (e.g., `/impeccable teach`), skip all design work above and instead run the teach flow below. This is a one-time setup that gathers design context for the project.

### Step 1: Explore the Codebase

Before asking questions, thoroughly scan the project to discover what you can:

- **README and docs**: Project purpose, target audience, any stated goals
- **Package.json / config files**: Tech stack, dependencies, existing design libraries
- **Existing components**: Current design patterns, spacing, typography in use
- **Brand assets**: Logos, favicons, color values already defined
- **Design tokens / CSS variables**: Existing color palettes, font stacks, spacing scales
- **Any style guides or brand documentation**

Note what you've learned and what remains unclear.

### Step 2: Ask UX-Focused Questions

STOP and call the AskUserQuestion tool to clarify. Focus only on what you couldn't infer from the codebase:

#### Users & Purpose
- Who uses this? What's their context when using it?
- What job are they trying to get done?
- What emotions should the interface evoke? (confidence, delight, calm, urgency, etc.)

#### Brand & Personality
- How would you describe the brand personality in 3 words?
- Any reference sites or apps that capture the right feel? What specifically about them?
- What should this explicitly NOT look like? Any anti-references?

#### Aesthetic Preferences
- Any strong preferences for visual direction? (minimal, bold, elegant, playful, technical, organic, etc.)
- Light mode, dark mode, or both?
- Any colors that must be used or avoided?

#### Accessibility & Inclusion
- Specific accessibility requirements? (WCAG level, known user needs)
- Considerations for reduced motion, color blindness, or other accommodations?

Skip questions where the answer is already clear from the codebase exploration.

### Step 2b: The Design Consultation (costume + theme — ALWAYS run for a new site)

> the user's standing feature request (2026-07-11): before any website gets built, ask him a structured series of questions about the design and theme. This consultation IS that feature. It runs whenever teach runs on a design-led build (which the Context Gathering Protocol already makes unskippable when no `.impeccable.md` exists). In a **non-interactive/auto session**, degrade gracefully: derive each answer from the brief, STATE the derivations prominently in the deliverable, and mark `.impeccable.md` fields `derived, unconfirmed`.

**Round 1 — one AskUserQuestion call, four questions:**

1. **Look source** — "Does this site already have a look to honor?" Options: *Open — design something for it* · *Match an existing brand/reference (I'll share it)* · *Feel like another site (name it)* · *Redesign — keep the soul, change the costume*.
2. **Mood / register** — "What should it feel like at first glance?" Derive 4 options from the brief where possible; default set maps to the brain's families: *Calm editorial* (warm paper, serif authority — library cluster A) · *Bold graphic* (posters, borders, loud type — clusters B/C) · *Playful warm* (candy, pills, stickers — capsule/daisy family) · *Corporate restrained* (one accent, quiet surfaces — cluster D / register table).
3. **Costume depth** — "How should we land the look?" Options: *Pick from the gallery (show me real candidates)* · *Calibrate to a real brand's register* (`design-systems-reference` — Apple/HubSpot-class feel) · *Invent something new* (`design-synthesis` — dissect→recombine→prove; costlier, most distinctive) · *Chef's choice — decide and show me*.
4. **Theme** — light / dark / both. **Derive the recommendation first** from audience + viewing context (per `<theme_selection>` — never a lazy default) and make it option 1 "(Recommended)" with the reasoning in its description. the user's explicit answer wins over the derivation.

**Round 2 — conditional, one more call:**

- *Picked "gallery"* → present **2–4 named candidates** filtered by the mood answer, each option = language name + its "pick when" line; tell him the rendered gallery is viewable at `wiki/web-dev/assets/design-language-gallery.html` (screenshots in `assets/design-language-shots/`). House-made languages are candidates too.
- *Picked "invent"* → ask for **3 concrete brand words + one physical-object metaphor** ("a museum caption", "an oxidized plaque") — or offer 3 candidate concepts derived from the brief. Then run `wiki/web-dev/design-synthesis.md` top to bottom.
- *Picked "brand register"* → ask which register row fits (premium-minimal / industrial / warm-human / dense-product) per `design-systems-reference`'s calibration table.
- *Picked "chef's choice" / "match existing"* → no round 2; the chef derives (or extracts from the reference) and states the pick in the menu.

The consultation's answers feed the chef's **menu** (SYS-WEB loop step 1) and are recorded in Step 3 below — asked once, reused forever (never re-ask what `.impeccable.md` already holds).

**Pane/bake-off hardening (2026-07-17, learned on the portfolio re-costume — both failures shipped in a real pane and surfaced only at build):**
1. **Code shown in a pane is QUOTED from the target repo** — never a "representative" snippet. Pane B advertised a Drizzle query; the repo runs Sequelize. The truthful-content rule extends to consultation artifacts: if the pane can't quote real code yet, show none.
2. **Token pairs in a pane pass the WCAG-AA computation at their intended sizes before presenting** (OKLCH→sRGB→relative-luminance→ratio — the starter-tokens method; a ~20-line node script, don't eyeball). Pane B's 0.58-L coral read fine but fails 4.5:1 as small text; the build had to fork a deepened 0.50-L variant. Compute per pane, annotate any large-text-only colors as such on the pane itself.

### Step 3: Write Design Context

Synthesize your findings and the user's answers into a `## Design Context` section:

```markdown
## Design Context

### Users
[Who they are, their context, the job to be done]

### Brand Personality
[Voice, tone, 3-word personality, emotional goals]

### Aesthetic Direction
[Visual tone, references, anti-references, theme]

### Costume & Theme (from the design consultation)
[Look source: open / match-brand / feel-like-X / redesign-keep-soul]
[Costume: <language or register or "synthesized: <name>" or chef's choice> — source page + date chosen]
[Theme: light / dark / both — chosen by the user or derived (say which)]

### Design Principles
[3-5 principles derived from the conversation that should guide all design decisions]
```

Write this section to `.impeccable.md` in the project root. If the file already exists, update the Design Context section in place.

Then STOP and call the AskUserQuestion tool to clarify whether they'd also like the Design Context appended to CLAUDE.md. If yes, append or update the section there as well.

Confirm completion and summarize the key design principles that will now guide all future work.
