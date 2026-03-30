# Playbook: Tools, MCP & Reference

> **Auto-loaded when**: Using MCP servers, looking up slash commands, checking built-in skills, reviewing proactive behaviors, updating the system.

---

## 1. MCP Server Usage — Detailed Patterns

### GitHub MCP
- `issue_read` / `list_issues` — read issues with comments, labels, sub-issues
- `pull_request_read` — PR details, diffs, review comments, status checks
- `search_code` — find code patterns across all GitHub repos
- `create_pull_request` / `push_files` — create PRs, push changes remotely
- **Prefer over** `gh` CLI for reads; use `gh` CLI for complex local git workflows

### Context7 MCP
- `resolve-library-id` → `get-library-docs` — ALWAYS check before giving framework advice
- Provides up-to-date docs that may differ from training data
- Use `topic` parameter to focus on specific areas (e.g., "hooks", "routing")
- Set `tokens` parameter higher (20000+) for comprehensive coverage

### Firebase MCP
- `firebase_init` — initialize services (Firestore, Auth, Hosting, Storage, etc.)
- `firebase_get_project` / `firebase_list_projects` — project management
- `firebase_get_security_rules` — audit security rules
- `developerknowledge_search_documents` — search Google developer docs

### Neon MCP (PostgreSQL)
- `run_sql` — execute queries against Neon databases
- `prepare_database_migration` — safe migration with temporary branch
- `complete_database_migration` — apply tested migration to main
- `prepare_query_tuning` → `complete_query_tuning` — optimize slow queries
- `describe_branch` / `describe_table_schema` — schema exploration

### Obsidian MCP
- `obsidian_simple_search` — find notes by text
- `obsidian_get_file_contents` / `obsidian_batch_get_file_contents` — read notes
- `obsidian_append_content` / `obsidian_patch_content` — update notes
- `obsidian_get_periodic_note` — access daily/weekly/monthly notes

### Memory Graph MCP
- `create_entities` + `create_relations` — persist project knowledge
- `search_nodes` — recall cross-session context
- `add_observations` — enrich existing entities with new facts
- **Use for:** architecture decisions, user preferences, recurring patterns

### Claude Preview MCP
- `preview_start` — launch dev server from `.claude/launch.json`
- `preview_screenshot` — visual verification of UI
- `preview_inspect` — verify CSS properties (more accurate than screenshots)
- `preview_snapshot` — accessibility tree for text/structure verification
- `preview_click` / `preview_fill` — interact with running app
- `preview_network` — inspect API calls and responses

### Claude in Chrome MCP
- `navigate` + `computer` — full browser automation
- `read_page` — accessibility tree of live pages
- `find` — natural language element search
- `form_input` — fill forms by element reference
- `javascript_tool` — execute JS in page context

---

## 1.5. Canonical Integrations — When Duplicates Exist

Some capabilities have multiple providers. Use the canonical one to avoid confusion.

| Capability | Canonical | Alternative | When to Use Alternative |
|------------|-----------|-------------|------------------------|
| **Figma** | Figma Dev MCP (`figma:figma-use`) | Canva MCP (`get_design_context`) | Only for Canva-native designs |
| **Firebase** | Firebase Plugin (`plugin_firebase_firebase`) | Firebase MCP (MCP_DOCKER) | Only if plugin is unavailable |
| **Context7** | Context7 MCP (standalone) | Context7 via MCP_DOCKER | Only if standalone is down |
| **Browser automation** | Claude in Chrome MCP (interactive) | Claude Preview MCP (headless testing) | Preview for CI/automated testing |
| **Code search** | Grep/Glob (local) | GitHub MCP `search_code` (remote) | Remote for cross-repo searches |

**Rules:**
- When both are available, always use the canonical provider first
- If the canonical provider fails, fall back to the alternative and note the fallback
- Never use both simultaneously for the same operation

---

## 2. Proactive Behaviors — Do These Without Being Asked

### At Session Start
1. Check `.planning/STATE.md` — if found, offer resume
2. Check project CLAUDE.md — read project-specific instructions
3. If user mentions a codebase, check for existing GSD structure

### During Any Task
1. Read matching specialist SKILL.md before domain-specific work
2. Use Context7 before recommending library/framework patterns
3. Run security skills when touching auth/crypto/validation code
4. Apply TDD for all production code changes
5. Use Memory Graph to store significant discoveries

### Before Claiming Completion
1. Run verification gate — tests pass, output clean
2. Security scan if code was security-sensitive
3. Validate IaC if generated (generator → validator)
4. Offer knowledge compounding if problem was non-trivial

### After Significant Work
1. Offer `/compound-engineering:workflows:compound` for non-trivial solutions
2. Update Memory Graph with key learnings
3. If in GSD project, update STATE.md progress

---

## 3. User Preferences & Environment

### Communication Style
- Be direct and concise; avoid unnecessary preamble
- Use tables and structured formats for comparison/options
- Ask efficiently with multiple-choice + defaults when clarification needed
- Don't hedge or over-qualify — state recommendations clearly

### Development Preferences
- TDD is the default methodology for all production code
- Security scanning is mandatory before completion
- Always validate generated infrastructure code
- Prefer modern tooling (uv over pip, ruff over black+flake8, pathlib over os.path)
- Use Context7 for library docs before making recommendations

### Git/Deployment
- Never push without explicit user confirmation
- Never force-push to main/master
- Use conventional commit format
- Create atomic commits (one logical change per commit)

### Environment
- Platform: Windows 11 (use Unix shell syntax in bash)
- Go 1.26.0 installed (for Claudio)
- Claudio hooks active for audio feedback
- Claude Squad requires tmux (WSL only)
- All skills namespaced under subdirectories

---

## 4. Workflow Lock & Skill Tags

### Workflow Lock (per-project)

When a project is first classified into a workflow system, write `workflow.lock` to the project's memory directory:

```markdown
# workflow.lock
system: gsd          # gsd | compound | fullstack | direct
locked_at: 2026-03-16
reason: Multi-phase project with .planning/ structure
```

**Effect**: Future sessions skip the scope-assessment step in Task Routing. The lock is advisory — user can override by saying "switch to compound" or deleting the file.

**Where to write**: `~/.claude/projects/<project-hash>/memory/workflow.lock`

### Skill Tags (future enhancement)

When activating specialist skills, match by domain tags rather than scanning the full REGISTRY:

| Tag Category | Examples | Matches |
|-------------|----------|---------|
| `language` | python, typescript, go, rust | FS-001, FS-002, FS-004, FS-005 |
| `framework` | react, nextjs, fastapi, django | FS-020, FS-021, FS-013, FS-014 |
| `domain` | security, devops, database, ml | SC-*, DV-*, FS-027, FS-040 |
| `content` | pdf, docx, spreadsheet, slides | SK-001 to SK-004 |

Currently implemented via REGISTRY lookup. Tags can be added to SKILL.md frontmatter later for automated matching.

---

## 5. Scalability — How to Update This System

### Adding a New Skill
1. Install skill in `~/.claude/skills/[category]/`
2. Add entry to `REGISTRY.md` with unique ID under appropriate section
3. Add auto-routing rule to CLAUDE.md file-type table (if file-triggered)
4. Add entry to relevant playbook file (use Registry ID, not just path)
5. If it has a slash command, it auto-appears in skill list

### Adding a New MCP Server
1. Configure in MCP settings
2. Add to CLAUDE.md MCP Server Usage table
3. Add detailed patterns to PLAYBOOK-TOOLS.md Section 1

### Updating Workflows
1. Edit the relevant playbook file
2. If it changes routing logic, update CLAUDE.md routing table
3. Test with a sample task to verify

---

## 6. Built-In Skills — File & Document Handling

| Trigger | Skill | What It Does |
|---------|-------|-------------|
| `.docx` files, "Word document" | `docx` | Create, read, edit Word docs with formatting, TOC, headers, images |
| `.pdf` files, "PDF" | `pdf` | Read, merge, split, rotate, watermark, OCR, fill forms, encrypt |
| `.pptx` files, "presentation", "slides" | `pptx` | Create, edit, combine slide decks with templates and speaker notes |
| `.xlsx`/`.csv` files, "spreadsheet" | `xlsx` | Open, edit, create spreadsheets; convert between tabular formats |
| "build a website", "landing page", UI work | `frontend-design` | Production-grade frontend with distinctive design |
| "test the web app", Playwright testing | `playwright` | Browser automation, screenshots, UI verification |
| "build an MCP server" | `mcp-builder` | Guide for creating MCP servers in Python (FastMCP) or Node/TS |
| "create a skill", "new skill" | `skill-creator` | Guide for creating Claude Code skills |
| "apply brand colors", Anthropic styling | `brand-guidelines` | Official Anthropic colors, typography, design standards |
| "style this", "apply theme" | `theme-factory` | 10 preset themes + custom theme generation for any artifact |
| "keyboard shortcuts", "rebind keys" | `keybindings-help` | Customize ~/.claude/keybindings.json |

---

## 7. Slash Commands — Complete Reference

### Commit & Git
```
/commit-commands:commit           → Create a git commit
/commit-commands:commit-push-pr   → Commit, push, and open PR in one flow
/commit-commands:clean_gone       → Clean up local branches deleted on remote
```

### Code Review
```
/code-review:code-review          → Review a pull request
/compound-engineering:workflows:review → Multi-agent exhaustive review (preferred)
```

### Feature Development
```
/feature-dev:feature-dev          → Guided feature dev with codebase understanding
/compound-engineering:workflows:work → Execute plans with TDD + quality gates
```

### Project Management (Fullstack Dev)
```
/fullstack-dev:common-ground      → Surface hidden assumptions about project
/fullstack-dev:project:discovery:create-epic-discovery → Research/discovery epics
/fullstack-dev:project:discovery:synthesize-discovery  → Consolidate findings
/fullstack-dev:project:planning:create-epic-plan       → Epic planning from Jira
/fullstack-dev:project:planning:create-implementation-plan → Implementation plan
/fullstack-dev:project:execution:execute-ticket        → Execute Jira ticket
/fullstack-dev:project:execution:complete-ticket       → Complete ticket workflow
/fullstack-dev:project:retrospectives:complete-epic    → Epic retrospective
/fullstack-dev:project:retrospectives:complete-sprint  → Sprint retrospective
```

### Infrastructure Showcase
```
/infra-showcase:dev-docs          → Create strategic plan with task breakdown
/infra-showcase:dev-docs-update   → Update dev documentation
/infra-showcase:route-research-for-testing → Map routes + launch tests
```

### Session Management
```
/cctools:aichat:recover-context   → Explore parent session history
/cctools:voice:speak              → Enable/disable/configure voice feedback
```

### Claude Code Management
```
/claude-md-management:revise-claude-md    → Update CLAUDE.md with session learnings
/claude-md-management:claude-md-improver  → Audit and improve CLAUDE.md quality
/claude-code-setup:claude-automation-recommender → Recommend automations for a codebase
```

### Agent SDK
```
/agent-sdk-dev:new-sdk-app        → Create new Claude Agent SDK application
```

### GSD (Extended — less common commands)
```
/gsd:add-phase          → Add phase to end of roadmap
/gsd:insert-phase       → Insert urgent work between phases
/gsd:remove-phase       → Remove future phase, renumber
/gsd:add-tests          → Generate tests for completed phase
/gsd:add-todo           → Capture idea as todo
/gsd:check-todos        → List pending todos
/gsd:audit-milestone    → Audit milestone before archiving
/gsd:plan-milestone-gaps → Create phases to close audit gaps
/gsd:cleanup            → Archive completed phase directories
/gsd:new-milestone      → Start new milestone cycle
/gsd:discuss-phase      → Gather phase context before planning
/gsd:list-phase-assumptions → Surface assumptions before planning
/gsd:set-profile        → Switch model profile (quality/balanced/budget)
/gsd:settings           → Configure GSD toggles
/gsd:health             → Diagnose .planning/ issues
/gsd:update             → Update GSD to latest version
/gsd:reapply-patches    → Reapply local mods after update
/gsd:join-discord       → Join GSD community
```
