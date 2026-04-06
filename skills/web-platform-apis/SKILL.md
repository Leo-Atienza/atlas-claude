<!--
id: SK-054
name: web-platform-apis
description: Modern Web Platform APIs — View Transitions, Popover, Anchor Positioning, Scroll Animations, Speculation Rules, WebGPU
keywords: view-transitions, popover, anchor-positioning, scroll-driven-animations, speculation-rules, navigation-api, trusted-types, webgpu, dialog, css-api
version: 1.0.0
-->

# Web Platform APIs — SK-046

## When to Use This Skill

Apply when implementing UI features that can use native browser APIs instead of JavaScript libraries. **Always prefer native APIs over JS libraries** when browser support is sufficient. Auto-activate on keywords: popover, tooltip, dropdown, smooth-scroll, page-transition, prerender, prefetch, anchor, dialog.

---

## 1. View Transitions API

### SPA (same-document) — Chrome 111+, Firefox 144+, Safari 18+

```js
document.startViewTransition(async () => {
  await updateDOM();
});
```

### MPA (cross-document) — Chrome 126+, Safari 18.2+

```css
@view-transition { navigation: auto; }

.hero-image { view-transition-name: hero; }

::view-transition-old(hero) { animation: fade-out 0.3s; }
::view-transition-new(hero) { animation: fade-in 0.3s; }
```

### Dynamic naming with pageswap/pagereveal (Chrome 126+)

```js
window.addEventListener('pagereveal', (e) => {
  if (e.viewTransition) {
    const targetUrl = new URL(navigation.activation.entry.url);
    // Set view-transition-name dynamically based on navigation target
    // e.g., document.querySelector(`[data-id="${targetUrl.searchParams.get('id')}"]`)
    //   ?.style.setProperty('view-transition-name', 'hero');
  }
});
```

### Integration with React/Next.js

```tsx
// Next.js App Router with View Transitions
'use client';
import { useRouter } from 'next/navigation';

function navigate(href: string) {
  const router = useRouter();
  if (!document.startViewTransition) {
    router.push(href);
    return;
  }
  document.startViewTransition(() => router.push(href));
}
```

### Progressive enhancement wrapper

```ts
export function withViewTransition(fn: () => void | Promise<void>) {
  if (!document.startViewTransition) return fn();
  return document.startViewTransition(fn).ready;
}
```

### CSS animation patterns

```css
/* Default cross-fade override */
::view-transition-old(root) {
  animation: slide-out 0.3s ease-in both;
}
::view-transition-new(root) {
  animation: slide-in 0.3s ease-out both;
}

@keyframes slide-out {
  to { transform: translateX(-100%); opacity: 0; }
}
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
}

/* Reduce motion */
@media (prefers-reduced-motion) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

---

## 2. Popover API

**Baseline since April 2024 — Chrome 114+, Firefox 125+, Safari 17+**

### Declarative, zero JS

```html
<!-- Auto type: light-dismiss, stacks with other popovers -->
<button popovertarget="menu">Open Menu</button>
<div id="menu" popover>
  <nav>Menu content with light-dismiss</nav>
</div>

<!-- Manual control: no light-dismiss, programmatic only -->
<div id="modal" popover="manual">
  <button popovertarget="modal" popovertargetaction="hide">Close</button>
</div>

<!-- Hint type for hover tooltips (Chrome 131+) -->
<button popovertarget="tip">Hover me</button>
<div id="tip" popover="hint">Tooltip text</div>
```

### Types

| Type | Light-dismiss | Stacking | Use case |
|------|--------------|----------|----------|
| `auto` | Yes | Closes others | Menus, dropdowns |
| `hint` | Yes | Layered above auto | Hover tooltips |
| `manual` | No | Does not close others | Notifications, drawers |

### CSS

```css
/* Open state */
[popover]:popover-open {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Entry animation with @starting-style */
[popover] {
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete;
  opacity: 0;
  transform: scale(0.95);
}
[popover]:popover-open {
  opacity: 1;
  transform: scale(1);
}
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Backdrop overlay */
[popover]::backdrop {
  background: hsl(0 0% 0% / 0.4);
  backdrop-filter: blur(2px);
}
```

### JavaScript API

```js
const popover = document.getElementById('menu');
popover.showPopover();
popover.hidePopover();
popover.togglePopover();

// Events
popover.addEventListener('beforetoggle', (e) => {
  console.log(e.oldState, e.newState); // 'closed'/'open'
});
popover.addEventListener('toggle', (e) => {
  if (e.newState === 'open') initPopoverContent();
});
```

---

## 3. CSS Anchor Positioning

**Chrome 125+, Safari 26+, Interop 2025 target**

**Replaces:** Floating UI, Popper.js, Tippy.js — zero JS required.

### Basic tooltip

```css
.trigger {
  anchor-name: --my-anchor;
}

.tooltip {
  position: absolute;
  position-anchor: --my-anchor;
  position-area: top center;
  /* Fallback order if no space */
  position-try-fallbacks: bottom center, right center, left center;
  margin-block-end: 8px;
  /* Optional: size relative to anchor */
  max-width: anchor-size(width);
}
```

### With Popover API (complete solution — zero JS)

```html
<button
  popovertarget="dropdown"
  style="anchor-name: --btn"
>
  Options
</button>

<ul
  id="dropdown"
  popover
  style="
    position: absolute;
    position-anchor: --btn;
    position-area: bottom span-left;
    margin-block-start: 4px;
  "
>
  <li>Edit</li>
  <li>Duplicate</li>
  <li>Delete</li>
</ul>
```

### Dynamic anchor (JS-set)

```js
// Register named anchor on element imperatively
trigger.style.anchorName = '--dynamic-anchor';
tooltip.style.positionAnchor = '--dynamic-anchor';
```

### Position area values

```css
/* Cardinal positions */
position-area: top;          /* centered above */
position-area: bottom start; /* left-aligned below */
position-area: inline-end;   /* after in inline direction */

/* Spanning */
position-area: top span-all; /* full width above */
position-area: center;       /* overlaps anchor center */
```

### Feature detection

```css
@supports (anchor-name: --test) {
  /* Use anchor positioning */
}
@supports not (anchor-name: --test) {
  /* Fallback: use Floating UI */
}
```

---

## 4. CSS Scroll-Driven Animations

**Chrome 115+, Firefox 110+, Safari 18+ (Baseline 2024)**

GPU-composited, zero JS, no jank.

### Fade-in on scroll into view

```css
@keyframes fade-in {
  from { opacity: 0; translate: 0 40px; }
  to   { opacity: 1; translate: 0; }
}

.card {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

### Scroll progress bar

```css
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: hsl(220 90% 56%);
  transform-origin: left;
  animation: grow linear both;
  animation-timeline: scroll(root);
}

@keyframes grow {
  from { scale: 0 1; }
  to   { scale: 1 1; }
}
```

### Parallax effect

```css
.parallax-bg {
  animation: parallax linear both;
  animation-timeline: scroll();
  animation-range: 0% 100%;
}

@keyframes parallax {
  from { translate: 0 -20%; }
  to   { translate: 0 20%; }
}
```

### Sticky header shrink

```css
.site-header {
  animation: shrink linear both;
  animation-timeline: scroll(root);
  animation-range: 0px 120px;
}

@keyframes shrink {
  from { padding: 1.5rem 2rem; font-size: 1.25rem; }
  to   { padding: 0.5rem 2rem; font-size: 1rem; }
}
```

### Named scroll timeline (scoped to container)

```css
.scroll-container {
  overflow-y: scroll;
  scroll-timeline: --list-scroll block;
}

.list-item {
  animation: reveal linear both;
  animation-timeline: --list-scroll;
  animation-range: entry 20% entry 80%;
}
```

### Key concepts

| Function | Description |
|----------|-------------|
| `scroll()` | Progress based on scroll position of container |
| `view()` | Progress based on element visibility in viewport |
| `entry` | Element entering the scrollport |
| `exit` | Element exiting the scrollport |
| `contain` | Element fully contained in scrollport |
| `cover` | Element covers entire scrollport |

### Progressive enhancement

```css
@supports (animation-timeline: scroll()) {
  .card {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
}
```

---

## 5. Speculation Rules API

**Chrome 121+ (prerender), Chrome 110+ (prefetch)**

Near-zero LCP on prerendered pages.

### Inline rules

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": { "href_matches": "/products/*" },
    "eagerness": "moderate"
  }],
  "prefetch": [{
    "where": { "and": [
      { "href_matches": "/*" },
      { "not": { "href_matches": "/checkout*" } },
      { "not": { "href_matches": "/account*" } }
    ]},
    "eagerness": "conservative"
  }]
}
</script>
```

### Eagerness levels

| Level | Triggers | Best for |
|-------|----------|----------|
| `immediate` | As soon as rules parsed | Critical next pages |
| `eager` | As early as possible | Likely next pages |
| `moderate` | On hover (200ms dwell) | Navigation links |
| `conservative` | On mousedown/touchstart | General links |

### Chrome limits

- `immediate`/`eager`: 2 concurrent prerenders max
- `moderate`/`conservative`: 10 concurrent prerenders max
- Prerender won't fire on low-memory devices or data-saver mode

### Dynamic injection (A/B testing, auth-aware)

```js
function injectSpeculationRules(rules) {
  if (!HTMLScriptElement.supports?.('speculationrules')) return;
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify(rules);
  document.head.append(script);
}

// Only prerender if logged in
if (userIsLoggedIn) {
  injectSpeculationRules({
    prerender: [{ urls: ['/dashboard'], eagerness: 'moderate' }]
  });
}
```

### Next.js 15+ integration

```js
// next.config.js
module.exports = {
  experimental: {
    speculationRules: {
      prerender: [{ source: 'list', where: { href_matches: '/**' }, eagerness: 'moderate' }]
    }
  }
};
```

---

## 6. Navigation API

**Chrome 102+, Edge. Polyfillable.**

Replaces `popstate` + `hashchange` with a unified, interruptible model.

### Intercept all navigations

```js
navigation.addEventListener('navigate', (event) => {
  // Only handle same-origin navigations
  if (!event.canIntercept) return;
  // Skip downloads and cross-origin
  if (event.downloadRequest !== null) return;

  event.intercept({
    async handler() {
      // Show loading state
      document.startViewTransition(async () => {
        const content = await fetchPage(event.destination.url);
        renderPage(content);
      });
    },
    // Abort signal if user navigates away before completion
    commit: 'after-transition',
  });
});
```

### Programmatic navigation

```js
// Navigate with state
await navigation.navigate('/profile', {
  state: { from: 'home', scrollY: window.scrollY }
});

// Back / forward
navigation.back();
navigation.forward();
navigation.traverseTo(navigation.entries()[2].key);

// Full history
const entries = navigation.entries(); // NavigationHistoryEntry[]
const current = navigation.currentEntry;
console.log(current.url, current.state, current.index);
```

### Reload with state

```js
navigation.reload({ state: { timestamp: Date.now() } });
```

---

## 7. `<dialog>` Element (Proper Usage)

**Baseline 2022 — all modern browsers**

### Modal dialog (blocks interaction)

```html
<dialog id="confirm-modal">
  <h2>Confirm action?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Confirm</button>
  </form>
</dialog>

<button onclick="document.getElementById('confirm-modal').showModal()">
  Delete
</button>

<script>
  const modal = document.getElementById('confirm-modal');
  modal.addEventListener('close', () => {
    if (modal.returnValue === 'confirm') performDelete();
  });
</script>
```

### Non-modal (side panel)

```html
<dialog id="details-panel">
  <button onclick="this.closest('dialog').close()">Close</button>
  <p>Side panel content</p>
</dialog>

<button onclick="document.getElementById('details-panel').show()">
  Open Panel
</button>
```

### CSS with entry/exit animations

```css
dialog {
  /* Reset browser defaults */
  border: none;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: min(90vw, 480px);

  /* Exit animation */
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete;
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

dialog[open] {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Entry animation */
@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
}

dialog::backdrop {
  background: hsl(0 0% 0% / 0.5);
  backdrop-filter: blur(4px);
  transition: opacity 0.2s, display 0.2s allow-discrete;
  opacity: 0;
}

dialog[open]::backdrop {
  opacity: 1;
}

@starting-style {
  dialog[open]::backdrop {
    opacity: 0;
  }
}
```

### Key points

- `showModal()` → top-layer, backdrop, focus trap, Esc to close — all free
- `show()` → non-modal, no backdrop, no focus trap
- `method="dialog"` on `<form>` auto-closes and sets `dialog.returnValue` to the button's `value`
- **Prefer `<dialog>` over custom modal implementations** — accessibility is built in (ARIA role, focus management, Esc key)
- Use `autofocus` on the primary action button
- Use `returnValue` to determine which button closed the dialog

---

## 8. Trusted Types (XSS Prevention)

**Chrome 83+ (enforced), others partial**

### Create a policy

```js
const policy = trustedTypes.createPolicy('default', {
  createHTML: (input) => DOMPurify.sanitize(input),
  createScriptURL: (input) => {
    const allowedOrigins = ['https://cdn.trusted.com', 'https://static.myapp.com'];
    const url = new URL(input, location.origin);
    if (allowedOrigins.includes(url.origin)) return input;
    throw new TypeError(`Blocked script URL: ${input}`);
  },
  createScript: () => { throw new TypeError('Inline scripts not allowed'); },
});

// Usage
element.innerHTML = policy.createHTML(userInput);   // Sanitized
script.src = policy.createScriptURL('/my-script.js'); // Allowlisted
```

### Enforcement via CSP

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types default
```

### Report-only mode (safe rollout)

```
Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; report-uri /csp-report
```

### Feature detection

```js
if (window.trustedTypes && trustedTypes.createPolicy) {
  // Apply policy
}
```

---

## 9. WebGPU Compute

**Chrome 113+, Edge, Firefox 141+, Safari 26+. ~70% global coverage**

### Device setup

```js
async function initWebGPU() {
  if (!navigator.gpu) throw new Error('WebGPU not supported');

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  });
  if (!adapter) throw new Error('No GPU adapter found');

  const device = await adapter.requestDevice();
  device.lost.then((info) => {
    console.error('GPU device lost:', info.message);
    if (info.reason !== 'destroyed') initWebGPU(); // Recover
  });

  return device;
}
```

### Compute shader (double array values)

```js
const device = await initWebGPU();

const module = device.createShaderModule({
  code: `
    @group(0) @binding(0) var<storage, read_write> data: array<f32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let i = id.x;
      if (i >= arrayLength(&data)) { return; }
      data[i] = data[i] * 2.0;
    }
  `,
});

const pipeline = device.createComputePipeline({
  layout: 'auto',
  compute: { module, entryPoint: 'main' },
});

// Upload data
const inputData = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
const buffer = device.createBuffer({
  size: inputData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(buffer, 0, inputData);

// Dispatch
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer } }],
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(Math.ceil(inputData.length / 64));
pass.end();
device.queue.submit([encoder.finish()]);
```

### Use cases

- On-device LLM inference (WebLLM, transformers.js)
- Real-time image processing and filters
- Physics simulation
- Data visualization and point cloud rendering
- Neural style transfer

---

## 10. Browser Support Decision Guide

| API | Baseline | Polyfill? | Use Today? |
|-----|----------|-----------|------------|
| `<dialog>` | 2022 | Not needed | Yes — always |
| Popover | 2024 | Yes (`popover-polyfill`) | Yes |
| View Transitions SPA | 2024 | Progressive enhance | Yes |
| View Transitions MPA | Partial | Progressive enhance | Yes (Chrome + Safari) |
| Scroll-Driven Animations | 2024 | Progressive enhance | Yes |
| CSS Anchor Positioning | Partial | Not yet | Progressive enhance |
| Speculation Rules | Chrome only | No | Yes (progressive) |
| Navigation API | Chrome/Edge | Polyfill available | Cautious |
| Trusted Types | Chrome | No | Defense-in-depth |
| WebGPU | ~70% | No | Feature-detect required |

### Progressive enhancement pattern

```js
// View Transitions
if (document.startViewTransition) {
  document.startViewTransition(() => update());
} else {
  update();
}

// Speculation Rules
if (HTMLScriptElement.supports?.('speculationrules')) {
  injectSpeculationRules(rules);
}

// Navigation API
if ('navigation' in window) {
  navigation.addEventListener('navigate', handler);
} else {
  window.addEventListener('popstate', legacyHandler);
}

// WebGPU
if (navigator.gpu) {
  await runGPUPipeline();
} else {
  runCPUFallback();
}
```

### CSS feature detection

```css
/* Scroll-driven animations */
@supports (animation-timeline: scroll()) {
  .animated { animation-timeline: view(); }
}

/* Anchor positioning */
@supports (anchor-name: --test) {
  .tooltip { position-anchor: --trigger; }
}

/* @starting-style */
@supports (selector(dialog[open])) {
  @starting-style { dialog[open] { opacity: 0; } }
}
```

---

## 11. API Replacement Matrix

| Old pattern | Native replacement | Since |
|-------------|-------------------|-------|
| Floating UI / Popper.js | CSS Anchor Positioning + Popover | Chrome 125 |
| Custom modal + focus trap | `<dialog>` + `showModal()` | Baseline 2022 |
| IntersectionObserver animations | Scroll-Driven Animations | Baseline 2024 |
| SPA router page transitions | View Transitions API | Chrome 111 |
| `history.pushState` + `popstate` | Navigation API | Chrome 102 |
| `<link rel="prefetch">` | Speculation Rules | Chrome 110 |
| `innerHTML` + DOMPurify direct | Trusted Types + DOMPurify | Chrome 83 |

---

## 12. Common Pitfalls

**View Transitions**
- `view-transition-name` must be unique per page at the time of transition — remove duplicate names before calling `startViewTransition`
- Cross-document transitions require both pages to opt in with `@view-transition { navigation: auto; }`
- Use `::view-transition-group(*)` to globally control timing

**Popover**
- `popover="auto"` closes all other `auto` popovers — use `manual` when building toast stacks
- The popover element must not be inside another element with `overflow: hidden` — it renders in the top layer
- `popovertarget` only works on `<button>` and `<input type="button">` elements

**Scroll-Driven Animations**
- `animation-fill-mode: both` is almost always required
- Container must have a defined scroll height — check `overflow` is set on the scroll container
- `view()` respects `scroll-margin` and `scroll-padding`

**`<dialog>`**
- Always provide a visible close mechanism — relying on Esc alone fails in some AT
- `returnValue` is only set by `<form method="dialog">` submit — `dialog.close()` does not set it unless you pass a value: `dialog.close('cancel')`
- Test with VoiceOver/NVDA — focus management matters

**Anchor Positioning**
- Anchors in `position: fixed` containers may not work as expected — anchors must share a formatting context
- `position-try-fallbacks` only tries listed fallbacks, not exhaustive positions

**Speculation Rules**
- Never prerender authenticated pages served without proper cache headers — risk serving stale auth state
- `prerender` does not execute in iframes — full page context only
- Avoid prerending checkout or cart mutation pages
