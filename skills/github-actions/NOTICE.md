# NOTICE — Vendored Third-Party Code

## Source

- **Repository:** https://github.com/callstackincubator/agent-skills
- **Commit (pinned):** `0ba043ab797d0e623384a6495b3bb0dadbd3181a` (default branch `main`)
- **Upstream path:** `skills/github-actions/`
- **License:** MIT — Copyright (c) Callstack (full text in `LICENSE`, copied verbatim from repo root)
- **Vendored:** 2026-06-19 (v8.13.0), from quarantine clone at `C:/tmp/claude-scratchpad/appdev-vendor-q2/repo/`. Originally vetted clean + adversarially-verified in the v8.12.0 app-dev skills.sh sweep (held for a bare-RN/native trigger); adopted now per the user's "complete the hand-off" decision. Re-scanned for danger patterns at vendor time — no executable/network/exfil patterns (pure docs).

## Vendored files (5)

| Local path | Upstream path | Modified? |
|---|---|---|
| `SKILL.md` | `skills/github-actions/SKILL.md` | **Yes — added `vendored_from` metadata key + one "In the ATLAS app-dev system" routing note; body/frontmatter otherwise unchanged** |
| `references/gha-android-composite-action.md` | same | No (verbatim) |
| `references/gha-ios-composite-action.md` | same | No (verbatim) |
| `references/gha-workflow-and-downloads.md` | same | No (verbatim) |
| `LICENSE` | `LICENSE` (repo root) | No |

`NOTICE.md` is an original local file, not from upstream.

## Excluded files (not vendored)

- `agents/openai.yaml` — OpenAI/Codex plugin-distribution machinery; not used by ATLAS skill loading.

## Safety verification

Pure documentation (`.md` only); no executable scripts. The skill contains GitHub Actions **YAML workflow templates** and `gh`/GitHub-API artifact-download commands as illustrative CI patterns — copied into the user's own repo by the user, never auto-executed by the skill. Danger-pattern grep at vendor time on 2026-06-19 returned **no matches**.
