<!--
id: SK-084
name: css-first-ui
description: CSS-First UI Engine — Container Queries, :has(), @layer specificity architecture, native Popover+Anchor components, scroll-state queries, OKLCH color, CSS Nesting. Load when building UI components that should minimize JavaScript.
keywords: css-first, container-queries, has-selector, layer, popover, anchor, scroll-state, oklch, css-nesting, style-queries, zero-js, native-components
version: 1.0.0
-->

# CSS-First UI Engine

## When to Use This Skill

Load when building UI components. The CSS-First principle: **use native CSS before any JS library.** Every feature here ships zero JavaScript, is GPU-composited, and requires no hydration.

**Companion:** Load `web-l100` (SK-083) for the full Vanguard architecture — Render Tiers, animation orchestration, and streaming pipeline.

---

## The CSS Revolution — Before/After

### Example 1: Form Validation Styling (was ~50 lines of JS)

```css
/* CSS only — no JS event listeners, no state, no re-renders */
form:has(:invalid) .submit-btn {
  opacity: 0.5;
  pointer-events: none;
}

form:has(:focus-visible) .form-help {
  display: block;
}

.field:has(:user-invalid) .error-message {
  display: block;
  color: oklch(0.6 0.25 25);
}
```

### Example 2: Responsive Card (was ~30 lines of JS + ResizeObserver)

```css
.card-container { container-type: inline-size; }

.card {
  display: grid;
  gap: 1rem;
}

@container (min-width: 400px) {
  .card { grid-template-columns: 200px 1fr; }
}

@container (min-width: 600px) {
  .card { grid-template-columns: 250px 1fr auto; }
}
```

### Example 3: Dropdown Menu (was ~200 lines of JS + Floating UI)

```html
<button popovertarget="menu" style="anchor-name: --menu-btn">Options</button>
<ul id="menu" popover style="
  position-anchor: --menu-btn;
  position-area: bottom span-left;
  margin-block-start: 4px;
">
  <li>Edit</li>
  <li>Duplicate</li>
  <li>Delete</li>
</ul>
```

```css
[popover] {
  transition: opacity 0.15s, transform 0.15s, display 0.15s allow-discrete;
  opacity: 0; transform: translateY(-4px);
}
[popover]:popover-open {
  opacity: 1; transform: translateY(0);
}
@starting-style {
  [popover]:popover-open { opacity: 0; transform: translateY(-4px); }
}
```

Zero JavaScript. Light-dismiss. Keyboard accessible. Proper positioning with overflow handling.

---

## @layer Architecture

> Deep patterns: [references/layer-architecture.md](references/layer-architecture.md)

Every project starts with a specificity architecture. `@layer` eliminates specificity wars.

```css
/* globals.css — declare layer order once */
@layer reset, base, tokens, components, utilities, overrides;

/* reset layer — lowest specificity */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
}

/* tokens layer — design tokens as custom properties */
@layer tokens {
  :root {
    --color-surface: oklch(0.99 0.005 260);
    --color-text: oklch(0.15 0.02 260);
    --color-accent: oklch(0.65 0.25 260);
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    color-scheme: light dark;
  }
}

/* components layer — your components */
@layer components {
  .btn { /* ... */ }
  .card { /* ... */ }
}

/* utilities layer — Tailwind lives here */
@layer utilities {
  /* Tailwind CSS v4 auto-assigns to this layer */
}

/* overrides — last resort, highest specificity */
@layer overrides {
  /* Emergency overrides only */
}
```

**Rule:** Never use `!important`. If you need it, your layer order is wrong.

---

## Container Queries

> Deep patterns: [references/container-queries.md](references/container-queries.md)

Three types, from most to least mature:

### Size Queries (Baseline 2023 — use everywhere)

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Component responds to its container, not the viewport */
@container card (min-width: 400px) {
  .card { grid-template-columns: 200px 1fr; }
  .card__image { aspect-ratio: 4/3; }
}

@container card (min-width: 600px) {
  .card { grid-template-columns: 250px 1fr auto; }
  .card__actions { display: flex; }
}
```

### Style Queries (Chrome 111+ — progressive enhance)

Query computed custom property values of a container:

```css
.theme-wrapper {
  container-name: theme;
  --variant: default;
}

/* Conditional styling without JS class toggling */
@container theme style(--variant: compact) {
  .card { padding: 0.5rem; font-size: 0.875rem; }
}

@container theme style(--variant: featured) {
  .card { border: 2px solid var(--color-accent); }
}
```

### Scroll-State Queries (Chrome 133+ — progressive enhance)

Detect scroll-related states without JavaScript:

```css
.sticky-header {
  container-type: scroll-state;
}

/* Style when header is stuck */
@container scroll-state(stuck: top) {
  .sticky-header {
    background: oklch(0.99 0 0 / 0.95);
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 3px oklch(0 0 0 / 0.1);
  }
}
```

**When to use vs. media queries:** Container queries = component-level responsiveness. Media queries = page-level layout (viewport breakpoints, print, preference queries like `prefers-reduced-motion`).

---

## :has() Relationship Patterns

> Deep patterns: [references/has-patterns.md](references/has-patterns.md)

The most powerful CSS selector. Matches an element based on its descendants, siblings, or state relationships.

### Form-Level Validation

```css
/* Disable submit when form has invalid fields */
form:has(:invalid) [type="submit"] {
  opacity: 0.5;
  pointer-events: none;
}

/* Show helper text when any field is focused */
form:has(:focus-within) .form-help { display: block; }

/* Highlight the form section containing an error */
.form-section:has(:user-invalid) {
  border-left: 3px solid oklch(0.6 0.25 25);
}
```

### Sibling-Aware Layouts

```css
/* Card without image gets different layout */
.card:not(:has(img)) {
  padding: 2rem;
}

/* Navigation item that contains active link */
.nav-item:has(.active) {
  background: var(--color-accent-subtle);
}

/* Article that has a code block gets wider */
article:has(pre) {
  max-width: 80ch;
}
```

### Quantity Queries

```css
/* Grid changes when list has 4+ items */
ul:has(> li:nth-child(4)) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

/* Empty state when list has no items */
ul:not(:has(li)) {
  display: grid;
  place-items: center;
  min-height: 200px;
}
ul:not(:has(li))::after {
  content: 'No items yet';
  color: var(--color-muted);
}
```

**Performance:** Limit `:has()` depth to 1-2 levels. Avoid `body:has(...)` for broad selectors.

---

## Native Component System

> Deep patterns: [references/native-components.md](references/native-components.md)

Popover API + Anchor Positioning + `<dialog>` = complete component library with zero JavaScript.

### Tooltip

```html
<button popovertarget="tip" style="anchor-name: --tip-trigger">Hover me</button>
<div id="tip" popover="hint" style="
  position-anchor: --tip-trigger;
  position-area: top center;
  position-try-fallbacks: bottom center, right center;
  margin-block-end: 8px;
">
  Tooltip content
</div>
```

### Dropdown Menu

```html
<button popovertarget="dropdown" style="anchor-name: --dropdown-btn">
  Actions <span aria-hidden="true">&#9662;</span>
</button>
<menu id="dropdown" popover style="
  position-anchor: --dropdown-btn;
  position-area: bottom span-left;
  margin-block-start: 4px;
">
  <li><button>Edit</button></li>
  <li><button>Duplicate</button></li>
  <li role="separator"></li>
  <li><button>Delete</button></li>
</menu>
```

### Modal Dialog

```html
<dialog id="confirm">
  <h2>Confirm deletion?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Confirm</button>
  </form>
</dialog>
```

```css
dialog {
  border: none;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  max-width: min(90vw, 480px);
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete;
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
dialog[open] {
  opacity: 1;
  transform: scale(1) translateY(0);
}
@starting-style {
  dialog[open] { opacity: 0; transform: scale(0.95) translateY(8px); }
}
dialog::backdrop {
  background: oklch(0 0 0 / 0.5);
  backdrop-filter: blur(4px);
}
```

### Progressive Enhancement

```css
/* Use Anchor Positioning where supported, fallback to manual position */
@supports (anchor-name: --test) {
  .tooltip {
    position-anchor: --trigger;
    position-area: top center;
  }
}
@supports not (anchor-name: --test) {
  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
}
```

---

## OKLCH Color System

> Deep patterns: [references/oklch-system.md](references/oklch-system.md)

OKLCH is the perceptually uniform color space. Colors with the same lightness value **look** equally light, unlike HSL.

```css
:root {
  /* Base palette — adjust L for shades, keep C and H consistent */
  --brand: oklch(0.65 0.25 260);       /* Primary */
  --brand-light: oklch(0.85 0.12 260); /* Lighter shade */
  --brand-dark: oklch(0.45 0.25 260);  /* Darker shade */

  /* Semantic tokens using light-dark() */
  --color-surface: light-dark(oklch(0.99 0.005 260), oklch(0.15 0.02 260));
  --color-text: light-dark(oklch(0.15 0.02 260), oklch(0.93 0.01 260));
  --color-accent: light-dark(oklch(0.55 0.25 260), oklch(0.75 0.2 260));

  color-scheme: light dark;
}

/* Dark mode: just works — no media query, no JS toggle needed */
/* Users system preference drives color-scheme automatically */
/* Override with: html { color-scheme: dark; } for forced dark */
```

### Generating Shades Programmatically

```css
/* 10 shades from a single hue — adjust L only */
--gray-50:  oklch(0.98 0.005 260);
--gray-100: oklch(0.94 0.008 260);
--gray-200: oklch(0.87 0.01  260);
--gray-300: oklch(0.78 0.012 260);
--gray-400: oklch(0.66 0.015 260);
--gray-500: oklch(0.55 0.018 260);
--gray-600: oklch(0.44 0.02  260);
--gray-700: oklch(0.36 0.018 260);
--gray-800: oklch(0.27 0.015 260);
--gray-900: oklch(0.18 0.01  260);
```

---

## CSS Nesting

Native CSS nesting is Baseline 2023. No preprocessor needed.

```css
.card {
  padding: 1.5rem;
  border-radius: var(--radius-md);

  & .title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  & .description {
    color: var(--color-muted);
    line-height: 1.6;
  }

  &:hover {
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.08);
  }

  /* Container query scoped to this component */
  @container (min-width: 400px) {
    display: grid;
    grid-template-columns: auto 1fr;
  }
}
```

**Rule:** Nesting depth max 2 levels. Beyond that, create a new selector.
