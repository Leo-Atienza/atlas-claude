---
name: flow:brainstorm
description: "Explore WHAT to build collaboratively before planning HOW"
argument-hint: "[idea or topic]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---
<objective>
Collaborative exploration of WHAT to build before committing to HOW.

Replaces: compound:workflows:brainstorm

Use when requirements are ambiguous, multiple approaches are viable, or scope needs definition. Skip when requirements are crystal clear with acceptance criteria.

Output: `.flow/brainstorms/{date}-{topic}-brainstorm.md`
</objective>

<context>
$ARGUMENTS

Reference skill:
@~/.claude/skills/compound-engineering/brainstorming/SKILL.md
</context>

<process>

## Phase 0: Assess Need

Check if brainstorming is needed:
- Requirements already have acceptance criteria? → Skip, suggest `/flow:plan`
- User explicitly asked to brainstorm? → Proceed
- Multiple viable approaches? → Proceed
- Unclear scope? → Proceed

## Phase 1: Understand the Idea

Ask questions ONE AT A TIME (prefer multiple choice):
1. What's the core purpose?
2. Who uses this? What's their workflow?
3. What are the constraints? (tech, timeline, dependencies)
4. What does success look like?
5. What are the edge cases or risks?

Run lightweight repo research to understand existing patterns that relate.

## Phase 2: Explore Approaches

Propose 2-3 concrete approaches with:
- Description (1-2 sentences)
- Pros (specific, not generic)
- Cons (specific, not generic)
- Estimated scope (files affected, complexity)
- Lead with your recommendation and why

## Phase 3: Capture Design

Write brainstorm document:
```markdown
---
title: "{topic}"
date: "{YYYY-MM-DD}"
status: complete
approach: "{selected approach}"
---

# {Topic} Brainstorm

## What We're Building
{Clear description of the feature/system}

## Why This Approach
{Rationale for selected approach}

## Key Decisions
| Decision | Choice | Rationale |
|---|---|---|
| ... | ... | ... |

## Scope
### In Scope
- ...

### Out of Scope
- ...

### Open Questions
- ...
```

Save to `.flow/brainstorms/{date}-{slug}-brainstorm.md`

## Phase 4: Handoff

Present options:
1. **Plan it** → `/flow:plan` (carries brainstorm decisions forward)
2. **Refine more** → Continue brainstorming
3. **Park it** → Save for later
4. **Done** → Just wanted to explore

YAGNI principles apply: no hypothetical requirements, simplest approach wins, boring > clever.

</process>
