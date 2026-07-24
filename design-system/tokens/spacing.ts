/**
 * 4px base spacing scale. Generous at the top — premium layouts breathe.
 */

export const spacing = {
  0:   '0',
  0.5: '0.125rem', // 2px
  1:   '0.25rem',  // 4px
  1.5: '0.375rem',
  2:   '0.5rem',
  3:   '0.75rem',
  4:   '1rem',
  5:   '1.25rem',
  6:   '1.5rem',
  7:   '1.75rem',
  8:   '2rem',
  10:  '2.5rem',
  12:  '3rem',
  14:  '3.5rem',
  16:  '4rem',
  20:  '5rem',
  24:  '6rem',
  28:  '7rem',
  32:  '8rem',   // typical section break
  40:  '10rem',
  48:  '12rem',
  56:  '14rem',
  64:  '16rem',  // hero breathing room
} as const;

/**
 * Layout constants — max widths for readable line length + hero blocks.
 */
export const layout = {
  prose: '65ch',       // long-form reading
  narrow: '40rem',     // forms, auth cards
  content: '72rem',    // default page content
  wide: '88rem',       // editorial hero
  ultra: '104rem',     // full-bleed dashboards
} as const;
