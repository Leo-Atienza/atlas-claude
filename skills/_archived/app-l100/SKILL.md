<!--
id: SK-058
name: app-l100
description: Universal App Conductor — orchestrates mobile (Expo/RN), desktop (Tauri), and universal apps. Routes to specialist skills for hardware, local-first, edge AI, and cross-platform monorepo. Includes premium mobile patterns (animation layer cake, springs, haptics).
keywords: l100, mobile, desktop, universal, app, react-native, expo, tauri, reanimated, gesture-handler, moti, flashlist, haptics, swiftui, swift, ios, android, bottom-sheet, skeleton, animation, cross-platform, local-first, edge-ai, monorepo
version: 2.0.0
-->

# Universal App Conductor — Building Premium Apps Across All Platforms

## When to Use This Skill

**Auto-activate when:** building any native app — mobile (React Native/Expo), desktop (Tauri), universal (multi-platform), iOS/Swift, or any app requiring device hardware, offline-first, or on-device AI. This is the CONDUCTOR skill for all native/cross-platform development.

**This skill does NOT replace specialist skills.** It orchestrates them.

## The Skill Map

| Task | Load Skill | ID |
|------|-----------|-----|
| React Native performance & patterns | `react-native` | SK-016 |
| Expo deployment & builds | `expo-deployment` | (archived, auto-activate) |
| Expo CI/CD workflows | `expo-cicd-workflows` | (archived, auto-activate) |
| **Tauri desktop apps** | **`tauri-desktop`** | **SK-088** |
| **Camera, scanning, biometrics, sensors** | **`device-hardware-bridge`** | **SK-089** |
| **Offline-first, CRDT sync** | **`local-first-architecture`** | **SK-090** |
| **On-device AI, ML inference, RAG** | **`edge-intelligence`** | **SK-091** |
| **Multi-platform monorepo** | **`crossplatform-monorepo`** | **SK-092** |
| **Native animations & motion** | **`motion-native`** | **SK-097** |
| **2D/3D visual rendering (Skia, Rive, R3F)** | **`visual-native`** | **SK-098** |
| **Screen transitions & smooth scroll** | **`transition-native`** | **SK-099** |
| **Sensory design (haptics + sound + motion tokens)** | **`sensory-native`** | **SK-100** |
| Swift concurrency review | `swift-concurrency-pro` | SK-035 |
| SwiftUI code review | `swiftui-pro` | SK-037 |
| Swift testing | `swift-testing-pro` | SK-036 |
| Data fetching & caching | `tanstack-ecosystem` | SK-055 |
| Unit/component testing | `vitest-testing` | SK-056 |
| Advanced JS/TS patterns | `advanced-javascript` | SK-045 |
| Design aesthetics | `frontend-design` | SK-005 |
| E2E testing (mobile + desktop) | `e2e-testing` | SK-027 |

---

## Platform Decision Matrix

| Scenario | Recommendation |
|---|---|
| New mobile app, team knows React | Expo SDK 54 (Managed Workflow) |
| Need custom native SDK not in Expo | Expo (Bare Workflow) with config plugins |
| Deep native customization, existing native team | React Native bare |
| iOS-only, premium native feel critical | Swift/SwiftUI native |
| Universal app (web + iOS + Android) | Expo + Expo Router + NativeWind |
| Shared codebase with Next.js web app | Turborepo monorepo + Expo + Next.js (SK-092) |
| **Desktop app (Windows/macOS/Linux)** | **Tauri 2.0 (SK-088)** |
| **Desktop + mobile from one codebase** | **Tauri 2.0 with mobile targets (SK-088)** |
| **Multi-platform (mobile + desktop + web)** | **Turborepo monorepo (SK-092) + Expo + Tauri + Next.js** |
| **Offline-first app with sync** | **Local-First Architecture (SK-090) + framework of choice** |
| **App with on-device AI/ML** | **Edge Intelligence (SK-091) + framework of choice** |
| **Camera/scanning/sensor-heavy app** | **Device Hardware Bridge (SK-089) + framework of choice** |

---

## The Full Stack (2026)

```
Mobile:        Expo SDK 54 / Expo Router v4 / React Native 0.82+ (New Architecture mandatory)
Desktop:       Tauri 2.0 (Rust backend + system WebView, 96% smaller than Electron)
Animation:     Reanimated 4 (mobile) / Motion + GSAP (desktop/web)
Local-First:   PowerSync / TinyBase v5 / Legend State v3
On-Device AI:  llama.rn / MediaPipe / sqlite-vec (on-device RAG pipeline)
Hardware:      Vision Camera v5 / expo-camera / Tauri plugins
State:         Zustand v5 + TanStack Query (server) + Jotai v2 (atomic)
Monorepo:      Turborepo + shared packages
Build:         React Compiler (default), precompiled iOS XCFrameworks
```

### Expo SDK 54 Highlights

- **Precompiled React Native for iOS** — XCFrameworks reduce clean build ~120s → ~10s
- **React Compiler enabled by default** — automatic memoization
- **sqlite-vec** — on-device vector search for RAG pipelines
- **TextDecoderStream** — streaming AI responses (local or remote)
- **expo-app-integrity** — DeviceCheck (iOS) + Play Integrity (Android)
- **Liquid Glass (iOS 26)** — `expo-glass-effect`, native tabs with glass sheen
- **Edge-to-edge Android 16** — always enabled, cannot be disabled

---

## Tauri Thread Model (Desktop)

```
┌─────────────────────────┐
│   Frontend (WebView)     │  React/Svelte/Vue — your existing web code
│   (system WebView2/WKW)  │  Animations, UI state, user interaction
└────────┬────────────────┘
         │ IPC: Commands + Events + Channels
┌────────▼────────────────┐
│   Rust Core              │  Business logic, file system, crypto, plugins
│   (compiled, type-safe)  │  Heavy computation, system access
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│   System APIs            │  OS notifications, tray, clipboard, updater
└─────────────────────────┘
```

**Performance:** <500ms startup, 30-40MB RAM, 2-10MB bundle. See SK-088 for full Tauri guide.

---

## The Thread Model — Understand This First

React Native New Architecture (mandatory since RN 0.82, bridge permanently removed):

```
┌─────────────────────┐
│     JS Thread        │  React, state updates, business logic
│  (Hermes engine)     │
└────────┬────────────┘
         │ JSI (synchronous, no bridge)
┌────────▼────────────┐
│     UI Thread        │  Native rendering, Fabric, gesture callbacks
│  (Reanimated worklets│   Reanimated worklets run HERE — 60fps guaranteed
│   run here)          │
└────────┬────────────┘
         │
┌────────▼────────────┐
│  Native Modules      │  TurboModules (async), camera, file system
└─────────────────────┘
```

**The bridge is gone.** JSI provides synchronous native calls. Hermes V1 experimental (RN 0.82+). Impact: 43% faster cold starts, 39% faster rendering, 26% lower memory.

---

## The Animation Layer Cake

Every animated element belongs to exactly ONE layer. Never mix tools on the same element.

```
Layer 4 — Complex Gesture-Driven UI
  → Reanimated 4 + Gesture Handler v2 (worklets on UI thread)
  → Bottom sheets, swipe-to-dismiss, drag-to-reorder, pinch-to-zoom

Layer 3 — Scroll-Linked Animations
  → Reanimated useAnimatedScrollHandler
  → Header collapse, parallax, sticky headers, scroll-driven opacity

Layer 2 — Component Enter/Exit
  → Moti (declarative Reanimated wrapper)
  → Screen entrances, skeleton shimmer, toggle states, presence animations

Layer 1 — Micro-interactions
  → Reanimated springs on shared values
  → Button press scale, toggle flip, checkbox bounce

Layer 0 — Navigation Transitions
  → Expo Router native stack (react-native-screens)
  → Push/pop/modal/sheet built-in animations
```

**Rule:** Only `transform` and `opacity` are GPU-composited. Never animate `width`, `height`, `top`, `left` — they trigger Yoga layout recalculation and drop frames.

---

## Spring Physics — The Numbers That Feel Right

```tsx
import { withSpring } from 'react-native-reanimated';

// Button press — snappy, immediate feedback
withSpring(0.95, { damping: 20, stiffness: 400 })

// Card expand — bouncy, playful
withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 })

// Sheet dismiss — smooth, controlled
withSpring(0, { damping: 25, stiffness: 300 })

// Toggle switch — crisp
withSpring(1, { damping: 18, stiffness: 350 })

// Modal appear — gentle entrance
withSpring(1, { damping: 20, stiffness: 250 })
```

**Cardinal rule:** Springs for ALL interactive elements. Never `withTiming` with linear/ease for buttons, toggles, cards, or sheets.

---

## Project Setup (Expo)

```bash
npx create-expo-app@latest myapp
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install @gorhom/bottom-sheet
npx expo install expo-haptics expo-image expo-blur
npx expo install @shopify/flash-list
npx expo install react-native-mmkv
npm install moti zustand jotai @tanstack/react-query zeego
```

### App Structure (Expo Router v4)

```
src/
├── app/                         # Routes ONLY — no logic
│   ├── _layout.tsx              # Root: providers, fonts, splash
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator
│   │   ├── index.tsx            # Home
│   │   └── profile.tsx          # Profile
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── post/[id].tsx            # Dynamic route
├── components/                  # Shared UI components
├── hooks/                       # useHaptic, useAuth, etc.
├── stores/                      # Zustand + Jotai atoms
├── lib/                         # API client, storage, springs
└── utils/
```

### Root Layout (Providers)

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/lib/query';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### Storage (MMKV — 30x faster than AsyncStorage)

```tsx
// lib/storage.ts
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

// Synchronous — no await needed
storage.set('user.token', token);
const token = storage.getString('user.token');
storage.delete('user.token');
```

### TanStack Query + MMKV Persistence (Offline-First)

```tsx
// lib/query.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { storage } from './storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
});
```

---

## Haptic Feedback — Every Interaction Gets a Tap

```tsx
// hooks/useHaptic.ts
import * as Haptics from 'expo-haptics';

export const useHaptic = () => ({
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  select: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
});
```

**When to use which:**

| Interaction | Haptic | Notes |
|---|---|---|
| Button tap | `tap()` (Medium) | Every interactive button |
| Toggle / switch | `light()` | On state change, not on press |
| Picker scroll step | `select()` | Each item tick |
| Form submit success | `success()` | One-time confirmation |
| Delete confirm | `warning()` | Before the destructive action |
| Auth/validation error | `error()` | |
| Drag start | `tap()` | |
| Drag drop / snap | `heavy()` | Landing feeling |
| Long press (context menu) | `heavy()` | |

---

## Animation Patterns

### Button with Press Feedback (Gesture Handler, NOT Pressable)

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function AnimatedButton({ onPress, children }: Props) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
    })
    .onFinalize((_e, success) => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (success) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onPress)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

**Why GestureDetector over Pressable:** `Pressable.onPressIn` routes through JS thread. `Gesture.Tap().onBegin` runs as a worklet on UI thread — zero-latency animation start.

### Screen Entrance (Moti — Declarative)

```tsx
import { MotiView } from 'moti';

function ScreenContent() {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 250 }}
    >
      {/* Screen content */}
    </MotiView>
  );
}
```

### Staggered List Entrance (Moti)

```tsx
import { MotiView } from 'moti';

function StaggeredList({ items }: { items: Item[] }) {
  return (
    <>
      {items.map((item, index) => (
        <MotiView
          key={item.id}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            damping: 18,
            stiffness: 250,
            delay: index * 80,
          }}
        >
          <ItemCard item={item} />
        </MotiView>
      ))}
    </>
  );
}
```

### Collapsing Header (Reanimated + ScrollHandler)

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const HEADER_MAX = 200;
const HEADER_MIN = 80;

function CollapsingHeaderScreen() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HEADER_MAX - HEADER_MIN],
      [HEADER_MAX, HEADER_MIN],
      Extrapolation.CLAMP,
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(scrollY.value, [0, 60], [1, 0.8], Extrapolation.CLAMP),
    }],
  }));

  return (
    <>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.Text style={[styles.title, titleStyle]}>Feed</Animated.Text>
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {/* Content */}
      </Animated.ScrollView>
    </>
  );
}
```

### Bottom Sheet (Gorhom v5)

```tsx
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';

function MapScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  return (
    <>
      <MapView style={{ flex: 1 }} />
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#ccc', width: 40 }}
      >
        <BottomSheetScrollView>
          {/* Sheet content */}
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
```

Gorhom v5 uses Reanimated v4 + Gesture Handler v2 natively. Velocity-based dismiss is built in.

### Swipe-to-Dismiss Card (Gesture Handler v2)

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from 'react-native-reanimated';

function SwipeCard({ onDismiss }: { onDismiss: () => void }) {
  const translateX = useSharedValue(0);
  const DISMISS_THRESHOLD = 150;

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > DISMISS_THRESHOLD || Math.abs(e.velocityX) > 800) {
        translateX.value = withSpring(e.translationX > 0 ? 500 : -500, { damping: 20 });
        runOnJS(onDismiss)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
    opacity: interpolate(Math.abs(translateX.value), [0, 200], [1, 0.5]),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        {/* Card content */}
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## List Performance — FlashList, Always

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  estimatedItemSize={88}
  keyExtractor={(item) => item.id}
  getItemType={(item) => item.type}  // Critical for heterogeneous lists
/>
```

**Rules:**
- `React.memo` every list item (React Compiler now default in SDK 54 — handles this automatically for new projects)
- Pass primitives to items, not objects (`userId={user.id}` not `user={user}`)
- Stable callbacks — `useCallback` for `onPress` handlers passed to items
- `estimatedItemSize` is required — use average height across item types
- `getItemType` when items have different layouts — prevents recycling mismatches

**Performance comparison:**

| Component | 5000-item load | Scroll FPS | Memory |
|---|---|---|---|
| ScrollView | 1-3s freeze | <30 FPS | High |
| FlatList | ~100ms | ~45 FPS | Medium |
| FlashList | ~50ms | ~54 FPS | Low |

---

## Images — expo-image + BlurHash

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={{ blurhash: item.blurhash }}
  contentFit="cover"
  transition={300}
  cachePolicy="memory-disk"
  style={styles.image}
/>
```

Generate BlurHash on the server when images are uploaded. The hash is 20-30 characters — embed in API responses.

---

## Loading States — Skeleton, Never Spinner

```tsx
import { Skeleton } from 'moti/skeleton';
import { MotiView } from 'moti';

function FeedItemSkeleton() {
  return (
    <MotiView style={styles.row}>
      <Skeleton colorMode="light" width={40} height={40} radius="round" />
      <MotiView style={styles.textCol}>
        <Skeleton colorMode="light" width="70%" height={16} radius={4} />
        <Skeleton colorMode="light" width="40%" height={12} radius={4} />
      </MotiView>
    </MotiView>
  );
}

// In the screen
function FeedScreen() {
  const { data, isLoading } = useQuery(feedQuery);

  if (isLoading) {
    return (
      <FlashList
        data={Array(8).fill(null)}
        renderItem={() => <FeedItemSkeleton />}
        estimatedItemSize={72}
      />
    );
  }

  return <FlashList data={data} renderItem={renderItem} estimatedItemSize={72} />;
}
```

---

## Native Menus — Zeego (Not JS Overlays)

```tsx
import * as ContextMenu from 'zeego/context-menu';

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <Pressable><PostCard post={post} /></Pressable>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item key="share" onSelect={() => sharePost(post.id)}>
      <ContextMenu.ItemTitle>Share</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'square.and.arrow.up' }} />
    </ContextMenu.Item>
    <ContextMenu.Item key="delete" onSelect={() => deletePost(post.id)} destructive>
      <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon ios={{ name: 'trash' }} />
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>
```

Zeego renders native `UIMenu` on iOS and `PopupMenu` on Android. Never build a custom JS menu component.

---

## Navigation — Defer Heavy Work Past Transitions

```tsx
import { useFocusEffect } from 'expo-router';
import { InteractionManager } from 'react-native';

export default function FeedScreen() {
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchFeedData();
        initializeAnalytics();
      });
      return () => task.cancel();
    }, [])
  );
}
```

Without this, data fetching during a navigation slide-in competes for JS thread time and causes jank.

---

## Scroll — Never Track Position in State

```tsx
// WRONG — re-renders entire tree on every scroll pixel
const [scrollY, setScrollY] = useState(0);
<ScrollView onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)} />

// CORRECT — stays on UI thread, zero re-renders
const scrollY = useSharedValue(0);
const handler = useAnimatedScrollHandler({
  onScroll: (event) => {
    'worklet';
    scrollY.value = event.contentOffset.y;
  },
});
<Animated.ScrollView onScroll={handler} scrollEventThrottle={16} />
```

---

## State Architecture

```
┌─────────────────────────────────────┐
│  Server State: TanStack Query       │  API data, cached + persisted to MMKV
│  (offline-first via MMKV persister) │
├─────────────────────────────────────┤
│  Client State: Zustand              │  Auth, settings, UI preferences
│  (persisted to MMKV)               │
├─────────────────────────────────────┤
│  UI State: Jotai atoms              │  Fine-grained: modals, filters, toggles
│  (ephemeral, not persisted)         │
├─────────────────────────────────────┤
│  Animation State: Reanimated        │  Shared values on UI thread
│  (never in React state)             │
└─────────────────────────────────────┘
```

**Zustand + MMKV persistence:**
```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null as string | null,
      user: null as User | null,
      setAuth: (token: string, user: User) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage', storage: mmkvStorage }
  )
);
```

---

## Native iOS/Swift — Quick Reference

### @Observable (iOS 17+) — NOT ObservableObject

```swift
@Observable
@MainActor
final class FeedViewModel {
    var posts: [Post] = []
    var isLoading = false

    func loadPosts() async {
        isLoading = true
        posts = try? await PostService.shared.fetchFeed() ?? []
        isLoading = false
    }
}

// View — no @StateObject, no @ObservedObject needed
struct FeedView: View {
    @State private var viewModel = FeedViewModel()
    var body: some View {
        List(viewModel.posts) { PostRow(post: $0) }
            .task { await viewModel.loadPosts() }
    }
}
```

### Navigation (matchedTransitionSource, iOS 18)

```swift
@Namespace private var heroNamespace

NavigationStack {
    LazyVGrid(columns: columns) {
        ForEach(photos) { photo in
            NavigationLink(value: photo) {
                PhotoThumbnail(photo: photo)
                    .matchedTransitionSource(id: photo.id, in: heroNamespace)
            }
        }
    }
    .navigationDestination(for: Photo.self) { photo in
        PhotoDetailView(photo: photo)
            .navigationTransition(.zoom(sourceID: photo.id, in: heroNamespace))
    }
}
```

### Animation Rules

```swift
// ALWAYS provide value parameter
Text(score).animation(.bouncy, value: score)

// Chain animations with completion
withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
    isExpanded = true
} completion: {
    withAnimation(.easeOut(duration: 0.2)) { showContent = true }
}

// Use .task, never onAppear for async
.task { await viewModel.loadData() }

// Use @MainActor, never DispatchQueue.main.async
await MainActor.run { updateUI() }
```

### SwiftUI Performance

```swift
// Extract subviews as separate structs — never computed properties
struct HeaderSection: View { var body: some View { ... } }

// Ternary for conditional modifiers — preserves view identity
view.background(isSelected ? .blue : .gray)

// LazyVStack in ScrollView for large datasets
ScrollView { LazyVStack { ForEach(items) { ItemRow(item: $0) } } }
```

---

## Performance Checklist

### Animation
- [ ] Only animate `transform` + `opacity` (GPU-composited)
- [ ] All interactive elements use springs, never timing with easing
- [ ] Gesture callbacks are worklets (UI thread) — not JS callbacks
- [ ] Scroll position tracked via `useSharedValue`, never `useState`
- [ ] `InteractionManager.runAfterInteractions` for heavy work after nav transitions

### Lists
- [ ] FlashList for any list > 20 items (never FlatList)
- [ ] `React.memo` every list item with proper comparison
- [ ] Pass primitives to items, not objects
- [ ] Stable callbacks via `useCallback`
- [ ] `estimatedItemSize` + `getItemType` configured

### Images
- [ ] `expo-image` everywhere (never `<Image>` from react-native)
- [ ] BlurHash placeholder for every image
- [ ] `cachePolicy="memory-disk"` for aggressive caching
- [ ] `transition={300}` for smooth load-in

### Loading
- [ ] Skeleton screens via `moti/skeleton`, never spinners
- [ ] Optimistic updates for mutations
- [ ] TanStack Query + MMKV persister for offline-first

### Haptics
- [ ] Every button tap gets `impactAsync(Medium)`
- [ ] Toggles get `impactAsync(Light)` on state change
- [ ] Success/error/warning actions get matching notification haptics
- [ ] `useHaptic` hook for consistent usage

### Native Feel
- [ ] Zeego for context menus (native UIMenu/PopupMenu)
- [ ] Gorhom Bottom Sheet v5 for sheets
- [ ] `expo-blur` for depth/frosted glass
- [ ] Native navigation stack (Expo Router) — never JS-based navigation

### Storage
- [ ] MMKV for all key-value storage (never AsyncStorage in production)
- [ ] Zustand + MMKV for persisted client state
- [ ] TanStack Query + MMKV for cached server state

### Performance Targets

| Metric | Good | Acceptable | Needs Work |
|---|---|---|---|
| Full TTI | <2s | 2-4s | >4s |
| JS bundle load | <500ms | 500ms-1s | >1s |
| Scroll FPS | 60 | 50-59 | <50 |
| Navigation transition | Smooth | Minor stutter | Noticeable jank |

---

## The Full L100 Mobile Stack

```
Framework:      Expo SDK 52+ / Expo Router v4
Animation:      Reanimated 4 + react-native-worklets (UI thread)
Gestures:       Gesture Handler v2 (GestureDetector, worklets)
Declarative:    Moti (enter/exit, skeletons, toggles)
Lists:          FlashList (@shopify/flash-list)
Images:         expo-image + BlurHash
Haptics:        expo-haptics (typed useHaptic hook)
Depth:          expo-blur (frosted glass)
Menus:          Zeego (native UIMenu / PopupMenu)
Sheets:         @gorhom/bottom-sheet v5
Storage:        MMKV (sync, 30x AsyncStorage)
Server state:   TanStack Query v5 + MMKV persister (offline-first)
Client state:   Zustand (persisted) + Jotai (ephemeral)
UI state:       Reanimated shared values (animation)
Styling:        NativeWind v4 (Tailwind for RN)
Navigation:     Expo Router v4 (file-based, native stacks)
Testing:        Vitest (SK-056) for logic + Maestro for E2E
Deployment:     EAS Build + EAS Update (OTA)
CI/CD:          EAS Workflows (YAML, Git-triggered)
```
