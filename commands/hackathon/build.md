# /hackathon:build — Demo-moment-first, atomic commits, scope-locked

You are handling: **$ARGUMENTS**

Args: `[feature-name]` (optional — if omitted, pick the next MUST-HAVE in priority order)

**Rule of the phase:** every 2 hours, the live URL must show the demo moment working end-to-end — even if half-mocked.

---

## Step 1 — Pre-flight

1. Read `.hackathon/scope.md`, `.hackathon/event.yaml`, `.hackathon/chosen-idea.md`.
2. Read `.hackathon/failures-log.md` (if exists) to avoid re-attempting things that already burned time.
3. Read project `CLAUDE.md` — hackathon-mode rules apply (skip tests, no branching, etc.).
4. If a feature name was passed, cross-check against MUST-HAVES in `scope.md`:
   - In scope → proceed
   - Not in scope → **HALT**. Say: *"`{{feature}}` is not in scope.md MUST-HAVES. Run `/hackathon:scope --amend` to add it (requires cutting another feature), or pick something from scope."* Exit.

If no feature passed, pick the next unchecked MUST-HAVE in priority order. If the demo moment feature isn't shipped yet, **ALWAYS** pick that first regardless of scope order.

## Step 2 — Load the right knowledge

Based on the stack preset, load the matching skill(s):
- `web-ai` / `agent` → `next-best-practices`, `claude-api` (if using Anthropic SDK)
- `saas` → `next-best-practices`, `data-fetching`
- `mobile` → `react-native`, `expo-*` skills as relevant
- `data-viz` → `data-fetching` + Observable Plot docs via Context7

Also check `topics/KNOWLEDGE-DIRECTORY.md` for G-ERR entries on the libraries involved — avoid known-failure patterns.

## Step 3 — Build the vertical slice

**Bottom-up infrastructure is forbidden during hackathons.** Always build vertical slices:
1. Stub the UI first (with mock data from `src/lib/seed.ts`) so the page looks real.
2. Wire the API route / server action to return hardcoded data.
3. Only then swap hardcoded → real (DB/LLM call) if time allows.

Keep commits atomic: **one feature per commit**. Commit message convention:
```
feat(scope): {{feature}}
```

Push on every commit so Vercel/EAS auto-deploy runs. If a push red-builds, **fix immediately** before next commit.

## Step 4 — The 30-minute stuck rule (enforced)

Start a mental timer on feature start. If you've exceeded the estimate in `scope.md` by 30 minutes:

1. **Stop debugging.**
2. **Mock the output.** Return fake data that looks real — the demo must run, even on a mock.
3. Append to `.hackathon/failures-log.md`:
   ```
   {{timestamp}} — {{feature}} — stuck after {{N}} min
   Blocker: {{one-line}}
   Workaround: {{what you mocked}}
   Revisit if time permits: {{yes/no}}
   ```
4. Move to the next MUST-HAVE.

If not stuck but want deeper triage, chain into `/flow:debug {{symptom}}` — but budget 10 min max before mocking.

## Step 5 — Every 2 hours: demo-moment checkpoint

Run a self-check:
- Open the live URL (via `preview_start` + `preview_screenshot`).
- Walk through the demo moment end-to-end.
- If broken: **STOP new features.** Fix the demo moment first — it's the only thing judges see.

Log the checkpoint in `.hackathon/build-log.md`:
```
{{timestamp}} — Demo moment status: {{working/broken/partial}}
Shipped this checkpoint: {{features}}
Next 2 hours: {{plan}}
```

## Step 6 — Quality gates per commit (hackathon-lite)

Run in order, halt on failure:
1. `npx tsc --noEmit` (or equivalent for non-TS) — types must compile; `any` is allowed but no red squigglies
2. `npm run build` — must succeed locally
3. Eyeball the live URL after Vercel/EAS deploys — must not be 500ing

**Skipped intentionally:** unit tests, lint auto-fixes, code formatting (do in `/hackathon:polish`).

If TypeScript trips hard: cast with `as any` + TODO comment. Don't architect around a types issue during a hackathon.

## Step 7 — Scope creep detection

Before writing any file, mentally cross-check against scope.md. If the feature you're about to build isn't there → halt, run `/hackathon:scope --amend`. The amend flow forces a 1-in-1-out trade: to add, you must cut.

Signals you're creeping:
- "It would be nice if..."
- "While I'm in here, let me also..."
- "The judges might like..."

All three should trigger a scope.md cross-check.

## Step 8 — End-of-feature summary

```
✅ Shipped: {{feature}}
Commit:   {{sha}}
Live URL: {{url}}
Next MUST-HAVE: {{next_feature}} (or "polish phase" if all done)

Demo moment still working? {{yes/no/partial}}
```

If all MUST-HAVES shipped:
```
🏁 All MUST-HAVES shipped. Time remaining: {{hours}}h.
Next: /hackathon:polish  (or pick from NICE-TO-HAVES if > 4 hr left)
```

---

**Plain English triggers**: "build the next feature", "ship the demo moment",
"next hackathon feature", "continue building"
