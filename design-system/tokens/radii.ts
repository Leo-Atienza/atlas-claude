/**
 * Tight radii. Premium aesthetic avoids giant pill buttons and
 * soft-edged dashboard cards. Max is md for most surfaces.
 */

export const radii = {
  none: '0',
  xs:   '0.125rem', // 2px — hairline chips
  sm:   '0.25rem',  // 4px — inputs, small buttons
  md:   '0.5rem',   // 8px — cards, default buttons
  lg:   '0.75rem',  // 12px — large cards, modals
  xl:   '1rem',     // 16px — hero surfaces
  full: '9999px',   // pills (use sparingly — tags, avatars)
} as const;
