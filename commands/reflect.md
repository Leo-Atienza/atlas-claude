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
KNOWLEDGE_DIR   = ~/.claude/topics/KNOWLEDGE-DIRECTORY.md
KNOWLEDGE_PAGES:
  PAGE_1 = ~/.claude/topics/KNOWLEDGE-PAGE-1-patterns.md     (G-PAT)
  PAGE_2 = ~/.claude/topics/KNOWLEDGE-PAGE-2-solutions.md    (G-SOL)
  PAGE_3 = ~/.claude/topics/KNOWLEDGE-PAGE-3-errors.md       (G-ERR)
  PAGE_4 = ~/.claude/topics/KNOWLEDGE-PAGE-4-preferences.md  (G-PREF)
  PAGE_5 = ~/.claude/topics/KNOWLEDGE-PAGE-5-failed-approaches.md (G-FAIL)
GLOBAL_MEMORY   = ~/.claude/projects/C--Users-leooa--claude/memory

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

Read the Knowledge Directory to understand what's already captured:

```
Read: {KNOWLEDGE_DIR}
```

If working in a project directory (not ~/.claude), also check:
```
Glob: <cwd>/.claude/memory/INDEX.md
```

## Phase 3 — Duplicate & Conflict Detection

For EACH new learning, check existing KNOWLEDGE-DIRECTORY.md entries:

1. **Scan by name and tags** — look for entries about the same topic
2. **If duplicate found**: Update the EXISTING entry in its Knowledge Page instead of creating a new one. Bump the date in KNOWLEDGE-DIRECTORY.md.
3. **If contradiction found**: Update the existing entry with the corrected information. Add a note: `**Updated {date}**: {what changed and why}`. Flag the update in the session report.
4. **If no conflict** — proceed to write

## Phase 3.5 — Knowledge Evolution

Before writing new entries, apply evolution mechanics to EXISTING knowledge:

### a) Pattern Confirmation

Check if any existing entries were **reused or confirmed** this session:
- If an existing pattern/solution was applied and worked → note confirmation in the Knowledge Page entry
- After 3+ confirmations across sessions, add `**Maturity**: proven` to the entry
- Proven patterns get priority in future routing decisions

### b) Solution Refinement

If a previously captured solution (G-SOL-xxx) was reused and IMPROVED this session:
- Update the entry in its Knowledge Page with the improved version
- Add: `**Updated {date}**: {what changed}`

### c) Anti-Pattern Detection (Saves)

If a previously captured mistake (G-ERR-xxx) was **almost repeated** but caught by the knowledge system:
- Note it in the session report — this validates the system is working

### d) Cross-Project Knowledge Transfer

If a LOCAL pattern (L-PAT-xxx) from a previous project proved useful in a different project:
- Promote it to GLOBAL (G-) scope
- Add entry to KNOWLEDGE-DIRECTORY.md and the relevant Knowledge Page
- Add `**Promoted from**: {original_L_ID} in {project}` to the entry

## Phase 4 — Generate IDs and Write Topic Files

For each NEW learning (not a duplicate, not a conflict):

### a. Get Next ID

Read KNOWLEDGE-DIRECTORY.md → find the highest ID number in the relevant category → increment by 1.

### b. Append to Knowledge Page

Append entry to the relevant Knowledge Page (or local INDEX.md for L- entries):

- G-PAT → KNOWLEDGE-PAGE-1-patterns.md
- G-SOL → KNOWLEDGE-PAGE-2-solutions.md
- G-ERR → KNOWLEDGE-PAGE-3-errors.md
- G-PREF → KNOWLEDGE-PAGE-4-preferences.md
- G-FAIL → KNOWLEDGE-PAGE-5-failed-approaches.md

Entry format:

```markdown
## {ID}: {Name}
**Date**: {YYYY-MM-DD} | **Tags**: #{tag1} #{tag2} #{tag3}

{Full explanation with context.
For Solutions: include complete code snippets with fences and language tags.
For Mistakes: explain what went wrong AND the correct approach.
For Failed Approaches: explain WHY it failed, what was tried, what the alternative was.
For Patterns: describe the pattern, when it applies, example usage.
For Preferences: describe the preference, how it was confirmed, how to apply it.}

**Related**: {entry IDs, or "None"}

---
```

### c. Update KNOWLEDGE-DIRECTORY.md

Add a new row to the appropriate category table:

```
| {ID} | {Name} | #{tags} | {YYYY-MM-DD} |
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

## Phase 5 — Session Summary (internal)

No session files are written — knowledge lives in the Knowledge Pages and KNOWLEDGE-DIRECTORY.md. This phase prepares the report shown in Phase 9.

Gather:
- **Summary**: 2-3 sentence session summary
- **Main task**: what was the primary goal
- **Usage Profile**: commands invoked, skills loaded, MCP tools used, agents spawned, primary domain, complexity level
- **Learnings Captured**: list of IDs added/updated this session
- **Evolution Activity**: confirmations, refinements, promotions

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
- KNOWLEDGE-012: React useCallback dependency trap (#react #hooks)
- KNOWLEDGE-053: Never await inside useEffect directly (#react #async)

Evolution:
- Confirmed: KNOWLEDGE-003 (3x → proven)
- Save: Avoided KNOWLEDGE-051

Usage: 2 commands, 1 skill, 3 MCP tools, medium complexity
```

If truly nothing new:
```
Session Reflected

No significant new learnings captured.
Session: Quick Q&A about {topic}
```

</process>

<quality_gates>
- No duplicate entries in KNOWLEDGE-DIRECTORY.md — always check before writing
- Contradictions are updated in-place with a note, never silently overwritten
- Knowledge Page entries contain enough detail to be immediately actionable
- Sensitive data is ALWAYS filtered before writing
- IDs are sequential and never reused
- Local vs global classification is intentional, not arbitrary
- Usage profiles are always captured for intelligence building
- Evolution mechanics (confirm/refine/promote) are checked every session
</quality_gates>

<evolution_principle>
This system exists because every interaction is an opportunity to grow.
A mistake made once is a lesson. A mistake made twice is a system failure.
A pattern discovered is an investment. A preference captured is a relationship deepened.
The system doesn't just record — it EVOLVES. Patterns mature. Solutions refine. Knowledge transfers.
Never stop learning. Never stop writing. Never stop evolving.
</evolution_principle>
