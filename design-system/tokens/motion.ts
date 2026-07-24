/**
 * Motion tokens. GSAP-friendly easings + durations. Motion is part of
 * the brand — generous, confident, not jittery.
 */

export const duration = {
  instant: 0,
  fast:    150,     // micro-interactions (hover, focus)
  base:    250,     // default component transition
  slow:    400,     // panels, modals
  deliberate: 700,  // hero entrances, reveals
  cinematic: 1200,  // scroll-triggered scenes
} as const;

/**
 * Easings. Named for intent, not the curve. Values are cubic-bezier
 * strings so they work in both CSS and GSAP.
 */
export const easing = {
  // Linear — only for indeterminate progress.
  linear: 'cubic-bezier(0, 0, 1, 1)',

  // Standard — default for any transition.
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Enter — element coming into view.
  enter: 'cubic-bezier(0, 0, 0.2, 1)',

  // Exit — element leaving.
  exit: 'cubic-bezier(0.4, 0, 1, 1)',

  // Editorial — slow start, late settle. Use for hero reveals.
  editorial: 'cubic-bezier(0.2, 0.8, 0.2, 1)',

  // Spring-like overshoot. Use sparingly — small accents only.
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Respect reduced-motion — every animation should honor this check
 * or use a CSS media query at the call site.
 */
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
