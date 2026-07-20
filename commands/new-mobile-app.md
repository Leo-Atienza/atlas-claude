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

## Step 2 -- Load mobile skills

Read these SKILL.md files (do NOT skip):
1. `~/.claude/skills/app-l100/SKILL.md` -- Universal Conductor (SK-058)
2. `~/.claude/skills/expo-deployment/SKILL.md` -- Expo deployment patterns
3. `~/.claude/skills/expo-dev-client/SKILL.md` -- Dev client setup
4. `~/.claude/skills/native-data-fetching/SKILL.md` -- Data fetching patterns

From ACTIVE-DIRECTORY, activate: SK-058, SK-097 (motion-native), SK-098 (visual-native)

## Step 3 -- Install core dependencies

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install @supabase/supabase-js react-native-url-polyfill
npx expo install expo-secure-store
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens
```

## Step 4 -- Configure Supabase

1. Use Supabase MCP: connect to existing project or create new one
2. Generate TypeScript types via `generate_typescript_types`
3. Create `lib/supabase.ts`:
   - Initialize client with `expo-secure-store` for token persistence
   - Export typed client, auth helpers, and real-time subscription helpers
4. Create `lib/supabase.types.ts` with generated types

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
- Testing: Maestro for E2E (if available), Jest for unit tests
- Deployment: EAS Build + EAS Submit

## Step 8 -- Quality gates

- Run `npx expo start` to verify no errors (press `w` for web preview if no device)
- If Maestro MCP available: generate basic smoke test for auth flow
- Run TypeScript check: `npx tsc --noEmit`
- Security: verify no hardcoded keys, env vars used correctly

## Step 9 -- Wrap up

- Init git repo if not already in one
- Ask: "Ready to commit? [y/n]"
- Summarize: what was built, next steps (add screens, configure EAS, set up CI)
