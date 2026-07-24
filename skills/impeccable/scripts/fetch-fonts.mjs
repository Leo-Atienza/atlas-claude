#!/usr/bin/env node
/**
 * fetch-fonts.mjs — self-host Google webfonts (the no-next/font delivery path).
 *
 * Why: measured on a real client build, the fonts.googleapis.com <link> —
 * even non-blocking, with media="print" + onload — cost Lighthouse desktop
 * 0.90 → 0.75 and pushed FCP 1.22s → 2.18s, because it adds two cross-origin
 * connections (googleapis for the CSS, gstatic for the files) to the critical
 * path. Self-hosted, same-origin, latin-only, hero faces preloaded, that cost
 * disappears. Full technique incl. metric-matched fallbacks (computed, not
 * guessed): wiki/web-dev/techniques/asset-pipelines.md § 1.
 *
 * On Next.js use next/font instead — this is for Vite / Astro / plain stacks.
 *
 * Usage:
 *   node fetch-fonts.mjs "<css2 url>" [--out public/fonts] [--subsets latin] [--url-prefix /fonts]
 *   node fetch-fonts.mjs "https://fonts.googleapis.com/css2?family=Fraunces:wght@400..700&display=swap"
 *
 * faces.css src URLs default to --out with its public/static/dist segment
 * stripped (public/fonts → /fonts); pass --url-prefix when served elsewhere.
 *
 * Emits: <out>/<family>-<weight>.woff2 per face + <out>/faces.css with the
 * @font-face declarations (font-display: swap, unicode-range preserved).
 * Then paste faces.css into your CSS, preload ONLY the first-screen faces,
 * and subset each file to the shipped glyphs (instructions printed at the end
 * — pair with extract-copy.mjs to get the real character set).
 *
 * Both steps assume OFL/libre faces — Google Fonts only serves those, but if
 * you point this at a paid face's CSS elsewhere, check the license first.
 */
'use strict';

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ARGS = process.argv.slice(2);
const die = (msg) => { console.error(`fetch-fonts: ${msg}`); process.exit(2); };
const flagVal = (flag, dflt) => {
  const i = ARGS.indexOf(flag);
  return i !== -1 && ARGS[i + 1] ? ARGS[i + 1] : dflt;
};
const SRC = ARGS.find(
  (a) => !a.startsWith('--') && a !== flagVal('--out') && a !== flagVal('--subsets') && a !== flagVal('--url-prefix')
);
if (!SRC || !/^https:\/\/fonts\.googleapis\.com\/css2\?/.test(SRC))
  die('first argument must be a https://fonts.googleapis.com/css2?family=... URL (quote it — & splits in the shell)');
const OUT = resolve(flagVal('--out', 'public/fonts'));
const SUBSETS = flagVal('--subsets', 'latin').split(',').map((s) => s.trim());

// The @font-face src must point where the SERVER exposes the files, which is
// --out minus its public-root segment (public/fonts → /fonts). A hardcoded
// /fonts/ silently 404'd for any other --out.
function derivePrefix() {
  const explicit = flagVal('--url-prefix', null);
  if (explicit) {
    // Git Bash (MSYS) rewrites a leading-slash arg into C:/Program Files/Git/...
    if (/^\/?[A-Za-z]:\//.test(explicit))
      die(`--url-prefix "${explicit}" looks shell-mangled (Git Bash rewrites leading-slash args) — pass it WITHOUT the leading slash: --url-prefix cdn/f`);
    return '/' + explicit.replace(/^\/+|\/+$/g, '');
  }
  const rel = relative(process.cwd(), OUT).split('\\').join('/');
  if (!rel || rel.startsWith('..')) return '/fonts'; // outside cwd — no honest derivation
  const segs = rel.split('/').filter(Boolean);
  if (['public', 'static', 'dist'].includes(segs[0])) segs.shift();
  return '/' + (segs.join('/') || 'fonts');
}
const URL_PREFIX = derivePrefix();

mkdirSync(OUT, { recursive: true });

// A modern UA is required or Google serves ttf instead of woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const cssRes = await fetch(SRC, { headers: { 'User-Agent': UA } });
if (!cssRes.ok) die(`Google Fonts CSS fetch failed: HTTP ${cssRes.status}`);
const css = await cssRes.text();

// Each @font-face is preceded by a /* subset */ comment; ship only the subsets
// the copy actually uses (latin alone covers English).
const faces = [];
const re = /\/\* ([a-z0-9-]+) \*\/\s*@font-face \{([\s\S]*?)\}/g;
let m;
while ((m = re.exec(css))) {
  const [, subset, body] = m;
  if (!SUBSETS.includes(subset)) continue;
  const pick = (p) => (body.match(p) || [])[1]?.trim();
  faces.push({
    subset,
    family: pick(/font-family: '([^']+)'/),
    weight: pick(/font-weight: ([^;]+);/),
    style: pick(/font-style: ([^;]+);/),
    url: pick(/url\(([^)]+)\)/),
    range: pick(/unicode-range: ([^;]+);/),
  });
}
if (faces.length === 0)
  die(`no faces parsed for subset(s) ${SUBSETS.join(', ')} — did the Google CSS format change? (URL must include display=swap)`);

const rules = [];
for (const f of faces) {
  const style = f.style === 'italic' ? '-italic' : '';
  const slug = `${f.family.toLowerCase().replace(/\s+/g, '-')}-${f.weight.replace(/\s+/g, '-')}${style}`;
  const suffix = f.subset === 'latin' ? '' : `-${f.subset}`;
  const file = `${slug}${suffix}.woff2`;
  const fontRes = await fetch(f.url, { headers: { 'User-Agent': UA } });
  if (!fontRes.ok) die(`font file fetch failed for ${f.family} ${f.weight}: HTTP ${fontRes.status}`);
  const bytes = Buffer.from(await fontRes.arrayBuffer());
  writeFileSync(resolve(OUT, file), bytes);
  console.log(`${file.padEnd(44)} ${(bytes.length / 1024).toFixed(1)}K`);
  rules.push(
    `@font-face {\n` +
      `  font-family: "${f.family}";\n` +
      `  font-style: ${f.style};\n` +
      `  font-weight: ${f.weight};\n` +
      `  font-display: swap;\n` +
      `  src: url("${URL_PREFIX}/${file}") format("woff2");\n` +
      `  unicode-range: ${f.range};\n` +
      `}`
  );
}

writeFileSync(resolve(OUT, 'faces.css'), rules.join('\n\n') + '\n');
console.log(`\n${faces.length} face(s) → ${OUT} (declarations in faces.css)`);
console.log(`faces.css assumes the files are served at ${URL_PREFIX}/ — override with --url-prefix if not`);
console.log(`
Next steps (each one is measured CLS/FCP, not ceremony — asset-pipelines.md § 1):
1. Paste faces.css into your stylesheet; <link rel="preload" as="font" type="font/woff2" crossorigin>
   ONLY the faces the first screen renders.
2. Subset each file to the glyphs the site ships (get the real set from the BUILT output via
   extract-copy.mjs; ~40K latin → ~26K typical):
     python -m fontTools.subset public/fonts/<file>.woff2 \\
       --unicodes="U+0020-007E,U+2013,U+2019,U+201C,U+201D,U+00A9" \\
       --flavor=woff2 --layout-features='*' --output-file=public/fonts/<file>.woff2
   Any glyph outside the subset renders as tofu — re-check after copy changes.
3. Add metric-matched fallbacks (size-adjust / ascent-override COMPUTED from the two faces'
   metrics — the arithmetic is in asset-pipelines.md § "Metric-matched fallbacks") so the
   swap is a repaint, not a reflow. And use rem, never ch, for measures on the LCP line.`);
