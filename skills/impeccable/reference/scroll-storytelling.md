# Scroll Storytelling

> Deep version of [motion-design](motion-design.md) § Scroll-driven motion. That section decides IF a scene animates; this file is HOW. The page skeleton is the storytelling-scroll archetype in [layout-archetypes](layout-archetypes.md) — read it first; this file choreographs what happens inside each beat.

## When This Register Is Allowed

Scroll storytelling is for marketing, product-narrative, and launch surfaces ONLY. Never product UI, never dashboards, never docs — people re-scroll a working screen dozens of times a day, and scroll choreography fails the frequency gate instantly.

ONE storytelling sequence per page. One pinned scene earns attention; three numb it into wallpaper. Everything else on the page gets cheap reveals or nothing. A brief typographic settle-pin — ≤~250vh, type and a gauge line only, no asset scene — does not count against this budget; the budget governs asset-heavy scrub scenes.

Gate every scene through motion-design.md's "Should this animate at all?" before writing a line of scroll code. If the motion carries no narrative information — a chart drawing itself, a product rotating to show the port, a number counting to its claim — ship the section static.

## The Apple Recipe Is Boring

Apple's product pages are not exotic. The recipe is: a canvas, `position: sticky`, ~20 lines of scroll math, exceptional assets, and ruthless restraint. No scroll library is load-bearing. The hard part is the assets and the editing — what they LEFT OUT — not the code. Do not reach for a dependency to solve a problem that is four CSS properties and a division.

## Technique: Sticky-Scene Choreography

The foundation of every pinned scene. A tall wrapper provides the scroll budget; a sticky child stays glued to the viewport while the wrapper scrolls past.

```html
<section class="scene-wrap">  <!-- height: 300vh — the scroll budget -->
  <div class="scene">         <!-- the pinned stage -->
    <canvas></canvas>
    <h2 class="caption">…</h2>
  </div>
</section>
```

```css
.scene-wrap { height: 300vh; }            /* 200-400vh; longer = slower story */
.scene { position: sticky; top: 0; height: 100vh; overflow: hidden; }
```

`overflow: hidden` on the stage is optional — when the canvas and captions are sized within bounds it does nothing, and omitting it keeps audit-rules AR-30 silent.

```js
function progress(wrap) {
  const rect = wrap.getBoundingClientRect();
  const total = wrap.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, -rect.top / total));  // 0 → 1 across the pin
}
```

Read progress once per rAF tick and map it to transforms/opacity. Segment it for multi-beat scenes — caption A lives in 0–0.33, caption B in 0.33–0.66 — with one tiny helper instead of nested conditionals:

```js
// remap a global 0-1 progress into a local 0-1 for one beat
const segment = (p, start, end) =>
  Math.min(1, Math.max(0, (p - start) / (end - start)));

// inside the rAF tick:
const p = progress(wrap);
captionA.style.opacity = 1 - segment(p, 0.28, 0.36);  // A fades out…
captionB.style.opacity = segment(p, 0.36, 0.44);      // …as B fades in
```

Beats should overlap slightly at their seams (as above) — hard cuts at exact thirds read as a slideshow, not a story.

**The sticky trap:** ANY ancestor with `overflow: hidden` (or `auto`/`scroll`/`clip`) silently kills `position: sticky`. When a pin "doesn't work," this is the cause — audit the ancestor chain before debugging anything else.

**The anchor-jump trap:** an in-page anchor can teleport past a pinned scene without one scroll tick firing while it is in view, stranding captions and canvas in their initial state. Never gate progress writes on in-view checks alone — compute every wrap's progress on every tick; cache style writes and idx-gate canvas draws so the always-on path costs nothing.

## Technique: Canvas Image-Sequence Scrubbing

The AirPods-Pro move: a pre-rendered frame sequence scrubbed by scroll. Use it for the ONE hero scene; it is the most expensive technique on this page.

- **Frame count:** 100–300 WebP frames. Fewer stutters; more wastes memory and bandwidth.
- **Decode off-thread:** `createImageBitmap` decodes off the main thread — never scrub with raw `Image` elements.
- **Lazy-start:** don't fetch 200 frames on page load. IntersectionObserver with `rootMargin: '100% 0px'` starts the fetch one viewport early.
- **Mobile memory cap:** decoded size is width × height × 4 bytes per frame regardless of WebP on the wire — 200 frames at 1920×1080 is ~1.6 GB of bitmaps. Serve a smaller sequence (~1280px) to narrow viewports and keep desktop frames ≤1920px.

```js
const N = 148, frames = [];
let loaded = false, lastIdx = -1;

async function preload() {
  await Promise.all(Array.from({ length: N }, async (_, i) => {
    const res = await fetch(`/seq/frame-${String(i).padStart(4, '0')}.webp`);
    frames[i] = await createImageBitmap(await res.blob());
  }));
  loaded = true;
}
new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { preload(); obs.disconnect(); }
}, { rootMargin: '100% 0px' }).observe(wrap);

function tick() {                       // runs inside the page's ONE rAF loop
  const idx = Math.min(N - 1, Math.floor(progress(wrap) * N));
  if (loaded && idx !== lastIdx) {
    ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
    lastIdx = idx;                      // draw only when the frame changes
  }
}
```

Size the canvas for the device, or the frames render blurry on every modern screen:

```js
const dpr = Math.min(devicePixelRatio, 2);          // cap DPR; 3x buys nothing visible
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
```

**Free frame sources** — no asset budget is not an excuse:
- **Blender render** → export a frame sequence directly, convert to WebP.
- **Procedurally-drawn canvas scenes** — draw vector product art as a function of progress. Zero assets, zero network, infinite resolution. Often the BEST option, not the fallback.
- **R3F offline render** — build the scene in Three.js (threejs skill), render each progress step to an image, ship the stills instead of the runtime.

## Technique: Scroll-Linked Video

`video.currentTime = progress * video.duration` looks like the easy path. It is only viable if the file is re-encoded with a keyframe on every frame:

```bash
ffmpeg -i in.mp4 -g 1 -an out.mp4   # keyframe interval 1; drop audio
```

Without `-g 1`, the browser seeks to the nearest keyframe — often seconds apart — and the scrub lurches in chunks. Even with it, Android scrubbing is poor. Verdict: acceptable for secondary scenes on desktop-heavy audiences; for hero scenes, use the frame sequence.

**Before hand-rolling this:** a solved, dependency-free engine already exists in the brain — `wiki/web-dev/techniques/scroll-scrub-video-engine.md`, with a runnable `scrub-engine.js` + HTML template beside it. It fixes exactly the failures above: loads clips as **Blobs** (always seekable, no `-g 1` gamble), **coalesces seeks** on mobile, primes the iOS decoder, crossfades scene seams, and degrades to still-image crossfades under `prefers-reduced-motion`. Reach for it for continuous camera-flight pages; keep the frame-sequence technique above for the single pinned hero scene.

## Technique: CSS Scroll-Driven Animations

`animation-timeline: scroll()` / `view()` runs on the compositor thread with zero JS. This is the cheapest tool in the file — use it for reveals, parallax accents, and progress bars; it cannot do sequenced multi-beat choreography.

```css
@supports (animation-timeline: scroll()) {
  .reveal {
    animation: rise linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 40%;  /* done by 40% through the viewport */
  }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(2rem); }
}
```

The `scroll()` timeline (page progress rather than element visibility) is the free progress bar:

```css
@supports (animation-timeline: scroll()) {
  .read-progress {
    transform-origin: left;
    animation: grow linear both;
    animation-timeline: scroll();       /* nearest scroller, block axis */
  }
}
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

Support (verified 2026-06): Chrome/Edge 115+, Safari 26+, Firefox flag-only — ~83% global. Always gate with `@supports` and write the base styles so content is FULLY visible without the animation. No-motion fallback, never blank: an element that starts at `opacity: 0` outside the gate is a broken page for one user in six.

## Technique: View Transitions

Use the View Transition API for scene-to-scene and page-to-page morphs. Same-document transitions are supported in all majors (Chrome 111+, Safari 18+, Firefox 144+). Cross-document transitions are Chrome 126+ / Safari 18.2+ only — progressive enhancement by design: unsupported browsers get a normal navigation, which is a perfectly good experience. Never build a flow that REQUIRES the transition to make sense.

## The Stack & Ownership

One owner per job. Two systems fighting over one element is the signature jank of amateur scroll pages.

| Layer | Owner | Job |
|-------|-------|-----|
| Smooth scroll base | Lenis (lenis-smooth-scroll skill, SK-048) | Momentum scrolling, synced to GSAP's ticker |
| Sequenced scenes | GSAP ScrollTrigger (gsap-advanced, SK-044) | Pins, scrubbed timelines, multi-beat choreography |
| Cheap reveals | CSS scroll-driven animations | Entrances, parallax accents, progress bars |
| 3D scenes | R3F (threejs skill) | `frameloop="never"`, ticked by the same loop |

Rules:
- **Below ~4 beats / one scene, vanilla sticky + progress math is the right tool** — do not add Lenis+GSAP by reflex; the stack earns its place at multi-scene orchestration.
- **ONE driver per element.** An element is animated by ScrollTrigger OR a CSS timeline — never both.
- **ONE rAF loop per page** — the SALA pattern; see gsap-advanced § orchestration. Lenis, ScrollTrigger, canvas draws, and R3F invalidations all tick from GSAP's ticker. A second loop means dropped frames and fighting schedulers.
- Wire Lenis to GSAP exactly as the lenis-smooth-scroll skill prescribes — do not hand-roll the sync:

```js
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

## Typography for the Register

Steal Apple's discipline, never its font. Structurally:

- **2–3 weights total.** Regular and semibold carry the whole page; a third weight is the ceiling.
- **Huge size jumps:** ~17px body to 48–96px display. The gulf IS the drama — no in-between sizes diluting it.
- **`letter-spacing: -0.02em` on display sizes.** Large type needs tightening; body text does not.
- **Short measures on captions:** a pinned caption is 8–14 words, not a paragraph.

Execute all of this with YOUR project's font, chosen via the SKILL.md font-selection procedure. Imitating SF Pro (or grabbing its lookalikes) is costume, not craft — and an instant tell.

## Performance + Accessibility Budget (Non-Negotiable)

- **transform/opacity only.** The motion-design rule does not relax because the page is fancy.
- **`will-change` added only while a scene is animating, removed after.** A page-wide `will-change` is a memory leak wearing an optimization costume.
- **Passive listeners** on anything touching scroll; sequences lazy-load as specified above.
- **`prefers-reduced-motion: reduce`** → show the final frame of every sequence and the full content statically. The reduced experience is the complete story, just unanimated. TEST it — toggle the OS setting and scroll the whole page.
- **CLS = 0.** Reserve every scene's space with explicit dimensions before assets arrive.
- **Lighthouse performance ≥90 with the sequence loaded.** Measure the real page, not the page before its heaviest asset.

Miss any line above and the sequence ships static. A janky story is worse than no story.

## Anti-Slop Bans for This Register

- **No scroll-jacking.** Lenis smooths the user's scroll; it never replaces it. Wheel-hijacking to force section snapping is the cardinal sin of the genre.
- **No progress-less infinite pinning.** A pin without visible advancement reads as a frozen page. Every pinned viewport-height must visibly move the story.
- **No parallax-on-everything.** Parallax on one hero layer is depth; on six layers it is a screensaver.
- **No motion without narrative meaning.** If a scene's animation could be swapped onto a different product unchanged, it is decoration — cut it.
- **[audit-rules](audit-rules.md) applies in full.** Storytelling register is not an exemption from a single detector.

---

Original synthesis from public technique documentation (css-tricks, MDN, web.dev, Apple HIG); see ../NOTICE.md ledger. Verified 2026-06.
