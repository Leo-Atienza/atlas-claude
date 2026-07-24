---
name: fastlane
description: "Native iOS/Android release automation with Fastlane: TestFlight, App Store submission, Match signing, screenshots. For non-EAS pipelines and CI deploys; iOS lanes need macOS."
license: MIT
metadata:
  vendored_from: github:greenstevester/fastlane-skill@df448776
  version: "1.0"
---

# Fastlane Deployment

[Fastlane](https://fastlane.tools) is the industry-standard automation toolchain for iOS/Android release: code signing, building, screenshots, TestFlight, and App Store submission as one-command **lanes**. This skill is the distilled playbook for wiring it into a project.

## When to use this vs. EAS

- **Use `expo-deployment` (EAS Submit/Build)** for Expo managed projects — it is the path of least resistance and runs from any OS.
- **Use Fastlane (this skill)** when you have left the managed flow: bare React Native, native iOS/Android, custom signing, or a CI pipeline (Xcode Cloud, GitHub Actions macOS runners) where you want explicit, reproducible lanes.

> **Platform reality (important on Windows):** the iOS lanes (`gym`, `pilot`, `deliver`, `snapshot`, `match` cert generation) require **macOS + Xcode CLI tools**. On a Windows box you drive these through a **macOS CI runner** (Xcode Cloud or a GitHub Actions `macos-latest` job) — see the CI section. Android lanes (`supply`, Gradle builds) run on any OS.

## Prerequisites

- macOS with Xcode CLI tools (`xcode-select --install`) — for iOS
- [Homebrew](https://brew.sh), then `brew install fastlane` (Homebrew avoids the Bundler/Ruby 4.x dependency breakage)
- An Apple Developer account + an **App Store Connect API key** (`.p8`) for non-interactive/CI auth

## The release workflow

```
SETUP ──▶ MATCH ──▶ SNAPSHOT ──▶ BETA ──▶ RELEASE
(config)  (signing) (screenshots) (TestFlight) (App Store)
```

### 1. Setup — `fastlane/Appfile` + `fastlane/Fastfile`

`Appfile` holds identity; `Fastfile` defines lanes.

```ruby
# fastlane/Appfile
app_identifier("com.yourco.app")
apple_id("you@example.com")
team_id("ABCD1234")
```

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Run tests"
  lane :test do
    scan(scheme: "YourApp")
  end

  desc "Build + upload to TestFlight (internal)"
  lane :beta do |options|
    setup_ci                                   # temp keychain on CI; no-op locally
    match(type: "appstore", readonly: true)    # see lane :certificates
    increment_build_number unless options[:skip_build_increment]
    gym(scheme: "YourApp", export_method: "app-store")
    pilot(skip_waiting_for_build_processing: true)
  end

  desc "Submit the latest TestFlight build for App Store review"
  lane :release do
    deliver(
      build_number: latest_testflight_build_number.to_s,
      submit_for_review: true,
      automatic_release: false,
      force: true,
      skip_binary_upload: true   # submit an already-uploaded build
    )
  end
end
```

Run: `fastlane lanes` to list, `fastlane ios beta`, `fastlane ios release`.

### 2. Match — team code signing in a private Git repo

Match stores certificates + provisioning profiles **encrypted in a private Git repo**, so every machine/CI runner uses the same signing identity (kills "works on my machine" signing drift).

```bash
gh repo create certificates --private   # private repo for the encrypted certs
fastlane match init                      # choose git storage, point at that repo
fastlane match appstore                  # generate App Store certs (first run sets the passphrase)
```

- In build lanes, always call `match(type: "appstore", readonly: true)` so CI can't regenerate/revoke certs.
- Save the **Match passphrase** in a password manager — CI and new teammates need it.
- Onboard a teammate: `fastlane match appstore --readonly` (needs repo access + passphrase + Apple team membership).

### 3. Snapshot — automated App Store screenshots

`fastlane snapshot init` writes a `Snapfile` + `SnapshotHelper.swift`; you add `snapshot("01_Home")` calls in a UI-test target, then `fastlane snapshot` captures every device × language combination. Upload with `deliver`:

```bash
fastlane deliver --skip_binary_upload --skip_metadata --overwrite_screenshots
```

> **Gotchas:** App Store rejects screenshots with an **alpha channel** (`ITMS-90475`) — flatten to RGB first (`magick in.png -alpha remove -alpha off out.png`). Under any automated run StoreKit renders prices from the **US storefront** regardless of region; render non-USD prices from your own pricing source behind a `#if DEBUG` hook. `deliver` uploads app-level assets only — **per-IAP review screenshots and the 1024² promo are uploaded by hand** in App Store Connect.

### 4 & 5. Beta + Release

- `fastlane ios beta` → syncs certs, bumps build, builds with `gym`, uploads to TestFlight via `pilot`. External testers: a `beta_external` lane with `distribute_external: true` + `groups`.
- `fastlane ios release` → submits the tested TestFlight build for review. A `release_full` variant builds a fresh binary + bumps version + submits in one pass.

## CI deployment (the Windows path)

Non-interactive auth needs an **App Store Connect API key**, not an Apple ID (which forces interactive 2FA):

```ruby
api_key = app_store_connect_api_key(
  key_id:    ENV["APP_STORE_CONNECT_API_KEY_KEY_ID"],
  issuer_id: ENV["APP_STORE_CONNECT_API_KEY_ISSUER_ID"],
  key:       ENV["APP_STORE_CONNECT_API_KEY_KEY"],   # the .p8 contents, base64
  is_key_content_base64: true
)
pilot(api_key: api_key)
```

- **GitHub Actions** (`runs-on: macos-latest`): set `MATCH_PASSWORD`, `MATCH_GIT_URL`, and the API-key vars as secrets; run `fastlane ios certificates` (= `setup_ci` + `match readonly`) then `fastlane ios beta`.
- **Xcode Cloud**: add `ci_scripts/ci_post_clone.sh` (installs Homebrew + Fastlane) and `ci_post_xcodebuild.sh` (runs the lane matching the workflow name `Beta`/`Release`); add the API-key + `MATCH_PASSWORD` env vars as **Secret** in the workflow.

## Key environment variables

| Variable | Purpose |
|---|---|
| `MATCH_PASSWORD`, `MATCH_GIT_URL` | Decrypt + locate the Match certs repo |
| `APP_STORE_CONNECT_API_KEY_KEY_ID` / `_ISSUER_ID` / `_KEY` | Non-interactive ASC auth (preferred for CI) |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | App-specific password fallback for local Apple-ID auth |

## Full detail

This is a distilled reference. The full per-command guides (exhaustive troubleshooting tables, the complete Snapfile/Matchfile templates, every lane variant) live in the pinned upstream repo — see `NOTICE.md` for the source + commit.
