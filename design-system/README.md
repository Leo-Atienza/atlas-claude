# Atelier Design System

A general-purpose web design system for the user's projects. Reusable starting point — not tied to any single product.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** with semantic CSS variables
- **GSAP + Lenis** ready via motion tokens
- Dark mode via `[data-theme]` on the root

## Folder layout

```
design-system/
├── tokens/       # Source of truth — color, type, spacing, radii, shadows, motion
├── lib/          # cn() helper, ThemeProvider
├── components/   # Button, Card, Input, Badge, Container
├── examples/     # Hero, Pricing, Nav — how primitives compose
├── brand/        # Logo mark + fonts guidance
├── tailwind.config.ts
├── globals.css
├── BLURB.md       # Copy for Claude Design form
└── UPLOAD-GUIDE.md
```

## Design direction

- **Palette:** Cream paper, charcoal ink, single muted-ochre accent. Dark mode is a first-class mirror, not a simple inversion.
- **Type:** Fraunces (display) + Geist (sans) + JetBrains Mono (code). Editorial scale — generous, not dashboard-dense.
- **Feel:** Premium, spare, motion-aware. Soft layered shadows, tight radii, generous whitespace.
- **Voice:** Confident, specific. No hedging, no emojis, no "Get started today" copy.

## Using the tokens

Components read **semantic classes** (`bg-background`, `text-ink`, `bg-accent`), which resolve to CSS vars set in `globals.css`. To switch themes, flip `data-theme="dark"` on `<html>` — every component follows.

Raw palette is available as `bg-paper-100`, `text-paper-900`, etc., for escape-hatch cases.

## Motion

`tokens/motion.ts` exports `duration` and `easing` as CSS-and-GSAP-compatible values. In CSS: `transition-[color] duration-fast ease-standard`. In GSAP: `gsap.to(el, { duration: 0.25, ease: "cubic-bezier(0.4, 0, 0.2, 1)" })`.

Every animation must honor `prefers-reduced-motion` — either via the global CSS rule in `globals.css` or a runtime check from `tokens/motion.ts`.

## Not in scope

- This folder is a reference system, not a shipping Next.js app. There's no `package.json`, no build step.
- No icon library — use `lucide-react` or the `iconify` MCP in consuming apps.
- No form library — `Input` is a primitive. Wire it up with react-hook-form or native form elements per project.

---

## Notes for Claude Design

> Paste this section into the "Any other notes?" field on the setup form.

This design system is deliberately small and opinionated. When generating new components or pages:

1. **Always read from tokens.** Never hardcode hex values, pixel values, or duration strings. If a token doesn't exist for what you need, add it to the appropriate `tokens/*.ts` file first.
2. **Use semantic color classes** (`bg-background`, `text-ink`, `bg-accent`) in components. Raw palette classes (`bg-paper-100`) are for escape hatches only.
3. **No default Material / shadcn styling.** Tight radii (`rounded-md` max for buttons, `rounded-lg` max for cards), soft layered shadows (never `shadow-2xl`), no pill buttons unless the element is a badge or avatar.
4. **Editorial, not dashboard.** Generous whitespace, serif display headlines (Fraunces), geometric sans body (Geist). Type does the work — avoid gradient backgrounds, stock imagery, and decorative borders.
5. **Dark mode is a first-class mirror.** Every generated component must work identically under `[data-theme="dark"]` without markup changes.
6. **Respect `prefers-reduced-motion`.** Motion is baked in but must never block content for users who opt out.
7. **Voice and copy:** Confident, spare, specific. No hedging ("might," "could," "possibly"), no emojis, no startup tropes ("Unleash your potential," "Level up," "Get started today").

When in doubt, err toward *less* — less chrome, less color, less motion, less copy.
