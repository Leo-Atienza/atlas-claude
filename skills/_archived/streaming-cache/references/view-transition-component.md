# React `<ViewTransition>` — Deep Patterns

## Overview

React 19.2 ships `<ViewTransition>` as a first-class component. It assigns `view-transition-name` to its children, enabling shared element transitions between routes.

## Basic Usage

```tsx
import { ViewTransition } from 'react';

// List page
function ProductCard({ product }: { product: Product }) {
  return (
    <ViewTransition name={`product-${product.id}`}>
      <Link href={`/products/${product.id}`}>
        <img src={product.thumbnail} alt={product.name} />
        <h3>{product.name}</h3>
      </Link>
    </ViewTransition>
  );
}

// Detail page — same name = shared element animation
function ProductHero({ product }: { product: Product }) {
  return (
    <ViewTransition name={`product-${product.id}`}>
      <div className="hero">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
      </div>
    </ViewTransition>
  );
}
```

When navigating from list to detail, the product image animates smoothly between positions.

## Next.js 16 Integration

```ts
// next.config.ts
const nextConfig: NextConfig = {
  viewTransition: true,
};
```

Next.js auto-wraps route changes in `document.startViewTransition()`. Combined with `<ViewTransition>` components, shared elements animate automatically.

## CSS Customization

```css
/* Default transition for all elements */
::view-transition-old(*) {
  animation: 200ms ease-out both fade-out;
}
::view-transition-new(*) {
  animation: 300ms ease-out both fade-in;
}

/* Specific named transitions */
::view-transition-group(product-*) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Image-specific: crossfade + resize */
::view-transition-old(product-hero) {
  animation: 300ms ease-out both scale-down, 200ms ease-out both fade-out;
}
::view-transition-new(product-hero) {
  animation: 300ms ease-out both scale-up, 200ms 100ms ease-out both fade-in;
}

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }
@keyframes scale-down { to { transform: scale(0.8); } }
@keyframes scale-up { from { transform: scale(0.8); } }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none;
  }
}
```

## Rules

1. **`view-transition-name` must be unique** per page at transition time
2. **Keep transitions under 500ms** — longer feels sluggish
3. **Limit named elements** — each creates a snapshot pair (memory cost)
4. **Use for hero content** — product images, page headers, not every list item
5. **Progressive enhancement** — works without JS, degrades to instant navigation in unsupported browsers
6. **Combine with Speculation Rules** — prerender + view transition = zero-latency beautiful navigation
