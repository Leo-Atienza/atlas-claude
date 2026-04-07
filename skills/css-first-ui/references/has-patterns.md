# :has() Patterns — Complete Reference

## Browser Support
Baseline 2023 — 95%+ global support. Safe to use everywhere.

## Core Patterns

### Parent Selection
```css
/* Style parent based on child state */
.card:has(img) { padding: 0; }
.card:not(:has(img)) { padding: 2rem; }
```

### Form Validation
```css
/* Disable submit when invalid */
form:has(:invalid) [type="submit"] {
  opacity: 0.5;
  pointer-events: none;
}

/* Show success state when all valid */
form:not(:has(:invalid)):has(:user-valid) .success-indicator {
  display: block;
}

/* Highlight field group containing error */
.field-group:has(:user-invalid) {
  border-color: oklch(0.6 0.25 25);
}

/* Show/hide password requirements based on focus */
.password-field:has(input:focus) .requirements { display: block; }
```

### Navigation State
```css
/* Active nav item */
.nav-item:has(a[aria-current="page"]) {
  background: var(--color-accent-subtle);
  border-bottom: 2px solid var(--color-accent);
}

/* Breadcrumb separator — only between items */
.breadcrumb li:has(+ li)::after {
  content: '/';
  margin-inline: 0.5rem;
}
```

### Layout Adaptation
```css
/* Article with code blocks gets wider container */
article:has(pre) { max-width: 80ch; }
article:not(:has(pre)) { max-width: 65ch; }

/* Grid switches when enough items */
.grid:has(> :nth-child(4)) {
  grid-template-columns: repeat(2, 1fr);
}
.grid:has(> :nth-child(7)) {
  grid-template-columns: repeat(3, 1fr);
}
```

### Empty States
```css
/* Show empty state when list has no items */
.list:not(:has(li))::before {
  content: 'No items found';
  display: grid;
  place-items: center;
  min-height: 200px;
  color: var(--color-muted);
}

/* Hide filter bar when nothing to filter */
.toolbar:has(+ .list:not(:has(li))) { display: none; }
```

### Sibling Relationships
```css
/* Style label when its sibling input is focused */
label:has(+ input:focus) {
  color: var(--color-accent);
  transform: translateY(-2px);
}

/* Adjacent card hover — dim siblings */
.card-grid:has(.card:hover) .card:not(:hover) {
  opacity: 0.7;
}
```

### Media & Content
```css
/* Figure with caption gets different spacing */
figure:has(figcaption) { margin-block: 2rem; }
figure:not(:has(figcaption)) { margin-block: 1rem; }

/* Video container with controls visible */
.video-wrapper:has(video[controls]) { padding-bottom: 3rem; }
```

## Performance Guidelines

1. **Limit depth** — `:has()` with deep descendant selectors can be expensive
   - Good: `.card:has(> img)` (direct child)
   - OK: `.card:has(img)` (any descendant, 1 level)
   - Avoid: `body:has(.deeply .nested .selector)`

2. **Avoid broad selectors** on high-frequency elements
   - Avoid: `*:has(...)` or `div:has(...)`
   - Better: `.specific-class:has(...)`

3. **Combine with `:not()` carefully** — double negation is hard to read
   - OK: `.card:not(:has(img))` (card without image)
   - Avoid: `.card:not(:has(:not(:first-child)))` (unreadable)
