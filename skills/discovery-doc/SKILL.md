# Discovery Doc — Project Vision Capture

> **Activate when:** `/gsd:new-project` questioning phase wraps up (Step 3 → Step 4 transition), or whenever a new project is initialized and its "why" hasn't been preserved.

---

## Why This Exists

`PROJECT.md` is a product spec — structured, comprehensive, forward-looking.
`DISCOVERY.md` is a vision doc — raw, motivational, backward-looking.

After a context reset, a new Claude session can read `DISCOVERY.md` in 60 seconds and understand the founder's intent. `PROJECT.md` tells you *what* to build; `DISCOVERY.md` tells you *why it matters*.

---

## When to Write It

Write `.planning/DISCOVERY.md` **immediately after** the `/gsd:new-project` deep questioning phase completes — before synthesizing `PROJECT.md`. Capture the conversation while it's fresh.

Also write it for any project that has `PROJECT.md` but no `DISCOVERY.md`.

---

## What Goes In It

Capture the human side of the conversation — not technical decisions, but:

| Section | What to capture |
|---------|-----------------|
| **Problem** | The specific pain or gap that prompted this. Concrete, not abstract. |
| **Key insight** | The "aha" that makes this approach right. The core bet. |
| **Vision** | What does success *feel* like? What does the user imagine using? |
| **Motivation** | What excited them? Why build this now vs later? |
| **Hard constraints** | Non-negotiables the user stated (tech, time, audience, budget). |
| **Anti-vision** | What this explicitly is NOT. Scope the problem space. |

**Tone:** Use the user's own words when possible. Preserve their phrasing.
**Length:** Aim for 30–60 lines. If it's longer, you're documenting requirements (that's PROJECT.md's job).

---

## Template

```markdown
# Discovery: [Project Name]

**Captured:** [date]

## Problem

[1-3 sentences describing the specific pain or gap. Concrete scenario, not abstract category.]

## Key Insight

[The core bet — why this approach solves the problem better than alternatives.]

## Vision

[What the user imagines using. "I want it to feel like X." Specific experience, not feature list.]

## Motivation

[Why now? What sparked this? What's the user excited about?]

## Hard Constraints

- [Non-negotiable 1 — stated explicitly by user]
- [Non-negotiable 2]
- [If none: "No hard constraints stated — open to best approach"]

## Anti-Vision

[What this is NOT. Things that came up and were explicitly ruled out.]
[If none: "Nothing ruled out yet"]

---
*Captured from `/gsd:new-project` questioning — [date]*
```

---

## How It Complements the GSD System

```
.planning/
├── DISCOVERY.md     ← The "why" (this file) — founder's voice, motivation
├── PROJECT.md       ← The "what" — requirements, decisions, scope
├── REQUIREMENTS.md  ← The "what exactly" — testable, scoped requirements
├── ROADMAP.md       ← The "how" — phases, sequencing, success criteria
└── STATE.md         ← The "where" — current progress, resume point
```

`DISCOVERY.md` is the only file a new Claude session needs to orient quickly before diving into `PROJECT.md` and the roadmap.

---

## Commit

After writing, commit alongside PROJECT.md:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs: capture project discovery" --files .planning/DISCOVERY.md
```

Or bundle with the PROJECT.md commit if writing them together.
