#!/usr/bin/env node
// verify-before-answer.js — UserPromptSubmit hook
//
// Injects a standing "verify external facts before asserting" reminder into
// Claude's context on every user prompt. It is *self-scoping*: the wording tells
// Claude to search only when the answer depends on an external / time-sensitive
// fact, and to skip purely local code/logic work — so it never forces a wasteful
// search on "fix this typo" or "what does line 4 do".
//
// Origin: the claude-fable-5 miss (2026-06-09) — Claude confidently asserted a
// model "didn't exist" from stale training data + a cached skill table, when the
// model had shipped that very day. A live lookup would have caught it.
//
// Mechanism: UserPromptSubmit hooks can return JSON whose
// hookSpecificOutput.additionalContext is injected into the model's context.
// suppressOutput keeps the raw JSON out of the user's transcript.

const reminder = [
  "VERIFY-BEFORE-ASSERT (standing rule):",
  "Before stating any external or time-sensitive fact — Claude/AI model names or IDs,",
  "version numbers, release dates, pricing, library/framework/API behavior, \"does X exist\",",
  "current events, or anything your training data or a cached skill could be stale on —",
  "confirm it with WebSearch / WebFetch or an authoritative docs/MCP source FIRST.",
  "Do not assert such facts from memory, even when confident; if a source contradicts memory, trust the source.",
  "Skip this for purely local work (editing this repo's code, logic, math, refactors) that needs no external fact.",
  "When unsure whether a claim is current, search rather than guess.",
].join(" ");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: reminder,
    },
    suppressOutput: true,
  }),
);
