# NOTICE — Vendored Third-Party Code

## Source

- **Repository:** https://github.com/callstackincubator/agent-skills
- **Commit (pinned):** `0ba043ab797d0e623384a6495b3bb0dadbd3181a` (default branch `main`)
- **Upstream path:** `skills/upgrading-react-native/`
- **License:** MIT — Copyright (c) Callstack (full text in `LICENSE`, copied verbatim from repo root)
- **Vendored:** 2026-06-19 (v8.13.0), from quarantine clone at `C:/tmp/claude-scratchpad/appdev-vendor-q2/repo/`. Originally vetted clean + adversarially-verified in the v8.12.0 app-dev skills.sh sweep (held for a bare-RN/native trigger); adopted now per the user's "complete the hand-off" decision. Re-scanned for danger patterns at vendor time — no executable/network/exfil patterns (pure docs).

## Vendored files (10)

| Local path | Upstream path | Modified? |
|---|---|---|
| `SKILL.md` | `skills/upgrading-react-native/SKILL.md` | **Yes — added `vendored_from` metadata key + one "In the ATLAS app-dev system" routing note; body/sequence/frontmatter otherwise unchanged** |
| `references/expo-sdk-upgrade.md` | same | No (verbatim) |
| `references/monorepo-singlerepo-targeting.md` | same | No (verbatim) |
| `references/react.md` | same | No (verbatim) |
| `references/upgrade-helper-core.md` | same | No (verbatim) |
| `references/upgrade-verification.md` | same | No (verbatim) |
| `references/upgrading-dependencies.md` | same | No (verbatim) |
| `references/upgrading-react-native.md` | same | No (verbatim) |
| `LICENSE` | `LICENSE` (repo root) | No |

`NOTICE.md` is an original local file, not from upstream.

## Excluded files (not vendored)

- `agents/openai.yaml` — OpenAI/Codex plugin-distribution machinery; not used by ATLAS skill loading.

## Safety verification

Pure documentation (`.md` only); no executable scripts. Danger-pattern grep (`curl|bash`, `eval(`, `child_process`, `exec(`, `base64 -d`, network `fetch(`/`require(` of URLs, telemetry env vars) at vendor time on 2026-06-19 returned **no matches**. `gh`/`git` commands appearing in references are illustrative CI/upgrade instructions, never auto-executed by the skill.
