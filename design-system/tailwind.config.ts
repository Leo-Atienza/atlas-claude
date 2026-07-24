import type { Config } from 'tailwindcss';
import { colors } from './tokens/colors';
import { fontFamily, fontSize, fontWeight } from './tokens/typography';
import { spacing } from './tokens/spacing';
import { radii } from './tokens/radii';
import { shadows } from './tokens/shadows';
import { duration, easing } from './tokens/motion';

/**
 * Tailwind v4 config. Tokens drive utilities — never hardcode values
 * in components. Semantic class names (`bg-background`, `text-ink`)
 * resolve to CSS vars declared in globals.css so dark mode works via
 * `[data-theme="dark"]` on the root.
 */
const config: Config = {
  content: ['./components/**/*.{ts,tsx}', './examples/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Raw palette — use sparingly, prefer semantic tokens.
        paper:  colors.paper,
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
          ...colors.accent,
        },
        success: colors.success,
        warn:    colors.warn,
        danger:  colors.danger,
        info:    colors.info,

        // Semantic tokens — bound to CSS vars, switch with data-theme.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface:    'rgb(var(--color-surface) / <alpha-value>)',
        border:     'rgb(var(--color-border) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted:   'rgb(var(--color-ink-muted) / <alpha-value>)',
          subtle:  'rgb(var(--color-ink-subtle) / <alpha-value>)',
        },
        'on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',
      },
      fontFamily: {
        display: fontFamily.display.split(','),
        sans:    fontFamily.sans.split(','),
        mono:    fontFamily.mono.split(','),
      },
      fontSize: fontSize as Config['theme']['fontSize'],
      fontWeight: fontWeight as unknown as Config['theme']['fontWeight'],
      spacing: spacing as unknown as Config['theme']['spacing'],
      borderRadius: radii,
      boxShadow: shadows,
      transitionDuration: Object.fromEntries(
        Object.entries(duration).map(([k, v]) => [k, `${v}ms`]),
      ),
      transitionTimingFunction: easing,
    },
  },
  plugins: [],
};

export default config;
