---
name: flow:discover
description: "Unified research + discovery with parallel agents"
argument-hint: "[phase-number|topic] [--ecosystem|--feasibility|--comparison]"
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
Unified research and discovery combining:
- GSD's research-phase (parallel research agents, ecosystem/feasibility/comparison modes)
- GSD's discuss-phase (adaptive questioning for user decisions)
- Fullstack Dev's discovery documents (hypothesis maps, structured research)

Use before planning when the domain is unfamiliar or decisions need research backing.

**Modes:**
- `--ecosystem` (default): "What exists for X? What's the standard approach?"
- `--feasibility`: "Can we do X? What are the blockers?"
- `--comparison`: "Compare A vs B. Which should we use?"
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Determine Discovery Type

1. If argument is a phase number → Research for phase planning
   - Read `.flow/ROADMAP.md` for phase context
   - Goal: Prepare for `/flow:plan {phase}`
2. If argument is a topic → Standalone research
   - Goal: Answer a specific question or explore a domain

## Step 2: Adaptive Questioning (Phase Discovery)

If researching for a phase, run adaptive questioning:
1. Present the phase goal from ROADMAP.md
2. Identify gray areas (UI, UX, data model, integrations)
3. Ask one question at a time, prefer multiple choice
4. Capture decisions as LOCKED

Write CONTEXT.md to `.flow/phases/{N}-{name}/CONTEXT.md`

## Step 3: Parallel Research

Spawn research agents based on mode and depth:

### Standard depth
```
Parallel:
  1. flow-repo-analyst → Local codebase patterns
  2. flow-learnings-researcher → Past solutions from .flow/solutions/
```

### Deep/Epic depth
```
Parallel:
  1. flow-repo-analyst → Local codebase patterns
  2. flow-learnings-researcher → Past solutions + global knowledge
  3. flow-external-researcher → Best practices, framework docs, Context7
  4. flow-git-analyst → Git history for related changes (if relevant)
```

### Ecosystem mode additions
- Search for standard stack/library choices
- Identify SOTA vs deprecated approaches
- Document confidence levels (HIGH/MEDIUM/LOW)

### Feasibility mode additions
- Identify technical blockers
- Check API/service availability
- Estimate complexity

### Comparison mode additions
- Side-by-side feature comparison
- Performance benchmarks (if available)
- Community adoption metrics

## Step 4: Synthesize

Spawn **flow-research-synthesizer** to combine all research:

Write `.flow/research/{topic-or-phase}/RESEARCH.md`:
```markdown
---
topic: "{topic}"
mode: "{ecosystem|feasibility|comparison}"
date: "{YYYY-MM-DD}"
confidence: "{HIGH|MEDIUM|LOW}"
---

# Research: {Topic}

## Key Findings
{Synthesized findings with confidence levels}

## Recommended Approach
{Based on research, with rationale}

## Standard Stack
{Libraries, frameworks, patterns to use}

## Common Pitfalls
{What to avoid, with evidence}

## Code Examples
{Reference implementations found}

## Sources
{Where findings came from: Context7, official docs, codebase patterns}
```

## Step 5: Route

Present summary and offer next steps:
1. **Plan it** → `/flow:plan {phase}` with research as input
2. **Research more** → Deeper investigation
3. **Brainstorm** → `/flow:brainstorm` to explore approaches
4. **Done** → Research captured for future use

</process>
