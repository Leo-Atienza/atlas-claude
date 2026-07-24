---
name: design-check
description: "MANDATORY pre-flight before UI work against any design reference (Figma, Stitch, screenshot, mockup): diff the current build vs the design and get sign-off on the concrete gap list BEFORE coding. Triggers on /design-check or 'make it look like this'."
---

# /design-check — Front-loaded visual diff before any UI code

Execute the workflow. Do not start coding until step 5 is signed off.

---

## Why this exists

The Claude Code Insights report (2026-05-13) flagged 2+ sessions where the user supplied screenshots after Claude shipped a build that missed tab-bar overlaps, dark-mode breaks, and design-fidelity gaps (cartoon icons where blobs were specified, text overflow, etc.). The fix is structural: **list the gaps BEFORE writing code, not after the user notices**.

This is the exact reverse of `mobile-app-design` and `design-polish` — those are reactive review skills. This one is the pre-flight gate.

---

## Step 1 — Inventory inputs

Identify the two artifacts to compare:

1. **Design reference**: URL (Stitch, Figma, dribbble), file path (PNG/JPG/PDF in the repo or `/c/tmp/`), or attached image in the conversation. If none provided, ask once: *"What's the design reference? Paste a URL, file path, or screenshot."*
2. **Current build output**: the running app or rendered page.
   - Web: dev server URL (start one if needed via `mcp__Claude_Browser__preview_start`)
   - Mobile (Flutter/RN): a running emulator/device snapshot or recent screenshot
   - Static: build artifact opened in browser

If either input is missing, **stop and ask**. Do not proceed with one-sided analysis.

---

## Step 2 — Choose the screenshot tool (with fallback)

Check `~/.claude/logs/tool-health.json` for browser-preview failure counts. The in-app browser preview (`mcp__Claude_Browser__*`; earlier builds exposed it as `mcp__Claude_Preview__*`, which had chronic screenshot-timeout issues) is the default eyes — but confirm it's healthy first:

```bash
node -e "const h=require('~/.claude/logs/tool-health.json').tools; const r7=n=>{const t=h[n];return t&&t.failures?t.failures.filter(f=>new Date(f)>new Date(Date.now()-7*864e5)).length:0}; const shot=r7('mcp__Claude_Browser__computer')+r7('mcp__Claude_Preview__preview_screenshot'); const nav=r7('mcp__Claude_Browser__navigate')+r7('mcp__Claude_Preview__preview_eval'); console.log('screenshot 7d failures:', shot, '| navigate/eval 7d failures:', nav);"
```

- **If failures in last 7d ≥ 3 for either** → skip the browser preview and fall back in CLAUDE.md order: (1) the `playwright-cli` skill (anthropic-skills symlink, runs locally), then (2) Docker-MCP Playwright (`mcp__MCP_DOCKER__browser_navigate` + `mcp__MCP_DOCKER__browser_take_screenshot` — check tool-health before trusting).
- **Otherwise** → use the browser preview (`mcp__Claude_Browser__preview_start` → `computer` with `action:"screenshot"`; `read_page` for structure/text).
- **If the whole chain fails** → ask the user to paste a screenshot of the running app.

---

## Step 3 — Capture both artifacts

1. Open the design reference. If it's a URL, fetch and view it as an image (use `mcp__MCP_DOCKER__browser_take_screenshot` after navigating, or `WebFetch` if it's a static image URL).
2. Capture the current build output via the chosen tool (Step 2). Match the design's viewport size — for mobile, resize to 390×844 (iPhone) or 360×800 (Android) before screenshotting.
3. Hold both side-by-side in your context. Reading code is not a substitute — you need pixels.

---

## Step 4 — List concrete gaps as a numbered checklist

Output the gap list as markdown. **Numbered checklist, not prose. One gap per line.** Each gap follows this format:

```
N. <Category> — <observed> | <design says>
```

Categories: `Layout`, `Spacing`, `Color`, `Typography`, `Iconography`, `Missing element`, `Extra element`, `Dark mode`, `Interaction state`, `Responsive`, `Anti-pattern`.

For the `Anti-pattern` category, cross-check candidate gaps against `skills/impeccable/reference/audit-rules.md` — cite the AR-ID in the gap line (e.g. `Anti-pattern — gradient text on hero heading (AR-02 / BAN 2)`).

Example output:

```markdown
## Gaps found between current build and Figma reference

1. Layout — header logo is left-aligned | design centers the logo
2. Spacing — card padding is 24px | design specifies 16px
3. Color — primary CTA is #6366f1 | design uses #4f46e5
4. Typography — body is Inter 14px regular | design uses Inter 14px medium
5. Iconography — using Material icons for nav | design shows custom blob icons
6. Missing element — design has a search bar above the list; current build has none
7. Dark mode — background flashes white on first paint; design specifies persistent dark
8. Interaction state — buttons have no hover state; design shows a 4% darken on hover
```

If you find zero gaps, say so explicitly: *"No visual gaps detected between current build and design. Safe to proceed."*

---

## Step 5 — Wait for sign-off

Print:

> **Sign-off requested.** Review the gap list above. Reply with one of:
> - `proceed all` — fix every gap, in numbered order
> - `proceed N,M,K` — fix only the listed gaps (e.g., `proceed 1,3,5`)
> - `defer N,M,K` — fix everything except the listed gaps
> - `add: <description>` — add a gap I missed
> - `wrong, redo` — re-capture screenshots and re-diff (e.g., I had stale state)

**Do not write any code until the user replies.** This is a hard gate. Without it, the Stitch-friction pattern recurs.

---

## Step 6 — Implement, then re-screenshot

For each accepted gap:
1. Make the minimum code change that addresses it
2. After all changes, re-run Step 3 (capture current build)
3. Re-list any remaining gaps as a checklist with status: `[x]` closed, `[ ]` still open, `[!]` regressed
4. Loop back to Step 5 if any gap is open or regressed

---

## When NOT to use this skill

- The user has explicitly said "skip the diff, just implement what I'm telling you"
- The change is non-visual (e.g., refactoring backend logic, adding tests)
- The user provided exact specifications in text (numeric values for spacing/color/typography) — though even then, screenshot-verifying is wise

## Notes for future evolution

- If the `weekly-mcp-health` scheduled task flags the browser preview as healthy again, this skill's Step 2 fallback rationale should be re-audited.
- If a Stitch MCP server appears, integrate it directly here for design-source-of-truth rather than scraping URLs.
