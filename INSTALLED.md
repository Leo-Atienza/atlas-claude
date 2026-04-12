# Installed Third-Party Resources

> Manifest of third-party skill packs, CLI tools, and integrations. Originally installed 2026-02-25 from [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code).

## Skills/Plugins (in ~/.claude/skills/)

### trailofbits-security/ (28 plugins)
Source: https://github.com/trailofbits/skills
License: CC-BY-SA-4.0
Categories: static analysis, variant analysis, differential review, Semgrep, CodeQL, smart contracts, malware (YARA), reverse engineering, property-based testing, spec compliance
Optional deps: CodeQL, Semgrep, YARA, Burp Suite (per skill)

### context-engineering-kit/ (13 plugins)
Source: https://github.com/NeoLabHQ/context-engineering-kit
Key plugins: sdd (Spec-Driven Development), reflexion, code-review, kaizen, tdd, git, ddd, docs, fpf, sadd, customaize-agent, mcp, tech-stack
Note: fpf plugin is ~600k tokens, loads in subagent

### cc-devops/ (31 skills) — REMOVED
Source: https://github.com/akin-ozer/cc-devops-skills
License: Apache 2.0
Note: Removed 2026-04-11 (0 active references, 15MB on disk). Available on GitHub if needed.

### compound-engineering/ (19 skills, 5 agent groups, 18 commands)
Source: https://github.com/EveryInc/compound-engineering-plugin
Version: 2.35.2 | License: MIT
Key workflows: /plan, /review, /work, /compound, /brainstorm
Philosophy: Each unit of work should make subsequent units easier

### cctools/ (5 plugins)
Source: https://github.com/pchalasani/claude-code-tools
Plugins: aichat (session search/recovery), safety-hooks, tmux-cli, voice, workflow
Optional deps: Rust (for aichat-search binary), Python 3.11+

### fullstack-dev/ (66 skills, 4 commands)
Source: https://github.com/Jeffallan/claude-skills
Key command: /common-ground (surfaces Claude's hidden assumptions)
Categories: 12 language experts, 10 backend frameworks, 6 frontend/mobile, plus infra, devops, security, testing

### infra-showcase/ (7 skills, 11 agents, 3 commands)
Source: https://github.com/diet103/claude-code-infrastructure-showcase
Reference library for hook-driven skill auto-activation patterns
Key file: skill-rules.json (context-aware skill selection)

### mattpocock-skills/ (5 skills)
Source: https://github.com/mattpocock/skills
License: MIT
Install method: `npx skills@latest add mattpocock/skills/<name> -y -g`
Installed to: `~/.agents/skills/` (symlinked into `~/.claude/skills/`)
Skills: tdd, triage-issue, write-a-prd, prd-to-plan, grill-me
Categories: TDD workflow, bug triage, PRD generation, implementation planning, design validation

### impeccable-design/ (3 skills + 10 reference modules)
Source: https://github.com/pbakaus/impeccable
License: Apache 2.0
Skills: design-audit (SK-078), design-critique (SK-079), design-polish (SK-080)
Reference modules: 3 critique refs (cognitive-load, heuristics-scoring, personas)
SK-005 upgrade: 7 frontend-design refs (typography, color-and-contrast, spatial-design, motion-design, interaction-design, responsive-design, ux-writing)
Note: Adapted from Impeccable's /audit, /critique, /polish commands. Template variables resolved. Impeccable-specific features (.impeccable.md config, teach-impeccable) removed.

### canvas-design/ (1 skill)
Source: https://github.com/anthropics/anthropic-cookbook (canvas-design)
License: Anthropic official
Skill: canvas-design (SK-075) — visual art creation via design philosophy manifestos

### deep-research/ (1 skill + 3 reference modules)
Source: https://github.com/199-biotechnologies/deep-research-claude-code
License: MIT
Skill: deep-research (SK-076) — enterprise research pipeline (8 phases, 3 modes)
Reference modules: methodology, quality-gates, report-assembly

### subagent-driven-dev/ (1 skill)
Source: https://github.com/nicobailon/subagent-driven-development
License: MIT (via obra/superpowers)
Skill: subagent-driven-dev (SK-077) — task dispatch + fresh subagent + two-stage review

### Knowledge entries (6 G-PAT from multiple sources)
G-PAT-027 (Verification-Before-Completion): obra/superpowers
G-PAT-028 (Bite-Sized Task Plans): obra/superpowers
G-PAT-029 (Token Optimization): Everything Claude Code community patterns
G-PAT-030 (Continuous Learning Loop): Everything Claude Code community patterns
G-PAT-031 (Context Compression Strategy): mksglu/context-mode + Context Engineering
G-PAT-032 (Skeleton Loading Generation): amorim/boneyard

### Context Mode MCP Server
Source: https://github.com/mksglu/context-mode
Package: context-mode@latest (npm)
License: Elastic-2.0
Purpose: Sandboxes tool output (98% context reduction), FTS5+BM25 search for relevant context retrieval
Config: Added to ~/.claude/.mcp.json as `context-mode` server
Security audit: postinstall.mjs clean (Windows path fixes only), no telemetry, no exfiltration

### MCP Servers (added 2026-04-12)

| Server | Source | License | Purpose | Cost |
|--------|--------|---------|---------|------|
| vercel | Official (mcp.vercel.com) | Proprietary (hosted) | Deployment management, build logs, env vars, domains | Free (all plans) |
| lighthouse | priyankark/lighthouse-mcp | MIT | Google Lighthouse audits: performance, accessibility, SEO, best practices | Free (runs locally) |
| firecrawl | firecrawl-mcp (npm) | AGPL-3.0 / MIT | Clean web content extraction for LLM consumption | Free tier (500 credits) or self-host free |
| heroui | @heroui/mcp (official) | MIT + Apache-2.0 | HeroUI component docs, props, types, theme tokens, examples | Free |
| aceternity | aceternityui-mcp | MIT | Animated landing page component registry (search, browse, install) | Free |
| iconify | iconify-mcp-server | GPL-3.0 | 200K+ icons from 200+ icon sets (Lucide, Heroicons, Phosphor, etc.) | Free |
| 21st-dev | @21st-dev/magic (official) | Proprietary | AI-generate polished components from text descriptions | Free (100 credits/mo) |

### App Development MCP Servers (added 2026-04-12)

| Server | Source | License | Purpose | Cost |
|--------|--------|---------|---------|------|
| storybook | @storybook/addon-mcp (official) | MIT | Component-level testing, story generation, a11y testing | Free |
| tauri-mcp | @hypothesi/tauri-mcp-server | MIT | Build, dev, test, scaffold Tauri v2 projects via MCP | Free |
| maestro | maestro mcp (official) | Apache-2.0 | Mobile E2E testing with auto-healing selectors | Free (Cloud paid) |
| openapi | @baryhuang/mcp-server-any-openapi | MIT | Auto-generate MCP tools from any OpenAPI/Swagger spec | Free |
| statsig | mcp.statsig.com (official, remote HTTP) | Proprietary | Feature flags, A/B experiments, metrics | Free (50M events/mo) |
| applitools | @applitools/mcp (official) | Proprietary | Visual AI regression testing on Playwright screenshots | **14-day trial only** (disabled) |

### Expo Official Skills (added 2026-04-12)
Source: https://github.com/expo/skills
Install: `npx skills@latest add expo/skills -y -g`
Skills (11): expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup, expo-ui-jetpack-compose, expo-ui-swiftui, native-data-fetching, upgrading-expo, use-dom
Location: `~/.agents/skills/` (symlinked into `~/.claude/skills/`)
Note: Opus-optimized, from official Expo team

### App Development Slash Commands (added 2026-04-12)
- `/new-mobile-app` -- Scaffold Expo + Supabase mobile project
- `/new-desktop-app` -- Scaffold Tauri desktop project
- `/api-design` -- Design and generate API from spec
- `/db-schema` -- Design and validate database schema

## CLI Tools

| Tool | Version | Source | Install Method |
|------|---------|--------|----------------|
| playwright-cli | 0.1.5 | npm (@playwright/cli) | `npm install -g @playwright/cli@latest` |
| claude-rules-doctor | 0.2.2 | npm | `npm install -g` |
| better-ccflare | latest | npm | `npm install -g` |
| tdd-guard | latest | npm | `npm install -g` |
| claude-squad | 1.0.14 | GitHub release | Pre-built Windows binary in ~/.local/bin/ |
| claudio | 1.11.1 | go install | `go install claudio.click/cmd/claudio@latest` |
| react-native-ai-debugger | latest | npm | `npm install -g react-native-ai-debugger --ignore-scripts` |
| maestro | 2.4.0 | get.maestro.mobile.dev | Installed in Ubuntu WSL2 (`~/.maestro/bin/maestro`) |

### WSL Distros
- **Ubuntu** (added 2026-04-12) — Installed for Maestro mobile E2E testing. Has Java 21 (OpenJDK), unzip.

## Hooks in settings.json
Active hooks: PreToolUse, PostToolUse, PostToolUseFailure, Notification, Stop, PreCompact, SessionStart
Removed 2026-04-05: UserPromptSubmit keyword-detector (0% apply rate), SubagentStop (never existed), subagent-limiter (no-op without tracker)
Re-added: UserPromptSubmit with cctools allow_git_hook.py (session-scoped git staging/commit approval toggle)
Legacy GSD hooks removed (2026-03-16)
