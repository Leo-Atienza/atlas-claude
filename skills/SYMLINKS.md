# Symlink Architecture

> **Last verified**: 2026-07-20 (v10)

## Pattern

29 skills in `~/.claude/skills/` are symlinks pointing to `~/.agents/skills/`.
These are Anthropic-maintained or community skills installed via the agents ecosystem.

## Source

All symlinks target: `~/.agents/skills/<skill-name>`

## Linked Skills

android-development, building-native-ui, data-fetching, deploy-to-vercel,
expo-api-routes, expo-cicd-workflows, expo-deployment,
expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose,
expo-ui-swiftui, frontend-design, grill-me, native-data-fetching,
next-best-practices, next-cache-components, prd-to-plan, react-native,
skill-creator, swift-concurrency-pro, swift-testing-pro, swiftui-pro,
upgrading-expo, use-dom, vercel-composition-patterns,
vercel-react-best-practices, web-design-guidelines, write-a-prd

## Archived links (v10, 2026-07-20)

Four zero-evidence links moved to `skills/_archived/` (the LINK moved; upstream targets in `~/.agents/skills/` untouched, so a restore is `mv skills/_archived/<name> skills/<name>`): tdd, triage-issue, e2e-testing, mcp-builder. See `ARCHIVE-DIRECTORY.md` §v10.

## Maintenance

- If `.agents/` source is updated (e.g., via `claude agents update`), symlinks auto-reflect changes
- If a symlink breaks (target deleted), the skill becomes unavailable — check with `ls -la ~/.claude/skills/ | grep "^l"`

## Removed (deduped 2026-06-18, v8.11.0)

| Skill | Removed because | Kept instead |
|---|---|---|
| `dev-client` | byte-identical to `expo-dev-client` except the `name:` field | `expo-dev-client` |
| `api-routes` | byte-identical to `expo-api-routes` except the `name:` field | `expo-api-routes` |

Local symlinks moved to trash; upstream `~/.agents/skills/{dev-client,api-routes}/` untouched. A future `claude agents update` may re-create the local links (then it's a known cosmetic dup, not a regression).

## Native overrides (formerly symlinked)

These were upstream-managed but are now native to `~/.claude/skills/` because the user-specific content drifted from upstream:

| Skill | Native since | Reason |
|---|---|---|
| `tailwind-setup` | 2026-05-15 | Upstream was Expo-only, duplicated `expo-tailwind-setup`. Repurposed for the user's primary stack: Next.js 16 + Tailwind v4.3. |
| `next-upgrade` | 2026-05-15 | Upstream lacked v16.2.6 LTS / May 2026 security advisory references; rewritten to surface CVE-2026-29057 and the codemod set as of May 2026. |
