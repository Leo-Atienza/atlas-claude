# NOTICE — Vendored Third-Party Code

## Source

- **Repository:** https://github.com/safaiyeh/app-store-review-skill
- **Commit (pinned):** `c2532321a3f3f60f6f54bd584fb86290a5ba9940` (default branch `main`)
- **License:** MIT — Copyright (c) 2026 safaiyeh (full text in `LICENSE`, copied verbatim from repo root)
- **Vendored:** 2026-06-18, from quarantine copy at `C:/tmp/claude-scratchpad/appdev-vendor-quarantine/app-store-review/`, per the `appdev-skill-vet` workflow (deep file read + adversarial skeptic pass, 2026-06-18 — verdict SAFE, skeptic NOT refuted: license_ok + safety_ok + nonredundant_ok all true)

## Vendored files (7)

| Local path | Upstream path | Modified? |
|---|---|---|
| `SKILL.md` | `SKILL.md` | **Yes — added one "In the ATLAS app-dev system" routing note + a `vendored_from` metadata key; body/checklists/frontmatter otherwise unchanged** |
| `rules/1-safety.md` | `rules/1-safety.md` | No (verbatim) |
| `rules/2-performance.md` | `rules/2-performance.md` | No (verbatim) |
| `rules/3-business.md` | `rules/3-business.md` | No (verbatim) |
| `rules/4-design.md` | `rules/4-design.md` | No (verbatim) |
| `rules/5-legal.md` | `rules/5-legal.md` | No (verbatim) |
| `LICENSE` | `LICENSE` (repo root) | No |

`NOTICE.md` is an original local file, not from upstream.

## Excluded files (not vendored)

- `README.md` — install instructions + marketing copy + a mention of the skills-CLI's anonymous usage telemetry (`SKILLS_NO_TELEMETRY=1`); none of it travels. The telemetry belongs to the `npx skills` CLI installer, which we did **not** use (manual SHA-pinned vendor instead), so no telemetry path exists in the vendored copy.
- `metadata.json` — Codex-marketplace metadata, redundant with the SKILL.md frontmatter
- `.agents/plugins/marketplace.json`, `.codex-plugin/`, `.claude-plugin/manifest.json`, `agents/openai.yaml` — plugin/marketplace machinery for Codex/Claude-Code plugin distribution; not needed for a vendored skill

## Safety verification

Pure documentation (`.md` only); no executable scripts. The `eval(...)`, `fetch(...)`, `require(...)`, and `analytics(...)` strings inside `rules/*.md` and `SKILL.md` are **example REJECTED code patterns** the skill teaches reviewers to flag — they are illustrative, never executed. Confirmed by the vet agent, an independent skeptic re-scan, and a local danger-pattern grep on 2026-06-18.
