# Active Skills — Page 3: Native, Cross-Platform & Personal Domain

> These skills are always available. Load on-demand when a task matches their domain.
> This page covers native mobile work, cross-platform tooling.
> For platform-plugin skills (Expo, React Native, SwiftUI, Android, Tauri), see the **Plugin Skills** pointers at the bottom — those live in plugin namespaces and load automatically when their triggers fire.

## Mobile & Native Design

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-134 | Tactile (Mobile Craft) | `skills/tactile/SKILL.md` | **Entry point** for building/beautifying any mobile/app UI (Expo/RN + native iOS/Android) — grounding-first craft/teach flow, 16-file reference library, 31-rule deterministic mobile anti-slop audit, 3-stage device-verification pipeline. Supersedes SK-126 and loads it as its principles library. |
| SK-126 | Mobile App Design | `skills/mobile-app-design/SKILL.md` | iOS HIG + Material 3 + Stitch glassmorphism + RN translation pitfalls + 22-item review checklist for mobile screens — tactile's (SK-134) principles library |

> **For any actual mobile build, start with `/tactile craft`** (or `/tactile teach` first to set design context). SK-134 grounds in project context, routes to the deep build skills (building-native-ui, react-native, swiftui-pro, android-development), and runs the deterministic audit + device-verification gates. SK-126 remains the manual review playbook tactile loads — its `CHECKLIST.md` is still the canonical 22-item screen review.

## Pre-Flight Verification (Build & UI)

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-127 | Design Check (pre-flight) | `skills/design-check/SKILL.md` | Front-loaded visual diff before any UI code — captures gap list against Stitch/Figma/screenshot, requires sign-off; Playwright fallback when the browser preview is degraded |
| SK-128 | Ship Verify | `skills/ship-verify/SKILL.md` | Verify-before-done for builds (APK/IPA/dist), deploys, tests, git, a private project APK pipeline — never trusts UP-TO-DATE; checks artifact existence + size + mtime + sha |

> These pair naturally with SK-126 — `/design-check` BEFORE editing UI, `/ship-verify` BEFORE claiming a build is shipped. Together they close the "missed regressions" and "stale APK / wrong folder" friction surfaced in the 2026-05-13 Claude Code Insights report.

## App Store & Deployment

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-135 | App Store Review | `skills/app-store-review/SKILL.md` | Apple App Store Review Guidelines preflight — scans Swift/ObjC/RN/Expo code for rejection patterns (IAP, privacy/ATT, UGC, private APIs, OTA-update misuse) across all 5 guideline sections; verbatim `rules/1-5.md` detail. Run BEFORE EAS Submit / `fastlane release`. |
| SK-136 | Fastlane Deploy | `skills/fastlane/SKILL.md` | Native iOS/Android release via Fastlane — TestFlight, App Store submission, Match code signing, automated screenshots, Xcode Cloud / GitHub Actions CI. For non-EAS / bare-RN pipelines; **iOS lanes need macOS** (Windows → macOS CI runner). Complements `expo-deployment` (EAS). |

> These two are the **release-gate layer**: `/app-store-review` catches Apple-rejection risks in code before you ship; `fastlane` is the non-EAS deployment toolchain. For Expo managed projects, EAS Submit (`expo-deployment`) stays the default path — reach for fastlane only when leaving the managed flow. Both vendored 2026-06-18 (v8.12.0) from a vetted skills.sh app-dev sweep.

## React Native — Upgrade, Migration & CI

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-137 | Upgrading React Native | `skills/upgrading-react-native/SKILL.md` | Bare/ejected RN version upgrades via Upgrade Helper template diffs — dependency updates, native iOS/Android config (CocoaPods, Gradle, AppDelegate), Expo SDK steps, breaking-API migration. For managed Expo, prefer `upgrading-expo`. |
| SK-138 | RN Brownfield Migration | `skills/react-native-brownfield-migration/SKILL.md` | Incremental adoption of RN/Expo into an **existing native app** — XCFramework/AAR generation + phased host integration (bare-RN and Expo tracks). Greenfield work stays with `new-mobile-app` / `tactile`. |
| SK-139 | RN GitHub Actions CI | `skills/github-actions/SKILL.md` | GitHub Actions workflow patterns for RN iOS-simulator / Android-emulator cloud builds with downloadable artifacts (gh CLI / GitHub API). Complements `expo-cicd-workflows` (EAS Workflows) and `fastlane`. |

> The **Callstack trio** (`callstackincubator/agent-skills` @ `0ba043ab`, MIT, SHA-pinned) — the bare-RN / native-integration layer. Held in v8.12.0 (low-value for the user's Expo/EAS stack), adopted v8.13.0 to complete the app-dev sweep hand-off. They trigger on bare-RN / ejected / native-host work, not the managed Expo path.

## Cross-Platform Test & E2E

| ID | Name | Path | Description |
|----|------|------|-------------|
| SK-027 | E2E Testing (AI-Powered) | `skills/e2e-testing/SKILL.md` | AI-powered end-to-end testing for Flutter, React Native, iOS, Android, Electron, Tauri, KMP, .NET MAUI — natural-language test driver via MCP |

> Also listed on Page 2 (Deployment & Testing). Cross-listed here because its primary value is cross-platform mobile/desktop coverage.

---

## Plugin Skills (auto-load by trigger)

The following native/cross-platform skills live in plugin namespaces (`<plugin>:<skill-name>`) and don't need to be in this page. They auto-load when their triggers fire (e.g., editing a Swift file loads `swiftui-pro`; running `/expo-cicd-workflows` loads the Expo CI/CD guide).

**Expo & React Native:**
- `react-native` — Callstack profiling + Vercel patterns for FPS, TTI, bundle size, memory
- `building-native-ui` — Expo Router fundamentals, styling, navigation
- `expo-dev-client` — TestFlight + local distribution
- `expo-deployment` — App Store, Play Store, web hosting
- `expo-module` — Native module DSL (Swift/Kotlin/TS)
- `expo-cicd-workflows` — EAS workflow YAML
- `expo-tailwind-setup`, `tailwind-setup` — NativeWind styling (production = v4.2.6 + Tailwind v3; **v5 is preview-only**, the Tailwind-v4 path — see the trap in `app-dev/stack.md`)
- `upgrading-expo` — SDK upgrade playbook
- `use-dom` — DOM components in webview on native
- `expo-ui-jetpack-compose`, `expo-ui-swiftui` — `@expo/ui` integrations
- `expo-api-routes` — Expo Router API routes

**iOS / Swift:**
- `swiftui-pro` — SwiftUI best practices + modern APIs
- `swift-concurrency-pro` — async/await correctness review
- `swift-testing-pro` — Swift Testing modern APIs

**Android:**
- `android-development` — Kotlin + Jetpack Compose + MVVM + Hilt + Room (NowInAndroid patterns)

**Cross-platform desktop:**
- `tauri-mcp` — Tauri webview interaction, IPC, driver session (loaded as MCP server tools, not a skill)

When in doubt about which to use, check `plugin-installed-skills` listing in your session and let triggers route automatically.

---

## Cross-page references

- Page 1 covers web/frontend/design (Next.js, GSAP, Vitest, design polish, security)
- Page 2 covers backend/tools/workflow (SQL, API design, deploy, debugging, smart-swarm, wiki, research, TDD)
- Page 3 (this page) covers native mobile, pre-flight verification, and cross-platform testing
