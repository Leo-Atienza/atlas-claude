# Camera/Scanner App Blueprint

## Archetype
Apps centered on camera: document scanner, inventory tracker, AR experience, photo editor with ML, receipt scanner, ID verification, quality inspection.

## Stack
- Expo SDK 54 + Expo Router v4
- Vision Camera v5 (multi-camera, depth, frame processors)
- MediaPipe (pose/face/object detection via frame processors)
- expo-image (gallery, editing)
- sqlite-vec (image embedding search)
- Reanimated 4 (camera UI animations)
- Zustand v5 + MMKV

## Skills to Load
SK-058 (Universal Conductor), SK-089 (Hardware Bridge), SK-091 (Edge Intelligence), SK-027 (E2E Testing)

## Architecture
```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Vision Cam   │────▶│ Frame Processor  │────▶│ ML Model     │
│ v5 (camera)  │     │ (worklet, camera │     │ (MediaPipe/  │
│              │     │  thread)         │     │  ML Kit)     │
└─────────────┘     └──────────────────┘     └──────┬───────┘
                                                    │
                    ┌───────────────────────────────▼──────┐
                    │         Results Pipeline             │
                    │  ┌──────────┐  ┌────────────────┐   │
                    │  │ Overlay  │  │ sqlite-vec      │   │
                    │  │ (Skia)   │  │ (embedding      │   │
                    │  │          │  │  storage+search) │   │
                    │  └──────────┘  └────────────────┘   │
                    └─────────────────────────────────────┘
```

- Vision Camera v5 with frame processor pipeline
- MediaPipe models loaded at app start
- Frame processor: camera → resize (GPU) → ML model → overlay/action
- Results stored locally with embeddings for search
- Multi-camera support for depth/scanning

## File Structure
```
app/
  (tabs)/
    index.tsx            # Gallery / recent scans
    camera.tsx           # Main camera view
    search.tsx           # Semantic image search
  scan/[id].tsx          # Scan result detail
  _layout.tsx
components/
  CameraView.tsx         # Vision Camera wrapper
  ScanOverlay.tsx        # Barcode/object overlay
  PoseOverlay.tsx        # Skeleton drawing (Skia)
  ResultCard.tsx         # Scan result display
hooks/
  useFrameProcessor.ts   # MediaPipe frame processor
  useScanHistory.ts      # Local scan storage
lib/
  mediapipe.ts           # Model loading
  vectors.ts             # sqlite-vec setup
  camera-utils.ts        # Photo/video helpers
stores/
  camera-store.ts        # Camera settings
  scan-store.ts          # Scan results
```

## Setup Checklist
- [ ] Vision Camera v5 + frame processor worklets
- [ ] MediaPipe model selection + preloading
- [ ] Camera permissions handling (iOS + Android)
- [ ] Photo/video capture + local storage
- [ ] Barcode scanning via `codeScanner` API
- [ ] Real-time overlay rendering (Skia or Reanimated)
- [ ] sqlite-vec for image embedding storage + search
- [ ] Gallery with image search
- [ ] Haptics on scan success/failure
- [ ] Flash/torch toggle with animation
