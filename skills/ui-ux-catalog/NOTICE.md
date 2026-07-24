# NOTICE — Vendored Third-Party Code

## Source

- **Repository:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ("UI/UX Pro Max" / "Antigravity Kit")
- **Commit:** `07f4ef3ac2568c25a3b0c8ef5165a86abc3e56e4`
- **Tag:** `v2.5.0`
- **License:** MIT — Copyright (c) 2024 Next Level Builder (full text in `LICENSE`, copied verbatim from repo root)
- **Vendored:** 2026-06-11, from quarantine copy at `C:/tmp/claude-scratchpad/vendor-quarantine/nextlevelbuilder-ui-ux-pro-max-07f4ef3/`, per vet report `_extracts/uipromax-vet-report.md` (vetted 2026-06-10, verdict SAFE with one required patch set)
- **Upstream subtree:** everything below was taken from `src/ui-ux-pro-max/`

## Vendored files (16)

| Local path | Upstream path | Modified? |
|---|---|---|
| `data/app-interface.csv` | `src/ui-ux-pro-max/data/app-interface.csv` | No |
| `data/charts.csv` | `src/ui-ux-pro-max/data/charts.csv` | No |
| `data/colors.csv` | `src/ui-ux-pro-max/data/colors.csv` | No |
| `data/google-fonts.csv` | `src/ui-ux-pro-max/data/google-fonts.csv` | No |
| `data/icons.csv` | `src/ui-ux-pro-max/data/icons.csv` | No |
| `data/landing.csv` | `src/ui-ux-pro-max/data/landing.csv` | No |
| `data/products.csv` | `src/ui-ux-pro-max/data/products.csv` | No |
| `data/react-performance.csv` | `src/ui-ux-pro-max/data/react-performance.csv` | No |
| `data/styles.csv` | `src/ui-ux-pro-max/data/styles.csv` | No |
| `data/typography.csv` | `src/ui-ux-pro-max/data/typography.csv` | No |
| `data/ui-reasoning.csv` | `src/ui-ux-pro-max/data/ui-reasoning.csv` | No |
| `data/ux-guidelines.csv` | `src/ui-ux-pro-max/data/ux-guidelines.csv` | No |
| `data/stacks/react-native.csv` | `src/ui-ux-pro-max/data/stacks/react-native.csv` | No |
| `scripts/core.py` | `src/ui-ux-pro-max/scripts/core.py` | No (as-is) |
| `scripts/search.py` | `src/ui-ux-pro-max/scripts/search.py` | **Yes — patched (see patch log)** |
| `LICENSE` | `LICENSE` (repo root) | No |

`SKILL.md` and this `NOTICE.md` are original local files, not from upstream.

## Excluded files (per vet report)

- `src/ui-ux-pro-max/data/_sync_all.py` — maintainer tool; rewrites colors.csv + ui-reasoning.csv in place
- `src/ui-ux-pro-max/data/design.csv` — 108 KB Chinese-language reference doc, never loaded by any script
- `src/ui-ux-pro-max/data/draft.csv` — 108 KB backup/reference doc, never loaded by any script
- `src/ui-ux-pro-max/scripts/design_system.py` — design-system generator with file-write capability (`--persist` path); out of read-only scope
- `src/ui-ux-pro-max/templates/` (all), `cli/`, `.claude/`, `.claude-plugin/`, `.factory/`, `.shared/`, `preview/`, `cat-feeding-app/`, `screenshots/`, `docs/`, `README.md`, `CLAUDE.md` — installer machinery, npm CLI, bundled unrelated skills (incl. a network-fetching script), and repo docs; none travel

## Patch log — `scripts/search.py` (3 patches, 2026-06-11)

1. **Dropped the design_system import** — removed `from design_system import generate_design_system, persist_design_system` (design_system.py is not vendored).
2. **Removed design-system/persistence CLI surface** — deleted the `--design-system`, `--project-name`, `--format`, `--persist`, `--page`, `--output-dir` arguments and the entire `if args.design_system:` block (including the persistence-confirmation prints). Also fixed the stale `--stack` help text (`html-tailwind, react, nextjs` → `react-native`).
3. **Fixed the stale module docstring** — removed persistence usage lines and the `--design-system` invocations; corrected the domain list to the actual `CSV_CONFIG` keys (`style, color, chart, landing, product, ux, typography, icons, react, web, google-fonts`) and the stack list to `react-native`; documented the script as read-only.

**Post-patch property:** the vendored code has zero file-write capability. `search.py` only prints to stdout; `core.py` only opens CSVs in read mode (`open(filepath, 'r')`). Verified by full read of both files + `python -m py_compile` + smoke query on 2026-06-11.
