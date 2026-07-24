# NOTICE — threejs-imperative (SK-151) — ⚠ LICENSE UNCONFIRMED

Vendored into the ATLAS web-dev system on 2026-07-20 (repo-integration round 3).

- **Source:** github:cloudai-x/threejs-skills
- **Pinned commit:** `b1c623076c661fc9b03dac19292e825a5d106823`
- **License: UNCONFIRMED / NONE.** The repo has **no LICENSE file**. Its README claims "MIT" in prose only, and its stated upstream (`pinkforest/threejs-playground`) is **404/gone**, so the provenance and license of the content cannot be verified.

## Adoption decision (user request, 2026-07-20)
Adopted at the user's explicit direction ("reconsider threejs-skills") **despite** the missing LICENSE file, under these conditions:
- **LOCAL PERSONAL REFERENCE ONLY.** The ATLAS vault/system is local-only and never pushed (vault git rule). This content must **not** be redistributed, published, or shipped in any deliverable.
- Content is generic Three.js API usage (r160+), largely re-derivable from the official Three.js docs — prefer Context7 `three` docs where authority matters.
- This **overrides** the skill-vet default "no LICENSE file = HARD REJECT" rule. That rule exists to prevent **redistribution** risk; the risk is minimal for a never-published local reference.

## Vendored files (verbatim into `reference/`)
`threejs-{fundamentals, geometry, materials, lighting, textures, animation, loaders, shaders, postprocessing, interaction}.md` (from upstream `skills/threejs-*/SKILL.md`), plus `_upstream-README.md`. Top-level `SKILL.md` (router) **authored locally** (upstream had no top-level SKILL.md).

## Excluded
None from the `skills/` set (no LICENSE existed to copy).

## Safety verification
Pure markdown; illustrative JS/GLSL code blocks only. Danger scan **clean** (no `curl|bash` / `eval` / `child_process` / network / auto-exec). The README's stale `git clone` / `git submodule add` instructions point to the dead `pinkforest` repo — **not executed**. Cloned to quarantine, never installed.
