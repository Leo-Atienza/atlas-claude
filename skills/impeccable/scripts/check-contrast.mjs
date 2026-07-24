#!/usr/bin/env node
/**
 * check-contrast.mjs — compute every text/ground pair a build actually ships.
 *
 * Exists because a design spec that *claims* AA is worth nothing: on the
 * a real client build a warm gray was asserted AA-passing in five separate
 * specs and measured 4.21:1 on one of its two grounds. Numbers come from the
 * shipped tokens, never from a sheet (web-dev/build-workflow.md § Contrast).
 *
 * Usage:
 *   node check-contrast.mjs [--config contrast-pairs.json] [--css <file> ...]
 *   node check-contrast.mjs --init --css src/index.css   # scaffold the manifest
 *
 * Manifest (contrast-pairs.json, at the project root — names are YOUR project's,
 * these are placeholders):
 *   {
 *     "css": ["src/index.css"],            // token files, relative to this manifest
 *     "palette": {
 *       "paper": "--background",           // resolved from the CSS — the honest form
 *       "ink":   "--foreground",
 *       "accent": "#4A4A4A"                // literal only when no token exists
 *     },
 *     "pairs":  [["ink", "paper", 4.5]],   // [ink, ground, min] — min defaults 4.5;
 *                                          // use 3 only for >=24px text or non-text (1.4.11)
 *     "banned": [["ink", "accent"]]        // legal CSS, visually catastrophic — must
 *   }                                      // never appear in markup; ratio printed as proof
 *
 * Enumerate PAIRS, not colours: every ink is checked against every ground it
 * actually sits on — that failure passed on one ground (5.48:1)
 * and failed on the second (4.21:1).
 *
 * Understands: #hex, rgb()/rgba(), hsl()/hsla(), oklch(), oklab(), white/black,
 * var(--x) indirection, and light-dark(a, b) — when any resolved token differs
 * between schemes, every pair is checked in BOTH and must pass both.
 *
 * Exit 0 = all pairs pass · 1 = any pair below its minimum · 2 = config/parse error.
 */
'use strict';

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';

const ARGS = process.argv.slice(2);
const INIT = ARGS.includes('--init');
// variadic: `--css a.css b.css` and repeated `--css a.css --css b.css` both work
const flagVals = (flag) => {
  const out = [];
  for (let i = 0; i < ARGS.length; i++) {
    if (ARGS[i] !== flag) continue;
    for (let j = i + 1; j < ARGS.length && !ARGS[j].startsWith('--'); j++) out.push(ARGS[j]);
  }
  return out;
};
const CONFIG_PATH = flagVals('--config')[0] || 'contrast-pairs.json';
const CLI_CSS = flagVals('--css');

const die = (msg) => { console.error(`check-contrast: ${msg}`); process.exit(2); };

// ---------------------------------------------------------------- color math

function srgbFromLinear(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => Math.min(1, Math.max(0, srgbFromLinear(c))));
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60)];
  return seg.map((v) => v + m);
}

const num = (s, ctx) => {
  const v = parseFloat(s);
  if (!Number.isFinite(v)) throw new Error(`bad number "${s}" in ${ctx}`);
  return v;
};

// hue token → degrees; a gate must never silently misread a legal unit
// (0.5turn parseFloat'd as 0.5deg produces a confidently wrong ratio)
const hueDeg = (tok, ctx) => {
  const m = String(tok).trim().toLowerCase().match(/^(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)(deg|rad|grad|turn)?$/);
  if (!m) throw new Error(`bad hue "${tok}" in ${ctx}`);
  const v = parseFloat(m[1]);
  switch (m[2]) {
    case 'turn': return v * 360;
    case 'rad': return (v * 180) / Math.PI;
    case 'grad': return v * 0.9;
    default: return v;
  }
};

// → { rgb: [0..1 ×3], alpha } — throws on anything it can't honestly resolve.
function parseColor(raw) {
  const v = raw.trim().toLowerCase();
  if (v === 'white') return { rgb: [1, 1, 1], alpha: 1 };
  if (v === 'black') return { rgb: [0, 0, 0], alpha: 1 };

  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) throw new Error(`bad hex "${raw}"`);
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { rgb, alpha };
  }

  const fn = v.match(/^(rgba?|hsla?|oklch|oklab)\(([^)]+)\)$/);
  if (!fn) throw new Error(`unsupported color "${raw}" — use hex/rgb/hsl/oklch/oklab, or put a literal in the manifest`);
  const [, name, bodyRaw] = fn;
  const [main, alphaPart] = bodyRaw.split('/');
  const parts = main.trim().split(/[\s,]+/).filter(Boolean);
  let alpha = 1;
  if (alphaPart !== undefined) {
    const a = alphaPart.trim();
    alpha = a.endsWith('%') ? num(a, raw) / 100 : num(a, raw);
  } else if (parts.length === 4 && /^(rgb|hsl)/.test(name)) {
    // legacy comma form: rgba(r, g, b, a) / hsla(h, s, l, a)
    const a = parts.pop();
    alpha = a.endsWith('%') ? num(a, raw) / 100 : num(a, raw);
  }
  if (parts.length !== 3) throw new Error(`expected 3 components in "${raw}"`);

  if (name.startsWith('rgb')) {
    const rgb = parts.map((p) => (p.endsWith('%') ? num(p, raw) / 100 : num(p, raw) / 255));
    return { rgb, alpha };
  }
  if (name.startsWith('hsl')) {
    return { rgb: hslToRgb(hueDeg(parts[0], raw), num(parts[1], raw) / 100, num(parts[2], raw) / 100), alpha };
  }
  const L = parts[0].endsWith('%') ? num(parts[0], raw) / 100 : num(parts[0], raw);
  if (name === 'oklab') {
    const comp = (p) => (p.endsWith('%') ? (num(p, raw) / 100) * 0.4 : num(p, raw));
    return { rgb: oklabToRgb(L, comp(parts[1]), comp(parts[2])), alpha };
  }
  // oklch: C percentage maps 100% → 0.4 per the spec
  const C = parts[1].endsWith('%') ? (num(parts[1], raw) / 100) * 0.4 : num(parts[1], raw);
  const rad = (hueDeg(parts[2], raw) * Math.PI) / 180;
  return { rgb: oklabToRgb(L, C * Math.cos(rad), C * Math.sin(rad)), alpha };
}

function luminance({ rgb }) {
  // via 8-bit sRGB so results match hand checks and the per-project scripts exactly
  const [r, g, b] = rgb.map((c) => {
    const c8 = Math.round(c * 255) / 255;
    return c8 <= 0.04045 ? c8 / 12.92 : Math.pow((c8 + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Ink alpha < 1 is composited over its ground before measuring (the honest
// number for hairlines/muted ink). A translucent GROUND is unmeasurable
// without knowing what sits underneath — flagged, treated as opaque.
function contrast(ink, ground) {
  let inkC = ink;
  if (ink.alpha < 1) {
    const a = ink.alpha;
    inkC = { rgb: ink.rgb.map((c, i) => c * a + ground.rgb[i] * (1 - a)), alpha: 1 };
  }
  const la = luminance(inkC), lb = luminance(ground);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ------------------------------------------------------------- CSS token scan

// Brace-balanced spans of dark-scheme blocks; declarations inside → dark.
function braceSpan(css, open) {
  let depth = 1, i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return [open, i];
}

function darkRanges(css) {
  const ranges = [];
  const mediaRe = /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi;
  let m;
  while ((m = mediaRe.exec(css))) ranges.push(braceSpan(css, css.indexOf('{', m.index)));

  // Any rule whose SELECTOR mentions .dark (word-bounded — .darkroom is not a
  // scheme) or [data-theme=dark], wherever it sits in the selector: html.dark,
  // :root[data-theme="dark"], .dark .card. Anchoring to the selector start was
  // a false-PASS bug — the dominant real-world forms carry a tag/:root prefix.
  const darkSel = /\.dark(?![\w-])|\[data-theme=["']?dark["']?\]/i;
  for (let i = 0; i < css.length; i++) {
    if (css[i] !== '{') continue;
    let j = i - 1;
    while (j >= 0 && !'{};'.includes(css[j])) j--;
    const prelude = css.slice(j + 1, i);
    if (prelude.includes('@')) continue; // at-rules handled above
    if (darkSel.test(prelude)) ranges.push(braceSpan(css, i));
  }
  return ranges;
}

function extractVars(rawCss) {
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, ''); // comments carry example declarations
  const dark = darkRanges(css);
  const inDark = (i) => dark.some(([a, b]) => i > a && i < b);

  // Root-level declarations (:root / html / @theme) define the palette; a
  // class-scoped redeclaration (.card { --ink: ... }) is a component override,
  // not the global token — flat last-wins across ALL selectors manufactured
  // false FAILs. Root beats scoped; among equals, last wins.
  const rootish = (i) => {
    let depth = 0, j = i - 1;
    while (j >= 0) {
      const c = css[j];
      if (c === '}') depth++;
      else if (c === '{') {
        if (depth === 0) break;
        depth--;
      }
      j--;
    }
    if (j < 0) return true; // top-level declaration
    let k = j - 1;
    while (k >= 0 && !'{};'.includes(css[k])) k--;
    const prelude = css.slice(k + 1, j).trim();
    return /:root|^@theme\b|^html\b/.test(prelude) || prelude === '';
  };

  const out = { light: {}, dark: {} };
  const scoped = { light: {}, dark: {} };
  const decl = /--([\w-]+)\s*:\s*([^;{}]+)[;}]/g;
  let m;
  while ((m = decl.exec(css))) {
    const scheme = inDark(m.index) ? 'dark' : 'light';
    (rootish(m.index) ? out : scoped)[scheme][`--${m[1]}`] = m[2].trim();
  }
  for (const scheme of ['light', 'dark'])
    for (const [k, v] of Object.entries(scoped[scheme])) if (!(k in out[scheme])) out[scheme][k] = v;
  return out;
}

const splitTopLevel = (s) => {
  const parts = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim());
};

// palette value (+scheme) → literal color string, following var() and light-dark()
function resolveValue(value, scheme, vars, depth = 0) {
  if (depth > 12) throw new Error(`var() indirection too deep at "${value}"`);
  const v = value.trim();
  if (v.startsWith('--')) {
    const found = vars[scheme][v] ?? vars.light[v];
    if (found === undefined) throw new Error(`token ${v} not found in the given CSS`);
    return resolveValue(found, scheme, vars, depth + 1);
  }
  const ld = v.match(/^light-dark\((.+)\)$/i);
  if (ld) {
    const args = splitTopLevel(ld[1]);
    if (args.length !== 2) throw new Error(`light-dark() needs 2 args: "${v}"`);
    return resolveValue(scheme === 'dark' ? args[1] : args[0], scheme, vars, depth + 1);
  }
  // var(--x[, fallback]) anywhere in the value — paren-aware (a fallback may
  // itself contain parens: var(--x, rgb(0 0 0))), fallback honored like a browser
  const vi = v.indexOf('var(');
  if (vi !== -1) {
    let d = 1, k = vi + 4;
    while (k < v.length && d > 0) {
      if (v[k] === '(') d++;
      else if (v[k] === ')') d--;
      k++;
    }
    if (d > 0) throw new Error(`unbalanced parens in "${v}"`);
    const parts = splitTopLevel(v.slice(vi + 4, k - 1));
    const name = parts[0].trim();
    const found = vars[scheme][name] ?? vars.light[name];
    let resolved;
    if (found !== undefined) resolved = resolveValue(found, scheme, vars, depth + 1);
    else if (parts.length > 1) resolved = resolveValue(parts.slice(1).join(','), scheme, vars, depth + 1);
    else throw new Error(`token ${name} not found in the given CSS (and no var() fallback)`);
    return resolveValue(v.slice(0, vi) + resolved + v.slice(k), scheme, vars, depth + 1);
  }
  return v;
}

function loadCss(paths) {
  let css = '';
  for (const p of paths) {
    if (!p || !String(p).trim()) die('empty path in "css" — fix the manifest (did a shell variable fail to interpolate?)');
    if (!existsSync(p)) die(`CSS file not found: ${p}`);
    if (statSync(p).isDirectory()) die(`"css" entry is a directory, not a file: ${p}`);
    css += readFileSync(p, 'utf8') + '\n';
  }
  return extractVars(css);
}

// ------------------------------------------------------------------- --init

if (INIT) {
  if (!CLI_CSS.length) die('--init needs --css <token file>');
  if (existsSync(CONFIG_PATH)) die(`${CONFIG_PATH} already exists — refusing to overwrite`);
  const vars = loadCss(CLI_CSS);
  const palette = {};
  const seen = [];
  for (const name of Object.keys({ ...vars.light, ...vars.dark })) {
    let lit = null;
    for (const scheme of ['light', 'dark']) {
      try { lit = resolveValue(name, scheme, vars); parseColor(lit); break; } catch { lit = null; }
    }
    if (lit === null) continue; // not a color token in either scheme
    palette[name.replace(/^--/, '')] = name;
    seen.push(`  ${name.padEnd(28)} ${lit}`);
  }
  // store css paths relative to the MANIFEST (the check phase resolves against
  // the config's dir — cwd-relative paths break when --config sits in a subdir)
  const cfgDir = dirname(resolve(CONFIG_PATH));
  const config = {
    _how: 'List every ink-on-ground pair the site ships in "pairs" ([ink, ground, min]) — both grounds for every ink. Put catastrophic combos in "banned". Run: node ~/.claude/skills/impeccable/scripts/check-contrast.mjs',
    css: CLI_CSS.map((p) => relative(cfgDir, resolve(p)).split('\\').join('/')),
    palette,
    pairs: [],
    banned: [],
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  console.log(`wrote ${CONFIG_PATH} with ${Object.keys(palette).length} color tokens:\n${seen.join('\n')}`);
  console.log('\nnow enumerate the pairs — every ink against every ground it actually sits on.');
  process.exit(0);
}

// --------------------------------------------------------------------- check

if (!existsSync(CONFIG_PATH)) die(`no ${CONFIG_PATH} — scaffold one with --init --css <token file>`);
let config;
try { config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch (e) { die(`bad JSON in ${CONFIG_PATH}: ${e.message}`); }
const { palette = {}, pairs = [], banned = [] } = config;
if (!pairs.length) die(`"pairs" is empty in ${CONFIG_PATH} — enumerating the shipped pairs IS the gate`);

const configDir = dirname(resolve(CONFIG_PATH));
for (const p of config.css || [])
  if (!p || !String(p).trim()) die('empty entry in "css" — fix the manifest (did a shell variable fail to interpolate?)');
const cssPaths = [...(config.css || []).map((p) => resolve(configDir, p)), ...CLI_CSS.map((p) => resolve(p))];
const vars = cssPaths.length ? loadCss(cssPaths) : { light: {}, dark: {} };

for (const [ink, ground] of banned) {
  if (pairs.some(([i, g]) => i === ink && g === ground))
    die(`"${ink}" on "${ground}" is in both pairs and banned — pick one`);
}

function resolvePalette(scheme) {
  const out = {};
  for (const [name, value] of Object.entries(palette)) {
    const lit = resolveValue(value, scheme, vars);
    const color = parseColor(lit);
    if (color.alpha < 1 && pairs.some(([, g]) => g === name))
      console.warn(`  note: ground "${name}" has alpha ${color.alpha} — measured as opaque; verify what sits under it`);
    out[name] = color;
  }
  return out;
}

let light, dark;
try {
  light = resolvePalette('light');
  dark = resolvePalette('dark');
} catch (e) { die(e.message); }

const twoSchemes = Object.keys(palette).some(
  (n) => JSON.stringify(light[n].rgb) !== JSON.stringify(dark[n].rgb) || light[n].alpha !== dark[n].alpha
);
const schemes = twoSchemes ? [['light', light], ['dark', dark]] : [['', light]];

let failed = 0;
for (const [label, pal] of schemes) {
  console.log(`contrast — shipped pairs${label ? ` (${label} scheme)` : ''}`);
  for (const pair of pairs) {
    const [ink, ground, min = 4.5] = pair;
    if (!pal[ink] || !pal[ground]) die(`pair [${ink}, ${ground}] references a name missing from "palette"`);
    const ratio = contrast(pal[ink], pal[ground]);
    const ok = ratio >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${`${ink} on ${ground}`.padEnd(26)} ${ratio.toFixed(2)}:1  (min ${min})`);
  }
}

if (banned.length) {
  console.log('banned pairs — must stay out of the markup');
  for (const [ink, ground] of banned) {
    if (!light[ink] || !light[ground]) die(`banned pair [${ink}, ${ground}] references a name missing from "palette"`);
    console.log(`  ${`${ink} on ${ground}`.padEnd(26)} ${contrast(light[ink], light[ground]).toFixed(2)}:1`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} pair(s) below their minimum — fix the token, not the sheet.`);
  process.exit(1);
}
console.log('\nall pairs pass.');
