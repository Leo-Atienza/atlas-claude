---
name: remember
description: "Capture a fact or preference and route it to the correct ATLAS system (memory / knowledge / wiki / KG / handoff) per config/routing-rules.yml."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<objective>
Take the user's fact and write it to the right place — without asking unless routing is ambiguous. Replaces the old habit of "I should remember this somehow" with a deterministic action.
</objective>

<process>

## Step 1 — Parse the input

The user invoked `/remember <fact>`. The `<fact>` is everything after the command name. Treat it as a single string. Do NOT rewrite or expand the fact — preserve user phrasing.

## Step 2 — Consult routing rules

Read `~/.claude/config/routing-rules.yml`. The rules are ordered; first match wins. Match against:
1. **Keywords** in the fact text (case-insensitive)
2. **Intent** signals (e.g., "I prefer" → preference; "X depends on Y" → KG triple)

If no rule matches confidently (≥70%), fall through to the `default` rule which says: ask the user where it goes.

## Step 3 — Route

Based on the matched rule's `route.system`:

### personal (feedback / user / project / reference / procedure / reflection)
- v8.0.0 layout: files live under `<your-vault-path>/wiki/personal/<namespace>/<slug>.md`
  - `feedback/` — behavioral corrections from the user
  - `procedures/` — patterns / how-to / multi-step procedures
  - `project-state/` — durable facts about specific projects
  - `references/` — external links + system pointers (Linear, dashboards, repos)
  - `reflections/` — periodic distillations (longer-form)
  - `arcs/` — long-running multi-session work threads
- Path: `<namespace>/<slug>.md` — e.g. `feedback/integration-tests.md`, `procedures/skill-archive-surfaces.md`. Slug: kebab-case from first 4-6 words.
- If file exists: read it, decide if this is an update (same topic) or a new entry. Update existing > create duplicate.
- Frontmatter (vault standard, 8 required keys): `title`, `type`, `topic`, `summary`, `keywords`, `created`, `updated`, `status`
- Body: lead with the rule itself, then `## Why` and `## How to apply` sections (H2 headers, per the v8.0.0 vault schema)
- Index regen: `<your-vault-path>/wiki/personal/<namespace>/_index.md` is auto-maintained by `scripts/wiki-hot-refresh.js` / the `wiki-manage` skill — do not hand-edit.

### engineering (G-PAT / G-SOL / G-ERR / G-PREF / G-FAIL)
- Append to the matching monolithic vault file: `<your-vault-path>/wiki/engineering/{patterns,solutions,errors,preferences,failures}.md`
- Allocate the id and format the entry per the canonical protocol `~/.claude/scripts/progressive-learning/KNOWLEDGE-WRITE.md` (`## KNOWLEDGE-NNN:` H2 header + `**Date** | **Type** | **Tags**` line + body). Read 1-2 existing entries to match style.
- Tag confidence: `[HIGH]` (proven 3+), `[MEDIUM]` (once), `[LOW]` (theoretical)
- Generalize: redact client/project specifics

### atlas-kg
- CLI: `node ~/.claude/hooks/atlas-kg.js add "<subject>" "<predicate>" "<object>" --from="$(date +%Y-%m-%d)"`
- Subject/predicate/object must be short (1-3 words each). If the fact is too vague to extract a triple, route to `wiki` synthesis instead.

### wiki
- Invoke `wiki-manage` skill in `ingest` mode for new sources, or write directly to `<your-vault-path>/wiki/{entity|concept|synthesis}/${slug}.md`
- Update `<your-vault-path>/wiki/index.md` and `hot.md` per the wiki schema in `<your-vault-path>/CLAUDE.md`

### handoff
- Append to `~/.claude/cache/session-hot/${cwd_slug}.md` under an `## Open` or `## Notes` section
- This is for ephemeral session state only — facts that should survive to next session, not forever

### ask
- Print: "I don't know where this belongs. Options: feedback memory, knowledge (pattern/solution/error), wiki (concept/synthesis), KG triple, or session note. Which one?"
- Wait for user choice, then route accordingly. Save the routing decision to feedback memory if the rule should be updated.

## Step 4 — Confirm

Print one line: `✓ Remembered: <type> → <path>` (e.g., `✓ Remembered: feedback → wiki/personal/feedback/integration-tests.md`).

Do not echo the full fact back. The user already knows what they said.

## Step 5 — Surface meta-corrections

If the user says `/remember actually that should go in knowledge not memory`, treat it as a routing-rule correction:
- Update the offending memory/knowledge entry (move the fact)
- Save a `feedback_routing_${slug}.md` entry capturing the correction so future runs route it right

</process>

## Routing rules (canonical source)

The single source of truth for routing rules lives in this file as a JSON code block, fenced with `<!-- routing-rules-json -->`. Run `node ~/.claude/scripts/sync-routing.js` to regenerate `~/.claude/config/routing-rules.yml` from this block — never hand-edit the YAML.

<!-- routing-rules-json -->
```json
{
  "version": 1,
  "updated": "2026-04-30",
  "rules": [
    {
      "name": "user-correction",
      "match": {
        "keywords": ["don't", "stop", "no not that", "never do", "always", "prefer", "I want you to", "from now on"],
        "intent": "user is correcting or stating a behavioral preference"
      },
      "route": {
        "system": "personal",
        "type": "feedback",
        "namespace_dir": "feedback",
        "path": "Documents/Wiki/wiki/personal/feedback/${slug}.md",
        "reason": "Behavioral feedback — must inform future sessions, not just this one."
      }
    },
    {
      "name": "user-profile",
      "match": {
        "keywords": ["I'm a", "my role", "my background", "I work on", "I use", "I know"],
        "intent": "facts about the user themselves — role, expertise, stack"
      },
      "route": {
        "system": "personal",
        "type": "profile-update",
        "namespace_dir": "personal",
        "path": "Documents/Wiki/wiki/personal/profile.md",
        "reason": "Append/update the single profile.md page rather than creating per-fact files."
      }
    },
    {
      "name": "pattern-or-architecture",
      "match": {
        "keywords": ["pattern", "architecture", "approach worked", "use this when", "good way to", "standard practice"],
        "intent": "reusable technical pattern, applicable across projects"
      },
      "route": {
        "system": "engineering",
        "type": "G-PAT",
        "path": "Documents/Wiki/wiki/engineering/patterns.md",
        "reason": "Cross-project pattern. Confidence tag required: HIGH/MEDIUM/LOW. Append as new ## KNOWLEDGE-NNN H2 entry.",
        "domain": "If cache/active-system-<cwd_slug>.json exists (cwd_slug via hooks/lib/slug.js cwdSlug), stamp `**Domain**: <primary.domain>` on the entry metadata line. An explicit user-stated domain overrides the marker."
      }
    },
    {
      "name": "solution-snippet",
      "match": {
        "keywords": ["solution", "fix is", "the way to do this", "code that worked", "snippet", "example"],
        "intent": "specific solution worth reusing — typically with code"
      },
      "route": {
        "system": "engineering",
        "type": "G-SOL",
        "path": "Documents/Wiki/wiki/engineering/solutions.md",
        "domain": "If cache/active-system-<cwd_slug>.json exists, stamp `**Domain**: <primary.domain>` on the entry metadata line. Explicit user domain overrides."
      }
    },
    {
      "name": "error-or-mistake",
      "match": {
        "keywords": ["mistake", "got wrong", "bug I introduced", "wrong assumption", "near miss", "broke because"],
        "intent": "thing that went wrong + the lesson"
      },
      "route": {
        "system": "engineering",
        "type": "G-ERR",
        "path": "Documents/Wiki/wiki/engineering/errors.md",
        "reason": "Errors are gold. Capture root cause AND fix to prevent re-occurrence.",
        "domain": "If cache/active-system-<cwd_slug>.json exists, stamp `**Domain**: <primary.domain>` on the entry metadata line. Explicit user domain overrides."
      }
    },
    {
      "name": "failed-approach",
      "match": {
        "keywords": ["tried", "didn't work", "doesn't work because", "abandoned", "rolled back"],
        "intent": "approach attempted that did not work — capture WHY"
      },
      "route": {
        "system": "engineering",
        "type": "G-FAIL",
        "path": "Documents/Wiki/wiki/engineering/failures.md",
        "reason": "Failed approaches prevent retrying dead ends.",
        "domain": "If cache/active-system-<cwd_slug>.json exists, stamp `**Domain**: <primary.domain>` on the entry metadata line. Explicit user domain overrides."
      }
    },
    {
      "name": "work-style-preference",
      "match": {
        "keywords": ["I prefer", "my style", "I like to", "I always", "tab vs space", "naming convention"],
        "intent": "user's working style — distinct from behavioral feedback"
      },
      "route": {
        "system": "engineering",
        "type": "G-PREF",
        "path": "Documents/Wiki/wiki/engineering/preferences.md",
        "reason": "Work-style preference (vs feedback memory which captures corrections)."
      }
    },
    {
      "name": "relationship-or-decision",
      "match": {
        "keywords": ["depends on", "uses", "owned by", "decided to", "rejected", "chose", "blocked by"],
        "intent": "architectural decision or cross-project relationship not in git/code"
      },
      "route": {
        "system": "atlas-kg",
        "cli": "node ~/.claude/hooks/atlas-kg.js add <subject> <predicate> <object>",
        "reason": "Triple-store fact. Must NOT be derivable from git log or filesystem."
      }
    },
    {
      "name": "external-source-or-research",
      "match": {
        "keywords": ["paper", "article", "blog post", "talk", "research", "ingest", "from <url>"],
        "intent": "knowledge sourced from outside the codebase, worth keeping long-term"
      },
      "route": {
        "system": "wiki",
        "skill": "wiki-manage",
        "mode": "ingest",
        "path": "Documents/Wiki/raw/{articles|papers|clips}/YYYY-MM-DD-{slug}.md",
        "reason": "Wiki owns external compiled knowledge per Karpathy LLM-wiki pattern."
      }
    },
    {
      "name": "concept-or-entity",
      "match": {
        "keywords": ["concept of", "entity", "person", "company", "tool called", "framework named"],
        "intent": "domain concept or named entity worth a wiki page"
      },
      "route": {
        "system": "wiki",
        "skill": "wiki-manage",
        "mode": "ingest",
        "path": "Documents/Wiki/wiki/{entity|concept}/${slug}.md"
      }
    },
    {
      "name": "session-state-or-todo",
      "match": {
        "keywords": ["where we left off", "next step", "still pending", "open question", "blocker", "in progress"],
        "intent": "ephemeral session state — should survive to next session, not forever"
      },
      "route": {
        "system": "handoff",
        "writer": "session-stop.sh",
        "path": "cache/session-hot/${cwd_slug}.md (L1) + handoffs/${cwd_slug}.md (L2)",
        "reason": "Session-scoped only. Decays via handoff prune (14d) and session-hot rewrite."
      }
    },
    {
      "name": "default",
      "match": {
        "intent": "uncategorized — ask the user, don't guess"
      },
      "route": {
        "system": "ask",
        "reason": "Routing failed all rules. Surface to user: 'I'm not sure where this goes — memory, knowledge, wiki, or KG?'"
      }
    }
  ]
}
```
<!-- /routing-rules-json -->

**Plain English triggers**: "remember that", "save this", "capture this", "note that", "for future reference", "don't forget", "make a note that"

**Examples:**

```
/remember user prefers integration tests over mocks because of last quarter's incident where mock/prod divergence broke a migration
→ matches `user-correction` (keywords: "prefer", "because of last quarter") + reasoned-from-context
→ routes to: personal feedback
→ writes: Documents/Wiki/wiki/personal/feedback/integration-tests.md
```

```
/remember the OAuth flow uses code+state with 60s expiry
→ matches `pattern-or-architecture` (technical, reusable)
→ routes to: engineering G-PAT
→ appends to: Documents/Wiki/wiki/engineering/patterns.md
```

```
/remember Acme Corp uses Snowflake for their warehouse, owned by data team
→ matches `relationship-or-decision` (X uses Y, owned by Z)
→ routes to: atlas-kg
→ runs: atlas-kg.js add "Acme Corp" "uses" "Snowflake"; add "Snowflake at Acme" "owned_by" "data team"
```

```
/remember mid-debug: the bug is in handoff parsing, file at line 42, blocked on JSON edge case
→ matches `session-state-or-todo` (in progress, blocker)
→ routes to: handoff
→ appends to: cache/session-hot/${cwd_slug}.md
```
