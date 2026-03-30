---
name: reflect
description: "Progressive Learning — capture ALL session knowledge into the book-structured memory system. MANDATORY at end of every session."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - MultiEdit
---

<objective>
Extract ALL learnings from this session and write them into the Progressive Learning System.

Every session must leave the system smarter — no exceptions, no matter how small the session.
This is the evolution mechanism. You are always growing.
</objective>

<constants>
GLOBAL_MEMORY = ~/.claude/projects/<PROJECT_MEMORY_DIR>/memory
GLOBAL_INDEX  = {GLOBAL_MEMORY}/INDEX.md
GLOBAL_TOPICS = {GLOBAL_MEMORY}/topics/
GLOBAL_SESSIONS = {GLOBAL_MEMORY}/sessions/
SESSIONS_INDEX = {GLOBAL_SESSIONS}/sessions-index.md
CONFLICTS_FILE = {GLOBAL_MEMORY}/conflicts.md
EVOLUTION_FILE = {GLOBAL_MEMORY}/evolution.md

LOCAL_MEMORY = <cwd>/.claude/memory  (only if not already in ~/.claude)
</constants>

<process>

## Phase 1 — Session Analysis

Review EVERYTHING that happened this session. Extract learnings in these categories:

| Category | Code | Capture |
|----------|------|---------|
| Pattern | PAT | Reusable code/architecture/workflow approaches that worked well |
| Solution | SOL | Specific solutions worth reusing — include code snippets with fences |
| Mistake | ERR | Wrong assumptions, bugs introduced, near-misses — what went wrong AND the fix |
| Preference | PREF | User preferences discovered or confirmed through behavior/statements |
| Failed Approach | FAIL | Things tried that didn't work — include WHY it failed so it's never retried |

**Scope classification:**
- **GLOBAL (G-)**: Applicable across any project
- **LOCAL (L-)**: Specific to this project only

**Sensitive data filter — ALWAYS apply:**
- Generalize: client names → "client", API keys → "[redacted]", specific URLs → "internal API"

**Even for trivial sessions**, capture at minimum a session log entry.

## Phase 1.5 — Session Profile (Usage Intelligence)

Capture a usage profile for this session to build a heat map over time:

```
### Usage Profile
- **Commands invoked**: {list of slash commands used, e.g., /gsd:quick, /reflect}
- **Skills loaded**: {list of SKILL.md files read, e.g., frontend-design, typescript-guru}
- **MCP tools used**: {list of MCP servers called, e.g., Context7, GitHub, Preview, Memory Graph}
- **Plugins active**: {plugins that contributed, e.g., commit-commands, code-review}
- **Agents spawned**: {count and types, e.g., 3x Explore, 1x Plan}
- **Primary domain**: {e.g., frontend, backend, devops, config, debugging}
- **Complexity**: {trivial | low | medium | high}
```

This profile gets written to the session entry (Phase 5). After 10+ sessions, patterns emerge showing which tools provide real value.

## Phase 2 — Read Existing Knowledge

Read the INDEX.md to understand what's already captured:

```
Read: {GLOBAL_INDEX}
```

If working in a project directory (not ~/.claude), also check:
```
Glob: <cwd>/.claude/memory/INDEX.md
```

## Phase 3 — Conflict Detection

For EACH new learning, check existing INDEX.md entries:

1. **Scan by name and tags** — look for entries about the same topic
2. **If contradiction found:**
   - Write BOTH versions to `conflicts.md` using this format:
   ```
   ## CONFLICT-{next_number} | Detected: {today}

   **Existing**: {existing_ID} — {what was previously recorded}
   **New finding**: {what this session discovered}
   **Context**: {when each might apply}
   **Resolution**: pending
   ```
   - Do NOT overwrite the existing entry
   - Flag the conflict in the session summary

3. **If no contradiction** — proceed to write

## Phase 3.5 — Knowledge Evolution

Before writing new entries, apply evolution mechanics to EXISTING knowledge:

### a) Pattern Maturity Scoring

Check if any existing entries were **reused or confirmed** this session:
- If an existing pattern/solution was applied and worked → increment its `confirmed` count in the topic file header
- After 3+ confirmations, add `**Maturity**: proven` to the topic file
- Proven patterns get priority in future routing decisions

### b) Solution Refinement

If a previously captured solution (G-SOL-xxx) was reused and IMPROVED this session:
- Update the topic file with the improved version
- Add a `## Version History` section: `- {date}: {what changed}`
- Keep the original solution text as a collapsed section for reference

### c) Anti-Pattern Detection (Saves)

If a previously captured mistake (G-ERR-xxx) was **almost repeated** but caught by the memory system:
- Log it as a "save" in `evolution.md`:
  ```
  ## Save #{next} | {date}
  Avoided: {ERR_ID} — {mistake name}
  Context: {what triggered the near-miss}
  ```
- This validates the memory system is working and prioritizes that mistake for retention

### d) Cross-Project Knowledge Transfer

If a LOCAL pattern (L-PAT-xxx) from a previous project proved useful in a different project:
- Promote it to GLOBAL (G-) scope
- Update both the local and global INDEX.md
- Add `**Promoted from**: {original_L_ID} in {project}` to the topic file

## Phase 4 — Generate IDs and Write Topic Files

For each NEW learning (not a duplicate, not a conflict):

### a. Get Next ID

Read INDEX.md → find the highest ID number in the relevant category → increment by 1.

### b. Create Topic File

Write to `{GLOBAL_TOPICS}/{ID}-{slug}.md` (or local equivalent for L- entries):

```markdown
# {ID} — {Name}

**Category**: {Pattern | Solution | Mistake | Preference | Failed Approach}
**Tags**: #{tag1} #{tag2} #{tag3}
**First seen**: {YYYY-MM-DD} | **Projects**: {project-name}
**Confirmed**: 1 | **Maturity**: emerging

### Edges (MAGMA graph metadata)
- **Supersedes**: {ID of entry this replaces, or "none"}
- **Caused by**: {ID of pattern/mistake that led to this, or "none"}
- **Components**: {list of files/modules this relates to, e.g., session-start.sh, settings.json}

## What

{1-3 sentence description of the learning}

## Details

{Full explanation with context.
For Solutions: include complete code snippets with fences and language tags.
For Mistakes: explain what went wrong AND the correct approach.
For Failed Approaches: explain WHY it failed, what was tried, what the alternative was.
For Patterns: describe the pattern, when it applies, example usage.
For Preferences: describe the preference, how it was confirmed, how to apply it.}

## When to Apply

{Specific conditions or triggers where this knowledge is relevant.
Be concrete: "When using Express middleware" not "When building APIs"}

## Related

{List related entry IDs, or "None yet" if standalone}
```

### c. Update INDEX.md

Add a new row to the appropriate category table in INDEX.md:

```
| {ID} | {Name} | {1-line summary} | #{tags} | {YYYY-MM-DD} |
```

### d. Store in Memory Graph (if MCP available)

If Memory Graph MCP tools are accessible:

```
create_entities([{
  name: "{ID} — {Name}",
  entityType: "learning-{category}",
  observations: [
    "Summary: {1-line summary}",
    "Tags: {tags}",
    "Category: {CAT}",
    "Date: {YYYY-MM-DD}",
    "Project: {project-name}",
    "Maturity: emerging"
  ]
}])
```

Create relations to related entries:
```
create_relations([{
  from: "{new_ID} — {Name}",
  relationType: "related_to",
  to: "{existing_ID} — {Name}"
}])
```

If Memory Graph is NOT available, skip silently — file-based system is the primary store.

## Phase 5 — Write Session Entry

### a. Create Session File

Write to `{GLOBAL_SESSIONS}/{YYYY-MM-DD}-{project-slug}.md`:

```markdown
## {YYYY-MM-DD} | {Project Name or CWD basename}

**Summary**: {2-3 sentence session summary}
**Main task**: {what was the primary goal}

### Usage Profile
- **Commands invoked**: {slash commands used}
- **Skills loaded**: {SKILL.md files read}
- **MCP tools used**: {MCP servers called}
- **Plugins active**: {plugins that contributed}
- **Agents spawned**: {count and types}
- **Primary domain**: {frontend, backend, devops, config, etc.}
- **Complexity**: {trivial | low | medium | high}

### Learnings Captured

| ID | Category | Name |
|----|----------|------|
| {ID} | {CAT} | {Name} |

### Evolution Activity

| Action | Entry | Detail |
|--------|-------|--------|
| {confirmed/refined/promoted/saved} | {ID} | {brief description} |

(Leave empty if no evolution activity this session)

### Conflicts Flagged

{List any conflicts detected with IDs, or "None"}

### Session Notes

{Any additional context: decisions made, alternatives considered}
```

If a session file for today already exists, append with `---` separator.

### b. Update Sessions Index

Add row to `{SESSIONS_INDEX}`:

```
| {YYYY-MM-DD} | {project} | {1-line summary} | {comma-separated IDs} |
```

## Phase 6 — Auto-Prune (if > 30 sessions)

Count rows in sessions-index.md. If more than 30:

1. Identify oldest entries beyond 30
2. Verify their learnings exist in topic files
3. Delete the old session .md files from sessions/
4. Remove those rows from sessions-index.md
5. Topic files persist forever — knowledge is never lost

## Phase 7 — Local Project Memory

If the current working directory is NOT `~/.claude` and is a real project:

1. **Check for local memory**: `Glob: <cwd>/.claude/memory/INDEX.md`
2. **If it doesn't exist** — create the full structure
3. **Write LOCAL learnings** (L- prefix) to the project's own memory
4. **Write GLOBAL learnings** (G- prefix) to the global memory
5. **Cross-reference**: In local INDEX.md, note any related global entries

## Phase 8 — Clear Flags

```bash
rm -f ~/.claude/.pending-reflection 2>/dev/null
rm -f ~/.claude/.reflect-trigger 2>/dev/null
```

## Phase 9 — Report to User

Show a concise summary:

```
Session Reflected

Knowledge captured:
- G-PAT-014: React useCallback dependency trap (#react #hooks)
- G-ERR-008: Never await inside useEffect directly (#react #async)

Evolution:
- Confirmed: G-PAT-003 (3x → proven)
- Save: Avoided G-ERR-005

Usage: 2 commands, 1 skill, 3 MCP tools, medium complexity
Sessions logged: 24/30 (6 until auto-prune)
```

If truly nothing new:
```
Session Reflected

No significant new learnings captured.
Session: Quick Q&A about {topic}
Sessions logged: 25/30
```

</process>

<quality_gates>
- Every session gets at least a session log entry — zero exceptions
- No duplicate entries in INDEX.md — always check before writing
- Conflicts are NEVER silently overwritten — always flagged
- Topic files contain enough detail to be immediately actionable
- Sensitive data is ALWAYS filtered before writing
- IDs are sequential and never reused
- Sessions auto-prune at 30, knowledge persists in topic files
- Local vs global classification is intentional, not arbitrary
- Usage profiles are always captured for intelligence building
- Evolution mechanics (confirm/refine/promote/save) are checked every session
</quality_gates>

<evolution_principle>
This system exists because every interaction is an opportunity to grow.
A mistake made once is a lesson. A mistake made twice is a system failure.
A pattern discovered is an investment. A preference captured is a relationship deepened.
The system doesn't just record — it EVOLVES. Patterns mature. Solutions refine. Knowledge transfers.
Never stop learning. Never stop writing. Never stop evolving.
</evolution_principle>
