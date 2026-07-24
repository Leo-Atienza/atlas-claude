---
id: SYS-APP
name: app-dev
title: App-Dev (Mobile / Native) System
domain: native
when_to_use: React Native / Expo / Flutter / Swift / Android apps — mobile screens, native builds, APK/IPA pipelines.
status: active
skills:
  - SK-126   # Mobile App Design (HIG + Material 3 + RN traps)
  - SK-127   # Design Check (pre-flight)
  - SK-128   # Ship Verify (APK/IPA pipeline)
  # v10: SK-027 e2e-testing archived — device flows go through the `mobile` MCP; restore from _archived on demand
  - react-native           # RN + Expo optimization guide
  - building-native-ui     # Expo Router UI
  - swiftui-pro            # SwiftUI review
  - android-development    # Kotlin / Compose / NowInAndroid
  - SK-135                 # App Store Review — Apple rejection preflight
  - SK-136                 # Fastlane — native/non-EAS deploy + code signing
  - SK-137                 # Upgrading RN — bare/ejected version bumps
  - SK-138                 # RN Brownfield — embed RN/Expo into existing native apps
  - SK-139                 # RN GitHub Actions CI — simulator/emulator cloud builds
preferred_mcp:
  - mobile
  - tauri-mcp
  - expo
  - MCP_DOCKER
commands: [new-mobile-app]
agents: []   # flow agents archived v10 — planning/execution use plan files + the Workflow tool (CLAUDE.md two lanes)
rules: [RULES-GIT, RULES-TESTING]
companions: []
detect:
  detect_files:
    - app.json
    - eas.json
    - pubspec.yaml
    - android/build.gradle
    - ios/Podfile
  detect_packages: [expo, react-native, "@react-native/*"]
  priority: 40
---
# App-Dev (Mobile / Native) System

**The chef model (mirrored from SYS-WEB, 2026-07-11).** This manifest is the **chef** — the acting app-dev entity. The **brain** is `<your-vault-path>/wiki/app-dev/` (hub + capability-map + build-workflow + stack + principles): it *plans*. Skills and plugins are ingredients; the `mobile` / `tauri-mcp` MCPs and EAS/store tooling are the knives. Ingredients never plan the meal — on any real build the chef plans from the brain first. A bugfix never enters the kitchen: the brain routes, the task decides ([[webdev-brain-routes-not-mandates]]).

## The chef's loop (apps, features, screens — a bugfix/copy tweak skips straight to the work)

1. **PLAN from the brain — before loading any skill.** Hub `app-dev/app-dev-system.md` → the loadout row for this prompt's archetype in `capability-map.md` § Task Router (9 archetypes: greenfield app · single screen · camera/ML · offline field · realtime collab · desktop/local-AI · native iOS/Android · store ship · upgrade/migrate) → stage sequence from `build-workflow.md` → pins/mandates from `stack.md` (SDK/API floors, store requirements are *load-bearing and time-sensitive*) + `principles.md`. Emit the **menu** — ≤6 lines: deliverable(s), loadout (skills + MCPs), gates, stop condition — then cook to it, nothing beyond it.
2. **MISE EN PLACE.** Design-led work without `.tactile.md` → `/tactile teach` first. Design reference in hand → `/design-check` (SK-127) BEFORE coding. Check the native knowledge slice (stamped `**Domain**: native` by /remember; view unlocks at ≥5 entries — `node scripts/knowledge-view.js native --json`, then add `knowledge_domains: [native]`).
3. **COOK — ingredients execute the menu.** Mobile UI craft through `tactile` (SK-134, loads SK-126 mobile-app-design as its principles library) — never raw generic styling. RN/Expo: `react-native` + `building-native-ui`; Expo deploys/dev-clients/EAS/upgrades auto-trigger their `expo-*` plugin skills. Native iOS → `swiftui-pro`; Android → `android-development`. Desktop-native → `tauri-mcp`. Store preview/promo video → SK-143 hyperframes (web-dev-registered, routes itself).
4. **TASTE — the gates.** AR-T audit sheet (zero BLOCK) + **device proof** via the `mobile` MCP (screenshot on a real device/simulator) → E2E device flows through the `mobile` MCP where flows matter (e2e-testing skill archived v10) → APK/IPA/EAS claims through `/ship-verify` (SK-128: artifact existence + size + mtime, never trust exit-zero) → before any App Store submit, `app-store-review` (SK-135) for Apple-rejection patterns (IAP, privacy/ATT, UGC, private APIs, OTA misuse). Deployment: EAS Submit (`expo-deployment`) is the default for managed Expo — and the only option on a Windows host without a macOS CI runner; **non-EAS** native/bare-RN → `fastlane` (SK-136, iOS lanes need macOS).
5. **PLATE & LEARN.** Deliver with device proof. Genuinely new pattern or failure → `wiki/engineering/` KNOWLEDGE entry stamped `**Domain**: native` — the brain that plans the next build must include this one.

Standing preferences while active: `RULES-GIT` + `RULES-TESTING` for matching work. Preferred MCP (advisory): mobile (device automation), tauri-mcp (desktop), expo, MCP_DOCKER gateway.
