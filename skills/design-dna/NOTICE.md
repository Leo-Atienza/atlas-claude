# NOTICE — design-dna (SK-150)

Vendored into the ATLAS web-dev system on 2026-07-20 (repo-integration round 3).

- **Source:** github:zanwei/design-dna
- **Pinned commit:** `9d9d79568df31cd846681f89fd3be1c3ce0c2aff`
- **License:** MIT (see `LICENSE`)

## Vendored files
| Path | Notes |
|---|---|
| `SKILL.md` | frontmatter adapted (+`license: MIT`, +`vendored_from`, +ATLAS routing note); body verbatim. Normalized CRLF→LF. |
| `references/schema.md` | verbatim — the 3-dimension schema incl. the `visual_effects` taxonomy (params / performance_tier / fallback_strategy) |
| `references/generation-guide.md` | verbatim |
| `LICENSE` | MIT verbatim |

## Excluded
- `README.md` + `README.{es,ja,ko,zh-CN,zh-TW}.md` (translated marketing READMEs).
- `docs/example-style-transfer.png` (demo image).
- `.gitignore`.

## Safety verification
Pure markdown (+ one excluded PNG). Danger scan **clean**. Phase-2 instructs fetching reference URLs and Phase-3 emits self-contained HTML — normal design-build behavior, no exfiltration pattern. Cloned to quarantine, never installed.
