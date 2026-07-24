# Brand Assets

Logos, marks, fonts, and other non-code brand resources live here. The folder is intentionally small — this system is a starting point, not a finished identity.

## Contents

- `logo-mark.svg` — placeholder square mark. Replace with the real wordmark + mark when they exist.
- `fonts/` — font loading guidance. See `fonts/README.md`.

## Guidelines when you add real assets

- **SVG over PNG.** Logos must be vector. Export optimized (SVGO) with descriptive `aria-label`.
- **No raster favicons.** Use SVG favicon + PNG fallbacks generated from it, not the other way around.
- **Two marks, one voice.** Ship a full wordmark + a square mark (for avatars, app icons). Don't stretch the wordmark.
- **Accessible contrast.** Every mark color must meet WCAG AA on both paper (`#FBF8F3`) and ink (`#0F0D0A`) backgrounds.
- **File names.** `logo-wordmark.svg`, `logo-mark.svg`, `favicon.svg`, `og-default.png` (1200×630). No spaces, no version suffixes.

## What belongs elsewhere

- Component-level illustrations → inline SVG in the component file.
- Content photography → project's `public/images/` folder, not here.
- Icon sets → use `iconify` MCP or `lucide-react`, don't commit icon sprites.
