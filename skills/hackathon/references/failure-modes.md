# Hackathon Failure Modes

Every entry: **what goes wrong**, **why it kills the project**, **how this skill prevents it**. Load in `/hackathon:build` to keep the user honest.

---

## F-01 — Scope creep mid-build

**What:** Halfway through, you realize "it needs X too" and start building X. X triggers Y. Demo moment never finishes.

**Why it kills:** Judges score a complete-but-simple project higher than an ambitious half-finished one.

**Prevention:**
- `/hackathon:scope` writes `scope.md` as a **hard contract**
- `/hackathon:build` cross-references every feature against MUST-HAVES before coding
- Additions require `/hackathon:scope --amend` with forced 1-in-1-out trade

---

## F-02 — Tech stack bikeshedding

**What:** First 4 hours spent debating Prisma vs Drizzle, Clerk vs NextAuth, Postgres vs Firestore.

**Why it kills:** Zero demo progress while the clock runs. Decisions that don't affect demo quality.

**Prevention:**
- `/hackathon:ideate` auto-tags a preset
- `/hackathon:scaffold` uses locked stack — no discussion
- Presets in `stack-presets.md` are non-negotiable during event

---

## F-03 — "We'll deploy later"

**What:** Project stays localhost-only until hour 20. Deploy reveals env var issues, build errors, routing bugs. No time to fix.

**Why it kills:** Production != dev. Build-time bugs surface at the worst moment.

**Prevention:**
- `/hackathon:scaffold` MANDATES live URL before Phase 4 starts
- Every atomic commit auto-deploys
- 2-hour checkpoints verify the live URL still works

---

## F-04 — Auth rabbit hole

**What:** "We need users to log in." Spend 6 hours on OAuth callbacks, session management, token refresh.

**Why it kills:** Auth is necessary plumbing that judges don't see. Consumes demo-moment time.

**Prevention:**
- Presets skip auth by default
- If scope demands auth → **magic link only** (Supabase one-liner)
- Never OAuth during hackathon unless it's literally the demo moment

---

## F-05 — Pitch written at minute -5

**What:** "We'll figure out the pitch when we present." You stammer, miss the hook, run over time.

**Why it kills:** Judges decide in the first 10 seconds. A rushed pitch on a good project loses to a polished pitch on a worse one.

**Prevention:**
- `/hackathon:scope` drafts the 60-sec pitch BEFORE any code
- `/hackathon:pitch` assembles final script with timer markers
- Practice at least twice before presenting

---

## F-06 — Demo depends on live API

**What:** During judging, the OpenAI rate limit kicks in / WiFi drops / DB connection drops. App looks broken.

**Why it kills:** "It works on my machine" doesn't count when judges are watching.

**Prevention:**
- `/hackathon:demo` records 60-sec video as fallback
- Every external API has a mock-mode toggle
- Phase 5 `/hackathon:polish` adds error boundaries and graceful failure states

---

## F-07 — No seed data

**What:** Empty tables, blank charts, zero content. App looks like an unfinished shell even when the code works.

**Why it kills:** Judges can't evaluate UX on an empty app. They see "in progress" and move on.

**Prevention:**
- `/hackathon:scaffold` creates `lib/seed.ts` with 50+ realistic rows from minute 1
- `/hackathon:polish` verifies demo users/content exist before submission
- Never ship an app with < 10 sample records visible

---

## F-08 — Broken empty/loading/error states

**What:** Click a button → infinite spinner, or console error, or white screen. The happy path works but nothing else.

**Why it kills:** Judges click things. They find edge cases. One broken state ruins the impression of the entire app.

**Prevention:**
- `/hackathon:polish` adds loading, empty, and error states for every async op
- Sentry error boundary catches render failures
- Click-test every visible button before submission

---

## F-09 — Missing README / submission fields

**What:** Submit to devpost minute -2. Blank description, no screenshots, "What inspired you?" empty.

**Why it kills:** First-round judging is often async via the submission form. No README = no shot.

**Prevention:**
- `/hackathon:demo` generates README from `templates/readme.md`
- Submission checklist enforced in `/hackathon:pitch`
- Screenshots captured at `/hackathon:polish`, not at deadline

---

## F-10 — Last-minute "just one more feature"

**What:** T-30 min, you add the "really cool" feature. It breaks the build. The live URL is now broken during judging.

**Why it kills:** Risking a working demo for marginal feature gain is always the wrong trade.

**Prevention:**
- `/hackathon:demo` freezes the deploy — captures final commit SHA
- No code changes after video is recorded
- `/hackathon:pitch` only touches docs/scripts, never source

---

## F-11 — Solo devs taking on team-scale scope

**What:** One person picks a project that needs 3 people. Burns out by hour 15.

**Why it kills:** Exhaustion = bugs = broken demo.

**Prevention:**
- `/hackathon:ideate` scores buildability for solo-vs-team
- Solo projects with Buildability < 3 get flagged at scope-lock

---

## F-12 — Forgetting to read submission requirements

**What:** The event required a specific tech (e.g., "must use XYZ API") and you didn't use it. Disqualified.

**Why it kills:** Rubber-stamp disqualification despite great execution.

**Prevention:**
- `/hackathon:init` captures required-tech field in `event.yaml`
- `/hackathon:ideate` flags ideas that don't satisfy requirements
- `/hackathon:pitch` checklist verifies before submission

---

## F-13 — No mobile responsiveness (web projects)

**What:** Judges view on phones during presentations. Your desktop-only layout looks broken.

**Why it kills:** "Looks broken" > "doesn't work" in judging perception.

**Prevention:**
- `/hackathon:polish` uses Claude Preview MCP at mobile viewport
- Tailwind responsive classes applied from day 1 (all presets)

---

## F-14 — Ambitious AI prompt that fails 30% of the time

**What:** Demo works sometimes but not reliably. Live demo hits the failing 30%.

**Why it kills:** Probabilistic failure is worse than deterministic failure — judges can't tell if it's their fault.

**Prevention:**
- `/hackathon:polish` tests the demo moment 5x in a row
- If < 4/5 succeed → simplify the prompt or add a retry+fallback
- `agent` and `web-ai` presets include fallback mock responses

---

## F-15 — Stuck on one bug > 30 min

**What:** "Just one more try" on a stubborn bug, 2 hours later still stuck.

**Why it kills:** Opportunity cost — 2 hours spent debugging = 2 hours not demoing.

**Prevention:**
- **30-min stuck rule** in `/hackathon:build`
- At 30 min: mock the feature, log in `failures-log.md`, move on
- Bug can be revisited in `/hackathon:polish` if time permits
