# NOTICE — gsap-plugins (SK-149)

Vendored into the ATLAS web-dev system on 2026-07-20 (repo-integration round 3).

- **Source:** github:greensock/gsap-skills (official GreenSock)
- **Pinned commit:** `aed9cfd3277740755f6bfc1155c7aa645403b760`
- **License:** MIT (see `LICENSE`)

## Vendored files
| Path | From upstream | Notes |
|---|---|---|
| `SKILL.md` | `skills/gsap-plugins/SKILL.md` | frontmatter adapted (+`vendored_from`, +ATLAS routing note); body verbatim |
| `reference/scrolltrigger-advanced.md` | `skills/gsap-scrolltrigger/SKILL.md` | verbatim (batch / scrollerProxy / containerAnimation / config table) |
| `reference/gsap-utils.md` | `skills/gsap-utils/SKILL.md` | verbatim |
| `reference/gsap-performance.md` | `skills/gsap-performance/SKILL.md` | verbatim |
| `LICENSE` | `LICENSE` | MIT verbatim |

## Excluded (redundant with SK-042/SK-044 or off-stack / machinery)
- `skills/gsap-core`, `gsap-timeline`, `gsap-react` — covered by SK-042 (GSAP Core) + SK-044 (GSAP Advanced).
- `skills/gsap-frameworks` — Vue/Svelte/Nuxt, off the user's React/Next stack.
- `.claude-plugin/`, `.cursor-plugin/`, `.github/`, `examples/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `assets/`, `skills/llms.txt` — marketplace / multi-agent vendor machinery.

## Safety verification
Pure markdown. Danger scan **clean**. The only `postinstall` in the repo was `nuxt prepare` inside `examples/nuxt/` — **not vendored**. Cloned to quarantine, never `npx skills add`.

## Freshness note (carried from upstream)
Post-Webflow acquisition, **all GSAP plugins are free**, including formerly Club-only ones (SplitText, MorphSVG). Do **not** generate `.npmrc` auth tokens or reference the private `npm.greensock.com` registry — `npm install gsap` includes everything.
