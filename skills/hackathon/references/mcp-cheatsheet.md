# MCP Cheatsheet for Hackathons

Quick-reference: which MCP to reach for at each phase. Prefer MCP over CLI when available.

---

## Phase 0 — `/hackathon:init`

| Need | MCP | Tool |
|---|---|---|
| Research prior winners | firecrawl | `firecrawl_scrape` on `https://devpost.com/software?tag={theme}&sort=winners` |
| Scrape event rules/requirements | firecrawl | `firecrawl_scrape` on event page |
| Map entire event site | firecrawl | `firecrawl_map` for URL discovery |

---

## Phase 1 — `/hackathon:ideate`

| Need | MCP | Tool |
|---|---|---|
| Look up past projects (theme) | firecrawl | `firecrawl_search` "devpost {theme} winners" |
| Check lib availability | context7 | `resolve-library-id` → `get-library-docs` |
| Framework doc lookup | context7 | for any unfamiliar SDK in the theme |

---

## Phase 3 — `/hackathon:scaffold`

| Need | MCP | Tool |
|---|---|---|
| Vercel deploy + env vars | vercel | `deploy_to_vercel`, `get_project`, `get_runtime_logs` |
| Supabase project + schema | supabase | `create_project`, `apply_migration`, `generate_typescript_types` |
| UI components (shadcn stack) | shadcn | `search_items_in_registries`, `get_add_command_for_items` |
| UI inspiration | 21st-dev | `21st_magic_component_inspiration`, `21st_magic_component_builder` |
| Fancy animated UI | aceternity | `search_components`, `get_installation_info` |
| React UI kit | heroui | `list_components`, `get_component_source_code` |
| Icons | iconify | `search_icons`, `get_icon` |
| Firebase (if needed) | plugin_firebase | `firebase_init`, `firebase_create_project` |
| Netlify (alt to Vercel) | netlify | `netlify-project-services-updater` |

---

## Phase 4 — `/hackathon:build`

| Need | MCP | Tool |
|---|---|---|
| Library docs mid-build | context7 | `resolve-library-id` → `get-library-docs` (MANDATORY for unfamiliar libs) |
| Impact analysis as project grows | code-review-graph | `get_impact_radius_tool`, `query_graph_tool` |
| Find similar patterns | code-review-graph | `semantic_search_nodes_tool` |
| Stripe integration | (no MCP — use Context7 for docs) | |
| Resend email | resend | `send-email`, `create-template` |

---

## Phase 5 — `/hackathon:polish`

| Need | MCP | Tool |
|---|---|---|
| Visual QA — screenshots | Claude Preview | `preview_start` → `preview_screenshot` |
| Test responsive | Claude Preview | `preview_resize` (375x667 mobile, 1440x900 desktop) |
| Test interactions | Claude Preview | `preview_click`, `preview_fill` |
| Console errors | Claude Preview | `preview_console_logs` |
| Network errors | Claude Preview | `preview_network` |
| Performance score | lighthouse | `get_performance_score`, `run_audit` |
| Error boundary setup | sentry | `create_project`, `create_dsn` |

---

## Phase 6 — `/hackathon:demo`

| Need | MCP | Tool |
|---|---|---|
| Hero screenshots | Claude Preview | `preview_screenshot` at multiple viewports |
| Dark/light mode | Claude Preview | `preview_eval` to toggle theme |
| Final network verification | Claude Preview | `preview_network` — no red requests |

---

## Phase 7 — `/hackathon:pitch`

| Need | MCP | Tool |
|---|---|---|
| Search docs of showcase tech | context7 | for "tech highlight" in pitch |

---

## Phase 8 — `/hackathon:retro`

| Need | MCP | Tool |
|---|---|---|
| Git log analysis | (use git CLI) | git log to extract timeline |
| Vercel deploy history | vercel | `list_deployments` |

---

## When no MCP exists — fallback order

1. **Context7** for library docs (covers most SDKs)
2. **WebSearch** for recent changes / current-state questions
3. **firecrawl_scrape** for any specific URL
4. **CLI** only as last resort
