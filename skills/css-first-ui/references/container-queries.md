# Container Queries — Complete Reference

## Setup

```css
/* Mark a container */
.container {
  container-type: inline-size;  /* Enable size queries on inline axis */
  container-name: card;         /* Optional: named container */
}

/* Shorthand */
.container {
  container: card / inline-size;
}
```

## Size Queries (Baseline 2023 — 95%+ support)

```css
/* Query the nearest ancestor with container-type */
@container (min-width: 400px) { .child { /* wide layout */ } }
@container (max-width: 399px) { .child { /* narrow layout */ } }

/* Query a named container specifically */
@container card (min-width: 600px) { .child { /* ... */ } }

/* Combine conditions */
@container (min-width: 400px) and (max-width: 799px) { /* medium */ }

/* Container query units */
.child {
  font-size: clamp(0.875rem, 3cqi, 1.25rem); /* cqi = 1% of container inline size */
  padding: 2cqb;                                /* cqb = 1% of container block size */
}
```

### Container Query Units

| Unit | Description |
|------|-------------|
| `cqw` | 1% of container width |
| `cqh` | 1% of container height |
| `cqi` | 1% of container inline size |
| `cqb` | 1% of container block size |
| `cqmin` | Smaller of cqi/cqb |
| `cqmax` | Larger of cqi/cqb |

## Style Queries (Chrome 111+ — progressive enhance)

Query computed custom properties:

```css
.wrapper {
  container-name: card;
  --theme: light;
  --density: default;
}

@container card style(--theme: dark) {
  .content { background: oklch(0.15 0.02 260); }
}

@container card style(--density: compact) {
  .content { padding: 0.5rem; font-size: 0.875rem; }
}
```

**Use case:** Variant systems without JavaScript class toggling. Set `--variant` on a container, query it in children.

## Scroll-State Queries (Chrome 133+ — progressive enhance)

```css
.sticky-nav {
  container-type: scroll-state;
  position: sticky;
  top: 0;
}

/* Detect when stuck */
@container scroll-state(stuck: top) {
  .sticky-nav {
    background: oklch(1 0 0 / 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid oklch(0 0 0 / 0.1);
  }
}

/* Detect when container is scrollable */
@container scroll-state(scrollable: top) {
  .scroll-indicator-up { display: block; }
}

@container scroll-state(scrollable: bottom) {
  .scroll-indicator-down { display: block; }
}

/* Detect snap state */
@container scroll-state(snapped: x) {
  .carousel-item { opacity: 1; }
}
```

## Decision Guide: Container Queries vs. Media Queries

| Use Case | Use |
|----------|-----|
| Component adapts to its container width | Container Query |
| Page layout changes at viewport breakpoints | Media Query |
| Component works in sidebar AND main content | Container Query |
| Print stylesheet | Media Query |
| Reduced motion / color scheme preferences | Media Query |
| Card grid density based on available space | Container Query |
