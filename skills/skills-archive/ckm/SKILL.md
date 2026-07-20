---
name: ckm
description: "Unified ClaudeKit design toolkit: brand identity & voice, design tokens (3-layer architecture), UI styling (shadcn/ui + Tailwind + canvas), logo generation (55 styles, Gemini AI), CIP mockups (50 deliverables), HTML presentations (Chart.js, BM25 slide search), banner design (22 styles, multi-platform), icon design (15 styles, SVG via Gemini 3.1 Pro), social photos (HTML→screenshot). Covers brand, design-system, ui-styling, logo, CIP, slides, banners, icons, social photos."
argument-hint: "[design-type] [context]"
license: MIT
metadata:
  author: claudekit
  version: "3.0.0"
---

# ClaudeKit Design Toolkit

Unified skill for brand identity, design tokens, UI styling, logo/CIP/icon generation, presentations, banners, and social photos.

## Table of Contents

1. [Task Routing](#task-routing)
2. [Brand Identity](#brand-identity)
3. [Design Tokens](#design-tokens)
4. [UI Styling](#ui-styling)
5. [Logo Design](#logo-design)
6. [CIP Design](#cip-design)
7. [Slides & Presentations](#slides--presentations)
8. [Banner Design](#banner-design)
9. [Icon Design](#icon-design)
10. [Social Photos](#social-photos)
11. [Workflows](#workflows)
12. [References](#references)
13. [Scripts](#scripts)

---

## Task Routing

| Task | Section | Key References |
|------|---------|----------------|
| Brand voice, identity, assets | [Brand Identity](#brand-identity) | `references/voice-framework.md`, `references/visual-identity.md` |
| Design tokens, CSS vars, specs | [Design Tokens](#design-tokens) | `references/token-architecture.md` |
| shadcn/ui, Tailwind, canvas | [UI Styling](#ui-styling) | `references/shadcn-components.md`, `references/tailwind-utilities.md` |
| Logo creation, AI generation | [Logo Design](#logo-design) | `references/logo-design.md` |
| CIP mockups, deliverables | [CIP Design](#cip-design) | `references/cip-design.md` |
| Presentations, pitch decks | [Slides](#slides--presentations) | `references/slides-create.md` |
| Banners, covers, headers | [Banner Design](#banner-design) | `references/banner-sizes-and-styles.md` |
| SVG icons, icon sets | [Icon Design](#icon-design) | `references/icon-design.md` |
| Social media images | [Social Photos](#social-photos) | `references/social-photos-design.md` |

---

## Brand Identity

Brand voice, visual identity, messaging frameworks, asset management, and consistency.

### Brand Quick Start

```bash
# Inject brand context into prompts
node scripts/inject-brand-context.cjs
node scripts/inject-brand-context.cjs --json

# Validate an asset
node scripts/validate-asset.cjs <asset-path>

# Extract/compare colors
node scripts/extract-colors.cjs --palette
node scripts/extract-colors.cjs <image-path>
```

### Brand Sync Workflow

```bash
# 1. Edit docs/brand-guidelines.md
# 2. Sync to design tokens
node scripts/sync-brand-to-tokens.cjs
# 3. Verify
node scripts/inject-brand-context.cjs --json | head -20
```

**Files synced:** `docs/brand-guidelines.md` → `assets/design-tokens.json` → `assets/design-tokens.css`

### Brand Subcommands

| Subcommand | Description | Reference |
|------------|-------------|-----------|
| `update` | Update brand identity and sync to all design systems | `references/update.md` |

### Brand References

| Topic | File |
|-------|------|
| Voice Framework | `references/voice-framework.md` |
| Visual Identity | `references/visual-identity.md` |
| Messaging | `references/messaging-framework.md` |
| Consistency | `references/consistency-checklist.md` |
| Guidelines Template | `references/brand-guideline-template.md` |
| Asset Organization | `references/asset-organization.md` |
| Color Management | `references/color-palette-management.md` |
| Typography | `references/typography-specifications.md` |
| Logo Usage | `references/logo-usage-rules.md` |
| Approval Checklist | `references/approval-checklist.md` |

---

## Design Tokens

Three-layer token architecture: primitive → semantic → component.

### Token Structure

```css
/* Primitive */
--color-blue-600: #2563EB;

/* Semantic */
--color-primary: var(--color-blue-600);

/* Component */
--button-bg: var(--color-primary);
```

### Token Scripts

```bash
# Generate CSS from JSON token config
node scripts/generate-tokens.cjs --config tokens.json -o tokens.css

# Validate — check for hardcoded values
node scripts/validate-tokens.cjs --dir src/
```

### Component Spec Pattern

| Property | Default | Hover | Active | Disabled |
|----------|---------|-------|--------|----------|
| Background | primary | primary-dark | primary-darker | muted |
| Text | white | white | white | muted-fg |
| Border | none | none | none | muted-border |
| Shadow | sm | md | none | none |

### Token References

| Topic | File |
|-------|------|
| Token Architecture | `references/token-architecture.md` |
| Primitive Tokens | `references/primitive-tokens.md` |
| Semantic Tokens | `references/semantic-tokens.md` |
| Component Tokens | `references/component-tokens.md` |
| Component Specs | `references/component-specs.md` |
| States & Variants | `references/states-and-variants.md` |
| Tailwind Integration | `references/tailwind-integration.md` |

---

## UI Styling

shadcn/ui components (Radix UI + Tailwind), utility-first CSS, and canvas-based visual design.

### Component + Styling Setup

```bash
npx shadcn@latest init        # Configure shadcn/ui + Tailwind
npx shadcn@latest add button card dialog form  # Add components
```

### Usage Example

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function Dashboard() {
  return (
    <div className="container mx-auto p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">View your metrics</p>
          <Button variant="default" className="w-full">View Details</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### UI Styling Scripts

```bash
python scripts/ui-styling/shadcn_add.py button card dialog  # Add components with deps
python scripts/ui-styling/tailwind_config_gen.py --colors brand:blue --fonts display:Inter
```

### UI Styling References

| Topic | File |
|-------|------|
| Component Catalog | `references/shadcn-components.md` |
| Theming | `references/shadcn-theming.md` |
| Accessibility | `references/shadcn-accessibility.md` |
| Tailwind Utilities | `references/tailwind-utilities.md` |
| Responsive Design | `references/tailwind-responsive.md` |
| Tailwind Customization | `references/tailwind-customization.md` |
| Canvas Design System | `references/canvas-design-system.md` |

---

## Logo Design

55+ styles, 30 color palettes, 25 industry guides. Gemini AI generation.

**ALWAYS** generate output logo images with white background.

### Logo: Generate Design Brief

```bash
python3 scripts/logo/search.py "tech startup modern" --design-brief -p "BrandName"
```

### Logo: Search Styles/Colors/Industries

```bash
python3 scripts/logo/search.py "minimalist clean" --domain style
python3 scripts/logo/search.py "tech professional" --domain color
python3 scripts/logo/search.py "healthcare medical" --domain industry
```

### Logo: Generate with AI

```bash
python3 scripts/logo/generate.py --brand "TechFlow" --style minimalist --industry tech
python3 scripts/logo/generate.py --prompt "coffee shop vintage badge" --style vintage
```

**IMPORTANT:** When scripts fail, try to fix them directly.

After generation, **ALWAYS** ask user about HTML preview via `AskUserQuestion`. If yes, invoke `/ui-ux-pro-max` for gallery.

---

## CIP Design

50+ deliverables, 20 styles, 20 industries. Gemini AI (Flash/Pro).

### CIP: Generate Brief

```bash
python3 scripts/cip/search.py "tech startup" --cip-brief -b "BrandName"
```

### CIP: Search Domains

```bash
python3 scripts/cip/search.py "business card letterhead" --domain deliverable
python3 scripts/cip/search.py "luxury premium elegant" --domain style
python3 scripts/cip/search.py "hospitality hotel" --domain industry
python3 scripts/cip/search.py "office reception" --domain mockup
```

### CIP: Generate Mockups

```bash
# With logo (RECOMMENDED)
python3 scripts/cip/generate.py --brand "TopGroup" --logo /path/to/logo.png --deliverable "business card" --industry "consulting"

# Full CIP set
python3 scripts/cip/generate.py --brand "TopGroup" --logo /path/to/logo.png --industry "consulting" --set

# Pro model (4K text)
python3 scripts/cip/generate.py --brand "TopGroup" --logo logo.png --deliverable "business card" --model pro

# Without logo
python3 scripts/cip/generate.py --brand "TechFlow" --deliverable "business card" --no-logo-prompt
```

Models: `flash` (default, `gemini-2.5-flash-image`), `pro` (`gemini-3-pro-image-preview`)

### CIP: Render HTML Presentation

```bash
python3 scripts/cip/render-html.py --brand "TopGroup" --industry "consulting" --images /path/to/cip-output
```

**Tip:** If no logo exists, use [Logo Design](#logo-design) first.

---

## Slides & Presentations

Brand-compliant HTML presentations using design tokens + Chart.js + contextual decision system.

### Source of Truth

| File | Purpose |
|------|---------|
| `docs/brand-guidelines.md` | Brand identity, voice, colors |
| `assets/design-tokens.json` | Token definitions |
| `assets/design-tokens.css` | CSS variables (import in slides) |
| `assets/css/slide-animations.css` | CSS animation library |

### Slide Search (BM25)

```bash
python scripts/search-slides.py "investor pitch"
python scripts/search-slides.py "problem agitation" -d copy
python scripts/search-slides.py "revenue growth" -d chart

# Contextual search (Premium System)
python scripts/search-slides.py "problem slide" --context --position 2 --total 9
python scripts/search-slides.py "cta" --context --position 9 --prev-emotion frustration
```

### Decision System CSVs

| File | Purpose |
|------|---------|
| `data/slide-strategies.csv` | 15 deck structures + emotion arcs + sparkline beats |
| `data/slide-layouts.csv` | 25 layouts + component variants + animations |
| `data/slide-layout-logic.csv` | Goal → Layout + break_pattern flag |
| `data/slide-typography.csv` | Content type → Typography scale |
| `data/slide-color-logic.csv` | Emotion → Color treatment |
| `data/slide-backgrounds.csv` | Slide type → Image category (Pexels/Unsplash) |
| `data/slide-copy.csv` | 25 copywriting formulas (PAS, AIDA, FAB) |
| `data/slide-charts.csv` | 25 chart types with Chart.js config |

### Contextual Decision Flow

```
1. Parse goal/context → 2. Search slide-strategies.csv → 3. Per slide:
   a. slide-layout-logic.csv → layout
   b. slide-typography.csv → type scale
   c. slide-color-logic.csv → color treatment
   d. slide-backgrounds.csv → image if needed
   e. Apply animation from slide-animations.css
→ 4. Generate HTML with design tokens → 5. Validate with slide-token-validator.py
```

### Pattern Breaking (Duarte Sparkline)

Premium decks alternate emotions: `"What Is" (frustration) ↔ "What Could Be" (hope)`. Breaks at 1/3 and 2/3 positions.

### Slide Requirements

ALL slides MUST:
1. Import `assets/design-tokens.css`
2. Use CSS variables: `var(--color-primary)`, `var(--slide-bg)`, etc.
3. Use Chart.js for charts (NOT CSS-only bars)
4. Include navigation (keyboard arrows, click, progress bar)
5. Center align content, focus on persuasion/conversion

### Chart.js Integration

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<canvas id="revenueChart"></canvas>
<script>
new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: {
        labels: ['Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            data: [5, 12, 28, 45],
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            fill: true, tension: 0.4
        }]
    }
});
</script>
```

### Slide References

| Topic | File |
|-------|------|
| Creation Guide | `references/slides-create.md` |
| Layout Patterns | `references/slides-layout-patterns.md` |
| HTML Template | `references/slides-html-template.md` |
| Copywriting | `references/slides-copywriting-formulas.md` |
| Strategies | `references/slides-strategies.md` |

---

## Banner Design

22 art direction styles across social, ads, web, print. Uses `frontend-design`, `ai-artist`, `ai-multimodal`, `chrome-devtools` skills.

### Banner Workflow

1. **Gather requirements** via `AskUserQuestion` — purpose, platform, content, brand, style, quantity
2. **Research** — Activate `ui-ux-pro-max`, browse Pinterest for references
3. **Design** — Create HTML/CSS with `frontend-design`, generate visuals with `ai-artist`/`ai-multimodal`
4. **Export** — Screenshot to PNG at exact dimensions via `chrome-devtools`
5. **Present** — Show all options side-by-side, iterate on feedback

### Banner Size Reference

| Platform | Type | Size (px) |
|----------|------|-----------|
| Facebook | Cover | 820 × 312 |
| Twitter/X | Header | 1500 × 500 |
| LinkedIn | Personal | 1584 × 396 |
| YouTube | Channel art | 2560 × 1440 |
| Instagram | Story | 1080 × 1920 |
| Instagram | Post | 1080 × 1080 |
| Google Ads | Med Rectangle | 300 × 250 |
| Google Ads | Leaderboard | 728 × 90 |
| Website | Hero | 1920 × 600-1080 |

### Top Art Styles

| Style | Best For |
|-------|----------|
| Minimalist | SaaS, tech |
| Bold Typography | Announcements |
| Gradient | Modern brands |
| Photo-Based | Lifestyle, e-com |
| Geometric | Tech, fintech |
| Glassmorphism | SaaS, apps |
| Neon/Cyberpunk | Gaming, events |

Full 22 styles: `references/banner-sizes-and-styles.md`

### Banner Design Rules

- Safe zones: critical content in central 70-80%
- One CTA per banner, bottom-right, min 44px height
- Max 2 fonts, min 16px body, ≥32px headline
- Text under 20% for ads (Meta penalizes)
- Print: 300 DPI, CMYK, 3-5mm bleed

---

## Icon Design

15 styles, 12 categories. Gemini 3.1 Pro generates SVG text output.

### Generate Icons

```bash
python3 scripts/icon/generate.py --prompt "settings gear" --style outlined
python3 scripts/icon/generate.py --prompt "shopping cart" --style filled --color "#6366F1"
python3 scripts/icon/generate.py --name "dashboard" --category navigation --style duotone

# Batch variations
python3 scripts/icon/generate.py --prompt "cloud upload" --batch 4 --output-dir ./icons

# Multi-size export
python3 scripts/icon/generate.py --prompt "user profile" --sizes "16,24,32,48" --output-dir ./icons
```

### Top Icon Styles

| Style | Best For |
|-------|----------|
| outlined | UI interfaces, web apps |
| filled | Mobile apps, nav bars |
| duotone | Marketing, landing pages |
| rounded | Friendly apps, health |
| sharp | Tech, fintech, enterprise |
| flat | Material design, Google-style |
| gradient | Modern brands, SaaS |

**Model:** `gemini-3.1-pro-preview` — text-only output (SVG is XML text).

---

## Social Photos

Multi-platform social image design: HTML/CSS → screenshot export. Uses `ui-ux-pro-max`, `brand`, `design-system`, `chrome-devtools` skills.

### Social Photos Workflow

1. **Analyze** — Parse prompt: subject, platforms, style, brand context
2. **Ideate** — 3-5 concepts, present via `AskUserQuestion`
3. **Design** — Brand → Design System → HTML per idea × size
4. **Export** — `chrome-devtools` or Playwright screenshot at exact px (2x deviceScaleFactor)
5. **Verify** — Visually inspect, fix layout/styling, re-export
6. **Report** — Summary to `plans/reports/`

### Social Photos Key Sizes

| Platform | Size (px) | Platform | Size (px) |
|----------|-----------|----------|-----------|
| IG Post | 1080×1080 | FB Post | 1200×630 |
| IG Story | 1080×1920 | X Post | 1200×675 |
| IG Carousel | 1080×1350 | LinkedIn | 1200×627 |
| YT Thumb | 1280×720 | Pinterest | 1000×1500 |

Full guide: `references/social-photos-design.md`

---

## Workflows

### Complete Brand Package

1. **Logo** → `scripts/logo/generate.py` → Generate logo variants
2. **CIP** → `scripts/cip/generate.py --logo ...` → Create deliverable mockups
3. **Presentation** → Load `references/slides-create.md` → Build pitch deck

### New Design System

1. **Brand** → Define colors, typography, voice (Brand Identity section)
2. **Tokens** → Create semantic token layers (Design Tokens section)
3. **Implement** → Configure Tailwind, shadcn/ui (UI Styling section)

---

## References

### Brand & Identity
| Topic | File |
|-------|------|
| Voice Framework | `references/voice-framework.md` |
| Visual Identity | `references/visual-identity.md` |
| Messaging | `references/messaging-framework.md` |
| Consistency Checklist | `references/consistency-checklist.md` |
| Brand Guideline Template | `references/brand-guideline-template.md` |
| Asset Organization | `references/asset-organization.md` |
| Color Management | `references/color-palette-management.md` |
| Typography | `references/typography-specifications.md` |
| Logo Usage Rules | `references/logo-usage-rules.md` |
| Approval Checklist | `references/approval-checklist.md` |
| Brand Update | `references/update.md` |

### Design Tokens
| Topic | File |
|-------|------|
| Token Architecture | `references/token-architecture.md` |
| Primitive Tokens | `references/primitive-tokens.md` |
| Semantic Tokens | `references/semantic-tokens.md` |
| Component Tokens | `references/component-tokens.md` |
| Component Specs | `references/component-specs.md` |
| States & Variants | `references/states-and-variants.md` |
| Tailwind Integration | `references/tailwind-integration.md` |

### UI Styling
| Topic | File |
|-------|------|
| shadcn Components | `references/shadcn-components.md` |
| shadcn Theming | `references/shadcn-theming.md` |
| shadcn Accessibility | `references/shadcn-accessibility.md` |
| Tailwind Utilities | `references/tailwind-utilities.md` |
| Responsive Design | `references/tailwind-responsive.md` |
| Tailwind Customization | `references/tailwind-customization.md` |
| Canvas Design System | `references/canvas-design-system.md` |

### Logo & CIP
| Topic | File |
|-------|------|
| Logo Design Guide | `references/logo-design.md` |
| Logo Styles | `references/logo-style-guide.md` |
| Logo Colors | `references/logo-color-psychology.md` |
| Logo Prompts | `references/logo-prompt-engineering.md` |
| CIP Design Guide | `references/cip-design.md` |
| CIP Deliverables | `references/cip-deliverable-guide.md` |
| CIP Styles | `references/cip-style-guide.md` |
| CIP Prompts | `references/cip-prompt-engineering.md` |

### Slides & Banners & Social
| Topic | File |
|-------|------|
| Slides Creation | `references/slides-create.md` |
| Slides Layouts | `references/slides-layout-patterns.md` |
| Slides Template | `references/slides-html-template.md` |
| Slides Copywriting | `references/slides-copywriting-formulas.md` |
| Slides Strategy | `references/slides-strategies.md` |
| Banner Sizes & Styles | `references/banner-sizes-and-styles.md` |
| Social Photos Guide | `references/social-photos-design.md` |
| Icon Design Guide | `references/icon-design.md` |
| Design Routing | `references/design-routing.md` |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/logo/search.py` | Search logo styles, colors, industries |
| `scripts/logo/generate.py` | Generate logos with Gemini AI |
| `scripts/logo/core.py` | BM25 search engine for logo data |
| `scripts/cip/search.py` | Search CIP deliverables, styles, industries |
| `scripts/cip/generate.py` | Generate CIP mockups with Gemini |
| `scripts/cip/render-html.py` | Render HTML presentation from CIP mockups |
| `scripts/cip/core.py` | BM25 search engine for CIP data |
| `scripts/icon/generate.py` | Generate SVG icons with Gemini 3.1 Pro |
| `scripts/inject-brand-context.cjs` | Extract brand context for prompt injection |
| `scripts/sync-brand-to-tokens.cjs` | Sync brand-guidelines.md → design-tokens |
| `scripts/validate-asset.cjs` | Validate asset naming, size, format |
| `scripts/extract-colors.cjs` | Extract and compare colors against palette |
| `scripts/generate-tokens.cjs` | Generate CSS from JSON token config |
| `scripts/validate-tokens.cjs` | Check for hardcoded values in code |
| `scripts/embed-tokens.cjs` | Embed tokens into files |
| `scripts/search-slides.py` | BM25 search + contextual recommendations |
| `scripts/slide-token-validator.py` | Validate slide HTML for token compliance |
| `scripts/html-token-validator.py` | Validate HTML for token compliance |
| `scripts/generate-slide.py` | Generate slide HTML |
| `scripts/fetch-background.py` | Fetch images from Pexels/Unsplash |
| `scripts/slide_search_core.py` | Core BM25 engine for slide search |
| `scripts/ui-styling/shadcn_add.py` | Add shadcn/ui components with dep handling |
| `scripts/ui-styling/tailwind_config_gen.py` | Generate tailwind.config.js with custom theme |

## Templates

| Template | Purpose |
|----------|---------|
| `templates/brand-guidelines-starter.md` | Starter template for new brands |
| `templates/design-tokens-starter.json` | Starter JSON with three-layer token structure |

## Setup

```bash
export GEMINI_API_KEY="your-key"  # https://aistudio.google.com/apikey
pip install google-genai pillow
```

## Best Practices

1. Never use raw hex in components — always reference tokens
2. Semantic layer enables theme switching (light/dark)
3. Component tokens enable per-component customization
4. Use HSL format for opacity control
5. Document every token's purpose
6. Slides must import design-tokens.css and use var() exclusively
7. Component composition: build complex UIs from simple primitives
8. Utility-first styling: extract components only for true repetition
9. Mobile-first responsive: start mobile, layer responsive variants
10. Accessibility-first: leverage Radix UI, focus states, semantic HTML

## Integration

**Related Skills:** frontend-design, ui-ux-pro-max, ai-artist, ai-multimodal, chrome-devtools
