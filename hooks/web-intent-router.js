#!/usr/bin/env node
/**
 * web-intent-router.js — UserPromptSubmit hook.
 *
 * Fires when the user ASKS for a website (his two natural-language doors, per CLAUDE.md
 * "Web work has TWO natural-language doors" — he says "create a website" or
 * "upgrade/improve this website", never a slash command). Injects a short signpost
 * naming the right door + the brain that routes the tools.
 *
 * Why this exists alongside web-project-context.js (SessionStart): that hook detects
 * a web project from package.json, which leaves two gaps this one closes —
 *   1. NEW sites. "create a website" in an empty folder has no package.json, so the
 *      SessionStart hook never fires on exactly the case the user names first.
 *   2. Intent-time firing. SessionStart runs once at session open; an ask that
 *      arrives ten turns later gets nothing.
 *
 * SIGNPOST, NOT ORDERS. Per the standing feedback
 * (wiki/personal/feedback/webdev-brain-routes-not-mandates.md, the user 2026-07-04):
 * "hooks may POINT (a <=3-line signpost to the brain), never PRESCRIBE (no
 * checklists or orders in ambient context)". The brain + the task decide which
 * tools fire. Keep this short; do not grow it into a pipeline.
 *
 * FALSE POSITIVES are the real risk — the user talks ABOUT the web-dev system often
 * ("make sure the web-dev system uses everything"). Firing there is pure noise.
 * So: an action verb and a site noun must appear CLOSE together, and META_VETO
 * kills anything that is plainly about the system/brain/config rather than a site.
 *
 * Fail-open: any error -> silent exit 0. Non-blocking: only injects context.
 * ponytail: regex intent-matching, not a classifier — if it ever misfires, tighten
 * META_VETO first; a wrong signpost costs a few tokens, a missed one costs a build.
 */

'use strict';

const { readStdin, isHookEnabled, injectContext } = require('./lib');

// A site noun — what the user would call the deliverable.
const SITE = String.raw`(?:web\s?site|web\s?page|landing\s?page|home\s?page|portfolio|web\s?app|site|page)`;

// Door 1 — a NEW site gets built.
const BUILD = String.raw`(?:create|make|build|scaffold|start|spin\s+up|set\s+up|design|need|want)`;

// Door 2 — an EXISTING site gets better.
const IMPROVE = String.raw`(?:upgrade|improve|revamp|redesign|restyle|polish|beautify|refresh|moderni[sz]e|enhance|clean\s+up|fix\s+up|touch\s+up|overhaul)`;

// Verb and noun must sit within a short window; [^.!?]{0,32} keeps them in one clause
// so "make sure the web-dev system ... website" cannot bridge the gap.
const BUILD_RE = new RegExp(`\\b${BUILD}\\b[^.!?]{0,32}?\\b${SITE}\\b`, 'i');
const IMPROVE_RE = new RegExp(`\\b${IMPROVE}\\b[^.!?]{0,32}?\\b${SITE}\\b`, 'i');

// Plainly about the machinery, not a site to build. Vetoes everything.
const META_VETO = [
  /\bweb[-\s]?dev\s+system\b/i,
  /\b(the|this|our|my)\s+(system|brain|hook|hooks|validator|catalog|skill|skills|config|settings|pipeline|workflow|script)\b/i,
  /\bcapability[-\s]?map\b/i,
  /\b(claude\.?md|settings\.json|impeccable|atlas)\b/i,
  /\b(scan|read|look at|check|analy[sz]e)\b[^.!?]{0,20}\b(this|that|the)\s+(web\s?site|site|page)\b/i,
];

// An indefinite article after the build verb means a site that does not exist yet.
// Checked BEFORE EXISTING_HINT: "create a website for my portfolio" names the
// subject with a possessive, which must not read as "improve my existing site".
const NEW_HINT = new RegExp(`\\b${BUILD}\\b\\s+(?:me\\s+)?(?:a|an|another|new)\\b[^.!?]{0,24}?\\b${SITE}\\b`, 'i');

// Points at an EXISTING site rather than a new one.
const EXISTING_HINT = new RegExp(`\\b(?:this|that|the|existing|current)\\s+(?:\\w+\\s+){0,2}${SITE}\\b`, 'i');

function classify(prompt) {
  if (!prompt || prompt.length < 6) return null;
  if (META_VETO.some((p) => p.test(prompt))) return null;

  const improve = IMPROVE_RE.test(prompt);
  const build = BUILD_RE.test(prompt);
  if (!improve && !build) return null;

  if (improve) return 'existing';        // an improve-verb is decisive
  if (NEW_HINT.test(prompt)) return 'new'; // "create a website ..." beats a later possessive
  if (EXISTING_HINT.test(prompt)) return 'existing';
  return 'new';
}

const SIGNPOST = {
  new: [
    'WEB BUILD (new site). Door: `commands/new-web.md` — scaffold + tokens + the design consultation, then `/impeccable craft`.',
    'Brain routes the rest: `<your-vault-path>/wiki/web-dev/capability-map.md` (which tool when) + `stack.md` (current pins). Effects/components: `react-bits-catalog.md`, `ui-ux-catalog` (SK-133), and the motion ladder before any JS animation lib.',
    'Scale to the task — the brain and the ask decide how much of this fires.',
  ].join('\n'),
  existing: [
    'WEB BUILD (existing site). Door: read `.impeccable.md` + `wiki/web-dev/cook-log.md` first, then classify the ask (visual / feature / smoothness) and retrofit any missing gate baseline proportionally.',
    'Brain routes the rest: `<your-vault-path>/wiki/web-dev/capability-map.md` (which tool when). Design reference in play -> `/design-check` before coding.',
    'Scale to the task — the brain and the ask decide how much of this fires.',
  ].join('\n'),
};

function main() {
  if (!isHookEnabled('web-intent-router')) process.exit(0);
  readStdin((data) => {
    const prompt = data?.prompt || data?.message || '';
    const door = classify(prompt);
    if (!door) process.exit(0);
    injectContext(SIGNPOST[door], 'UserPromptSubmit');
  });
}

// Side effects only when run as a hook — so the matcher stays unit-testable
// (a bare require() previously blocked forever on readStdin).
if (require.main === module) {
  try { main(); } catch { process.exit(0); }
}

module.exports = { classify };
