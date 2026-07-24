/**
 * Warm, editorial palette. Single accent. Semantic layer uses muted tones,
 * not saturated UI-kit colors. Dark mode is a first-class mirror — values
 * chosen so contrast ratios hold, not by simple inversion.
 */

export const colors = {
  // Neutrals — paper + ink. Cream base avoids the sterile feel of pure white.
  paper: {
    50: '#FBF8F3',   // page background (light)
    100: '#F5F0E8',  // elevated surface (light)
    200: '#ECE4D7',  // hairline borders
    300: '#D9CDB9',
    400: '#B7A78D',
    500: '#8F7F67',
    600: '#6B5E4B',
    700: '#4A4135',
    800: '#2E2820',
    900: '#1A1612',  // page background (dark)
    950: '#0F0D0A',  // deepest ink
  },

  // Ink — primary text.
  ink: {
    DEFAULT: '#1A1612',
    muted: '#4A4135',
    subtle: '#6B5E4B',
    inverse: '#FBF8F3',
  },

  // Accent — single warm tone. Muted ochre, not saturated orange.
  accent: {
    50: '#FBF5EC',
    100: '#F5E7CC',
    200: '#EBD199',
    300: '#DDB562',
    400: '#C9983C',
    500: '#B07D28',  // primary accent
    600: '#8D6320',
    700: '#6B4A18',
    800: '#4A3310',
    900: '#2E200A',
  },

  // Semantic — muted, editorial. Not the usual green/red/yellow.
  success: '#5C7A4E',
  warn:    '#B07D28',
  danger:  '#9E4A3E',
  info:    '#4E6F7A',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Semantic aliases — what components reference. Tokens above are the
 * source of truth; these are the consumable names.
 */
export const semantic = {
  light: {
    background: colors.paper[50],
    surface:    colors.paper[100],
    border:     colors.paper[200],
    ink:        colors.ink.DEFAULT,
    inkMuted:   colors.ink.muted,
    inkSubtle:  colors.ink.subtle,
    accent:     colors.accent[500],
    accentHover: colors.accent[600],
    onAccent:   colors.paper[50],
  },
  dark: {
    background: colors.paper[950],
    surface:    colors.paper[900],
    border:     colors.paper[800],
    ink:        colors.paper[50],
    inkMuted:   colors.paper[300],
    inkSubtle:  colors.paper[400],
    accent:     colors.accent[400],
    accentHover: colors.accent[300],
    onAccent:   colors.paper[950],
  },
} as const;
