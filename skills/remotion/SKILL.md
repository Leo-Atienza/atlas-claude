# Remotion — Programmatic Video with React

> Use this skill when working on any Remotion project: creating compositions, animating elements, rendering videos, or building video pipelines.

**Context7 ID:** `/websites/remotion_dev` (trust: 9.6, 3236 snippets) — always fetch docs before working on unfamiliar APIs.

---

## What Remotion Is

Remotion lets you build videos as React components. Every frame is a React render. You use `useCurrentFrame()` to get the current frame number and animate based on it. No timelines, no keyframe editors — just code.

```tsx
// The entire mental model
const frame = useCurrentFrame(); // 0, 1, 2, 3...
const opacity = frame / 30;     // animate based on frame
return <div style={{ opacity }}>Hello</div>;
```

---

## Project Structure

```
src/
├── index.ts          # Entry point — registers RemotionRoot
├── Root.tsx          # Defines all <Composition> entries
├── MyComp.tsx        # Your actual video component(s)
public/               # Static assets (images, audio, video)
```

### Root.tsx — Register compositions
```tsx
import { Composition } from 'remotion';
import { MyComp } from './MyComp';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyComp"
    component={MyComp}
    durationInFrames={150}   // 5 seconds at 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ title: 'Hello' }}
  />
);
```

---

## Core Hooks

| Hook | Returns | Use for |
|------|---------|---------|
| `useCurrentFrame()` | `number` (0-indexed) | All time-based animation |
| `useVideoConfig()` | `{ fps, durationInFrames, width, height }` | FPS-independent math |

Always use `fps` from `useVideoConfig()` for frame-rate independence:
```tsx
const { fps, durationInFrames } = useVideoConfig();
// ✅ FPS-independent — works at 30fps or 60fps
const progress = interpolate(frame, [1 * fps, 2 * fps], [0, 1]);
```

---

## Animation APIs

### `interpolate()` — map frame ranges to value ranges
```tsx
import { interpolate, useCurrentFrame } from 'remotion';

const frame = useCurrentFrame();

// Fade in over first 30 frames
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// Fade in, hold, fade out
const { durationInFrames } = useVideoConfig();
const opacityFull = interpolate(
  frame,
  [0, 20, durationInFrames - 20, durationInFrames],
  [0,  1,                      1,                0]
);

// Color interpolation
import { interpolateColors } from 'remotion';
const color = interpolateColors(frame, [0, 60], ['#ff0000', '#0000ff']);
```

**Extrapolation options:** `'clamp'` (default), `'extend'`, `'identity'`, `'wrap'`

### `spring()` — physics-based animation
```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({ frame, fps });  // 0→1 with bounce

// Enter + exit pattern
const enter = spring({ frame, fps, config: { damping: 200 } });
const exit  = spring({ frame: frame - (durationInFrames - 20), fps, config: { damping: 200 } });
const finalScale = enter - exit;  // combined animation math
```

### Easing
```tsx
import { Easing, interpolate } from 'remotion';

interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.bezier(0.8, 0.22, 0.96, 0.65),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
// Also: Easing.ease, Easing.bounce, Easing.spring, Easing.linear, Easing.back(n)
```

---

## Layout Components

```tsx
import { AbsoluteFill, Sequence, Series } from 'remotion';

// AbsoluteFill — full-canvas container (position: absolute, 100%×100%)
<AbsoluteFill style={{ backgroundColor: 'white' }}>
  <MyContent />
</AbsoluteFill>

// Sequence — delay a component by N frames
<Sequence from={30} durationInFrames={60}>
  <MyComp />   {/* useCurrentFrame() resets to 0 inside here */}
</Sequence>

// Series — play components sequentially
<Series>
  <Series.Sequence durationInFrames={90}><SceneA /></Series.Sequence>
  <Series.Sequence durationInFrames={90}><SceneB /></Series.Sequence>
</Series>
```

---

## Media

```tsx
import { staticFile, Img } from 'remotion';
import { Video, Audio } from '@remotion/media';

// Images
<Img src={staticFile('logo.png')} />

// Video with volume fade
<Video
  src={staticFile('clip.mp4')}
  volume={(f) => interpolate(f, [0, 30], [0, 1], { extrapolateLeft: 'clamp' })}
/>

// Audio
<Audio src={staticFile('music.mp3')} volume={0.5} />
```

---

## Transitions (`@remotion/transitions`)

```tsx
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={40}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
  <TransitionSeries.Sequence durationInFrames={60}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
// Other presentations: slide(), wipe(), flip(), iris({ width, height }), clockWipe(), none()
```

---

## CLI Commands

```bash
# Development
npx remotion studio                    # Open Studio (hot-reload preview)

# Rendering
npx remotion render MyComp out/video.mp4              # H.264 default
npx remotion render MyComp out/video.mp4 --codec=h264 --crf=18 --fps=30
npx remotion render MyComp out/video.mp4 --props='{"title":"Hello"}'
npx remotion render MyComp out/clip.mp4  --frames=30-120   # frame range
npx remotion render MyComp out/anim.gif  --codec=gif --every-nth-frame=2
npx remotion still  MyComp out/thumb.png --frame=0          # single frame

# Info
npx remotion compositions              # list all compositions
```

**Package manager variants:** replace `npx remotion` with `bunx remotion` for Bun.

---

## Programmatic Rendering (Node.js)

```ts
import { bundle } from '@remotion/bundler';
import { renderMedia, getCompositions } from '@remotion/renderer';

const bundled = await bundle({ entryPoint: './src/index.ts' });
const compositions = await getCompositions(bundled);

await renderMedia({
  codec: 'h264',
  composition: compositions[0],
  serveUrl: bundled,
  outputLocation: 'out/video.mp4',
  inputProps: { title: 'Hello' },
});
```

---

## Common Patterns

### Smooth text slide-in
```tsx
const { fps } = useVideoConfig();
const frame = useCurrentFrame();
const translateY = interpolate(frame, [0, fps * 0.5], [40, 0], { extrapolateRight: 'clamp' });
const opacity    = interpolate(frame, [0, fps * 0.3], [0, 1],  { extrapolateRight: 'clamp' });
return <div style={{ transform: `translateY(${translateY}px)`, opacity }}>{text}</div>;
```

### Counter / data-driven video
```tsx
// Pass data as defaultProps, render one video per data row
const MyComp: React.FC<{ name: string; score: number }> = ({ name, score }) => { ... };
```

### Looping animation
```tsx
const LOOP_DURATION = 60;
const loopFrame = frame % LOOP_DURATION;
const progress = interpolate(loopFrame, [0, LOOP_DURATION], [0, 1]);
```

---

## Key Constraints

- **No side effects in render** — components re-render on every frame; keep renders pure
- **No `Date.now()` or `Math.random()`** — use `frame` as the only source of time
- **`useCurrentFrame()` resets inside `<Sequence>`** — frame 0 inside a Sequence = its `from` in the parent
- **`staticFile()`** for local assets in `/public` — not raw string paths
- **Browser APIs only** — Remotion renders in Chromium; no Node.js APIs in components

---

## Packages Quick Reference

| Package | Purpose |
|---------|---------|
| `remotion` | Core (always needed) |
| `@remotion/media` | `<Video>`, `<Audio>` components |
| `@remotion/transitions` | `TransitionSeries`, presentations |
| `@remotion/animation-utils` | `interpolateStyles`, `makeTransform` |
| `@remotion/bundler` | Programmatic bundling |
| `@remotion/renderer` | Programmatic rendering |
| `@remotion/lambda` | AWS Lambda rendering |
| `@remotion/cloudrun` | GCP Cloud Run rendering |
| `@remotion/player` | Embed videos in React apps |
