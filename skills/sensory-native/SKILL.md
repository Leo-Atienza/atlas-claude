<!--
id: SK-100
name: sensory-native
description: Native Sensory Design System — motion tokens, haptic palette, sound design, animation tier system (T0-T3), interaction recipes combining animation+haptics+sound. The Cinematic Web Engine equivalent for native apps. Orchestrates SK-097/098/099.
keywords: sensory, design-system, motion-tokens, haptics, sound, micro-interaction, animation-tier, accessibility, reduced-motion, spring-presets, interaction-recipe, premium, ux, feedback, tactile
version: 1.0.0
-->

# Native Sensory Design System

## When to Use This Skill

**Auto-activate when:** designing a cohesive motion/interaction system for a native app, defining motion tokens, adding haptic feedback patterns, integrating UI sounds, or building premium interaction recipes. SK-058 (Universal Conductor) routes here.

**This is the synthesis layer.** It orchestrates SK-097 (Motion), SK-098 (Visual), and SK-099 (Transition) into a unified sensory experience.

---

## The Sensory Stack

```
SK-100 (This)     — Design tokens, interaction recipes, orchestration
    ├── SK-097     — Animation execution (Reanimated, Gesture Handler, Moti)
    ├── SK-098     — Visual rendering (Skia, Rive, Lottie, R3F)
    └── SK-099     — Transitions & scroll (SharedElement, FlashList, Legend List)

Sensory Channels:
    Motion         — What the user sees moving
    Haptics        — What the user feels (vibration patterns)
    Sound          — What the user hears (UI audio cues)
```

---

## Motion Token System

Named presets shared across all animation libraries. Import once, use everywhere.

```typescript
// lib/motion-tokens.ts
import { WithSpringConfig } from 'react-native-reanimated';

// ── Spring Configs ──────────────────────────────────────
export const springs = {
  snappy:  { damping: 20, stiffness: 300, mass: 0.8 } satisfies WithSpringConfig,
  bouncy:  { damping: 12, stiffness: 200, mass: 0.8 } satisfies WithSpringConfig,
  gentle:  { damping: 20, stiffness: 120, mass: 1.0 } satisfies WithSpringConfig,
  stiff:   { damping: 28, stiffness: 350, mass: 1.2 } satisfies WithSpringConfig,
  slow:    { damping: 18, stiffness: 80,  mass: 1.5 } satisfies WithSpringConfig,
} as const;

// ── Duration Tokens ─────────────────────────────────────
export const durations = {
  instant:  100,  // opacity, color
  micro:    200,  // button press, toggle
  macro:    350,  // modal, sheet, card
  cinematic: 600, // onboarding, celebration
} as const;

// ── Easing Curves (for withTiming when springs don't fit) ──
export const easings = {
  enter:    { x1: 0.0, y1: 0.0, x2: 0.2, y2: 1.0 },  // decelerate in
  exit:     { x1: 0.4, y1: 0.0, x2: 1.0, y2: 1.0 },  // accelerate out
  standard: { x1: 0.4, y1: 0.0, x2: 0.2, y2: 1.0 },  // move
} as const;

export type SpringPreset = keyof typeof springs;
export type DurationToken = keyof typeof durations;
```

---

## Animation Tier System

Every animation falls into exactly one tier. Higher tiers = more budget, more channels.

| Tier | Name | Duration | Spring | Haptic | Sound | Example |
|------|------|----------|--------|--------|-------|---------|
| **T0** | Instant | 0-100ms | `snappy` | None | None | Opacity toggle, color change |
| **T1** | Micro | 100-200ms | `snappy` | Selection | Optional tap | Button press, checkbox, toggle |
| **T2** | Macro | 200-500ms | `gentle` | Impact (light) | Transition swoosh | Modal open, sheet slide, card expand |
| **T3** | Cinematic | 500-1000ms | `slow` | Notification (success) | Celebration chime | Onboarding, achievement, first-time reveal |

### Applying Tiers

```typescript
// Every animated component declares its tier
function AnimatedButton({ onPress, children }: AnimatedButtonProps) {
  // T1: Micro — snappy spring, selection haptic, no sound
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy); // T1 spring
    Haptics.selectionAsync();                        // T1 haptic
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

---

## Haptic Palette

Standardized haptic patterns mapped to interaction semantics.

```typescript
// lib/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptic = {
  // ── T1: Micro interactions ──
  tap:       () => Haptics.selectionAsync(),
  toggle:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // ── T2: Macro interactions ──
  snap:      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  sheetOpen: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  drop:      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // ── T3: Feedback signals ──
  success:   () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning:   () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error:     () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  // ── Gesture feedback ──
  scrub:     () => Haptics.selectionAsync(), // During scroll/drag
  threshold: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), // Crossing a boundary
} as const;
```

### Haptic Rules

1. **Match intensity to significance** — light for selections, heavy for destructive actions
2. **Never double-fire** — debounce haptics on rapid interactions (scroll, drag)
3. **Respect system settings** — haptics are automatically disabled when the user turns them off
4. **Test on real devices** — simulator haptics feel different from physical hardware
5. **Android variance** — Android haptic quality varies by device; test on mid-range hardware

---

## Sound Design

UI audio cues that complement motion and haptics.

```typescript
// lib/sounds.ts
import { Audio } from 'expo-av';

const soundCache = new Map<string, Audio.Sound>();

async function loadSound(name: string, asset: any): Promise<Audio.Sound> {
  const cached = soundCache.get(name);
  if (cached) return cached;

  const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: false });
  soundCache.set(name, sound);
  return sound;
}

export const sounds = {
  tap: () => playSound('tap', require('@/assets/sounds/tap.wav')),
  swoosh: () => playSound('swoosh', require('@/assets/sounds/swoosh.wav')),
  success: () => playSound('success', require('@/assets/sounds/success.wav')),
  error: () => playSound('error', require('@/assets/sounds/error.wav')),
  pop: () => playSound('pop', require('@/assets/sounds/pop.wav')),
};

async function playSound(name: string, asset: any) {
  const sound = await loadSound(name, asset);
  await sound.setPositionAsync(0);
  await sound.playAsync();
}

// Cleanup on app background
export function unloadSounds() {
  soundCache.forEach((sound) => sound.unloadAsync());
  soundCache.clear();
}
```

### Sound Rules

1. **Sounds are optional by default** — never require sound for functionality
2. **Keep sounds under 500ms** — UI sounds must be short, not musical
3. **Volume: subtle** — UI sounds should be 30-50% of media volume
4. **Respect silent mode** — use `Audio.setAudioModeAsync({ playsInSilentModeIOS: false })`
5. **Preload on app start** — never delay interaction for sound loading
6. **Max 3 concurrent** — too many overlapping sounds = noise

---

## Interaction Recipes

Pre-built patterns combining all three sensory channels. Copy-paste ready.

### Recipe: Button Press (T1)

```typescript
import { springs } from '@/lib/motion-tokens';
import { haptic } from '@/lib/haptics';

function PremiumButton({ label, onPress }: PremiumButtonProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, springs.snappy);
          bgOpacity.value = withSpring(0.08, springs.snappy);
          haptic.tap();
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.snappy);
          bgOpacity.value = withSpring(0, springs.snappy);
        }}
        onPress={onPress}
      >
        <Animated.View style={[styles.overlay, overlayStyle]} />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
```

### Recipe: Swipe to Delete (T2)

```typescript
import { haptic } from '@/lib/haptics';
import { springs, durations } from '@/lib/motion-tokens';

function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(80);
  const hasPassedThreshold = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX); // Left only

      // Haptic at threshold crossing
      if (Math.abs(e.translationX) > 120 && !hasPassedThreshold.value) {
        hasPassedThreshold.value = true;
        runOnJS(haptic.threshold)();
      } else if (Math.abs(e.translationX) < 120 && hasPassedThreshold.value) {
        hasPassedThreshold.value = false;
      }
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 120) {
        // Commit delete
        translateX.value = withTiming(-400, { duration: durations.micro });
        itemHeight.value = withTiming(0, { duration: durations.macro }, () => {
          runOnJS(onDelete)();
        });
        runOnJS(haptic.drop)();
      } else {
        // Snap back
        translateX.value = withSpring(0, springs.bouncy);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: itemHeight.value,
    overflow: 'hidden',
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

### Recipe: Success Celebration (T3)

```typescript
import LottieView from 'lottie-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { haptic } from '@/lib/haptics';
import { sounds } from '@/lib/sounds';

function SuccessCelebration({ visible, onDone }: CelebrationProps) {
  useEffect(() => {
    if (visible) {
      haptic.success();
      sounds.success();
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', ...springs.slow }}
          style={styles.celebrationOverlay}
        >
          <LottieView
            source={require('@/assets/animations/confetti.json')}
            autoPlay
            loop={false}
            onAnimationFinish={onDone}
            style={{ width: 300, height: 300 }}
          />
          <Text style={styles.celebrationText}>Payment Complete!</Text>
        </MotiView>
      )}
    </AnimatePresence>
  );
}
```

### Recipe: Bottom Sheet Open (T2)

```typescript
import { haptic } from '@/lib/haptics';
import { springs } from '@/lib/motion-tokens';

function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springs.gentle);
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
      haptic.sheetOpen();
    } else {
      translateY.value = withSpring(500, springs.stiff);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 500) {
        translateY.value = withSpring(500, springs.stiff);
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, springs.gentle);
        haptic.snap();
      }
    });

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
}
```

---

## Accessibility — Reduced Motion

Respect the user's system preference for reduced motion.

```typescript
// lib/accessibility.ts
import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}

// Conditional spring — use instant timing when reduced motion is on
export function useAccessibleSpring(preset: SpringPreset) {
  const reduced = useReducedMotion();
  return reduced ? { duration: 0 } : springs[preset];
}
```

### Applying Reduced Motion

```typescript
function AnimatedCard({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <Animated.View
      entering={
        reduced
          ? FadeIn.duration(0)        // Instant — no motion
          : FadeInDown.springify().damping(18).stiffness(200)
      }
    >
      {children}
    </Animated.View>
  );
}
```

---

## Performance Budget

| Constraint | Limit | Why |
|-----------|-------|-----|
| Concurrent animated values | 15 per screen | Beyond this, low-end Android drops frames |
| Concurrent Skia canvases | 2-3 per screen | GPU memory pressure |
| Concurrent Rive instances | 5-8 per screen | State machines are lightweight |
| Haptic calls per second | 3 max | More feels like vibration, not feedback |
| Sound overlap | 3 concurrent | Prevents audio mud |
| T3 animations | 1 at a time | Cinematic = full attention |
| Total animation budget | <16ms per frame | 60fps = 16.67ms per frame |

### The Performance Pyramid

```
          ┌─────────┐
          │   T3    │  ← 1 at a time, full-screen, all channels
         ┌┴─────────┴┐
         │    T2     │  ← 3-5 concurrent, modal/sheet scope
        ┌┴───────────┴┐
        │     T1      │  ← Many concurrent, micro scope
       ┌┴─────────────┴┐
       │      T0       │  ← Unlimited, instant, no budget impact
       └───────────────┘
```

---

## Quick Reference — What to Use When

| Building... | Load Skills | Key Libraries |
|------------|------------|---------------|
| Button feedback | SK-097 + SK-100 | Reanimated + expo-haptics |
| Gesture interaction | SK-097 + SK-100 | Gesture Handler + Reanimated + haptics |
| Custom graphics | SK-098 | Skia |
| Interactive icon | SK-098 | Rive |
| Screen transition | SK-099 | React Navigation + Reanimated |
| Infinite scroll list | SK-099 | FlashList v2 |
| Onboarding flow | SK-097 + SK-098 + SK-100 | Moti + Lottie + haptics + sound |
| Premium bottom sheet | SK-097 + SK-100 | Gesture Handler + Reanimated + haptics |
| Full sensory design system | SK-100 (this) | All motion tokens + haptic palette + sounds |
