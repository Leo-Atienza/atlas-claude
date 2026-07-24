---
name: tailwind-setup
description: Set up Tailwind CSS v4.3 in a Next.js 16 project (App Router) — PostCSS plugin, CSS-first @theme tokens, dark mode, plus the v4.2 webpack plugin path for non-Vite/Turbopack stacks and v4.3 utilities (scrollbars, @container-size, new palettes).
version: 2.0.0
license: MIT
---

# Tailwind CSS v4.3 Setup for Next.js 16 (Web)

The default and recommended setup for the user's primary stack: **Next.js 16 App Router + Tailwind CSS v4.3**. For React Native / Expo, use the `expo-tailwind-setup` skill instead.

## Quickest path (new project)

`create-next-app` already wires Tailwind v4 with the `--tailwind` flag — accept the defaults:

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

That gives you `@tailwindcss/postcss`, a working `app/globals.css`, and a `postcss.config.mjs`. Skip to "Add design tokens" below.

---

## Manual install (existing project)

Use this when adding Tailwind v4 to an existing Next.js 16 codebase or migrating from v3.

```bash
npm install tailwindcss@^4.3 @tailwindcss/postcss@^4.3
# optional companions
npm install tailwind-merge clsx
```

### `postcss.config.mjs`

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

No `autoprefixer` line — `@tailwindcss/postcss` handles vendor prefixing internally via Lightning CSS.

### `app/globals.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  /* Brand tokens — register custom utilities like text-brand, bg-brand */
  --color-brand: oklch(0.65 0.2 250);
  --color-brand-foreground: oklch(0.98 0 0);

  /* Custom radius scale */
  --radius-pill: 9999px;
}
```

### `app/layout.tsx`

```tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

That's it — no `tailwind.config.js`, no `@tailwind` directives. Tailwind v4 reads tokens from CSS via `@theme` and discovers utilities via the `@import "tailwindcss"` line.

Token-hierarchy architecture (brand → semantic → component tiers): see `skills/impeccable/reference/color-and-contrast.md` § @theme token hierarchy.

---

## Dark mode (v4 idiom)

Two patterns. Pick one — don't mix.

### Pattern A — `prefers-color-scheme` (zero JS)

```css
@import "tailwindcss";

@theme {
  --color-bg: light-dark(white, oklch(0.18 0 0));
  --color-fg: light-dark(oklch(0.18 0 0), white);
}

html { color-scheme: light dark; }
```

Use `bg-bg text-fg` and the system handles the toggle. No `dark:` variants needed.

### Pattern B — class-based toggle (next-themes / manual)

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-bg: white;
  --color-fg: oklch(0.18 0 0);
}
```

Then write `bg-bg dark:bg-zinc-950 text-fg dark:text-zinc-100`. Pair with `next-themes` to drive the `.dark` class on `<html>`.

---

## v4.3 utilities worth knowing

### Scrollbar utilities (v4.3)

```html
<div class="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-zinc-100 dark:scrollbar-thumb-zinc-700 dark:scrollbar-track-zinc-900">
```

Variants: `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*`. Replaces the `tailwind-scrollbar` plugin for most use cases.

### `@container-size` (v4.3)

Container queries that reference the container's own size as a token:

```html
<article class="@container">
  <div class="@container-size:h-40 @container-size:flex"> … </div>
</article>
```

Use this when a component should adapt to its parent's measured size, not the viewport.

### New neutral palettes (v4.3)

`mauve`, `olive`, `mist`, `taupe` — slightly warmer / cooler than `zinc/gray/slate/neutral/stone`. Available as `bg-mauve-50` … `bg-mauve-950`, etc. Useful when the existing five neutrals all look wrong against your brand color.

### Faster builds (v4.2)

v4.2 ships ~3.8× faster incremental recompilation in Next.js dev. No code change required — just run `npm install tailwindcss@^4.3` to pick up the perf delta.

---

## When to use the webpack plugin (v4.2+)

Skip this section if you're on Turbopack (default in `create-next-app@latest`) — PostCSS works.

For a custom Next.js setup that uses webpack and bypasses PostCSS:

```bash
npm install @tailwindcss/webpack@^4.3
```

```js
// next.config.js — only if you have a custom webpack(config) function and need direct integration
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ["@tailwindcss/webpack"],
    });
    return config;
  },
};
```

This is rare in Next.js (PostCSS path covers ~99% of projects). Real use case: monorepos where one app has webpack-only constraints and you can't stand up PostCSS.

---

## Migration from v3 → v4

| v3 | v4 |
|---|---|
| `tailwind.config.js` (theme.extend.colors etc.) | `@theme { --color-*: ... }` in CSS |
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| `darkMode: 'class'` config | `@custom-variant dark (&:where(.dark, .dark *));` |
| `content: [...]` glob config | Auto-detected from file imports — usually delete |
| `plugins: [require('@tailwindcss/forms')]` | `@plugin "@tailwindcss/forms";` in CSS |
| PostCSS `tailwindcss` plugin | PostCSS `@tailwindcss/postcss` plugin |
| `autoprefixer` plugin | Built into Lightning CSS — remove |

Migration codemod:

```bash
npx @tailwindcss/upgrade@latest
```

Run on a clean git tree, review the diff. The codemod handles ~90% of the transform; manual fixes usually involve custom plugins or `@apply` chains in component CSS.

---

## Common pitfalls

- **Empty utility output**: usually a missing `@import "tailwindcss";` or the wrong PostCSS plugin name (`tailwindcss` instead of `@tailwindcss/postcss`).
- **`@theme` tokens not generating utilities**: tokens must be inside the `@theme` block at the top level — not nested inside `@layer`.
- **Custom colors don't work with `dark:` variant**: use `light-dark()` in the `@theme` value, or define separate `--color-foo` and `--color-foo-dark` and switch with `@custom-variant`.
- **`@apply` in CSS Modules fails**: v4 dropped support inside scoped modules; either move utilities to global CSS or use the `tw` className directly.
- **Stale Tailwind output after upgrade**: kill `next dev`, `mv .next /c/tmp/trash/.next-$(date +%s)`, restart. Cache between v3 and v4 is incompatible.

---

## Sources

- [Tailwind v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind v4.3 release (scrollbars, container-size, new palettes)](https://tailwindcss.com/blog/tailwindcss-v4-3)
- [Next.js + Tailwind setup](https://nextjs.org/docs/app/guides/tailwind-css)
- [Upgrade tool: @tailwindcss/upgrade](https://tailwindcss.com/docs/upgrade-guide)
