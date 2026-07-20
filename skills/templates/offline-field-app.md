# Offline-First Field App Blueprint

## Archetype
Apps used in low-connectivity environments: field inspection, warehouse management, delivery tracking, agriculture, healthcare data collection, utility maintenance.

## Stack
- Expo SDK 54 + Expo Router v4
- PowerSync (Postgres sync) or TinyBase v5 (lightweight CRDT)
- Vision Camera v5 (photo capture, barcode scanning)
- expo-location + expo-sensors
- Zustand v5 + MMKV (local state)
- Supabase (backend when online)

## Skills to Load
SK-058 (Universal Conductor), SK-089 (Hardware Bridge), SK-090 (Local-First), SK-027 (E2E Testing)

## Architecture
```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ Camera/Scan  │────▶│ Local SQLite  │────▶│ Sync Queue │──▶ Server (Supabase)
│ (Vision Cam) │     │ (PowerSync)   │     │ (offline)  │
└─────────────┘     └──────────────┘     └────────────┘
                           │
                    ┌──────▼──────┐
                    │ MMKV Cache   │
                    │ (settings)   │
                    └─────────────┘
```

- All writes go to local DB first (PowerSync/TinyBase)
- Background sync when connectivity available
- Camera captures stored locally, uploaded in queue
- Barcode scanning via Vision Camera frame processors
- GPS tracking with battery-aware sampling

## File Structure
```
app/
  (tabs)/
    index.tsx           # Dashboard: pending/synced counts
    scan.tsx            # Camera + barcode scanner
    map.tsx             # Offline map with GPS
  inspection/[id].tsx   # Inspection form
  _layout.tsx
components/
  SyncIndicator.tsx     # Online/offline/syncing status
  ScanOverlay.tsx       # Barcode scanner UI
hooks/
  useSync.ts            # PowerSync hook
  useOfflineQueue.ts    # Mutation queue
lib/
  powersync.ts          # PowerSync setup
  supabase.ts           # Supabase client
stores/
  inspection-store.ts   # Zustand + MMKV
```

## Setup Checklist
- [ ] Expo project with TypeScript template
- [ ] PowerSync/TinyBase configured with Supabase backend
- [ ] Offline mutation queue with retry logic
- [ ] Camera + barcode scanning (Vision Camera v5)
- [ ] GPS tracking with battery-aware intervals
- [ ] Sync conflict resolution strategy defined
- [ ] Sync status indicator in UI
- [ ] Background sync task registered
- [ ] EAS Build + OTA updates configured
- [ ] Haptics on every interaction (SK-058 patterns)
