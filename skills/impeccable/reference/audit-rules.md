# Audit Rules — Deterministic Anti-Slop Detector Pass

Purpose: a deterministic, mechanical detector sweep run on UI code before it is ever shown.
Run it at **craft Step 4a** (immediately after the Step 4 visual-iteration build, before
presenting anything). Also the mechanical pre-pass referenced by **design-polish (SK-080)**
and **design-check (SK-127)**. **Zero hits on BLOCK rules are required before presenting.**
ADVISORY hits must be fixed or explicitly justified in the delivery notes.

Rules adapted from pbakaus/impeccable @ 1863a44b23bfcf28e5990c0068a0603995ab1e29 (Apache-2.0). Full ledger: ../NOTICE.md

**True rule count: 47** — 41 adapted from upstream (22 slop / 15 quality / 4 provider-gated;
upstream IDs kept in backticks) + 6 ATLAS additions (AR-42, AR-43–46 = the 2026 tells in
section G, and AR-47 hero-subject-mismatch, added 2026-07-17). Severity mapping: BLOCK = upstream standard severity; ADVISORY = upstream `advisory`
or an ATLAS heuristic that needs runtime confirmation. The 4 upstream provider-gated rules
(3 `--gpt`, 1 `--gemini`) are included because their patterns generalize beyond one model;
origin is marked on each. Split: **40 mechanically detectable** (Grep sheet below),
**7 runtime/eyeball-only** (Visual-judgment subset below). NB several current-year tells are
ALREADY covered — badge-above-H1 = AR-09, numbered "01/02/03" rows = AR-11, and the
Space Grotesk / Geist / Instrument Serif fonts are each already a BLOCK under AR-14.

---

## A — AI-tells

- **AR-01** `side-tab` BLOCK — = BAN 1, see SKILL.md `<absolute_bans>`. Detector: one side border ≥2px wider than the other sides, non-neutral color (RGB channel spread ≥30); a left/right side fires at `radius > 0` OR `width >= 3`.
- **AR-02** `border-accent-on-rounded` BLOCK — Detector: top/bottom accent border on a rounded element, `radius > 0 && width >= 2`.
  Fix: remove the border or the border-radius.
- **AR-03** `gradient-text` BLOCK — = BAN 2, see SKILL.md `<absolute_bans>`. Detector: `background-clip: text` (incl. `-webkit-`) with a gradient within ±200 chars, or `bg-clip-text` + `bg-gradient-to-*` on the same line.
- **AR-04** `ai-color-palette` BLOCK — Detector: text chroma ≥50 at hue 260–310 on h1–h3 or ≥20px text; gradient stops at hue 260–310 (purple) or 160–200 (cyan); neon text (chroma ≥80, those hues) on background luminance <0.1; known hex tells (grep sheet).
  Fix: distinctive intentional palette — no purple/violet gradients, no cyan-on-dark.
- **AR-05** `cream-palette` BLOCK — Detector: body/html background where `min(r,g,b) >= 209` AND `r >= g >= b` AND `6 <= (r - b) <= 48`; Tailwind `bg-amber-50/100`, `bg-orange-50/100`, `bg-yellow-50`, `bg-stone-50/100/200`; token names `--paper/--cream/--sand/--bone/--linen/--parchment`.
  Fix: background from a deliberate palette, not the safe warm off-white.
- **AR-06** `dark-glow` BLOCK — Detector: dark page background (all RGB channels <100, or Tailwind `bg-{gray|slate|zinc|neutral|stone}-{800,9xx}`) AND a `box-shadow` whose color has channel spread ≥30 and blur >4px.
  Fix: subtle purposeful lighting, or skip the dark theme.
- **AR-07** `icon-tile-stack` BLOCK — Detector: previous sibling of h1–h6 that is 32–128px on both axes, aspect 0.7–1.4, visible bg/border, radius < width/2 (excludes circular avatars), containing a smaller `<svg>`/icon.
  Fix: side-by-side icon + heading, or icon in flow without its own container.
- **AR-08** `italic-serif-display` BLOCK — Detector: italic serif h1 (h2 if ≥48px) at ≥48px, face in the known-serif set or stack ending in generic `serif`.
  Fix: set roman or use a non-serif display face (a genuine editorial register may justify it — judge context).
- **AR-09** `hero-eyebrow-chip` BLOCK — Detector: tiny label directly above the h1, text 2–60 chars, font-size ≤14px; branch A: uppercase + letter-spacing ≥1.6px; branch B: weight ≥700 + chromatic accent color.
  Fix: drop the eyebrow, fold the kicker into the headline, or make it a breadcrumb.
- **AR-10** `repeated-section-kickers` ADVISORY — Detector: ≥3 eyebrow-style labels (AR-09 gates) above h2–h6 across one page.
  Fix: stronger structure, artifacts, imagery, or a deliberate named brand system.
- **AR-11** `numbered-section-markers` ADVISORY — Detector: ≥3 distinct zero-padded numbers (01–12) in page text with ≥2 sequential steps.
  Fix: numbers only when the section IS a real sequence; otherwise a different cadence.
- **AR-12** `gpt-thin-border-wide-shadow` ADVISORY (upstream gated `--gpt`) — Detector: ≥2 visible borders each ≤1.5px (alpha ≥0.28) + box-shadow max blur ≥16px (alpha ≥0.12).
  Fix: commit to one — defined edge OR soft elevation, never both as decoration.
- **AR-13** `repeating-stripes-gradient` ADVISORY (upstream gated `--gpt`) — Detector: `repeating-linear/radial/conic-gradient` used as surface decoration.
  Fix: deliberate texture or plain surface.

## B — Typography

- **AR-14** `overused-font` BLOCK — Detector: primary face in the monoculture set: Inter, Roboto, Open Sans, Lato, Montserrat, Arial, Helvetica, Fraunces, Instrument Sans/Serif, Geist (+Sans/Mono), Mona Sans, Plus Jakarta Sans, Space Grotesk, Recoleta.
  Fix: run SKILL.md `<font_selection_procedure>` (brand fonts allowed on their own domains).
- **AR-15** `single-font` BLOCK — Detector: exactly one non-generic family across the whole page (page ≥20 elements / file ≥20 lines; generic tokens excluded).
  Fix: pair a distinctive display face with a refined body face.
- **AR-16** `flat-type-hierarchy` BLOCK — Detector: ≥3 distinct font sizes whose max/min ratio < 2.0.
  Fix: fewer sizes, more contrast (≥1.25 between steps).
- **AR-17** `oversized-h1` BLOCK — Detector: h1 ≥72px AND text ≥40 chars (runtime also requires viewport dominance: height ≥28vh or area ≥25%).
  Fix: set long headlines smaller or tighten the copy (punchy 1–2-word headlines at that size are fine).
- **AR-18** `extreme-negative-tracking` BLOCK — Detector: letter-spacing ≤ -0.05em on text >20 chars (Tailwind `tracking-tighter` = -0.05em, exactly at the line).
  Fix: tighten display type optically (-0.02 to -0.03em), not destructively.
- **AR-19** `tight-leading` BLOCK — Detector: line-height/font-size ratio < 1.3 on non-heading text >50 chars.
  Fix: 1.5–1.7 for body text. Heading/display line-height of 1.05–1.2 is correct typography, NOT a violation — the grep cannot tell headings from body, so heading-vs-body is a visual-judgment call: confirm any hit by eye and only rewrite leading on body copy.
- **AR-20** `justified-text` BLOCK — Detector: `text-align: justify` without `hyphens: auto`.
  Fix: left-align body text, or enable `hyphens: auto`.
- **AR-21** `tiny-text` BLOCK — Detector: body content <12px with >20 chars (skips sub/sup/code/kbd/caption/figcaption and UI contexts: buttons, nav, footer, badge/chip/pill/tag/label/meta, uppercase labels).
  Fix: ≥14px body minimum, 16px ideal.
- **AR-22** `all-caps-body` BLOCK — Detector: `text-transform: uppercase` on non-heading text >30 chars.
  Fix: reserve uppercase for short labels and headings.
- **AR-23** `wide-tracking` BLOCK — Detector: letter-spacing > 0.05em on non-uppercase text >20 chars.
  Fix: wide tracking only for short uppercase labels.
- **AR-24** `line-length` BLOCK (runtime-only) — Detector: text element rendering >~80 chars/line (estimate `rect.width / (fontSize * 0.5)`, threshold lineMax+5; applies to p/li/td/th/dd/blockquote/figcaption).
  Fix: `max-width: 65ch`–`75ch` on text containers.

## C — Layout & spacing

- **AR-25** `nested-cards` BLOCK (runtime-only) — Detector: card-like element (shadow|border + radius|bg, ≥10 chars text, not positioned/popover) with a card-like ancestor; only the innermost is flagged.
  Fix: flatten — spacing, typography, dividers instead of nested containers.
- **AR-26** `monotonous-spacing` BLOCK — Detector: ≥10 spacing values (padding/margin/gap px, rem×16, Tailwind scale ×4) rounded to 4px buckets; one bucket >60% of all values AND ≤3 unique non-zero values.
  Fix: tight groupings for related items, generous separations between sections.
- **AR-27** `cramped-padding` BLOCK — Detector: text inside a visible boundary with padding below threshold — vertical: max(4px, fontSize×0.3); horizontal: max(8px, fontSize×0.5) — or a container whose text-bearing children sit flush (≤2px padding, no child insulation ≥4px) against a visible border/bg.
  Fix: ≥8px (ideally 12–16px) padding inside bordered/outlined/colored containers.
- **AR-28** `body-text-viewport-edge` BLOCK (runtime-only) — Detector: `<p>`/`<li>` >40 chars, width >50% viewport, rect.left <16px or rect.right > viewport−16px, no own bg, not in nav/header.
  Fix: container with ≥16px (ideally 24–32px) horizontal padding, or `max-width` + `mx-auto`.
- **AR-29** `text-overflow` BLOCK (runtime-only) — Detector: element with direct text where `scrollWidth − clientWidth ≥ 16px` and no scroll region on itself or ancestors.
  Fix: let text wrap, constrain widths, or a deliberate scroll affordance; test heading copy at every breakpoint.
- **AR-30** `clipped-overflow-container` BLOCK — Detector: `overflow: hidden|clip` (non-scroll) container wrapping an absolute/fixed descendant that escapes or implies escape (negative/100% inset); skips carousels/marquees/sliders and decorative children.
  Fix: `overflow: visible`, native `<dialog>`/popover API, `position: fixed`, or a portal.

## D — Accessibility

- **AR-31** `low-contrast` BLOCK (runtime-only) — Detector: WCAG AA failure — contrast < 4.5:1 body, < 3:1 large text (≥24px, or ≥18.67px bold ≥700); effective bg resolved by ancestor walk, gradient worst-case stop.
  Fix: bump body color toward the ink end of the ramp.
- **AR-32** `gray-on-color` BLOCK — Detector: achromatic text (chroma <20, luminance 0.05–0.85) on chromatic bg (chroma ≥40; every gradient stop chromatic).
  Fix: darker shade of the background's own hue, or transparency of the text color.
- **AR-33** `skipped-heading` BLOCK — Detector: heading level jumps >1 in document order (h1 → h3 with no h2).
  Fix: sequential heading hierarchy — screen readers navigate by outline.
- **AR-34** `broken-image` BLOCK — Detector: `<img>` with empty/`#`/whitespace src, or no src attribute at all.
  Fix: real images, generated assets, or remove the tag.

## E — Motion

- **AR-35** `bounce-easing` BLOCK — Detector: animation-name matching bounce/elastic/wobble/jiggle/spring; Tailwind `animate-bounce`; overshoot `cubic-bezier` with y1 or y2 outside [-0.1, 1.1].
  Fix: exponential ease-out (quart/quint/expo) — real objects decelerate smoothly.
- **AR-36** `layout-transition` BLOCK — Detector: `transition`/`transition-property` listing width/height/min-/max- variants/padding/margin (a bare `all` is NOT flagged).
  Fix: transform + opacity; `grid-template-rows` for height animation.
- **AR-37** `image-hover-transform` ADVISORY (upstream gated `--gemini`) — Detector: `img…:hover { transform: scale|rotate|translate|matrix|skew }` or Tailwind `hover:scale-/rotate-/translate-/skew-` on an `<img>` class (incl. group-hover).
  Fix: animate the card's background, border, or shadow — never the image, never via the image's parent.

## F — Content

- **AR-38** `em-dash-overuse` BLOCK — Detector: ≥5 em-dashes (— or `--` followed by non-space) in stripped body text (upstream prose says "more than two"; the code threshold is 5 — 5 governs).
  Fix: commas, colons, periods, parentheses.
- **AR-39** `marketing-buzzword` BLOCK — Detector: any of 28 SaaS phrases in body text (streamline your, empower your, supercharge your, unleash your/the power, leverage the power, built for the modern, trusted by leading/the world, best-in-class, industry-leading, world-class, enterprise-grade, next-generation, cutting-edge, transform your business, revolutionize, game-changer/changing, mission-critical, best of breed, future-proof, seamless experience, seamlessly integrate, drive engagement/growth/results, harness the power).
  Fix: a specific verb and noun that says what the product literally does.
- **AR-40** `aphoristic-cadence` BLOCK — Detector: ≥3 total per page of manufactured contrast `Not a/an X. Y.` OR short rebuttal `Sentence. No/Just y.`
  Fix: make the specific claim instead — once is fine; the pattern is the tell.
- **AR-41** `theater-slop-phrase` ADVISORY (upstream gated `--gpt`) — Detector: `\b\w+\s+theater\b` in body text.
  Fix: say plainly what the thing does or does not do.
- **AR-42** `placeholder-copy` BLOCK (ATLAS addition) — Detector: lorem-ipsum text, bracketed placeholders (`[placeholder]`, `[TODO]`, `[your X here]`), or TODO/FIXME/TBD stand-in copy in rendered text.
  Fix: write the real copy before presenting — this is the teeth of the real-content rule; never ship stand-in text.

## G — 2026 tells (ATLAS additions)

Net-new patterns the upstream 41 + AR-42 don't reach. All ADVISORY (heuristic + runtime-confirmed), so they never block on a false positive. Deliberately NOT added: a "Space Grotesk + Instrument Serif + Geist triad" rule — each face is already an AR-14 BLOCK on its own, so a triad rule would be redundant.

- **AR-43** `caps-label-overuse` ADVISORY — Detector: ≥5 elements per page with uppercase styling on SHORT text (≤30 chars — the length AR-22 deliberately does NOT block). One or two genuine labels are fine; a page peppered with tiny all-caps chips is the 2026 tell.
  Fix: reserve uppercase for 1–2 real labels; vary the cadence (sentence-case kickers, weight, size).
- **AR-44** `emoji-nav-icon` ADVISORY — Detector: an emoji glyph used as a UI icon inside `<nav>`/`<aside>`/sidebar/menu markup. Emoji-as-icon reads as unfinished and renders inconsistently across platforms.
  Fix: one real icon family (Lucide / Phosphor / Tabler), single stroke weight — see imagery-and-assets.md.
- **AR-45** `identical-feature-card-grid` ADVISORY (runtime/eyeball) — Detector: ≥3 sibling cards each = icon + heading + blurb, same size, in one row/grid (the interchangeable "feature-card wall"). AR-07 flags a single icon-tile; this is the *repetition*, which needs the rendered DOM to confirm uniformity.
  Fix: vary the cards (bento sizes, real imagery, different content shapes), or drop the grid for prose + one strong artifact.
- **AR-46** `dark-muted-low-contrast` ADVISORY — Detector (two-step, like AR-06): a dark surface (`bg-{gray|slate|zinc|neutral|stone}-{900,950}`, or an all-channel-<60 bg) AND muted body text at `text-{…}-{400,500,600}`. The most-measured 2026 dark-mode tell: muted gray on near-black drops below AA.
  Fix: lift muted text toward the light end on dark surfaces; confirm ≥4.5:1 at runtime (AR-31).

Porting notes: page-level analyzers (AR-06, 10, 11, 15, 16, 26, 38, 39, 40) evaluate complete
pages, not fragments — run them per full HTML file. Dedup findings with the same rule + snippet
within 2 lines. Border/color/motion checks skip safe tags (blockquote, nav, a, input, pre, code,
span, td/th/tr, li, button, hr; borders re-allow `label`) — review grep hits against that list.

---

## Grep sheet

**MANDATORY CANARY — run BEFORE trusting any zero-hit result.** A clean sheet is only valid if the toolchain demonstrably detects a violation:

```bash
echo 'border-left: 4px solid red' | rg 'border-(left|right):\s*[2-9]px'   # MUST print the line
```

**If the canary does not match, the toolchain is broken (rg missing, shimmed, or exiting 127) and ALL zero-hit results are VOID — do not present them.** Known trap: in Claude Code, `rg` can be a shell *function* (a shim to the bundled ripgrep) that child bash scripts do not inherit — running the sheet via a saved script file silently 127s every rule and reports a false-clean ZERO. Run the sheet in the interactive shell, never via a child script.

```bash
# Helpers — run from the project root. S = source+styles; C = rendered-copy files.
S() { rg -n "$@" -g '!node_modules' -g '*.{css,scss,html,js,jsx,ts,tsx,vue,svelte,astro,mdx}' .; }
C() { rg -n "$@" -g '!node_modules' -g '*.{html,md,mdx,jsx,tsx,vue,svelte,astro}' .; }

# A — AI-tells
S '\bborder-[lrse]-([4-9]|\d{2,})\b'                                  # AR-01 Tailwind (>=1 also fails if same line has \brounded)
S 'border-(left|right)\s*:\s*([3-9]|\d{2,})px\s+solid'                # AR-01 CSS (>=1px fails if rule has border-radius; skip neutral colors)
S 'border-inline-(start|end)(-width)?\s*:\s*([3-9]|\d{2,})px'         # AR-01 logical properties
S 'border(Left|Right)\s*[:=]\s*.([3-9]|\d{2,})px solid'               # AR-01 JSX inline style
S '\brounded\S*.*\bborder-[tb]-[1-9]\b|\bborder-[tb]-[1-9]\b.*\brounded'  # AR-02 Tailwind
S 'border-(top|bottom)\s*:\s*([3-9]|\d{2,})px\s+solid'                # AR-02 CSS (fails only if rule also sets border-radius)
S '(-webkit-)?background-clip\s*:\s*text'                             # AR-03 (fails if gradient within +/-200 chars)
S '\bbg-clip-text\b'                                                  # AR-03 Tailwind (fails if same line has bg-gradient-to-)
S '#(7c3aed|8b5cf6|a855f7|9333ea|7e22ce|6d28d9|6366f1|764ba2|667eea)\b'   # AR-04 hex tells
S '\bfrom-(purple|violet|indigo)-\d+\b.*\bto-(purple|violet|indigo|blue|cyan|pink|fuchsia)-\d+\b'  # AR-04 gradient
S '\btext-(purple|violet|indigo)-\d+\b'                               # AR-04 (fails on lines with <h[1-3] or text-[2-9]xl)
S '\bbg-(amber|orange|yellow)-(50|100)\b|\bbg-stone-(50|100|200)\b|--(paper|cream|sand|bone|linen|parchment)\b'  # AR-05 (verify hex via warmth formula)
S '\bbg-(gray|slate|zinc|neutral|stone)-(800|9\d{2})\b'               # AR-06 step 1 (step 2: box-shadow chroma spread >=30 AND blur >4px)
S -U 'class="[^"]*\brounded[^"]*"\s*>\s*<svg[\s\S]{0,300}?<h[1-6]'    # AR-07 heuristic (confirm geometry at runtime)
S 'font-style\s*:\s*italic'                                           # AR-08 CSS (fails when face is a known serif at >=48px display size)
S '\bitalic\b.*\bfont-serif\b.*\btext-[5-9]xl\b'                      # AR-08 Tailwind
S -U '\buppercase\b[^"]*\btracking-(wide|wider|widest)\b[\s\S]{0,200}?<h1'  # AR-09 (>=3 hits per page also fires AR-10)
S 'text-transform\s*:\s*uppercase;?\s*letter-spacing\s*:\s*0\.(0[5-9]|[1-9])'  # AR-09 CSS branch
C -P '(?<![.\d])0[1-9]\b'                                             # AR-11 zero-padded copy markers (01/02...); needs -P (PCRE2 lookbehind); lookbehind excludes decimals like 0.05 -> "05" (fails at >=3 distinct values forming a run)
S 'border\s*:\s*1(\.5)?px\s+solid'                                    # AR-12 (fails if box-shadow blur >=16px co-occurs)
S 'repeating-(linear|radial|conic)-gradient\s*\('                     # AR-13

# B — Typography
S 'font-family\s*:\s*.?.?(Inter|Roboto|Open Sans|Lato|Montserrat|Arial|Helvetica|Fraunces|Geist( Sans| Mono)?|Mona Sans|Plus Jakarta Sans|Space Grotesk|Recoleta|Instrument (Sans|Serif))\b'  # AR-14 CSS
S 'fonts\.googleapis\.com/css2?\?family=(Inter|Roboto|Open\+Sans|Lato|Montserrat|Fraunces|Plus\+Jakarta\+Sans|Space\+Grotesk|Instrument\+(Sans|Serif)|Mona\+Sans|Geist)\b'  # AR-14 Google Fonts
S 'font-family\s*:\s*([^;}]+)'                                        # AR-15 harvest — dedupe non-generics; fail if set size == 1
S 'font-size\s*:\s*[\d.]+(px|rem|em)|\btext-(xs|sm|base|lg|[2-9]?xl)\b'   # AR-16 harvest — fail if >=3 sizes and max/min < 2.0
S 'font-size\s*:\s*([7-9]\d|\d{3,})px|\btext-[789]xl\b'               # AR-17 on h1 (then confirm text >=40 chars)
S 'letter-spacing\s*:\s*-0?\.(0[5-9]|[1-9])\d*em|\btracking-tighter\b'    # AR-18
S 'line-height\s*:\s*(0?\.\d+|1(\.[0-2]\d*)?)\s*[;}!]|\bleading-(none|tight|[3-5])\b'  # AR-19 unitless <1.3 (confirm long non-heading text)
S 'text-align\s*:\s*justify|\btext-justify\b'                         # AR-20 (passes only with hyphens: auto in the same rule)
S 'font-size\s*:\s*(\d|1[01])px\b|font-size\s*:\s*0?\.[0-6]\d*rem|text-\[(\d|1[01])px\]'  # AR-21
S 'text-transform\s*:\s*uppercase|\buppercase\b'                      # AR-22 (fails on non-heading copy >30 chars)
S 'letter-spacing\s*:\s*0?\.(0[6-9]|[1-9])\d*em|\btracking-(wide|wider|widest)\b'  # AR-23 (fails on non-uppercase body text >20 chars)

# C — Layout & spacing
S '(padding|margin)(-(top|right|bottom|left))?\s*:\s*\d+px|gap\s*:\s*\d+px|\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap)-\d+\b'  # AR-26 harvest — 4px buckets; fail if one bucket >60% AND <=3 unique non-zero
S 'padding\s*:\s*0(px)?\s*[;}]|\bp-0\b'                               # AR-27 heuristic (only on elements also declaring border/bg; confirm at runtime)
S 'overflow(-[xy])?\s*:\s*(hidden|clip)'                              # AR-30 (fails when wrapping absolute/fixed child with negative inset)

# D — Accessibility
S '\btext-(gray|slate|zinc|neutral|stone)-\d+\b.*\bbg-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b'  # AR-32
S -U '<h1[\s>][\s\S]*?<h3[\s>]'                                       # AR-33 heuristic (fails if no <h2 between; DOM walk is exact)
S "<img\b[^>]*\bsrc\s*=\s*(\"\"|''|\"#\"|'#')"                        # AR-34 empty/# src
S -P '<img\b(?:(?!\bsrc\s*=)[^>])*>'                                  # AR-34 no-src variant (needs --pcre2)

# E — Motion
S '\banimate-bounce\b|animation(-name)?\s*:\s*[^;]*\b(bounce|elastic|wobble|jiggle|spring)\b'  # AR-35
S 'cubic-bezier\('                                                    # AR-35 overshoot — fail if 2nd/4th arg outside [-0.1, 1.1]
S 'transition(-property)?\s*:\s*[^;{}]*\b((max-|min-)?(width|height)|padding|margin)\b'  # AR-36 (skip lines whose value list contains \ball\b)
S -U '\bimg\b[^,{}]*:hover\b[^{}]*\{[^}]*\btransform\s*:\s*(scale|rotate|translate|matrix|skew)'  # AR-37 CSS
S '<img\b[^>]*class\s*=\s*"[^"]*\b(group-)?hover:(scale|rotate|translate|skew)-'  # AR-37 Tailwind

# F — Content (rendered copy only — ignore hits inside code comments)
C -c '\x{2014}'                                                       # AR-38 count per file; fail at >=5 (also `--` followed by non-space). Use \x{2014}, never a literal em dash: literal multibyte patterns get mangled by Windows/msys codepage argv conversion and silently match nothing
C -i 'streamline your|empower your|supercharge your|unleash (your|the power)|leverage the power|built for the modern|trusted by (leading|the world)|best-in-class|industry-leading|world-class|enterprise-grade|next-generation|cutting-edge|transform your business|revolutioniz|game.chang|mission-critical|best of breed|future.proof|seamless experience|seamlessly integrate|drive (engagement|growth|results)|harness the power'  # AR-39
C '\bNot an? [a-z][^.!?]{1,40}[.!]\s+[A-Z][^.!?]{1,60}[.!]|\b[A-Z][^.!?]{4,80}[.!]\s+(No|Just)\s+[a-z][^.!?]{2,60}[.!]'  # AR-40 (fail at >=3 combined per page)
C -i '\b\w+\s+theater\b'                                              # AR-41
C -i 'lorem ipsum|\bdolor sit amet\b'                                 # AR-42 lorem-ipsum
C -i '\[(placeholder|todo|tbd|insert [^\]]{1,40}|your [^\]]{1,40} here)\]'  # AR-42 bracketed placeholder
C '\b(TODO|FIXME|TBD)\b'                                              # AR-42 TODO-copy in rendered text

# G — 2026 tells (ATLAS additions)
S -c 'text-transform\s*:\s*uppercase|\buppercase\b'                  # AR-43 count per file; ADVISORY at >=5 SHORT (<=30-char) labels (the >30-char hits are AR-22's BLOCK)
S -U -P '<(nav|aside)\b[\s\S]{0,3000}?[\x{1F300}-\x{1FAFF}]'         # AR-44 emoji-as-nav-icon; \x{} ranges ONLY + PCRE2 (-P) — a literal emoji argv gets codepage-mangled and silently matches nothing
S 'text-(gray|slate|zinc|neutral|stone)-(400|500|600)\b'            # AR-46 step 2 dim muted text — ADVISORY if the page also hits the AR-06 dark-bg line; confirm <4.5:1 at runtime (AR-31)
```

## Visual-judgment subset

These rules have no faithful static pattern — verify them by eye or live DOM (Claude Browser
screenshot / browser inspect) on the rendered page:

- **AR-24** line-length — paragraphs visibly wider than ~80 chars/line; look for prose containers with no `max-width`/`max-w-*ch`.
- **AR-25** nested-cards — a shadowed/bordered rounded box sitting inside another; flatten the innermost.
- **AR-28** body-text-viewport-edge — body copy touching the left/right viewport edge (<16px gutter) at any breakpoint.
- **AR-29** text-overflow — clipped or horizontally escaping text, especially long headings at narrow widths.
- **AR-31** low-contrast — squint test plus a contrast checker on body text vs effective background (4.5:1 body, 3:1 large per AR-31 thresholds).
- **AR-45** identical-feature-card-grid — ≥3 interchangeable icon+heading+blurb cards in a row at the same size; vary them (bento) or replace the grid with prose + one strong artifact.
- **AR-47** hero-subject-mismatch — the hero image/video must DEPICT what the adjacent headline/copy claims (the solar-company-hero-showing-windmills tell). Name what the image literally shows, compare to the claim: a specific product claim over generic stock ("person at laptop", unrelated scenery) is a fail. Eyeball-only — check the rendered hero, at minimum on the home page and any landing page. (Added 2026-07-17 from the design-brief deltas; the top image-complaint in the source QA threads.)

Additionally, these grep-detected rules need a manual confirmation step after a hit:
AR-05 (warmth formula on hex), AR-06 (shadow chroma + blur), AR-08 (display size), AR-15/AR-16/AR-26
(set-size, ratio, histogram math on the harvest), AR-17 (text length), AR-38/AR-40 (counts),
AR-43 (count ≥5 AND short), AR-44 (emoji is actually used as an icon), AR-46 (dark bg co-occurs; confirm contrast at runtime).
