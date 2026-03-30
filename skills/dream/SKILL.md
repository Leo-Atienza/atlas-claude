<!--
id: SK-040
name: dream
description: Multi-phase memory consolidation — orient, gather signal, merge, prune
trigger: /dream or session-end when memory drift detected
version: 1.0.0
source: Piebald-AI/claude-code-system-prompts (agent-prompt-dream-memory-consolidation.md)
-->
# Dream: Memory Consolidation

You are performing a **dream** — a reflective pass over your memory files. Synthesize what you've learned recently into durable, well-organized memories so that future sessions can orient quickly.

**When to trigger**: End of session (after `/reflect`), on user request (`/dream`), or when the system detects stale/contradictory memories during session start.

---

## Phase 1 — Orient

1. `ls` the memory directory to see what exists
2. Read `MEMORY.md` (the index) to understand current structure
3. Skim existing topic files and category rollups (`patterns.md`, `mistakes.md`, `solutions.md`, `preferences.md`, `failed-approaches.md`) — improve them, don't duplicate
4. Check `sessions/sessions-index.md` for recent session logs
5. Check `conflicts.md` for unresolved contradictions

## Phase 2 — Gather Recent Signal

Look for new information worth persisting. Sources in priority order:

1. **Session logs** (`memory/sessions/*.md`) — recent reflected sessions
2. **Existing memories that drifted** — facts that contradict what the codebase or conversation now shows
3. **Failure log** (`~/.claude/logs/failures.jsonl`) — recurring tool failures not yet captured as G-ERR topics
4. **Transcript search** — if you need specific context, grep the project JSONL transcripts narrowly:
   ```bash
   grep -rn "<narrow term>" ~/.claude/projects/*/  --include="*.jsonl" | tail -50
   ```
   Don't exhaustively read transcripts. Look only for things you already suspect matter.
5. **Evolution log** (`memory/evolution.md`) — check for pending promotions or maturity milestones

## Phase 3 — Consolidate

For each thing worth remembering, write or update a memory file following the auto-memory conventions from the system prompt.

**Rules**:
- Merge new signal into existing topic files rather than creating near-duplicates
- Convert relative dates ("yesterday", "last week") to absolute dates
- Delete contradicted facts — if today's investigation disproves an old memory, fix it at the source
- Respect the type system: `user`, `feedback`, `project`, `reference`
- For knowledge store entries (G-PAT, G-SOL, G-ERR, G-FAIL, G-PREF): update the matching topic file in `topics/` and its category rollup
- Move resolved items out of `conflicts.md`

**Do NOT save**:
- Code patterns derivable from reading the project
- Git history available via `git log`/`git blame`
- Debugging solutions already captured in code/commits
- Anything already in CLAUDE.md files
- Ephemeral task details from the current conversation

## Phase 3.5 — Knowledge Graduation

Scan topic files in `topics/` for maturity promotion. Knowledge earns trust through repeated confirmation across sessions and projects.

**Graduation criteria** (check the `Confirmed:` field in each topic's frontmatter):

| Current Maturity | Threshold | Promotes To |
|-----------------|-----------|-------------|
| `initial` | Confirmed in 3+ different sessions | `established` |
| `established` | Confirmed in 5+ sessions across 2+ projects | `proven` |
| `proven` | No further promotion needed | — |

**Process**:
1. Read `INDEX.md` — scan for topics still at `initial` or `established` maturity
2. For each candidate, check its topic file for `Confirmed:` count and `Projects:` list
3. If graduation criteria are met:
   - Update the topic file's `Maturity:` field
   - Log the promotion in `evolution.md`: `- [YYYY-MM-DD] GRADUATED: {ID} ({name}) → {new_maturity} (confirmed {N} times)`
4. Report promotions in the dream summary under `**Graduated**:`

**If no topics qualify**, skip silently — graduation is earned, not forced.

## Phase 4 — Prune and Index

Update `MEMORY.md` so it stays **under 200 lines** and **under 25KB**.

- Each entry: one line, under ~150 chars: `- [Title](file.md) — one-line hook`
- Remove pointers to stale, wrong, or superseded memories
- Demote verbose entries: if an index line > 200 chars, move detail to the topic file
- Add pointers to newly important memories
- Resolve contradictions: if two files disagree, fix the wrong one
- Update `INDEX.md` if knowledge store entries changed (sequential IDs, proper categories)

Update `evolution.md` with a timestamped entry recording what changed.

## Phase 5 — Knowledge Graph Sync (if MCP available)

If Memory Graph MCP tools are accessible (`create_entities`, `create_relations`):

1. **Sync entities**: For each topic file in `topics/`, create/update a Knowledge Graph entity:
   ```
   create_entities([{
     name: "{ID} — {Name}",
     entityType: "learning-{category}",
     observations: ["Summary: ...", "Tags: ...", "Maturity: ...", "Date: ..."]
   }])
   ```

2. **Sync edge relations** (MAGMA graph): For each topic with edge metadata:
   - `Supersedes` → `create_relations([{from: "{new_ID}", relationType: "supersedes", to: "{old_ID}"}])`
   - `Caused by` → `create_relations([{from: "{ID}", relationType: "caused_by", to: "{cause_ID}"}])`
   - `Components` → `create_relations([{from: "{ID}", relationType: "involves_component", to: "{component}"}])`

3. **Cross-reference**: Create `related_to` relations between entries that share 2+ tags

If Memory Graph MCP is NOT available, skip silently. File-based memory is primary.

## Phase 6 — Skill Evolution Check

Run skill improvement analysis:
```bash
node ~/.claude/scripts/skill-improver.js
```

If candidates are generated, include them in the dream summary.

---

## Output

Return a brief summary structured as:

```
## Dream Summary — YYYY-MM-DD

**Consolidated**: [what was merged/updated]
**Graduated**: [topics promoted to established/proven, or "none"]
**Pruned**: [what was removed/shortened]
**New**: [any new memories created]
**Conflicts resolved**: [any contradictions fixed]
**No changes**: [if memories are already tight, say so]
```

---

## Post-Dream — Stamp Last Run

After completing consolidation, **always** update the timestamp so session-start knows when dream last ran:

```bash
date +%s > ~/.claude/cache/dream-last-run
```

This prevents repeated triggers within the same week.

## Integration Points

- **Automatic**: `session-start.sh` checks if dream is needed (>7 days since last run, >50 memory files, or MEMORY.md >150 lines) and emits `DREAM NEEDED` signal
- **On signal**: When you see `DREAM NEEDED` at session start, run `/dream` before other work
- **After `/reflect`**: Dream handles the memory-specific consolidation that reflect doesn't cover
- **Weekly maintenance**: Can be chained with `/analyze-mistakes` and `/health`
- **Manual**: User can run `/dream` anytime
