# app-pro templates — ATLAS v9 Wave 6 (D1–D9)

The CI/regression/ops layer for the app-dev (tactile) system. Windows host shapes
everything: **Android local, iOS via EAS/CI only.** All pins re-verified 2026-07-12
(v9 Wave 0 + this wave). Free-tier caps stated.

| File | Item | What |
|---|---|---|
| `app-quality.yml` | D8 | GitHub Actions: lint→tsc→jest, then Android-emulator Maestro smoke (ubuntu KVM, API 35). |
| `.maestro/smoke.yaml` | D3 | Maestro smoke flow — runs **locally on Windows now** + in CI. |

## D2 — free-CI decision table (codify in app-dev/build-workflow.md)
**EAS free tier (verified expo.dev/pricing 2026-07-12): 15 Android + 15 iOS builds/mo (30 total, SPLIT — not interchangeable; an Android-only month gets 15, not 30),** 1 concurrency, 45-min timeout, low queue priority. EAS Update **1,000 MAU / 100 GiB / 20 GiB storage**. EAS Submit (Play + App Store) **free**. Ladder:
- **Android local (zero quota):** `npx expo prebuild` + `gradlew :app:bundleRelease`.
- **CI:** GH Actions — public repos unlimited incl. macOS; private 2,000 min/mo with **macOS 10x ⇒ ~200 real macOS min** (public repos or Android-only CI for private).
- Spend EAS **iOS** builds ONLY on signed store builds. `eas build --local` is macOS/Linux-only (not native Windows).

## D3 — Maestro (native Windows now viable)
Apache-2.0, free, unlimited locally, Java 17+. **Native Windows is first-class as of 2026-07-12** (the old "macOS/Linux+WSL2 only" record is stale) — so the local regression layer is Maestro against the Android emulator, plus the `mobile` MCP as the interactive/NL driver. Flows live in-repo; CI runs them too.

## D4 — perf-regression + bundle discipline
- **Reassure** (callstack, MIT, v1.5.0) — `.perf-test.tsx` render-duration regression tests in CI.
- **`EXPO_ATLAS=true npx expo export`** → **expo-atlas** (MIT, v0.4.3) module-level bundle analysis; budget-diff step in CI.
- **Flashlight** (bamlab, MIT) — "Lighthouse for mobile", deep-dive score on real Android. Budgets anchored to Android vitals: **cold start <5s = flag; ~2s target** on mid-range. Adds a **Measure** stage to app-dev build-workflow (mirrors web).

## D5 — crash/error tracking
Sentry-on-Expo: config plugin + EAS sourcemap upload; **crash-free rate is the rollout gate** before bumping staged-rollout %. Developer tier 5k errors/mo **shared with web projects** (single org budget). Crashlytics = the alternative when already on Firebase (static-frameworks config-plugin friction noted).

## D6 — OTA / release runbook
EAS Update discipline: channels, `runtimeVersion` policy, staged rollout %, rehearsed rollback, the 1,000-MAU math. Policy citations so OTA is defensible: Apple DPLA 3.3.1(B) interpreted-code rule; Play's sandboxed-JS exemption. Store screenshots via fastlane `snapshot`/`screengrab` (free; iOS lanes need macOS ⇒ GH Actions).

## D7 — store-mandate watchdog (extend wiki-lint §4c)
Add DATED mandate checks with official URLs + a "re-fetch if >30 days" rule:
- **Play target-API floor: API 35** (API 36 NOT mandated — verified 2026-07-12). `developer.android.com/google/play/requirements/target-sdk`.
- **16 KB page size: since 2025-11-01** for apps targeting Android 15+ (native-`.so` risk). `developer.android.com/guide/practices/page-sizes`.
- **iOS 26 SDK build mandate** (in effect 2026-04-28). Xcode/iOS-SDK floor.
This is the machinery that would have caught the SDK-57 drift class a week earlier.

## D8 — `create-atlas-app` (mirror of create-atlas-web)
Expo (SDK 57) + expo-router + `starter-tokens.ts` + `userInterfaceStyle:"automatic"` (the runtime-proven trap) + jest-expo/RNTL + Reassure + Maestro smoke + `app-quality.yml` + Sentry-optional + ~60-line CLAUDE.md definition-of-done. `[the user — conservative default: build locally, run the gate suite locally (emulator render + lint/tsc/test + Maestro), STOP before repo creation.]`

## D9 — ship-mobile checklist (one build-workflow section)
tactile AR-T audit → device proof (`mobile` MCP) → Maestro smoke → store assets (fastlane screenshots + Canva MCP) → app-store-review skill (SK-135) pre-submit → EAS Submit → staged rollout + **crash-free gate** (D5) → cook-log entry (`app-dev/cook-log.md`).
