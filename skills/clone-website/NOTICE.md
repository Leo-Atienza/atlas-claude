# NOTICE — clone-website (SK-145)

Vendored into the ATLAS skill system via `skill-vet` (SK-140) on 2026-07-20.

| | |
|---|---|
| **Source** | `github:JCodesMore/ai-website-cloner-template` |
| **Pinned SHA** | `58e00d5369181dc0b84b45a2a55e6f64a017f59b` |
| **License** | MIT (real `LICENSE` file, © 2025 JCodesMore) — passes the hard gate |

## Vendored files

| File | Origin | Adaptation |
|---|---|---|
| `SKILL.md` | `.claude/skills/clone-website/SKILL.md` | frontmatter only: added `license` + `metadata.vendored_from` + `sk_id`, prepended one ATLAS routing note (browser MCP = Claude_Browser; Node-24/scaffold caveat; ethics). Body verbatim (473 lines, 9 guiding principles + phased workflow). |
| `references/INSPECTION_GUIDE.md` | `docs/research/INSPECTION_GUIDE.md` | verbatim — the extraction checklist the skill references |
| `LICENSE` | repo-root `LICENSE` | verbatim |

## Excluded (deliberately not vendored)

- The **Next.js 16 template scaffold** (`app/`, `package.json`, `components/`, `tailwind`/`postcss` config, etc.) — this skill operates *inside* an existing Next.js + shadcn + Tailwind v4 project; the scaffold is set up at use time (`npx create-next-app` + `tailwind-setup`/`impeccable`), not carried in the skill. Upstream `package.json` pins `engines.node >=24`; the runtime works on the installed Node 22.
- `scripts/sync-skills.mjs` — upstream tool that regenerates per-platform copies from the source SKILL.md. **Inspected, not run**: pure `node:fs` read/write, no network, no `eval`/`exec`. Irrelevant once vendored.
- The parallel per-agent skill copies (`.codex/`, `.cursor/`, `.gemini/`, `.continue/`, `.windsurf/`, `.amazonq/`, `.github/skills/`, `.opencode/`) and `AGENTS.md`/`GEMINI.md`/`CLAUDE.md`/`README.md`.

## Runtime dependency

- **Browser automation MCP** (Pre-Flight #1). ATLAS: the in-app **Claude_Browser** pane (`mcp__Claude_Browser__*`); fallbacks `claude-in-chrome`, `playwright-cli`.
- A **Next.js 16 + shadcn/ui + Tailwind v4** project as the build target.

## Safety verification

- Danger-pattern scan over vendored files + `sync-skills.mjs`: **clean** (no `curl|bash`, `eval`, `exec`, network calls, telemetry).
- Upstream ethics guardrail preserved verbatim and reinforced in the routing note: clone only sites you have the right to; never for impersonation or passing off a design as your own.
- Complementary to `impeccable` (SK-102), not redundant: impeccable designs *original* UI; clone-website *reverse-engineers an existing* live site section-by-section.
