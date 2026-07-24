#!/usr/bin/env node
/**
 * web-preflight.mjs — the professional-website completeness gate.
 *
 * The other impeccable gates check the QUALITY of what exists (audit-rules =
 * anti-slop, verify-browsers = render/motion/a11y, lighthouse = perf). This one
 * checks what a high-grade professional site MUST HAVE — the boring existence
 * layer where AI-built sites quietly read "amateur": 404/error pages, favicon
 * set, per-route metadata, lang attribute, robots/sitemap, real copy, a font
 * strategy, and the Next.js security floor.
 *
 * Static checks are Next.js App Router-aware (the primary stack); on a non-Next
 * project it degrades to the generic content checks and SKIPs the rest.
 *
 * Usage:
 *   node web-preflight.mjs [--dir <path>] [--url <url>] [--public] [--strict] [--json]
 *     --dir     project root (default: cwd)
 *     --url     also run verify-browsers.mjs <url> ./_xb --a11y and fold in its verdict
 *     --public  public marketing/content site: robots + sitemap escalate WARN -> FAIL
 *     --strict  all warnings count as failures
 *     --json    machine-readable output only
 *
 * Exit 0 = no failures (ship-ready on completeness; warnings may remain)
 * Exit 1 = at least one failure (or, with --strict, warning)
 * Exit 2 = usage/setup error
 *
 * File conventions verified against nextjs.org docs v16.2.10 (2026-07-04):
 * not-found.js, error.js/global-error.js, loading.js, favicon/icon/apple-icon,
 * opengraph-image/twitter-image, robots.txt|ts, sitemap.xml|ts, manifest.
 */
'use strict';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ARGS = process.argv.slice(2);
const flagVal = (name) => { const i = ARGS.indexOf(name); return i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : null; };
const DIR = flagVal('--dir') || process.cwd();
const URL = flagVal('--url');
const IS_PUBLIC = ARGS.includes('--public');
const STRICT = ARGS.includes('--strict');
const JSON_OUT = ARGS.includes('--json');

try { if (!statSync(DIR).isDirectory()) throw 0; } catch { console.error(`not a directory: ${DIR}`); process.exit(2); }

// ---------- fs helpers (zero-dep, Windows-safe) ----------
const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage', '.vercel', '.turbo', '.contentlayer', 'storybook-static', 'playwright-report', 'test-results']);
const MAX_FILES = 4000, MAX_BYTES = 512 * 1024;

function walk(dir, acc = [], depth = 0) {
  if (depth > 8 || acc.length >= MAX_FILES) return acc;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (acc.length >= MAX_FILES) break;
    const full = join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE_DIRS.has(e.name) && !e.name.startsWith('_xb')) walk(full, acc, depth + 1); }
    else acc.push(full);
  }
  return acc;
}
function read(file) {
  try { if (statSync(file).size > MAX_BYTES) return ''; return readFileSync(file, 'utf8'); } catch { return ''; }
}
const exists = (p) => { try { statSync(p); return true; } catch { return false; } };
const listDir = (p) => { try { return readdirSync(p); } catch { return []; } };
const rel = (p) => relative(DIR, p).split('\\').join('/');

// ---------- project shape ----------
const pkg = (() => { try { return JSON.parse(readFileSync(join(DIR, 'package.json'), 'utf8')); } catch { return null; } })();
const deps = pkg ? { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) } : {};
const appDir = ['app', join('src', 'app')].map((p) => join(DIR, p)).find((p) => exists(p) && statSync(p).isDirectory()) || null;
const isNextApp = Boolean(deps.next && appDir);

const allFiles = walk(DIR);
const ext = (f) => { const m = /\.([a-z0-9]+)$/i.exec(f); return m ? m[1].toLowerCase() : ''; };
const CODE_EXTS = new Set(['tsx', 'jsx', 'ts', 'js', 'mjs']);
const SHIP_DIRS = ['app', 'src', 'components', 'lib', 'pages'].map((d) => join(DIR, d));
const inShipped = (f) => SHIP_DIRS.some((d) => f.startsWith(d + '\\') || f.startsWith(d + '/'));
const isTestPath = (f) => /(^|[\\/])(tests?|__tests__|e2e|fixtures|__mocks__)([\\/])|\.(test|spec)\./.test(f);
const codeFiles = allFiles.filter((f) => CODE_EXTS.has(ext(f)) && inShipped(f) && !isTestPath(f));
const copyFiles = allFiles.filter((f) => (CODE_EXTS.has(ext(f)) || ['md', 'mdx', 'html', 'css'].includes(ext(f))) && inShipped(f) && !isTestPath(f));
const styleFiles = allFiles.filter((f) => ['css', 'html', ...CODE_EXTS].includes(ext(f)) && inShipped(f) && !isTestPath(f));

function grepFiles(files, re, cap = 5) {
  const hits = [];
  for (const f of files) { if (re.test(read(f))) { hits.push(rel(f)); if (hits.length >= cap) break; } }
  return hits;
}
function countInFiles(files, re) {
  let n = 0;
  for (const f of files) { const m = read(f).match(re); if (m) n += m.length; }
  return n;
}

// ---------- checks ----------
const checks = [];
const add = (id, status, detail, hint = '') => checks.push({ id, status, detail, hint });
const P = (id, d) => add(id, 'pass', d);
const F = (id, d, h) => add(id, 'fail', d, h);
const W = (id, d, h) => add(id, IS_PUBLIC && (id === 'robots' || id === 'sitemap') ? 'fail' : 'warn', d, h);
const I = (id, d) => add(id, 'info', d);
const S = (id, d) => add(id, 'skip', d);

// 1. next security floor (a security finding beats any other check — brain rule)
(() => {
  if (!deps.next) return S('next-security-floor', pkg ? 'no `next` dependency' : 'no package.json');
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(deps.next));
  if (!m) return I('next-security-floor', `next pinned as "${deps.next}" (unresolvable here — verify installed version ≥ 16.2.6)`);
  const v = [+m[1], +m[2], +m[3]];
  const ge = (a, b) => a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] >= b[2];
  if (v[0] >= 17 || (v[0] === 16 && ge(v, [16, 2, 6])) || (v[0] === 15 && ge(v, [15, 5, 18]))) return P('next-security-floor', `next ${m[0]} ≥ floor (16.2.6 / 15.5.18)`);
  F('next-security-floor', `next ${m[0]} is BELOW the May-2026 security floor (13 unpatched advisories)`, 'run the next-upgrade skill BEFORE anything else');
})();

// 2–11: App Router completeness (skip cleanly on non-Next projects)
if (!isNextApp) {
  for (const id of ['metadata-export', 'html-lang', 'favicon', 'not-found-page', 'error-boundary', 'loading-ui', 'robots', 'sitemap', 'og-image']) {
    S(id, deps.next ? 'no app/ directory (Pages Router or non-standard layout)' : 'not a Next.js App Router project');
  }
} else {
  const appTop = listDir(appDir);
  const layoutFile = ['layout.tsx', 'layout.jsx', 'layout.js'].map((n) => join(appDir, n)).find(exists);
  const layoutSrc = layoutFile ? read(layoutFile) : '';

  if (!layoutFile) F('metadata-export', 'no root layout found in app/', 'App Router requires app/layout.tsx');
  else if (/export\s+(const\s+metadata|(async\s+)?function\s+generateMetadata)/.test(layoutSrc)) P('metadata-export', `root layout exports metadata (${rel(layoutFile)})`);
  else F('metadata-export', 'root layout has no `export const metadata` / `generateMetadata`', 'every professional site sets title/description — see impeccable reference/seo-and-meta.md');

  if (layoutSrc) {
    const at = layoutSrc.indexOf('<html');
    if (at >= 0 && /\slang\s*=/.test(layoutSrc.slice(at, at + 300))) P('html-lang', '<html> declares lang');
    else F('html-lang', '<html> has no lang attribute', 'WCAG 3.1.1 — add lang="en" (or the real locale) in app/layout');
  } else S('html-lang', 'no root layout to inspect');

  const iconRe = /^(favicon\.ico|icon\d*\.(ico|jpe?g|png|svg)|icon\.(tsx?|jsx?)|apple-icon\d*\.(jpe?g|png)|apple-icon\.(tsx?|jsx?))$/;
  const pubIcons = listDir(join(DIR, 'public')).filter((n) => /^favicon\.(ico|svg|png)$/.test(n));
  const appIcons = appTop.filter((n) => iconRe.test(n));
  if (appIcons.length || pubIcons.length) P('favicon', `icon set present (${[...appIcons, ...pubIcons].slice(0, 3).join(', ')})`);
  else F('favicon', 'no favicon/icon files in app/ or public/', 'app/icon.svg (+32px ico, 180px apple-icon) — Next wires the head automatically');

  if (appTop.some((n) => /^not-found\.(tsx|jsx|js)$/.test(n))) P('not-found-page', 'app/not-found.* present');
  else F('not-found-page', 'no root not-found page — visitors get the unstyled default 404', 'add app/not-found.tsx, designed with the project tokens');

  if (appTop.some((n) => /^(error|global-error)\.(tsx|jsx|js)$/.test(n))) P('error-boundary', 'root error boundary present');
  else F('error-boundary', 'no app/error.* or global-error.* — runtime errors show the raw crash screen', "add app/error.tsx ('use client') with a designed recovery state");

  const hasLoading = allFiles.some((f) => f.startsWith(appDir) && /[\\/]loading\.(tsx|jsx|js)$/.test(f));
  if (hasLoading || grepFiles(codeFiles, /<Suspense[\s>]/, 1).length) P('loading-ui', hasLoading ? 'loading.* present' : '<Suspense> used');
  else W('loading-ui', 'no loading.tsx and no <Suspense> — slow routes will hard-block', 'designed loading states are part of the professional bar (craft.md step 3.5)');

  if (appTop.some((n) => /^robots\.(ts|txt)$/.test(n)) || exists(join(DIR, 'public', 'robots.txt'))) P('robots', 'robots present');
  else W('robots', 'no robots.txt/ts', 'public sites need one — incl. the AI-crawler split (principles.md § machine-discoverability)');

  if (appTop.some((n) => /^sitemap\.(ts|xml|js)$/.test(n)) || exists(join(DIR, 'public', 'sitemap.xml'))) P('sitemap', 'sitemap present');
  else W('sitemap', 'no sitemap.xml/ts', 'add app/sitemap.ts for public/multi-route sites');

  if (appTop.some((n) => /^(opengraph-image|twitter-image)\./.test(n)) || grepFiles(codeFiles.filter((f) => /[\\/](layout|page)\.(tsx|jsx|js)$/.test(f)), /openGraph\s*:/, 1).length) {
    P('og-image', 'OG image / openGraph metadata present');
  } else W('og-image', 'no opengraph-image.* and no openGraph metadata', 'links shared to this site render bare — see seo-and-meta.md (1200×630, never a screenshot)');
}

// 12. font strategy
(() => {
  const bad = grepFiles(styleFiles, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  if (bad.length) return F('font-strategy', `hand-rolled Google Fonts request in ${bad.join(', ')}`, 'use next/font (build-time self-host: zero external requests, no font CLS)');
  const usesNextFont = grepFiles(codeFiles, /next\/font/, 1).length > 0;
  P('font-strategy', usesNextFont ? 'next/font in use, no external font requests' : 'no external font requests (next/font not detected — system stack or self-hosted)');
})();

// 13. placeholder copy (shipped surfaces only)
(() => {
  const hits = grepFiles(copyFiles, /lorem\s+ipsum|placehold\.co|via\.placeholder|placekitten|placeholder\.com/i);
  if (hits.length) F('placeholder-copy', `placeholder content in ${hits.join(', ')}`, 'real copy before ship — copywriting.md; real imagery — unsplash MCP');
  else P('placeholder-copy', 'no lorem ipsum / placeholder-image hosts in shipped code');
})();

// 14–17. hygiene + context
(() => {
  const n = countInFiles(codeFiles, /console\.log\(/g);
  n ? W('console-noise', `${n} console.log call(s) in shipped code`, 'strip or demote to a logger before ship') : P('console-noise', 'no console.log in shipped code');
})();
(() => {
  const files = codeFiles.filter((f) => ['tsx', 'jsx'].includes(ext(f)));
  const n = countInFiles(files, /<img[\s>]/g);
  n ? W('raw-img-tags', `${n} raw <img> tag(s)`, 'prefer next/image (sizing kills CLS; auto-optimization) — intentional exceptions are fine, say why') : P('raw-img-tags', 'no raw <img> tags');
})();
exists(join(DIR, '.impeccable.md'))
  ? P('design-context', '.impeccable.md present (design context captured)')
  : W('design-context', 'no .impeccable.md — design context was never captured', 'run /impeccable teach (audience/brand/tone cannot be inferred from code)');
(() => {
  const g = [join(DIR, 'app', 'globals.css'), join(DIR, 'src', 'app', 'globals.css')].find(exists);
  if (!g) return I('design-tokens', 'no globals.css found');
  I('design-tokens', /@theme/.test(read(g)) ? '@theme token block present' : 'globals.css has no @theme block (starter-tokens.css not seeded?)');
})();
I('todo-markers', `${countInFiles(codeFiles, /\bTODO\b|\bFIXME\b|\bHACK\b/g)} TODO/FIXME/HACK marker(s) in shipped code`);

// 18. runtime delegation
(() => {
  if (!URL) return S('browsers-a11y', 'no --url given — run with --url http://localhost:3000 for the 3-engine + axe pass');
  const script = join(dirname(fileURLToPath(import.meta.url)), 'verify-browsers.mjs');
  const r = spawnSync(process.execPath, [script, URL, join(DIR, '_xb'), '--a11y'], { encoding: 'utf8', timeout: 300000 });
  if (r.status === 0) P('browsers-a11y', '3 engines rendered, motion proven, axe AA clean (verify-browsers)');
  else if (r.status === 2) S('browsers-a11y', 'verify-browsers setup missing (npm i -g playwright @axe-core/playwright; npx playwright install)');
  else F('browsers-a11y', 'verify-browsers reported failures — see ./_xb/summary.json', (r.stdout || '').trim().split('\n').slice(-1)[0] || '');
})();

// ---------- verdict ----------
if (STRICT) for (const c of checks) if (c.status === 'warn') c.status = 'fail';
const count = (s) => checks.filter((c) => c.status === s).length;
const fails = count('fail'), warns = count('warn');
const verdict = fails ? 'NOT SHIP-READY (completeness)' : warns ? `SHIP-READY on completeness — ${warns} warning(s) to weigh` : 'SHIP-READY (completeness)';

if (JSON_OUT) {
  console.log(JSON.stringify({ dir: DIR, isNextApp, public: IS_PUBLIC, strict: STRICT, checks, counts: { pass: count('pass'), warn: warns, fail: fails, skip: count('skip'), info: count('info') }, verdict, exitCode: fails ? 1 : 0 }, null, 2));
} else {
  console.log(`# web-preflight — ${DIR}${isNextApp ? '' : ' (generic mode: not a Next App Router project)'}${IS_PUBLIC ? ' [--public]' : ''}${STRICT ? ' [--strict]' : ''}`);
  console.log('');
  for (const c of checks) {
    console.log(`${c.status.toUpperCase().padEnd(5)} ${c.id.padEnd(20)} ${c.detail}${c.hint ? `\n      ${' '.repeat(20)} -> ${c.hint}` : ''}`);
  }
  console.log('');
  console.log(`${count('pass')} pass · ${warns} warn · ${fails} fail · ${count('skip')} skip — ${verdict}`);
  console.log('');
  console.log('Beyond this script — still required before "done" (impeccable craft.md):');
  console.log('  · audit-rules.md grep sheet, canary first — 0 BLOCK hits          [in-session]');
  console.log('  · lighthouse ≥90 a11y & SEO for public sites                       [mcp__lighthouse__run_audit]');
  console.log('  · states pass: hover/focus/loading/error/empty on every component [craft.md step 3.4–3.5]');
  console.log('  · keyboard-only walk of the primary flow');
  console.log('  · real-copy voice check + responsive spot-check 360/768/1280');
}
process.exit(fails ? 1 : 0);
