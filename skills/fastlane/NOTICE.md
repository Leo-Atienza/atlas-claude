# NOTICE — Vendored Third-Party Code

## Source

- **Repository:** https://github.com/greenstevester/fastlane-skill
- **Commit (pinned):** `df44877684fd885cad6cd153ca58466b74eb9485` (default branch `main`)
- **License:** MIT — Copyright (c) 2024 greenstevester (full text in `LICENSE`, copied verbatim from repo root)
- **Vendored:** 2026-06-18, from quarantine copy at `C:/tmp/claude-scratchpad/appdev-vendor-quarantine/fastlane/`, per the `appdev-skill-vet` workflow (deep file read + adversarial skeptic pass, 2026-06-18 — verdict SAFE, skeptic NOT refuted)

## Vendored files (2)

| Local path | Upstream source | Modified? |
|---|---|---|
| `SKILL.md` | distilled from `skills/{setup-fastlane,beta,release,match,snapshot}/SKILL.md` + `docs/xcode-cloud.md` | **Yes — authored distillation, not verbatim** (see below) |
| `LICENSE` | `LICENSE` (repo root) | No (verbatim) |

`NOTICE.md` is an original local file.

## Why distilled rather than copied verbatim

The upstream ships **5 separate command-skills** whose `SKILL.md` files use Claude Code's `!`cmd`` **auto-executing inline syntax** (environment checks: `xcode-select`, `brew`, `fastlane --version`, `find`/`grep` over the Xcode project) plus slash-command frontmatter (`argument-hint`, `allowed-tools`). Vendoring those verbatim would (a) carry an auto-execution surface and (b) be inert on this Windows host (the iOS toolchain is macOS-only). They were therefore **consolidated into one authored reference `SKILL.md`** that:

- drops every `!`auto-exec`` pre-flight block (no surprise command execution),
- collapses the 5 command-skills into a single workflow reference (setup → match → snapshot → beta → release),
- makes the **macOS requirement + Windows-via-CI path** explicit,
- preserves the load-bearing technical content (Fastfile/Appfile/Matchfile templates, `setup_ci` + `match readonly` CI pattern, App Store Connect API-key auth, the RGB-no-alpha screenshot gotcha, Xcode Cloud / GitHub Actions wiring).

## Excluded files (not vendored)

- `skills/{setup-fastlane,beta,release,match,snapshot}/SKILL.md` — source for the distillation; the full per-command detail + troubleshooting tables remain available in the pinned upstream repo
- `docs/xcode-cloud.md` — folded into the SKILL.md CI section
- `README.md` — badges + marketing copy ("From zero to App Store…") + plugin-marketplace install instructions
- `CLAUDE.md` — upstream repo's own dev guide
- `.claude-plugin/marketplace.json`, `icon.png`, `todos.md` — plugin-marketplace machinery / roadmap

## Safety verification

No executable scripts shipped; all upstream shell is documentation inside markdown. The only auto-exec surface (the `!`cmd`` pre-flight blocks) was removed in distillation. Confirmed by the vet agent, an independent skeptic re-scan, and a local danger-pattern grep on 2026-06-18.
