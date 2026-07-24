# NOTICE — svg-backgrounds (SK-147)

Created for the ATLAS web-dev system on 2026-07-20 (repo-integration round 3).

- **SVG recipes** (`reference/svg-recipes.md`): **authored** — original inline-SVG implementations that reproduce the *output families* of [Haikei](https://app.haikei.app/) (which has no API/npm/CLI). Technique-equivalent, not copied. Free to use/ship.
- **Generative-canvas** (`reference/generative-canvas.md`): algorithms **distilled from** `github:AThevon/genjutsu` `skills/_jutsu/canvas-generative/` — **MIT**, pinned `a2b8b0975f9506bd710f1d6b007d9e97188d6afe`. Credited at the top of the file.
- **SKILL.md**: authored router.

## Why authored, not vendored (Haikei)
Haikei is an interactive web app by z creative labs GmbH with **no programmatic surface** (no API, no npm, no official open-source core — the only GitHub hits are third-party tutorial clones). So it cannot be an in-loop dependency; instead Claude emits equivalent SVGs directly, and the live app remains a manual hand-tuning pointer.

## Vendored / authored files
| Path | Origin | Notes |
|---|---|---|
| `SKILL.md` | authored | thin router (75 lines) |
| `reference/svg-recipes.md` | authored | 15 families, each a complete copy-paste `<svg>` + knobs (379 lines) |
| `reference/generative-canvas.md` | distilled from genjutsu (MIT) | 6 animated-canvas techniques + shared DPR/reduced-motion mount helper (310 lines) |

## Excluded from genjutsu
Everything except `canvas-generative`. genjutsu as a whole was **rejected** (near-duplicate of impeccable/gsap/threejs/motion + a competing entry point; its Python/bash machinery not taken). Only the MIT canvas algorithms were salvaged, per the user's direction.

## Safety verification
All 15 SVG snippets validated as well-formed XML; all 7 canvas JS blocks pass `node --check`. No network, no telemetry, no external asset fetches — colors flow from CSS custom properties with fallbacks. Reduced-motion honored in the canvas mount helper. Genjutsu inspected read-only in quarantine; never installed/executed.
