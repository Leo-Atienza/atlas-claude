---
name: ui-design-stack
description: "Complete UI/UX design system for web and mobile. Part A: UX Strategy — user flows, information architecture, Nielsen's heuristics, onboarding, empty states, error recovery, micro-copy, conversion optimization, UX audits. Part B: Design Intelligence — 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, 25 chart types across 10 stacks. BM25-searchable database with --design-system generation. Covers the full 6-layer UI Design Stack: (1) UX Strategy, (2) Design Intelligence, (3) Implementation, (4) Framework, (5) Theming/Brand, (6) QA/Review."
---

# UI Design Stack — Unified UX Strategy + Design Intelligence

This skill combines two complementary layers into one:

- **Part A: UX Strategy** — the *thinking* layer: user flows, IA, heuristics, micro-copy, onboarding, conversion, error recovery
- **Part B: Design Intelligence** — the *visual* layer: styles, colors, fonts, industry rules, 200+ implementation rules, searchable database

**6-Layer UI Design Stack** (defined in CLAUDE.md) — this skill covers Layers 1-2. The full stack activates progressively:
1. **UX Strategy** (this skill, Part A) → flows, IA, heuristics, copy, conversion
2. **Design Intelligence** (this skill, Part B) → styles, colors, fonts, industry rules, design system generation
3. **Implementation** (`frontend-design`) → animation architecture, CSS, GPU compositing, effects recipes
4. **Framework** (`react-expert`, `vue-expert`, `flutter-expert`, etc.) → component patterns, state, navigation
5. **Theming/Brand** (`theme-factory` / `brand-guidelines`) → when brand/theme is specified
6. **QA/Review** (this skill's audits + checklists) → pre-delivery validation

## When to Apply

**Must use:** Designing new pages, creating/refactoring UI components, choosing colors/typography/styles, reviewing UI for UX/accessibility, planning user flows, writing UI copy, navigation restructuring, onboarding flows, conversion optimization, usability evaluation.

**Skip:** Pure backend logic, API/database design, performance optimization unrelated to interface, infrastructure/DevOps, non-visual scripts.

**Decision criteria:** If the task will change how a feature **looks, feels, moves, is interacted with, or is navigated**, this skill should be used.

---

# PART A: UX STRATEGY

---

## A1. Nielsen's 10 Usability Heuristics

Apply as evaluation framework when reviewing any UI. Score each 0-4 (0=no issue, 4=catastrophe).

| # | Heuristic | What to Check | Common Violations |
|---|-----------|---------------|-------------------|
| 1 | **Visibility of system status** | Loading indicators, progress bars, save confirmations, real-time feedback | Silent form submissions, no upload progress, stale data without refresh indicator |
| 2 | **Match real world** | Natural language, familiar icons, logical ordering, domain-appropriate metaphors | Developer jargon in user-facing copy, abstract icons without labels, alphabetical when frequency-based is better |
| 3 | **User control & freedom** | Undo/redo, cancel buttons, back navigation, dismiss modals, exit multi-step flows | No undo on delete, can't cancel mid-upload, trapped in wizard with no back |
| 4 | **Consistency & standards** | Same action = same result everywhere, platform conventions, internal consistency | Login vs Sign In vs Log In on same site, custom scrollbar breaking expectations, non-standard icons |
| 5 | **Error prevention** | Confirmation dialogs for destructive actions, constraints on inputs, smart defaults | Delete without confirm, free-text where dropdown works, no autocomplete on address fields |
| 6 | **Recognition over recall** | Visible options, recent items, search suggestions, contextual help | Hidden features behind gestures, empty search with no suggestions, settings with no descriptions |
| 7 | **Flexibility & efficiency** | Keyboard shortcuts, bulk actions, customization, expert shortcuts alongside novice paths | No keyboard nav, can't select multiple items, no way to skip onboarding on return |
| 8 | **Aesthetic & minimalist design** | Every element serves a purpose, no decorative clutter, clear visual hierarchy | Info-dense dashboards with no hierarchy, decorative animations blocking content, competing CTAs |
| 9 | **Help users recognize & recover from errors** | Clear error messages with cause + fix, inline validation, recovery paths | "Error 500", "Invalid input" with no specifics, errors only at page top |
| 10 | **Help & documentation** | Contextual tooltips, onboarding tours, searchable docs, progressive disclosure of complexity | No help for complex features, help docs that require separate login, tooltips on obvious elements |

### Quick Heuristic Audit Template

```
## Heuristic Evaluation: [Feature/Page Name]
Date: [date] | Evaluator: Claude

| Heuristic | Score (0-4) | Finding | Recommendation |
|-----------|-------------|---------|----------------|
| 1. System status | | | |
| 2. Real world match | | | |
| 3. User control | | | |
| 4. Consistency | | | |
| 5. Error prevention | | | |
| 6. Recognition > recall | | | |
| 7. Flexibility | | | |
| 8. Minimalist design | | | |
| 9. Error recovery | | | |
| 10. Help & docs | | | |

**Critical issues (score 3-4):**
**Overall assessment:**
**Top 3 recommendations:**
```

---

## A2. User Flow Mapping

### When to Map Flows
- New feature with 3+ steps
- Checkout/payment flows
- Onboarding sequences
- Any flow with conditional branching

### Flow Anatomy
```
[Entry Point] → [Step 1] → [Decision] →  [Happy Path] → [Success State]
                                     ↘ [Error Path] → [Recovery] → [Retry]
                                     ↘ [Abandon Path] → [Save Draft / Exit]
```

### Critical Flow Checklist
- **Every decision point** has at most 2-3 clear options
- **Every error state** has a recovery path (not a dead end)
- **Every long flow** (4+ steps) shows progress and allows save/resume
- **Every flow** has a way to go back without losing data
- **Entry points** are reachable from multiple contexts (deep linking, notifications, search)
- **Success states** suggest a logical next action (not just "Done")
- **Abandon points** are identified — where do users drop off and why?

### Flow Types by Pattern

| Pattern | When | Structure |
|---------|------|-----------|
| **Linear** | Simple setup, checkout | Step 1 → 2 → 3 → Done |
| **Hub & spoke** | Dashboard, settings | Central hub → feature → back to hub |
| **Wizard** | Complex multi-step (onboarding, forms) | Steps with progress bar, back/next, save draft |
| **Branching** | Conditional flows (user type, plan tier) | Decision point → different paths → converge at end |
| **Progressive** | Feature discovery | Core → unlock advanced → expert shortcuts |

---

## A3. Information Architecture

### Content Organization Principles
- **Group by user mental model**, not by org structure (users think in tasks, not departments)
- **7±2 rule**: Top-level navigation should have 5-7 items maximum
- **3-click rule is a myth** — depth is fine IF each click is confident and clear. Reduce *uncertainty*, not clicks
- **Label with user language** — test labels with real users or use competitor conventions

### Navigation Patterns by Product Type

| Product Type | Primary Nav | Secondary Nav | Search |
|-------------|-------------|---------------|--------|
| **SaaS dashboard** | Left sidebar (collapsible) | Top bar (user/settings) | Command palette (Cmd+K) |
| **E-commerce** | Top horizontal + mega menu | Breadcrumbs + filters sidebar | Prominent search bar with autocomplete |
| **Content/blog** | Top horizontal (sparse) | Category tags, related content | Search with filters |
| **Mobile app** | Bottom tab bar (≤5 items) | Stack navigation + drawer for settings | Search in dedicated tab or top bar |
| **Admin panel** | Left sidebar (grouped sections) | Breadcrumbs + contextual actions | Global search + filters per table |
| **Landing page** | Top right (minimal: Features, Pricing, Login) | Footer (legal, resources, social) | Not needed |
| **Documentation** | Left sidebar (tree structure) | On-page TOC (right sidebar) | Full-text search with highlighting |

### Hierarchy Signals (strongest → weakest)
1. **Position** — top-left gets first attention (F-pattern for text, Z-pattern for marketing)
2. **Size** — larger = more important
3. **Color/contrast** — high contrast draws the eye
4. **Whitespace** — isolated elements feel more important
5. **Typography weight** — bold > regular > light
6. **Motion** — subtle animation draws attention (use sparingly)

> For platform-specific navigation implementation rules (iOS tab bar, Android top app bar, bottom nav limits, gesture nav), see Part B §9.

---

## A4. Onboarding Patterns

### Choose by Product Complexity

| Pattern | Best For | Engagement | Implementation Cost |
|---------|----------|-----------|-------------------|
| **Empty state with action** | Simple tools, single-purpose apps | High — user learns by doing | Low |
| **Tooltip walkthrough** | Medium complexity, familiar patterns | Medium — guided but dismissible | Medium |
| **Progressive disclosure** | Complex products, power users | High — grows with the user | Medium |
| **Setup wizard** | Products requiring configuration | Medium — front-loads effort | High |
| **Sample data/templates** | Creative tools, dashboards | High — user sees value immediately | Medium |
| **Video/interactive demo** | Novel concepts, hard to explain | Low-Medium — passive | Low |

### Onboarding Rules
- **Time to value < 60 seconds** — user must experience core benefit before asking for commitment
- **Allow skip** — always. Power users and return visitors hate forced tours
- **One concept per step** — never explain two things at once
- **Show, don't tell** — interactive > tooltip > modal > video
- **Persist progress** — if user leaves mid-onboarding, resume where they left off
- **Measure completion** — track where users drop off in the onboarding funnel

### Empty States (Critical UX Moment)
Empty states are the first thing users see. They must:
1. **Explain what this area is for** (not "No data" — say "Your projects will appear here")
2. **Guide the primary action** ("Create your first project" with prominent CTA)
3. **Set expectations** (show what it will look like with data — illustration, sample, or screenshot)
4. **Feel intentional** — not broken. An empty state should never look like an error

---

## A5. UX Writing / Micro-Copy

### Principles
- **Clarity > cleverness** — "Delete account" not "Say goodbye"
- **Front-load the verb** — "Save changes" not "Changes will be saved"
- **Use the user's language** — match their vocabulary, not internal terminology
- **Be specific** — "Photo must be under 5MB" not "File too large"
- **Active voice** — "You deleted 3 files" not "3 files were deleted"

### Copy Patterns by Context

| Context | Pattern | Example |
|---------|---------|---------|
| **Button/CTA** | Verb + object (2-4 words) | "Create account", "Save draft", "Send message" |
| **Error message** | What happened + how to fix | "Email already registered. Try signing in or use a different email." |
| **Empty state** | What goes here + how to start | "No messages yet. Start a conversation to see them here." |
| **Confirmation** | What will happen + can you undo | "Delete this project? This will remove all files and cannot be undone." |
| **Success** | What happened + what's next | "Payment received! You'll get a confirmation email shortly." |
| **Loading** | What's happening (if >2s) | "Setting up your workspace..." not just a spinner |
| **Tooltip** | One sentence, no period | "Keyboard shortcut: Ctrl+K" |
| **Placeholder** | Example format, not label | "jane@example.com" not "Enter your email" |
| **Permission request** | Why you need it + what changes | "Allow notifications to get updates when someone replies to you" |

### Words to Avoid

| Instead of | Use |
|-----------|-----|
| "Invalid" | Specific issue: "Email needs an @ symbol" |
| "Error occurred" | What happened: "Couldn't save — check your connection" |
| "Are you sure?" | Specific consequence: "Delete all 12 photos?" |
| "Click here" | Descriptive link: "View pricing details" |
| "N/A", "null", "undefined" | Human language: "Not set", "None yet" |
| "Successfully" (redundant) | Just state what happened: "File uploaded" |
| "Please" (overuse) | Direct: "Enter your name" (save "please" for errors/apologies) |

---

## A6. Conversion & Engagement Patterns

### Reducing Friction
- **Every form field you add reduces completion by ~5-10%** — only ask what you need *right now*
- **Social proof near decision points** — reviews near "Buy", testimonials near "Sign up"
- **Default to the recommended option** — pre-select the most common choice
- **Show value before commitment** — free trial > credit card wall, preview > login wall
- **Reduce perceived effort** — "Takes 30 seconds" near signup, progress bars on forms
- **Urgency must be real** — fake countdown timers erode trust permanently

### CTA Hierarchy (one primary per screen)
1. **Primary CTA**: High contrast, prominent position, verb-first label. One per screen
2. **Secondary CTA**: Outlined or ghost button, supports the primary ("Learn more" next to "Get started")
3. **Tertiary action**: Text link, low visual weight ("Skip for now", "Remind me later")

### Trust Signals by Context

| Context | Trust Signals |
|---------|--------------|
| **E-commerce** | Secure checkout badge, return policy, real reviews with photos, "X people bought today" |
| **SaaS signup** | "No credit card required", company logos, specific metrics ("Used by 10,000 teams") |
| **Content** | Author credentials, publish date, sources cited, reading time |
| **Financial** | Security certifications, encryption notice, regulatory compliance, real phone number |
| **Healthcare** | HIPAA badge, doctor credentials, peer-reviewed sources, privacy policy prominent |

---

## A7. Error Recovery Patterns

### Error Severity → Response

| Severity | Example | Pattern |
|----------|---------|---------|
| **Preventable** | Wrong email format | Inline validation on blur, don't wait for submit |
| **Recoverable** | Network timeout | Auto-retry with manual retry button, preserve user input |
| **Destructive** | Delete account | Confirmation dialog + typing confirmation + cool-down period |
| **System** | Server error 500 | Friendly message + auto-report + estimated recovery time if known |
| **Partial** | 3 of 5 uploads failed | Show what succeeded, let user retry only the failures |

### Recovery Rules
- **Never lose user input** — if a form submit fails, all fields must retain their values
- **Offer alternatives** — if search returns nothing, suggest related terms or popular items
- **Degrade gracefully** — if a feature is down, show the rest of the app, not a full error page
- **Log and learn** — every error the user sees should be trackable and reducible over time

> For field-level error implementation (placement, aria-live regions, focus management, inline validation timing), see Part B §8.

---

## A8. Accessibility as UX (Strategic Layer)

Beyond WCAG compliance checkboxes — accessibility IS good UX:

| Accessibility Practice | UX Benefit for ALL Users |
|----------------------|--------------------------|
| Keyboard navigation | Power users, broken trackpad, TV remote, game controller |
| High contrast text | Outdoor/sunlight use, aging eyes, dirty screens |
| Captions/transcripts | Noisy environments, non-native speakers, quiet offices |
| Reduced motion option | Motion sickness, low battery, focus mode |
| Clear error messages | Everyone benefits from knowing what went wrong |
| Logical heading structure | Screen readers AND SEO AND scannable content |
| Touch target sizing (44px+) | Fat fingers, shaky hands, one-handed use, gloves |
| Focus management | Tab users, voice control, assistive tech |

### Inclusive Design Questions (ask before building)
1. Can a user complete this flow using only a keyboard?
2. Can a user understand this page if all images fail to load?
3. Can a user complete this task with one hand on mobile?
4. Does this work if the user's font size is set to 200%?
5. Is the error message helpful if you can't see the red highlight?

---

# PART B: DESIGN INTELLIGENCE

---

## Rule Categories by Priority

*Follow priority 1→10 to decide which rule category to focus on first; use `--domain <Domain>` to query details when needed.*

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44x44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150-300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav <=5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

> **Cross-references to Part A:** §8 (Forms) → see A5 for error message tone/copy patterns, A7 for error severity classification. §9 (Navigation) → see A3 for product-type navigation selection. For holistic UX audits → see A1 (Nielsen's Heuristics) and the UX Audit Checklist below. For multi-step flow validation → see A2 (User Flow Mapping).

## Quick Reference — 200+ Implementation Rules

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text (large text 3:1); Material Design
- `focus-states` - Visible focus rings on interactive elements (2-4px; Apple HIG, MD)
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons; accessibilityLabel in native (Apple HIG)
- `keyboard-nav` - Tab order matches visual order; full keyboard support (Apple HIG)
- `form-labels` - Use label with for attribute
- `skip-links` - Skip to main content for keyboard users
- `heading-hierarchy` - Sequential h1→h6, no level skip
- `color-not-only` - Don't convey info by color alone (add icon/text)
- `dynamic-type` - Support system text scaling; avoid truncation as text grows (Apple Dynamic Type, MD)
- `reduced-motion` - Respect prefers-reduced-motion; reduce/disable animations when requested (Apple Reduced Motion API, MD)
- `voiceover-sr` - Meaningful accessibilityLabel/accessibilityHint; logical reading order for VoiceOver/screen readers (Apple HIG, MD)
- `escape-routes` - Provide cancel/back in modals and multi-step flows (Apple HIG)
- `keyboard-shortcuts` - Preserve system and a11y shortcuts; offer keyboard alternatives for drag-and-drop (Apple HIG)

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Min 44x44pt (Apple) / 48x48dp (Material); extend hit area beyond visual bounds if needed
- `touch-spacing` - Minimum 8px/8dp gap between touch targets (Apple HIG, MD)
- `hover-vs-tap` - Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` - Disable button during async operations; show spinner or progress
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements (Web)
- `gesture-conflicts` - Avoid horizontal swipe on main content; prefer vertical scroll
- `tap-delay` - Use touch-action: manipulation to reduce 300ms delay (Web)
- `standard-gestures` - Use platform standard gestures consistently; don't redefine (e.g. swipe-back, pinch-zoom) (Apple HIG)
- `system-gestures` - Don't block system gestures (Control Center, back swipe, etc.) (Apple HIG)
- `press-feedback` - Visual feedback on press (ripple/highlight; MD state layers)
- `haptic-feedback` - Use haptic for confirmations and important actions; avoid overuse (Apple HIG)
- `gesture-alternative` - Don't rely on gesture-only interactions; always provide visible controls for critical actions
- `safe-area-awareness` - Keep primary touch targets away from notch, Dynamic Island, gesture bar and screen edges
- `no-precision-required` - Avoid requiring pixel-perfect taps on small icons or thin edges
- `swipe-clarity` - Swipe actions must show clear affordance or hint (chevron, label, tutorial)
- `drag-threshold` - Use a movement threshold before starting drag to avoid accidental drags

### 3. Performance (HIGH)

- `image-optimization` - Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- `image-dimension` - Declare width/height or use aspect-ratio to prevent layout shift (Core Web Vitals: CLS)
- `font-loading` - Use font-display: swap/optional to avoid invisible text (FOIT); reserve space to reduce layout shift (MD)
- `font-preload` - Preload only critical fonts; avoid overusing preload on every variant
- `critical-css` - Prioritize above-the-fold CSS (inline critical CSS or early-loaded stylesheet)
- `lazy-loading` - Lazy load non-hero components via dynamic import / route-level splitting
- `bundle-splitting` - Split code by route/feature (React Suspense / Next.js dynamic) to reduce initial load and TTI
- `third-party-scripts` - Load third-party scripts async/defer; audit and remove unnecessary ones (MD)
- `reduce-reflows` - Avoid frequent layout reads/writes; batch DOM reads then writes
- `content-jumping` - Reserve space for async content to avoid layout jumps (Core Web Vitals: CLS)
- `lazy-load-below-fold` - Use loading="lazy" for below-the-fold images and heavy media
- `virtualize-lists` - Virtualize lists with 50+ items to improve memory efficiency and scroll performance
- `main-thread-budget` - Keep per-frame work under ~16ms for 60fps; move heavy tasks off main thread (HIG, MD)
- `progressive-loading` - Use skeleton screens / shimmer instead of long blocking spinners for >1s operations (Apple HIG)
- `input-latency` - Keep input latency under ~100ms for taps/scrolls (Material responsiveness standard)
- `tap-feedback-speed` - Provide visual feedback within 100ms of tap (Apple HIG)
- `debounce-throttle` - Use debounce/throttle for high-frequency events (scroll, resize, input)
- `offline-support` - Provide offline state messaging and basic fallback (PWA / mobile)
- `network-fallback` - Offer degraded modes for slow networks (lower-res images, fewer animations)

### 4. Style Selection (HIGH)

- `style-match` - Match style to product type (use `--design-system` for recommendations)
- `consistency` - Use same style across all pages
- `no-emoji-icons` - Use SVG icons (Heroicons, Lucide), not emojis
- `color-palette-from-product` - Choose palette from product/industry (search `--domain color`)
- `effects-match-style` - Shadows, blur, radius aligned with chosen style (glass / flat / clay etc.)
- `platform-adaptive` - Respect platform idioms (iOS HIG vs Material): navigation, controls, typography, motion
- `state-clarity` - Make hover/pressed/disabled states visually distinct while staying on-style (Material state layers)
- `elevation-consistent` - Use a consistent elevation/shadow scale for cards, sheets, modals; avoid random shadow values
- `dark-mode-pairing` - Design light/dark variants together to keep brand, contrast, and style consistent
- `icon-style-consistent` - Use one icon set/visual language (stroke width, corner radius) across the product
- `system-controls` - Prefer native/system controls over fully custom ones; only customize when branding requires it (Apple HIG)
- `blur-purpose` - Use blur to indicate background dismissal (modals, sheets), not as decoration (Apple HIG)
- `primary-action` - Each screen should have only one primary CTA; secondary actions visually subordinate (Apple HIG)

### 5. Layout & Responsive (HIGH)

- `viewport-meta` - width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` - Design mobile-first, then scale up to tablet and desktop
- `breakpoint-consistency` - Use systematic breakpoints (e.g. 375 / 768 / 1024 / 1440)
- `readable-font-size` - Minimum 16px body text on mobile (avoids iOS auto-zoom)
- `line-length-control` - Mobile 35-60 chars per line; desktop 60-75 chars
- `horizontal-scroll` - No horizontal scroll on mobile; ensure content fits viewport width
- `spacing-scale` - Use 4pt/8dp incremental spacing system (Material Design)
- `touch-density` - Keep component spacing comfortable for touch: not cramped, not causing mis-taps
- `container-width` - Consistent max-width on desktop (max-w-6xl / 7xl)
- `z-index-management` - Define layered z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- `fixed-element-offset` - Fixed navbar/bottom bar must reserve safe padding for underlying content
- `scroll-behavior` - Avoid nested scroll regions that interfere with the main scroll experience
- `viewport-units` - Prefer min-h-dvh over 100vh on mobile
- `orientation-support` - Keep layout readable and operable in landscape mode
- `content-priority` - Show core content first on mobile; fold or hide secondary content
- `visual-hierarchy` - Establish hierarchy via size, spacing, contrast — not color alone

### 6. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `line-length` - Limit to 65-75 characters per line
- `font-pairing` - Match heading/body font personalities
- `font-scale` - Consistent type scale (e.g. 12 14 16 18 24 32)
- `contrast-readability` - Darker text on light backgrounds (e.g. slate-900 on white)
- `text-styles-system` - Use platform type system: iOS 11 Dynamic Type styles / Material 5 type roles (display, headline, title, body, label) (HIG, MD)
- `weight-hierarchy` - Use font-weight to reinforce hierarchy: Bold headings (600-700), Regular body (400), Medium labels (500) (MD)
- `color-semantic` - Define semantic color tokens (primary, secondary, error, surface, on-surface) not raw hex in components (Material color system)
- `color-dark-mode` - Dark mode uses desaturated / lighter tonal variants, not inverted colors; test contrast separately (HIG, MD)
- `color-accessible-pairs` - Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA); use tools to verify (WCAG, MD)
- `color-not-decorative-only` - Functional color (error red, success green) must include icon/text; avoid color-only meaning (HIG, MD)
- `truncation-strategy` - Prefer wrapping over truncation; when truncating use ellipsis and provide full text via tooltip/expand (Apple HIG)
- `letter-spacing` - Respect default letter-spacing per platform; avoid tight tracking on body text (HIG, MD)
- `number-tabular` - Use tabular/monospaced figures for data columns, prices, and timers to prevent layout shift
- `whitespace-balance` - Use whitespace intentionally to group related items and separate sections; avoid visual clutter (Apple HIG)

### 7. Animation (MEDIUM)

- `duration-timing` - Use 150-300ms for micro-interactions; complex transitions <=400ms; avoid >500ms (MD)
- `transform-performance` - Use transform/opacity only; avoid animating width/height/top/left
- `loading-states` - Show skeleton or progress indicator when loading exceeds 300ms
- `excessive-motion` - Animate 1-2 key elements per view max
- `easing` - Use ease-out for entering, ease-in for exiting; avoid linear for UI transitions
- `motion-meaning` - Every animation must express a cause-effect relationship, not just be decorative (Apple HIG)
- `state-transition` - State changes (hover / active / expanded / collapsed / modal) should animate smoothly, not snap
- `continuity` - Page/screen transitions should maintain spatial continuity (shared element, directional slide) (Apple HIG)
- `parallax-subtle` - Use parallax sparingly; must respect reduced-motion and not cause disorientation (Apple HIG)
- `spring-physics` - Prefer spring/physics-based curves over linear or cubic-bezier for natural feel (Apple HIG fluid animations)
- `exit-faster-than-enter` - Exit animations shorter than enter (~60-70% of enter duration) to feel responsive (MD motion)
- `stagger-sequence` - Stagger list/grid item entrance by 30-50ms per item; avoid all-at-once or too-slow reveals (MD)
- `shared-element-transition` - Use shared element / hero transitions for visual continuity between screens (MD, HIG)
- `interruptible` - Animations must be interruptible; user tap/gesture cancels in-progress animation immediately (Apple HIG)
- `no-blocking-animation` - Never block user input during an animation; UI must stay interactive (Apple HIG)
- `fade-crossfade` - Use crossfade for content replacement within the same container (MD)
- `scale-feedback` - Subtle scale (0.95-1.05) on press for tappable cards/buttons; restore on release (HIG, MD)
- `gesture-feedback` - Drag, swipe, and pinch must provide real-time visual response tracking the finger (MD Motion)
- `hierarchy-motion` - Use translate/scale direction to express hierarchy: enter from below = deeper, exit upward = back (MD)
- `motion-consistency` - Unify duration/easing tokens globally; all animations share the same rhythm and feel
- `opacity-threshold` - Fading elements should not linger below opacity 0.2; either fade fully or remain visible
- `modal-motion` - Modals/sheets should animate from their trigger source (scale+fade or slide-in) for spatial context (HIG, MD)
- `navigation-direction` - Forward navigation animates left/up; backward animates right/down — keep direction logically consistent (HIG)
- `layout-shift-avoid` - Animations must not cause layout reflow or CLS; use transform for position changes

### 8. Forms & Feedback (MEDIUM)

- `input-labels` - Visible label per input (not placeholder-only)
- `error-placement` - Show error below the related field
- `submit-feedback` - Loading then success/error state on submit
- `required-indicators` - Mark required fields (e.g. asterisk)
- `empty-states` - Helpful message and action when no content
- `toast-dismiss` - Auto-dismiss toasts in 3-5s
- `confirmation-dialogs` - Confirm before destructive actions
- `input-helper-text` - Provide persistent helper text below complex inputs, not just placeholder (Material Design)
- `disabled-states` - Disabled elements use reduced opacity (0.38-0.5) + cursor change + semantic attribute (MD)
- `progressive-disclosure` - Reveal complex options progressively; don't overwhelm users upfront (Apple HIG)
- `inline-validation` - Validate on blur (not keystroke); show error only after user finishes input (MD)
- `input-type-keyboard` - Use semantic input types (email, tel, number) to trigger the correct mobile keyboard (HIG, MD)
- `password-toggle` - Provide show/hide toggle for password fields (MD)
- `autofill-support` - Use autocomplete / textContentType attributes so the system can autofill (HIG, MD)
- `undo-support` - Allow undo for destructive or bulk actions (e.g. "Undo delete" toast) (Apple HIG)
- `success-feedback` - Confirm completed actions with brief visual feedback (checkmark, toast, color flash) (MD)
- `error-recovery` - Error messages must include a clear recovery path (retry, edit, help link) (HIG, MD)
- `multi-step-progress` - Multi-step flows show step indicator or progress bar; allow back navigation (MD)
- `form-autosave` - Long forms should auto-save drafts to prevent data loss on accidental dismissal (Apple HIG)
- `sheet-dismiss-confirm` - Confirm before dismissing a sheet/modal with unsaved changes (Apple HIG)
- `error-clarity` - Error messages must state cause + how to fix (not just "Invalid input") (HIG, MD)
- `field-grouping` - Group related fields logically (fieldset/legend or visual grouping) (MD)
- `read-only-distinction` - Read-only state should be visually and semantically different from disabled (MD)
- `focus-management` - After submit error, auto-focus the first invalid field (WCAG, MD)
- `error-summary` - For multiple errors, show summary at top with anchor links to each field (WCAG)
- `touch-friendly-input` - Mobile input height >=44px to meet touch target requirements (Apple HIG)
- `destructive-emphasis` - Destructive actions use semantic danger color (red) and are visually separated from primary actions (HIG, MD)
- `toast-accessibility` - Toasts must not steal focus; use aria-live="polite" for screen reader announcement (WCAG)
- `aria-live-errors` - Form errors use aria-live region or role="alert" to notify screen readers (WCAG)
- `contrast-feedback` - Error and success state colors must meet 4.5:1 contrast ratio (WCAG, MD)
- `timeout-feedback` - Request timeout must show clear feedback with retry option (MD)
- `toast-stacking` - Multiple toasts must stack visually (collapsed with count or expanded list); limit visible toasts to 3-5 max (Sonner pattern)
- `toast-promise` - Async operations should use loading→success→error toast flow (e.g. toast.promise()) instead of separate loading spinners (Sonner)
- `toast-pause-resume` - Toast auto-dismiss timer must pause on hover/focus and resume with remaining time, not restart (Sonner)
- `toast-swipe-dismiss` - Mobile toasts must support swipe-to-dismiss gesture with configurable direction (Sonner)
- `toast-channels` - Use scoped toast channels (e.g. global alerts vs. panel-specific) when UI has multiple notification contexts (Sonner toasterId)
- `toast-reduced-motion` - Toast animations must respect prefers-reduced-motion: suppress keyframes, use instant opacity transitions (WCAG, Sonner)
- `toast-rich-actions` - Toasts with action buttons (Undo, Retry, View) must have clear tap targets and not auto-dismiss while user interacts

### 9. Navigation Patterns (HIGH)

- `bottom-nav-limit` - Bottom navigation max 5 items; use labels with icons (Material Design)
- `drawer-usage` - Use drawer/sidebar for secondary navigation, not primary actions (Material Design)
- `back-behavior` - Back navigation must be predictable and consistent; preserve scroll/state (Apple HIG, MD)
- `deep-linking` - All key screens must be reachable via deep link / URL for sharing and notifications (Apple HIG, MD)
- `tab-bar-ios` - iOS: use bottom Tab Bar for top-level navigation (Apple HIG)
- `top-app-bar-android` - Android: use Top App Bar with navigation icon for primary structure (Material Design)
- `nav-label-icon` - Navigation items must have both icon and text label; icon-only nav harms discoverability (MD)
- `nav-state-active` - Current location must be visually highlighted (color, weight, indicator) in navigation (HIG, MD)
- `nav-hierarchy` - Primary nav (tabs/bottom bar) vs secondary nav (drawer/settings) must be clearly separated (MD)
- `modal-escape` - Modals and sheets must offer a clear close/dismiss affordance; swipe-down to dismiss on mobile (Apple HIG)
- `search-accessible` - Search must be easily reachable (top bar or tab); provide recent/suggested queries (MD)
- `breadcrumb-web` - Web: use breadcrumbs for 3+ level deep hierarchies to aid orientation (MD)
- `state-preservation` - Navigating back must restore previous scroll position, filter state, and input (HIG, MD)
- `gesture-nav-support` - Support system gesture navigation (iOS swipe-back, Android predictive back) without conflict (HIG, MD)
- `tab-badge` - Use badges on nav items sparingly to indicate unread/pending; clear after user visits (HIG, MD)
- `overflow-menu` - When actions exceed available space, use overflow/more menu instead of cramming (MD)
- `bottom-nav-top-level` - Bottom nav is for top-level screens only; never nest sub-navigation inside it (MD)
- `adaptive-navigation` - Large screens (>=1024px) prefer sidebar; small screens use bottom/top nav (Material Adaptive)
- `back-stack-integrity` - Never silently reset the navigation stack or unexpectedly jump to home (HIG, MD)
- `navigation-consistency` - Navigation placement must stay the same across all pages; don't change by page type
- `avoid-mixed-patterns` - Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- `modal-vs-navigation` - Modals must not be used for primary navigation flows; they break the user's path (HIG)
- `focus-on-route-change` - After page transition, move focus to main content region for screen reader users (WCAG)
- `persistent-nav` - Core navigation must remain reachable from deep pages; don't hide it entirely in sub-flows (HIG, MD)
- `destructive-nav-separation` - Dangerous actions (delete account, logout) must be visually and spatially separated from normal nav items (HIG, MD)
- `empty-nav-state` - When a nav destination is unavailable, explain why instead of silently hiding it (MD)
- `drawer-snap-points` - Bottom sheets/drawers should support multi-stop snap points (e.g. peek, half, full) with fractional or px heights; recalculate on resize (Vaul)
- `drawer-velocity-snap` - Drawer gesture release should use velocity-based navigation: fast flick (>0.4 px/ms) jumps to next snap point, slow drag snaps to nearest (Vaul)
- `drawer-scroll-conflict` - When drawer contains scrollable content, resolve scroll-vs-drag: only initiate drag when content is scrolled to top/edge (Vaul shouldDrag)
- `drawer-rubber-band` - Over-drag past drawer bounds should use logarithmic dampening for native iOS rubber-band feel, not hard stop (Vaul)
- `drawer-nested-stack` - Nested drawers should scale/translate the parent to create a visual card stack; limit nesting to 2 levels (Vaul NestedRoot)
- `drawer-no-drag-zones` - Interactive elements inside drawers (inputs, sliders, maps) must opt out of drag handling via data attribute (Vaul data-vaul-no-drag)
- `drawer-ios-fixed` - On iOS Safari, drawer open must use position:fixed workaround to freeze page without scroll-jump (Vaul usePositionFixed)
- `drawer-handle-a11y` - Drawer drag handle must have 44x44px minimum tap target; mark aria-hidden since Esc/Close button serves a11y dismiss (WCAG 2.5.5, Vaul)

### 10. Charts & Data (LOW)

- `chart-type` - Match chart type to data type (trend → line, comparison → bar, proportion → pie/donut)
- `color-guidance` - Use accessible color palettes; avoid red/green only pairs for colorblind users (WCAG, MD)
- `data-table` - Provide table alternative for accessibility; charts alone are not screen-reader friendly (WCAG)
- `pattern-texture` - Supplement color with patterns, textures, or shapes so data is distinguishable without color (WCAG, MD)
- `legend-visible` - Always show legend; position near the chart, not detached below a scroll fold (MD)
- `tooltip-on-interact` - Provide tooltips/data labels on hover (Web) or tap (mobile) showing exact values (HIG, MD)
- `axis-labels` - Label axes with units and readable scale; avoid truncated or rotated labels on mobile
- `responsive-chart` - Charts must reflow or simplify on small screens (e.g. horizontal bar instead of vertical, fewer ticks)
- `empty-data-state` - Show meaningful empty state when no data exists ("No data yet" + guidance), not a blank chart (MD)
- `loading-chart` - Use skeleton or shimmer placeholder while chart data loads; don't show an empty axis frame
- `animation-optional` - Chart entrance animations must respect prefers-reduced-motion; data should be readable immediately (HIG)
- `large-dataset` - For 1000+ data points, aggregate or sample; provide drill-down for detail instead of rendering all (MD)
- `number-formatting` - Use locale-aware formatting for numbers, dates, currencies on axes and labels (HIG, MD)
- `touch-target-chart` - Interactive chart elements (points, segments) must have >=44pt tap area or expand on touch (Apple HIG)
- `no-pie-overuse` - Avoid pie/donut for >5 categories; switch to bar chart for clarity
- `contrast-data` - Data lines/bars vs background >=3:1; data text labels >=4.5:1 (WCAG)
- `legend-interactive` - Legends should be clickable to toggle series visibility (MD)
- `direct-labeling` - For small datasets, label values directly on the chart to reduce eye travel
- `tooltip-keyboard` - Tooltip content must be keyboard-reachable and not rely on hover alone (WCAG)
- `sortable-table` - Data tables must support sorting with aria-sort indicating current sort state (WCAG)
- `axis-readability` - Axis ticks must not be cramped; maintain readable spacing, auto-skip on small screens
- `data-density` - Limit information density per chart to avoid cognitive overload; split into multiple charts if needed
- `trend-emphasis` - Emphasize data trends over decoration; avoid heavy gradients/shadows that obscure the data
- `gridline-subtle` - Grid lines should be low-contrast (e.g. gray-200) so they don't compete with data
- `focusable-elements` - Interactive chart elements (points, bars, slices) must be keyboard-navigable (WCAG)
- `screen-reader-summary` - Provide a text summary or aria-label describing the chart's key insight for screen readers (WCAG)
- `error-state-chart` - Data load failure must show error message with retry action, not a broken/empty chart
- `export-option` - For data-heavy products, offer CSV/image export of chart data
- `drill-down-consistency` - Drill-down interactions must maintain a clear back-path and hierarchy breadcrumb
- `time-scale-clarity` - Time series charts must clearly label time granularity (day/week/month) and allow switching

---

## Search Engine — BM25 Database

Search specific domains using the CLI tool.

### Prerequisites

```bash
python3 --version || python --version
```

### How to Use

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New project / page** | "Build a landing page", "Build a dashboard" | Step 1 → Step 2 (design system) |
| **New component** | "Create a pricing card", "Add a modal" | Step 3 (domain search: style, ux) |
| **Choose style / color / font** | "What style fits a fintech app?", "Recommend a color palette" | Step 2 (design system) |
| **Review existing UI** | "Review this page for UX issues", "Check accessibility" | Part A heuristics + Quick Reference checklist |
| **Fix a UI bug** | "Button hover is broken", "Layout shifts on load" | Quick Reference → relevant section |
| **Improve / optimize** | "Make this faster", "Improve mobile experience" | Step 3 (domain search: ux, react) |
| **Add charts / data viz** | "Add an analytics dashboard chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React performance tips", "SwiftUI navigation" | Step 4 (stack search) |

### Step 1: Analyze User Requirements

Extract key information from user request:
- **Product type**: Entertainment, Tool, Productivity, or hybrid
- **Target audience**: Consider age group, usage context (commute, leisure, work)
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, HTML/CSS

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`** to get comprehensive recommendations with reasoning:

```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:
1. Searches domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

**Example:**
```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

To save the design system for **hierarchical retrieval across sessions**, add `--persist`:

```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:
- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

**With page-specific override:**
```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

**How hierarchical retrieval works:**
1. When building a specific page (e.g., "Checkout"), first check `design-system/pages/checkout.md`
2. If the page file exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

### Step 3: Supplement with Detailed Searches (as needed)

```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Individual Google Fonts | `google-fonts` | `--domain google-fonts "sans serif popular variable"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| React Native perf | `react` | `--domain react "rerender memo list"` |
| App interface a11y | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

### Step 4: Stack Guidelines

Get implementation-specific best practices:

```bash
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "<keyword>" --stack react-native
```

### Available Stacks

| Stack | Focus |
|-------|-------|
| `react-native` | Components, Navigation, Lists |

### Output Formats

```bash
# ASCII box (default) - best for terminal display
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 ~/.claude/skills/ui-design-stack/scripts/search.py "fintech crypto" --design-system -f markdown
```

### Tips for Better Results

- Use **multi-dimensional keywords** — combine product + industry + tone + density
- Try different keywords for the same need: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use `--design-system` first for full recommendations, then `--domain` to deep-dive
- Always add `--stack react-native` for implementation-specific guidance

### Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Re-run `--design-system` with different keywords |
| Dark mode contrast issues | Quick Reference §6: `color-dark-mode` + `color-accessible-pairs` |
| Animations feel unnatural | Quick Reference §7: `spring-physics` + `easing` + `exit-faster-than-enter` |
| Form UX is poor | Quick Reference §8 + Part A §5 (micro-copy) + §7 (error recovery) |
| Navigation feels confusing | Quick Reference §9 + Part A §3 (information architecture) |
| Layout breaks on small screens | Quick Reference §5: `mobile-first` + `breakpoint-consistency` |
| Performance / jank | Quick Reference §3: `virtualize-lists` + `main-thread-budget` + `debounce-throttle` |

---

## Common Rules for Professional UI

Frequently overlooked issues that make UI look unprofessional.

### Icons & Visual Elements

| Rule | Standard | Avoid | Why It Matters |
|------|----------|--------|----------------|
| **No Emoji as Structural Icons** | Use vector-based icons (Lucide, react-native-vector-icons, @expo/vector-icons) | Using emojis for navigation, settings, or system controls | Emojis are font-dependent, inconsistent across platforms, and cannot be controlled via design tokens |
| **Vector-Only Assets** | Use SVG or platform vector icons that scale cleanly and support theming | Raster PNG icons that blur or pixelate | Ensures scalability, crisp rendering, and dark/light mode adaptability |
| **Stable Interaction States** | Use color, opacity, or elevation transitions for press states without changing layout bounds | Layout-shifting transforms that move surrounding content | Prevents unstable interactions and preserves smooth motion |
| **Correct Brand Logos** | Use official brand assets and follow their usage guidelines | Guessing logo paths, recoloring unofficially, or modifying proportions | Prevents brand misuse and ensures legal/platform compliance |
| **Consistent Icon Sizing** | Define icon sizes as design tokens (icon-sm, icon-md = 24pt, icon-lg) | Mixing arbitrary values like 20pt / 24pt / 28pt randomly | Maintains rhythm and visual hierarchy |
| **Stroke Consistency** | Use a consistent stroke width within the same visual layer | Mixing thick and thin stroke styles arbitrarily | Inconsistent strokes reduce perceived polish |
| **Touch Target Minimum** | Minimum 44x44pt interactive area (use hitSlop if icon is smaller) | Small icons without expanded tap area | Meets accessibility and platform usability standards |

### Interaction (App)

| Rule | Do | Don't |
|------|----|----- |
| **Tap feedback** | Provide clear pressed feedback (ripple/opacity/elevation) within 80-150ms | No visual response on tap |
| **Animation timing** | Keep micro-interactions around 150-300ms with platform-native easing | Instant transitions or slow animations (>500ms) |
| **Accessibility focus** | Ensure screen reader focus order matches visual order | Unlabeled controls or confusing focus traversal |
| **Disabled state clarity** | Use disabled semantics, reduced emphasis, and no tap action | Controls that look tappable but do nothing |
| **Touch target minimum** | Keep tap areas >=44x44pt (iOS) or >=48x48dp (Android) | Tiny tap targets or icon-only hit areas without padding |
| **Gesture conflict prevention** | Keep one primary gesture per region | Overlapping gestures causing accidental actions |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|----- |
| **Surface readability** | Keep cards/surfaces clearly separated from background | Overly transparent surfaces that blur hierarchy |
| **Text contrast (light)** | Maintain body text contrast >=4.5:1 against light surfaces | Low-contrast gray body text |
| **Text contrast (dark)** | Maintain primary text contrast >=4.5:1 on dark surfaces | Dark mode text that blends into background |
| **Border visibility** | Ensure separators are visible in both themes | Theme-specific borders disappearing in one mode |
| **Token-driven theming** | Use semantic color tokens mapped per theme | Hardcoded per-screen hex values |
| **Scrim legibility** | Use modal scrim strong enough to isolate foreground (typically 40-60% black) | Weak scrim that leaves background competing |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| **Safe-area compliance** | Respect top/bottom safe areas for all fixed headers, tab bars, CTA bars | Placing fixed UI under notch, status bar, or gesture area |
| **System bar clearance** | Add spacing for status/navigation bars and gesture home indicator | Let tappable content collide with OS chrome |
| **8dp spacing rhythm** | Use a consistent 4/8dp spacing system | Random spacing increments with no rhythm |
| **Readable text measure** | Keep long-form text readable on large devices | Full-width long text on tablets |
| **Scroll coexistence** | Add bottom/top content insets so lists aren't hidden behind fixed bars | Scroll content obscured by sticky headers/footers |

---

## Pre-Delivery Checklist (Combined)

Run both UX strategy and design intelligence checks before delivery.

### UX Flow Completeness (Part A)
- [ ] Happy path works end-to-end
- [ ] Error states have recovery paths (no dead ends)
- [ ] Empty states guide the user to the primary action
- [ ] Loading states show progress or skeleton (no blank screens)
- [ ] Back/undo works at every step without data loss
- [ ] Success states suggest a logical next action

### Information Architecture (Part A)
- [ ] Primary navigation has <=7 items
- [ ] Current location is always visible (active state, breadcrumbs)
- [ ] Search is available for content-heavy pages
- [ ] Labels use user language, not internal jargon
- [ ] Most important content has the most visual weight

### Micro-Copy (Part A)
- [ ] Error messages state cause + fix
- [ ] Buttons use verb + object pattern
- [ ] No placeholder-only labels on form fields
- [ ] Confirmation dialogs state the consequence
- [ ] No developer jargon in user-facing text

### Conversion & Trust (Part A)
- [ ] One clear primary CTA per screen
- [ ] Social proof near decision points
- [ ] Value shown before asking for commitment
- [ ] Form asks only what's needed right now
- [ ] Trust signals present where relevant

### Visual Quality (Part B)
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family and style
- [ ] Official brand assets used with correct proportions
- [ ] Pressed-state visuals do not shift layout bounds
- [ ] Semantic theme tokens used consistently

### Interaction (Part B)
- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets meet minimum size (>=44x44pt iOS, >=48x48dp Android)
- [ ] Micro-interaction timing stays in 150-300ms range
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order

### Light/Dark Mode (Part B)
- [ ] Primary text contrast >=4.5:1 in both modes
- [ ] Secondary text contrast >=3:1 in both modes
- [ ] Dividers/borders and interaction states distinguishable in both modes
- [ ] Both themes tested before delivery

### Layout (Part B)
- [ ] Safe areas respected for headers, tab bars, bottom CTAs
- [ ] Scroll content not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] 4/8dp spacing rhythm maintained

### Accessibility (Combined)
- [ ] Tab order matches visual order
- [ ] All interactive elements reachable by keyboard
- [ ] Color is never the sole indicator
- [ ] Touch targets >=44px
- [ ] Reduced motion respected
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Dynamic text size supported without layout breakage

### Final Validation
- [ ] Run `--domain ux "animation accessibility z-index loading"` as UX validation pass
- [ ] Run through Quick Reference §1-§3 (CRITICAL + HIGH) as final review
- [ ] Test on 375px (small phone) and landscape orientation
- [ ] Verify behavior with reduced-motion enabled and Dynamic Type at largest size
- [ ] Check dark mode contrast independently
- [ ] Confirm all touch targets >=44pt and no content behind safe areas
