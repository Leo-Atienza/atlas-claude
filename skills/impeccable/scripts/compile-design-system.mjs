#!/usr/bin/env node
/**
 * compile-design-system.mjs — mirror the local web-dev system into a Claude
 * Design system bundle, then push it with the DesignSync tool.
 *
 * THE LOAD-BEARING DESIGN DECISION (the user, 2026-07-22): what gets mirrored is the
 * RULEBOOK, never a costume. Atelier was deleted because one fixed aesthetic
 * (warm cream + Fraunces) pulled every generation toward the same register no
 * matter the brief. So this compiles:
 *   ✓ the quality floors        — WCAG 2.2 AA, focus, targets, reduced-motion
 *   ✓ the anti-slop constraints — 47 detectors + absolute bans + reflex fonts
 *   ✓ the token ARCHITECTURE    — OKLCH, tinted neutrals, semantic roles, one
 *                                 hue knob (a structure, not a look)
 *   ✗ NOT a palette, NOT a type pairing, NOT one design language
 * Direction stays local and arrives per-prompt (the costume decision tree).
 * A project with a locked costume gets its OWN system: --project <dir>.
 *
 * Usage:
 *   node compile-design-system.mjs [--out <dir>]        # build the house bundle
 *   node compile-design-system.mjs --check              # drift vs last push
 *   node compile-design-system.mjs --project <dir>      # per-project costume system
 *
 * Then push with the DesignSync tool: list_projects → create_project (once) →
 * finalize_plan(writes, localDir=<out>) → write_files(localPath per file).
 * Bundle output is deterministic (no timestamps) so an unchanged brain
 * recompiles byte-identically and --check stays quiet.
 */
'use strict';

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const IMPECCABLE = resolve(HERE, '..');
const CLAUDE = resolve(IMPECCABLE, '../..');
const WIKI = resolve(CLAUDE, '../Documents/Wiki/wiki');

const ARGS = process.argv.slice(2);
const die = (m) => { console.error(`compile-design-system: ${m}`); process.exit(2); };

// --help used to fall through to a full compile — an unrecognised flag silently
// writing 9 files. Print usage and stop instead.
if (ARGS.includes('--help') || ARGS.includes('-h')) {
  console.log([
    'compile-design-system — compile the register-agnostic rulebook into a design-system bundle.',
    '',
    'Usage:',
    '  node compile-design-system.mjs [--out <dir>]      build the house bundle',
    '  node compile-design-system.mjs --check            drift vs last push (exit 1 = STALE)',
    '  node compile-design-system.mjs --project <dir>    per-project costume system (needs .impeccable.md)',
    '  node compile-design-system.mjs --record <projectId> <name>   stamp the sync manifest',
    '',
    'Push with the DesignSync tool: list_projects -> create_project (once) -> finalize_plan -> write_files.',
  ].join('\n'));
  process.exit(0);
}
const flag = (f, d = null) => { const i = ARGS.indexOf(f); return i !== -1 && ARGS[i + 1] && !ARGS[i + 1].startsWith('--') ? ARGS[i + 1] : d; };
const CHECK = ARGS.includes('--check');
const PROJECT = flag('--project');
const OUT = resolve(flag('--out', join(CLAUDE, 'cache', PROJECT ? 'design-system-project' : 'design-system-house')));
const MANIFEST = join(CLAUDE, 'cache', 'design-system-sync.json');

// ---------------------------------------------------------------- extraction

// Sources whose CONTENT is extracted into the bundle.
const SOURCES = {
  tokens: join(IMPECCABLE, 'starter-tokens.css'),
  skill: join(IMPECCABLE, 'SKILL.md'),
  auditRules: join(IMPECCABLE, 'reference', 'audit-rules.md'),
};

// Doctrine that INFORMS the hand-authored templates (the motion budget table,
// the floors) but is not extracted. A change here never makes the artifact
// stale — it means a human should judge whether the templates should follow.
// Kept separate on purpose: a gate that cries wolf is a gate people ignore.
const REVIEW_SOURCES = {
  principles: join(WIKI, 'web-dev', 'principles.md'),
  buildWorkflow: join(WIKI, 'web-dev', 'build-workflow.md'),
};

const read = (p) => { if (!existsSync(p)) die(`source missing: ${p}`); return readFileSync(p, 'utf8'); };

function reflexFonts(skill) {
  const m = skill.match(/<reflex_fonts_to_reject>([\s\S]*?)<\/reflex_fonts_to_reject>/);
  if (!m) die('could not find <reflex_fonts_to_reject> in SKILL.md');
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean);
}

function auditRules(md) {
  const out = [];
  const seen = new Set();
  const re = /^- \*\*(AR-\d+)\*\*\s+`?([a-z0-9-]+)`?\s*(BLOCK|ADVISORY)?/gm;
  let m;
  while ((m = re.exec(md))) {
    if (seen.has(m[1])) continue; // the visual-judgment subset re-lists some ids
    seen.add(m[1]);
    out.push({ id: m[1], slug: m[2], severity: m[3] || 'ADVISORY' });
  }
  // AR-47 is prose-formatted (no slug backticks) — catch it explicitly
  if (!seen.has('AR-47') && /\*\*AR-47\*\*\s+([a-z-]+)/.test(md))
    out.push({ id: 'AR-47', slug: md.match(/\*\*AR-47\*\*\s+([a-z-]+)/)[1], severity: 'ADVISORY' });
  return out;
}

function absoluteBans(skill) {
  const m = skill.match(/<absolute_bans>([\s\S]*?)<\/absolute_bans>/);
  if (!m) die('could not find <absolute_bans> in SKILL.md');
  return [...m[1].matchAll(/^BAN \d+: (.+)$/gm)].map((x) => x[1].trim());
}

// token declarations from the @theme block, comments stripped
function tokens(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

// ------------------------------------------------------------------ emitters

// `@theme {}` is a Tailwind at-rule — a plain browser IGNORES it and every
// var() falls back, so the preview cards would render on fallback colours
// instead of the real architecture. Claude Design renders plain HTML/CSS, so
// the mirrored copy is re-hosted in `:root`. Inlined per card as well, so a
// card never depends on relative-path resolution in the pane.
const asPlainCss = (css) => css.replace(/@theme\s*\{/, ':root {');

const card = (group, title, tokensCss, body) =>
  `<!-- @dsCard group="${group}" -->
<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
<style>
${asPlainCss(tokensCss)}
:root { color-scheme: light dark; }
body { margin:0; padding:var(--space-2xl,48px); background:var(--color-surface,#fff); color:var(--color-text,#111);
       font-family:var(--font-body,system-ui,sans-serif); line-height:1.5; }
h1 { font-family:var(--font-display,Georgia,serif); font-size:1.75rem; margin:0 0 var(--space-xs,8px); font-weight:500; }
.lede { color:var(--color-text-muted,#555); margin:0 0 var(--space-2xl,48px); max-width:60ch; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:var(--space-lg,24px); }
.swatch { height:64px; border-radius:var(--radius-md,8px); border:1px solid var(--color-border,#0002); }
.label { font-size:0.8125rem; margin-top:var(--space-xs,8px); }
.mono { font-family:var(--font-mono,ui-monospace,monospace); font-size:0.75rem; color:var(--color-text-muted,#555); }
ul { margin:0; padding-left:1.1em; } li { margin-bottom:var(--space-xs,8px); }
.no { color:var(--color-error,#b00); font-weight:500; }
.yes { color:var(--color-success,#070); font-weight:500; }
table { border-collapse:collapse; width:100%; font-size:0.875rem; }
td,th { text-align:left; padding:var(--space-xs,8px) var(--space-md,16px) var(--space-xs,8px) 0;
        border-bottom:1px solid var(--color-border,#0002); vertical-align:top; }
th { font-weight:500; color:var(--color-text-muted,#555); font-size:0.8125rem; }
</style>
${body}
`;

function buildHouseBundle() {
  const skill = read(SOURCES.skill);
  const tokensCss = read(SOURCES.tokens);
  const rules = auditRules(read(SOURCES.auditRules));
  const fonts = reflexFonts(skill);
  const bans = absoluteBans(skill);
  const tok = tokens(tokensCss);

  const blocks = rules.filter((r) => r.severity === 'BLOCK');
  const files = {};

  // --- the token scaffold: architecture, explicitly NOT a brand -------------
  files['tokens/colors_and_type.css'] =
    `/* ATLAS token architecture — a STRUCTURE, not a brand.
 *
 * --brand-h is a PLACEHOLDER hue. Every project overrides it (and the three
 * font faces) from its own brief. Never treat these values as "the look":
 * neutrals are brand-tinted, semantic roles flip via light-dark(), and all
 * default pairings are WCAG-AA verified in BOTH schemes by
 * skills/impeccable/scripts/check-contrast.mjs.
 *
 * Mirrored from ~/.claude/skills/impeccable/starter-tokens.css — do not edit
 * here; edit locally and re-compile.
 */
${asPlainCss(tokensCss)}`;

  // --- README: what this system is and, crucially, is NOT -------------------
  files['README.md'] = `# ATLAS House Rules

**This is a rulebook, not a look.** It fixes no palette, no type pairing, and no
register. Its whole job is to strip the defaults that make generated design read
as generated, and to hold the quality floors, so the art direction that arrives
in the prompt has room to be whatever it needs to be.

It exists because the opposite approach failed: a single fixed aesthetic as the
org default pulled every generation toward one register regardless of the brief.
Deleted 2026-07-22. What replaced it is this: constraints that never fight a
direction, only bad habits.

## Where direction comes from

**The prompt.** Every request carries its own art direction (palette, type
pairing, depth model, composition attitude) decided upstream by the local
web-dev system (a costume decision tree over 13 complete design languages, six
measured brand registers, and a synthesis procedure for inventing new ones,
plus real live exemplars in the brief's register).

**When the prompt names tokens, faces, or a costume, those WIN over anything
here.** This system never supplies a look of its own. If a request arrives with
no direction at all, ask for it rather than inventing a house style.

## Visual foundations (the architecture, not the values)

- **Color in OKLCH.** Neutrals are tinted toward the brand hue (chroma ≤0.009,
  felt rather than seen). Never pure gray, pure black, or pure white.
- **One accent, deployed at least two ways** (or a rationed set with a stated
  ration). An accent that appears once is decoration; an accent that appears
  everywhere is wallpaper.
- **Exactly ONE depth philosophy per design**: atmospheric, hard-offset,
  hairline-only, flat planes, or incised. Mixing depth models is the single most
  reliable slop tell.
- **A 4pt spacing scale with semantic names**, varied for hierarchy. The same
  padding everywhere reads as a template.
- **Type has fixed roles**: display / body / data-chrome. Two or three faces,
  never one, never five.

## Iconography

One family per project (Lucide, Phosphor, or the project's own). Never emoji as
UI icons. Never mix families.

## Voice

Real copy, always: never lorem ipsum, never \`[placeholder]\`. No startup
filler, no "isn't just X, it's Y" constructions, no rule-of-three runs, and no
em dashes in shipped copy (including this system's own).

---
Compiled from the local ATLAS web-dev system. Do not edit here; edit the
source and re-compile, or the next sync overwrites it.
`;

  // --- SKILL.md: the operating rules ---------------------------------------
  files['SKILL.md'] = `# How to design under ATLAS House Rules

Read README.md first: this system supplies **constraints and a token
architecture**, never a look. Direction arrives in the prompt and always wins.

## Hard floors, never traded away for any aesthetic

- **Contrast**: body text ≥ 4.5:1, large text (≥24px, or ≥18.66px bold) and
  non-text boundaries ≥ 3:1, in **every** scheme the design ships. Compute it;
  never assert it. (A pair asserted AA in five specs once measured 4.21:1.)
- **Focus**: always visible, accent-tinted, never the browser default blue,
  never \`outline: none\` without an equal replacement.
- **Targets**: interactive elements ≥ 24×24 CSS px (WCAG 2.2 2.5.8); ≥44px for
  primary touch actions.
- **Motion**: honor \`prefers-reduced-motion\`, non-negotiable. Animate only
  \`transform\` and \`opacity\`. Nothing routine exceeds 300ms. Never \`ease-in\`
  for UI. No bounce/elastic easing on interface elements.
- **Structure**: heading levels never skip. All media carries explicit
  dimensions or \`aspect-ratio\`. Every image has \`alt\` (null \`alt=""\` when
  decorative).

## Type

Two or three faces in fixed roles. Establish real hierarchy: a flat ramp where
everything is 16-24px reads as unfinished. Body copy 45-75 characters per line.
No justified text, no all-caps body, no tracking games on body copy.

**Never reach for these faces.** They are training-data defaults and produce
monoculture across unrelated projects:

${fonts.map((f) => `- ${f}`).join('\n')}

The single exception is provenance: a face that a real, established brand
already documents as its own **stands**. Match it, don't "correct" it. The test
is whether it was deliberately chosen and recorded, not what it's called.

## Never produce these: the recognizable tells

${bans.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Plus the ${blocks.length} blocking detector patterns the local audit enforces on
every build (slug list; each is a pattern that fails review outright):

${blocks.map((r) => `- \`${r.slug}\``).join('\n')}

## The positive gate, the one that matters most

Clearing every constraint above produces work that is *not slop*. That is not
the same as work that is *good*. Before you consider a design done, state its
**one-sentence art-direction thesis**, what it is committing to, and check
that the design actually expresses it. A page that dodges every tell and commits
to nothing is a failure, not a pass. Push the direction further than feels safe;
the constraints here are the floor, not the ceiling.

---
Compiled from the local ATLAS web-dev system (${blocks.length} BLOCK rules of
${rules.length} total detectors, ${fonts.length} rejected faces, ${bans.length}
absolute bans). Do not edit here; edit the source and re-compile.
`;

  // --- foundation + rule cards ---------------------------------------------
  const ramp = Object.keys(tok).filter((k) => /^--color-neutral-\d+$/.test(k));
  files['foundations/colors.html'] = card('Colors', 'Color architecture', tokensCss, `
<h1>Color architecture</h1>
<p class="lede">A structure, not a brand. One hue knob (<code>--brand-h</code>) retints the entire
palette; neutrals carry a trace of it so the greys feel related rather than dead. The values shown
are a placeholder hue that every project overrides.</p>
<div class="grid">
${['--color-surface', '--color-surface-raised', '--color-text', '--color-text-muted', '--color-border', '--color-primary']
  .map((k) => `  <div><div class="swatch" style="background:var(${k})"></div><div class="label">${k.replace('--color-', '')}</div><div class="mono">${k}</div></div>`)
  .join('\n')}
</div>
<h1 style="margin-top:var(--space-3xl,64px)">Neutral ramp</h1>
<p class="lede">Tinted toward the brand hue at chroma ≤0.009, felt rather than seen. Never pure grey.</p>
<div class="grid">
${ramp.map((k) => `  <div><div class="swatch" style="background:var(${k})"></div><div class="mono">${k.replace('--color-neutral-', '')}</div></div>`).join('\n')}
</div>
<h1 style="margin-top:var(--space-3xl,64px)">Status</h1>
<p class="lede">Scheme-flipped: mid-tone inks on light, L 0.70 inks on dark, so status text clears
4.5:1 in both. Filled status chips take neutral-950 text in dark, not white.</p>
<div class="grid">
${['--color-success', '--color-warning', '--color-error', '--color-info']
  .map((k) => `  <div><div class="swatch" style="background:var(${k})"></div><div class="label">${k.replace('--color-', '')}</div></div>`)
  .join('\n')}
</div>`);

  files['foundations/type.html'] = card('Type', 'Type roles', tokensCss, `
<h1>Type roles</h1>
<p class="lede">Three roles, fixed. The faces themselves always come from the project brief. The
architecture is what travels, not the typefaces.</p>
<table>
  <tr><th>Role</th><th>Token</th><th>Job</th></tr>
  <tr><td style="font-family:var(--font-display)">Display</td><td class="mono">--font-display</td><td>Headlines, the voice of the page</td></tr>
  <tr><td style="font-family:var(--font-body)">Body</td><td class="mono">--font-body</td><td>Reading copy, 45-75ch measure</td></tr>
  <tr><td style="font-family:var(--font-mono)">Data</td><td class="mono">--font-mono</td><td>Code, figures, chrome labels</td></tr>
</table>
<h1 style="margin-top:var(--space-3xl,64px)">Hierarchy is mandatory</h1>
<p class="lede">A ramp where everything sits between 16 and 24px reads as unfinished. Establish real
distance between levels.</p>
<div style="font-family:var(--font-display);line-height:1.1">
  <div style="font-size:3rem">Display</div>
  <div style="font-size:2rem">Heading</div>
  <div style="font-size:1.25rem">Subhead</div>
</div>
<p style="font-family:var(--font-body);max-width:65ch;margin-top:var(--space-lg,24px)">Body copy sits
at a comfortable measure of 45 to 75 characters. Longer and the eye loses the line return; shorter and
the rhythm breaks every few words.</p>`);

  files['foundations/spacing.html'] = card('Spacing', 'Spacing rhythm', tokensCss, `
<h1>Spacing rhythm</h1>
<p class="lede">A 4pt scale with semantic names. Vary it for hierarchy; identical padding everywhere
is the clearest sign nobody made a decision.</p>
<table>
  <tr><th>Token</th><th>Value</th><th></th></tr>
${['--space-2xs', '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl', '--space-4xl']
  .filter((k) => tok[k])
  .map((k) => `  <tr><td class="mono">${k}</td><td class="mono">${tok[k]}</td><td><div style="height:12px;width:${tok[k]};background:var(--color-primary);border-radius:2px"></div></td></tr>`)
  .join('\n')}
</table>
<p class="lede" style="margin-top:var(--space-2xl,48px)">Use <code>gap</code> for sibling spacing, not
margins. A heading with extra space above it reads as more important, so spend that.</p>`);

  files['foundations/motion.html'] = card('Motion', 'Motion budget', tokensCss, `
<h1>Motion budget</h1>
<p class="lede">Transform and opacity only. Nothing routine exceeds 300ms. Never <code>ease-in</code>
for interface motion, never bounce or elastic easing.</p>
<table>
  <tr><th>Component</th><th>Duration</th><th>Curve</th></tr>
  <tr><td>UI ceiling</td><td>&lt; 300ms</td><td>nothing routine exceeds this</td></tr>
  <tr><td>Button press</td><td>100-160ms</td><td>scale(0.97), ease-out</td></tr>
  <tr><td>Tooltip / small popover</td><td>125-200ms</td><td>ease-out</td></tr>
  <tr><td>Dropdown / select</td><td>150-250ms</td><td>ease-out</td></tr>
  <tr><td>Modal / drawer</td><td>200-500ms</td><td>cubic-bezier(0.32,0.72,0,1)</td></tr>
  <tr><td>Stagger between items</td><td>30-80ms</td><td>cap the total</td></tr>
</table>
<p class="lede" style="margin-top:var(--space-2xl,48px)"><code>prefers-reduced-motion</code> is not
optional. Minimum entrance is <code>scale(0.95)</code> + <code>opacity:0</code>, never
<code>scale(0)</code>.</p>`);

  files['rules/anti-slop.html'] = card('Rules', 'Never produce these', tokensCss, `
<h1>Never produce these</h1>
<p class="lede">The patterns that make generated design legible as generated. Each is enforced
mechanically on every local build; producing one here just means rework downstream.</p>
<h1 style="font-size:1.125rem;margin-top:var(--space-2xl,48px)">Absolute bans</h1>
<ul>
${bans.map((b) => `  <li><span class="no">Never</span> ${b}</li>`).join('\n')}
</ul>
<h1 style="font-size:1.125rem;margin-top:var(--space-2xl,48px)">Blocking detector patterns (${blocks.length})</h1>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-sm,12px)">
${blocks.map((r) => `  <div class="mono">${r.slug}</div>`).join('\n')}
</div>
<h1 style="font-size:1.125rem;margin-top:var(--space-2xl,48px)">And the one that isn't a ban</h1>
<p class="lede"><span class="yes">Always</span> commit to a one-sentence art-direction thesis, and
make the work express it. Clearing this whole list produces something that isn't slop, which is not
yet the same as something good.</p>`);

  files['rules/type-rejections.html'] = card('Rules', 'Faces never to reach for', tokensCss, `
<h1>Faces never to reach for</h1>
<p class="lede">Training-data defaults. They are not bad typefaces; they are the ones that show up
uninvited, and using them makes unrelated projects look like siblings. The project brief names the
real faces.</p>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space-sm,12px)">
${fonts.map((f) => `  <div><span class="no">✕</span> ${f}</div>`).join('\n')}
</div>
<p class="lede" style="margin-top:var(--space-2xl,48px)"><strong>Provenance exception</strong>: a
face a real established brand already documents as its own stands. Match it; never silently repaint
someone's identity to satisfy this list.</p>`);

  return files;
}

// --------------------------------------------------- per-project (a costume)

function buildProjectBundle(dir) {
  const root = resolve(dir);
  const impeccableMd = join(root, '.impeccable.md');
  if (!existsSync(impeccableMd))
    die(`no .impeccable.md in ${root} — a project system mirrors a LOCKED costume; there is none here`);
  const brief = readFileSync(impeccableMd, 'utf8');
  const name = (brief.match(/^#\s+(.+)$/m) || [, 'Project'])[1].trim();

  // the project's real token file, if the contrast manifest points at one
  let tokensCss = '';
  const pairs = join(root, 'contrast-pairs.json');
  if (existsSync(pairs)) {
    for (const rel of JSON.parse(readFileSync(pairs, 'utf8')).css || []) {
      const p = resolve(root, rel);
      if (existsSync(p)) tokensCss += readFileSync(p, 'utf8') + '\n';
    }
  }

  return {
    'README.md': `# ${name}

The locked costume for this project, mirrored from its \`.impeccable.md\`. Unlike
the house rules system, this one **does** fix a look — because this project has
one, decided upstream and recorded. Use these tokens exactly.

The house floors (contrast, focus, motion, anti-slop) still apply on top.

---
Compiled from ${relative(CLAUDE, impeccableMd).split('\\').join('/')} — do not edit here.
`,
    'brief.md': brief,
    ...(tokensCss ? { 'tokens/colors_and_type.css': tokensCss } : {}),
  };
}

// ------------------------------------------------------------- drift + write

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function hashesOf(map) {
  const out = {};
  for (const [k, p] of Object.entries(map)) out[k] = existsSync(p) ? sha(readFileSync(p, 'utf8')) : 'MISSING';
  return out;
}

// The push gate is the ARTIFACT, not its inputs: compile in memory and hash the
// result. Identical bundle => nothing to push, however much the sources moved.
const bundleHash = (files) =>
  sha(Object.keys(files).sort().map((k) => `${k}\u0000${files[k]}`).join('\u0001'));

if (CHECK) {
  if (!existsSync(MANIFEST)) {
    console.log('design-system mirror: never pushed — compile, then push via DesignSync.');
    process.exit(1);
  }
  const man = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const now = bundleHash(buildHouseBundle());
  const review = hashesOf(REVIEW_SOURCES);
  const movedDoctrine = Object.keys(review).filter((k) => review[k] !== (man.reviewSources || {})[k]);

  if (now === man.bundleHash) {
    console.log(`design-system mirror: current (pushed ${man.lastPush}, project ${man.projectName || man.projectId}).`);
    if (movedDoctrine.length)
      console.log(`  note: ${movedDoctrine.join(', ')} changed since that push — the bundle is unaffected, but check whether the hand-authored templates should follow.`);
    process.exit(0);
  }
  const src = hashesOf(SOURCES);
  const changed = Object.keys(src).filter((k) => src[k] !== (man.sources || {})[k]);
  console.log(`design-system mirror: STALE — the compiled bundle differs from the last push (${man.lastPush}).`);
  if (changed.length) for (const k of changed) console.log(`  changed source: ${SOURCES[k].split(/[\\/]/).pop()}`);
  console.log('\nre-compile, then push with DesignSync (finalize_plan → write_files).');
  process.exit(1);
}

const files = PROJECT ? buildProjectBundle(PROJECT) : buildHouseBundle();
mkdirSync(OUT, { recursive: true });
for (const [rel, content] of Object.entries(files)) {
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
}
console.log(`${Object.keys(files).length} file(s) → ${OUT}`);
for (const rel of Object.keys(files).sort()) console.log(`  ${rel}`);
console.log(`\nnext: push with the DesignSync tool —
  list_projects → create_project (first time only)
  finalize_plan  writes: ["**"]  localDir: "${OUT.split('\\').join('/')}"
  write_files    (localPath per file)
then record the push: node ${relative(process.cwd(), fileURLToPath(import.meta.url)).split('\\').join('/')} --record <projectId> <projectName>`);

// --record <projectId> <name> — stamp the manifest after a successful push
if (ARGS.includes('--record')) {
  const i = ARGS.indexOf('--record');
  const projectId = ARGS[i + 1], projectName = ARGS[i + 2] || 'ATLAS House Rules';
  if (!projectId) die('--record needs <projectId> [name]');
  mkdirSync(dirname(MANIFEST), { recursive: true });
  if (PROJECT) die('--record tracks the house mirror only (project systems are pushed on demand)');
  writeFileSync(MANIFEST, JSON.stringify({
    projectId,
    projectName,
    lastPush: new Date().toISOString(),
    bundleHash: bundleHash(files),   // the push gate
    sources: hashesOf(SOURCES),      // why it changed
    reviewSources: hashesOf(REVIEW_SOURCES), // advisory only
  }, null, 2) + '\n');
  console.log(`\nrecorded push → ${MANIFEST}`);
}
