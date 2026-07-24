# ATLAS System Version

> Auto-updated by `/health`. Do not edit manually. (Last manual edit 2026-06-24 — system audit count reconciliation: knowledge 109→143 + breakdown, personal/ 32→38, "skills counted three ways" prose 48/65/367→52/69/371 (these prose/breakdown blocks are not touched by `/health`'s auto-reconcile, so they had drifted). Prior 2026-06-18 v8.11.0 App Craft. `/health` may reconcile table counts on next run.)

**version: 10.3.1**
**last_updated: 2026-07-24**

## Component Counts

| Component | Count | Last Updated |
|-----------|-------|-------------|
| Hooks (active .js) | 28 | 2026-07-04 (validator-counted; excludes `lib*.js`. v8.17: +`web-project-context.js` — ambient web-dev standing orders at SessionStart. v8.6: +`system-detect.js` — Capability System proposer at SessionStart) |
| Hooks (.sh + .py) | 4 files / 3 hooks | 2026-06-15 (`session-start.sh`, `session-stop.sh`, `session-transcript-log.py` are hooks; `wiki-search-cli.sh` is a CLI bridge, not a hook — `ls *.sh *.py` returns 4) |
| Hooks (retired in v8.0.0) | 9 | 2026-05-14 (files removed; restore from `_archived/brain-consolidation-2026-05-15/brain-consolidation-pre-phase1-20260514-124017.tar.gz` if needed) |
| Commands (top-level active) | 36 | 2026-07-20 (v10: flow/ + hackathon/ subdirs archived as bundles into `skills/_archived/{flow,hackathon}/commands/`; 6 memory-ghost commands + parallel-audit retired to `skills/_archived/retired-commands/` — commands/ is flat now, so top-level = total) |
| Commands (with subdirs, excl. `_deprecated`) | 36 | 2026-07-20 (snapshot `fs_commands`; equals top-level since v10 — no subdirs remain) |
| Commands (deprecated, retained) | 0 | 2026-05-18 (the `_deprecated/` folder is empty as of this audit) |
| Skills (in ACTIVE-DIRECTORY) | 53 | 2026-07-20 (canonical — repo-integration round 3: +SK-146 css-keyframe-animations +SK-147 svg-backgrounds +SK-148 motion-principles +SK-149 gsap-plugins +SK-150 design-dna +SK-151 threejs-imperative (see INSTALLED.md § round 3); v9.1: +SK-144 claude-real-video (video→scene-keyframes+transcript, local `crv`) +SK-145 clone-website (live-site reverse-engineer via browser MCP + parallel builders); scroll-world scrub-engine woven into web-dev (not a skill). v8.20: +SK-143 hyperframes, HTML→video router; its dir + core-domain/workflow dirs are upstream-CLI-managed and deliberately unrowed — INSTALLED.md §v8.20.0; v8.14: +SK-142 self-evolve promoted, canvas-design archived (redundant w/ ecosystem symlink) — see `skills/ACTIVE-DIRECTORY.md`; v8.13: +SK-137 upgrading-react-native +SK-138 react-native-brownfield-migration +SK-139 github-actions (Callstack trio adopted from v8.12 hold) +SK-140 skill-vet (authored vet procedure); v8.12: +SK-135 app-store-review +SK-136 fastlane (skills.sh app-dev sweep); v8.11: +SK-134 tactile mobile entry-point; v8.7: +SK-133 ui-ux-catalog, +SK-044 gsap-advanced; v8.8: +SK-048 lenis; v8.9: +SK-047 motion-animation restored) |
| Skills (top-level `SKILL.md` files) | 86 | 2026-07-20 (`ls skills/*/SKILL.md` — 53 real dirs + 33 ecosystem symlinks; v8.20: +8 hyperframes bundle (router + hyperframes-core/-animation/-keyframes/-creative/-cli/-registry + media-use — upstream-CLI-managed, unrowed; lazily-installed workflow dirs will grow this number, expected). Prior 72 = 39 real + 33 symlinks (v8.14 re-measure); excl. `_archived/`+`_external/`. NOT a subset of the 52. v8.13: +upgrading-react-native +react-native-brownfield-migration +github-actions +skill-vet real dirs; v8.12: +app-store-review +fastlane real dirs; v8.11: +tactile real dir, −dev-client/−api-routes duplicate symlinks) |
| Skills (filesystem total incl. packs + symlinks) | 388 | 2026-06-19 (per `system-ground-truth.json` → `skills.from_validator.filesystem_unlimited.total`; +4 vs 367 = Callstack trio (upgrading-react-native, react-native-brownfield-migration, github-actions) + authored skill-vet direct SKILL.md (v8.13); reconciles on next `/health`) |
| Agents (registered, `agents/AGENTS.md`) | 21 | 2026-07-20 (v10 U4-2 — surface got a registry + `validate-agents.js` (12th validator). 15 flow-* + smart-swarm-coordinator archived into the flow bundle; context-engineering-kit + infra-showcase packs and 10 wrong-stack compound-engineering members parked in `skills/_archived/agents-parked/`; keepers = cctools 2 + compound-engineering 19, all rowed with evidence) |
| Rules | 5 (RULES-GIT, RULES-SECURITY, RULES-TESTING, RULES-LOCAL-LLM, RULES-SESSION-SCOPE) | 2026-05-18 (was 3; `RULES-LOCAL-LLM` + `RULES-SESSION-SCOPE` added per CLAUDE.md "On-Demand Rules") |
| Knowledge entries (vault `engineering/`) | 221 | 2026-07-20 (49 errors + patterns/solutions/preferences/failures; per `system-ground-truth.json` → `knowledge.counts`, snapshot regenerated 2026-07-20; v9.1: +KNOWLEDGE-190 faster-whisper CUDA device gotcha +KNOWLEDGE-191 ATLAS version-scheme drift; v8.20.1: +KNOWLEDGE-177 registry-green≠adopted propagation-sweep pattern; v8.20: +KNOWLEDGE-173 loop-engineering, +174 tiered-memory ideas, +175 live-managed-skill-dirs pattern, +176 read-before-edit error; prior row had lagged at 166 while entries reached 172) |
| Vault personal/ files | 57 | 2026-07-13 (`find personal/ -name "*.md"` = 57; +inferred preferences 5, +scorecard 2, +_dream 1, +atlas-v9-upgrade-plan, +project-state entries from v9 wave work) |
| Vault session-log/handoffs | 20 | 2026-05-14 |
| Scheduled tasks (enabled recurring) | 8 | 2026-07-20 (monthly-evolution-report, weekly-maintenance, weekly-wiki-lint, weekly-validator-sweep, weekly-mcp-health @04:30 since v10 F-09, weekly-graph-sync, atlas-kg-sync, daily-morning-brief; v10 U5-4: skill-usage-audit DELETED from the scheduler via MCP — was disabled since 2026-06-02, absorbed into evolution-report step 3; its SKILL.md parked in `skills/_archived/retired-commands/`) |
| Scheduled tasks (disabled orphans) | 11 | 2026-05-18 (Living Memory + atlas one-time tasks, all `enabled:false`, on-disk SKILL.md dirs removed; plugin lacks a delete tool so registry retains them) |
| Scheduled tasks (filesystem dirs) | 8 | 2026-06-03 (matches enabled-recurring; +atlas-kg-sync — operational-graph hygiene+vault-sync companion to weekly-graph-sync; the 11 disabled have no on-disk dirs) |
| Cleanup rules | 25 | 2026-07-04 (v8.14 audit: +ide-lock-prune, +stale-task-lists, +global-trash-prune, +trashed-transcripts-prune, +dated-handoffs-prune; plans-rotation repointed to plans/archive/ cap-40. Prior v8.6: +active-system-prune, +system-detect-prune, +knowledge-view-prune) |
| Validators (system-doctor) | 12 | 2026-07-20 (source of truth: `scripts/lib/validators.js` manifest, iterated by both system-doctor + system-snapshot; v10: +`agents` — fs⇄AGENTS.md parity for the agents/ surface; v8.6: +`systems`) |
| Capability Systems | 4 | 2026-07-02 (v8.6: full-stack SYS-WEB · app-dev SYS-APP · atlas-meta SYS-META; +SYS-DSGN design-ui added later — row had drifted, fixed v8.14 audit; `systems/registry.json` derived; still deferred: security, data, devops) |

### Skills counted three ways

The single "53" count above can be confusing because skill directories proliferate. Three counts that may appear elsewhere:

- **53 — Active in `ACTIVE-DIRECTORY.md`**: the curated, navigable skill index. **Source of truth** for "which skills are wired up and discoverable." (per `skill-counts` validator)
- **86 — Top-level `SKILL.md` files** (`ls skills/*/SKILL.md`, excl. `_archived/`+`_external/`): **53 real directories + 33 symlinks** into `~/.agents/skills/` (the Anthropic + community ecosystem). 8 of the real dirs are the upstream-CLI-managed hyperframes bundle (v8.20) and grow as workflows lazy-install. This is *not* the same set as the active 53 — symlinked ecosystem skills and command-skills inflate it, while pack skills (which live at deeper paths) are excluded.
- **371 — Filesystem total** (via `cache/system-ground-truth.json` → `skills.from_validator.filesystem_unlimited`): every `SKILL.md` anywhere under `skills/`. Breaks down to **116 direct + 194 bundle + 61 archive = 371**, where *bundle* = plugin-shipped packs (`cctools/`, `compound-engineering/`, `context-engineering-kit/`, `fullstack-dev/`, `trailofbits-security/`, `infra-showcase/`, `upgrade-pack/`) and *archive* = the 61 `SKILL.md` files under `_archived/` (spread across 46 directories — pack-containing archives hold several; +canvas-design v8.14). *Direct* = everything else: active top-level skills, the 33 ecosystem symlinks, and `_external/`. **Note (2026-06-08):** trailofbits/context-kit/compound upstream repos restructured into Claude-Code marketplace monorepos; on update they were stripped of dev cruft (`docs/`, `src/`, `tests/` incl. fixture SKILL.md, `bun.lock`) — only `plugins/` + `.claude-plugin/` + top-level docs retained.

When in doubt: `ACTIVE-DIRECTORY.md` is canonical.

## Knowledge Breakdown

> Migrated to monolithic vault files in v8.0.0: each `wiki/engineering/<type>.md` holds all entries of that type. ID format remains `KNOWLEDGE-NNN` with `**Type:**` field. **Counts as of 2026-07-10 (per `system-ground-truth.json` → `knowledge.counts`).**

| Category | Count | Vault file |
|----------|-------|-----------|
| Patterns (type: pattern) | 85 | `wiki/engineering/patterns.md` |
| Solutions (type: solution) | 38 | `wiki/engineering/solutions.md` |
| Errors (type: error) | 75 | `wiki/engineering/errors.md` |
| Preferences (type: preference) | 12 | `wiki/engineering/preferences.md` |
| Failures (type: failure) | 11 | `wiki/engineering/failures.md` |

## Installed Versions

| Tool | Version |
|------|---------|
| Claude Code CLI | 2.1.207 (source of truth: `.claude-code-version` — this row may lag) |
| better-ccflare | 3.5.23 (updated 2026-06-15) |
| tdd-guard | 1.6.8 |
| claude-rules-doctor | 0.2.2 (current) |
| claudio | 1.13.1 (current — claudio.click via `go install`; the npm pkg `claudio` is unrelated) |
| claude-squad | 1.0.17 (1.0.18 available — manual Windows-binary swap) |

## Skill Pack Status

| Pack | Last Checked | Latest Activity |
|------|-------------|----------------|
| trailofbits-security | 2026-06-15 | updated → c070b9b (2026-06-10); 74 skills (content refresh, no count change) |
| fullstack-dev | 2026-06-08 | 2026-05-01 (no update) |
| context-engineering-kit | 2026-06-15 | updated → e455f9d (2026-06-14); 63→65 skills (+2) |
| compound-engineering | 2026-06-15 | updated → 2648200 (2026-06-15); 39 real skills (5 tests/ fixtures stripped) |
| cctools | 2026-06-15 | updated → 14705d9 (2026-06-14); migrated to plugins/ structure; stripped ~88M dev cruft |

## Metadata

| Key | Value |
|-----|-------|
| version | 8.18.0 |
| last_health_check | 2026-07-24 (v8.14 deep audit — 11/11 green throughout; hook-emission repair (lib.js shapes), 107MB trash-path bug, symlinks validator was validating an empty set (now 33/33), git-checkout -b substring bypass closed, 40+ dead refs swept, SK-142 self-evolve promoted + canvas-design archived, cleanup 19→25 rules, Karpathy weave; see SYSTEM_CHANGELOG 8.14.0. Same-day v8.14.1 triple-check: every fix re-verified effective at runtime, 4 misses repaired — transcript-distill :66 second `$`-m instance, flow-uat `/flow:execute`, self-evolve REGISTRY.md, path-validator stale comment; settings.json inline graph-nudge envelope + async transcript hook queued for the user, classifier-gated — see §8.14.1) |
| hook_event_types | 9 (Notification, PostToolUse, PostToolUseFailure, PreToolUse, PreCompact, SessionStart, SessionEnd, Stop, UserPromptSubmit) |
| brain | Obsidian vault at `<your-vault-path>/wiki/` (local-only git; never push) |
| disk_total | 305MB |
| disk_skills | 24MB |
| disk_projects | 201MB |

## v8.3 Highlights (2026-05-28)

Audit-remediation pass via `plans/do-an-audit-for-jazzy-wren.md` — a full system audit (3 parallel read-only Explore audits + live verification) surfaced issues the 8 validators are structurally blind to: prose docs, dead-but-guarded code, runtime telemetry, and tool-surface bloat. All 8 validators stayed green throughout.

- **Doc reconciliation** — `ARCHITECTURE.md` re-stamped from v8.0.0; dropped the now-false "`drift-proposer.js` carries dead `lib-memory` code" claim (removed in v8.2); `/observe` 7→6 sections; knowledge 83→87; cleanup 13→16. `INSTALLED.md` "Retired" block rewritten (it claimed `lib-memory.js` retained, `hooks/_disabled/` exists, `scheduled-tasks/memory-*/` present — all false) + a "live counts → SYSTEM_VERSION" disclaimer. `REFERENCE.md` `/system-doctor` 7→8 validators. `README.md` badges v7.0.1/66→8.3.0/44 + illustrative-counts disclaimer; retired `topics/` removed from the tree.
- **Dead-code removal** — deleted the wired-but-dead Living Memory block in `scripts/progressive-learning/precompact-reflect.sh` (referenced the deleted `memory-lifecycle.js`); removed ~110 lines of permanently-disabled SQL-mirror code + the phantom `migrate-atlas-kg.js` pointer from `hooks/atlas-kg.js`; archived the orphan `scripts/health-dashboard.js`; fixed stale `topics/` references.
- **Behavioral bug fixes (verified live)** — (1) **`/done` dream throttle restored**: the `retired-task-cache-prune` cleanup rule (`age_days:0`) deleted `cache/dream-last-run` every session, defeating the 7-day throttle — rule removed. (2) **Chronic-issue suppressor now decays**: `session-start.sh §5` streaks only ever incremented (Bash=92), hiding a real Claude Preview MCP degradation forever under benign Bash noise — added decay + periodic re-surface + benign-tool exclusion; reset `health-suppress.json`. (3) **`drift-proposer.detectSkillUnused` hardened** (active-list + namespace-insensitive gates) and `skill_unused` channel silenced — the usage log only captures explicit Skill-tool calls, so it false-flagged auto-triggered skills (was about to propose archiving the already-archived `stop-slop`).
- **Operational hygiene** — added the three biggest uncapped logs (`local-llm-reads.jsonl` 443KB→104KB, `action-graph-stats.jsonl`, `subagent-stats.jsonl`) to `session-start.sh §3` rotation; new `session-reminders-prune` cleanup rule (keep-last-10) for the unmanaged per-session flag files.
- **Version upgrades** — `better-ccflare` 3.4.27→3.5.20, `tdd-guard` 1.6.6→1.6.8 (verified installed); CLI doc corrected 2.1.144→2.1.153; `claude-rules-doctor`/`claudio` confirmed current; `claude-squad` 1.0.18 noted (manual binary swap).
- **MCP slim-down + new auto-provisioner** — demoted 5 idle UI-registry servers (shadcn/heroui/aceternity/magicuidesign/iconify) from global user scope. New `scripts/ensure-frontend-mcp.js` (SessionStart hook) + `templates/frontend-mcp.json` provision-once-merge them into any frontend project's `.mcp.json` (detected via package.json) — automatic for new AND current frontend projects, without global picker bloat. `weekly-validator-sweep` SKILL.md 7→8 validators; manual validator sweep logged.

Scheduler verified healthy (executor fired `weekly-maintenance` on-cron 2026-05-25; `weekly-validator-sweep` next fires 2026-05-31). `statsig` left in place (user-retained). Plugin disables and external `MCP_DOCKER`/Context7 dedup were surfaced for user decision, not auto-applied.

## v8.2 Highlights (2026-05-28)

Correctness pass via `plans/i-want-you-to-giggly-pnueli.md` — fixes a cluster of v8.0.0 leftovers (scripts/docs still pointing at retired subsystems) plus one power-up. All 8 validators stayed green throughout.

- **Self-healing scheduled-tasks cache (power-up)** — new `hooks/refresh-scheduled-cache.js` rewrites `cache/scheduled-tasks-latest.json` from the live on-disk scheduler state at session-start (§8·pre, before the drift-proposer). The cache's auto-writer was retired in v8.0.0, so it went stale and made on-time tasks look hundreds of hours late (the chronic `weekly-validator-sweep 88h late` / `monthly-evolution-report` false-alarm chains). A staleness guard (`scheduled_cache_max_age_hours: 36` in `drift-thresholds.json`) skips the channel entirely if the refresh ever fails.
- **drift-proposer hardening** — removed the dead `detectMemoryDrift` detector (a no-op `return null` above an unreachable `require('lib-memory.js')`) and dropped it from the detectors array (now 4 live channels = 4 thresholds). Added clear-on-no-drift: a clean run now wipes a resolved `current` proposal so `/apply-drift-fix` never offers a phantom action.
- **Knowledge validator brought back to life** — `scripts/validate-knowledge.js` pointed at the removed `~/.claude/topics/` dir and silently skipped (validated nothing). Repointed to the vault (`wiki/engineering/`); now LIVE and validating 87 entries. Its first live run caught a real duplicate `KNOWLEDGE-081` — the preferences entry was renumbered to `KNOWLEDGE-087`.
- **Dashboard display fix** — `/observe` section 4 no longer mislabels `enabled:false` tasks as `⚠ drift`; they render `· disabled`.
- **`/health` writeback de-corrupted** — `commands/health.md §14` is now snapshot-driven: it sources validator-backed counts from `cache/system-ground-truth.json` instead of raw `ls | wc` counts that returned 0 rules (wrong path) and 22 skills (vs canonical 45), which would have clobbered SYSTEM_VERSION on the next run.
- **Doc/config corrections** — `/observe` doc reconciled to the 6 real sections (Living Memory was the retired 7th) and dropped the `living_memory` `--section`; invalid `settings.json:defaultMode "allowedTools"` → `"default"`.
- **SYSTEM_VERSION reconciled** — resolved the 8.1.0 (header) vs 8.0.0 (metadata) contradiction → 8.2.0; `hook_event_types` 8 → 9 (SessionEnd was unlisted); `Vault personal/ files` 22 → 31 (recursive count).

## v8.1 Highlights (2026-05-18)

Additive cleanup pass via `plans/i-want-you-to-velvet-thompson.md`. No breaking changes, no skill renames, no command moves.

- **Scheduler registry hygiene** — `cache/scheduled-tasks-latest.json` refreshed against live MCP state; canonical `_note` updated. The 11 disabled tasks (6 Living Memory recurring + 5 one-time atlas tasks, all retired in v8.0.0) remain in the plugin registry as harmless orphans (the `mcp__scheduled-tasks__*` API has no `delete` tool); their on-disk SKILL.md dirs were cleaned up in prior sessions.
- **Drift ledger garbage-collected** — `cache/last-drift-proposal.json` had its `current` field cleared and 19 history entries marked `resolved_at`. The chronic `monthly-evolution-report 287h late` chain (12 entries) was a false alarm caused by stale cache; the actual task runs 2026-06-01 as expected. The `brand-guidelines` triple-fire (3 entries from 2026-04-25→27) was a missed cross-check against ARCHIVE-DIRECTORY (the skill was already in the Wave 1 bulk archive).
- **Plugin pruning** — 2 plugins disabled in `settings.json:enabledPlugins`: `asana` (zero usage signal across logs/handoffs) and `kotlin-lsp` (confirmed JavaFX, not Kotlin/Android). 13 plugins remain enabled.
- **SYSTEM_VERSION counts reconciled** — Hook count broken out by language (20 .js + 3 .sh/.py), agent counts split into "top-level custom" (16) vs "incl. plugin packs" (74), Rules updated from 3 → 5 (RULES-LOCAL-LLM + RULES-SESSION-SCOPE were already on disk but not previously listed here), knowledge entry counts refreshed (87 total: 38 + 18 + 15 + 10 + 6).
- **Cleanup rule annotation** — `hooks/cleanup-config.json:retired-task-cache-prune` confirmed no-op (target `cache/dream-last-run` is gone); retirement deferred to 2026-06-01 per the original 2-week observation window.

All 8 validators stayed green throughout every wave.

## v8.0 Highlights

- **Vault consolidation** — Living Memory + topics/ + handoffs/ retired; the Obsidian vault at `<your-vault-path>/wiki/` is now the single source of truth for personal facts, project state, procedures, and engineering knowledge. `~/.claude/` becomes pure operational code.
- **Transcript pipeline** — `hooks/session-transcript-log.py` (Stop hook position 3) writes Claude-optimized session transcripts to `wiki/session-log/transcripts/` via Ollama distillation. Fail-open, idempotent.
- **Session-start vault orientation** — `session-start.sh §7l` injects a VAULT ORIENTATION table from `wiki/personal/` (anchor doc + file map) on every session start.
- **Local-only git on the vault** — `<your-vault-path>/.git/hooks/pre-push` refuses any push with exit 1. Personal data never leaves the machine.
- **Memory-* hooks retired** — 9 hooks deleted (snapshot preserved in `_archived/brain-consolidation-2026-05-15/brain-consolidation-pre-phase1-20260514-124017.tar.gz`). `hooks/lib-memory.js` was also deleted; `atlas-kg.js:8` only mentions it in a comment, and `drift-proposer.js` had a `require('lib-memory.js')` call sitting below an early `return null` in a `/* eslint-disable */` block labeled "dead code paths below this point" — it never executed. **(That entire `detectMemoryDrift` dead-code block was removed in v8.2.0.)**

## v7.0 Highlights

- **Unified cleanup engine** — `hooks/cleanup-runner.js` drives 13 declarative rules from `hooks/cleanup-config.json`; replaces v6.x §7a–§7k bespoke blocks in `session-start.sh`.
- **Skill-usage instrumentation** — new PreToolUse `Skill` hook writes `logs/skill-usage.jsonl`; `skill-stats.json` is superseded.
- **Observability dashboard** — `/observe` renders 6 sections (tool health, safety hooks, skill usage, scheduled tasks, action graph, cleanup) from existing + new telemetry.
- **Scheduled tasks 6→4** — `weekly-cleanup-scan` absorbed into `weekly-maintenance`; `weekly-memory-maintenance` absorbed into `weekly-dream`; both kept disabled for a 1-week shadow period.
- **Auto-drift-proposer** — `hooks/drift-proposer.js` emits at most ONE session-start advisory when thresholds cross (skill unused, tool failures, task drift, cleanup errors). Thresholds live in `hooks/drift-thresholds.json`.
