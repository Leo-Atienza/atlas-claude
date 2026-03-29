# Resource Registry — Single Source of Truth

> **Last verified**: 2026-03-29
> **How to use**: Scan the Purpose column to match your task. Jump directly to the Path. Never scan skill directories.
> **Maintenance**: Append new entries immediately when added. Delete/update when removed or merged.
> **Lifecycle tags**: `[ARCHIVED]` = in skills dir, detected by skill-watcher hook. `[DEPRECATED]` = scheduled for removal.
> **Auto-recovery**: Archived skills are auto-detected by `skill-watcher.sh` hook at session start. When your project uses an archived technology, you'll be prompted to unarchive it.

---

## Standalone Skills (Active)

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SK-001 | docx | Create/read/edit Word documents | `skills/docx/SKILL.md` |
| SK-002 | pdf | Read/merge/split/create PDFs, OCR, fill forms | `skills/pdf/SKILL.md` |
| SK-003 | pptx | Create/edit slide decks and presentations | `skills/pptx/SKILL.md` |
| SK-004 | xlsx | Open/edit/create spreadsheets, CSV conversion | `skills/xlsx/SKILL.md` |
| SK-005 | frontend-design | Production-grade frontend interfaces, animation, CSS | `skills/frontend-design/SKILL.md` |
| SK-006 | ui-design-stack | UX strategy + design intelligence (67 styles, 161 palettes, BM25 search) | `skills/ui-design-stack/SKILL.md` |
| SK-007 | threejs | Three.js 3D — scene, geometry, materials, shaders, animation | `skills/threejs/SKILL.md` |
| SK-008 | remotion | Programmatic video with React | `skills/remotion/SKILL.md` |
| SK-009 | playwright | Web browser automation & testing (Chromium/Firefox/WebKit) | `skills/playwright/SKILL.md` |
| SK-010 | ckm | ClaudeKit design — brand, logos, CIP, banners, slides, icons, social | `skills/ckm/SKILL.md` |
| SK-011 | mcp-builder | Guide for creating MCP servers (Python FastMCP / Node TS) | `skills/mcp-builder/SKILL.md` |
| SK-012 | skill-creator | Create/modify/measure Claude Code skills | `skills/skill-creator/SKILL.md` |
| SK-013 | theme-factory | Apply themes to any artifact (10 presets + custom) | `skills/theme-factory/SKILL.md` |
| SK-014 | brand-guidelines | Anthropic official brand colors and typography | `skills/brand-guidelines/SKILL.md` |
| SK-015 | discovery-doc | Capture project vision (DISCOVERY.md) during init | `skills/discovery-doc/SKILL.md` |
| SK-027 | e2e-testing | AI-powered E2E testing (mobile/desktop) | `skills/e2e-testing/SKILL.md` |
| SK-028 | deploy-to-vercel | Deploy apps/websites to Vercel | `skills/deploy-to-vercel/SKILL.md` |
| SK-029 | next-best-practices | Next.js conventions — RSC, data patterns, async APIs | `skills/next-best-practices/SKILL.md` |
| SK-030 | next-cache-components | Next.js 16 Cache Components — PPR, use cache, cacheLife | `skills/next-cache-components/SKILL.md` |
| SK-031 | next-upgrade | Upgrade Next.js to latest with migration guides | `skills/next-upgrade/SKILL.md` |
| SK-032 | vercel-composition-patterns | React composition patterns that scale | `skills/vercel-composition-patterns/SKILL.md` |
| SK-033 | vercel-react-best-practices | React/Next.js perf optimization from Vercel Engineering | `skills/vercel-react-best-practices/SKILL.md` |
| SK-034 | web-design-guidelines | Web Interface Guidelines compliance review | `skills/web-design-guidelines/SKILL.md` |
| SK-038 | self-evolve | Detect capability gaps, create skills, add free MCP servers autonomously | `skills/self-evolve/SKILL.md` |
| SK-039 | smart-swarm | Auto-organize multi-agent teams based on 5D complexity scoring | `skills/smart-swarm/SKILL.md` |
| SK-040 | dream | Multi-phase memory consolidation — orient, gather signal, merge, prune | `skills/dream/SKILL.md` |
| SK-041 | project-init | Auto-generate project CLAUDE.md from stack-detected templates | `skills/project-init/SKILL.md` |
| SK-042 | gsap-core | GSAP core tweens, easing, stagger, transforms | `skills/gsap-core/SKILL.md` |
| SK-043 | gsap-timeline | GSAP timeline sequencing, position parameter, labels | `skills/gsap-timeline/SKILL.md` |
| SK-044 | gsap-scrolltrigger | GSAP ScrollTrigger — scroll-driven animation, scrub, pin | `skills/gsap-scrolltrigger/SKILL.md` |
| SK-045 | gsap-plugins | GSAP plugins — Flip, Draggable, SplitText, ScrollTo | `skills/gsap-plugins/SKILL.md` |
| SK-046 | gsap-utils | GSAP utility functions | `skills/gsap-utils/SKILL.md` |
| SK-047 | gsap-react | GSAP React integration — useGSAP hook, refs, context | `skills/gsap-react/SKILL.md` |
| SK-048 | gsap-performance | GSAP performance best practices | `skills/gsap-performance/SKILL.md` |
| SK-050 | nano-banana | Google Nano Banana (Gemini Image) — AI image gen/edit, all models, grounding, batch, constraints | `skills/nano-banana/SKILL.md` |
| SK-051 | dev-cycle | Disciplined dev cycle — enforces discovery, scoping, design before code. Scope creep guard, MoSCoW, appetite tracking | `skills/dev-cycle/SKILL.md` |
| SK-052 | linkedin-poster | Compose and publish LinkedIn posts (text, articles, images) via LinkedIn API | `skills/linkedin-poster/SKILL.md` |
| SK-053 | stop-slop | Remove AI writing patterns from prose — banned phrases, structural anti-patterns, scoring rubric | `skills/stop-slop/SKILL.md` |

## Standalone Skills (Archived — auto-detected by skill-watcher)

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SK-016 | react-native | `[ARCHIVED]` React Native + Expo optimization | `skills/react-native/SKILL.md` |
| SK-017 | building-native-ui | `[ARCHIVED]` Expo Router UI fundamentals | `skills/building-native-ui/SKILL.md` |
| SK-018 | data-fetching | `[ARCHIVED]` Network requests, Expo Router loaders | `skills/data-fetching/SKILL.md` |
| SK-019 | android-development | `[ARCHIVED]` Production Android apps | `skills/android-development/SKILL.md` |
| SK-020 | api-routes | `[ARCHIVED]` Expo Router API routes | `skills/api-routes/SKILL.md` |
| SK-021 | tailwind-setup | `[ARCHIVED]` Tailwind CSS v4 in Expo/NativeWind | `skills/tailwind-setup/SKILL.md` |
| SK-022 | dev-client | `[ARCHIVED]` Expo dev client builds | `skills/dev-client/SKILL.md` |
| SK-023 | expo-cicd-workflows | `[ARCHIVED]` EAS workflow YAML | `skills/expo-cicd-workflows/SKILL.md` |
| SK-024 | expo-deployment | `[ARCHIVED]` Deploy Expo to stores | `skills/expo-deployment/SKILL.md` |
| SK-025 | upgrading-expo | `[ARCHIVED]` Upgrade Expo SDK | `skills/upgrading-expo/SKILL.md` |
| SK-026 | use-dom | `[ARCHIVED]` Expo DOM components | `skills/use-dom/SKILL.md` |
| SK-035 | swift-concurrency-pro | `[ARCHIVED]` Swift concurrency review | `skills/swift-concurrency-pro/SKILL.md` |
| SK-036 | swift-testing-pro | `[ARCHIVED]` Swift Testing APIs | `skills/swift-testing-pro/SKILL.md` |
| SK-037 | swiftui-pro | `[ARCHIVED]` SwiftUI code review | `skills/swiftui-pro/SKILL.md` |
| SK-049 | gsap-frameworks | `[ARCHIVED]` GSAP Vue/Svelte integration | `skills/gsap-frameworks/SKILL.md` |

## DevOps — Generators & Validators (Archived)

> All DevOps skills archived. Auto-detected by skill-watcher when project contains matching config files.

| ID | Name | Purpose | Path |
|----|------|---------|------|
| DV-001 | terraform-generator | `[ARCHIVED]` Generate Terraform projects | `skills/cc-devops/terraform-generator/SKILL.md` |
| DV-002 | terraform-validator | `[ARCHIVED]` Validate Terraform + Checkov | `skills/cc-devops/terraform-validator/SKILL.md` |
| DV-003 | terragrunt-generator | `[ARCHIVED]` Generate Terragrunt configs | `skills/cc-devops/terragrunt-generator/SKILL.md` |
| DV-004 | terragrunt-validator | `[ARCHIVED]` Validate Terragrunt configs | `skills/cc-devops/terragrunt-validator/SKILL.md` |
| DV-005 | dockerfile-generator | `[ARCHIVED]` Generate Dockerfiles | `skills/cc-devops/dockerfile-generator/SKILL.md` |
| DV-006 | dockerfile-validator | `[ARCHIVED]` Validate Dockerfiles | `skills/cc-devops/dockerfile-validator/SKILL.md` |
| DV-007 | k8s-yaml-generator | `[ARCHIVED]` Generate K8s manifests | `skills/cc-devops/k8s-yaml-generator/SKILL.md` |
| DV-008 | k8s-yaml-validator | `[ARCHIVED]` Validate K8s manifests | `skills/cc-devops/k8s-yaml-validator/SKILL.md` |
| DV-009 | k8s-debug | `[ARCHIVED]` Debug Kubernetes issues | `skills/cc-devops/k8s-debug/SKILL.md` |
| DV-010 | helm-generator | `[ARCHIVED]` Generate Helm charts | `skills/cc-devops/helm-generator/SKILL.md` |
| DV-011 | helm-validator | `[ARCHIVED]` Validate Helm charts | `skills/cc-devops/helm-validator/SKILL.md` |
| DV-012 | github-actions-generator | `[ARCHIVED]` Generate GH Actions workflows | `skills/cc-devops/github-actions-generator/SKILL.md` |
| DV-013 | github-actions-validator | `[ARCHIVED]` Validate GH Actions workflows | `skills/cc-devops/github-actions-validator/SKILL.md` |
| DV-014 | gitlab-ci-generator | `[ARCHIVED]` Generate GitLab CI pipelines | `skills/cc-devops/gitlab-ci-generator/SKILL.md` |
| DV-015 | gitlab-ci-validator | `[ARCHIVED]` Validate GitLab CI pipelines | `skills/cc-devops/gitlab-ci-validator/SKILL.md` |
| DV-016 | azure-pipelines-generator | `[ARCHIVED]` Generate Azure Pipelines | `skills/cc-devops/azure-pipelines-generator/SKILL.md` |
| DV-017 | azure-pipelines-validator | `[ARCHIVED]` Validate Azure Pipelines | `skills/cc-devops/azure-pipelines-validator/SKILL.md` |
| DV-018 | jenkinsfile-generator | `[ARCHIVED]` Generate Jenkinsfiles | `skills/cc-devops/jenkinsfile-generator/SKILL.md` |
| DV-019 | jenkinsfile-validator | `[ARCHIVED]` Validate Jenkinsfiles | `skills/cc-devops/jenkinsfile-validator/SKILL.md` |
| DV-020 | ansible-generator | `[ARCHIVED]` Generate Ansible playbooks | `skills/cc-devops/ansible-generator/SKILL.md` |
| DV-021 | ansible-validator | `[ARCHIVED]` Validate Ansible playbooks | `skills/cc-devops/ansible-validator/SKILL.md` |
| DV-022 | bash-script-generator | `[ARCHIVED]` Generate bash scripts | `skills/cc-devops/bash-script-generator/SKILL.md` |
| DV-023 | bash-script-validator | `[ARCHIVED]` Validate bash scripts | `skills/cc-devops/bash-script-validator/SKILL.md` |
| DV-024 | makefile-generator | `[ARCHIVED]` Generate Makefiles | `skills/cc-devops/makefile-generator/SKILL.md` |
| DV-025 | makefile-validator | `[ARCHIVED]` Validate Makefiles | `skills/cc-devops/makefile-validator/SKILL.md` |
| DV-026 | promql-generator | `[ARCHIVED]` Generate PromQL queries | `skills/cc-devops/promql-generator/SKILL.md` |
| DV-027 | promql-validator | `[ARCHIVED]` Validate PromQL queries | `skills/cc-devops/promql-validator/SKILL.md` |
| DV-028 | logql-generator | `[ARCHIVED]` Generate LogQL queries | `skills/cc-devops/logql-generator/SKILL.md` |
| DV-029 | fluentbit-generator | `[ARCHIVED]` Generate Fluent Bit configs | `skills/cc-devops/fluentbit-generator/SKILL.md` |
| DV-030 | fluentbit-validator | `[ARCHIVED]` Validate Fluent Bit configs | `skills/cc-devops/fluentbit-validator/SKILL.md` |
| DV-031 | loki-config-generator | `[ARCHIVED]` Generate Loki configs | `skills/cc-devops/loki-config-generator/SKILL.md` |

## Security — Trail of Bits (Active Core)

> Core 3 kept active for every PR. Deep analysis skills archived — auto-detected when needed.

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SC-001 | sharp-edges | API footguns, dangerous defaults, fail-open patterns | `skills/trailofbits-security/sharp-edges/` |
| SC-002 | differential-review | Risk classification on diffs, attack scenarios | `skills/trailofbits-security/differential-review/` |
| SC-003 | insecure-defaults | Hardcoded secrets, weak defaults, fail-open detection | `skills/trailofbits-security/insecure-defaults/` |
| SC-004 | variant-analysis | Search for similar vulnerabilities | `skills/trailofbits-security/variant-analysis/` |
| SC-005 | static-analysis | Semgrep parallel scan + CodeQL taint tracking | `skills/trailofbits-security/static-analysis/` |
| SC-019 | modern-python | Modern Python (uv, ruff, ty, pytest) | `skills/trailofbits-security/modern-python/` |
| SC-022 | gh-cli | GitHub CLI patterns | `skills/trailofbits-security/gh-cli/` |
| SC-023 | git-cleanup | Git branch/ref cleanup | `skills/trailofbits-security/git-cleanup/` |
| SC-026 | claude-in-chrome-troubleshooting | Debug Claude in Chrome MCP | `skills/trailofbits-security/claude-in-chrome-troubleshooting/` |

## Security — Trail of Bits (Archived)

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SC-006 | property-based-testing | `[ARCHIVED]` Roundtrip, idempotence, invariant properties | `skills/trailofbits-security/property-based-testing/` |
| SC-007 | audit-context-building | `[ARCHIVED]` Build context for security audits | `skills/trailofbits-security/audit-context-building/` |
| SC-008 | semgrep-rule-creator | `[ARCHIVED]` Create custom Semgrep rules | `skills/trailofbits-security/semgrep-rule-creator/` |
| SC-009 | semgrep-rule-variant-creator | `[ARCHIVED]` Create Semgrep rule variants | `skills/trailofbits-security/semgrep-rule-variant-creator/` |
| SC-010 | spec-to-code-compliance | `[ARCHIVED]` Verify code matches spec | `skills/trailofbits-security/spec-to-code-compliance/` |
| SC-011 | constant-time-analysis | `[ARCHIVED]` Verify constant-time crypto | `skills/trailofbits-security/constant-time-analysis/` |
| SC-012 | testing-handbook-skills | `[ARCHIVED]` Security testing patterns | `skills/trailofbits-security/testing-handbook-skills/` |
| SC-013 | building-secure-contracts | `[ARCHIVED]` Secure smart contracts | `skills/trailofbits-security/building-secure-contracts/` |
| SC-014 | entry-point-analyzer | `[ARCHIVED]` Analyze contract entry points | `skills/trailofbits-security/entry-point-analyzer/` |
| SC-015 | firebase-apk-scanner | `[ARCHIVED]` Scan APKs for Firebase misconfigs | `skills/trailofbits-security/firebase-apk-scanner/` |
| SC-016 | yara-authoring | `[ARCHIVED]` Write YARA detection rules | `skills/trailofbits-security/yara-authoring/` |
| SC-017 | dwarf-expert | `[ARCHIVED]` DWARF debug info analysis | `skills/trailofbits-security/dwarf-expert/` |
| SC-018 | burpsuite-project-parser | `[ARCHIVED]` Parse Burp Suite project files | `skills/trailofbits-security/burpsuite-project-parser/` |
| SC-020 | ask-questions-if-underspecified | `[ARCHIVED]` Structured clarification questions | `skills/trailofbits-security/ask-questions-if-underspecified/` |
| SC-021 | devcontainer-setup | `[ARCHIVED]` Dev container configuration | `skills/trailofbits-security/devcontainer-setup/` |
| SC-024 | second-opinion | `[ARCHIVED]` Get alternative analysis | `skills/trailofbits-security/second-opinion/` |
| SC-025 | workflow-skill-design | `[ARCHIVED]` Design workflow skills | `skills/trailofbits-security/workflow-skill-design/` |
| SC-027 | culture-index | `[ARCHIVED]` Cultural analysis | `skills/trailofbits-security/culture-index/` |
| SC-028 | debug-buttercup | `[ARCHIVED]` Debug Buttercup patterns | `skills/trailofbits-security/debug-buttercup/` |

## Fullstack Dev — Active (Your Stack)

| ID | Name | Purpose | Path |
|----|------|---------|------|
| FS-001 | python-pro | Python 3.11+ (type hints, async, pathlib, pytest) | `skills/fullstack-dev/python-pro/` |
| FS-002 | typescript-pro | Strict TypeScript, generics, type safety | `skills/fullstack-dev/typescript-pro/` |
| FS-003 | javascript-pro | Modern JavaScript patterns | `skills/fullstack-dev/javascript-pro/` |
| FS-012 | sql-pro | SQL optimization, strategic indexes | `skills/fullstack-dev/sql-pro/` |
| FS-020 | nextjs-developer | Next.js App Router, RSC, SSR | `skills/fullstack-dev/nextjs-developer/` |
| FS-021 | react-expert | React component patterns, hooks, state | `skills/fullstack-dev/react-expert/` |
| FS-026 | react-native-expert | React Native framework patterns | `skills/fullstack-dev/react-native-expert/` |
| FS-028 | api-designer | REST, OpenAPI 3.1, RFC 7807 errors | `skills/fullstack-dev/api-designer/` |
| FS-031 | devops-engineer | CI/CD, infrastructure automation | `skills/fullstack-dev/devops-engineer/` |
| FS-032 | security-reviewer | Security code review | `skills/fullstack-dev/security-reviewer/` |
| FS-033 | test-master | Testing strategies and patterns | `skills/fullstack-dev/test-master/` |
| FS-034 | code-reviewer | Code quality review | `skills/fullstack-dev/code-reviewer/` |
| FS-035 | debugging-wizard | Systematic debugging | `skills/fullstack-dev/debugging-wizard/` |
| FS-043 | cli-developer | CLI tool development | `skills/fullstack-dev/cli-developer/` |
| FS-044 | architecture-designer | Software architecture patterns | `skills/fullstack-dev/architecture-designer/` |
| FS-050 | websocket-engineer | WebSocket patterns, real-time | `skills/fullstack-dev/websocket-engineer/` |
| FS-052 | postgres-pro | PostgreSQL optimization and admin | `skills/fullstack-dev/postgres-pro/` |
| FS-054 | feature-forge | Feature development patterns | `skills/fullstack-dev/feature-forge/` |
| FS-055 | fullstack-guardian | Full-stack quality enforcement | `skills/fullstack-dev/fullstack-guardian/` |
| FS-057 | rag-architect | RAG pipeline design | `skills/fullstack-dev/rag-architect/` |
| FS-058 | prompt-engineer | Prompt engineering patterns | `skills/fullstack-dev/prompt-engineer/` |

## Fullstack Dev — Archived (auto-detected by skill-watcher)

| ID | Name | Purpose | Path |
|----|------|---------|------|
| FS-004 | golang-pro | `[ARCHIVED]` Go patterns | `skills/fullstack-dev/golang-pro/` |
| FS-005 | rust-engineer | `[ARCHIVED]` Rust ownership, lifetimes | `skills/fullstack-dev/rust-engineer/` |
| FS-006 | swift-expert | `[ARCHIVED]` Swift language patterns | `skills/fullstack-dev/swift-expert/` |
| FS-007 | cpp-pro | `[ARCHIVED]` Modern C++ | `skills/fullstack-dev/cpp-pro/` |
| FS-008 | csharp-developer | `[ARCHIVED]` C# / .NET | `skills/fullstack-dev/csharp-developer/` |
| FS-009 | java-architect | `[ARCHIVED]` Java architecture | `skills/fullstack-dev/java-architect/` |
| FS-010 | kotlin-specialist | `[ARCHIVED]` Kotlin idioms | `skills/fullstack-dev/kotlin-specialist/` |
| FS-011 | php-pro | `[ARCHIVED]` PHP patterns | `skills/fullstack-dev/php-pro/` |
| FS-013 | fastapi-expert | `[ARCHIVED]` FastAPI, Pydantic V2 | `skills/fullstack-dev/fastapi-expert/` |
| FS-014 | django-expert | `[ARCHIVED]` Django ORM, migrations | `skills/fullstack-dev/django-expert/` |
| FS-015 | rails-expert | `[ARCHIVED]` Ruby on Rails | `skills/fullstack-dev/rails-expert/` |
| FS-016 | nestjs-expert | `[ARCHIVED]` NestJS patterns | `skills/fullstack-dev/nestjs-expert/` |
| FS-017 | spring-boot-engineer | `[ARCHIVED]` Spring Boot | `skills/fullstack-dev/spring-boot-engineer/` |
| FS-018 | laravel-specialist | `[ARCHIVED]` Laravel PHP | `skills/fullstack-dev/laravel-specialist/` |
| FS-019 | dotnet-core-expert | `[ARCHIVED]` .NET Core | `skills/fullstack-dev/dotnet-core-expert/` |
| FS-022 | vue-expert | `[ARCHIVED]` Vue 3, Pinia | `skills/fullstack-dev/vue-expert/` |
| FS-023 | angular-architect | `[ARCHIVED]` Angular 17+ | `skills/fullstack-dev/angular-architect/` |
| FS-025 | flutter-expert | `[ARCHIVED]` Flutter/Dart | `skills/fullstack-dev/flutter-expert/` |
| FS-027 | database-optimizer | `[ARCHIVED]` EXPLAIN ANALYZE, query tuning | `skills/fullstack-dev/database-optimizer/` |
| FS-029 | cloud-architect | `[ARCHIVED]` Multi-cloud, cost optimization | `skills/fullstack-dev/cloud-architect/` |
| FS-030 | kubernetes-specialist | `[ARCHIVED]` K8s resource mgmt | `skills/fullstack-dev/kubernetes-specialist/` |
| FS-037 | code-documenter | `[ARCHIVED]` Documentation generation | `skills/fullstack-dev/code-documenter/` |
| FS-039 | graphql-architect | `[ARCHIVED]` GraphQL schema design | `skills/fullstack-dev/graphql-architect/` |
| FS-040 | ml-pipeline | `[ARCHIVED]` ML pipelines, model serving | `skills/fullstack-dev/ml-pipeline/` |
| FS-041 | data-engineer | `[ARCHIVED]` Data pipelines, ETL | `skills/fullstack-dev/spark-engineer/` |
| FS-042 | game-developer | `[ARCHIVED]` Game development | `skills/fullstack-dev/game-developer/` |
| FS-045 | embedded-systems | `[ARCHIVED]` Embedded/IoT | `skills/fullstack-dev/embedded-systems/` |
| FS-047 | chaos-engineer | `[ARCHIVED]` Chaos engineering | `skills/fullstack-dev/chaos-engineer/` |
| FS-048 | microservices-architect | `[ARCHIVED]` Microservice patterns | `skills/fullstack-dev/microservices-architect/` |
| FS-049 | sre-engineer | `[ARCHIVED]` SRE practices, SLOs | `skills/fullstack-dev/sre-engineer/` |
| FS-051 | monitoring-expert | `[ARCHIVED]` Observability, alerting | `skills/fullstack-dev/monitoring-expert/` |
| FS-053 | terraform-engineer | `[ARCHIVED]` Terraform IaC | `skills/fullstack-dev/terraform-engineer/` |
| FS-056 | fine-tuning-expert | `[ARCHIVED]` LLM fine-tuning | `skills/fullstack-dev/fine-tuning-expert/` |
| FS-059 | mcp-developer | `[DEPRECATED → SK-011]` | `skills/fullstack-dev/mcp-developer/` |
| FS-060 | pandas-pro | `[ARCHIVED]` Pandas data analysis | `skills/fullstack-dev/pandas-pro/` |
| FS-061 | shopify-expert | `[ARCHIVED]` Shopify/Liquid | `skills/fullstack-dev/shopify-expert/` |
| FS-062 | wordpress-pro | `[ARCHIVED]` WordPress | `skills/fullstack-dev/wordpress-pro/` |
| FS-063 | salesforce-developer | `[ARCHIVED]` Salesforce/Apex | `skills/fullstack-dev/salesforce-developer/` |
| FS-064 | legacy-modernizer | `[ARCHIVED]` Legacy code modernization | `skills/fullstack-dev/legacy-modernizer/` |
| FS-065 | vue-expert-js | `[ARCHIVED]` Vue.js (JavaScript) | `skills/fullstack-dev/vue-expert-js/` |
| FS-066 | secure-code-guardian | `[ARCHIVED]` Secure coding enforcement | `skills/fullstack-dev/secure-code-guardian/` |

## Context Engineering Kit

| ID | Name | Purpose | Path |
|----|------|---------|------|
| CE-001 | sdd | Spec-Driven Development | `skills/context-engineering-kit/sdd/` |
| CE-002 | tdd | Test-Driven Development patterns | `skills/context-engineering-kit/tdd/` |
| CE-003 | reflexion | Auto-refinement loops (complexity, nesting) | `skills/context-engineering-kit/reflexion/` |
| CE-004 | kaizen | Continuous improvement, YAGNI | `skills/context-engineering-kit/kaizen/` |
| CE-005 | code-review | Unified code review (local + PR) | `skills/context-engineering-kit/code-review/` |
| CE-006 | git | Advanced git operations | `skills/context-engineering-kit/git/` |
| CE-007 | ddd | Domain-Driven Design | `skills/context-engineering-kit/ddd/` |
| CE-008 | docs | Documentation management | `skills/context-engineering-kit/docs/` |
| CE-009 | fpf | First Principles Framework (subagent) | `skills/context-engineering-kit/fpf/` |
| CE-010 | sadd | Subagent-Driven Development | `skills/context-engineering-kit/sadd/` |
| CE-011 | customaize-agent | Agent customization | `skills/context-engineering-kit/customaize-agent/` |
| CE-012 | mcp | MCP integration patterns | `skills/context-engineering-kit/mcp/` |
| CE-013 | tech-stack | Language/framework best practices | `skills/context-engineering-kit/tech-stack/` |

## Session & CLI Tools

| ID | Name | Purpose | Path |
|----|------|---------|------|
| CT-001 | aichat | Session search/recovery | `skills/cctools/aichat/` |
| CT-003 | voice | Audio feedback on events | `skills/cctools/voice/` |
| CT-004 | infra-showcase | Backend/frontend dev guidelines, route testing | `skills/infra-showcase/` |

## MCP Servers

| ID | Name | Purpose | Access |
|----|------|---------|--------|
| MCP-001 | MCP_DOCKER | GitHub, Context7, Obsidian, Memory Graph, Neon, Playwright, browser — bundled | Docker container (lazy-loaded via TOOL_SEARCH) |
| MCP-002 | shadcn | Browse/install shadcn/ui components | `~/.claude/.mcp.json` → `npx shadcn@latest mcp` |
| MCP-003 | Figma | Design context, screenshots, code connect | Plugin: `figma@claude-plugins-official` |
| MCP-004 | Firebase | Project mgmt, security rules, developer docs | Plugin: `firebase@claude-plugins-official` |
| MCP-005 | Claude Preview | Launch dev server, screenshot, inspect, interact | Built-in (lazy-loaded via TOOL_SEARCH) |
| MCP-006 | Claude in Chrome | Full browser automation, read page, form input | Built-in (lazy-loaded via TOOL_SEARCH) |
| MCP-007 | PDF Tools | Analyze, extract, fill, compare PDFs | Built-in (lazy-loaded via TOOL_SEARCH) |
| MCP-008 | Scheduled Tasks | Create/manage scheduled tasks | Built-in (lazy-loaded via TOOL_SEARCH) |

## Plugins (Enabled)

| ID | Name | Purpose | Plugin ID |
|----|------|---------|-----------|
| PLG-001 | agent-sdk-dev | Create Claude Agent SDK apps | `agent-sdk-dev@claude-plugins-official` |
| PLG-002 | claude-code-setup | Automation recommender | `claude-code-setup@claude-plugins-official` |
| PLG-003 | claude-md-management | Audit/improve CLAUDE.md files | `claude-md-management@claude-plugins-official` |
| PLG-004 | code-review | PR code review | `code-review@claude-plugins-official` |
| PLG-005 | commit-commands | Commit, push, PR creation | `commit-commands@claude-plugins-official` |
| PLG-006 | feature-dev | Guided feature development | `feature-dev@claude-plugins-official` |
| PLG-007 | figma | Design-to-code, code connect | `figma@claude-plugins-official` |
| PLG-008 | firebase | Firebase project management | `firebase@claude-plugins-official` |
| PLG-009 | github | GitHub operations | `github@claude-plugins-official` |

## Plugins (Disabled — re-enable when needed)

| ID | Name | Purpose | Why Disabled | Re-enable When |
|----|------|---------|-------------|----------------|
| PLG-D01 | asana | Asana project management | No active Asana projects | Working on Asana-tracked projects |
| PLG-D02 | code-simplifier | Code simplification review | Redundant with Reflexion (CE-003) | Need automated simplification |
| PLG-D03 | coderabbit | AI code review | Redundant with code-review (CE-005) | Team wants external AI review |
| PLG-D04 | kotlin-lsp | Kotlin language server | No active Kotlin projects | Working on Kotlin/Android |
| PLG-D05 | ralph-loop | Continuous improvement loop | Overlaps with Kaizen (CE-004) | Need structured improvement cycles |

## Flow — Unified Workflow System

### Flow Skill & References

| ID | Name | Purpose | Path |
|----|------|---------|------|
| FL-001 | flow | Core Flow skill definition (18 commands, 14 agents, 4 depths) | `skills/flow/SKILL.md` |
| FL-002 | state-management | config.yaml, state.yaml, STATE.md schemas | `skills/flow/references/state-management.md` |
| FL-003 | depth-analysis | Depth recommendation algorithm + feature matrix | `skills/flow/references/depth-analysis.md` |
| FL-004 | deviation-rules | Auto-fix rules, adaptive replanning signals | `skills/flow/references/deviation-rules.md` |
| FL-005 | checkpoints | Human-verify, decision, human-action types | `skills/flow/references/checkpoints.md` |
| FL-006 | config-template | Default config.yaml template | `skills/flow/templates/config.yaml` |
| FL-007 | background-workers | Background worker pool for flow:go | `skills/flow/references/background-workers.md` |
| FL-008 | truth-verification | Confidence scoring gate for flow:verify | `skills/flow/references/truth-verification.md` |

### Flow Commands

| ID | Name | Purpose | Path |
|----|------|---------|------|
| FL-C01 | flow:start | Entry point — depth analysis + .flow/ init | `commands/flow/start.md` |
| FL-C02 | flow:plan | Plans-as-prompts with verification loop | `commands/flow/plan.md` |
| FL-C03 | flow:go | Wave-based parallel execution + swarm mode | `commands/flow/go.md` |
| FL-C04 | flow:quick | Fast path for small tasks | `commands/flow/quick.md` |
| FL-C05 | flow:ship | Commit + push + PR | `commands/flow/ship.md` |
| FL-C06 | flow:auto | Alias: plan → go → review → ship | `commands/flow/auto.md` |
| FL-C07 | flow:swarm | Alias: plan → go --swarm → review → ship | `commands/flow/swarm.md` |
| FL-C08 | flow:brainstorm | Explore WHAT to build | `commands/flow/brainstorm.md` |
| FL-C09 | flow:discover | Unified research + discovery | `commands/flow/discover.md` |
| FL-C10 | flow:map | Parallel codebase mapping (4 agents) | `commands/flow/map.md` |
| FL-C11 | flow:ground | Surface/validate hidden assumptions | `commands/flow/ground.md` |
| FL-C12 | flow:verify | Goal-backward verification | `commands/flow/verify.md` |
| FL-C13 | flow:review | Multi-agent parallel review | `commands/flow/review.md` |
| FL-C14 | flow:test | E2E testing by project type | `commands/flow/test.md` |
| FL-C15 | flow:debug | Scientific debugging | `commands/flow/debug.md` |
| FL-C16 | flow:compound | Knowledge compounding | `commands/flow/compound.md` |
| FL-C17 | flow:complete | Archive phase/milestone + retrospective | `commands/flow/complete.md` |
| FL-C18 | flow:retro | Cross-phase/sprint retrospective | `commands/flow/retro.md` |
| FL-C19 | flow:status | Dashboard: position, velocity, todos, quality | `commands/flow/status.md` |
| FL-C20 | flow:smart-swarm | Auto-detect complexity + agent team execution | `commands/flow/smart-swarm.md` |

### Flow Agents

| ID | Name | Purpose | Path |
|----|------|---------|------|
| FL-A01 | flow-planner | Plans-as-prompts + roadmaps | `agents/flow-planner.md` |
| FL-A02 | flow-executor | Wave execution + adaptive replanning | `agents/flow-executor.md` |
| FL-A03 | flow-plan-checker | Plan completeness + gap analysis | `agents/flow-plan-checker.md` |
| FL-A04 | flow-verifier | Goal-backward + integration verification | `agents/flow-verifier.md` |
| FL-A05 | flow-debugger | Scientific debugging with checkpoints | `agents/flow-debugger.md` |
| FL-A06 | flow-mapper | 4-focus codebase mapping | `agents/flow-mapper.md` |
| FL-A07 | flow-risk-assessor | 7-dimension risk scoring | `agents/flow-risk-assessor.md` |
| FL-A08 | flow-repo-analyst | Local codebase research | `agents/flow-repo-analyst.md` |
| FL-A09 | flow-external-researcher | External docs + best practices research | `agents/flow-external-researcher.md` |
| FL-A10 | flow-learnings-researcher | Search past solutions | `agents/flow-learnings-researcher.md` |
| FL-A11 | flow-research-synthesizer | Combine parallel research | `agents/flow-research-synthesizer.md` |
| FL-A12 | flow-git-analyst | Git history analysis | `agents/flow-git-analyst.md` |
| FL-A13 | flow-compound-writer | Knowledge compounding doc assembly | `agents/flow-compound-writer.md` |
| FL-A14 | flow-uat | User acceptance testing | `agents/flow-uat.md` |
| FL-A15 | smart-swarm-coordinator | Coordinate multi-agent teams | `agents/smart-swarm-coordinator.md` |

## Master Commands

| ID | Name | Purpose | Path |
|----|------|---------|------|
| MC-001 | /new | Start new project/feature | `commands/new.md` |
| MC-012 | /new-web | Fast-path web project (Next.js + Tailwind + lessons) | `commands/new-web.md` |
| MC-002 | /resume | Continue existing work | `commands/resume.md` |
| MC-003 | /task | One-off task | `commands/task.md` |
| MC-004 | /done | End session (commit + reflect) | `commands/done.md` |
| MC-005 | /ship | Commit + push + PR | `commands/ship.md` |
| MC-006 | /reflect | Capture session knowledge | `commands/reflect.md` |
| MC-007 | /health | System diagnostics + updates | `commands/health.md` |
| MC-008 | /learn | Transform mistake into G-ERR | `commands/learn.md` |
| MC-009 | /analyze-mistakes | Weekly failure pattern analysis | `commands/analyze-mistakes.md` |
| MC-010 | /init-memory | Initialize Progressive Learning | `commands/init-memory.md` |
| MC-011 | /continue | Resume from auto-continuation handoff | `commands/continue.md` |

## System Infrastructure

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SYS-001 | SYSTEM_VERSION.md | Version + component inventory | `SYSTEM_VERSION.md` |
| SYS-002 | SYSTEM_CHANGELOG.md | Infrastructure change history | `SYSTEM_CHANGELOG.md` |
| SYS-003 | logs/ | Operational monitoring | `logs/` |
| SYS-004 | rules/ | Modular convention files | `rules/` |
| SYS-005 | archived-skills-manifest.json | Detection patterns for archived skills | `skills/archived-skills-manifest.json` |

## Hooks

| ID | Name | Purpose | Path |
|----|------|---------|------|
| HK-001 | session-start.sh | SessionStart — context, health, version, lessons | `hooks/session-start.sh` |
| HK-002 | session-stop.sh | Stop — reflection flag, handoff creation | `hooks/session-stop.sh` |
| HK-003 | security-gate.sh | PreToolUse:Write — block sensitive files/secrets | `hooks/security-gate.sh` |
| HK-004 | context-monitor.js | PostToolUse — context usage warnings | `hooks/context-monitor.js` |
| HK-005 | statusline.js | Status line — model, task, context % | `hooks/statusline.js` |
| HK-006 | mistake-capture.py | PostToolUse — failure logging | `hooks/mistake-capture.py` |
| HK-007 | verify-completion.py | Stop — task completion check | `hooks/verify-completion.py` |
| HK-008 | precompact-reflect.sh | PreCompact — reflection trigger | `scripts/progressive-learning/precompact-reflect.sh` |
| HK-009 | post-compact-dream-check.sh | PostCompact — auto-dream trigger | `hooks/post-compact-dream-check.sh` |
| HK-010 | agent-profiler.py | PostToolUse:Agent — EMA performance profiling | `hooks/agent-profiler.py` |
| HK-011 | skill-watcher.sh | SessionStart — detect archived skills in project | `hooks/skill-watcher.sh` |
| HK-012 | context-guard.js | PreToolUse:* — proactively blocks expensive tools at 72% context | `hooks/context-guard.js` |
| HK-013 | subagent-tracker.js | SubagentStart — logs agent spawns, enforces max 6 concurrent | `hooks/subagent-tracker.js` |
| HK-014 | subagent-verifier.js | SubagentStop — verifies agent deliverable quality | `hooks/subagent-verifier.js` |
| HK-015 | tool-failure-handler.js | PostToolUseFailure — circuit breaker + failure guidance | `hooks/tool-failure-handler.js` |
| HK-016 | keyword-detector.js | UserPromptSubmit — auto-routes natural language to workflows | `hooks/keyword-detector.js` |
| HK-017 | skill-injector.js | UserPromptSubmit — auto-detects tech keywords → skill suggestions + logs selection events | `hooks/skill-injector.js` |
| HK-018 | sync-skill-keywords.js | SessionStart — regenerates keyword cache from REGISTRY.md + SKILL.md frontmatter | `hooks/sync-skill-keywords.js` |
| HK-019 | subagent-limiter.js | PreToolUse:Agent — blocks Agent spawns when concurrent limit (6) reached | `hooks/subagent-limiter.js` |
| HK-020 | precompact-flow-validate.sh | PreCompact — validates .flow/ state before context compaction | `scripts/precompact-flow-validate.sh` |

## Scheduled Tasks

| ID | Name | Purpose | Path |
|----|------|---------|------|
| SCHED-001 | weekly-dream | Weekly memory consolidation (Monday ~9:17am) | `scheduled-tasks/weekly-dream/SKILL.md` |
| SCHED-002 | skill-usage-audit | Monthly archived skill audit + auto-unarchive | `scheduled-tasks/skill-usage-audit/SKILL.md` |

## Playbook Files

| ID | Name | Purpose | Path |
|----|------|---------|------|
| PB-001 | PLAYBOOK-WORKFLOWS | Task classification, Flow, decision flowchart | `skills/PLAYBOOK-WORKFLOWS.md` |
| PB-002 | PLAYBOOK-QUALITY | Security, DevOps, language expertise, TDD/Reflexion | `skills/PLAYBOOK-QUALITY.md` |
| PB-003 | PLAYBOOK-TOOLS | MCP patterns, slash commands, built-in skills | `skills/PLAYBOOK-TOOLS.md` |
