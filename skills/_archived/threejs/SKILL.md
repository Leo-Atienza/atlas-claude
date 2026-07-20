<!--
id: SK-007
name: threejs
description: Three.js 3D graphics — scene, geometry, materials, shaders, animation, React Three Fiber (R3F), Drei helpers, WebGPU renderer, performance patterns
keywords: threejs, three, 3d, webgl, webgpu, r3f, react-three-fiber, drei, shader, glb, gltf, 3d-animation, scene, canvas
version: 2.0.0
-->

# Three.js Complete Guide

## When to Use This Skill

Apply when building 3D web experiences with Three.js, React Three Fiber (R3F), or WebGPU. For **design-driven 3D** (hero scenes from a visual tool), see **spline-3d** (SK-095). For orchestrating 3D with scroll animations and page transitions, see **cinematic-web-engine** (SK-096).

**Choose your path:**
- **React/Next.js project** → Use React Three Fiber (R3F) + Drei (see R3F section below)
- **Vanilla JS / non-React** → Use Three.js directly (this guide's core sections)
- **Both** → R3F IS Three.js — all vanilla Three.js knowledge applies inside R3F

## Table of Contents

1. [Fundamentals](#fundamentals) — Scene, Camera, Renderer, Object3D, Math
2. [Geometry](#geometry) — Built-in shapes, BufferGeometry, Instancing
3. [Materials](#materials) — PBR, Phong, Shader, material properties
4. [Lighting](#lighting) — Light types, shadows, IBL, environment
5. [Textures](#textures) — Loading, UV mapping, HDR, render targets
6. [Loaders](#loaders) — GLTF, Draco, async patterns, caching
7. [Animation](#animation) — Keyframes, skeletal, morph targets, procedural
8. [Shaders](#shaders) — GLSL, ShaderMaterial, custom effects
9. [Post-Processing](#post-processing) — EffectComposer, bloom, DOF, custom passes
10. [Interaction](#interaction) — Raycasting, controls, input, selection
11. [React Three Fiber (R3F)](#react-three-fiber) — Declarative 3D in React
12. [Drei Helpers](#drei-helpers) — 200+ ready-made R3F components
13. [WebGPU Renderer](#webgpu-renderer) — Next-gen rendering (production-ready since r171)
14. [Performance Patterns](#performance-patterns) — DPR cap, frameloop, lazy loading, monitoring

---

## Fundamentals

### Quick Start

```javascript
import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

camera.position.z = 5;

const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  cube.rotation.x += delta;
  cube.rotation.y += delta;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
```

### Scene

```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);    // Solid color
scene.background = cubeTexture;                   // Cubemap skybox
scene.environment = envMap;                       // PBR environment
scene.fog = new THREE.Fog(0xffffff, 1, 100);     // Linear fog
scene.fog = new THREE.FogExp2(0xffffff, 0.02);   // Exponential fog
```

### Cameras

```javascript
// PerspectiveCamera(fov, aspect, near, far)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// OrthographicCamera(left, right, top, bottom, near, far)
const aspect = window.innerWidth / window.innerHeight;
const d = 10;
const ortho = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);

// CubeCamera — for dynamic reflections
const cubeRT = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRT);
scene.add(cubeCamera);
material.envMap = cubeRT.texture;
```

### WebGLRenderer

```javascript
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,      // For screenshots
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

### Object3D Hierarchy

```javascript
const obj = new THREE.Object3D();

// Transform
obj.position.set(x, y, z);
obj.rotation.set(x, y, z);       // Euler (radians)
obj.quaternion.set(x, y, z, w);  // Quaternion
obj.scale.set(x, y, z);

// World transforms
obj.getWorldPosition(targetVector);
obj.getWorldQuaternion(targetQuaternion);

// Hierarchy
obj.add(child);
obj.remove(child);
obj.traverse((child) => { if (child.isMesh) /* ... */ });

// Layers (selective rendering/raycasting)
obj.layers.set(1);
obj.layers.enable(2);

// Groups
const group = new THREE.Group();
group.add(mesh1, mesh2);
scene.add(group);
```

### Coordinate System

Right-handed: **+X** right, **+Y** up, **+Z** toward viewer.

```javascript
scene.add(new THREE.AxesHelper(5)); // Red=X, Green=Y, Blue=Z
```

### Math Utilities

```javascript
// Vector3
const v = new THREE.Vector3(x, y, z);
v.add(v2); v.sub(v2); v.multiplyScalar(2); v.normalize();
v.length(); v.distanceTo(v2); v.dot(v2); v.cross(v2);
v.lerp(target, alpha);
v.project(camera);     // World → NDC
v.unproject(camera);   // NDC → world
v.applyMatrix4(matrix); v.applyQuaternion(q);

// Quaternion
const q = new THREE.Quaternion();
q.setFromEuler(euler); q.setFromAxisAngle(axis, angle);
q.slerp(target, t);   // Spherical interpolation

// Euler — rotation order matters
const euler = new THREE.Euler(x, y, z, "XYZ");

// Color
const color = new THREE.Color(0xff0000);
color.setHSL(h, s, l); color.lerp(other, alpha);

// MathUtils
THREE.MathUtils.clamp(value, min, max);
THREE.MathUtils.lerp(start, end, alpha);
THREE.MathUtils.degToRad(degrees);
THREE.MathUtils.smoothstep(x, min, max);
THREE.MathUtils.mapLinear(value, inMin, inMax, outMin, outMax);
```

### Cleanup

```javascript
function dispose() {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
  else mesh.material.dispose();
  texture.dispose();
  scene.remove(mesh);
  renderer.dispose();
}
```

---

## Geometry

### Built-in Shapes

```javascript
new THREE.BoxGeometry(1, 1, 1);
new THREE.SphereGeometry(1, 32, 32);
new THREE.PlaneGeometry(10, 10);
new THREE.CircleGeometry(1, 32);
new THREE.CylinderGeometry(1, 1, 2, 32);
new THREE.ConeGeometry(1, 2, 32);
new THREE.TorusGeometry(1, 0.4, 16, 100);
new THREE.TorusKnotGeometry(1, 0.4, 100, 16);
new THREE.CapsuleGeometry(0.5, 1, 4, 8);
new THREE.RingGeometry(0.5, 1, 32);
new THREE.IcosahedronGeometry(1, 0);   // Also Dodecahedron, Octahedron, Tetrahedron
```

### Path-Based Shapes

```javascript
// Extrude
const shape = new THREE.Shape();
shape.moveTo(0, 0); shape.lineTo(1, 0); shape.lineTo(1, 1); shape.lineTo(0, 0);
new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: true, bevelThickness: 0.1 });

// Lathe (rotational)
const points = [new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.5, 1)];
new THREE.LatheGeometry(points, 32);

// Tube along curve
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0),
]);
new THREE.TubeGeometry(curve, 64, 0.2, 8, false);

// Text
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
loader.load("font.json", (font) => {
  const geo = new TextGeometry("Hello", { font, size: 1, depth: 0.2, bevelEnabled: true });
  geo.center();
});
```

### Custom BufferGeometry

```javascript
const geometry = new THREE.BufferGeometry();

const vertices = new Float32Array([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0]);
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

const indices = new Uint16Array([0,1,2, 0,2,3]);
geometry.setIndex(new THREE.BufferAttribute(indices, 1));

const normals = new Float32Array([0,0,1, 0,0,1, 0,0,1, 0,0,1]);
geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

const uvs = new Float32Array([0,0, 1,0, 1,1, 0,1]);
geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

// Modify at runtime
const positions = geometry.attributes.position;
positions.setXYZ(index, x, y, z);
positions.needsUpdate = true;
geometry.computeVertexNormals();
```

### InstancedMesh

```javascript
const count = 1000;
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;

// Per-instance colors
for (let i = 0; i < count; i++) {
  instancedMesh.setColorAt(i, new THREE.Color(Math.random(), Math.random(), Math.random()));
}
instancedMesh.instanceColor.needsUpdate = true;

// Raycast → intersects[0].instanceId
```

### Points & Lines

```javascript
// Point cloud
const pointsGeo = new THREE.BufferGeometry();
pointsGeo.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ size: 0.1, sizeAttenuation: true }));

// Lines
const lineGeo = new THREE.BufferGeometry().setFromPoints([...vectors]);
const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff0000 }));

// Edges & Wireframe
const edges = new THREE.EdgesGeometry(boxGeo, 15);
const edgeMesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
```

### Geometry Utilities

```javascript
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
const merged = BufferGeometryUtils.mergeGeometries([geo1, geo2, geo3]);
geometry.center();
geometry.computeBoundingBox();
geometry.dispose();
```

---

## Materials

### Overview

| Material | Use Case | Lighting |
|----------|----------|----------|
| MeshBasicMaterial | Unlit, flat colors | No |
| MeshLambertMaterial | Matte surfaces, performance | Diffuse only |
| MeshPhongMaterial | Shiny surfaces, specular | Yes |
| MeshStandardMaterial | PBR, realistic | Yes (PBR) |
| MeshPhysicalMaterial | Advanced PBR, glass, fabric | Yes (PBR+) |
| MeshToonMaterial | Cel-shaded, cartoon | Yes (toon) |
| ShaderMaterial | Custom GLSL | Custom |

### MeshStandardMaterial (PBR — recommended)

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,      // 0 = mirror, 1 = diffuse
  metalness: 0.0,      // 0 = dielectric, 1 = metal
  map: colorTexture,
  roughnessMap: roughTexture,
  metalnessMap: metalTexture,
  normalMap: normalTexture,
  normalScale: new THREE.Vector2(1, 1),
  aoMap: aoTexture,     // Requires uv2
  aoMapIntensity: 1,
  displacementMap: dispTexture,
  displacementScale: 0.1,
  emissive: 0x000000,
  emissiveIntensity: 1,
  emissiveMap: emissiveTexture,
  envMap: envTexture,
  envMapIntensity: 1,
});
geometry.setAttribute("uv2", geometry.attributes.uv); // For aoMap
```

### MeshPhysicalMaterial (Advanced PBR)

```javascript
const material = new THREE.MeshPhysicalMaterial({
  // All Standard properties plus:
  clearcoat: 1.0, clearcoatRoughness: 0.1,         // Car paint, lacquer
  transmission: 1.0, thickness: 0.5, ior: 1.5,      // Glass, water
  sheen: 1.0, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff),  // Fabric
  iridescence: 1.0, iridescenceIOR: 1.3,            // Soap bubbles
  anisotropy: 1.0, anisotropyRotation: 0,            // Brushed metal
});

// Glass
const glass = new THREE.MeshPhysicalMaterial({ transmission: 1, thickness: 0.5, ior: 1.5, roughness: 0 });

// Car paint
const carPaint = new THREE.MeshPhysicalMaterial({ color: 0xff0000, metalness: 0.9, roughness: 0.5, clearcoat: 1 });
```

### Other Materials

```javascript
// Basic (unlit)
new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false, transparent: true, opacity: 0.5 });

// Phong (specular)
new THREE.MeshPhongMaterial({ color: 0x0000ff, specular: 0xffffff, shininess: 100 });

// Toon
const toonMat = new THREE.MeshToonMaterial({ color: 0x00ff00, gradientMap: gradientTexture });

// Points
new THREE.PointsMaterial({ size: 0.1, sizeAttenuation: true, map: pointTexture, transparent: true });

// Lines
new THREE.LineBasicMaterial({ color: 0xffffff });
new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.5, gapSize: 0.25 });
```

### Common Properties

```javascript
material.side = THREE.DoubleSide;   // FrontSide, BackSide, DoubleSide
material.transparent = true;
material.opacity = 0.5;
material.alphaTest = 0.5;           // Discard below threshold
material.depthTest = true;
material.depthWrite = true;
material.blending = THREE.NormalBlending; // Additive, Subtractive, Multiply

// Multiple materials per mesh
const mesh = new THREE.Mesh(boxGeo, [mat0, mat1, mat2, mat3, mat4, mat5]);
```

### Performance

1. Reuse materials (same material = batched draw calls)
2. Prefer alphaTest over transparency
3. Simpler is faster: Basic > Lambert > Phong > Standard > Physical
4. `material.dispose()` when done

---

## Lighting

### Light Types

| Light | Description | Shadows | Cost |
|-------|-------------|---------|------|
| AmbientLight | Uniform everywhere | No | Very Low |
| HemisphereLight | Sky/ground gradient | No | Very Low |
| DirectionalLight | Parallel rays (sun) | Yes | Low |
| PointLight | Omnidirectional (bulb) | Yes | Medium |
| SpotLight | Cone-shaped | Yes | Medium |
| RectAreaLight | Area light (window) | No | High |

```javascript
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.6);
scene.add(hemi);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100, 2);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 6, 0.5, 2);
spotLight.position.set(0, 10, 0);
scene.add(spotLight);

// RectAreaLight (only MeshStandard/Physical)
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
const rectLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
rectLight.position.set(0, 5, 0);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);
```

### Shadows

```javascript
// 1. Enable on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 2. Enable on light
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.bias = -0.0001;
dirLight.shadow.normalBias = 0.02;

// 3. Enable on objects
mesh.castShadow = true;
mesh.receiveShadow = true;
floor.receiveShadow = true;

// Debug helper
scene.add(new THREE.CameraHelper(dirLight.shadow.camera));
```

### Environment Lighting (IBL)

```javascript
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader().load("environment.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  scene.background = envMap;
  scene.backgroundBlurriness = 0;
  texture.dispose();
  pmremGenerator.dispose();
});
```

### Common Setups

```javascript
// Three-point lighting
const key = new THREE.DirectionalLight(0xffffff, 1);     key.position.set(5, 5, 5);
const fill = new THREE.DirectionalLight(0xffffff, 0.5);  fill.position.set(-5, 3, 5);
const back = new THREE.DirectionalLight(0xffffff, 0.3);  back.position.set(0, 5, -5);
scene.add(key, fill, back, new THREE.AmbientLight(0x404040, 0.3));
```

---

## Textures

### Loading & Configuration

```javascript
const loader = new THREE.TextureLoader();
const texture = loader.load("texture.jpg");

// Color space — critical for accuracy
colorTexture.colorSpace = THREE.SRGBColorSpace;      // For color/albedo maps
// Data textures (normal, roughness, metalness) — leave default (NoColorSpace)

// Wrapping
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(4, 4);
texture.offset.set(0.5, 0.5);
texture.rotation = Math.PI / 4;
texture.center.set(0.5, 0.5);

// Filtering
texture.minFilter = THREE.LinearMipmapLinearFilter; // Default, smooth
texture.magFilter = THREE.NearestFilter;            // Pixelated (retro)
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
```

### Special Texture Types

```javascript
// Data texture
const data = new Uint8Array(256 * 256 * 4);
// Fill data...
const dataTex = new THREE.DataTexture(data, 256, 256);
dataTex.needsUpdate = true;

// Canvas texture
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
// Draw on canvas...
const canvasTex = new THREE.CanvasTexture(canvas);

// Video texture
const video = document.createElement("video");
video.src = "video.mp4"; video.loop = true; video.muted = true; video.play();
const videoTex = new THREE.VideoTexture(video);
videoTex.colorSpace = THREE.SRGBColorSpace;

// Compressed (KTX2)
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath("path/to/basis/");
ktx2.detectSupport(renderer);
```

### Cube Textures & HDR

```javascript
// Cube texture (6 faces)
const cubeTexture = new THREE.CubeTextureLoader().load(["px.jpg","nx.jpg","py.jpg","ny.jpg","pz.jpg","nz.jpg"]);
scene.background = cubeTexture;
scene.environment = cubeTexture;

// HDR (equirectangular) — see Environment Lighting section above
```

### Render Targets

```javascript
const renderTarget = new THREE.WebGLRenderTarget(512, 512, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  samples: 4,  // MSAA
});
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null);
material.map = renderTarget.texture;
```

### Texture Atlas

```javascript
const atlas = loader.load("atlas.png");
atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping;
function selectSprite(row, col, gridSize = 2) {
  atlas.offset.set(col / gridSize, 1 - (row + 1) / gridSize);
  atlas.repeat.set(1 / gridSize, 1 / gridSize);
}
```

### Memory Management

```javascript
texture.dispose();
// Dispose all material textures
["map","normalMap","roughnessMap","metalnessMap","aoMap","emissiveMap","displacementMap","alphaMap","envMap"]
  .forEach(key => { if (material[key]) material[key].dispose(); });
material.dispose();
```

---

## Loaders

### Loading Manager

```javascript
const manager = new THREE.LoadingManager();
manager.onStart = (url, loaded, total) => console.log("Started");
manager.onLoad = () => console.log("All loaded");
manager.onProgress = (url, loaded, total) => console.log(`${(loaded/total*100).toFixed(1)}%`);
manager.onError = (url) => console.error(`Error: ${url}`);

const textureLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
```

### GLTF/GLB (primary 3D format)

```javascript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("model.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // Enable shadows
  model.traverse((child) => {
    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
  });

  // Animations
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
  }

  // Center and normalize
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  model.scale.setScalar(1 / maxDim);
});
```

### Draco Compression

```javascript
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
gltfLoader.setDRACOLoader(dracoLoader);
```

### KTX2 Textures in GLTF

```javascript
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
const ktx2 = new KTX2Loader();
ktx2.setTranscoderPath("path/to/basis/");
ktx2.detectSupport(renderer);
gltfLoader.setKTX2Loader(ktx2);
```

### Other Formats

```javascript
// OBJ + MTL
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

// FBX
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

// STL / PLY
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
```

### Async Loading Patterns

```javascript
function loadModel(url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, resolve, undefined, reject);
  });
}

const [model, envTex, colorTex] = await Promise.all([
  loadModel("model.glb"),
  loadRGBE("env.hdr"),
  loadTexture("color.jpg"),
]);

// Caching
THREE.Cache.enabled = true;
```

---

## Animation

### Animation System

Three components: **AnimationClip** (data), **AnimationMixer** (player), **AnimationAction** (controller).

```javascript
// Play GLTF animations
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(gltf.animations[0]);
action.play();

// In animation loop
mixer.update(clock.getDelta());
```

### Keyframe Tracks

```javascript
const times = [0, 1, 2];
const values = [0, 1, 0];
new THREE.NumberKeyframeTrack(".position[y]", times, values);
new THREE.VectorKeyframeTrack(".position", times, [0,0,0, 1,2,0, 0,0,0]);
new THREE.QuaternionKeyframeTrack(".quaternion", [0, 1], [...q1, ...q2]);
new THREE.ColorKeyframeTrack(".material.color", times, [1,0,0, 0,1,0, 0,0,1]);

const clip = new THREE.AnimationClip("bounce", 2, [track]);

// Interpolation
track.setInterpolation(THREE.InterpolateSmooth); // Linear (default), Smooth, Discrete
```

### AnimationAction Controls

```javascript
const action = mixer.clipAction(clip);
action.play(); action.stop(); action.reset();

action.timeScale = 1;       // Speed (negative = reverse)
action.weight = 1;           // Blend weight (0-1)
action.loop = THREE.LoopRepeat;     // LoopOnce, LoopPingPong
action.clampWhenFinished = true;    // Hold last frame

// Fade / Crossfade
action.fadeIn(0.5).play();
action1.crossFadeTo(action2, 0.5, true);

// Additive blending
THREE.AnimationUtils.makeClipAdditive(clip);
action.blendMode = THREE.AdditiveAnimationBlendMode;
```

### Animation Blending

```javascript
const idleAction = mixer.clipAction(idleClip);
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);

[idleAction, walkAction, runAction].forEach(a => a.play());

function updateAnimations(speed) {
  if (speed < 0.1) {
    idleAction.setEffectiveWeight(1); walkAction.setEffectiveWeight(0); runAction.setEffectiveWeight(0);
  } else if (speed < 5) {
    const t = speed / 5;
    idleAction.setEffectiveWeight(1 - t); walkAction.setEffectiveWeight(t); runAction.setEffectiveWeight(0);
  } else {
    const t = Math.min((speed - 5) / 5, 1);
    idleAction.setEffectiveWeight(0); walkAction.setEffectiveWeight(1 - t); runAction.setEffectiveWeight(t);
  }
}
```

### Skeletal Animation

```javascript
const skinnedMesh = model.getObjectByProperty("type", "SkinnedMesh");
const skeleton = skinnedMesh.skeleton;

const headBone = skeleton.bones.find(b => b.name === "Head");
headBone.rotation.y = Math.sin(time) * 0.3;

// Attach to bone
const weapon = new THREE.Mesh(weaponGeo, weaponMat);
handBone.add(weapon);

// Debug
scene.add(new THREE.SkeletonHelper(model));
```

### Morph Targets

```javascript
mesh.morphTargetInfluences[0] = 0.5;
const idx = mesh.morphTargetDictionary["smile"];
mesh.morphTargetInfluences[idx] = 1;

// Animate via keyframes
new THREE.NumberKeyframeTrack(".morphTargetInfluences[smile]", [0, 0.5, 1], [0, 1, 0]);
```

### Procedural Animation

```javascript
// Spring physics
class Spring {
  constructor(stiffness = 100, damping = 10) {
    this.stiffness = stiffness; this.damping = damping;
    this.position = 0; this.velocity = 0; this.target = 0;
  }
  update(dt) {
    const force = -this.stiffness * (this.position - this.target) - this.damping * this.velocity;
    this.velocity += force * dt;
    this.position += this.velocity * dt;
    return this.position;
  }
}

// Oscillation patterns
mesh.position.y = Math.sin(t * 2) * 0.5;       // Sine wave
mesh.position.y = Math.abs(Math.sin(t * 3)) * 2; // Bounce
mesh.position.x = Math.cos(t) * 2;              // Circular
mesh.position.z = Math.sin(t) * 2;
```

---

## Shaders

### ShaderMaterial

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff0000) },
    map: { value: texture },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float time;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      pos.z += sin(pos.x * 5.0 + time) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform vec3 color;
    uniform sampler2D map;

    void main() {
      vec4 texColor = texture2D(map, vUv);
      gl_FragColor = vec4(color * texColor.rgb, 1.0);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
});

material.uniforms.time.value = clock.getElapsedTime();
```

### Built-in Uniforms & Attributes (auto-provided)

```glsl
// Vertex shader
uniform mat4 modelMatrix, modelViewMatrix, projectionMatrix, viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
attribute vec3 position, normal;
attribute vec2 uv;
```

### Common Patterns

```glsl
// Fresnel
vec3 viewDir = normalize(cameraPosition - worldPosition);
float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);

// Noise
float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }

// Gradient
vec3 color = mix(colorA, colorB, smoothstep(0.0, 1.0, vUv.y));

// Dissolve
float n = texture2D(noiseMap, vUv).r;
if (n < progress) discard;
```

### Extending Built-in Materials

```javascript
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
mat.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: 0 };
  shader.vertexShader = "uniform float time;\n" + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
    transformed.y += sin(position.x * 10.0 + time) * 0.1;`
  );
  mat.userData.shader = shader;
};
```

### GLSL Reference

```glsl
// Math: abs, sign, floor, ceil, fract, mod, min, max, clamp, mix, step, smoothstep
// Trig: sin, cos, tan, asin, acos, atan, radians, degrees
// Exp: pow, exp, log, sqrt, inversesqrt
// Vector: length, distance, dot, cross, normalize, reflect, refract
// Texture: texture2D(sampler, coord)  |  GLSL3: texture(sampler, coord)
```

---

## Post-Processing

### Setup

```javascript
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// In animation loop: composer.render() instead of renderer.render()

// Resize
composer.setSize(width, height);
```

### Built-in Effects

```javascript
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { HalftonePass } from "three/addons/postprocessing/HalftonePass.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";

// Bloom
const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);

// SSAO
const ssao = new SSAOPass(scene, camera, w, h);
ssao.kernelRadius = 16;

// DOF
const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.025, maxblur: 0.01 });

// Anti-aliasing
const smaa = new SMAAPass(w * dpr, h * dpr);
const fxaa = new ShaderPass(FXAAShader);
fxaa.uniforms.resolution.value.set(1/w, 1/h);

// Outline selection
const outline = new OutlinePass(new THREE.Vector2(w, h), scene, camera);
outline.selectedObjects = [mesh1, mesh2];
outline.edgeStrength = 3;

// Film grain, vignette, gamma
composer.addPass(new FilmPass(0.35, 0.5, 648, false));
const vignette = new ShaderPass(VignetteShader);
vignette.uniforms.offset.value = 1.0;
composer.addPass(new ShaderPass(GammaCorrectionShader));
```

### Selective Bloom

```javascript
const BLOOM_LAYER = 1;
glowingMesh.layers.enable(BLOOM_LAYER);

const darkMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const savedMats = {};

function darkenNonBloomed(obj) {
  if (obj.isMesh && !bloomLayer.test(obj.layers)) {
    savedMats[obj.uuid] = obj.material;
    obj.material = darkMat;
  }
}
function restore(obj) {
  if (savedMats[obj.uuid]) { obj.material = savedMats[obj.uuid]; delete savedMats[obj.uuid]; }
}
```

### Custom ShaderPass

```javascript
const CustomEffect = {
  uniforms: {
    tDiffuse: { value: null },  // Required: input texture
    time: { value: 0 },
    amount: { value: 0.005 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      float r = texture2D(tDiffuse, vUv - dir * amount * dist).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + dir * amount * dist).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};
const customPass = new ShaderPass(CustomEffect);
```

### Recommended Pipeline

```javascript
composer.addPass(new RenderPass(scene, camera));  // 1. Scene
composer.addPass(bloomPass);                       // 2. Bloom
composer.addPass(vignettePass);                    // 3. Vignette
composer.addPass(new ShaderPass(GammaCorrectionShader)); // 4. Gamma
composer.addPass(fxaaPass);                        // 5. AA (always last)
```

---

## Interaction

### Raycasting

```javascript
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickables, true);

  if (intersects.length > 0) {
    const { object, point, face, instanceId } = intersects[0];
    // Handle click
  }
}

renderer.domElement.addEventListener("click", onClick);

// Raycaster options
raycaster.near = 0; raycaster.far = 100;
raycaster.layers.set(1);  // Only intersect layer 1
```

### Camera Controls

```javascript
// OrbitControls (most common)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;
controls.minDistance = 2; controls.maxDistance = 50;
controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI / 2;
controls.autoRotate = true;
controls.target.set(0, 1, 0);
controls.update(); // Required each frame for damping

// Other controls
import { FlyControls } from "three/addons/controls/FlyControls.js";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { MapControls } from "three/addons/controls/MapControls.js";
```

### TransformControls (Gizmo)

```javascript
import { TransformControls } from "three/addons/controls/TransformControls.js";
const tc = new TransformControls(camera, renderer.domElement);
scene.add(tc);
tc.attach(mesh);
tc.setMode("translate"); // 'translate', 'rotate', 'scale'
tc.addEventListener("dragging-changed", (e) => { orbitControls.enabled = !e.value; });
```

### DragControls

```javascript
import { DragControls } from "three/addons/controls/DragControls.js";
const drag = new DragControls(draggableObjects, camera, renderer.domElement);
drag.addEventListener("dragstart", () => { orbitControls.enabled = false; });
drag.addEventListener("dragend", () => { orbitControls.enabled = true; });
```

### Selection & Hover

```javascript
let selected = null, hovered = null;

function onMouseMove(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hoverables);

  if (hovered) { hovered.material.color.set(hovered.userData.origColor); document.body.style.cursor = "default"; }
  if (intersects.length > 0) {
    hovered = intersects[0].object;
    hovered.userData.origColor = hovered.userData.origColor || hovered.material.color.getHex();
    hovered.material.color.set(0xff6600);
    document.body.style.cursor = "pointer";
  } else { hovered = null; }
}
```

### Coordinate Conversion

```javascript
// World → Screen
function worldToScreen(pos, camera) {
  const v = pos.clone().project(camera);
  return { x: (v.x + 1) / 2 * window.innerWidth, y: -(v.y - 1) / 2 * window.innerHeight };
}

// Screen → World (on a plane)
function screenToWorld(sx, sy, camera, targetZ = 0) {
  const v = new THREE.Vector3((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1, 0.5).unproject(camera);
  const dir = v.sub(camera.position).normalize();
  return camera.position.clone().add(dir.multiplyScalar((targetZ - camera.position.z) / dir.z));
}

// Ray-Plane intersection
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
raycaster.ray.intersectPlane(plane, intersectionPoint);
```

### Keyboard Input

```javascript
const keys = {};
document.addEventListener("keydown", (e) => { keys[e.code] = true; });
document.addEventListener("keyup", (e) => { keys[e.code] = false; });

function update() {
  if (keys.KeyW) player.position.z -= 0.1;
  if (keys.KeyS) player.position.z += 0.1;
  if (keys.KeyA) player.position.x -= 0.1;
  if (keys.KeyD) player.position.x += 0.1;
}
```

---

## Performance Tips (All Topics)

1. **Draw calls**: Merge geometries, use InstancedMesh, atlas textures
2. **Materials**: Reuse materials, prefer simpler types, use alphaTest over transparency
3. **Shadows**: Tight frustums, limit shadow-casting lights, 1024 maps usually enough
4. **Textures**: Power-of-2 dimensions, compress with KTX2, dispose unused
5. **Geometry**: Use indexed geometry, appropriate segment counts, dispose when done
6. **Animation**: Share clips, pause off-screen mixers, LOD for distant rigs
7. **Shaders**: Minimize uniforms, avoid conditionals (use mix/step), precalculate in JS
8. **Post-processing**: Limit passes, reduce resolution for blur, disable unused effects
9. **Raycasting**: Throttle mousemove, use layers to filter, simple collision meshes
10. **General**: `renderer.info` for stats, LOD for distance, frustum culling (default on)

---

## React Three Fiber (R3F)

R3F (28K stars, MIT) is Three.js rendered through React's reconciler. Zero performance overhead — every R3F component maps 1:1 to a Three.js object. Use R3F when you're already in React/Next.js.

### Installation

```bash
npm install three @react-three/fiber @react-three/drei
```

### Basic Scene

```tsx
'use client';
import { Canvas } from '@react-three/fiber';

function Box() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <Box />
    </Canvas>
  );
}
```

### useFrame (Animation Loop)

```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

function SpinningBox() {
  const ref = useRef<Mesh>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.x += delta;
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
```

**Never allocate objects inside useFrame** — create refs, vectors, and materials outside the loop.

### useThree (Access Internals)

```tsx
import { useThree } from '@react-three/fiber';

function CameraLogger() {
  const { camera, gl, scene, size } = useThree();
  // Access any Three.js internal
  return null;
}
```

### Loading Models

```tsx
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Suspense } from 'react';

function Model() {
  const gltf = useLoader(GLTFLoader, '/model.glb', (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);
  });
  return <primitive object={gltf.scene} />;
}

// Always wrap in Suspense
<Suspense fallback={null}>
  <Model />
</Suspense>
```

### Events (Direct on Meshes)

```tsx
<mesh
  onClick={(e) => { e.stopPropagation(); console.log(e.point); }}
  onPointerOver={() => document.body.style.cursor = 'pointer'}
  onPointerOut={() => document.body.style.cursor = 'default'}
>
  <boxGeometry />
  <meshStandardMaterial />
</mesh>
```

### frameloop Control

```tsx
// Static scene — only render when state changes (saves GPU)
<Canvas frameloop="demand">

// Manual control — for SALA integration with GSAP ticker
<Canvas frameloop="never">
  {/* Call gl.advance() from GSAP ticker */}
</Canvas>
```

### Next.js Integration

```tsx
// components/Scene.tsx — must be a client component
'use client';
import { Canvas } from '@react-three/fiber';
// ... scene code

// app/page.tsx — lazy load to avoid SSR issues
import dynamic from 'next/dynamic';
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });
```

---

## Drei Helpers

Drei (9.5K stars) provides 200+ ready-made R3F helpers. Import only what you need.

```tsx
import {
  Environment, OrbitControls, PerspectiveCamera,
  Html, Float, useGLTF, Preload, PerformanceMonitor,
  MeshDistortMaterial, MeshWobbleMaterial, Text, Bvh,
} from '@react-three/drei';
```

### Essential Helpers

```tsx
{/* Environment lighting (IBL) — replaces manual PMREM setup */}
<Environment preset="sunset" /> {/* city, dawn, forest, lobby, night, park, studio, sunset, warehouse */}
<Environment files="/custom.hdr" />

{/* Camera with damping */}
<PerspectiveCamera makeDefault fov={75} position={[0, 0, 5]} />
<OrbitControls enableDamping dampingFactor={0.05} />

{/* Mix DOM elements inside 3D */}
<Html position={[0, 2, 0]} center transform>
  <div className="label">Hello 3D</div>
</Html>

{/* Floating animation */}
<Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
  <mesh><boxGeometry /><meshStandardMaterial /></mesh>
</Float>

{/* GLTF with Draco (auto-configured) */}
function Model() {
  const { scene } = useGLTF('/model.glb');
  return <primitive object={scene} />;
}
useGLTF.preload('/model.glb');

{/* Preload all assets */}
<Preload all />
```

### Special Materials

```tsx
{/* Organic distortion */}
<MeshDistortMaterial color="purple" speed={2} distort={0.5} radius={1} />

{/* Wobble effect */}
<MeshWobbleMaterial color="blue" factor={1} speed={2} />

{/* 3D Text (troika-based, no font loading boilerplate) */}
<Text fontSize={1} color="white" anchorX="center" anchorY="middle">
  Hello World
</Text>
```

---

## WebGPU Renderer

Production-ready since Three.js r171 (Sep 2025). 2-10x performance gains in complex scenes. ~95% browser coverage with automatic WebGL 2 fallback.

### Setup (Vanilla)

```javascript
import * as THREE from 'three';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';

const renderer = new WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

await renderer.init(); // WebGPU requires async init
// Falls back to WebGL 2 automatically if WebGPU unavailable
```

### Three Shading Language (TSL)

WebGPU uses TSL instead of GLSL for node-based shader authoring:

```javascript
import { color, uniform, vec3, sin, timerLocal } from 'three/tsl';

const time = timerLocal();
const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color(0xff0000).mix(color(0x0000ff), sin(time));
```

### Feature Detection

```javascript
if (navigator.gpu) {
  // WebGPU available — use WebGPURenderer
} else {
  // Fallback to WebGLRenderer
}
```

---

## Performance Patterns

### DPR Capping

```tsx
// Never render at full 4K — cap at 1.5x for HiDPI screens
<Canvas dpr={[1, 1.5]}>

// Vanilla
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
```

### On-Demand Rendering

```tsx
// Static scenes — only re-render when something changes
<Canvas frameloop="demand">

// Trigger re-render manually
import { invalidate } from '@react-three/fiber';
invalidate(); // Request single frame
```

### Adaptive Quality (Drei)

```tsx
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';

<Canvas>
  <PerformanceMonitor
    onIncline={() => setDpr(1.5)}
    onDecline={() => setDpr(0.75)}
  >
    <AdaptiveDpr pixelated />
    {/* Scene content */}
  </PerformanceMonitor>
</Canvas>
```

### BVH Acceleration (Drei)

```tsx
// Wrap scene in Bvh for faster raycasting on complex geometry
import { Bvh } from '@react-three/drei';

<Bvh firstHitOnly>
  <Scene />
</Bvh>
```

### Lazy Loading (Next.js)

```tsx
import dynamic from 'next/dynamic';

// Code-split the entire 3D scene — zero JS on initial load
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-black" />,
});
```

### Draco Compression

Always use Draco-compressed GLB files. Reduces model size 60-90%:

```bash
npx gltf-pipeline -i model.glb -o model-draco.glb --draco.compressionLevel 7
```

### SALA Integration (GSAP Ticker Sync)

For the Cinematic Web Engine — sync R3F with GSAP's single animation loop:

```tsx
<Canvas frameloop="never">
  <SALASync />
  {/* Scene content */}
</Canvas>

function SALASync() {
  const { advance } = useThree();
  useEffect(() => {
    gsap.ticker.add(() => advance(performance.now() / 1000));
    return () => gsap.ticker.remove(advance);
  }, [advance]);
  return null;
}
```

See **cinematic-web-engine** (SK-096) for the full SALA pattern.
