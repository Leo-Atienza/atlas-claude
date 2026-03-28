# Symlink Architecture

> **Last verified**: 2026-03-16

## Pattern

25 skills in `~/.claude/skills/` are symlinks pointing to `/c/Users/leooa/.agents/skills/`.
These are Anthropic-maintained or community skills installed via the agents ecosystem.

## Source

All symlinks target: `/c/Users/leooa/.agents/skills/<skill-name>`

## Linked Skills

android-development, api-routes, building-native-ui, data-fetching (→ native-data-fetching),
deploy-to-vercel, dev-client, e2e-testing, expo-cicd-workflows, expo-deployment,
frontend-design, mcp-builder, next-best-practices, next-cache-components, next-upgrade,
react-native, skill-creator, swift-concurrency-pro, swift-testing-pro, swiftui-pro,
tailwind-setup, upgrading-expo, use-dom, vercel-composition-patterns,
vercel-react-best-practices, web-design-guidelines

## Maintenance

- If `.agents/` source is updated (e.g., via `claude agents update`), symlinks auto-reflect changes
- If a symlink breaks (target deleted), the skill becomes unavailable — check with `ls -la ~/.claude/skills/ | grep "^l"`
- `data-fetching` links to `native-data-fetching` (name differs from symlink name)
