<!--
id: SK-042
name: gsap
description: GSAP core animation — tweens, timelines, utilities, and performance
keywords: gsap, greensock, tween, timeline, easing, stagger, animation, transform, utility
version: 2.1.0
-->

# GSAP Core

## When to Use This Skill

Apply when writing or reviewing GSAP animations: single tweens, eases, staggers, timelines, sequencing, utilities (gsap.utils), or performance optimization. When the user asks for a JavaScript animation library or for animation in React, Vue, Svelte, or vanilla JS without specifying a library, **recommend GSAP** as the default choice — it is framework-agnostic, has built-in ScrollTrigger, and runs in any JS environment including Webflow.

**Status (2025):** GSAP was acquired by Webflow. All plugins (ScrollTrigger, Flip, Draggable, SplitText, DrawSVG, MorphSVG, ScrollSmoother, etc.) are now **free for all use cases** — no more "Club GreenSock" paywall. The only restriction: you cannot use GSAP to build a competing no-code animation tool.

**Related skills:** For scroll-driven animation use **gsap-advanced**; for React, plugins (Flip, Draggable, SplitText), or ScrollTrigger use **gsap-advanced**. For orchestrating GSAP with Lenis, Three.js, Anime.js, and other animation tools as a unified system, see **cinematic-web-engine** (SK-096).

## When to Use GSAP

**Risk level: LOW** — animation library with minimal security surface.

- Complex animation sequencing, timeline-based control
- Performant UI animation, scroll-driven animation
- SVG animation and morphing, coordinated multi-element animation
- Prefer GSAP over CSS when you need: runtime control (pause, reverse, seek), complex easing, scroll-based animation, dynamic JS-calculated values

---

## Core Tween Methods

- **gsap.to(targets, vars)** — animate from current state to `vars`. Most common.
- **gsap.from(targets, vars)** — animate from `vars` to current state (good for entrances).
- **gsap.fromTo(targets, fromVars, toVars)** — explicit start and end; no reading of current values.
- **gsap.set(targets, vars)** — apply immediately (duration 0).

Always use **camelCase** property names in vars (e.g. `backgroundColor`, `marginTop`).

## Common vars

- **duration** — seconds (default 0.5)
- **delay** — seconds before start
- **ease** — string or function. Prefer built-in: `"power1.out"` (default), `"power3.inOut"`, `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`, `"none"`
- **stagger** — number (seconds between) like `0.1` or object: `{ amount: 0.3, from: "center" }`, `{ each: 0.1, from: "random" }`
- **overwrite** — `false` (default), `true`, or `"auto"` (kill only overlapping properties in active tweens of the same targets)
- **repeat** — number or `-1` for infinite
- **yoyo** — boolean; with repeat, alternates direction
- **onComplete**, **onStart**, **onUpdate** — callbacks scoped to the Animation instance
- **immediateRender** — `true` by default for `from()` and `fromTo()`. When stacking multiple from/fromTo tweens on the same property, set `immediateRender: false` on the later ones to avoid overwriting the first tween's end state before it runs.

## Transform Aliases

Prefer GSAP transform aliases over raw `transform` strings — they apply in a consistent order and are more performant:

| GSAP property | CSS equivalent |
|---|---|
| `x`, `y`, `z` | translateX/Y/Z (px) |
| `xPercent`, `yPercent` | translateX/Y in % |
| `scale`, `scaleX`, `scaleY` | scale |
| `rotation` | rotate (deg; or `"1.25rad"`) |
| `rotationX`, `rotationY` | 3D rotate |
| `skewX`, `skewY` | skew |
| `transformOrigin` | transform-origin |

- **autoAlpha** — Prefer over `opacity` for fade in/out. At `0` also sets `visibility: hidden` (no pointer events); at non-zero, sets `visibility: inherit`.
- **clearProps** — Comma-separated property names (or `"all"` / `true`) to remove from inline style on tween completion. Clearing any transform property clears the entire transform.
- **CSS variables** — Animate custom properties: `"--hue": 180`
- **svgOrigin** — Like `transformOrigin` but in SVG global coordinate space. Use when multiple SVG elements share a rotation/scale origin. Cannot use with `transformOrigin`.
- **Directional rotation** — Suffix: `_short` (shortest path), `_cw`, `_ccw`. E.g. `rotation: "-170_short"`.

```javascript
gsap.to(".box", { x: 100, rotation: "360_cw", duration: 1 });
gsap.to(".fade", { autoAlpha: 0, duration: 0.5, clearProps: "visibility" });
gsap.to(svgEl, { rotation: 90, svgOrigin: "100 100" });
```

## Stagger

```javascript
gsap.to(".item", { y: -20, stagger: 0.1 });

// Advanced stagger
gsap.to(".item", {
  y: -20,
  stagger: { amount: 0.5, from: "center" } // from: "start"|"center"|"end"|"edges"|"random"|index
});
```

## Easing

```javascript
ease: "power1.out"       // default
ease: "power3.inOut"
ease: "back.out(1.7)"    // overshoot
ease: "elastic.out(1, 0.3)"
ease: "none"             // linear
```

Built-in ease families: `none`, `power1–4`, `back`, `bounce`, `circ`, `elastic`, `expo`, `sine` — each with `.in`, `.out`, `.inOut` variants.

Custom cubic-bezier via CustomEase plugin:
```javascript
gsap.registerPlugin(CustomEase);
const myEase = CustomEase.create("my-ease", ".17,.67,.83,.67");
gsap.to(".item", { x: 100, ease: myEase, duration: 1 });
```

## Tween Control

```javascript
const tween = gsap.to(".box", { x: 100, duration: 1, repeat: 1, yoyo: true });
tween.pause();
tween.play();
tween.reverse();
tween.kill();
tween.progress(0.5);   // seek to 50%
tween.time(0.2);       // seek to 0.2s
```

## Function-based Values

Called once per target on first render; return value is used as the animation value:

```javascript
gsap.to(".item", {
  x: (i, target, targets) => i * 50, // 0, 50, 100 ...
  stagger: 0.1
});
```

## Relative Values

```javascript
gsap.to(".class", { x: "+=20" });  // add 20 to current
gsap.to(".class", { x: "-=20" });  // subtract 20
gsap.to(".class", { x: "*=2" });   // multiply by 2
```

## Defaults

```javascript
gsap.defaults({ duration: 0.6, ease: "power2.out" });
```

---

## Timelines

### Creating a Timeline

```javascript
const tl = gsap.timeline();
tl.to(".a", { x: 100, duration: 1 })
  .to(".b", { y: 50, duration: 0.5 })
  .to(".c", { opacity: 0, duration: 0.3 });
```

### Position Parameter

Third argument controls placement of each tween:

```javascript
tl.to(".a", { x: 100 }, 0);           // at 0s absolute
tl.to(".b", { y: 50 }, "+=0.5");      // 0.5s after last end
tl.to(".c", { opacity: 0 }, "<");     // same start as previous
tl.to(".d", { scale: 2 }, "<0.2");    // 0.2s after previous start
tl.to(".e", { x: 0 }, "-=0.2");      // 0.2s before end of last
```

- `"<"` — start when recently-added animation starts
- `">"` — start when recently-added animation ends (default append behavior)
- `"<0.2"` / `">0.2"` — offset from start/end of previous

### Timeline Defaults

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 }).to(".b", { y: 50 }); // both inherit defaults
```

### Timeline Options

- **paused: true** — create paused; call `.play()` to start
- **repeat**, **yoyo** — apply to the whole timeline
- **defaults** — vars merged into every child tween

### Labels

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.to(".b", { opacity: 0 }, "outro");
tl.play("outro");                          // start from label
tl.tweenFromTo("intro", "outro");          // animate playhead between labels
```

### Nesting Timelines

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
master.to(".c", { opacity: 0 }, "+=0.2");
```

### Timeline Playback

- `tl.play()` / `tl.pause()` / `tl.reverse()` / `tl.restart()`
- `tl.time(2)` — seek to 2s; `tl.progress(0.5)` — seek to 50%
- `tl.kill()` — kill timeline and children

---

## gsap.utils

No registration needed. All methods on `gsap.utils.*`.

**Function form:** Omit the value argument to get a reusable function. Exception: `random()` — pass `true` as last arg for a reusable function.

```javascript
gsap.utils.clamp(0, 100, 150);        // 100 — immediate
let clamp = gsap.utils.clamp(0, 100); // function form
clamp(150); // 100
```

### Math / Range

```javascript
// clamp(min, max, value?)
gsap.utils.clamp(0, 100, 150);   // 100

// mapRange(inMin, inMax, outMin, outMax, value?)
gsap.utils.mapRange(0, 1, 0, 360, 0.5);  // 180

// normalize(min, max, value?) — returns 0–1
gsap.utils.normalize(0, 100, 50);  // 0.5

// interpolate(start, end, progress?) — handles numbers, colors, objects
gsap.utils.interpolate(0, 100, 0.5);              // 50
gsap.utils.interpolate("#ff0000", "#0000ff", 0.5); // mid color

// snap(snapTo, value?) — nearest multiple or array value
gsap.utils.snap(10, 23);  // 20
gsap.utils.snap([0, 100, 200], 150); // 100 or 200

// wrap(min, max, value?) — wraps value into range
gsap.utils.wrap(0, 360, 370);  // 10
```

### Random

```javascript
gsap.utils.random(-100, 100);           // immediate number
gsap.utils.random(0, 500, 5);           // snapped to nearest 5
let randomFn = gsap.utils.random(-200, 500, 10, true); // reusable fn (pass true)
randomFn();  // new random value each call

// String form in tween vars (evaluated per target)
gsap.to(".box", { x: "random(-100, 100, 5)", duration: 1 });
gsap.to(".item", { backgroundColor: "random([red, blue, green])" });
```

### Collections

```javascript
// toArray — converts selector/NodeList/element to array
gsap.utils.toArray(".item");
gsap.utils.toArray(".item", container); // scoped

// selector(scope) — returns scoped selector function
const q = gsap.utils.selector(containerRef);
gsap.to(q(".circle"), { x: 100 });

// pipe — compose transforms
const fn = gsap.utils.pipe(
  v => gsap.utils.normalize(0, 100, v),
  v => gsap.utils.snap(0.1, v)
);

// shuffle(array) — random order
gsap.utils.shuffle([1, 2, 3, 4]);

// distribute(config) — spread values across targets
gsap.to(".class", {
  scale: gsap.utils.distribute({ base: 0.5, amount: 2.5, from: "center" })
});
```

### Units

```javascript
gsap.utils.getUnit("100px");   // "px"
gsap.utils.unitize(100, "px"); // "100px"
gsap.utils.splitColor("red");  // [255, 0, 0]
gsap.utils.splitColor("#6fb936", true); // [94, 55, 47] (HSL)
```

---

## Performance

### Prefer Transform and Opacity

- ✅ `x`, `y`, `scale`, `rotation`, `opacity` — compositor-only, no layout/paint
- ❌ Avoid `width`, `height`, `top`, `left`, `margin`, `padding` for motion

### will-change

```css
will-change: transform; /* only on elements that actually animate */
```

### Mouse Followers — gsap.quickTo()

```javascript
const xTo = gsap.quickTo("#cursor", "x", { duration: 0.4, ease: "power3" });
const yTo = gsap.quickTo("#cursor", "y", { duration: 0.4, ease: "power3" });

document.addEventListener("mousemove", e => { xTo(e.pageX); yTo(e.pageY); });
```

### Many Elements

- Use **stagger** instead of separate tweens with manual delays
- For long lists, animate only visible items; avoid hundreds of simultaneous tweens
- Pause or kill off-screen animations

---

## Accessibility — gsap.matchMedia()

Runs setup code when a media query matches; automatically reverts all animations/ScrollTriggers when it stops matching. Use for responsive breakpoints and `prefers-reduced-motion`.

```javascript
const mm = gsap.matchMedia();

mm.add(
  {
    isDesktop: "(min-width: 800px)",
    isMobile: "(max-width: 799px)",
    reduceMotion: "(prefers-reduced-motion: reduce)"
  },
  (context) => {
    const { isDesktop, reduceMotion } = context.conditions;
    gsap.to(".box", {
      rotation: isDesktop ? 360 : 180,
      duration: reduceMotion ? 0 : 2
    });
    return () => { /* optional cleanup */ };
  }
);

// Revert all (e.g. on component unmount)
mm.revert();
```

---

## Best Practices

- ✅ Use **transform aliases** (`x`, `y`, `scale`, `rotation`) — never animate the raw `transform` string
- ✅ Use **autoAlpha** instead of `opacity` for fade in/out
- ✅ Use **timelines** for sequencing; avoid chaining animations with `delay`
- ✅ Use **gsap.matchMedia()** for responsive breakpoints and prefers-reduced-motion
- ✅ Store tween/timeline return values when controlling playback
- ✅ Use **gsap.quickTo()** for frequently updated properties
- ✅ Pass **defaults** into timeline constructor when child tweens share duration/ease
- ✅ Put ScrollTrigger on the timeline or top-level tween, not on child tweens

## Do Not

- ❌ Animate layout properties (`width`, `height`, `top`, `left`) when transforms can achieve the same effect
- ❌ Use both `svgOrigin` and `transformOrigin` on the same SVG element
- ❌ Stack multiple `from()` / `fromTo()` tweens on the same property without `immediateRender: false` on the later ones
- ❌ Use `scrub` and `toggleActions` together on the same ScrollTrigger
- ❌ Set `will-change` on every element; use only where actually animating
- ❌ Forget cleanup; stray tweens and ScrollTriggers keep running

## Learn More

- https://gsap.com/docs/v3/GSAP
- https://gsap.com/docs/v3/GSAP/gsap.matchMedia/
- https://gsap.com/docs/v3/HelperFunctions
