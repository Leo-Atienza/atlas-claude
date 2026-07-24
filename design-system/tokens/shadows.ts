/**
 * Soft, layered shadows. No harsh drop shadows. Each shadow is built from
 * two stacked layers — ambient + direct — which reads closer to real light.
 */

export const shadows = {
  none: 'none',

  xs: '0 1px 1px rgba(26, 22, 18, 0.03), 0 1px 2px rgba(26, 22, 18, 0.04)',

  sm: '0 1px 2px rgba(26, 22, 18, 0.04), 0 2px 4px rgba(26, 22, 18, 0.05)',

  md: '0 2px 4px rgba(26, 22, 18, 0.04), 0 6px 12px rgba(26, 22, 18, 0.06)',

  lg: '0 4px 8px rgba(26, 22, 18, 0.05), 0 16px 32px rgba(26, 22, 18, 0.08)',

  xl: '0 8px 16px rgba(26, 22, 18, 0.06), 0 32px 64px rgba(26, 22, 18, 0.12)',

  // Inset for pressed / sunken inputs.
  inset: 'inset 0 1px 2px rgba(26, 22, 18, 0.06)',

  // Focus ring — accent-tinted, not the default blue.
  focus: '0 0 0 3px rgba(176, 125, 40, 0.25)',
} as const;
