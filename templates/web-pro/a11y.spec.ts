// e2e/a11y.spec.ts — ATLAS v9 C4 (Wave 5). WCAG 2.2 AA gate in CI via
// @axe-core/playwright, so a11y regresses LOUDLY not silently. WCAG 2.2 AA is
// now EU-law-backed (EAA, enforced 2025-06-28). Explicit tag set incl. 2.2.
//
// The automated pass can't catch the 2.2-specific criteria — those stay in the
// manual-judgment tail web-preflight prints: focus-not-obscured, target >=24px,
// dragging alternatives, accessible auth. Do NOT assume green here == fully AA.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/'];

for (const route of ROUTES) {
  test(`@a11y ${route} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toEqual([]);
  });
}
