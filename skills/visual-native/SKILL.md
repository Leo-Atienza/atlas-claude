<!--
id: SK-098
name: visual-native
description: Native Visual Canvas — React Native Skia (GPU 2D), @react-three/native (3D), Rive (interactive state machines), Lottie (playback). Decision matrix, performance budgets, shader patterns. The Three.js equivalent for native apps.
keywords: skia, react-native-skia, three-fiber, r3f, rive, lottie, 2d, 3d, gpu, shader, canvas, rendering, path, gradient, blur, animation, state-machine, visual, graphics
version: 1.0.0
-->

# Native Visual Canvas

## When to Use This Skill

**Auto-activate when:** building custom 2D graphics, 3D scenes, interactive vector animations, or motion graphics in React Native/Expo. SK-058 (Universal Conductor) routes here.

**Not for:** Standard UI animations (use SK-097 Native Motion Engine), screen transitions (use SK-099), or haptics/sound design (use SK-100).

---

## Decision Matrix — Which Visual Engine?

| Need | Use | Why |
|------|-----|-----|
| Custom 2D shapes, gradients, blur effects | **React Native Skia** | GPU-accelerated, pixel-level control, custom shaders |
| Interactive icons, toggles, loaders | **Rive** | State machines, data binding, tiny file size, 60fps |
| Simple playback animations (splash, confetti) | **Lottie** | After Effects pipeline, huge asset library |
| 3D scenes, models, product viewers | **@react-three/native** | Declarative R3F API, Three.js ecosystem |
| Charts, graphs, data visualization | **React Native Skia** | Path drawing, smooth interpolation |
| Morphing shapes, liquid effects | **React Native Skia** | Path interpolation, shader language |
| Animated illustrations with logic | **Rive** | State machine handles branching |
| One-shot celebration effects | **Lottie** | Easy asset drop-in, no code needed |

**Combining engines:** Use Skia for backgrounds/effects + Rive for interactive elements + Reanimated (SK-097) for coordination. Never put two GPU-heavy engines in the same view hierarchy without profiling.

---

## React Native Skia

GPU-accelerated 2D rendering by Shopify. Runs on the Skia graphics engine (same as Chrome, Flutter, Android).

### Setup

```bash
npx expo install @shopify/react-native-skia
```

### Core Concepts

```typescript
import {
  Canvas,
  Circle,
  LinearGradient,
  BlurMask,
  Path,
  Skia,
  useValue,
  useComputedValue,
  vec,
} from '@shopify/react-native-skia';

function GlowOrb({ size = 200 }: { size?: number }) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size * 0.35}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(size, size)}
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
        />
        <BlurMask blur={20} style="normal" />
      </Circle>
    </Canvas>
  );
}
```

### Animated Paths — Morphing Shapes

```typescript
import {
  Canvas,
  Path,
  Skia,
  usePathInterpolation,
} from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const circlePath = Skia.Path.Make();
circlePath.addCircle(100, 100, 60);

const squarePath = Skia.Path.Make();
squarePath.addRRect(Skia.RRRect.MakeXYWH(40, 40, 120, 120, 12, 12));

function MorphShape() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const morphedPath = usePathInterpolation(progress, [0, 1], [circlePath, squarePath]);

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      <Path path={morphedPath} color="#6366f1" style="fill" />
    </Canvas>
  );
}
```

### Custom Shaders (GLSL via Skia Shader Language)

```typescript
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming } from 'react-native-reanimated';

const source = Skia.RuntimeEffect.Make(`
  uniform float time;
  uniform float2 resolution;

  half4 main(float2 pos) {
    float2 uv = pos / resolution;
    float d = length(uv - 0.5);
    float wave = sin(d * 20.0 - time * 3.0) * 0.5 + 0.5;
    return half4(wave * 0.4, wave * 0.3, wave * 0.9, 1.0);
  }
`)!;

function WaveShader({ width, height }: { width: number; height: number }) {
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(withTiming(10, { duration: 10000 }), -1, false);
  }, []);

  const uniforms = useDerivedValue(() => ({
    time: time.value,
    resolution: [width, height],
  }));

  return (
    <Canvas style={{ width, height }}>
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
```

### Blur & Glassmorphism

```typescript
import { Canvas, RoundedRect, BackdropBlur, Fill } from '@shopify/react-native-skia';

function GlassCard({ width, height }: { width: number; height: number }) {
  return (
    <Canvas style={{ width, height }}>
      <BackdropBlur blur={12} clip={{ x: 16, y: 16, width: width - 32, height: height - 32 }}>
        <RoundedRect
          x={16} y={16}
          width={width - 32} height={height - 32}
          r={16}
          color="rgba(255, 255, 255, 0.15)"
        />
      </BackdropBlur>
    </Canvas>
  );
}
```

---

## Rive — Interactive State Machine Animations

Designer-built animations with runtime interactivity. 60fps vs Lottie's ~17fps on React Native.

### Setup

```bash
npx expo install rive-react-native
# Or for v2 (Nitro): npx expo install @rive-app/react-native
```

### Basic Playback

```typescript
import Rive from 'rive-react-native';

function AnimatedIcon() {
  return (
    <Rive
      resourceName="icon_toggle"
      artboardName="Toggle"
      stateMachineName="State Machine 1"
      style={{ width: 48, height: 48 }}
      autoplay
    />
  );
}
```

### State Machine Control

```typescript
import Rive, { RiveRef } from 'rive-react-native';
import { useRef } from 'react';

function InteractiveHeart({ liked, onToggle }: { liked: boolean; onToggle: () => void }) {
  const riveRef = useRef<RiveRef>(null);

  useEffect(() => {
    riveRef.current?.setInputState('State Machine 1', 'isLiked', liked);
  }, [liked]);

  return (
    <Pressable onPress={onToggle}>
      <Rive
        ref={riveRef}
        resourceName="heart_animation"
        stateMachineName="State Machine 1"
        style={{ width: 32, height: 32 }}
        autoplay
      />
    </Pressable>
  );
}
```

### When to Use Rive vs Lottie

| Factor | Rive | Lottie |
|--------|------|--------|
| Performance (RN) | 60fps | ~17fps |
| File size | 50-80% smaller (.riv) | Larger (.json), dotLottie helps |
| Interactivity | State machines, data binding | Playback only (play/pause/seek) |
| Design tool | Rive Editor | After Effects + Bodymovin |
| Asset ecosystem | Growing | Massive (LottieFiles) |
| Best for | Interactive UI, icons, toggles | One-shot animations, splashes |

---

## Lottie — After Effects Playback

### Setup

```bash
npx expo install lottie-react-native
```

### Usage

```typescript
import LottieView from 'lottie-react-native';
import { useRef } from 'react';

function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  const animationRef = useRef<LottieView>(null);

  return (
    <LottieView
      ref={animationRef}
      source={require('@/assets/animations/success.json')}
      autoPlay
      loop={false}
      speed={1.2}
      onAnimationFinish={onComplete}
      style={{ width: 120, height: 120 }}
    />
  );
}
```

**Performance tip:** Keep Lottie for non-interactive, one-shot animations. For anything requiring state or interaction, use Rive instead.

---

## @react-three/native — 3D on Mobile

Declarative 3D via React Three Fiber for React Native.

### Setup

```bash
npx expo install three @react-three/fiber expo-gl expo-three
npm install @react-three/native @react-three/drei
```

### Basic 3D Scene

```typescript
import { Canvas } from '@react-three/fiber/native';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';

function RotatingBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

function ProductViewer() {
  return (
    <Canvas style={{ flex: 1 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <RotatingBox />
    </Canvas>
  );
}
```

### Loading 3D Models

```typescript
import { Canvas } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import { Suspense } from 'react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={0.5} />;
}

function ModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas style={{ flex: 1 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} />
      <Suspense fallback={null}>
        <Model url={modelUrl} />
      </Suspense>
    </Canvas>
  );
}
```

**Status note:** @react-three/native is maturing and moving toward WebGPU. For production 3D on mobile, keep scenes simple (low poly count, baked lighting) and test on low-end Android devices.

---

## Performance Budgets

| Engine | Max per screen | Memory target | Notes |
|--------|---------------|---------------|-------|
| Skia Canvas | 2-3 canvases | <50MB GPU | Merge nearby canvases when possible |
| Rive | 5-8 instances | <20MB | State machines are lightweight |
| Lottie | 3-4 instances | <30MB | Complex AE comps use more memory |
| R3F | 1 canvas | <80MB GPU | Low poly, baked textures, max 50k triangles |

### Profiling Checklist

1. **Android first** — always profile on a mid-range Android device (Pixel 6a or equivalent)
2. **Monitor GPU memory** — use `adb shell dumpsys gfxinfo <package>`
3. **Check frame drops** — Reanimated's `FrameCallbackRegistryUI` in Flipper
4. **Texture sizes** — max 2048x2048 for mobile, prefer compressed formats (ASTC, ETC2)
5. **Offscreen rendering** — avoid Skia canvases that are clipped/hidden but still rendering
