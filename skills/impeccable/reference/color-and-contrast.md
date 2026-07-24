# Color & Contrast

## Color Spaces: Use OKLCH

**Stop using HSL.** Use OKLCH (or LCH) instead. It's perceptually uniform, meaning equal steps in lightness *look* equal—unlike HSL where 50% lightness in yellow looks bright while 50% in blue looks dark.

The OKLCH function takes three components: `oklch(lightness chroma hue)` where lightness is 0-100%, chroma is roughly 0-0.4, and hue is 0-360. To build a primary color and its lighter / darker variants, hold the chroma+hue roughly constant and vary the lightness — but **reduce chroma as you approach white or black**, because high chroma at extreme lightness looks garish.

The hue you pick is a brand decision and should not come from a default. Do not reach for blue (hue 250) or warm orange (hue 60) by reflex — those are the dominant AI-design defaults, not the right answer for any specific brand.

## Building Functional Palettes

### Tinted Neutrals

**Pure gray is dead.** A neutral with zero chroma feels lifeless next to a colored brand. Add a tiny chroma value (0.005-0.015) to all your neutrals, hued toward whatever your brand color is. The chroma is small enough not to read as "tinted" consciously, but it creates subconscious cohesion between brand color and UI surfaces.

The hue you tint toward should come from THIS project's brand, not from a "warm = friendly, cool = tech" formula. If your brand color is teal, your neutrals lean toward teal. If your brand color is amber, they lean toward amber. The point is cohesion with the SPECIFIC brand, not a stock palette.

**Avoid** the trap of always tinting toward warm orange or always tinting toward cool blue. Those are the two laziest defaults and they create their own monoculture across projects.

### Palette Structure

A complete system needs:

| Role | Purpose | Example |
|------|---------|---------|
| **Primary** | Brand, CTAs, key actions | 1 color, 3-5 shades |
| **Neutral** | Text, backgrounds, borders | 9-11 shade scale |
| **Semantic** | Success, error, warning, info | 4 colors, 2-3 shades each |
| **Surface** | Cards, modals, overlays | 2-3 elevation levels |

**Skip secondary/tertiary unless you need them.** Most apps work fine with one accent color. Adding more creates decision fatigue and visual noise.

### The 60-30-10 Rule (Applied Correctly)

This rule is about **visual weight**, not pixel count:

- **60%**: Neutral backgrounds, white space, base surfaces
- **30%**: Secondary colors—text, borders, inactive states
- **10%**: Accent—CTAs, highlights, focus states

The common mistake: using the accent color everywhere because it's "the brand color." Accent colors work *because* they're rare. Overuse kills their power.

### Live preview & export: Realtime Colors

Once you've designed the palette here (OKLCH, tinted neutrals, roles) — **NOT before** — you can hand the user an instant live preview of it on a real UI template, and pull framework exports, via [Realtime Colors](https://www.realtimecolors.com/). This is a **preview/export tool, not a palette source**: never use it to *pick* colors (auto-generated palettes are the AI-slop the audit bans) — only to *visualize and export the palette you already designed*.

Build the share link by mapping your tokens to its 5 visible roles (hex, no `#`, hyphen-joined, in this order): **text – background – primary – secondary – accent**:

```
https://www.realtimecolors.com/?colors=<text>-<bg>-<primary>-<secondary>-<accent>&fonts=<Heading>-<Body>
```

e.g. `?colors=0f1a17-f7faf9-0f7a68-d6ece7-c2703d&fonts=Clash+Display-Cabinet+Grotesk` (spaces in a font name → `+`). The example deliberately models the rules above: tinted neutrals rather than pure gray, a brand hue that is **not** reflex-blue, and two faces that clear `reflex_fonts_to_reject`. That view also exports CSS variables, Tailwind config, and shadcn/DaisyUI/MUI presets — a quick cross-check, but impeccable's `@theme` token emit stays authoritative.

## Contrast & Accessibility

### WCAG Requirements

| Content Type | AA Minimum | AAA Target |
|--------------|------------|------------|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+ or 14px bold) | 3:1 | 4.5:1 |
| UI components, icons | 3:1 | 4.5:1 |
| Non-essential decorations | None | None |

**The gotcha**: Placeholder text still needs 4.5:1. That light gray placeholder you see everywhere? Usually fails WCAG.

### The opacity-muting trap (muted text on light / warm paper)

The most common way "muted" text gets built — taking the ink color and lowering its **opacity** (`text-base-content/55`, `oklch(var(--bc) / 0.5)`, `rgba(…, .6)`) — is also the most common way it silently fails AA. On a near-white or warm-paper background, **alpha loses contrast faster than a darker solid hue does**: muting ink to `/0.50`–`/0.66` routinely lands at 3:1–4:1 even though it "looks readable," because the background bleeds through. It passes the eye and fails the meter.

Practical rules for any text-led / editorial UI on light paper:

- **Set a hard floor.** Never render normal-size body or meta text below ≈`/0.70` of the ink (≈4.9:1 on a 97%-L paper). Reserve `/0.55`–`/0.60` strictly for genuinely decorative meta that no one needs to read. Headings/titles stay at full ink.
- **Prefer a darker hue over more transparency.** If muted text is too weak, darken the token (drop its lightness, or use a darker slate) rather than nudging opacity up — alpha is the lossier lever.
- **Watch colored status/label text most.** Small uppercase tracked labels in a semantic color (a `warning` ochre, an `info` slate) are the lowest-contrast text on most pages. A "muted ochre" at ~62%-L on paper fails; darken the *token* (e.g. 62%→53% L) and the dot (if `currentColor`) and the label both clear AA at once.
- **Verify against every surface the text sits on.** A value that passes on `base-100` can fail on the lighter `base-200`/card surface. Check both.

This is the concrete form of "Alpha Is A Design Smell" (below) for the muted-text case, and it's invisible to the aesthetic to fix — you're changing numbers, not the design language.

### Dangerous Color Combinations

These commonly fail contrast or cause readability issues:

- Light gray text on white (the #1 accessibility fail)
- **Gray text on any colored background**—gray looks washed out and dead on color. Use a darker shade of the background color, or transparency
- Red text on green background (or vice versa)—8% of men can't distinguish these
- Blue text on red background (vibrates visually)
- Yellow text on white (almost always fails)
- Thin light text on images (unpredictable contrast)

### Never Use Pure Gray or Pure Black

Pure gray (`oklch(50% 0 0)`) and pure black (`#000`) don't exist in nature—real shadows and surfaces always have a color cast. Even a chroma of 0.005-0.01 is enough to feel natural without being obviously tinted. (See tinted neutrals example above.)

### Testing

Don't trust your eyes — and don't trust a spec sheet either: on a real client build a gray was asserted AA-passing in five separate specs and measured 4.21:1 on one of its two grounds. Compute every shipped pair from the real tokens:

```bash
node ~/.claude/skills/impeccable/scripts/check-contrast.mjs --init --css src/index.css  # once: scaffold contrast-pairs.json
node ~/.claude/skills/impeccable/scripts/check-contrast.mjs                             # every build: nonzero exit on any failure
```

Enumerate **pairs, not colours** (both grounds for every ink — the failure above passed on one ground and failed on the other), and record catastrophic combos in `banned` (legal CSS, visually broken — e.g. a dark ink on a full-bleed accent field at 2.05:1). Wire it as `npm run check:contrast` so it runs in CI. Handles OKLCH and `light-dark()` — pairs must pass in BOTH schemes.

Secondary tools:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) for one-off checks
- Browser DevTools → Rendering → Emulate vision deficiencies
- [Polypane](https://polypane.app/) for real-time testing

## Theming: Light & Dark Mode

### Dark Mode Is Not Inverted Light Mode

You can't just swap colors. Dark mode requires different design decisions:

| Light Mode | Dark Mode |
|------------|-----------|
| Shadows for depth | Lighter surfaces for depth (no shadows) |
| Dark text on light | Light text on dark (reduce font weight) |
| Vibrant accents | Desaturate accents slightly |
| White backgrounds | Never pure black—use dark gray (oklch 12-18%) |

In dark mode, depth comes from surface lightness, not shadow. Build a 3-step surface scale where higher elevations are lighter (e.g. 15% / 20% / 25% lightness). Use the SAME hue and chroma as your brand color (whatever it is for THIS project — do not reach for blue) and only vary the lightness. Reduce body text weight slightly (e.g. 350 instead of 400) because light text on dark reads as heavier than dark text on light.

### Token Hierarchy

Use two layers: primitive tokens (`--blue-500`) and semantic tokens (`--color-primary: var(--blue-500)`). For dark mode, only redefine the semantic layer—primitives stay the same.

## Alpha Is A Design Smell

Heavy use of transparency (rgba, hsla) usually means an incomplete palette. Alpha creates unpredictable contrast, performance overhead, and inconsistency. Define explicit overlay colors for each context instead. Exception: focus rings and interactive states where see-through is needed.

## @theme token hierarchy (Tailwind v4)

The two-layer hierarchy above generalizes to three tiers inside a Tailwind v4 `@theme` block:

1. **Brand primitives** — raw OKLCH values, named `--color-brand-*`. The only tier where literal `oklch(...)` appears.
2. **Semantic roles** — `--color-surface`, `--color-text-muted`, `--color-accent`. These reference primitives, never raw values. Components consume semantic utilities (`bg-surface`), never raw palette classes (`bg-blue-500`).
3. **Component tokens** — only when a specific component genuinely needs an override. Don't pre-create them.

Naming rules:

- Namespace prefixes drive utility generation: `--color-*` → color utilities, `--radius-*` → radius scale, `--font-*` → font families.
- Every surface token gets a `-foreground` partner (`primary`/`primary-foreground`, `muted`/`muted-foreground`) so each contrast decision is made once, at the token level.
- Dark mode re-assigns the same token names in a `.dark { }` block — semantic tier only; primitives stay put (matching the Token Hierarchy rule above).

**Alpha ramp from one token.** Instead of hand-picking tints, fan a single brand token into a full transparency ramp with `color-mix()` inside `@theme`:

```css
@theme {
  --color-primary-50:  color-mix(in oklab, var(--color-primary) 5%, transparent);
  --color-primary-100: color-mix(in oklab, var(--color-primary) 10%, transparent);
  --color-primary-200: color-mix(in oklab, var(--color-primary) 20%, transparent);
  /* ...continue the scale as needed */
}
```

This is the sanctioned exception to "Alpha Is A Design Smell" above: the ramp is explicit, defined once, and derived from the palette — not scattered ad-hoc rgba calls.

Token architecture adapted from wshobson/agents tailwind-design-system @ cf6059d (MIT).

---

**Avoid**: Relying on color alone to convey information. Creating palettes without clear roles for each color. Using pure black (#000) for large areas. Skipping color blindness testing (8% of men affected).
