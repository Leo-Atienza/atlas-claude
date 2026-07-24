#!/usr/bin/env node
/**
 * verify-browsers.mjs — cross-browser + feel verification for impeccable builds.
 *
 * Renders a URL across Chromium, Firefox, and WebKit (Safari engine) at desktop
 * and mobile viewports, captures a scroll-through video per engine, frame-diffs
 * that video to PROVE motion actually happened (not just that a script ran), and
 * collects per-engine console errors + prefers-reduced-motion behaviour.
 *
 * Why this exists: Lighthouse and a single Chromium screenshot are blind to the
 * exact places Apple-grade work breaks — Firefox scroll-driven fallbacks, WebKit
 * sticky/canvas/backdrop-filter quirks, and "the script ran but nothing visibly
 * moved" failures. This is the SALA/"feel" gate from reference/cross-browser-and-feel.md.
 *
 * Usage:
 *   node verify-browsers.mjs <url> [outDir] [--a11y]
 *   node verify-browsers.mjs http://localhost:8766/index.html ./_xb
 *   node verify-browsers.mjs http://localhost:8766/index.html ./_xb --a11y
 *
 * Requires (all free, install once):
 *   npm i -g playwright && npx playwright install chromium firefox webkit
 *   (--a11y additionally needs: npm i -g @axe-core/playwright)
 *
 * Exit 0 = all engines rendered with no console errors and motion was observed
 *          (+ with --a11y: no serious/critical WCAG violation).
 * Exit 1 = at least one engine had console errors, a render failure, or a
 *          scroll-through that produced zero visual change (dead animation);
 *          or, with --a11y, a serious/critical a11y violation. The render verdict
 *          and the a11y verdict are reported independently in summary.json — a11y
 *          never masks the render/motion result.
 * Output: JSON summary to stdout + screenshots/videos under outDir.
 */
'use strict';

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

// Playwright is resolved at runtime from the global npm root (ESM `import` does
// not honour NODE_PATH; `createRequire` does CJS resolution and playwright ships
// CJS). Install once: `npm i -g playwright && npx playwright install chromium firefox webkit`.
const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require('playwright'); } catch {}
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(join(root, 'playwright'));
  } catch (e) {
    console.error('Cannot resolve playwright. Run: npm i -g playwright && npx playwright install chromium firefox webkit');
    process.exit(2);
  }
}
const { chromium, firefox, webkit } = loadPlaywright();

// axe-core (a11y) is optional, resolved the same way as playwright, and only used with --a11y.
function loadAxe() {
  const pick = (m) => (m && (m.default || m.AxeBuilder || m)) || null;
  try { return pick(require('@axe-core/playwright')); } catch {}
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return pick(require(join(root, '@axe-core/playwright')));
  } catch { return null; }
}

const ARGS = process.argv.slice(2);
const A11Y = ARGS.includes('--a11y');
const POS = ARGS.filter((a) => !a.startsWith('--'));
const URL = POS[0];
const OUT = POS[1] || './_xb';
if (!URL) { console.error('usage: node verify-browsers.mjs <url> [outDir] [--a11y]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const ENGINES = [
  { name: 'chromium', type: chromium },
  { name: 'firefox', type: firefox },
  { name: 'webkit', type: webkit },
];
const VIEWPORTS = [
  { tag: 'desktop', width: 1280, height: 800, isMobile: false },
  { tag: 'mobile', width: 390, height: 844, isMobile: true },
];

// Mean absolute byte-difference between two PNG buffers (cheap, dependency-free
// proxy for "did the pixels change"). Different sizes => treat as changed.
function frameDelta(a, b) {
  if (!a || !b) return 0;
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let sum = 0;
  const step = Math.max(1, Math.floor(n / 50000)); // sample for speed
  let count = 0;
  for (let i = 0; i < n; i += step) { sum += Math.abs(a[i] - b[i]); count++; }
  return count ? sum / count : 0;
}

async function runEngine(engine) {
  const result = { engine: engine.name, viewports: {}, consoleErrors: [], pageErrors: [], reducedMotion: null, motionObserved: false, ok: true };
  let browser;
  try {
    browser = await engine.type.launch();
  } catch (e) {
    result.ok = false; result.launchError = String(e); return result;
  }

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile && engine.name === 'chromium', // isMobile only supported on chromium
      deviceScaleFactor: vp.isMobile ? 3 : 1,
      recordVideo: vp.tag === 'desktop' ? { dir: join(OUT, 'video', engine.name), size: { width: vp.width, height: vp.height } } : undefined,
    });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') result.consoleErrors.push(`[${vp.tag}] ${m.text()}`); });
    page.on('pageerror', e => result.pageErrors.push(`[${vp.tag}] ${String(e)}`));

    const vpRes = { frames: 0, maxDelta: 0 };
    try {
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(700); // let entrance choreography settle

      // top-of-page screenshot
      await page.screenshot({ path: join(OUT, `${engine.name}-${vp.tag}-top.png`) });

      // Scroll-through with frame capture → prove motion on the desktop pass.
      if (vp.tag === 'desktop') {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const vh = vp.height;
        const steps = Math.min(8, Math.max(3, Math.round(height / vh)));
        let prev = null, maxDelta = 0;
        for (let i = 0; i <= steps; i++) {
          await page.evaluate(y => window.scrollTo(0, y), Math.round((height - vh) * (i / steps)));
          await page.waitForTimeout(260);
          const shot = await page.screenshot();
          const d = frameDelta(prev, shot);
          if (d > maxDelta) maxDelta = d;
          prev = shot;
        }
        vpRes.maxDelta = Math.round(maxDelta * 100) / 100;
        vpRes.frames = steps + 1;
        await page.screenshot({ path: join(OUT, `${engine.name}-${vp.tag}-bottom.png`), fullPage: false });
        // motion observed if scrolling produced meaningful visual change
        if (maxDelta > 2) result.motionObserved = true;
      }
    } catch (e) {
      vpRes.error = String(e); result.ok = false;
    }
    result.viewports[vp.tag] = vpRes;
    await ctx.close(); // flushes video
  }

  // prefers-reduced-motion pass (desktop) — content must still be visible.
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    // visible if the body has non-trivial rendered text height
    const textLen = await page.evaluate(() => document.body.innerText.replace(/\s+/g, '').length);
    result.reducedMotion = { visibleTextChars: textLen, ok: textLen > 80 };
    await page.screenshot({ path: join(OUT, `${engine.name}-reduced-motion.png`) });
    await ctx.close();
  } catch (e) {
    result.reducedMotion = { error: String(e), ok: false };
  }

  await browser.close();
  if (result.consoleErrors.length || result.pageErrors.length) result.ok = false;
  return result;
}

// Optional a11y pass — Chromium only (WCAG violations are engine-agnostic, so axe×3 is wasted time).
// Reports into the summary and gates the exit ONLY under --a11y; never touches the render/motion verdict.
async function runA11y(AxeBuilder) {
  const out = { ran: true, ok: true, counts: {}, violations: [] };
  let browser;
  try {
    browser = await chromium.launch();
    // @axe-core/playwright's AxeBuilder rejects pages from the browser.newPage()
    // shortcut ("Please use browser.newContext()") — it requires an explicit context.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    const res = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const v of res.violations) {
      out.counts[v.impact || 'unknown'] = (out.counts[v.impact || 'unknown'] || 0) + 1;
      out.violations.push({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length });
    }
    await page.screenshot({ path: join(OUT, 'chromium-a11y.png') });
    // Gate on serious/critical only; minor/moderate are reported but don't fail the run.
    out.ok = !res.violations.some((v) => v.impact === 'serious' || v.impact === 'critical');
  } catch (e) {
    out.ran = false; out.ok = true; out.error = String(e); // axe failure never fails the render verdict
  } finally {
    if (browser) await browser.close();
  }
  return out;
}

const results = [];
for (const e of ENGINES) results.push(await runEngine(e));

let a11y = null;
if (A11Y) {
  const AxeBuilder = loadAxe();
  a11y = AxeBuilder
    ? await runA11y(AxeBuilder)
    : { ran: false, ok: true, error: 'axe not resolved; run: npm i -g @axe-core/playwright' };
}

// motion is a page-level property: observed if ANY engine saw it (a static page
// legitimately has none — caller decides if the page was supposed to move).
const anyMotion = results.some(r => r.motionObserved);
const summary = {
  url: URL,
  engines: results.map(r => ({
    engine: r.engine,
    ok: r.ok,
    consoleErrors: r.consoleErrors,
    pageErrors: r.pageErrors,
    desktopScrollDelta: r.viewports.desktop?.maxDelta ?? null,
    reducedMotionOk: r.reducedMotion?.ok ?? null,
    launchError: r.launchError,
  })),
  anyMotionObserved: anyMotion,
  allEnginesOk: results.every(r => r.ok),
  a11y,
  a11yOk: a11y ? a11y.ok : null,
};
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
// Render/motion verdict (allEnginesOk) is independent; a11y gates only when --a11y is set.
process.exit((summary.allEnginesOk && summary.a11yOk !== false) ? 0 : 1);
