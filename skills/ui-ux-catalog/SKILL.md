---
name: ui-ux-catalog
description: "Searchable design-intelligence catalog — 84 UI styles, 161 industry color palettes, 73 font pairings, product-category reasoning rules, UX guidelines, chart types. Consult DURING impeccable shape/craft for candidate palettes, pairings, and style vocabularies; never an entry point for building UI. Catalog rows are starting points: impeccable's font procedure and absolute bans always win."
user-invocable: true
argument-hint: "[query] [--domain styles|colors|typography|landing|products|ui-reasoning|ux-guidelines|charts|icons]"
license: MIT (nextlevelbuilder/ui-ux-pro-max-skill). See NOTICE.md.
---

# ui-ux-catalog — Layer 2 (CATALOG) of impeccable's three-layer precedence

This skill is **reference data, not a design authority**. In impeccable's three-layer precedence it sits in the middle:
Layer 1 — **PROCEDURE** (impeccable's SKILL.md + reference/) decides *how* design choices are made; Layer 2 — **CATALOG**
(this skill) supplies *candidates* — palettes, pairings, style vocabularies, reasoning rules; Layer 3 — **DEFAULTS**
(trained reflexes) lose to both. You never open this skill to "build a UI" — you open it mid-shape or mid-craft when
you need grounded options to feed into impeccable's procedures.

## PRECEDENCE (non-negotiable)

1. **Font ban-filter:** any returned row containing a font on impeccable's `reflex_fonts_to_reject` list
   (`skills/impeccable/SKILL.md`, e.g. Inter, Playfair Display, DM Sans, Space Grotesk, Syne, Outfit, Lora,
   Cormorant…) is **REJECTED** and the query re-run (raise `--max-results`, or re-query with different terms).
2. **The catalog never overrides impeccable's font-selection procedure.** Surviving pairings are *candidates* entering
   Step 3 of that procedure — they still face the brand-words cross-check and can still lose to a non-catalog font.
3. **Palette hexes are never pasted raw.** Adapt them into OKLCH and tint neutrals toward the brand hue per
   `skills/impeccable/reference/color-and-contrast.md`. Catalog hexes anchor hue/role decisions only.

## Data inventory (actual row counts, verified at vendoring)

| CSV | Rows | Contents | Query when… |
|---|---|---|---|
| `data/styles.csv` | 84 | UI styles (glassmorphism→brutalism): colors, effects, CSS keywords, checklists, a11y | you need a style vocabulary or implementation checklist for a brief |
| `data/colors.csv` | 161 | Per-industry palettes as full token sets (Primary/Accent/Muted/Destructive…) | you need hue anchors for a product category |
| `data/typography.csv` | 73 | Font pairings: heading+body, mood keywords, CSS import, Tailwind config | you want pairing candidates (ban-filter applies) |
| `data/google-fonts.csv` | 1,923 | Google Fonts metadata: classification, axes, subsets, popularity | you need fonts by language subset, axis, or classification |
| `data/products.csv` | 161 | Product categories → recommended style + landing pattern + palette focus | starting shape for an unfamiliar product domain |
| `data/ui-reasoning.csv` | 161 | Per-category decision rules, anti-patterns, style priorities | you want the "why" behind a category recommendation |
| `data/landing.csv` | 34 | Landing-page patterns: section order, CTA placement, conversion notes | structuring a marketing/landing page |
| `data/ux-guidelines.csv` | 105 | UX do/don't rules with code examples + severity | auditing interaction/navigation/accessibility choices |
| `data/charts.csv` | 25 | Data-type → chart-type mapping, a11y grades, library picks | choosing a visualization |
| `data/icons.csv` | 105 | Icon names → library + import code (Phosphor etc.) | picking icons consistently |
| `data/app-interface.csv` | 30 | Web app-interface rules (ARIA, focus, forms) | building dense app UI |
| `data/react-performance.csv` | 44 | React/Next perf rules (waterfalls, memo, RSC) | React perf sanity check |
| `data/stacks/react-native.csv` | 51 | RN-specific guidelines with docs links | React Native work |

## Query interface

```bash
cd ~/.claude/skills/ui-ux-catalog
python scripts/search.py "<query>" [--domain <d>] [--stack react-native] [--max-results N] [--json]
```

BM25-ranked, top-3 by default, auto-detects domain if `--domain` omitted. **Actual `--domain` keys** (the
argument-hint above uses friendly names; the script uses these): `style` (styles.csv), `color` (colors.csv),
`typography` (typography.csv), `google-fonts`, `product` (products.csv), `landing`, `ux` (ux-guidelines.csv),
`chart` (charts.csv), `icons`, `react` (react-performance.csv), `web` (app-interface.csv).
`ui-reasoning.csv` has **no search domain** — grep it directly (below). Read-only: the scripts write nothing, ever.

### Pure-grep fallback (no Python needed)

Read the header first (`head -1 data/<file>.csv`) to learn columns, then:

```bash
rg -i "fintech|banking"      data/colors.csv             # industry palette rows
rg -i "glassmorphism|bento"  data/styles.csv             # style rows
rg -i "elegant|luxury"       data/typography.csv         # pairing rows
rg -i "^[0-9]+,SaaS"         data/products.csv           # category rows (No,Product Type,…)
rg -i "healthcare"           data/ui-reasoning.csv       # decision rules + anti-patterns
rg -i "scroll|sticky"        data/ux-guidelines.csv      # UX do/don't
rg -i "time-series|funnel"   data/charts.csv             # chart selection
rg -i "arrow|menu"           data/icons.csv              # icon imports
rg -i "Family$|^Manrope,"    data/google-fonts.csv       # font metadata by family
```

Rows are long; pipe through `| head -5` and trim to the columns you need.

## Worked examples

**1. Industry palette → OKLCH adaptation.**
`python scripts/search.py "fintech banking trust" --domain color` → row gives `Primary #2563EB, Accent #F97316, Muted #F1F5F9…`.
Do NOT paste. Convert the primary to OKLCH (`#2563EB` ≈ `oklch(0.546 0.245 263)`), rebuild the scale around that hue,
and tint every neutral (background, muted, border) toward hue ~263 per `reference/color-and-contrast.md` — pure-gray
neutrals are banned there. The catalog contributed the *hue/role decision* (trust-blue primary, warm CTA accent), not the values.

**2. Style vocabulary for a brief.**
Brief: "calm meditation app". `python scripts/search.py "meditation calm wellness" --domain product` → recommends a style +
palette focus; follow with `--domain style` on the named style to pull its `AI Prompt Keywords`, `CSS/Technical Keywords`,
and `Implementation Checklist`. Use those as shaping vocabulary inside impeccable's shape step — the checklist becomes
craft-phase acceptance criteria, not a substitute for them.

**3. Font-pairing candidates → ban-filter → shortlist.**
`python scripts/search.py "elegant luxury editorial" --domain typography -n 5` → suppose it returns
*Classic Elegant (Playfair Display + Inter)*, *Bodoni Moda + Manrope*, *Cormorant Garamond + Karla*.
Apply the ban-filter: Playfair Display, Inter, Cormorant Garamond are all on `reflex_fonts_to_reject` → rows 1 and 3
REJECTED; re-run or widen `-n` until you have clean rows. Shortlist: *Bodoni Moda + Manrope* survives — it now enters
impeccable's font-selection procedure as one candidate among others, where the brand-words cross-check has final say.

## Provenance

Vendored from `nextlevelbuilder/ui-ux-pro-max-skill` @ `07f4ef3` (tag v2.5.0, MIT) with `search.py` patched to be
read-only. Full file list, exclusions, and patch log: `NOTICE.md`.
