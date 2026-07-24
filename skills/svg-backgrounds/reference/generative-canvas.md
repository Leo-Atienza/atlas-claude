# Generative Canvas Techniques

> Algorithms distilled from genjutsu (github:AThevon/genjutsu), MIT.

Animated `<canvas>` backgrounds for when a static SVG can't carry the idea. These are **heavier than
SVG** — real per-frame CPU, a `requestAnimationFrame` loop, teardown to worry about. Rule: **one
canvas hero per page, max.** Everything else on the page stays SVG or plain CSS.

Each technique below plugs into one shared mount helper. It handles the three things every canvas
background gets wrong: devicePixelRatio sharpness, resize, and cleanup — plus it honors
`prefers-reduced-motion` (draws a single static frame instead of looping).

## Shared mount helper (paste once)

```js
// mount a canvas scene. `setup(ctx, w, h)` returns { animated, frame(elapsed, dt) }.
// returns a cleanup fn — call it on unmount (React useEffect return, route change, etc).
function mountCanvas(canvas, setup) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, scene = null, t0 = 0, prev = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    canvas.width  = Math.round(r.width  * d);
    canvas.height = Math.round(r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);   // absolute — never compounds across resizes
    scene = setup(ctx, r.width, r.height); // rebuild scene at the new logical size
    if (!scene.animated || reduce) scene.frame(0, 0); // static path: one draw
  }
  function tick(t) {
    if (!t0) { t0 = t; prev = t; }
    const dt = Math.min((t - prev) / 1000, 0.05); // cap dt (tab-switch guard)
    prev = t;
    scene.frame((t - t0) / 1000, dt);
    raf = requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  if (scene.animated && !reduce) raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

// bridge CSS custom properties into canvas (canvas can't read var() itself):
const cssVar = (el, name, fallback) =>
  getComputedStyle(el).getPropertyValue(name).trim() || fallback;
```

Markup for every example:

```html
<canvas id="bg" style="position:absolute;inset:0;width:100%;height:100%;z-index:0"></canvas>
<!-- const stop = mountCanvas(document.getElementById('bg'), setupXxx); -->
```

---

## 1. Particle system

Drifting points, optionally linked into a "constellation". The default generative background — cheap,
legible, scales down gracefully. Earns its place as a subtle hero behind a headline or nav.

```js
function setupParticles(ctx, w, h) {
  const color = cssVar(ctx.canvas, '--accent', '#6366f1');
  const N = Math.min(140, Math.floor(w * h / 11000)); // density-capped for mobile
  const ps = Array.from({ length: N }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 24,
  }));
  return { animated: true, frame(_t, dt) {
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < ps.length; i++) {          // links between near pairs
      for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          ctx.globalAlpha = 1 - Math.sqrt(d2) / 120;
          ctx.strokeStyle = color;
          ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1; ctx.fillStyle = color;
    for (const p of ps) { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); }
  }};
}
```

**Tune** — `N` density cap, link distance (`120`), speed. Drop the inner O(n²) link loop for
pure drifting dots (much cheaper); keep it only if the constellation *is* the effect.

---

## 2. Perlin/simplex noise field

A grid whose cells are modulated by a smooth noise value that scrolls over time — the soft,
breathing "organic dot-field". Noise is the engine behind this **and** the flow field below.

```js
// compact 2D value/Perlin noise, seeded, no deps. Returns ~[-1, 1]. Scale inputs DOWN.
function makeNoise(seed = 1) {
  const perm = new Uint8Array(512), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed >>> 0;
  for (let i = 255; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
                lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
  };
}

function setupNoiseField(ctx, w, h) {
  const color = cssVar(ctx.canvas, '--accent', '#6366f1');
  const noise = makeNoise(7);
  const gap = 26;
  return { animated: true, frame(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const n = noise(x / 220, y / 220 + t * 0.06);  // scale coords; scroll on time
        const r = Math.max(0, (n + 1) * 2.6);           // map [-1,1] -> radius
        ctx.globalAlpha = 0.25 + (n + 1) * 0.3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }};
}
```

**Tune** — `gap` (grid density), the `/220` noise zoom, and `t * 0.06` scroll speed. For higher
fidelity (no grid bias, seamless tiling) swap `makeNoise` for genjutsu's `SimplexNoise` (2D/3D) —
same call shape, and 3D lets you animate on a true `z` axis instead of offsetting `y`.

---

## 3. Flow field

Particles steered by a noise-derived angle grid, leaving trails — the signature generative look
(streams, silk, wind). Peak visual payoff; also the heaviest. Reserve for a true hero moment.

```js
function setupFlow(ctx, w, h) {
  const color = cssVar(ctx.canvas, '--accent', '#6366f1');
  const fadeRGB = cssVar(ctx.canvas, '--bg-rgb', '11,16,32'); // e.g. --bg-rgb: 11,16,32;
  const noise = makeNoise(42);
  const N = Math.min(900, Math.floor(w * h / 1600));
  const ps = Array.from({ length: N }, () => ({
    x: Math.random() * w, y: Math.random() * h, px: 0, py: 0, age: (Math.random() * 200) | 0,
  }));
  return { animated: true, frame(t) {
    ctx.fillStyle = `rgba(${fadeRGB},0.05)`;   // trail fade — never clearRect (kills the trail)
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (const p of ps) {
      p.px = p.x; p.py = p.y;
      const a = noise(p.x / 240, p.y / 240 + t * 0.02) * Math.PI * 2; // field angle
      p.x += Math.cos(a) * 1.4; p.y += Math.sin(a) * 1.4;
      if (++p.age > 260 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) { // respawn
        p.x = Math.random() * w; p.y = Math.random() * h; p.px = p.x; p.py = p.y; p.age = 0;
      }
      if (p.age > 0) { ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    }
  }};
}
```

**Tune** — `N` (particle count), step speed (`1.4`), noise zoom (`/240`), and the `0.05` trail-fade
alpha (lower = longer trails). Needs a dark surface + a `--bg-rgb` triple for the fade; on light
themes set `--bg-rgb` to your page background and it self-corrects.

---

## 4. L-system

String-rewriting + turtle graphics → fractal plants, curves, snowflakes. **Static** (draw once, no
loop). A drawn-in illustration or corner motif rather than a full field.

```js
const PRESETS = {
  plant: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iters: 5, step: 4 },
  koch:  { axiom: 'F--F--F', rules: { F: 'F+F--F+F' },              angle: 60, iters: 4, step: 4 },
};
function setupLSystem(ctx, w, h, preset = PRESETS.plant) {
  const color = cssVar(ctx.canvas, '--accent', '#88cc88');
  let cmds = preset.axiom;
  for (let i = 0; i < preset.iters; i++)            // expand (grows fast — keep iters 4–6)
    cmds = [...cmds].map(c => preset.rules[c] || c).join('');
  const ang = preset.angle * Math.PI / 180;
  return { animated: false, frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    let x = w / 2, y = h, a = -Math.PI / 2, depth = 0; const stack = [];
    for (const c of cmds) {
      if (c === 'F') {
        const nx = x + Math.cos(a) * preset.step, ny = y + Math.sin(a) * preset.step;
        ctx.globalAlpha = Math.max(0.15, 1 - depth * 0.15);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
        x = nx; y = ny;
      } else if (c === '+') a += ang;
      else if (c === '-') a -= ang;
      else if (c === '[') { stack.push([x, y, a, depth]); depth++; }
      else if (c === ']') { [x, y, a, depth] = stack.pop(); }
    }
    ctx.globalAlpha = 1;
  }};
}
```

**Tune** — `iters` (string length is exponential — 4–6 only), `angle`, `step`, start position.
More presets in the genjutsu reference: `sierpinski`, `dragon`, `tree`.

---

## 5. Fractals / subdivision

Recursive branching — a fractal tree by pure recursion (the space-subdivision cousin of the L-system).
**Static.** Good as a decorative anchor; add a slow sway only if it earns the hero slot.

```js
function setupFractalTree(ctx, w, h) {
  const color = cssVar(ctx.canvas, '--accent', '#6366f1');
  function branch(x, y, len, ang, depth) {
    if (depth === 0 || len < 3) return;
    const nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
    ctx.globalAlpha = Math.max(0.2, depth / 10);
    ctx.lineWidth = Math.max(0.5, depth * 0.6);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
    branch(nx, ny, len * 0.72, ang - 0.4, depth - 1);   // subdivide: two children
    branch(nx, ny, len * 0.72, ang + 0.42, depth - 1);
  }
  return { animated: false, frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    branch(w / 2, h, h * 0.22, -Math.PI / 2, 10);
    ctx.globalAlpha = 1;
  }};
}
```

**Tune** — recursion `depth`, length ratio (`0.72`), branch angles. Same recursion shape drives
midpoint-displacement terrain and quad subdivision — swap the body, keep the recursive frame.

---

## 6. Generative grid / Voronoi

Scatter seeds, color a coarse grid by nearest seed → cellular / stained-glass texture. **Static**
(a computed background, not an animation). The lazy Voronoi: nearest-neighbor at low resolution, no
polygon clipping.

```js
function setupVoronoi(ctx, w, h) {
  const a1 = cssVar(ctx.canvas, '--accent', '#6366f1');
  const a2 = cssVar(ctx.canvas, '--accent-2', '#ec4899');
  const SEEDS = 14, cell = 8;
  const seeds = Array.from({ length: SEEDS }, () => ({
    x: Math.random() * w, y: Math.random() * h, c: Math.random() < 0.5 ? a1 : a2,
  }));
  return { animated: false, frame() {
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        let best = Infinity, k = 0;
        for (let i = 0; i < SEEDS; i++) {           // nearest seed for this cell
          const dx = x - seeds[i].x, dy = y - seeds[i].y, d = dx * dx + dy * dy;
          if (d < best) { best = d; k = i; }
        }
        ctx.globalAlpha = 0.10 + (k / SEEDS) * 0.5; // ramp by seed index
        ctx.fillStyle = seeds[k].c;
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.globalAlpha = 1;
  }};
}
```

**Tune** — `SEEDS` count, `cell` resolution (smaller = smoother edges, more work), the two-color
mix. For crisp true-Voronoi edges use `cell = 2–4`; to animate, drift each seed slowly and set
`animated: true` — but a static computed texture is usually the right (lazy) call.

---

## Do-not (carried from genjutsu)

- **Never `clearRect` when you want trails** — fade with a translucent `fillRect` instead (see Flow).
- **Never `getImageData` in the loop** — it stalls on GPU readback. Sample once, cache.
- **Never allocate in the hot loop** — no `new`, no object literals per particle per frame.
  Pre-build arrays in `setup`, mutate in `frame`.
- **Always respect devicePixelRatio** — the mount helper does; don't bypass it.
- **Always return the cleanup fn** and call it on unmount, or the rAF loop leaks after navigation.
