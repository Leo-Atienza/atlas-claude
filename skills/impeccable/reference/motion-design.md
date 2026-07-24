# Motion Design

## Duration: The 100/300/500 Rule

Timing matters more than easing. These durations feel right for most UI:

| Duration | Use Case | Examples |
|----------|----------|----------|
| **100-150ms** | Instant feedback | Button press, toggle, color change |
| **200-300ms** | State changes | Menu open, tooltip, hover states |
| **300-500ms** | Layout changes | Accordion, modal, drawer |
| **500-800ms** | Entrance animations | Page load, hero reveals |

**Exit animations are faster than entrances**—use ~75% of enter duration.

## Easing: Pick the Right Curve

**Don't use `ease`.** It's a compromise that's rarely optimal. Instead:

| Curve | Use For | CSS |
|-------|---------|-----|
| **ease-out** | Elements entering | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **ease-in** | Elements leaving | `cubic-bezier(0.7, 0, 0.84, 0)` |
| **ease-in-out** | State toggles (there → back) | `cubic-bezier(0.65, 0, 0.35, 1)` |

**For micro-interactions, use exponential curves**—they feel natural because they mimic real physics (friction, deceleration):

```css
/* Quart out - smooth, refined (recommended default) */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);

/* Quint out - slightly more dramatic */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);

/* Expo out - snappy, confident */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

**Avoid bounce and elastic curves.** They were trendy in 2015 but now feel tacky and amateurish. Real objects don't bounce when they stop—they decelerate smoothly. Overshoot effects draw attention to the animation itself rather than the content.

## The Only Two Properties You Should Animate

**transform** and **opacity** only—everything else causes layout recalculation. For height animations (accordions), use `grid-template-rows: 0fr → 1fr` instead of animating `height` directly.

## Staggered Animations

Use CSS custom properties for cleaner stagger: `animation-delay: calc(var(--i, 0) * 50ms)` with `style="--i: 0"` on each item. **Cap total stagger time**—10 items at 50ms = 500ms total. For many items, reduce per-item delay or cap staggered count.

## Reduced Motion

This is not optional. Vestibular disorders affect ~35% of adults over 40.

```css
/* Define animations normally */
.card {
  animation: slide-up 500ms ease-out;
}

/* Provide alternative for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: fade-in 200ms ease-out;  /* Crossfade instead of motion */
  }
}

/* Or disable entirely */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**What to preserve**: Functional animations like progress bars, loading spinners (slowed down), and focus indicators should still work—just without spatial movement.

## Perceived Performance

**Nobody cares how fast your site is—just how fast it feels.** Perception can be as effective as actual performance.

**The 80ms threshold**: Our brains buffer sensory input for ~80ms to synchronize perception. Anything under 80ms feels instant and simultaneous. This is your target for micro-interactions.

**Active vs passive time**: Passive waiting (staring at a spinner) feels longer than active engagement. Strategies to shift the balance:

- **Preemptive start**: Begin transitions immediately while loading (iOS app zoom, skeleton UI). Users perceive work happening.
- **Early completion**: Show content progressively—don't wait for everything. Video buffering, progressive images, streaming HTML.
- **Optimistic UI**: Update the interface immediately, handle failures gracefully. Instagram likes work offline—the UI updates instantly, syncs later. Use for low-stakes actions; avoid for payments or destructive operations.

**Easing affects perceived duration**: Ease-in (accelerating toward completion) makes tasks feel shorter because the peak-end effect weights final moments heavily. Ease-out feels satisfying for entrances, but ease-in toward a task's end compresses perceived time.

**Caution**: Too-fast responses can decrease perceived value. Users may distrust instant results for complex operations (search, analysis). Sometimes a brief delay signals "real work" is happening.

## Performance

Don't use `will-change` preemptively—only when animation is imminent (`:hover`, `.animating`). For scroll-triggered animations, use Intersection Observer instead of scroll events; unobserve after animating once. Create motion tokens for consistency (durations, easings, common transitions).

## Should this animate at all?

The gate before any motion code. Run these checks in order—if the element fails one, ship it static.

**Frequency of exposure decides.** The more often a user sees an element, the less it should move:

| Exposure | Verdict |
|----------|---------|
| 100+ times/day (command palette, shortcut-driven UI) | Never animate |
| Tens of times/day (hovers, list navigation) | Cut it, or shrink it to near-zero |
| Occasional (modals, drawers, toasts) | Normal motion budget |
| Rare / first-run (onboarding, success moments) | Delight is allowed |

**Keyboard-initiated actions never animate.** Repetition converts any delay into perceived lag—a panel opened by shortcut should appear instantly, every single time.

**Who started it matters.** User-initiated motion (press, drag, dismiss) can be expressive—it confirms the action. System-initiated motion (background refresh, state sync) must be near-invisible; the user didn't ask for a show.

**The spatial-relationship test**: animate only when motion explains where something came from or where it went. If the movement carries no spatial information, a crossfade—or nothing—is the better answer.

**Animate once—never loop ambient UI.** Looping decorative motion is a permanent attention leak. The entrance plays once; after that, the element holds still.

Framework paraphrased from Emil Kowalski's design-engineering material (ideas only; no licensed text).

## One intensity knob, not scattered tuning

Wire motion intensity to a SINGLE source of truth so the whole page dials together: one `--motion-scale` custom property (or one exported const) that durations and travel distances multiply — `animation-duration: calc(var(--motion-d, 300ms) * var(--motion-scale, 1))`. "Tone it down" then costs one edit instead of a per-component hunt, and drift (0.3s here, 0.45s there, 0.6s there) stops accumulating. Declare it in the token layer next to the duration ladder; tune per-component only for a reason the knob can't express (and say why in a comment). This is also the cheap A/B lever for the over-animation failure mode — the top non-goal in every landing-page brief. (Added 2026-07-17 from the design-brief deltas.)

## Component motion patterns

Concrete settings per component, consistent with the duration and easing tables above:

| Component | Duration | Easing | Transform origin |
|-----------|----------|--------|------------------|
| **Modal** | 300ms | ease-out (quart/expo) | `center`—a modal has no trigger to grow from |
| **Drawer** | 300–500ms | `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-feel) | n/a—translate from its edge |
| **Toast** | 200–300ms | ease-out | n/a—enter and exit from the same edge |
| **Popover/dropdown** | 150–250ms | ease-out | the trigger, not center—use the framework's variable (Radix: `var(--radix-popover-content-transform-origin)`) |

- **Modal**: enter from `scale(0.95)` + `opacity: 0`, never `scale(0)`—real objects don't materialize out of nothing.
- **Drawer**: hide with `translateY(100%)`—a percentage of the element's own height, so it adapts to content automatically.
- **Toast**: use CSS transitions, not keyframes. Toasts stack quickly, and keyframes restart from zero when interrupted while a transition re-aims at the new value mid-flight.
- **Accordion**: transition `grid-template-rows: 0fr → 1fr` (see "The Only Two Properties" above and the motion DOs in SKILL.md)—never animate `height`.

## Scroll-driven motion

ScrollTrigger-class scroll choreography earns its place on storytelling surfaces—marketing pages, landing pages, product narratives—where scroll *is* the timeline. **Never on dashboards or product UI**: people working in a tool re-scroll the same screen dozens of times a day, which fails the frequency gate above.

Implementation lives in the gsap-advanced skill (SK-044). The full Apple-tier playbook — sticky-scene choreography, canvas image-sequence scrubbing, scroll-linked video, CSS scroll-driven animations, the Lenis + ScrollTrigger stack — is in [scroll-storytelling.md](scroll-storytelling.md).

Constraints restated: transform/opacity only, and a `prefers-reduced-motion` fallback is mandatory.

## Verifying it actually moves

Reasoning that an animation is smooth is not the same as observing it. Verify the rendered result across the engines real people use — Chromium, Firefox, and WebKit (Safari) — and frame-diff a scroll-through to prove motion actually played (a script that ran while nothing moved is the hardest failure to catch by eye). The tool and the per-engine fix patterns live in [cross-browser-and-feel.md](cross-browser-and-feel.md); run it at craft Step 4b before presenting any animated or public build.

## Motion personality

Animation character is a brand decision, not a library default. Derive it from the SAME 3 brand words the font-selection procedure extracts (SKILL.md, Step 1) — the words that chose your typeface choose your timing. One motion personality per project; defaulting every build to the same polite ease-out fade is the motion equivalent of Inter.

| Brand words lean… | Motion character |
|-------------------|------------------|
| **Brutalist / raw** | Instant or `steps()` — no curves, no fades; things ARE or ARE NOT |
| **Luxury / refined** | 400–600ms, long fades, generous overlap; nothing rushes |
| **Playful / toy-like** | Springs, slight overshoot allowed HERE ONLY — still never bounce easing on entrances |
| **Editorial / magazine** | Mask reveals, line-by-line text, restrained; the type is the show |
| **Technical / utilitarian** | 120–200ms, precise, zero decoration; motion = state change, nothing more |
| **Organic / natural** | Soft curves, staggered drift; siblings move like a flock, not a queue |

Rules:

- Pick the personality at design-direction time and write it into `.impeccable.md` alongside the font choice. It is design context, not an implementation detail.
- Apply it to EVERY animated surface. Mixed motion personalities on one page — a springy toggle beside a luxury fade beside a `steps()` menu — read as slop as surely as three clashing fonts.
- The duration and easing tables above still bound everything; personality picks WHERE in those ranges you live, not whether you respect them.
- Implementation recipes live in [animation-recipes.md](animation-recipes.md).

---

**Avoid**: Animating everything (animation fatigue is real). Using >500ms for UI feedback. Ignoring `prefers-reduced-motion`. Using animation to hide slow loading.
