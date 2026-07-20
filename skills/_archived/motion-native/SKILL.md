<!--
id: SK-097
name: motion-native
description: Native Motion Engine — Reanimated 4, Gesture Handler, Moti for 60fps native animations. Worklets, springs, gesture-driven motion, layout animations, scroll-linked effects. The GSAP equivalent for React Native.
keywords: reanimated, gesture-handler, moti, animation, native, mobile, springs, worklets, gesture, layout-animation, scroll-animation, swipe, pinch, drag, 60fps, ui-thread, shared-value
version: 1.0.0
-->

# Native Motion Engine

## When to Use This Skill

**Auto-activate when:** building native animations in React Native/Expo — spring animations, gesture-driven motion, layout transitions, scroll-linked effects, or any 60fps native interaction. SK-058 (Universal Conductor) routes here.

**Not for:** Web animations (use GSAP SK-042, Motion SK-047), Skia/3D rendering (use SK-098), screen transitions (use SK-099), or haptics/sound (use SK-100).

---

## The Stack

```
Reanimated 4        — Core animation engine (worklets, shared values, CSS animations)
Gesture Handler 2   — Native gesture recognition and composition
Moti                — Declarative animation API (mount/unmount/presence)
Legend State v3      — Fine-grained reactive components ($View, $Text)
```

**Requirements:** React Native 0.82+ (New Architecture mandatory), Expo SDK 54+

---

## Spring Presets — The Physics Library

Every animation starts with a spring. These presets cover 95% of use cases:

```typescript
// lib/motion-tokens.ts
import { WithSpringConfig } from 'react-native-reanimated';

export const springs = {
  /** Instant response, minimal overshoot — buttons, toggles */
  snappy: { damping: 20, stiffness: 300, mass: 0.8 } satisfies WithSpringConfig,

  /** Quick with slight bounce — cards, chips, selections */
  bouncy: { damping: 12, stiffness: 200, mass: 0.8 } satisfies WithSpringConfig,

  /** Smooth deceleration — modals, sheets, drawers */
  gentle: { damping: 20, stiffness: 120, mass: 1 } satisfies WithSpringConfig,

  /** Heavy, dampened — drag release, large elements */
  stiff: { damping: 28, stiffness: 350, mass: 1.2 } satisfies WithSpringConfig,

  /** Slow, dramatic — onboarding, celebrations */
  slow: { damping: 18, stiffness: 80, mass: 1.5 } satisfies WithSpringConfig,
} as const;

export type SpringPreset = keyof typeof springs;
```

---

## Core Pattern: Animated Style with Shared Values

The fundamental building block — all animations derive from this:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { springs } from '@/lib/motion-tokens';

function ScaleButton({ children, onPress }: ScaleButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95, springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, springs.snappy); }}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

---

## Reanimated 4: CSS Animations

New in v4 — declare CSS-style keyframe animations directly:

```typescript
import { CSSAnimationKeyframes, CSSAnimationConfig } from 'react-native-reanimated';

const fadeSlideIn: CSSAnimationKeyframes = {
  from: { opacity: 0, transform: [{ translateY: 20 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};

const fadeSlideConfig: CSSAnimationConfig = {
  animationName: fadeSlideIn,
  animationDuration: '300ms',
  animationTimingFunction: 'ease-out',
  animationFillMode: 'forwards',
};

function FadeSlideView({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View style={fadeSlideConfig}>
      {children}
    </Animated.View>
  );
}
```

### CSS Transitions (v4)

```typescript
import { CSSTransitionConfig } from 'react-native-reanimated';

const transitionConfig: CSSTransitionConfig = {
  transitionProperty: ['opacity', 'transform'],
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease-in-out',
};

function ToggleCard({ expanded }: { expanded: boolean }) {
  return (
    <Animated.View
      style={[
        transitionConfig,
        {
          opacity: expanded ? 1 : 0.6,
          transform: [{ scale: expanded ? 1 : 0.95 }],
        },
      ]}
    />
  );
}
```

---

## Gesture-Driven Animations

### Swipe to Dismiss

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { springs } from '@/lib/motion-tokens';

function SwipeToDismiss({ onDismiss, children }: SwipeToDismissProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value = 1 - Math.abs(e.translationX) / 300;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 150) {
        translateX.value = withTiming(e.translationX > 0 ? 400 : -400, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onDismiss)();
        });
      } else {
        translateX.value = withSpring(0, springs.bouncy);
        opacity.value = withSpring(1, springs.snappy);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

### Pinch to Zoom

```typescript
function PinchToZoom({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, springs.gentle);
        savedScale.value = 1;
      } else {
        savedScale.value = scale.value;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: focalX.value },
      { translateY: focalY.value },
      { scale: scale.value },
      { translateX: -focalX.value },
      { translateY: -focalY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

### Gesture Composition — Simultaneous Pan + Pinch

```typescript
function PanPinchView({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = e.scale;
    });

  // Run both gestures simultaneously
  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

---

## Layout Animations

Animate items entering, exiting, and rearranging:

```typescript
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
} from 'react-native-reanimated';

function AnimatedList({ items }: { items: Item[] }) {
  return (
    <Animated.View layout={LinearTransition.springify().damping(18).stiffness(200)}>
      {items.map((item) => (
        <Animated.View
          key={item.id}
          entering={SlideInRight.springify().damping(16).stiffness(180)}
          exiting={SlideOutLeft.duration(200)}
        >
          <ListItem item={item} />
        </Animated.View>
      ))}
    </Animated.View>
  );
}
```

### Custom Entering/Exiting

```typescript
import { EntryAnimationsValues, ExitAnimationsValues } from 'react-native-reanimated';

function customEntering(values: EntryAnimationsValues) {
  'worklet';
  return {
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.8 }, { translateY: 30 }],
    },
    animations: {
      opacity: withSpring(1, springs.snappy),
      transform: [
        { scale: withSpring(1, springs.bouncy) },
        { translateY: withSpring(0, springs.gentle) },
      ],
    },
  };
}
```

---

## Moti — Declarative Mount/Presence Animations

When you want Framer Motion-style declarative animations on native:

```typescript
import { MotiView, AnimatePresence } from 'moti';

function Toast({ visible, message }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: -20, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        >
          <Text>{message}</Text>
        </MotiView>
      )}
    </AnimatePresence>
  );
}
```

---

## Scroll-Linked Animations

```typescript
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

function ParallaxHeader({ headerHeight = 300 }: { headerHeight?: number }) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [-100, 0, headerHeight],
      [headerHeight + 100, headerHeight, headerHeight / 2],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, headerHeight * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [{
      scale: interpolate(
        scrollY.value,
        [-100, 0],
        [1.3, 1],
        Extrapolation.CLAMP
      ),
    }],
  }));

  return (
    <>
      <Animated.View style={[styles.header, headerStyle]}>
        <HeaderContent />
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View style={{ paddingTop: headerHeight }}>
          <Content />
        </View>
      </Animated.ScrollView>
    </>
  );
}
```

---

## Staggered Animations

Orchestrate multiple elements with calculated delays:

```typescript
function StaggeredList({ items }: { items: Item[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeIn.delay(index * 50)
            .springify()
            .damping(18)
            .stiffness(200)}
        >
          <Card item={item} />
        </Animated.View>
      ))}
    </View>
  );
}
```

---

## Performance Rules

1. **Always use `useAnimatedStyle`** — never pass shared values directly to `style`
2. **Keep worklets pure** — no async, no fetch, no console.log inside `'worklet'` functions
3. **Use `runOnJS` sparingly** — only for callbacks that must touch React state
4. **Prefer `withSpring` over `withTiming`** — springs feel more natural and handle interruption better
5. **Batch shared value updates** — update multiple values in a single worklet call
6. **Use `cancelAnimation`** before starting a new animation on the same value to prevent conflicts
7. **Never animate `width`/`height` directly** — use `transform: [{ scale }]` instead
8. **Set `scrollEventThrottle={16}`** on ScrollViews used with `useAnimatedScrollHandler`
9. **Max ~15 concurrent animated values** per screen — beyond this, profile on low-end Android
10. **Use `Extrapolation.CLAMP`** with `interpolate` to prevent values overshooting

### Worklet Thread Model

```
JS Thread          UI Thread (Worklets)         Native
─────────          ────────────────────         ──────
React render  ──▶  Shared Values update    ──▶  Native view props
Callbacks     ◀──  runOnJS()                    60fps rendering
State updates       Gesture callbacks            GPU compositing
                    Scroll handlers
                    Layout animations
```

**Rule:** Animation logic runs on the UI thread. React state lives on the JS thread. Bridge them with `runOnJS` (UI→JS) and shared values (JS→UI).

---

## Decision Matrix

| Scenario | Use |
|----------|-----|
| Button press/release feedback | `useSharedValue` + `withSpring(springs.snappy)` |
| Mount/unmount presence | `Moti` `AnimatePresence` or Reanimated `entering`/`exiting` |
| Gesture-driven (drag, pinch, swipe) | `Gesture Handler` + `useAnimatedStyle` |
| List item enter/exit/reorder | Reanimated `Layout` + `entering`/`exiting` |
| Scroll-linked parallax/fade | `useAnimatedScrollHandler` + `interpolate` |
| CSS-style keyframes | Reanimated 4 `CSSAnimationKeyframes` |
| Simple state-driven transitions | Reanimated 4 `CSSTransitionConfig` |
| Complex orchestrated sequences | Chain `withSequence`, `withDelay`, `withSpring` |
| Fine-grained reactive rendering | Legend State `$View`, `$Text` reactive components |
