<!--
id: SK-092
name: crossplatform-monorepo
description: Cross-Platform Monorepo — Turborepo structure for mobile (Expo) + desktop (Tauri) + web (Next.js). Shared packages pattern, platform-specific implementations (.native.tsx/.web.tsx), unified auth/state/API, CI/CD matrix for all platforms.
keywords: monorepo, turborepo, cross-platform, shared-packages, expo, tauri, nextjs, platform-specific, ci-cd, eas-build, universal-app
version: 1.0.0
-->

# Cross-Platform Monorepo

## When to Use This Skill

**Auto-activate when:** building an app that targets 2+ platforms (mobile + web, mobile + desktop, or all three), setting up a monorepo with Turborepo, or sharing code between Expo/Tauri/Next.js projects. SK-058 (Universal Conductor) routes here.

---

## What Can Be Shared

| Layer | Mobile (Expo) | Desktop (Tauri) | Web (Next.js) | Shareable |
|-------|--------------|-----------------|---------------|-----------|
| Types/interfaces | Yes | Yes | Yes | **100%** |
| Business logic | Yes | Yes | Yes | **100%** |
| API client | Yes | Yes | Yes | **100%** |
| State stores | Yes | Yes | Yes | **95%** (persister differs) |
| Validation | Yes | Yes | Yes | **100%** |
| UI components | RN components | React components | React components | **~70%** (web↔desktop share, mobile diverges) |
| Navigation | Expo Router | React Router | Next.js Router | **0%** (platform-specific) |
| Storage | MMKV / SQLite | tauri-plugin-store / SQL | localStorage / IndexedDB | **0%** (use shared interface) |
| Native APIs | Expo modules | Tauri commands | Web APIs | **0%** (use shared interface) |

---

## Monorepo Structure

```
my-app/
├── apps/
│   ├── mobile/                 # Expo app
│   │   ├── app/                # Expo Router pages
│   │   ├── app.json
│   │   └── metro.config.js
│   ├── desktop/                # Tauri app
│   │   ├── src/                # React frontend
│   │   ├── src-tauri/          # Rust backend
│   │   └── tauri.conf.json
│   └── web/                    # Next.js app
│       ├── app/                # App Router pages
│       └── next.config.ts
├── packages/
│   ├── shared/                 # Business logic, types, validation
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── validation/
│   │   │   └── constants/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-client/             # Shared API/Supabase client
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── queries/
│   │   │   └── mutations/
│   │   └── package.json
│   ├── store/                  # Shared state (Zustand)
│   │   ├── src/
│   │   │   ├── auth-store.ts
│   │   │   ├── app-store.ts
│   │   │   └── types.ts
│   │   └── package.json
│   └── ui/                     # Shared React components (web + desktop)
│       ├── src/
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   └── index.ts
│       └── package.json
├── tooling/
│   ├── typescript/             # Shared tsconfig
│   │   └── base.json
│   └── eslint/                 # Shared ESLint config
│       └── base.js
├── turbo.json
├── package.json
└── .github/workflows/
    └── ci.yml
```

---

## Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "src-tauri/target/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Root package.json:**
```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*", "tooling/*"],
  "scripts": {
    "dev": "turbo dev",
    "dev:mobile": "turbo dev --filter=mobile",
    "dev:desktop": "turbo dev --filter=desktop",
    "dev:web": "turbo dev --filter=web",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.4"
  },
  "packageManager": "pnpm@9.15.0"
}
```

---

## Platform-Specific Implementations

### The `.native.tsx` / `.web.tsx` Pattern

Metro (Expo) and webpack/Vite (web/desktop) resolve platform extensions automatically:

```
packages/store/src/
  persist.ts          # Shared interface
  persist.native.ts   # MMKV implementation (mobile)
  persist.web.ts      # localStorage implementation (web + desktop)
  persist.tauri.ts    # tauri-plugin-store implementation (desktop)
```

**Shared interface:**
```typescript
// packages/store/src/persist.ts
export interface StoragePersister {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

**Mobile (MMKV):**
```typescript
// packages/store/src/persist.native.ts
import { MMKV } from 'react-native-mmkv';
import type { StoragePersister } from './persist';

const storage = new MMKV();

export const persister: StoragePersister = {
  getItem: async (key) => storage.getString(key) ?? null,
  setItem: async (key, value) => storage.set(key, value),
  removeItem: async (key) => storage.delete(key),
};
```

**Web:**
```typescript
// packages/store/src/persist.web.ts
import type { StoragePersister } from './persist';

export const persister: StoragePersister = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
};
```

**Desktop (Tauri):**
```typescript
// packages/store/src/persist.tauri.ts
import { LazyStore } from '@tauri-apps/plugin-store';
import type { StoragePersister } from './persist';

const store = new LazyStore('app-data.json');

export const persister: StoragePersister = {
  getItem: async (key) => (await store.get<string>(key)) ?? null,
  setItem: async (key, value) => { await store.set(key, value); await store.save(); },
  removeItem: async (key) => { await store.delete(key); await store.save(); },
};
```

---

## Shared State Store

```typescript
// packages/store/src/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoragePersister } from './persist';

interface AuthState {
  user: { id: string; email: string } | null;
  token: string | null;
  setAuth: (user: AuthState['user'], token: string) => void;
  clearAuth: () => void;
}

export function createAuthStore(persister: StoragePersister) {
  return create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        token: null,
        setAuth: (user, token) => set({ user, token }),
        clearAuth: () => set({ user: null, token: null }),
      }),
      {
        name: 'auth',
        storage: createJSONStorage(() => persister),
      }
    )
  );
}
```

**Usage in each app:**
```typescript
// apps/mobile/stores/auth.ts
import { createAuthStore } from '@myapp/store/auth-store';
import { persister } from '@myapp/store/persist'; // resolves to .native.ts
export const useAuthStore = createAuthStore(persister);

// apps/web/stores/auth.ts
import { createAuthStore } from '@myapp/store/auth-store';
import { persister } from '@myapp/store/persist'; // resolves to .web.ts
export const useAuthStore = createAuthStore(persister);
```

---

## Shared API Client

```typescript
// packages/api-client/src/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@myapp/shared/types/database';

export function createApiClient(supabaseUrl: string, supabaseKey: string) {
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// packages/api-client/src/queries/tasks.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getTasks(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTask(client: SupabaseClient, task: { title: string; user_id: string }) {
  const { data, error } = await client.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data;
}
```

---

## Metro Config (Expo)

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve packages from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure only one copy of react
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

---

## TypeScript Path Setup

```json
// tooling/typescript/base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}

// packages/shared/tsconfig.json
{
  "extends": "../../tooling/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

---

## CI/CD Matrix

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck lint test --filter='./packages/*'

  mobile:
    needs: shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=mobile

  desktop:
    needs: shared
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=desktop

  web:
    needs: shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=web
```

### Build & Deploy Commands

| Platform | Build | Deploy |
|----------|-------|--------|
| Mobile | `eas build --platform all` | `eas submit` |
| Desktop | `pnpm tauri build` | GitHub Releases + auto-updater |
| Web | `next build` | `vercel deploy` or `vercel --prod` |

---

## Adding a New Shared Package

```bash
mkdir -p packages/new-package/src
cd packages/new-package

# package.json
cat > package.json << 'EOF'
{
  "name": "@myapp/new-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  }
}
EOF

# Then in any app:
# pnpm add @myapp/new-package --workspace --filter mobile
```

---

## Integration

- **SK-058** — Universal Conductor routes multi-platform tasks here
- **SK-088** — Tauri Desktop Engine for the `apps/desktop/` target
- **SK-090** — Local-First Architecture shared across platforms via persister pattern
- **SK-091** — Edge Intelligence with platform-specific model loaders
- **SK-089** — Device Hardware Bridge for mobile-specific hardware access
