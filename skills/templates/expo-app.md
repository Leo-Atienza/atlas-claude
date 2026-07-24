# Expo Mobile App Template

## Stack
- Expo SDK 57, Expo Router (SDK-aligned versioning, 57.x), React Native 0.86 (New Architecture mandatory)
- React Compiler (enabled by default)
- NativeWind v4 (Tailwind for RN)
- Supabase (Auth + DB + Storage)
- Reanimated 4 + Gesture Handler v2 + Moti
- FlashList, expo-haptics, expo-blur, expo-image
- Zustand v5 or Jotai v2 for state
- sqlite-vec (on-device vector search, optional)

## File Structure
```
app/
  (tabs)/index.tsx, explore.tsx
  (auth)/login.tsx, signup.tsx
  _layout.tsx
components/
  ui/, shared/, animations/
hooks/
  useHaptic.ts, useAuth.ts
lib/
  supabase.ts, storage.ts, query.ts
stores/
  auth-store.ts, app-store.ts
types/
```

## MCP Servers
supabase, expo, mobile

## Setup Checklist
- [ ] Expo project with TypeScript template (SDK 57)
- [ ] NativeWind v4 configured
- [ ] Supabase client setup
- [ ] Reanimated 4 + Gesture Handler installed
- [ ] FlashList for all lists (never FlatList)
- [ ] expo-image for all images (never RN Image)
- [ ] Haptics on every interactive element (useHaptic hook)
- [ ] MMKV for all key-value storage (never AsyncStorage)
- [ ] EAS Build configured
- [ ] expo-app-integrity for app verification (optional)
- [ ] sqlite-vec for on-device vector search (optional)

## Skills to Load
**tactile** (SK-134 — the mobile craft entry point; loads mobile-app-design SK-126) + the Expo ecosystem skills as the task needs (building-native-ui, expo-deployment, expo-dev-client, expo-tailwind-setup…).

### Optional Extensions
- SK-027 (E2E Testing) — cross-platform E2E via the mobile MCP
- SK-137 (Upgrading React Native) — version bumps on bare/ejected projects
- Archived (restore from `skills/_archived/` if needed): SK-016 (RN Core), SK-089 (Hardware Bridge), SK-090 (Local-First), SK-091 (Edge Intelligence), SK-092 (Monorepo). SK-058 (Universal Conductor) is retired (no archive copy).
