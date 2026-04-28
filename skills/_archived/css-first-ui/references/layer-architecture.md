# @layer Specificity Architecture

## The Problem
CSS specificity wars: component styles fight utility classes, resets conflict with themes, `!important` spreads like wildfire. `@layer` solves this by establishing a deterministic cascade order.

## The Architecture

```css
/* Declare layer order at the top of globals.css */
@layer reset, base, tokens, components, utilities, overrides;
```

Later layers always win over earlier layers, regardless of selector specificity. A simple `.btn` in the `utilities` layer beats `div.container > section.content button.primary` in the `components` layer.

## Layer Definitions

### reset — Lowest priority
```css
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html { -webkit-text-size-adjust: 100%; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
  input, button, textarea, select { font: inherit; }
  p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
}
```

### base — Foundation styles
```css
@layer base {
  body {
    font-family: var(--font-body);
    color: var(--color-text);
    background: var(--color-surface);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--color-accent); text-decoration-skip-ink: auto; }
  ::selection { background: oklch(0.65 0.25 260 / 0.3); }
}
```

### tokens — Design tokens
```css
@layer tokens {
  :root {
    /* Color */
    --color-surface: oklch(0.99 0.005 260);
    --color-text: oklch(0.15 0.02 260);
    --color-accent: oklch(0.65 0.25 260);
    --color-muted: oklch(0.55 0.02 260);
    --color-border: oklch(0.9 0.01 260);

    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 2rem;
    --space-xl: 4rem;

    /* Typography */
    --font-display: 'Your Display Font', system-ui;
    --font-body: 'Your Body Font', system-ui;

    /* Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;

    color-scheme: light dark;
  }
}
```

### components — Your components
```css
@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-sm);
    font-weight: 500;
    transition: transform 0.15s, opacity 0.15s;
  }
  .btn:active { transform: scale(0.97); }
  .card { /* ... */ }
  .badge { /* ... */ }
}
```

### utilities — Tailwind CSS v4 auto-assigns here
```css
@layer utilities {
  /* Tailwind utilities land here automatically in v4 */
  /* Custom utilities go here too */
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0, 0, 0, 0); border: 0;
  }
}
```

### overrides — Emergency hatch
```css
@layer overrides {
  /* Use sparingly. If you're here often, restructure your layers. */
  [data-theme="high-contrast"] {
    --color-text: oklch(0 0 0);
    --color-surface: oklch(1 0 0);
  }
}
```

## With Tailwind CSS v4

Tailwind v4 respects `@layer`. Its generated utilities go into the `utilities` layer automatically. Your component styles in the `components` layer are guaranteed to lose to Tailwind utilities — which is exactly what you want.

```css
/* globals.css */
@layer reset, base, tokens, components, utilities, overrides;
@import "tailwindcss";
```

## Rules
1. **Never use `!important`** — if you need it, your layer order is wrong
2. **Declare layer order once** at the top of your entry CSS file
3. **Unlayered styles** beat all layered styles — avoid writing CSS outside layers
4. **Third-party CSS** — import into a low-priority layer: `@import "lib.css" layer(vendor);`
