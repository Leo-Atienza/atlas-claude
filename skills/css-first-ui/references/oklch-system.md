# OKLCH Color System

## Why OKLCH
OKLCH (Oklab Lightness, Chroma, Hue) is perceptually uniform. Two colors with L=0.65 look equally light to the human eye. HSL does not have this property — `hsl(60, 100%, 50%)` (yellow) and `hsl(240, 100%, 50%)` (blue) have wildly different perceived brightness despite identical L values.

## Anatomy

```
oklch(L C H / A)
  L = Lightness (0 = black, 1 = white)
  C = Chroma (0 = gray, ~0.4 = maximum saturation)
  H = Hue angle (0-360, like HSL)
  A = Alpha (optional, 0 = transparent, 1 = opaque)
```

## Building a Palette

### Single-Hue Scale (adjust L only, keep C and H)
```css
:root {
  --blue-50:  oklch(0.97 0.01 250);
  --blue-100: oklch(0.93 0.03 250);
  --blue-200: oklch(0.87 0.08 250);
  --blue-300: oklch(0.78 0.13 250);
  --blue-400: oklch(0.68 0.19 250);
  --blue-500: oklch(0.58 0.23 250);  /* Base */
  --blue-600: oklch(0.50 0.22 250);
  --blue-700: oklch(0.42 0.19 250);
  --blue-800: oklch(0.33 0.15 250);
  --blue-900: oklch(0.23 0.10 250);
}
```

### Tinted Neutrals (subtle brand tint)
```css
:root {
  /* Tint neutrals toward your brand hue (260 = blue-ish) */
  --gray-50:  oklch(0.98 0.005 260);
  --gray-100: oklch(0.94 0.008 260);
  --gray-200: oklch(0.87 0.010 260);
  --gray-300: oklch(0.78 0.012 260);
  --gray-400: oklch(0.66 0.015 260);
  --gray-500: oklch(0.55 0.018 260);
  --gray-600: oklch(0.44 0.020 260);
  --gray-700: oklch(0.36 0.018 260);
  --gray-800: oklch(0.27 0.015 260);
  --gray-900: oklch(0.18 0.010 260);
}
```

### Semantic Tokens with light-dark()
```css
:root {
  color-scheme: light dark;

  --color-surface:    light-dark(oklch(0.99 0.005 260), oklch(0.13 0.02 260));
  --color-surface-2:  light-dark(oklch(0.96 0.008 260), oklch(0.18 0.02 260));
  --color-text:       light-dark(oklch(0.15 0.02 260),  oklch(0.93 0.01 260));
  --color-text-muted: light-dark(oklch(0.45 0.02 260),  oklch(0.65 0.02 260));
  --color-border:     light-dark(oklch(0.90 0.01 260),  oklch(0.28 0.02 260));
  --color-accent:     light-dark(oklch(0.55 0.25 260),  oklch(0.72 0.20 260));
}
```

No JavaScript toggle needed. The browser respects `color-scheme` and `prefers-color-scheme` automatically.

### Force Dark Mode
```css
/* Override system preference */
html[data-theme="dark"] { color-scheme: dark; }
html[data-theme="light"] { color-scheme: light; }
```

## color-mix() for Dynamic Shades
```css
/* Hover states — mix with white/black */
.btn:hover {
  background: color-mix(in oklch, var(--color-accent) 85%, white);
}
.btn:active {
  background: color-mix(in oklch, var(--color-accent) 85%, black);
}

/* Subtle backgrounds from any color */
.badge {
  background: color-mix(in oklch, var(--badge-color) 15%, transparent);
  color: var(--badge-color);
}
```

## Accessibility
- Text on background: ensure L difference >= 0.4 for WCAG AA
- Large text: L difference >= 0.3
- Tool: check with `oklch` DevTools color picker (Chrome 111+)
