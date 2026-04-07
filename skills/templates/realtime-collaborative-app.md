# Real-Time Collaborative App Blueprint

## Archetype
Multi-user real-time apps: whiteboard, document editor, multiplayer game, shared dashboard, collaborative design tool, kanban board.

## Stack
- Expo SDK 54 (mobile) or Next.js 16 (web) or both via monorepo (SK-092)
- Legend State v3 (signals + built-in CRDT sync) or TinyBase v5 (MergeableStore CRDT)
- Supabase Realtime (presence, broadcast channels)
- Reanimated 4 (collaborative cursors, live indicators)
- Zustand v5 (local UI state)

## Skills to Load
SK-058 (Universal Conductor), SK-090 (Local-First), SK-092 (Monorepo if multi-platform), SK-047 (Motion for web) or SK-058 for mobile animation

## Architecture
```
┌──────────────────────────────────────────────────┐
│                   Client A                        │
│  ┌──────────────┐    ┌──────────────────────┐    │
│  │ Local CRDT   │◄──▶│ Supabase Realtime    │    │
│  │ (Legend State │    │ (presence + broadcast)│    │
│  │  or TinyBase) │    └──────────┬───────────┘    │
│  └──────────────┘               │                │
└──────────────────────────────────┼────────────────┘
                                  │ WebSocket
                          ┌───────▼───────┐
                          │   Supabase    │
                          │   Server      │
                          └───────┬───────┘
                                  │ WebSocket
┌──────────────────────────────────┼────────────────┐
│                   Client B       │                │
│  ┌──────────────┐    ┌──────────▼───────────┐    │
│  │ Local CRDT   │◄──▶│ Supabase Realtime    │    │
│  │ (auto-merge) │    │ (presence + broadcast)│    │
│  └──────────────┘    └──────────────────────┘    │
└──────────────────────────────────────────────────┘
```

- CRDT-based shared state (automatic conflict resolution)
- Optimistic local updates, async sync
- Presence indicators (who's editing what)
- Cursor/selection broadcasting
- Undo/redo via CRDT history

## File Structure
```
app/
  (tabs)/
    index.tsx             # Project list
    activity.tsx          # Activity feed
  workspace/[id].tsx      # Collaborative workspace
  _layout.tsx
components/
  Canvas.tsx              # Shared canvas/editor
  PresenceAvatars.tsx     # Who's online indicators
  CursorOverlay.tsx       # Other users' cursors
  ConflictBanner.tsx      # Conflict resolution UI
hooks/
  useCollaboration.ts     # CRDT + presence hook
  usePresence.ts          # User presence tracking
  useCursors.ts           # Cursor position sharing
lib/
  crdt.ts                 # Legend State or TinyBase setup
  realtime.ts             # Supabase Realtime channels
stores/
  workspace-store.ts      # CRDT-backed workspace state
  presence-store.ts       # Presence indicators
```

## Setup Checklist
- [ ] CRDT engine selected (Legend State v3 or TinyBase v5)
- [ ] Supabase Realtime configured for presence + broadcast
- [ ] Optimistic UI updates with instant local feedback
- [ ] Conflict resolution strategy defined (CRDT auto-merge)
- [ ] Presence indicators (avatars, colored cursors)
- [ ] Cursor position broadcasting
- [ ] Offline support with auto-reconnect and state merge
- [ ] Undo/redo via CRDT history
- [ ] Activity feed showing real-time changes
- [ ] Haptics on collaborative events (join, edit, conflict)
