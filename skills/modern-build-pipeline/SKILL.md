<!--
id: SK-087
name: modern-build-pipeline
description: Modern Build Pipeline — Biome 2.0 (replaces ESLint+Prettier), Lightning CSS (replaces PostCSS), Turbopack. Rust-powered tooling for 5-10x faster builds. Load when setting up or migrating build tools.
keywords: biome, lightning-css, turbopack, rolldown, build-tools, eslint-migration, prettier-migration, postcss-migration, rust-tooling, dx, lint, format
version: 1.0.0
-->

# Modern Build Pipeline

## When to Use This Skill

Load when setting up a new project's build tools or migrating from legacy tooling. The Rust-powered toolchain replaces ESLint + Prettier + PostCSS with faster, simpler alternatives.

---

## The Shift

| Old | New | Improvement |
|-----|-----|-------------|
| ESLint + Prettier (2 configs, plugin conflicts) | Biome 2.0 (1 config, lint + format) | 100x faster, zero config conflicts |
| PostCSS + autoprefixer + cssnano (3 tools) | Lightning CSS (1 tool) | 100x faster CSS processing |
| webpack (dev server) | Turbopack (Next.js default) | 10x faster HMR |
| Rollup/esbuild (builds) | Rolldown (Vite 7+) | 7x faster production builds |

---

## Biome 2.0

> Full config reference: [references/biome-config.md](references/biome-config.md)
> Migration guide: [references/migration-eslint-to-biome.md](references/migration-eslint-to-biome.md)

Replaces ESLint + Prettier with a single Rust-powered tool. 450+ lint rules, formatting, import sorting — one binary, one config.

### Quick Start

```bash
npm install --save-dev --save-exact @biomejs/biome
npx @biomejs/biome init
```

### Recommended Config for Next.js

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignore": [".next", "node_modules", "dist", ".vercel"]
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsole": "warn"
      },
      "complexity": {
        "noForEach": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

### Usage

```bash
# Check (lint + format check)
npx biome check .

# Fix everything (lint fix + format)
npx biome check --write .

# Format only
npx biome format --write .

# Lint only
npx biome lint .

# CI mode (exits with error code)
npx biome ci .
```

### package.json Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

### VS Code Integration

Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome). Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Lightning CSS

> Full reference: [references/lightning-css.md](references/lightning-css.md)

Replaces PostCSS + autoprefixer + cssnano. Already the default CSS minifier in Vite.

### What It Handles (no plugins needed)
- Vendor prefixing (replaces autoprefixer)
- CSS Nesting (native syntax)
- Custom media queries
- Color functions (oklch, color-mix, light-dark)
- Minification (replaces cssnano)

### Vite Integration (experimental full mode)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: { chrome: 120, firefox: 120, safari: 17 },
      drafts: {
        customMedia: true,
      },
    },
  },
  build: {
    cssMinify: 'lightningcss', // Already default in Vite 6+
  },
});
```

### With Tailwind CSS v4

Tailwind CSS v4 uses Lightning CSS internally. No additional PostCSS config needed:

```css
/* globals.css — just import Tailwind, Lightning CSS handles the rest */
@import "tailwindcss";
```

No `postcss.config.js`, no `autoprefixer`, no `tailwindcss` PostCSS plugin. It just works.

---

## Turbopack

Default dev bundler in Next.js 15+. No configuration needed.

```bash
# Already the default — just run
next dev
# Explicitly enable (if downgraded)
next dev --turbopack
```

### Key Characteristics
- 10x faster HMR than webpack
- Incremental computation — only rebuilds what changed
- Tree-shaking in development mode
- Not available outside the Next.js ecosystem
- Production builds still use webpack (Turbopack prod in preview)

### Configuration (next.config.ts)

```typescript
const nextConfig: NextConfig = {
  // Turbopack-specific options
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      // Custom module aliases
    },
  },
};
```

---

## Rolldown (Vite 7+)

Rust-based Rollup successor. Drop-in replacement in Vite 7+ via `rolldown-vite`.

```bash
# Replace vite with rolldown-vite
npm install rolldown-vite --save-dev
```

```typescript
// vite.config.ts — no changes needed, same API
import { defineConfig } from 'vite'; // or 'rolldown-vite'
```

**Results:** GitLab reported 7x build time reduction (2.5 min → 22 seconds).

---

## Migration Decision Guide

| Current Setup | Action |
|---|---|
| ESLint + Prettier | Migrate to Biome 2.0 (see migration guide) |
| PostCSS + autoprefixer | Lightning CSS (Vite) or keep PostCSS (Next.js, for now) |
| webpack dev server | Turbopack (Next.js default) |
| Create React App | Migrate to Vite + Biome |
| Rollup production builds | Consider Rolldown when on Vite 7+ |

### When NOT to Migrate
- **ESLint with custom rules** — if you have many custom rules, wait for Biome's GritQL plugin engine
- **PostCSS with custom plugins** — Lightning CSS doesn't support arbitrary PostCSS plugins
- **Non-Next.js projects** — Turbopack is Next.js only; use Vite + Rolldown instead
