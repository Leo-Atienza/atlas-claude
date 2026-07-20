# Lightning CSS — Reference

## What It Replaces

| Old Tool | Lightning CSS Handles |
|---|---|
| autoprefixer | Vendor prefixing (based on browserslist targets) |
| cssnano | Minification |
| postcss-nesting | CSS Nesting (native syntax) |
| postcss-custom-media | Custom media queries |
| postcss-color-function | Modern color functions (oklch, color-mix, light-dark) |

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    // Use Lightning CSS as full transformer (experimental)
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 120,
        firefox: 120,
        safari: 17,
      },
      drafts: {
        customMedia: true, // Enable @custom-media
      },
    },
  },
  build: {
    cssMinify: 'lightningcss', // Default in Vite 6+
  },
});
```

## Features Handled Automatically

### Vendor Prefixing
```css
/* Input */
.box { user-select: none; }

/* Output (for Safari < 17.4) */
.box { -webkit-user-select: none; user-select: none; }
```

### CSS Nesting (downleveled for older browsers)
```css
/* Input */
.card {
  & .title { font-weight: bold; }
  &:hover { opacity: 0.9; }
}

/* Output (for browsers without nesting support) */
.card .title { font-weight: bold; }
.card:hover { opacity: 0.9; }
```

### Color Functions
```css
/* Input */
.btn {
  background: oklch(0.65 0.25 260);
  border-color: color-mix(in oklch, var(--accent) 50%, transparent);
}

/* Output: converted to rgb for older browsers */
```

### Custom Media Queries
```css
/* Input */
@custom-media --mobile (max-width: 767px);
@custom-media --desktop (min-width: 1024px);

@media (--mobile) { .nav { display: none; } }
@media (--desktop) { .nav { display: flex; } }

/* Output: inlined */
@media (max-width: 767px) { .nav { display: none; } }
@media (min-width: 1024px) { .nav { display: flex; } }
```

## With Tailwind CSS v4

Tailwind CSS v4 uses Lightning CSS internally. Your setup is:

```css
/* globals.css */
@import "tailwindcss";
```

No `postcss.config.js`. No `tailwindcss` PostCSS plugin. No `autoprefixer`. Lightning CSS handles everything through Tailwind's built-in integration.

## CLI Usage (standalone)

```bash
npx lightningcss --minify --targets '>= 0.25%' input.css -o output.css
```

## When to Keep PostCSS

- You use PostCSS plugins with no Lightning CSS equivalent
- You need Tailwind CSS v3 (which requires PostCSS)
- Your framework doesn't support Lightning CSS natively yet
