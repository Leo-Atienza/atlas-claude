/**
 * Editorial type system. Serif display for weight + personality, geometric
 * sans for body, mono for code. Scale favors readability over density —
 * this is not a dashboard system.
 */

export const fontFamily = {
  display: '"Fraunces", "Instrument Serif", "Iowan Old Style", Georgia, serif',
  sans:    '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:    '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

/**
 * Type scale — modular, 1.25 ratio at the top end to 1.15 at body.
 * Values in rem so the user's browser zoom still works.
 */
export const fontSize = {
  xs:   ['0.75rem',  { lineHeight: '1.1rem',   letterSpacing: '0.01em' }],
  sm:   ['0.875rem', { lineHeight: '1.35rem',  letterSpacing: '0' }],
  base: ['1rem',     { lineHeight: '1.6rem',   letterSpacing: '-0.005em' }],
  lg:   ['1.125rem', { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],
  xl:   ['1.25rem',  { lineHeight: '1.85rem',  letterSpacing: '-0.01em' }],
  '2xl':['1.5rem',   { lineHeight: '2rem',     letterSpacing: '-0.015em' }],
  '3xl':['2rem',     { lineHeight: '2.4rem',   letterSpacing: '-0.02em' }],
  '4xl':['2.75rem',  { lineHeight: '3rem',     letterSpacing: '-0.025em' }],
  '5xl':['3.75rem',  { lineHeight: '4rem',     letterSpacing: '-0.03em' }],
  '6xl':['5rem',     { lineHeight: '5.2rem',   letterSpacing: '-0.035em' }],
  '7xl':['6.5rem',   { lineHeight: '6.5rem',   letterSpacing: '-0.04em' }],
} as const;

export const fontWeight = {
  regular: 400,
  medium:  500,
  semibold: 600,
  bold:    700,
} as const;

/**
 * Named roles — what components should use instead of raw sizes.
 */
export const textStyle = {
  hero:      { family: 'display', size: '7xl', weight: 'regular' },
  display:   { family: 'display', size: '5xl', weight: 'regular' },
  h1:        { family: 'display', size: '4xl', weight: 'regular' },
  h2:        { family: 'display', size: '3xl', weight: 'regular' },
  h3:        { family: 'sans',    size: '2xl', weight: 'semibold' },
  h4:        { family: 'sans',    size: 'xl',  weight: 'semibold' },
  lead:      { family: 'sans',    size: 'lg',  weight: 'regular' },
  body:      { family: 'sans',    size: 'base', weight: 'regular' },
  caption:   { family: 'sans',    size: 'sm',  weight: 'regular' },
  overline:  { family: 'sans',    size: 'xs',  weight: 'medium' },
  code:      { family: 'mono',    size: 'sm',  weight: 'regular' },
} as const;
