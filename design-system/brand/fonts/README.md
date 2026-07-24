# Fonts

This folder holds local font files (`.woff2`) when you need them. For now, the system loads fonts from Google Fonts CDN — no binaries checked in.

## Current type stack

| Role    | Family            | Source      | Weights |
|---------|-------------------|-------------|---------|
| Display | Fraunces          | Google Fonts | 400, 500, 600 |
| Display (alt) | Instrument Serif | Google Fonts | 400 |
| Sans    | Geist             | Google Fonts | 400, 500, 600, 700 |
| Sans (alt) | Inter          | Google Fonts | 400, 500, 600, 700 |
| Mono    | JetBrains Mono    | Google Fonts | 400, 500 |

## Drop-in CDN link

Add to your `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

Or in a Next.js app, use `next/font`:

```ts
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google';

export const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });
export const geist    = Geist({ subsets: ['latin'], variable: '--font-sans' });
export const mono     = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

## Self-hosting later

If you need to self-host, drop `.woff2` files in this folder and reference them with `@font-face` in `globals.css`. Prefer `woff2` only — skip legacy formats.
