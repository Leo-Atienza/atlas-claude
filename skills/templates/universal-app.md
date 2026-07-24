# Universal App Blueprint

## Archetype
Apps that run on all platforms from one codebase: productivity tools, messaging, note-taking, project management, CRM, task managers.

## Stack
- Turborepo monorepo
- apps/mobile: Expo SDK 57 + Expo Router (SDK-aligned, 57.x)
- apps/desktop: Tauri 2.x + React
- apps/web: Next.js 16 + App Router
- packages/shared: types, utils, stores, API client, validators
- packages/ui: platform-specific component implementations
- Supabase (backend) + PowerSync (sync)

## Skills to Load
**impeccable** (SK-102) for the web app; **tactile** (SK-134) + the Expo skills for mobile. Note: SK-092 (Monorepo), SK-088 (Tauri), SK-090 (Local-First) and SK-083 (Vanguard) are archived — restore from `skills/_archived/` if building this archetype; SK-058 (Universal Conductor) is retired (no archive copy)

## Architecture
```
┌─────────────────── Turborepo ───────────────────┐
│                                                  │
│  apps/mobile (Expo)   apps/web (Next.js)        │
│  ┌───────────────┐   ┌───────────────┐          │
│  │ Expo Router   │   │ App Router    │          │
│  │ NativeWind    │   │ Tailwind CSS  │          │
│  │ Reanimated 4  │   │ Motion        │          │
│  └───────┬───────┘   └───────┬───────┘          │
│          │                   │                   │
│  apps/desktop (Tauri)        │                   │
│  ┌───────────────┐           │                   │
│  │ React + Vite  │           │                   │
│  │ Rust backend  │           │                   │
│  └───────┬───────┘           │                   │
│          │                   │                   │
│  ┌───────▼───────────────────▼───────┐           │
│  │     packages/shared (100% reuse)  │           │
│  │  types/ utils/ stores/ api/ zod/  │           │
│  └───────────────┬───────────────────┘           │
│  ┌───────────────▼───────────────────┐           │
│  │     packages/ui (~70% reuse)      │           │
│  │  Button.native.tsx / Button.web   │           │
│  └───────────────────────────────────┘           │
└──────────────────────────────────────────────────┘
                    │
            ┌───────▼───────┐
            │   Supabase    │
            │ + PowerSync   │
            └───────────────┘
```

- Shared business logic in packages/shared (100% reuse)
- UI components with `.native.tsx` / `.web.tsx` variants (~70% reuse)
- One Zustand store, platform-specific persisters
- One API client, one set of Zod validators
- PowerSync for offline-capable sync across all platforms

## File Structure
```
apps/
  mobile/
    app.json, metro.config.js
    app/                      # Expo Router routes
  desktop/
    src/                      # React frontend
    src-tauri/                # Rust backend
  web/
    next.config.ts
    app/                      # App Router routes
packages/
  shared/
    src/
      types/                  # Shared TypeScript types
      utils/                  # Pure functions
      stores/                 # Zustand stores
      api/                    # Fetch-based API client
      validators/             # Zod schemas
  ui/
    src/
      Button.tsx              # Re-exports platform variant
      Button.native.tsx       # RN implementation
      Button.web.tsx          # Web implementation
  config/
    tsconfig/
    eslint-config/
turbo.json
package.json
```

## Setup Checklist
- [ ] Turborepo workspace with `apps/` and `packages/`
- [ ] `packages/shared` with types + utils + stores + API client + validators
- [ ] `packages/ui` with platform-specific variants
- [ ] `apps/mobile` Expo SDK 57 project with Metro resolving packages
- [ ] `apps/desktop` Tauri 2.x project with Vite resolving packages
- [ ] `apps/web` Next.js 16 project
- [ ] Shared Zustand stores with platform-specific persisters
- [ ] PowerSync or ElectricSQL for cross-platform sync
- [ ] CI/CD matrix: EAS Build (mobile) + tauri build (desktop) + Vercel (web)
- [ ] Turborepo remote caching configured
