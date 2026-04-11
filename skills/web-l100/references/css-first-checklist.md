# CSS-First Checklist

Before writing JavaScript for any UI behavior, check this list. If CSS can do it, use CSS — zero bundle cost, GPU-composited, no hydration needed.

## The Checklist

### Layout & Responsiveness
- [ ] **Component-responsive layout?** → Container Queries `@container (min-width: 400px)`
- [ ] **Parent-aware styling?** → `:has()` selector (e.g., `form:has(:invalid)`)
- [ ] **Quantity-aware layout?** → `:has()` counting (e.g., `ul:has(> li:nth-child(4))`)
- [ ] **Specificity conflicts?** → `@layer` architecture

### Interactive Components
- [ ] **Dropdown / menu?** → Popover API `popover="auto"` + Anchor Positioning
- [ ] **Tooltip?** → Popover `popover="hint"` + Anchor + CSS entry animation
- [ ] **Modal?** → `<dialog>` + `showModal()` (focus trap, backdrop, Esc — all free)
- [ ] **Toast / notification?** → Popover `popover="manual"` (no auto-dismiss of others)
- [ ] **Accordion / disclosure?** → `<details>` + `<summary>` with CSS transitions

### Scroll & Animation
- [ ] **Scroll reveal / fade-in?** → `animation-timeline: view()` + `animation-range: entry`
- [ ] **Scroll progress bar?** → `animation-timeline: scroll(root)` + scale transform
- [ ] **Parallax?** → `animation-timeline: scroll()` + translate keyframes
- [ ] **Header shrink on scroll?** → scroll-state query or `animation-timeline: scroll()` + range
- [ ] **Sticky detection?** → `@container scroll-state(stuck: top)` (Chrome 133+)

### Theming & Color
- [ ] **Dark mode?** → `light-dark()` function + `color-scheme: light dark`
- [ ] **Color palette?** → OKLCH for perceptually uniform colors
- [ ] **Hover/focus states?** → Pure CSS transitions on transform + opacity

### When JS IS Needed (don't fight it)
- Complex multi-step form logic with conditional fields
- Real-time data subscriptions (WebSocket)
- Drag-and-drop with complex constraints
- Canvas/WebGL rendering
- GSAP timeline sequencing with scrubbed scroll
- Spring physics animations (Motion)
- AI streaming interfaces
- Complex state machines (charts, editors)
