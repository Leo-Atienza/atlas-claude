# Expo Mobile App Template

## Stack
- Expo SDK 52+, Expo Router v4
- NativeWind v4 (Tailwind for RN)
- Supabase (Auth + DB + Storage)
- Reanimated 3 + Gesture Handler v2 + Moti
- FlashList, expo-haptics, expo-blur
- Jotai or Zustand for state

## File Structure
```
app/
  (tabs)/index.tsx, explore.tsx
  (auth)/login.tsx, signup.tsx
  _layout.tsx
components/
  ui/, shared/, animations/
lib/
  supabase.ts, store.ts
types/
```

## MCP Servers
supabase, expo, mobile

## Setup Checklist
- [ ] Expo project with TypeScript template
- [ ] NativeWind v4 configured
- [ ] Supabase client setup
- [ ] Reanimated + Gesture Handler installed
- [ ] FlashList for all lists
- [ ] Haptics on every interactive element
- [ ] EAS Build configured

## Skills to Load
SK-058 (app-l100 orchestrator), FS-026, SK-016–SK-026 (from archive)
