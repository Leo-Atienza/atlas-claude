#!/usr/bin/env node
/**
 * open-ended-scope-guard.js — UserPromptSubmit hook.
 *
 * Detects open-ended "finish the app" style prompts and injects a scope-bounding
 * reminder. Addresses Insights friction: 14 feature_implementation + 6 continue
 * sessions, with 12 wrong_approach + 2 excessive_changes events tied to broad
 * prompts like "continue thoroughly" or "finish the app".
 *
 * Triggers on prompts containing open-ended completion verbs WITHOUT specific
 * deliverable nouns. Examples that fire:
 *   - "finish the app"
 *   - "continue with the project"
 *   - "wrap up the implementation"
 *   - "execute the plan"
 *
 * Does NOT fire on already-bounded prompts:
 *   - "finish the login screen and add tests" (has specific deliverable)
 *   - "continue with step 3 of the R7 plan" (has specific reference)
 *
 * Fail-open: any error → silent exit 0.
 * Non-blocking: only injects context, never refuses prompts.
 *
 * Wired under hooks.UserPromptSubmit.
 */

'use strict';

const { readStdin, isHookEnabled, injectContext } = require('./lib');

if (!isHookEnabled('open-ended-scope-guard')) process.exit(0);

// Open-ended verbs that need scope bounding when paired with vague nouns
const VAGUE_PATTERNS = [
  /\bfinish\s+(the\s+)?(app|project|implementation|build|work|feature|thing|stuff|everything|all|it)\b/i,
  /\bcontinue\s+(thoroughly|with\s+the\s+(app|project|work|build|feature|implementation)|the\s+(app|project|work|implementation))\b/i,
  /\bwrap\s+up\s+(the\s+)?(app|project|implementation|work|everything)\b/i,
  /\bcomplete\s+(the\s+)?(app|project|implementation|work|everything|remaining)\b/i,
  /\bexecute\s+(the\s+)?(plan|tasks?|everything|all\s+tasks?)\b/i,
  /\bkeep\s+going\b/i,
  /\bdo\s+everything\b/i,
];

// Specific signals that mean the prompt IS bounded — skip the guard
const BOUNDED_SIGNALS = [
  /\bstep\s+\d+/i,                          // "step 3", "step 12"
  /\bphase\s+\d+/i,                         // "phase 2"
  /\bstage\s+\d+/i,                         // "stage 10"
  /\bwave\s+\d+/i,                          // "wave 4"
  /\b[Rr]\d+\b/,                            // "R6", "R7"
  /\bplan\s+(in|at|from)\s+[\w./-]+\.md/i,  // "plan in NEXT_STEPS.md"
  /\bbut\s+only\b/i,                        // explicit narrowing
  /\bjust\s+(the|a|one)\b/i,                // "just the login screen"
  /\bspecifically\b/i,                      // "specifically the auth flow"
  /\bonly\s+\w+/i,                          // "only the tests"
];

function isOpenEnded(prompt) {
  if (!prompt || prompt.length < 4) return false;
  // If any bounded signal appears, treat as scoped already
  for (const p of BOUNDED_SIGNALS) {
    if (p.test(prompt)) return false;
  }
  // Otherwise check for vague completion verbs
  return VAGUE_PATTERNS.some(p => p.test(prompt));
}

readStdin((data) => {
  const prompt = data?.prompt || data?.message || '';
  if (!isOpenEnded(prompt)) process.exit(0);

  injectContext([
    'SCOPE GUARD: This prompt is open-ended ("finish/continue/wrap up...").',
    '',
    'Before doing any work, respond with a brief scope plan:',
    '  1. List the 1-3 SPECIFIC deliverables you intend to complete in this turn.',
    '  2. State the explicit STOP CONDITION (when you\'ll consider it done).',
    '  3. Confirm what you will NOT touch (don\'t silently refactor unrelated code).',
    '',
    'Wait for user confirmation OR proceed only if the bounded scope is genuinely',
    'small (single file, <20 lines, no ambiguity).',
    '',
    'Why: Insights report flagged this prompt pattern as the #1 source of wrong_approach',
    'and excessive_changes friction. "Finish the app" prompts produce unfocused work.',
  ].join('\n'));
});
