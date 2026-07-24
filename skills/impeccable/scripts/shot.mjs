#!/usr/bin/env node
/**
 * shot.mjs — headless screenshot + mechanical-render gate.
 *
 * The persisted fallback for visual verification. Use it whenever the in-app
 * Browser pane can't serve (see the two failure modes below) — and by default
 * for any autonomous run, because headless works with no pane open at all.
 *
 * WHY THIS EXISTS (diagnosed 2026-07-23). The Browser pane fails two distinct
 * ways that read as one flaky tool:
 *   1. "No site is open in this tab" — the target is OUTSIDE the project
 *      folder, so the pane inlines it as a `data:` static snapshot. A snapshot
 *      has no live page to capture. (Tell: tabs_context shows `(data:)`
 *      instead of `(file:)`.) Fix: move the file into the project folder, or
 *      use this script.
 *   2. "Screenshot timed out after 5s: the Browser pane is not displayed" —
 *      the pane is closed in the desktop UI, so it composites no frames.
 *      Only the user can fix that, by opening the pane. This script doesn't care.
 * Neither is flakiness, and neither is fixed by retrying.
 *
 * Usage:
 *   node shot.mjs <url-or-path> <out.png> [--viewport 1280x900] [--wait 300]
 *                                          [--clip-viewport] [--json <file>]
 *                                          [--diff <baseline.png>] [--diff-threshold 1]
 *                                          [--diff-out <diff.png>]
 *
 * Exit 0 = rendered clean. Exit 1 = MECHANICALLY BROKEN (navigation failure,
 * page error, console error, or a failed subresource) — matching craft.md
 * step 4's gate: a build that fails this isn't ready to be judged on design.
 * Advisory findings (horizontal overflow, dead in-page anchors) are reported
 * but never fail the run — they are design questions, not render failures.
 *
 * VISUAL REGRESSION (--diff, v10.3.0): compares the fresh screenshot against a
 * baseline PNG pixel-by-pixel inside the already-open Chromium (no image deps).
 * First run with a missing baseline SEEDS it (exit 0, `seeded: true`). Later
 * runs exit 1 when changed-pixel % exceeds --diff-threshold (default 1%) or
 * the dimensions changed. --diff-out writes a red-overlay diff PNG for eyes.
 * Per-channel tolerance of 12/255 absorbs antialiasing jitter; renders are
 * same-machine/same-viewport so anything above that is a real change.
 * Intentional redesign? Delete or overwrite the baseline to re-seed.
 */
'use strict';

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const die = (m) => { console.error(`shot: ${m}`); process.exit(2); };

// Playwright commonly lives at the GLOBAL npm root on this machine, which no
// amount of cwd-relative importing will find. Try local first, then global.
function loadPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch { /* fall through */ }
  let root;
  try { root = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { die('playwright not resolvable and `npm root -g` failed. Install: npm i -g playwright'); }
  try { return createRequire(join(root, 'noop.js'))('playwright'); }
  catch { die(`playwright not found locally or at ${root}. Install: npm i -g playwright && npx playwright install chromium`); }
}

const ARGS = process.argv.slice(2);
const flag = (f, d = null) => { const i = ARGS.indexOf(f); return i !== -1 && ARGS[i + 1] ? ARGS[i + 1] : d; };
const positional = ARGS.filter((a, i) => !a.startsWith('--') && !(i > 0 && ARGS[i - 1].startsWith('--') && ARGS[i - 1] !== '--clip-viewport'));

const [target, out] = positional;
if (!target || !out) die('usage: shot.mjs <url-or-path> <out.png> [--viewport 1280x900] [--wait 300] [--clip-viewport] [--json <file>]');

// A bare path is the common case — accept it and convert.
const url = /^[a-z]+:\/\//i.test(target) || target.startsWith('data:')
  ? target
  : (existsSync(resolve(target)) ? pathToFileURL(resolve(target)).href : die(`no such file: ${target}`));

const [vw, vh] = (flag('--viewport', '1280x900')).split('x').map(Number);
if (!vw || !vh) die('--viewport must look like 1280x900');
const waitMs = Number(flag('--wait', '300'));

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

const consoleErrors = [], pageErrors = [], failedRequests = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('requestfailed', (r) => failedRequests.push(`${r.url()} — ${r.failure()?.errorText ?? 'failed'}`));
page.on('response', (r) => r.status() >= 400 && failedRequests.push(`${r.url()} — HTTP ${r.status()}`));

let navError = null;
try {
  // 'load', never 'networkidle' — analytics beacons never idle.
  await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: resolve(out), fullPage: !ARGS.includes('--clip-viewport') });
} catch (e) {
  navError = String(e).split('\n')[0];
}

const advisory = navError ? {} : await page.evaluate(() => {
  const de = document.documentElement;
  const dead = [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && h !== '#' && !document.getElementById(h.slice(1)));
  return {
    title: document.title || null,
    horizontalOverflow: de.scrollWidth > de.clientWidth,
    deadAnchors: [...new Set(dead)],
  };
});

// ── Visual regression (--diff) ──────────────────────────────────────
// Runs on a fresh about:blank page (never the target page — its CSP could
// block data: images). Pure-Chromium pixel compare: no pngjs/pixelmatch dep.
const diffBaseline = flag('--diff');
const diffThreshold = Number(flag('--diff-threshold', '1'));
let diff = null;
if (diffBaseline && !navError) {
  const basePath = resolve(diffBaseline);
  if (!existsSync(basePath)) {
    copyFileSync(resolve(out), basePath);
    diff = { baseline: basePath, seeded: true, changedPct: 0 };
  } else {
    const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
    const dpage = await browser.newPage();
    const r = await dpage.evaluate(async ([a, b]) => {
      const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('decode failed')); i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      if (ia.width !== ib.width || ia.height !== ib.height) {
        return { sizeMismatch: true, baselineSize: `${ia.width}x${ia.height}`, currentSize: `${ib.width}x${ib.height}` };
      }
      const ctx = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return x; };
      const da = ctx(ia).getImageData(0, 0, ia.width, ia.height).data;
      const xb = ctx(ib);
      const cur = xb.getImageData(0, 0, ib.width, ib.height);
      const db = cur.data;
      const TOL = 12; // per-channel; absorbs antialiasing jitter on same-machine renders
      let changed = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        if (d > TOL) { changed++; db[i] = 255; db[i + 1] = 0; db[i + 2] = 0; db[i + 3] = 255; }
        else { db[i + 3] = 70; } // dim unchanged pixels so the overlay reads at a glance
      }
      const oc = document.createElement('canvas'); oc.width = ib.width; oc.height = ib.height;
      oc.getContext('2d').putImageData(cur, 0, 0);
      return { changed, total: da.length / 4, overlay: oc.toDataURL('image/png') };
    }, [b64(basePath), b64(resolve(out))]).catch((e) => ({ error: String(e).split('\n')[0] }));

    if (r.error) diff = { baseline: basePath, error: r.error };
    else if (r.sizeMismatch) diff = { baseline: basePath, sizeMismatch: true, baselineSize: r.baselineSize, currentSize: r.currentSize, changedPct: 100 };
    else {
      const changedPct = Math.round((r.changed / r.total) * 10000) / 100;
      diff = { baseline: basePath, changedPct, changedPixels: r.changed, totalPixels: r.total, threshold: diffThreshold };
      const diffOut = flag('--diff-out');
      if (diffOut && r.overlay) writeFileSync(resolve(diffOut), Buffer.from(r.overlay.split(',')[1], 'base64'));
    }
  }
}

await browser.close();

const broken = Boolean(navError) || pageErrors.length || consoleErrors.length || failedRequests.length;
const regression = Boolean(diff && !diff.seeded && !diff.error && (diff.sizeMismatch || diff.changedPct > diffThreshold));
const report = {
  url,
  screenshot: broken && navError ? null : resolve(out),
  verdict: broken ? 'BROKEN' : regression ? 'VISUAL-REGRESSION' : 'CLEAN',
  ...advisory,
  ...(diff && { diff }),
  navError,
  pageErrors,
  consoleErrors,
  failedRequests,
};

console.log(JSON.stringify(report, null, 2));
const jsonOut = flag('--json');
if (jsonOut) writeFileSync(resolve(jsonOut), JSON.stringify(report, null, 2) + '\n');

if (broken) {
  console.error('\nshot: MECHANICALLY BROKEN — fix the render before judging the design (craft.md step 4).');
  process.exit(1);
}
if (regression) {
  console.error(`\nshot: VISUAL REGRESSION — ${diff.sizeMismatch ? `dimensions changed ${diff.baselineSize} → ${diff.currentSize}` : `${diff.changedPct}% of pixels changed (threshold ${diffThreshold}%)`} vs ${diff.baseline}. Intentional redesign? Re-seed by deleting the baseline.`);
  process.exit(1);
}
