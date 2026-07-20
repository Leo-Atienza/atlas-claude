# Expo Mobile App Template

## Stack
- Expo SDK 54, Expo Router v4, React Native 0.82+ (New Architecture mandatory)
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
- [ ] Expo project with TypeScript template (SDK 54)
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
SK-058 (Universal Conductor), SK-016 (React Native Core from archive)

### Optional Extensions
- SK-089 (Hardware Bridge) — if using camera, scanning, biometrics
- SK-090 (Local-First) — if offline support needed
- SK-091 (Edge Intelligence) — if on-device AI/ML needed
- SK-092 (Monorepo) — if also building web/desktop
