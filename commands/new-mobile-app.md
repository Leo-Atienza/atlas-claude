# /new-mobile-app -- Scaffold an Expo + Supabase mobile project

You are handling: **$ARGUMENTS**

Execute autonomously from start to finish. Do not ask for permission to use tools, run validations, or invoke skills.

---

## Step 1 -- Scaffold Expo project

```bash
npx create-expo-app@latest <project-name> --template tabs
cd <project-name>
```

If no project name provided, ask one question: "What should I name the app?"

## Step 1a -- Seed the tactile design tokens (so the app is designed, not default)

Every new app starts from the **tactile starter tokens** — one typed StyleSheet module: an MD3
light+dark role palette tinted to a single brand hue, plus the spacing / type / radius / elevation
(iOS `shadow*` + Android `elevation` split) / motion / touch-target tiers. Every mounted
text-on-surface pair is **WCAG-AA verified by an OKLCH→sRGB→contrast computation**
(`skills/tactile/scripts/generate-tokens.mjs`), so the app looks designed before a single screen is
styled. It is deliberately **NativeWind-version-agnostic** — NativeWind v5 (the Tailwind-v4 `@theme`
path) is still preview-only (`npm view nativewind dist-tags` → stable `4.2.6` / preview `5.x`), so
plain StyleSheet tokens work today and survive the version churn (see `app-dev/stack.md`). This is
the mobile mirror of `/new-web` Step 1a's impeccable starter tokens.

Copy the starter tokens into the project:

```bash
mkdir -p theme
cp ~/.claude/skills/tactile/starter-tokens.ts theme/tokens.ts
```

Then change exactly two things — nothing else is required:

- **Brand hue** — edit `BRAND_H` in `~/.claude/skills/tactile/scripts/generate-tokens.mjs`, run
  `node ~/.claude/skills/tactile/scripts/generate-tokens.mjs` to confirm AA still holds, then
  `node ~/.claude/skills/tactile/scripts/generate-tokens.mjs --emit > theme/tokens.ts` to regenerate.
  Warm yellow-green hues (~90–140) can push white-on-brand below AA — the generator reports it; lower
  the brand `L` or darken `onPrimary` and re-run. **Do not hand-edit the baked hex** — the generator
  is the source of truth and the contrast proof.
- **The font faces** — run tactile's `<font_selection_procedure>` (SKILL.md), load via
  `@expo-google-fonts/*`, gate the root render on `useFonts(...)` (see
  `skills/tactile/reference/mobile-typography.md`), then set `fonts.display` / `fonts.body` in
  `theme/tokens.ts`. Avoid the AR-T14 reflex set (Inter / Poppins / SF-Pro-only / Syne / etc.).

Consume tokens in every screen — never a raw hex literal (AR-T05):

```tsx
import { useColors, type, space, elevation } from '@/theme/tokens';
const c = useColors();                       // light/dark from the system setting
<View style={{ backgroundColor: c.surface, padding: space.gutter, ...elevation.md }}>
  <Text style={[type.label, { color: c.onSurfaceVariant }]}>TODAY</Text>
</View>
```

> **`useColors()` follows the system light/dark setting — but only if the app lets it.** A fresh
> `create-expo-app` sets `"userInterfaceStyle": "light"` in `app.json`, which hard-locks
> `useColorScheme()` to light and leaves the entire dark palette dormant. Set it to `"automatic"`
> (then restart the dev server — `app.json` is read at start, not hot-reloaded) so the dark tokens
> engage. Caught live while runtime-proving the tokens, 2026-06-26.

The `create-expo-app --template tabs` scaffold ships its own default colour constants + themed
components — make `theme/tokens.ts` the single source of truth and migrate those references to it,
rather than keeping two parallel colour systems. Then `/tactile craft` the screens against these tokens.

## Step 2 -- Load mobile skills

Screens are built with **tactile** (SK-134) — the mobile craft entry point that supersedes mobile-app-design (SK-126) and routes to the deep build skills. Don't hand-design UI in this command; once the project scaffolds (Step 5+), run `/tactile craft <screen>` (or `/tactile teach` first to set `.tactile.md` design context).

Read these current SKILL.md files for the scaffold patterns (do NOT skip):
1. `~/.claude/skills/building-native-ui/SKILL.md` -- Expo Router screens, navigation, native tabs, styling
2. `~/.claude/skills/native-data-fetching/SKILL.md` -- fetch / React Query / SWR / offline / Expo Router `useLoaderData`
3. `~/.claude/skills/expo-deployment/SKILL.md` -- EAS Build / Submit (App Store / Play Store)
4. `~/.claude/skills/expo-dev-client/SKILL.md` -- custom dev client (TestFlight / internal)

For performance work load `react-native` (Callstack profiling); for native iOS/Android screens, `swiftui-pro` / `android-development`. Full routing: `<your-vault-path>/wiki/app-dev/capability-map.md`.

## Step 3 -- Install core dependencies

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
npx expo install expo-secure-store
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens
```

## Step 4 -- Configure Supabase

1. If the Supabase MCP is connected, use it to connect to / create the project; otherwise create the project in the Supabase dashboard (the MCP is not part of the default user-scope set — re-provision per `INSTALLED.md` if you want it)
2. Generate TypeScript types — Supabase MCP `generate_typescript_types`, or `npx supabase gen types typescript`
3. Create `lib/supabase.ts` — the React Native client init has non-obvious requirements (verify against the current Supabase RN guide before coding; checked 2026-06-26):
   - **Token storage — `expo-secure-store` alone is wrong.** SecureStore caps values at **2048 bytes**, but a Supabase session (access + refresh JWT + user) routinely exceeds that, so a raw SecureStore adapter silently corrupts the session. Use the official **`LargeSecureStore`** adapter (AES-encrypt the session into `AsyncStorage`, keep only the encryption key in SecureStore), or plain `AsyncStorage` if encryption-at-rest isn't required.
   - **Client options:** `createClient(url, anonKey, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })` — `detectSessionInUrl: false` because there is no browser URL to parse on native.
   - **Foreground refresh:** register an `AppState` listener — `supabase.auth.startAutoRefresh()` when state is `active`, `stopAutoRefresh()` otherwise; tokens only refresh while the app is foregrounded.
   - **v3-readiness** (supabase-js is v2.x with v3 in migration): do NOT pass a custom `auth.lock` (the lockless default is correct now); if you build the client inside a component, return `supabase.auth.dispose()` from the effect cleanup so HMR / StrictMode don't leak refresh timers.
   - Export the typed client + auth/session + real-time subscription helpers.
4. Create `lib/supabase.types.ts` with the generated types

## Step 5 -- Set up navigation + auth flow

1. Configure `app/_layout.tsx` with root navigation
2. Create `app/(auth)/` group:
   - `login.tsx` -- email/password + OAuth buttons
   - `register.tsx` -- sign up flow
   - `_layout.tsx` -- auth layout (no tabs)
3. Create `app/(tabs)/` group:
   - `index.tsx` -- home screen
   - `profile.tsx` -- user profile
   - `_layout.tsx` -- tab navigation with icons
4. Wire Supabase Auth session listener with expo-router redirect

## Step 6 -- Environment setup

1. Create `app.config.ts` (dynamic config) with env var support
2. Create `.env.local` with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   ```
3. Add `.env.local` to `.gitignore`

## Step 7 -- Generate project CLAUDE.md

Create a project-specific CLAUDE.md with:
- Stack: Expo + React Native + Supabase + TypeScript
- Key patterns: file-based routing, Supabase RLS, secure token storage
- Testing: the `mobile` MCP for device flows (the `e2e-testing` skill is archived — restore from `skills/_archived/e2e-testing/` if natural-language E2E specs are wanted); Jest for unit tests
- Deployment: EAS Build + EAS Submit

## Step 8 -- Quality gates

- Run `npx expo start` to verify no errors (press `w` for web preview if no device)
- If a device/simulator is available: smoke-test the auth flow via the `mobile` MCP
- Run TypeScript check: `npx tsc --noEmit`
- Security: verify no hardcoded keys, env vars used correctly

## Step 9 -- Wrap up

- Init git repo if not already in one
- Ask: "Ready to commit? [y/n]"
- Summarize: what was built, next steps (add screens, configure EAS, set up CI)
