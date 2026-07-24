# Imagery & Assets

> Original synthesis for this skill — no upstream source. Attribution ledger: ../NOTICE.md

## Why This Matters

Generic or uncanny imagery is the #2 AI-slop tell after typography. A page with a flawless type scale but a watermarked stock hero, a six-fingered AI portrait, or a wall of meaningless decorative blobs still screams "AI made this." Real, art-directed imagery — chosen for THIS brand, graded toward THIS palette — is what makes a site look human-made.

## The Decision Tree (Run BEFORE Sourcing Anything)

Decide the imagery *strategy* first. Opening a stock-photo search before choosing a strategy is how generic heroes happen. Pick exactly one primary approach:

1. **Real photography** — the product has physical subject matter (food, places, people, objects). Strongest emotional signal, highest sourcing effort. Must be graded toward the brand (see Treatment below) or it reads as pasted-in.
2. **Custom illustration** — the brand voice is playful, editorial, or hand-made. One consistent illustration style across the whole site; mixing styles is worse than none.
3. **3D** — load the threejs skill (SK-007). ONLY when it earns its place: a product configurator, a spatial concept, a hero where depth IS the message. 3D as ambient decoration is expensive slop.
4. **Abstract SVG/CSS compositions** — gradients-as-texture, grain, geometric pattern. Zero sourcing cost, infinitely brand-tintable, no licensing. The right default for dashboards, dev tools, and anything without photographable subject matter.
5. **Deliberately none** — typography-led design is a valid choice, not a failure state. A confident type system with generous space often beats mediocre imagery. Choose this on purpose, not by omission.

## Sourcing (Free)

### Photography

If an `unsplash` MCP server is registered, search it in-context — don't send the user off to a browser. Otherwise, source manually from Unsplash or Pexels.

**ALWAYS attribute per the Unsplash API guidelines**: photographer name + link to their profile, plus a link to Unsplash. Render it as visible credit near the image or in the footer:

```html
Photo by <a href="https://unsplash.com/@jane?utm_source=app&utm_medium=referral">Jane Doe</a>
on <a href="https://unsplash.com/?utm_source=app&utm_medium=referral">Unsplash</a>
```

No attribution, no image. This is non-negotiable even for prototypes.

### Icons

Use the iconify MCP. **ONE icon family per project** — Lucide OR Phosphor OR Tabler, never a mix. Mixed stroke weights across families is an instant tell. Match the stroke weight to the type: light text wants 1.5px strokes, bold display wants 2px.

### Logos

Third-party brand logos (integrations grid, "trusted by" rows): use 21st-dev `logo_search` when available. Never redraw or approximate a brand's mark.

### 3D, type & designed-imagery sources

Beyond photos and icons, the web-dev brain's shelf (`<your-vault-path>/wiki/web-dev/resources.md`) carries the source layer for art-directed raw material: **Poly Haven** (CC0 HDRIs / PBR / models — what makes a threejs scene look *rendered*, not shaded) and **Shapefest** (art-directed 3D render PNGs, no WebGL needed); **Fontshare / Velvetyne** (distinctive, ban-clearing display faces — the *pairing* still runs the font procedure + bans); **Lummi** (designed / AI illustration & 3D-render imagery, when the strategy is illustration, not photography). Check each license before shipping; 3D stays under the one-signature-effect rule.

### Self-Generated

Three recipes that need no sourcing at all. Each tints from `--brand-hue` so they inherit the project palette automatically.

**SVG grain** (feTurbulence) — kills the flat-gradient AI look on any surface:

```css
.grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.06; mix-blend-mode: overlay;
}
```

**Geometric pattern** — crisp at any size, no asset file. CSS repeating-gradient textures trip audit rule AR-13 — generate textures as inline SVG instead:

```css
.hatch {
  /* data-URI SVG cannot reference CSS variables — bake the brand hue in when generating */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Cpath d='M-2 16 L16 -2' stroke='oklch(55%25 0.10 60)' stroke-width='1' fill='none'/%3E%3C/svg%3E");
}
```

**CSS gradient mesh** — layered radial gradients as a hero texture; vary the hue offsets, never ship the purple-blue default:

```css
.mesh {
  background:
    radial-gradient(at 20% 25%, oklch(72% 0.10 var(--brand-hue)) 0, transparent 50%),
    radial-gradient(at 80% 15%, oklch(85% 0.05 calc(var(--brand-hue) + 35)) 0, transparent 55%),
    radial-gradient(at 55% 85%, oklch(62% 0.08 calc(var(--brand-hue) - 25)) 0, transparent 55%),
    oklch(96% 0.01 var(--brand-hue));
}
```

Pair the mesh with the grain overlay — texture is what separates "designed" from "generated." For the *animated*, brand-tinted version of this same backdrop — a gradient that slowly breathes behind the hero — see [signature-effects.md](signature-effects.md). It stays a one-per-page signature; this static mesh remains the safe default.

## Treatment

**Color-grade every photo toward the brand hue.** This is the same principle as tinting your neutrals — see `<color_principles>` in SKILL.md. An ungraded stock photo carries its own color cast and visibly doesn't belong. The compact recipe — a mild filter plus a multiply overlay in the brand color:

```css
.photo { position: relative; }
.photo img { display: block; filter: saturate(0.85) contrast(1.05); }
.photo::after {
  content: ""; position: absolute; inset: 0;
  background: oklch(45% 0.09 var(--brand-hue));
  mix-blend-mode: multiply; opacity: 0.25;
}
```

Push `opacity` toward 0.5–0.7 and desaturate the image fully (`filter: grayscale(1) contrast(1.1)`) for a duotone effect — strong, editorial, and unmistakably art-directed.

**Cutting a subject off its backdrop.** Studio shots that need the product/person free of its seamless background: the luminance flood-fill method in `wiki/web-dev/techniques/asset-pipelines.md` is the one that survives real skin tones — that page also documents why every filter/levels approach fails there, so you don't rediscover it. Prefer it over hand-masking when the backdrop is a clean studio sweep.

**Zero CLS.** Every image gets `aspect-ratio` in CSS plus explicit `width` and `height` attributes. A layout that jumps when images load is a broken layout.

**Meaningful alt text.** Describe the content: `alt="Barista pouring latte art in a sunlit café"`. Never `alt="image of..."`, never `alt="photo"`, never empty on content images. Decorative-only images get `alt=""` explicitly.

## The OG Image

The link preview is the first impression most visitors get — design it like a poster:

- **1200×630**, exactly.
- Brand background (palette surface + texture from the recipes above) + the real headline set in the project's display font.
- **Never a screenshot of the page.** Screenshots render as illegible thumbnails and signal zero care.
- One per site minimum; per-page variants for articles and products.

And the favicon must exist — a real glyph drawn from the brand mark or display font, never the framework default. A default Vite/Next favicon in the tab undoes everything else on the page.

## Anti-Slop Bans

Match-and-refuse. If you're about to ship any of these, stop and pick a different strategy from the decision tree:

- **"Diverse team laughing at laptop"** and every adjacent stock cliché — handshakes, whiteboard pointing, headset smiling. Instantly generic.
- **Uncanny AI-generated photos-of-people.** Hands, teeth, and eyes give it away; trust evaporates on sight. Real photo, illustration, or nothing.
- **Watermarked images.** A "Shutterstock" ghost across the hero is worse than an empty div.
- **Icon-above-every-heading.** Already banned in SKILL.md `<typography_rules>` — the imagery version of the same disease: decorative icons stapled to every card and section.
- **Unrelated decorative blobs.** Floating amorphous shapes that reference nothing in the brand. If a shape doesn't come from the logo, the product, or the pattern system, it doesn't ship.

---

**Avoid**: Mixing icon families or stroke weights. Skipping attribution "because it's a prototype." Shipping photos ungraded. OG images that are page screenshots. Default favicons. 3D that decorates instead of demonstrates.
