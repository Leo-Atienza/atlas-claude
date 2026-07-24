---
name: threejs-imperative
description: >-
  Raw / imperative Three.js reference (vanilla `import * as THREE`, no React) —
  scene/camera/renderer setup, geometries, materials, lighting, textures, the
  animation loop, GLTF/loaders, custom GLSL shaders (ShaderMaterial),
  EffectComposer post-processing, and raycasting/interaction. Use for
  hand-written WebGL / GLSL work OUTSIDE React Three Fiber. For declarative
  React 3D in Next.js, use `threejs` (SK-007, R3F + Drei) instead.
license: UNCONFIRMED
metadata:
  vendored_from: "github:cloudai-x/threejs-skills@b1c6230"
  license_status: "NO LICENSE FILE upstream (README-only MIT claim; original upstream pinkforest/threejs-playground is 404). Retained for LOCAL PERSONAL REFERENCE ONLY — do NOT redistribute or publish. See NOTICE.md."
---

> **In the ATLAS web-dev system:** the *raw-WebGL* lane. **SK-007 `threejs`** (R3F + Drei, SSR-safe Next 16) is the DEFAULT for React 3D and owns the ship path; reach for THIS skill only to hand-write imperative Three.js / GLSL that R3F doesn't wrap (custom render loops, bespoke `ShaderMaterial` GLSL, `EffectComposer` passes, low-level raycasting) or to study the underlying API Drei abstracts. Depth must carry meaning — one 3D moment per page ([[principles]] signature-effect gate + reduced-motion fallback still apply).
>
> ⚠ **License UNCONFIRMED** — vendored with no upstream LICENSE file, for the user's local reference only; **not for redistribution or shipping**. Content is generic Three.js API usage, largely re-derivable from the official docs — prefer Context7 `three` docs when authority matters. See NOTICE.md.

# Three.js (imperative) — reference index

Vendored topic references (raw/vanilla Three.js, r160+ API, `three/addons/` import paths):

| Topic | File | Covers |
|---|---|---|
| Fundamentals | [reference/threejs-fundamentals.md](reference/threejs-fundamentals.md) | Scene / camera / renderer, Object3D hierarchy, coordinate systems, the `animate()` loop, resize |
| Geometry | [reference/threejs-geometry.md](reference/threejs-geometry.md) | BufferGeometry, primitives, custom attributes, instancing |
| Materials | [reference/threejs-materials.md](reference/threejs-materials.md) | Standard/Physical/Basic materials, transparency, PBR |
| Lighting | [reference/threejs-lighting.md](reference/threejs-lighting.md) | Ambient/directional/point/spot, shadows, environment |
| Textures | [reference/threejs-textures.md](reference/threejs-textures.md) | Loading, wrapping, UVs, mipmaps, color space |
| Animation | [reference/threejs-animation.md](reference/threejs-animation.md) | AnimationMixer, clips, clock-driven motion |
| Loaders | [reference/threejs-loaders.md](reference/threejs-loaders.md) | GLTFLoader, DRACO, environment/HDR loaders |
| Shaders | [reference/threejs-shaders.md](reference/threejs-shaders.md) | ShaderMaterial, GLSL uniforms/varyings, raw shaders |
| Post-processing | [reference/threejs-postprocessing.md](reference/threejs-postprocessing.md) | EffectComposer, render passes (bloom, FXAA, custom) |
| Interaction | [reference/threejs-interaction.md](reference/threejs-interaction.md) | Raycasting, pointer picking, controls |

_(Upstream README preserved as `reference/_upstream-README.md`.)_

## When to use this vs SK-007 `threejs` (R3F)

- **Default → SK-007 `threejs`** — declarative React Three Fiber + Drei, SSR-safe in Next 16. Drei already wraps most of the above (`useGLTF`, `OrbitControls`, `shaderMaterial`, `@react-three/postprocessing`).
- **This skill** → only imperative/vanilla Three.js or GLSL outside R3F, or to understand the primitives Drei abstracts. Don't hand-roll a render loop in a Next.js app when R3F will do it.

## Reduced motion & performance
Gate autoplaying 3D with `prefers-reduced-motion`; cap `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; dispose geometries/materials/textures on teardown; one meaningful 3D moment per page (signature-effect restraint, [[principles]]).
