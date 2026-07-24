# Platform Verification

How to get RENDERED proof that a mobile screen actually looks and behaves right on a device — tactile's analogue of impeccable's cross-browser verification, retargeted to iOS and Android frames. This is the concrete procedure that [craft.md](craft.md) Step 4b runs, immediately after the deterministic audit ([audit-rules.md](audit-rules.md), Step 4a).

A grep sheet and a glance at `expo start` are blind to how a screen *renders*. Verification means a screenshot from a real frame, on the platforms your parity policy demands, on a build that renders the way production renders.

---

## The single most important principle: dev ≠ release

**Blur, shadow/elevation, font fallbacks, and remote-image ATS rules only render *truly* in a release build.** This is PITFALLS #15, and it is the principle this whole page exists to enforce. "It looked fine in `expo start`" is not verification — dev-mode rendering diverges from release, especially on Android, in exactly the four areas most likely to be the thing you just changed:

- **BlurView intensity** — release renders the real native blur (`UIVisualEffectView` on iOS; the Dimezis BlurView library on Android, and only when `blurMethod` is set — default `'none'`); dev sometimes shows a flat gray panel. A glass card ([AR-T25](audit-rules.md#e--platform-fidelity--rn-translation)) can only be confirmed in release.
- **Shadow / elevation** — release applies Android `elevation` correctly; dev sometimes drops it, so [AR-T20](audit-rules.md#e--platform-fidelity--rn-translation) (shadow-without-elevation) hides in dev.
- **Font fallbacks** — release fails *harder* if a face isn't bundled; a font that silently falls back to system in dev exposes the gap only in the build.
- **Remote images** — release respects ATS (iOS HTTPS-only) and Android cleartext rules; an image that loads in dev can vanish in release (PITFALLS #13).

**The rule:** if you changed a **blur intensity, a shadow/elevation, a font weight, or an image source**, you verify on a **release-style build** — not `expo start`. The dev-server check answers "does the layout work?"; the release check answers "does it actually look right?" Both are required.

---

## The tooling ladder

Reach for the lightest tool that gives real rendered proof for the question at hand.

### 1. mobile MCP (`mcp__mobile__*`) — the primary device tool

Drive a real simulator/emulator: list devices, launch the app, screenshot, tap, read elements. This is the default for "show me the screen on a device frame."

- `mcp__mobile__mobile_list_available_devices` → pick the simulator/emulator
- `mcp__mobile__mobile_launch_app` → bring the app up
- `mcp__mobile__mobile_take_screenshot` / `mcp__mobile__mobile_save_screenshot` → the rendered frame (the actual proof)
- `mcp__mobile__mobile_list_elements_on_screen` → confirm structure and labels (also a fast a11y check)
- `mcp__mobile__mobile_click_on_screen_at_coordinates` / `mobile_swipe_on_screen` → tap a control or pull a sheet, then re-screenshot to confirm the resulting state

Use it to confirm touch-target geometry by *tapping* (not measuring source), to screenshot each edge-case state from [state-patterns.md](state-patterns.md), and to walk press feedback.

### 2. Browser preview (`mcp__Claude_Browser__*`) — web-target / quick layout

For the **web target** of an Expo app, or a fast layout/spacing sanity check before booting a simulator: `preview_start` → `computer` (`action:"screenshot"`). It is *not* a substitute for a device frame — `BlurView` is a no-op on web, shadows differ, and platform fonts fall back — so never confirm a blur/shadow/native-font rule here. Layout rhythm and copy presence, yes; native rendering fidelity, no.

### 3. e2e-testing (SK-027) / Maestro — multi-step flows

When verification spans more than one screen — onboarding → permission prime → first action, or a form submit → success → list reconciliation — drive it with the **e2e-testing skill (SK-027)**, which runs **Maestro** across platforms with natural-language assertions ("tap Allow, see the empty state replaced by one card"). Use it for the flows that a single screenshot can't prove, and to assert optimistic-UI reconciliation actually lands.

---

## Capture BOTH iOS and Android when the policy is parity

If the brief's platform-parity policy is **strict parity**, every verified screen needs **both** an iOS and an Android frame, side by side. This is where the divergences the audit only *harvested* get confirmed:

- shadow vs elevation (AR-T20) — Android elevation is a fixed black drop shadow and can't be tinted (AR-T21)
- platform-asymmetric blur (AR-T26) — Android needs a higher `intensity`; confirm the glass doesn't read flat
- ripple vs opacity press feedback, SF Symbols vs Material Symbols, system font metrics

For iOS-first or Android-first policies, lead with the primary platform but still spot-check the other before claiming done — an iOS-tuned screen shipped to Android unchecked is the classic regression.

---

## design-check (SK-127): pre-flight the visual diff

When there's a **Figma / Stitch / screenshot reference**, run **design-check (SK-127)** *before* writing code — it diffs the current build against the reference and produces the concrete gap list (spacing, color, type, missing elements, dark-mode breaks) you get signed off on first. At the end of craft, re-screenshot and diff again to confirm the gaps closed. This front-loads the "match the design" work instead of discovering the mismatch at the end.

## ship-verify (SK-128): confirm the actual artifact

Never claim "shipped" on an `UP-TO-DATE` message or an exit-zero. When the task is a build or deploy, run **ship-verify (SK-128)**: confirm the **actual APK / IPA exists, has a fresh mtime, and is the correct variant** (release, right flavor, right version). A screenshot proves the screen renders; ship-verify proves the binary the user will install is the one you just built. Both are required before "done."

---

## Which audit rules get confirmed here

The [audit-rules.md](audit-rules.md) **visual-judgment subset** is the part the grep sheet can only *harvest* — it is confirmed here, on a rendered frame:

- **AR-T01** sub-min-touch-target — measure/tap the actual box on the frame (mobile MCP tap).
- **AR-T04** missing-a11y-on-interactive — per element; confirm with VoiceOver/TalkBack and `mobile_list_elements_on_screen`.
- **AR-T09** gray-on-color — confirm the background is genuinely chromatic before flagging.
- **AR-T12** cramped-card-padding — confirm the element is a real card, not a flush list row.
- **AR-T25** incomplete-glass-card — confirm all three glass layers render (this is the one that *only* shows truly in release).
- **AR-T28** no-safe-area-handling — confirm content clears the notch / Dynamic Island and the home indicator on the frame.

(AR-T16/T17 size-context and AR-T19 numberOfLines are also eyeball-confirmed here.) A clean grep sheet plus these visual confirmations on a release-style frame, on every platform the parity policy requires, is what "verified" means in tactile — nothing less.
