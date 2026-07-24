# Layout Archetypes

> Adapted from pbakaus/impeccable @ 1863a44 (Apache-2.0) and leonxlnx/taste-skill @ 1a6dc0a (MIT). Full ledger: ../NOTICE.md

## How to Use This Catalog

Pick ONE archetype as the page skeleton. Commit to it fully — a half-committed archetype reads as indecision, not subtlety. Then break it deliberately in **exactly one place** (this is the structural expression of SKILL.md's bold-direction rule: intentionality, not intensity). One break is a statement; three breaks are noise.

**Layout variance mandate:** never use the same archetype twice in a row across projects. If the last build was a bento grid, this one is not. Track it the same way you vary fonts.

DO NOT blend two archetypes "for richness." DO NOT pick by personal habit — pick by content shape and register.

## The Register Split

Classify the surface FIRST. The register decides which structural moves are licensed.

- **Brand register** (design IS the product): landing pages, marketing, campaigns, portfolios, long-form, about pages. Licensed: asymmetry, grid-breaking, fluid clamp() spacing, single-purpose viewports (one dominant idea per fold), per-section art direction when the narrative demands it. Failure mode: average and safe — invisible.
- **Product register** (design SERVES the product): app UI, dashboards, settings, tables, docs, authenticated surfaces. Licensed: predictable grids, consistent densities, familiar navigation, density as a permission. Responsive behavior is structural (collapse the sidebar), not typographic. Failure mode: strangeness without purpose — invented affordances for standard tasks. Consistency IS an affordance here.

**Brand archetypes:** asymmetric split hero, editorial long-form, bento grid, full-bleed immersive, storytelling scroll, Z-flow landing, pricing page, portfolio/masonry.
**Product archetypes:** docs two-pane, dashboard shell.

---

## 1. Asymmetric Split Hero — brand

**When it fits:** one strong claim plus one strong visual; SaaS, agency, product launch heroes.
**Skeleton:**
```html
<header> nav </header>
<section class="hero">          <!-- 70/30 or 80/20, never 50/50 -->
  <div class="claim"> h1 + subhead + one CTA </div>
  <div class="evidence"> staggered media / live product </div>
</section>
```
**Spacing rhythm:** tight inside the claim block (8–12px between h1/subhead/CTA), a gulf between the halves. Mobile: full-width stack, claim first.
**Premium vs slop:** premium puts real tension in the proportions — 70/30 with the visual bleeding off-edge. Slop is a centered 50/50 with a stock illustration floating in whitespace.
**AI-tell to avoid:** perfectly balanced halves, everything center-aligned, illustration-of-people-pointing-at-charts.

## 2. Editorial Long-Form — brand

**When it fits:** essays, case studies, manifestos, about pages with an actual story.
**Skeleton:**
```html
<article class="prose">         <!-- single column, 65–75ch -->
  <header> kicker? + h1 + standfirst </header>
  sections… <figure class="breakout"> full-bleed image </figure> …
</article>
```
**Spacing rhythm:** generous side margins; vertical spacing in multiples of the body line-height; figures vary width (column / wide / full-bleed) so the column breathes.
**Premium vs slop:** premium earns its pull quotes and breakouts from the content. Slop is the saturated editorial-typographic lane: italic display serif + tiny mono labels + ruled three-column separators + zero imagery. That lane is the current default-distinctive costume — reject it unless the brief genuinely lives there.
**AI-tell to avoid:** ruled separators between every section, uppercase tracked eyebrows on every heading.

## 3. Bento Grid — brand

**When it fits:** feature showcases where items genuinely differ in weight and kind.
**Skeleton:**
```html
<section class="bento">         <!-- CSS grid, max ~7 cells -->
  <div class="cell span-2x2"> hero feature </div>
  <div class="cell tall"> stat </div> <div class="cell"> media </div> …
</section>
```
**Spacing rhythm:** one consistent gap across all cells (16–24px) — the size variation does the talking; uneven gutters read as broken, not bold. Mobile: single column, spans reset.
**Anti-uniformity constraints (mandatory):** no two adjacent cells the same size; at least one cell spans 2 columns or rows; mix cell *types* (media, number, text, demo) — not seven text cards; cap at ~7 cells.
**Premium vs slop:** premium bento is masonry with intent — the size of each cell encodes its importance. Slop is a uniform 3×2 of identical icon+heading+text cells, which is the banned card grid wearing a bento costume.
**AI-tell to avoid:** uniform cells, nested cards inside cells, decorative sparkline cells.

## 4. Full-Bleed Immersive — brand

**When it fits:** image-led briefs — hotels, restaurants, photography, food, travel. Zero imagery on an image-implying brief is a bug, not restraint.
**Skeleton:**
```html
<section class="immersive">     <!-- min-height: 100dvh, never h-screen -->
  <img class="bleed" />         <!-- the photograph IS the design -->
  <nav class="overlay" /> <h1 class="overlay" />
</section>
```
**Spacing rhythm:** the image owns the viewport; type gets deliberate placement within it, not a strip below it. Subsequent sections re-enter at full editorial padding.
**Premium vs slop:** premium typography sits IN the photograph — placed where the image composition leaves room. Slop is a flat 60% dark scrim with centered white text, identical on every site.
**AI-tell to avoid:** the universal scrim, headline + subhead + two buttons dead-center.

## 5. Storytelling Scroll — brand

**When it fits:** product narratives, launches, data stories — content with an actual sequence.
**Skeleton:**
```html
<main class="story">
  <section class="beat"> one idea, one fold </section>
  <section class="beat"> next idea … </section>  <!-- deliberate pacing -->
</main>
```
**Spacing rhythm:** single-purpose viewports — one dominant idea per fold, long scroll, drama spacing between beats (see whitespace scale below).
**Premium vs slop:** premium choreographs each reveal to fit what it reveals — a chart draws, a photo parts, a number counts. Slop applies one identical fade-up entrance to every section. Scroll-driven implementation belongs to the gsap-advanced skill (SK-044) — don't hand-roll scroll observers.
**AI-tell to avoid:** uniform section-entrance motion; numbered 01/02/03 markers when the order carries no information.

## 6. Marketing Z-Flow Landing — brand

**When it fits:** conversion pages with a persuasive argument to make, especially ad traffic.
**Skeleton:**
```html
<main>
  hero → proof bar → problem → how-it-works → benefits ×2-3
  → testimonial → FAQ → final CTA          <!-- alternate media side -->
</main>
```
**Spacing rhythm:** alternating media/text direction creates the Z; spacing between argument beats is wider than within them, so the page scans as a sequence of claims.
**Premium vs slop:** premium is a persuasive narrative — each section answers the objection the previous one raised. Slop is Hero → Feature 1 → Feature 2 → Feature 3 → CTA: a list, not an argument.
**AI-tell to avoid:** identical alternating stripes with the same image-left/image-right card forever; hero-metric stat rows.

## 7. Pricing Page — brand surface, product discipline

**When it fits:** any paid product. The job is decision support, not decoration.
**Skeleton:**
```html
<section class="plans">         <!-- 2–4 columns -->
  <div class="plan"> </div> <div class="plan featured"> </div> …
</section>
<table class="compare" /> <section class="faq" />
```
**Spacing rhythm:** plan columns tight and scannable internally; the recommended plan gets dominance through ONE means (scale, position, or surface — not all three plus a badge plus a glow).
**Premium vs slop:** premium answers "which one is right for me?" structurally — the featured plan is visibly the default answer. Slop is three identical cards where the middle one just has a "Most popular" pill and a recolored button.
**AI-tell to avoid:** side-stripe accents on plan cards (absolute ban), gradient featured-plan borders.

## 8. Portfolio / Masonry — brand

**When it fits:** work-led sites — design studios, photographers, architects. The work is the interface.
**Skeleton:**
```html
<main class="work">             <!-- columns or grid w/ varied spans -->
  <a class="piece wide" /> <a class="piece tall" /> <a class="piece" /> …
</main>
```
**Spacing rhythm:** generous gutters so each piece reads alone; tile sizes and ratios driven by the work itself, not forced to squares; chrome near zero.
**Premium vs slop:** premium lets the strongest piece be 3× the size of the weakest — curation expressed as scale. Slop is uniform square thumbnails with hover-zoom and a title overlay.
**AI-tell to avoid:** identical aspect-ratio crops, filter pill bars nobody asked for.

## 9. Docs Two-Pane — product

**When it fits:** documentation, knowledge bases, API references.
**Skeleton:**
```html
<div class="docs">
  <nav class="sidebar" />       <!-- second neutral layer -->
  <main class="content" />      <!-- 65–75ch column -->
  <aside class="toc" />         <!-- optional, on-page anchors -->
</div>
```
**Spacing rhythm:** dense nav is fine — density is a permission here. Content column keeps editorial line length; sidebar separates from content via a slightly warmer/cooler neutral surface, not a heavy border.
**Premium vs slop:** premium docs are boringly consistent — same component vocabulary on every page, instant orientation. Slop imports marketing flourish: animated section entrances, gradient heroes, decorative cards around plain prose.
**AI-tell to avoid:** wrapping every code sample and note in nested card chrome.

## 10. Dashboard Shell — product

**When it fits:** authenticated app surfaces — analytics, admin, settings, tools.
**Skeleton:**
```html
<div class="shell">
  <header class="appbar" /> <nav class="sidebar collapsible" />
  <main class="canvas"> predictable grid of real data </main>
</div>
```
**Spacing rhythm:** consistent densities across screens; tighter than any brand surface; responsive = structural (sidebar collapses, tables adapt), never fluid typography.
**Premium vs slop:** premium dashboards show real user data with honest hierarchy — the number that matters is biggest because it matters. Slop is the hero-metric template (big number, small label, supporting stats, gradient accent) filled with decorative numbers.
**AI-tell to avoid:** hero-metric rows, side-stripe status cards (absolute ban), sparkline garnish.

---

## Premium-Calm Whitespace Scale

Spacing only — token scale and `gap` mechanics live in [spatial-design](spatial-design.md).

- **Section padding, brand register:** 96–160px vertical on desktop. When in doubt, double it — generous section padding is the single cheapest premium signal. Escalate to 128–200px between beats that deserve drama.
- **Section padding, product register:** 32–48px. Airiness in a dashboard is wasted screen.
- **Rhythm through contrast:** 8–12px between related siblings, 48–96px between sections, varied within sections. If one spacing value accounts for most of the page, the layout is monotonous — fix the rhythm, not the value.
- **Mobile collapse:** 16px side padding; section padding roughly halves (48–64px). Asymmetric layouts fall back to full-width single column; overlaps and rotations are removed below 768px (they create touch-target conflicts).
- **Full-height sections:** `min-height: 100dvh`, never `height: 100vh`/`h-screen` (iOS Safari viewport jump).

## Symmetry-Breaking Dials

Symmetry-breaking is a tunable register decision, not a virtue. Brand register only. Turn ONE dial at a time, and remember the one-break rule from the top of this file.

**Escalate (bolder):**
- Let the hero escape its container and cross a section boundary.
- Replace centered balance with tension: 70/30, 80/20 splits. Golden ratio? Throw it out.
- Overlap elements intentionally for depth; let one block sit on another's edge.
- Introduce a diagonal flow that escapes horizontal/vertical rigidity.
- Drop in one full-bleed viewport-width moment.
- Jump scale: the important element at 3–5× its surroundings.

**De-escalate (quieter / distill):**
- Return rogue elements to the grid; even out spacing; shrink scale jumps.
- Replace complex grids with simple vertical flow; remove the sidebar; prefer full-width over multi-column.
- Hold ONE alignment discipline consistently across the page — left-aligned by default. Centering everything is banned in SKILL.md; center only an isolated moment (a hero line, a quote), never the whole page.

DO NOT escalate a product surface. DO NOT turn three dials because one looked good.
