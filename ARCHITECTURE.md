# ATLAS System Architecture (v6.5.0)

## Configuration Architecture

Pipeline-driven system — single CLAUDE.md → directory/page skills → directory/page knowledge:

1. **`~/.claude/CLAUDE.md`** — Self-contained instructions (~18KB, merged from CLAUDE.md + 7 rule files)
   - 5-step pipeline: Analyze → Plan → Execute → Deliver → Learn (conditional)
   - Unified task complexity scale (replaces 4 separate classification systems)
   - All rules inline: Code Quality, Git, Security, Testing, Web Development
   - Skills System references Active/Archive Directory/Page files
   - Knowledge Store references Knowledge Directory/Page files (5 pages)
   - Reference pointer to REFERENCE.md (slash commands, MCP patterns, security triggers)

2. **Skills Directory/Page System**:
   - `skills/ACTIVE-DIRECTORY.md` — Index of 66 active skills (15 Core + 51 Available)
   - `skills/ACTIVE-PAGE-1-web-frontend.md` — Web, animation, design, testing, security skills
   - `skills/ACTIVE-PAGE-2-backend-tools.md` — Backend, deployment, workflow skills
   - `skills/ACTIVE-PAGE-3-native-crossplatform.md` — Native, desktop, cross-platform, hardware, edge AI skills
   - `skills/ARCHIVE-DIRECTORY.md` — Index of archived skills by 7 bundles
   - `skills/ARCHIVE-PAGE-1..7` — Infra/DevOps, Security, Enterprise, Data/ML, Mobile, Workflow, Document/Media

3. **Knowledge Store** (67 entries):
   - `topics/KNOWLEDGE-DIRECTORY.md` — Index of all 67 entries
   - `topics/KNOWLEDGE-PAGE-1-patterns.md` — 28 G-PAT entries
   - `topics/KNOWLEDGE-PAGE-2-solutions.md` — 16 G-SOL entries
   - `topics/KNOWLEDGE-PAGE-3-errors.md` — 9 G-ERR entries
   - `topics/KNOWLEDGE-PAGE-4-preferences.md` — 8 G-PREF entries
   - `topics/KNOWLEDGE-PAGE-5-failures.md` — 6 G-FAIL entries

4. **Rules** — None. All merged into CLAUDE.md (rules/ directory removed).

## Flow — Unified Execution Engine

Flow is the sole workflow system. 18 commands, 15 agents, 4 depth levels (quick/standard/deep/epic).
State stored in `.flow/` per project.

## Hooks (14 hook commands, shared lib.js)

All Node hooks import `hooks/lib.js` for shared utilities (JSON I/O, file rotation, stdin parsing, output helpers, threshold loading).

Active hooks:
- PreToolUse: context-guard.js (security gate + context budget), cctools safety hooks (bash, file_length, env_protection)
- PostToolUse: auto-formatter, post-tool-monitor.js (efficiency, failures, context, health)
- PostToolUseFailure: tool-failure-handler.js (circuit breaker, tool health)
- UserPromptSubmit: allow_git_hook.py (session-scoped git staging/commit approval toggle via `>allow-git`)
- SessionStart: session-start.sh (handoff, version, log rotation, error TTL, health, cleanup rotation [plans/session-env/todos/cache/scratchpad], debug cleanup, backup)
- Stop: session-stop.sh (handoff from stdin, todos, KG feeding [git + non-git contexts], auto-continuation)
- PreCompact: precompact-reflect.sh
- Notification: claudio
- StatusLine: statusline.js (context bar, task, call count)

## Atlas Intelligence Layer (extracted from mempalace, evolved for ATLAS)

Two zero-dependency Node.js modules, wired into 3 hook integration points:

1. **`hooks/atlas-kg.js`** — Temporal Knowledge Graph
   - JSON-backed entity-relationship graph (entities.json + triples.json in `~/.claude/atlas-kg/`)
   - Typed triples with temporal validity (valid_from/valid_to)
   - Query by entity, relationship, time window; timeline generation; recent facts
   - CLI: `node atlas-kg.js {add|query|invalidate|timeline|recent|summary|stats}`
   - Wired into: session-start (§6: injects recent facts), precompact (preserves KG across compaction)

2. **`hooks/atlas-extractor.js`** — Heuristic Memory Auto-Extractor
   - Pure regex classifier: text → G-PAT/G-SOL/G-ERR/G-PREF/G-FAIL
   - Engineering-focused marker sets (patterns, solutions, errors, preferences, failures)
   - Confidence scoring with disambiguation (e.g. resolved failures → solutions)
   - CLI: `node atlas-extractor.js {extract|extract-stdin|compact}`
   - Wired into: session-stop (§1b: auto-extracts from handoff), precompact (classification hint)

**Integration map:**
- `session-start.sh` §6 → atlas-kg summary → injects recent KG facts on wake-up
- `session-stop.sh` §1b → atlas-extractor → auto-classifies handoff content
- `precompact-reflect.sh` → atlas-kg summary + atlas-extractor hint → preserves knowledge pre-compaction

## MCP Servers

Lazy discovery via TOOL_SEARCH. Connected: MCP_DOCKER (Context7, GitHub, Neon, Wikipedia, Memory, Playwright, Git, Filesystem, Obsidian), shadcn, Supabase, Stripe, Resend, Prisma, Firebase, Sentry, Canva, Figma, Context Mode (context sandboxing + FTS5/BM25 retrieval)

## Performance History

- 2026-04-05: **v4.0.0** — Pipeline-based CLAUDE.md, Directory/Page skills+knowledge, hooks consolidated
- 2026-04-05: **v5.0.0** — CLAUDE.md self-contained, 4 classification systems → 1, hooks 14→12, 88 dead files cleaned
- 2026-04-05: **v5.1.0** — 6 new skills (SK-075→080), SK-005 major upgrade, Context Mode MCP, skills 53→59
- 2026-04-06: **v5.2.0** — Knowledge pruned (80→63), widened context thresholds
- 2026-04-06: **v5.3.0** — 7 bugs fixed, hooks upgraded, CLAUDE.md trimmed 10%, REFERENCE.md merged
- 2026-04-06: **v5.4.0** — Shared hooks/lib.js, 6 bug fixes, redundant files trashed, changelog archived
- 2026-04-06: **v5.5.0** — Deep audit: version sync (4 files aligned), 12 dead files/dirs purged (TRASH dirs, __pycache__, stale memory-bridge.yaml), tool-health.json reset (vestigial fields removed), strict profile documented honestly, MEMORY.md corrected. Skills 59→61 (SK-081 Knowledge Graph, SK-082 Graph-Aware Review).
- 2026-04-06: **v5.6.0** — Final audit: 8 dead files/dirs purged, snapshot+todo rotation in session-start.sh, hook profile consistency (statusline.js gate + lib.js scope docs), stale doc refs fixed.
- 2026-04-06: **v5.7.0** — Vanguard web architecture: 5 new skills (SK-083/084/085/086/087), SK-057 archived, SK-030/054 upgraded. Render Tiers, CSS-First principle, streaming pipeline. Skills 61→65.
- 2026-04-06: **v5.8.0** — Native Engine: 5 new skills (SK-088/089/090/091/092), SK-058 upgraded to Universal Conductor v2.0, ACTIVE-PAGE-3 (native/cross-platform) created, 5 Fusion Blueprint templates, expo-app template updated to SDK 54. Skills 65→70.
- 2026-04-07: **v5.9.0** — ULTRATHINK Audit: version sync (7 files aligned to v5.9.0), skill count 70→78, knowledge count 63→66, smoke test Page 3 gap fixed, __pycache__ cleanup, tool-health streaks reset, dead MEMORY.md reference removed.
- 2026-04-07: **v6.0.0** — Atlas Intelligence Layer: extracted temporal KG + heuristic extractor from mempalace (ruthless curation: 2 of 12 components taken, rest rejected). Zero new dependencies. Wired into 3 hooks (session-start, session-stop, precompact). JSON-backed KG with entity/triple/temporal queries. Auto-extractor maps to G-PAT/SOL/ERR/PREF/FAIL taxonomy.
- 2026-04-07: **v6.1.0** — Living Atlas Audit: 22 dead files/dirs purged (~488KB — TRASH dirs, __pycache__, corrupted backups, pre-rebuild artifacts, cached changelog, test files, broken symlink). health-validator.js dead registryIntegrity() removed. Atlas KG entity types fixed (4 "unknown" → proper types). Version sync: 4 files aligned to v6.1.0.
- 2026-04-07: **v6.2.0** — System Review: 13 skills archived (78→65), TRASH emptied+auto-cleanup, KG session feeding, 8 hook functional tests added.
- 2026-04-07: **v6.3.0** — Memory Restructuring: auto-memory realigned to intended design. system_architecture.md and installed-resources.md moved out of memory/ (docs, not memories). evolution.md/conflicts.md/sessions/ deleted (unused). MEMORY.md rewritten as clean 4-section index. First user-type memory created. session-start.sh conflicts section removed.
- 2026-04-07: **v6.4.0** — System Effectiveness Audit: 12 infrastructure issues fixed + 6 behavioral gaps closed. Infrastructure: session-start.sh upgraded with rotation (plans/session-env/todos/cache/scratchpad/logs), Atlas KG fixed + session-stop feeding upgraded, skill tracking reset, scheduled tasks 7→3, TRASH emptied, accumulated waste purged. Behavioral: CLAUDE.md pipeline upgraded — Step 1 now requires system lookup (skills/knowledge/reference/MCP), Step 2 requires Context7 for framework tasks, Step 3 adds security triggers (sharp-edges/differential-review/insecure-defaults) + reflexion self-check, Step 4 adds Preview MCP visual verification + design QA pipeline (SK-078/079/080) + DevOps generator+validator enforcement. Knowledge Store now explicitly used as pre-flight check (G-ERR/G-FAIL before implementing). CLAUDE.md 8KB→10KB.
- 2026-04-08: **v6.5.0** — Deep Audit: 8 fixes across 13 files. KG: predicate-based entity type inference (0 unknowns), invalidateByPredicate + prune commands, session-stop now invalidates old last_commit triples. Tool health: timestamped failure arrays + 48h-window health summary (replaces meaningless all-time counters). PreCompact: JSON serialization via node (fixes silent failure on special chars). Context guard: Skill added to ALWAYS_ALLOWED. Strict hook profile removed (dead code). Auto-continuation: Windows prompt via temp file (fixes cmd.exe special char breakage). Smoke test: +2 sections (KG integrity, memory system validation). Statusline: fallback partial-session matching for todo files.
