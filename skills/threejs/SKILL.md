---
name: threejs
description: Three.js 3D graphics in Next.js 16 + React 19 — React Three Fiber (R3F) + Drei. Verified-working SSR-safe install pattern (dynamic + ssr:false + 'use client'), current versions (three 0.185, R3F 9.6, drei 10.7), and copy-pasteable scene/camera/loader/scroll examples.
version: 3.0.0
license: MIT
---

# Three.js for Next.js 16 (React 19)

The default and recommended 3D stack for the user's primary stack: **React Three Fiber (R3F) + Drei** running inside Next.js 16. R3F is Three.js rendered through React's reconciler — zero runtime overhead, every R3F primitive maps 1:1 to a `THREE.*` object.

## Version pairing (verified 2026-07-04 via `npm view`)

| Package | Version | Notes |
|---|---|---|
| `three` | `^0.185` | r185 series, latest stable |
| `@react-three/fiber` | `^9.6` | **v9 requires React 19** (Next 16 default). v8 was the React 18 line. |
| `@react-three/drei` | `^10.7` | 200+ helpers; `OrbitControls`, `Environment`, `useGLTF`, `Float`, `MeshTransmissionMaterial`, etc. |

> **R3F v10 is alpha-only** (WebGPU-first: `state.gl` → `state.renderer`, new scheduler, TSL built-ins; Drei 11 alpha alongside). Stay on the 9.6.x line for production until v10 ships stable.

Optional:
| `@react-three/postprocessing` | latest | EffectComposer / Bloom / DOF wrappers for R3F |
| `leva` | latest | Dev-only debug GUI for tweaking values without redeploys |

## Install (one command)

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## CRITICAL: Next.js 16 SSR pattern (THIS is what breaks if you forget it)

WebGL needs `window` / `document`. Next.js by default renders pages on the server, where neither exists. Two non-negotiable rules:

1. **The component that mounts `<Canvas>` must be a Client Component.** Add `'use client'` at the top.
2. **Import that component into your page via `next/dynamic` with `ssr: false`.** Otherwise Next still tries to render the tree on the server during streaming.

If you skip rule 2, you get `ReferenceError: window is not defined` (or `document is not defined`, or `WebGLRenderer not supported`) at build time. That's the "didn't actually work" trap.

### Minimal verified-working example

**`components/Scene.tsx`** — client-side R3F tree:

```tsx
'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function RotatingCube() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.3;
    ref.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 50 }}
      dpr={[1, 2]}                       // perf: cap DPR at 2
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <RotatingCube />
      <OrbitControls enableDamping />
      <Environment preset="city" />
    </Canvas>
  );
}
```

**`app/page.tsx`** — server page that loads it client-only:

```tsx
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <div className="h-screen grid place-items-center">Loading 3D…</div>,
});

export default function Page() {
  return (
    <main className="h-screen">
      <Scene />
    </main>
  );
}
```

This compiles cleanly on `next build`, runs in dev, and ships to Vercel without any extra config.

## `next.config.ts` — when you need `transpilePackages`

You normally do NOT need this. Add it ONLY if you import a Three.js ecosystem package that ships untranspiled ESM (rare in 2026):

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
};

export default nextConfig;
```

Symptom that tells you to add it: a build error like `SyntaxError: Unexpected token 'export'` originating from `node_modules/three/...` or a `three-*` addon.

## Loading GLTF / GLB models

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';
import { Suspense } from 'react';

function Model() {
  const { scene } = useGLTF('/models/scene.glb');
  return <primitive object={scene} />;
}

// drei preloads — fire as soon as the JS lands so the model is ready when the canvas mounts
useGLTF.preload('/models/scene.glb');

export default function ModelViewer() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.6}>
          <Model />
        </Stage>
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}
```

Place `.glb` files in `public/models/`. Use Draco-compressed glb when the asset is >5MB:

```bash
npx gltfjsx public/models/scene.glb --transform   # produces TypeScript component + Draco-compressed glb
```

## Scroll-driven scene (drei `ScrollControls`)

```tsx
'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, Float, Environment } from '@react-three/drei';
import { useRef } from 'react';
import type { Group } from 'three';

function ScrollScene() {
  const ref = useRef<Group>(null);
  const data = useScroll();

  useFrame(() => {
    if (!ref.current) return;
    // 0 → 1 across the scroll range
    ref.current.rotation.y = data.offset * Math.PI * 2;
  });

  return (
    <group ref={ref}>
      <Float floatIntensity={1.5} rotationIntensity={0.5}>
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="#7e5bef" metalness={0.5} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <Environment preset="studio" />
      <ScrollControls pages={3} damping={0.25}>
        <ScrollScene />
      </ScrollControls>
    </Canvas>
  );
}
```

## Performance defaults (always apply)

```tsx
<Canvas
  dpr={[1, 2]}              // cap pixel ratio at 2 — phones with DPR 3+ tank perf otherwise
  frameloop="demand"        // re-render only when state changes (huge win for static-ish scenes)
  shadows                   // enable only if you actually use shadows
  gl={{
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true,            // transparent canvas — set false if you have a solid bg
  }}
/>
```

For scenes that idle (e.g. only animate on hover): `frameloop="demand"` + `invalidate()` from `useThree()` to request a frame.

## Common bugs and their fixes

| Symptom | Cause | Fix |
|---|---|---|
| `ReferenceError: window is not defined` at build | Importing Scene directly into a Server Component | Use `dynamic(() => import('@/...'), { ssr: false })` |
| `Cannot read properties of undefined (reading 'ReactCurrentOwner')` | R3F v8 on React 19 (or v9 on React 18) | Bump to `@react-three/fiber@9` for React 19 |
| Black canvas on prod, fine in dev | `process.env.NODE_ENV` gating accidentally hides `<Canvas>` | Remove gating; R3F is dev/prod safe |
| Drei component import fails with "is not exported" | Old drei + new R3F mismatch | `npm install @react-three/drei@latest @react-three/fiber@latest` together |
| `useGLTF` SSR hydration mismatch | Used in a page that's not fully client-only | The whole subtree containing `<Canvas>` must be a Client Component + dynamic-imported |
| Massive bundle (>500KB just for Three) | Imported `* as THREE` everywhere | Tree-shake by importing only what you use; or use drei components instead of raw Three |

## Recipes worth knowing (drei superpowers)

| Need | Use |
|---|---|
| Photorealistic lighting in one line | `<Environment preset="city" \| "sunset" \| "studio" \| "warehouse" \| "park" ...>` |
| Centered, lit "showroom" for a model | `<Stage>` (auto-centers + lights + shadow plane) |
| Glass/refraction material | `<MeshTransmissionMaterial>` |
| Bouncy "I'm alive" idle motion | `<Float floatIntensity rotationIntensity>` |
| Camera that lerps between targets | `<CameraControls>` |
| Procedural sky | `<Sky>` / `<Stars>` / `<Sparkles>` |
| HTML overlay anchored to a 3D point | `<Html occlude transform position={[0,1,0]}>` |
| Performance HUD in dev | `<Perf>` from `r3f-perf` (separate npm install) |

## Tailwind v4.3 + Canvas

`<Canvas>` is a `<div>` containing a `<canvas>`. Style it with Tailwind classes like any element:

```tsx
<Canvas className="!absolute inset-0" />  // ! to defeat R3F's inline style
```

R3F's default style is `position: relative; width: 100%; height: 100%`. If the parent has no explicit height, the canvas collapses to 0 — set `h-screen` or a fixed height on the parent.

## Drop-in: animated gradient backdrop (shadergradient)

For an animated gradient hero that is R3F under the hood but needs zero scene-building, use `@shadergradient/react` (v2.4.20, MIT). It follows the SAME SSR rules as above — `'use client'` + `dynamic(() => import(...), { ssr: false })` — and pulls in `three` + `three-stdlib` + `camera-controls` alongside R3F. The full recipe, the lighter zero-dependency `@paper-design/shaders-react` (`MeshGradient`/`LiquidMetal`) alternative, and the decision-gate for *when* a gradient hero actually earns its place live in impeccable's [signature-effects reference](../impeccable/reference/signature-effects.md).

## When NOT to use Three.js/R3F

- Pure 2D vector / SVG — use CSS or framer-motion/motion
- A single hero shot with no interactivity — consider Spline export or a `<video>` loop
- Static product photography — use `next/image` (zero JS, perfect SEO)
- Performance budget is <100KB JS — Three core is ~600KB minified, R3F adds ~50KB. Reach for Lottie or CSS animations instead.

## Sources

- [React Three Fiber docs](https://r3f.docs.pmnd.rs/)
- [@react-three/drei docs](https://drei.docs.pmnd.rs/)
- [Three.js manual](https://threejs.org/manual/)
- [Three.js releases (r184 latest)](https://github.com/mrdoob/three.js/releases)
- [Next.js + R3F starter (`pmndrs/react-three-next`)](https://github.com/pmndrs/react-three-next)
