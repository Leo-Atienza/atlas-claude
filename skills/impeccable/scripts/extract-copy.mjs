#!/usr/bin/env node
/**
 * extract-copy.mjs — rendered text from the BUILT output, for copy sweeps.
 *
 * Every copy check (fact-drift, AI tells, dash sweep, glyph coverage, banned
 * phrases) must run over what the visitor reads, never over source files —
 * source carries comments, JSX and prop strings that both hide real hits and
 * manufacture false ones (web-dev/build-workflow.md § Sweep the BUILT output).
 * This emits that text once so every sweep shares one honest substrate.
 *
 * Usage:
 *   node extract-copy.mjs --html dist/            # built HTML files (dir or files)
 *   node extract-copy.mjs --html dist/index.html dist/about.html
 *   node extract-copy.mjs --url http://localhost:4173   # rendered page (playwright)
 *   ... [--out copy.txt]
 *
 * --html parses static output directly (fine for prerendered/SSG builds).
 * --url renders in headless Chromium and takes document.body.innerText after
 *   fonts.ready — required when the copy only exists after hydration.
 *
 * Emits per source: TITLE / META / OG lines, ALT lines (alt text carries
 * claims too), then the visible text. Entities are decoded — an &mdash; in the
 * HTML must come out as "—" or the dash sweep goes blind.
 */
'use strict';

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const ARGS = process.argv.slice(2);
const die = (msg) => { console.error(`extract-copy: ${msg}`); process.exit(2); };
// collects across EVERY occurrence — `--html a.html --html b.html` must scan
// both, not silently drop the second (a sweep that believes it scanned a file
// it never opened is worse than an error)
const flagVals = (flag) => {
  const vals = [];
  for (let i = 0; i < ARGS.length; i++) {
    if (ARGS[i] !== flag) continue;
    for (let j = i + 1; j < ARGS.length && !ARGS[j].startsWith('--'); j++) vals.push(ARGS[j]);
  }
  return vals;
};
const HTML_IN = flagVals('--html');
const URL_IN = flagVals('--url')[0];
const OUT = flagVals('--out')[0];
if (!HTML_IN.length && !URL_IN) die('need --html <files|dir> or --url <url>');

// ------------------------------------------------------------ entity decode

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  copy: '©', reg: '®', trade: '™', deg: '°', times: '×',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä', ntilde: 'ñ',
};
function decodeEntities(s) {
  // ONE pass — sequential passes re-scan their own output, so &#38;mdash;
  // (renders as the literal text "&mdash;") double-decoded into an em dash,
  // manufacturing a dash-sweep hit that isn't on the page
  return s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z][a-z0-9]*));/gi, (m, hex, dec, name) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    return NAMED[name.toLowerCase()] ?? m;
  });
}

// attribute value from a tag, honoring the OPENING quote — the ["']...["']
// class truncated at the first apostrophe ("the user's portfolio" → "the user").
// Unquoted values (minifiers emit them) are captured too.
function attrVal(tag, nameAlt) {
  const m = tag.match(new RegExp(`(?:${nameAlt})\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
}

// ------------------------------------------------------------- static parse

function extractFromHtml(html) {
  const meta = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) meta.push(`TITLE: ${decodeEntities(title[1].trim())}`);
  const metaRe = /<meta\s+[^>]*>/gi;
  for (const tag of html.match(metaRe) || []) {
    const name = attrVal(tag, 'name|property');
    const content = attrVal(tag, 'content');
    if (name && content && /^(description|og:title|og:description|twitter:title|twitter:description)$/i.test(name))
      meta.push(`META ${name}: ${decodeEntities(content)}`);
  }

  const alts = [];
  for (const tag of html.match(/<(?:img|area)\s+[^>]*>/gi) || []) {
    const alt = attrVal(tag, 'alt');
    if (alt) alts.push(`ALT: ${decodeEntities(alt)}`);
  }

  let body = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<head\b[\s\S]*?<\/head>/i, '');
  // aria-labels are read aloud — they're copy too
  const arias = [];
  for (const m of body.matchAll(/aria-label\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
    const v = m[2] ?? m[3] ?? m[4];
    if (v) arias.push(`ARIA-LABEL: ${decodeEntities(v)}`);
  }
  body = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|header|footer|main|aside|nav|h[1-6]|li|tr|blockquote|figcaption|dt|dd|pre)>/gi, '\n')
    // strip only REAL tags (per the HTML5 tokenizer, '<' before a non-letter is
    // TEXT — "5 < 10" must survive; a bare /<[^>]+>/ ate it plus the next element)
    .replace(/<\/?[a-zA-Z][^>]*>|<![^>]*>|<\?[^>]*>/g, ' ');
  const text = decodeEntities(body)
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return [...meta, ...alts, ...arias, '', text].join('\n');
}

function collectHtmlFiles(inputs) {
  const files = [];
  const walk = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const e of readdirSync(p)) if (e !== 'node_modules' && !e.startsWith('.')) walk(join(p, e));
    } else if (['.html', '.htm'].includes(extname(p).toLowerCase())) files.push(p);
  };
  for (const p of inputs) {
    if (!existsSync(p)) die(`not found: ${p}`);
    walk(p);
  }
  if (!files.length) die('no .html files found in the given paths — point --html at the BUILT output (dist/, out/)');
  return files;
}

// ---------------------------------------------------------------- URL render

async function extractFromUrl(url) {
  const require = createRequire(import.meta.url);
  let playwright;
  try { playwright = require('playwright'); } catch {}
  if (!playwright) {
    try { playwright = require(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); }
    catch { die('cannot resolve playwright (needed for --url). npm i -g playwright — or use --html on the built files'); }
  }
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    return await page.evaluate(() => {
      const meta = [];
      if (document.title) meta.push(`TITLE: ${document.title}`);
      for (const m of document.querySelectorAll('meta[name], meta[property]')) {
        const name = m.getAttribute('name') || m.getAttribute('property');
        if (/^(description|og:title|og:description|twitter:title|twitter:description)$/i.test(name) && m.content)
          meta.push(`META ${name}: ${m.content}`);
      }
      const alts = [...document.querySelectorAll('img[alt], area[alt]')]
        .map((el) => el.getAttribute('alt')).filter(Boolean).map((a) => `ALT: ${a}`);
      const arias = [...document.querySelectorAll('[aria-label]')]
        .map((el) => el.getAttribute('aria-label')).filter(Boolean).map((a) => `ARIA-LABEL: ${a}`);
      return [...meta, ...alts, ...arias, '', document.body.innerText].join('\n');
    });
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------- main

const sections = [];
if (URL_IN) {
  sections.push(`=== ${URL_IN} ===\n${await extractFromUrl(URL_IN)}`);
}
for (const f of HTML_IN.length ? collectHtmlFiles(HTML_IN) : []) {
  sections.push(`=== ${f} ===\n${extractFromHtml(readFileSync(f, 'utf8'))}`);
}

const output = sections.join('\n\n') + '\n';
if (OUT) {
  writeFileSync(OUT, output);
  console.log(`wrote ${OUT} (${sections.length} source${sections.length === 1 ? '' : 's'}, ${output.length} chars)`);
} else {
  process.stdout.write(output);
}
