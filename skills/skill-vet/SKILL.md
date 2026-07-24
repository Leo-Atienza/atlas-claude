---
name: skill-vet
description: Discover, adversarially vet, and safely vendor external skills (skills.sh / GitHub) into the ATLAS skill system. Use when running a skills.sh sweep for a capability system, evaluating a candidate skill before adoption, or asked to "vet this skill", "sweep <system> for skills", "should we add <repo> skill", or "find skills for <topic>". Encodes the 3-gate default-refute vet (license / safety / non-redundancy), the scratch-dir-only clone safety rule, and the full registration checklist.
metadata:
  author: ATLAS (the user)
  version: "1.1.0"
  origin: v8.13.0 — formalized from the v8.12.0 appdev-skill-vet Workflow + its process-learning (#6); v8.20.0 — +§2b five-dimension quality score (SkillNet rubric, arXiv:2603.04448)
---

# Skill Vet — adversarial skills.sh adoption

The canonical procedure for bringing an external skill into the ATLAS system **without** importing unsafe code, license risk, or redundancy. Distilled from the v8.7.0 (design) and v8.12.0 (app-dev) sweeps. Use it for any new sweep or one-off candidate.

## Hard safety rule (the #6 fix — never violate)

> **Vet agents must INSPECT ONLY — never mutate the live system.** Two hard rules, both put verbatim in every vet-agent prompt:
> 1. **Never run `npx skills add` (or any installer) during vetting.** It writes into the live `skills/` dir *and* edits `settings.json` (hooks). Inspect candidates via `gh api` (license/tree/raw contents) or `WebFetch` on the skills.sh page only. *(Observed 2026-06-19: a full-stack vet agent ran `npx skills add ponytail`, dropping `skills/ponytail/` + a broken settings.json hook — caught + reverted by post-sweep `system-doctor`. Don't repeat it.)*
> 2. **Clone ONLY into `C:/tmp/claude-scratchpad/<system>-vendor-quarantine/` — never `git clone`/write into the session cwd, especially `~/.claude`.** *(v8.12.0: an `Explore` agent left a stray `app-store-review-skill-check/` clone in the `.claude` root.)*
>
> **Always run `node scripts/system-doctor.js` after any sweep** even when you adopt nothing — it catches agent-induced strays (the ponytail/clone cases above) that wouldn't show up otherwise.

## Pipeline

### 1. Discover
- `npx -y skills@latest search "<topic>"` → ranked candidates (owner/repo@skill, install counts, skills.sh URL). Run several topic queries per system.
- Cross-check with `gh search repos`, the system's existing topic pages, and `systems/<sys>/SYSTEM.md` to know what's already covered.
- Shortlist the strongest few per system (install count is a signal, not a verdict).

### 2. Adversarial vet (2-phase, default-refute)
For each shortlisted candidate, run a **deep-read** then an independent **skeptic** that tries to *refute* adoption. Adopt only if the skeptic is NOT refuted on all three gates:
- **`license_ok`** — a real `LICENSE` *file* exists in the repo and is permissive (MIT/Apache-2.0/BSD/ISC). A "MIT" claim in SKILL.md frontmatter with **no LICENSE file is a HARD REJECT** (redistribution-unsafe). Verify with `gh api repos/<o>/<r>/license`.
- **`safety_ok`** — danger-pattern scan over every file: `curl …| bash`, `eval(`, `exec(`, `child_process`, `base64 -d`, `wget …http`, network `fetch(`/`require(` of URLs, telemetry env (`*_NO_TELEMETRY`, analytics calls). Pure-doc skills (`.md` only) are the easy case; any script/auto-exec needs line-by-line justification. Illustrative "bad code" examples inside a review-skill's rules are fine **if** clearly non-executed.
- **`nonredundant_ok`** — does it add capability not already in `ACTIVE-DIRECTORY.md` / the system's MCPs? RN `*-best-practices` → already `react-native`; mobile design → `tactile`; Tauri → `tauri-mcp`, etc. Redundant = skip.

Use a Workflow with `schema`-typed verdicts (`{license_ok, safety_ok, nonredundant_ok, refuted, reason}`). 3+ agents per candidate for high-stakes adoptions.

### 2b. Five-dimension quality score (SkillNet rubric)

For candidates that survive the three hard gates, score them on the five SkillNet evaluation dimensions (zjunlp/SkillNet, arXiv:2603.04448, MIT — rubric adopted v8.20.0; the SkillNet *tool itself* was evaluated and rejected: its auto-installer bypasses exactly this vet). Any LOW score needs a written justification in the NOTICE, or the candidate becomes a hold:

- **Safety** — already enforced by the `safety_ok` hard gate.
- **Completeness** — does the SKILL.md + references actually cover the task it claims? Partial coverage → distill the useful part rather than vendor the claim.
- **Executability** — can *this* machine run it (OS, runtimes, accounts/keys)? Windows 11 + the actual installed toolchain; off-stack executability → hold (this is the the user-context filter, named).
- **Maintainability** — org-backed? release cadence? SHA-pin + refresh path viable? Dormant upstream → prefer distilling content over vendoring machinery.
- **Cost-Awareness** — the net-new dimension: context weight vs trigger fit. Estimate the tokens the skill adds when loaded (SKILL.md + always-loaded refs) against how often its triggers actually fire on this stack. Heavy skill + rare trigger = fail → distill to a thin router (the hyperframes SK-143 pattern: vendor the router, lazy-load the bulk) or hold.

### 3. the user-context adoption filter
Adopt to the **actual** stack: Windows 11 + Expo/EAS + personal/learning projects. Clean + useful but off-stack (e.g. bare-RN tooling on an Expo stack) → **hold**, recorded in `INSTALLED.md` so it isn't re-vetted. Don't bloat the count with skills that will never trigger.

### 4. Vendor (SHA-pinned)
- Clone at a specific commit into the quarantine dir; record the **full SHA**.
- Copy into `skills/<name>/`. **Strip** plugin/marketplace/telemetry machinery (`agents/openai.yaml`, `.claude-plugin/`, `.codex-plugin/`, `metadata.json`, install-README) — `mv` to trash, never `rm`.
- Keep `references/`/`rules/` **verbatim**. Adapt only `SKILL.md` frontmatter: add `license`, `metadata.vendored_from: github:<o>/<r>@<sha8>`, and one `> **In the ATLAS … system:**` routing note. Copy repo-root `LICENSE` in. Write a `NOTICE.md` (source, pinned SHA, license, vendored files table, excluded files, safety verification).

### 5. Register (every surface — counts must agree)
The **five** count surfaces `validate-skill-counts.js` enforces (must all match; README carries the number in THREE places):
1. `skills/ACTIVE-DIRECTORY.md` — `Total active skills: **N**` + a row per skill
2. `ARCHITECTURE.md` — `(N active skill entries` + the `6 Core + M Available` breakdown
3. `REFERENCE.md` — `Active skill index (N skills: …`
4. `SYSTEM_VERSION.md` — `Skills (in ACTIVE-DIRECTORY) | N` (also bump top-level `SKILL.md` + filesystem-total rows, and the `version:` strings)
5. `README.md` — the skills badge, the architecture-box line, the entry-points prose, and the dir-tree comment (validator reports box/prose/tree; found the hard way in v8.20.0)

Plus: the relevant `skills/ACTIVE-PAGE-*.md` section, `skills/VERSION-MANIFEST.json` (`skill_packs`, `"pinned": true`, full SHA + NOTICE ref), `systems/<sys>/SYSTEM.md` skills list, `INSTALLED.md` (adopted table + held/rejected record), `SYSTEM_CHANGELOG.md` (new version entry). Assign the next free `SK-NNN`.

### 6. Verify
`node scripts/validate-skill-counts.js` (four sources agree) **and** `node scripts/system-doctor.js` (11/11 green) before declaring done. Then update the session hand-off / project-state in the vault.

## Output
A per-candidate verdict table (adopt / hold / reject + reason), the registration diff summary, and the validator result. Adopt nothing that fails a gate; record holds/rejects so the next sweep doesn't redo the work.
