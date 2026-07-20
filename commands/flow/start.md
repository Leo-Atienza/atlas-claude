---
name: flow:start
description: "Single entry point for all new work. Analyzes task, recommends depth, initializes .flow/"
argument-hint: "[description] [--depth quick|standard|deep|epic]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Single entry point for all new work in the Flow unified workflow system.

Replaces: gsd:new-project, compound:workflows:plan (init), fullstack:intake:*

Flow: Analyze task → Recommend depth → Initialize .flow/ → Route to next step

If `--depth` is provided, skip depth analysis and use specified level.
If no description provided, ask the user what they want to build.
</objective>

<context>
$ARGUMENTS

Reference files:
@~/.claude/skills/flow/references/depth-analysis.md
@~/.claude/skills/flow/references/state-management.md
@~/.claude/skills/flow/templates/config.yaml
</context>

<process>

## Step 1: Get Task Description

If no description provided in $ARGUMENTS, ask the user:
"What would you like to build or work on?"

Capture the description for analysis.

## Step 1.5: Auto-Detect GitHub Issues (Ticket-to-PR)

Check if the task description contains a GitHub issue reference:
- Pattern: `#\d+` (e.g., "Fix #123")
- Pattern: `github.com/.+/issues/\d+` (full URL)
- Pattern: `GH-\d+` (shorthand)

If a match is found:
1. Extract the issue number (and owner/repo if in URL, otherwise use current git remote)
2. Fetch issue details: `gh issue view {number} --json title,body,labels,assignees,milestone`
3. Inject the issue context into the task description:
   ```
   Original request: {user's description}

   GitHub Issue #{number}: {title}
   Labels: {labels}
   Assignees: {assignees}

   Issue Body:
   {body}

   Acceptance Criteria (extracted from body if present):
   {criteria}
   ```
4. Continue to Step 2 with the enriched description

If `gh` is not available or the fetch fails, continue with the original description (no error — just skip enrichment).

## Step 2: Detect Existing State

Check for existing project state:
```
1. .flow/ exists → Active Flow project. Ask: "Continue existing project or start fresh?"
2. .planning/ exists → Legacy GSD project. Offer: "Migrate to Flow? (/flow:migrate) or continue with GSD?"
3. Neither → Fresh start
```

## Step 3: Depth Analysis (skip if --depth provided)

Analyze the task description to recommend a depth level:

### Signal Collection

**Scope signals:**
- Search codebase for keywords from description
- Count files likely affected (grep for related patterns/modules)
- Check for architectural keywords: "architecture", "refactor", "new module", "migration", "system"

**Risk signals (score 1-3 each, 7 dimensions):**
1. Security: auth/crypto/permissions/secrets mentioned?
2. External APIs: third-party integrations?
3. Data Model: schema changes, migrations?
4. Performance: latency, bulk operations, caching?
5. UX: user-facing changes, accessibility?
6. Compliance: privacy, legal, audit?
7. Infrastructure: deployment, CI/CD?

**Ambiguity signals:**
- Are requirements specific with acceptance criteria?
- Multiple viable approaches (needs brainstorming)?
- Greenfield vs modification?

### Depth Recommendation

```
files < 4 AND risk < 8 AND low ambiguity     → quick
files < 11 AND risk < 14                      → standard
files < 25 OR risk < 18                       → deep
files >= 25 OR risk >= 18 OR multi-milestone  → epic
```

### Present to User

```
Depth Analysis:
  Files likely affected: ~{count}
  Architectural scope: {LOW|MEDIUM|HIGH}
  Risk: {score}/21 ({flagged dimensions})
  Ambiguity: {LOW|MEDIUM|HIGH}

  Recommended: {depth}
  Reason: {explanation}

  Accept? [Y/n/override: quick|standard|deep|epic]
```

## Step 4: Initialize .flow/ Directory

Based on selected depth:

### quick depth
```bash
mkdir -p .flow/quick
```
Create minimal config:
```yaml
# .flow/config.yaml
version: 1
depth: quick
```
→ Route directly to `/flow:quick` with the task description.

### standard depth
```bash
mkdir -p .flow/{plans,solutions,todos,metrics,debug}
```
Create full config.yaml from template.
Create initial state.yaml.
→ Route to `/flow:plan` with the task description.

### deep depth
```bash
mkdir -p .flow/{phases,plans,solutions,todos,metrics,debug,brainstorms,research,codebase,ground}
```
Create full config.yaml + state.yaml.

Then run initialization questioning (adapted from GSD new-project):

**Phase A: Vision Gathering**
Ask (one question at a time, multiple choice when possible):
1. What's the core value proposition? (one sentence)
2. Who is this for?
3. What are the key constraints? (tech stack, timeline, dependencies)
4. What does "done" look like for v1?

**Phase B: Requirements Extraction**
From the answers, derive:
- v1 Requirements (in-scope, checkable)
- v2 Requirements (deferred)
- Out of scope

Write PROJECT.md and REQUIREMENTS.md.

**Phase C: Optional Research**
If the task involves unfamiliar technology or domain:
- Ask: "Should I research {topic} before we plan?"
- If yes: spawn flow-external-researcher agents in parallel
- Synthesize research into `.flow/research/SUMMARY.md`

**Phase D: Roadmap**
Spawn flow-planner in roadmap mode:
- Derive phases from requirements (not template)
- Validate 100% requirement coverage
- Create success criteria per phase
- Write ROADMAP.md and initialize STATE.md

→ Route to `/flow:plan 1` (first phase) or offer `/flow:brainstorm` if ambiguity is high.

### epic depth
Same as deep, plus:
- Create SYSTEM.md (living system description)
- Configure milestone lifecycle
- Ask about external tracker integration (Jira/Linear/GitHub Issues)
- Run `/flow:map` if existing codebase
- Run `/flow:ground` to surface initial assumptions

## Step 5: Confirmation

Present initialized project summary:
```
Flow Project Initialized:
  Name: {name}
  Depth: {depth}
  Directory: .flow/
  {phases if deep/epic}
  {requirements count if deep/epic}

  Next: {recommended next command}
```

## Step 6: Route to Next Action

| Depth | Next Action |
|---|---|
| quick | Execute `/flow:quick {description}` immediately |
| standard | Route to `/flow:plan {description}` |
| deep | Route to `/flow:brainstorm` (if ambiguous) or `/flow:plan 1` |
| epic | Route to `/flow:map` (if existing codebase) or `/flow:plan 1` |

</process>
