// e2e/copy.spec.ts — ATLAS v10.1.4. Rendered-copy sweep in CI, so the two
// copy regressions that slip through style passes regress LOUDLY:
// em dashes (the #1 AI prose tell — banned in shipped copy) and placeholder
// text. Runs over what the visitor READS (innerText of the served page), never
// source files — source carries comments/JSX that hide real hits and
// manufacture false ones (wiki/web-dev/build-workflow.md § Sweep the BUILT output).
//
// This is the deterministic subset only. The judgment layer — fact-drift vs
// source documents + tell-hunter — runs in-session per
// skills/impeccable/reference/copy-verification.md and cannot run in CI.
//
// Threshold note: audit-rules AR-38 BLOCKs at >=5 em dashes (a slop-DENSITY
// detector for the in-session audit); this CI gate fails at ONE by design —
// shipped copy is dash-free per the house style, and the allowlist is the
// escape hatch. Allowlist entries are EXACT rendered innerText lines (often a
// whole paragraph) and must be re-synced when that copy changes — keep them
// rare; if a project legitimately em-dashes throughout, loosen this spec in
// that repo, not here.
import { test, expect } from '@playwright/test';

const ROUTES = ['/'];

// Lines where an em dash is deliberate (rare — a quoted work's title, a legal
// name). Add the EXACT rendered line; anything else with U+2014 fails.
const EM_DASH_ALLOWLIST: string[] = [];

// TODO/TBD match case-SENSITIVELY: placeholder markers are conventionally
// uppercase, while "Add a todo" is real copy in half the demo apps ever built.
const PLACEHOLDER_CI = /lorem ipsum|\[placeholder\]|coming soon/i;
const PLACEHOLDER_CS = /\bTODO\b|\bTBD\b/;

for (const route of ROUTES) {
  test(`@copy ${route} rendered text is dash-clean and placeholder-free`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    const emDashHits = lines.filter((l) => l.includes('—') && !EM_DASH_ALLOWLIST.includes(l));
    expect(emDashHits, `em dash (U+2014) in rendered copy:\n${emDashHits.join('\n')}`).toEqual([]);

    const placeholderHits = lines.filter((l) => PLACEHOLDER_CI.test(l) || PLACEHOLDER_CS.test(l));
    expect(placeholderHits, `placeholder copy reached the rendered page:\n${placeholderHits.join('\n')}`).toEqual([]);
  });
}
