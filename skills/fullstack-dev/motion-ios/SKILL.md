# Motion iOS — iPhone-Like Smoothness Patterns

> Skill ID: FS-062 | Domain: Animation, Motion, UX Polish
> Stack: Motion for React (web), Reanimated 3/4 + Gesture Handler v2 + Moti (mobile), expo-haptics

## Core Principle

iOS feels premium because of **underdamped springs**, not easing curves. Every interaction uses spring physics with slight overshoot. Never use `ease-in-out` or `linear` for interactive elements.

---

## iOS Spring DNA — Design Tokens

```ts
// === WEB (Motion for React) ===
export const SPRING = {
  // Quick tap response (buttons, toggles, color changes)
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30, mass: 1 },
  // Standard navigation, sheets, modals
  standard: { type: 'spring' as const, stiffness: 300, damping: 26, mass: 1 },
  // Soft bouncy (hero expand, FAB, playful elements)
  bouncy: { type: 'spring' as const, stiffness: 200, damping: 18, mass: 1 },
} as const

// === MOBILE (Reanimated) ===
export const RN_SPRING = {
  snappy:   { stiffness: 500, damping: 30, mass: 1 },
  standard: { stiffness: 300, damping: 26, mass: 1 },
  bouncy:   { stiffness: 200, damping: 18, mass: 1 },
  // Reanimated 4 dampingRatio API (cleaner):
  // snappy:   { dampingRatio: 0.72, duration: 280 },
  // standard: { dampingRatio: 0.68, duration: 420 },
  // bouncy:   { dampingRatio: 0.58, duration: 500 },
} as const

// === CSS-ONLY (Tailwind / globals.css) ===
// Use linear() spring easing when JS springs aren't needed
// @theme {
//   --ease-spring-snappy: linear(0, 0.24, 0.59, 0.84, 0.96, 1.01, 1.02, 1.01, 1.01, 1, 1);
//   --ease-spring: linear(0, 0.09, 0.3, 0.53, 0.73, 0.88, 0.99, 1.04, 1.07, 1.07, 1.06, 1.04, 1.03, 1.01, 1, 1, 1);
// }
```

**When to use which:**
- `snappy` → buttons, toggles, tab switches, any tap response
- `standard` → sheets, modals, navigation, cards, accordions
- `bouncy` → hero images, FABs, playful/delightful moments

---

## Web — Motion for React

### Global Spring Default
```tsx
// app/providers.tsx — wrap app once
import { MotionConfig } from 'motion/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      reducedMotion="user"
    >
      {children}
    </MotionConfig>
  )
}
```

### Button Micro-Interaction (Most Common)
```tsx
<motion.button
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}
  transition={SPRING.snappy}
>
  {children}
</motion.button>
```

### Layout Animations (Auto-Animate Any Layout Change)
```tsx
// Accordion, list reorder, filter chips — layout prop handles everything
<motion.div layout transition={SPRING.standard}>
  <motion.h2 layout>{title}</motion.h2>
  <AnimatePresence>
    {isOpen && (
      <motion.div
        key="content"
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(4px)' }}
        transition={SPRING.standard}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

### Shared Element Transitions (layoutId)
```tsx
// Tab indicator that morphs between positions
{activeTab === tab.id && (
  <motion.div
    layoutId="tab-indicator"
    className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"
    transition={SPRING.snappy}
  />
)}

// Card → Detail hero animation
<motion.div layoutId={`card-${id}`} transition={SPRING.standard}>
  <motion.img layoutId={`image-${id}`} src={image} />
  <motion.h3 layoutId={`title-${id}`}>{title}</motion.h3>
</motion.div>
```

### View Transitions API (Next.js Page Transitions)
```tsx
// app/layout.tsx
import { ViewTransitions } from 'next-view-transitions'
<ViewTransitions>{children}</ViewTransitions>

// globals.css — spring easing for page transitions
::view-transition-old(root) {
  animation: 280ms cubic-bezier(0.4, 0, 0.2, 1) fade-out;
}
::view-transition-new(root) {
  animation: 380ms cubic-bezier(0.34, 1.56, 0.64, 1) fade-in;
}
```

### Scroll-Linked Header (60fps, No React State)
```tsx
import { useScroll, useTransform, useSpring, motion } from 'motion/react'

function StickyHeader() {
  const { scrollY } = useScroll()
  const smoothY = useSpring(scrollY, { stiffness: 300, damping: 40 })
  const opacity = useTransform(smoothY, [0, 80], [0, 1])
  const blur = useTransform(smoothY, [0, 80], [0, 12])

  return (
    <motion.header
      style={{
        opacity,
        backdropFilter: useTransform(blur, v => `blur(${v}px)`),
      }}
      className="fixed top-0 inset-x-0 z-50"
    />
  )
}
```

### Stagger Entrance
```tsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING.standard, delay: i * 0.05 }}
  />
))}
```

### iOS-Style Bottom Sheet (Web)
```tsx
// Key patterns: pointer capture, rubber-banding, velocity-based dismiss
// Rubber-band: translateY = 8 * Math.log(Math.abs(delta) + 1) when dragging past bounds
// Dismiss: currentY > height * 0.4 || velocity > 0.4
// During gesture: set style.transform imperatively (bypass React renders)
// After gesture: re-enable CSS transition with spring easing for snap
```

---

## Mobile — React Native / Expo

### Reanimated + Gesture Handler Foundation
```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'

// CRITICAL RULE: Only animate transform + opacity. Never animate height/width/padding.
// Bad:  { height: withSpring(200) }       // triggers layout every frame = JANK
// Good: { transform: [{ scaleY: withSpring(1) }], opacity: withTiming(1) }
```

### Gesture-Driven Interactions
```tsx
// Draggable card with spring snap-back
const offsetX = useSharedValue(0)
const offsetY = useSharedValue(0)
const scale = useSharedValue(1)

const pan = Gesture.Pan()
  .onBegin(() => {
    scale.value = withSpring(1.05, RN_SPRING.snappy)
  })
  .onUpdate((e) => {
    offsetX.value = startX.value + e.translationX
    offsetY.value = startY.value + e.translationY
  })
  .onFinalize(() => {
    offsetX.value = withSpring(0, RN_SPRING.standard)
    offsetY.value = withSpring(0, RN_SPRING.standard)
    scale.value = withSpring(1, RN_SPRING.snappy)
  })

// Swipeable row — velocity-based dismiss
// Dismiss when: Math.abs(translateX) > 120 || Math.abs(velocityX) > 800
```

### Haptics — The Secret Ingredient
```tsx
import * as Haptics from 'expo-haptics'

const haptic = {
  light:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium:  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error:   () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  select:  () => Haptics.selectionAsync(),
}

// Fire on gesture BEGIN (not end) — feels instant
// Use haptic.light for button presses
// Use haptic.select for picker/scroll ticks
// Use haptic.success for completed actions
// Use haptic.medium for toggle switches
```

### Moti — Declarative Animations
```tsx
import { MotiView, AnimatePresence } from 'moti'
import { MotiPressable } from 'moti/interactions'

// Mount animation
<MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'spring', ...RN_SPRING.standard }}
/>

// Stagger list entrance
{items.map((item, i) => (
  <MotiView
    key={item.id}
    from={{ opacity: 0, translateX: -20 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'spring', ...RN_SPRING.standard, delay: i * 60 }}
  />
))}

// Pressable with spring animation
<MotiPressable
  animate={({ pressed }) => ({
    'worklet': true,
    scale: pressed ? 0.96 : 1,
    opacity: pressed ? 0.85 : 1,
  })}
  transition={({ pressed }) => ({
    'worklet': true,
    type: 'spring',
    stiffness: pressed ? 600 : 300,
    damping: pressed ? 40 : 26,
  })}
/>
```

### Skeleton Loading (Moti)
```tsx
import { Skeleton } from 'moti/skeleton'

<Skeleton.Group show={!isLoaded}>
  <Skeleton radius="round" height={48} width={48} />
  <Skeleton height={14} width={120} />
  <Skeleton height={80} width="100%" />
</Skeleton.Group>
```

### FlashList (Never FlatList)
```tsx
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={posts}
  renderItem={renderItem}     // MUST be useCallback
  keyExtractor={keyExtractor} // MUST be useCallback
  estimatedItemSize={120}     // REQUIRED — measure a real item
  drawDistance={300}
/>
// Every list item component MUST be React.memo
```

### Shared Element Transitions (Expo Router)
```tsx
import Animated from 'react-native-reanimated'

// Source screen
<Animated.Image
  sharedTransitionTag={`image-${id}`}
  source={{ uri: thumbnail }}
/>

// Detail screen
<Animated.Image
  sharedTransitionTag={`image-${id}`}
  sharedTransitionStyle={SharedTransition.springify().damping(26).stiffness(300)}
  source={{ uri: fullImage }}
/>
```

### Depth & Polish
```tsx
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

// Frosted glass tab bar
<BlurView intensity={80} tint="systemChromeMaterial" />

// Gradient fade at bottom of scroll
<LinearGradient colors={['transparent', 'rgba(255,255,255,1)']}
  style={{ position: 'absolute', bottom: 0, height: 80, pointerEvents: 'none' }} />
```

### Keyboard Avoidance (Animated)
```tsx
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated'

const keyboard = useAnimatedKeyboard()
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: -keyboard.height.value }],
}))
```

### Progressive Images
```tsx
import { Image } from 'expo-image'

// expo-image (NOT RN Image) — handles blurhash natively
<Image source={uri} placeholder={{ blurhash }} transition={300} contentFit="cover" />
```

---

## Web — Skeleton / Shimmer (CSS-Only)
```tsx
// Pure CSS shimmer — zero JS overhead
<div className="relative overflow-hidden rounded-lg bg-neutral-100">
  <div className="absolute inset-0 -translate-x-full animate-shimmer
    bg-gradient-to-r from-transparent via-white/60 to-transparent" />
</div>

// tailwind keyframes:
// shimmer: { '100%': { transform: 'translateX(100%)' } }
// animation: shimmer 1.8s ease-in-out infinite
```

---

## 60fps Performance Rules

1. **Animate only `transform` and `opacity`** — everything else triggers layout/paint
2. **Never define components inside render** — kills memoization
3. **`React.memo` every list item** + `useCallback` for renderItem/keyExtractor
4. **Use refs for transient values** — scroll position, gesture state = useRef, NOT useState
5. **`estimatedItemSize` on FlashList** — without it, FlashList uses slow measurement path
6. **`content-visibility: auto`** on web list items — massive paint savings
7. **`will-change: transform, opacity`** on elements that will animate
8. **`-webkit-overflow-scrolling: touch`** + `overscroll-behavior-y: contain` on scroll containers
9. **Defer heavy work past animations** — `InteractionManager.runAfterInteractions` (mobile), `requestIdleCallback` (web)
10. **`reducedMotion="user"`** on MotionConfig — respects `prefers-reduced-motion` automatically

---

## Optimistic Updates Pattern (Universal)
```tsx
// 1. Update state instantly (before network call)
// 2. Fire network request
// 3. On error: revert state
// 4. Animate the state change with spring

// Button: animate scale [1, 1.3, 1] on optimistic toggle
// List: AnimatePresence for instant add/remove
// Form: disable submit, show spring-animated success state
```

---

## Quick Reference

| Need | Web | Mobile |
|---|---|---|
| Button press | `whileTap={{ scale: 0.96 }}` | `MotiPressable` + `haptic.light()` |
| Page transition | View Transitions API | Expo Router native stack |
| Shared element | `layoutId` | `sharedTransitionTag` |
| List | `content-visibility` | `FlashList` (never FlatList) |
| Skeleton | CSS shimmer | `moti/skeleton` |
| Scroll header | `useScroll` + `useTransform` | `useScrollViewOffset` + `interpolate` |
| Drag/pan | pointer capture (imperative) | `Gesture.Pan()` + `useSharedValue` |
| Blur/depth | `backdrop-filter: blur()` | `expo-blur BlurView` |
| Haptics | Web Vibration API (limited) | `expo-haptics` (every tap) |
| Images | BlurHash + `next/image` | `expo-image` + `blurhash` |
