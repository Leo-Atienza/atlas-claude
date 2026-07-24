# Claude Design — Upload Guide

Step-by-step for the **"Set up your design system"** form.

## 1. Company name and blurb

Open `BLURB.md`. Copy the **Default** variant (or one of the alternates) and paste into the field.

## 2. Link code on GitHub

**Skip.** The system is local-only for now. If you later push it to GitHub, paste the URL here (`https://github.com/the user-the user/atelier-design-system`).

## 3. Link code from your computer

**Drag the whole `design-system/` folder** onto "Drag a folder here or browse."

Claude will copy the files it considers relevant — you don't need to pre-select. The folder is small enough (~22 files) that this is fast.

**What Claude reads here:**
- `tokens/*.ts` — source of truth for color, type, spacing, motion
- `tailwind.config.ts` + `globals.css` — how tokens map to classes
- `components/*.tsx` — canonical primitives with variants
- `examples/*.tsx` — how primitives compose into real sections
- `lib/cn.ts` — utility convention for merging classes

## 4. Upload a .fig file

**Skip.** No Figma file yet. Claude Design can round-trip code → Figma later if needed.

## 5. Add fonts, logos and assets

**Drag the contents of `design-system/brand/`** onto the assets zone. Specifically:
- `brand/logo-mark.svg`
- (Optional) any `.woff2` files you've dropped into `brand/fonts/`

## 6. Any other notes

Open `README.md`. Copy the **"Notes for Claude Design"** section (near the bottom) and paste into the notes field.

---

## After submission

Test with a small prompt first to confirm the system was parsed correctly:

> "Generate a simple about page with a hero and two feature cards, using the Atelier design system."

Verify the output:
- Serif display font for headings (Fraunces)
- Warm cream background, not pure white
- Accent color visible on primary CTAs (muted ochre, not saturated orange)
- Generous whitespace, tight radii
- No default shadcn/Material-style chrome

If any of those are off, revisit `tokens/colors.ts` or `tailwind.config.ts` and re-upload.
