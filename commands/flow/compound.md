---
name: flow:compound
description: "Knowledge compounding — document solved problems for reuse"
argument-hint: "[context about what was solved]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Document recently solved problems to compound team knowledge.

Replaces: compound:workflows:compound

Solved → Document → Lookup → Prevent Repeats → Knowledge Compounds

First time solving a problem = research (30min). Document = 5min. Next time = 2min lookup.

Output: `.flow/solutions/{category}/{slug}.md` + global index update
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Detect What Was Solved

If context provided in arguments, use that.
Otherwise, analyze recent activity:
1. Read recent git commits
2. Read recent SUMMARY.md files
3. Read debug session files
4. Identify the non-trivial problem that was solved

## Step 2: Parallel Research (5 agents returning TEXT)

Spawn 5 research agents in parallel, each returns TEXT (not files):

```
Parallel:
  1. Context Analyzer → Problem type, YAML skeleton
  2. Solution Extractor → Root cause, working solution with code
  3. Related Docs Finder → Search .flow/solutions/ for cross-references
  4. Prevention Strategist → Prevention strategies, best practices, test cases
  5. Category Classifier → Category, filename, tags
```

## Step 3: Assembly

Orchestrator collects all text and assembles single file:

```markdown
---
title: "{descriptive title}"
date: "{YYYY-MM-DD}"
category: "{category}"
tags: [{tag1}, {tag2}]
module: "{affected module}"
symptom: "{what the user sees}"
root_cause: "{why it happened}"
severity: "{low|medium|high|critical}"
---

# {Title}

## Symptom
{What the user/developer sees}

## Root Cause
{Why this happens — the real reason}

## Solution
{Step-by-step fix with code examples}

## Prevention
{How to prevent this in the future}

## Related
{Links to related solutions}
```

### Auto-categorize
Place in appropriate subdirectory:
- `build-errors/` — Build/compile failures
- `test-failures/` — Test-related issues
- `runtime-errors/` — Runtime crashes and errors
- `performance-issues/` — Performance problems
- `database-issues/` — DB/migration issues
- `security-issues/` — Security vulnerabilities
- `ui-bugs/` — Visual/interaction bugs
- `integration-issues/` — API/service integration
- `logic-errors/` — Business logic bugs

## Step 4: Update Global Index

Update `~/.claude/flow-knowledge/index.yaml`:
```yaml
solutions:
  - slug: "{slug}"
    project: "{project-name}"
    category: "{category}"
    tags: [{tags}]
    date: "{date}"
    path: "~/.claude/flow-knowledge/solutions/{category}/{project}-{slug}.md"
    local_path: "{project}/.flow/solutions/{category}/{slug}.md"
```

Copy solution to global store (if cross-project learning enabled).

## Step 5: Confirm

```
Knowledge compounded:
  .flow/solutions/{category}/{slug}.md

  This solution will be found by flow-learnings-researcher
  when future plans touch related modules or patterns.
```

</process>
