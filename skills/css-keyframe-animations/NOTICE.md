# NOTICE — css-keyframe-animations (SK-146)

Created for the ATLAS web-dev system on 2026-07-20 (repo-integration round 3).

## License — the keyframe DATA, not the repos' packaging
The animations are the **Animista** library ([animista.net](https://animista.net/)). Animista grants its generated CSS under **BSD-2-Clause / FreeBSD — free for personal and commercial use, no attribution required** (its own site terms). That grant governs the reused keyframe data. The two source repos below were used only as already-extracted data mirrors; their `package.json` "ISC" claims have **no LICENSE file**, but that is moot — what's reused is Animista's BSD-2 keyframe DATA, not the repos' packaging.

## Sources (data mirrors, SHA-pinned)
| Repo | SHA | Role |
|---|---|---|
| MADEiN83/react-animista | `494613404ecee2256da1e11580db3713a508026f` | 219 pure-static `.css` — **correctness** source (verbatim durations + cubic-beziers) |
| Bigetion/animista-css-generator | `6243845e4c6830900c0b7cdaae1910e4fb5846a5` | 658-file superset — **completeness** source (bounce/fade/puff/swirl/slit/roll + all attention + text families) |

## Files
| Path | Notes |
|---|---|
| `SKILL.md` | authored thin router (56 lines) |
| `reference/catalog.md` | 49 `@keyframes` across 34 families (~50+ named incl. variants), 541 lines — verbatim keyframe math + timing functions; durations = Animista defaults (tunable) |

## Not vendored (rejected as runtime deps)
- react-animista as an npm dep — React-16-only, unmaintained (last push 2022).
- animista-css-generator's `css-hash` runtime `<style>` injection — data distilled, package NOT installed.

## Safety verification
Data-only distillation (pure CSS `@keyframes`, no JS runtime, no deps). Both repos inspected read-only in quarantine, never installed. `tada` / `foundation` excluded (they are animate.css, not Animista).
