---
name: flow:ground
description: "Surface and validate Claude's hidden assumptions"
argument-hint: "[--list|--check|--graph]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---
<objective>
Surface and validate Claude's hidden assumptions about the project.

Replaces: fullstack:common-ground

Assumptions are classified by:
- **Type** (immutable): stated, inferred, assumed, uncertain
- **Tier** (mutable): ESTABLISHED (high confidence), WORKING (medium), OPEN (low)

**Modes:**
- Default: Interactive surface & adjust
- `--list`: Read-only display of tracked assumptions
- `--check`: Quick validation — are assumptions still valid?
- `--graph`: Generate mermaid reasoning diagram
</objective>

<context>
$ARGUMENTS

Reference files:
@C:/Users/leooa/.claude/commands/fullstack-dev/common-ground/references/assumption-classification.md
@C:/Users/leooa/.claude/commands/fullstack-dev/common-ground/references/file-management.md
@C:/Users/leooa/.claude/commands/fullstack-dev/common-ground/references/reasoning-graph.md
</context>

<process>

## Storage

Assumptions stored in `.flow/ground/`:
- `COMMON-GROUND.md` — Human-readable assumptions list
- `ground.index.json` — Machine-readable index

## Default Mode (Interactive)

### Phase 1: Surface Assumptions
1. Read project config, code, context
2. Identify assumptions Claude is making:
   - About tech stack, architecture, patterns
   - About user preferences, constraints
   - About external dependencies, APIs
3. Classify each by type (stated/inferred/assumed/uncertain)
4. Present to user: "These are assumptions I'm making. Select which to track."

### Phase 2: Tier Assignment
1. Propose confidence tiers for selected assumptions
2. Let user promote/demote/add
3. Write to `.flow/ground/COMMON-GROUND.md` and `ground.index.json`

## --list Mode
Display all tracked assumptions grouped by tier.

## --check Mode
1. Present tracked assumptions
2. Ask: "Are these still valid?"
3. Update timestamps for confirmed
4. Flag any that are no longer valid

## --graph Mode
Generate mermaid diagram of reasoning structure:
- Decision points, branches, weights, alternatives
- Append to COMMON-GROUND.md in Reasoning Graph section

</process>
