# Symlink Architecture

> **Last verified**: 2026-04-20

## Pattern

37 skills in `~/.claude/skills/` are symlinks pointing to `/c/Users/leooa/.agents/skills/`.
These are Anthropic-maintained or community skills installed via the agents ecosystem.

## Source

All symlinks target: `/c/Users/leooa/.agents/skills/<skill-name>`

## Linked Skills

android-development, api-routes, building-native-ui, data-fetching, deploy-to-vercel,
dev-client, e2e-testing, expo-api-routes, expo-cicd-workflows, expo-deployment,
expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose,
expo-ui-swiftui, frontend-design, grill-me, mcp-builder, native-data-fetching,
next-best-practices, next-cache-components, next-upgrade, prd-to-plan, react-native,
skill-creator, swift-concurrency-pro, swift-testing-pro, swiftui-pro, tailwind-setup,
tdd, triage-issue, upgrading-expo, use-dom, vercel-composition-patterns,
vercel-react-best-practices, web-design-guidelines, write-a-prd

## Maintenance

- If `.agents/` source is updated (e.g., via `claude agents update`), symlinks auto-reflect changes
- If a symlink breaks (target deleted), the skill becomes unavailable — check with `ls -la ~/.claude/skills/ | grep "^l"`
