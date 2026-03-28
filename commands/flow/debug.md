---
name: flow:debug
description: "Scientific debugging with persistent state"
argument-hint: "[issue description]"
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
Systematic debugging using the scientific method with persistent state.

Replaces: gsd:debug, compound:reproduce-bug, compound:report-bug

Debug sessions persist in `.flow/debug/{slug}.md` so they survive context resets. Resolved sessions are archived to `.flow/debug/resolved/`.

Methodology:
1. Observe symptoms
2. Generate 3+ hypotheses
3. Test ONE variable at a time
4. Record evidence (confirms/refutes)
5. Narrow to root cause
6. Implement fix
7. Verify fix
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Step 1: Initialize Debug Session

1. Generate slug from issue description
2. Check for existing session at `.flow/debug/{slug}.md`
   - If exists: resume from where we left off
   - If new: create fresh session file

## Step 2: Spawn Debugger

Spawn **flow-debugger** agent with:
- Issue description
- Session file (for state persistence)
- Codebase context
- Related error messages/logs

The debugger follows scientific method:

### Symptom Collection
- What exactly is happening? (error messages, screenshots, logs)
- When does it happen? (always, intermittently, after specific action)
- What changed recently? (git log, recent deployments)

### Hypothesis Generation
Generate 3+ hypotheses, ranked by likelihood:
```markdown
## Hypotheses

### H1: [Most likely] {description}
Likelihood: HIGH
Test: {what to check}
Evidence needed: {what would confirm/refute}

### H2: {description}
Likelihood: MEDIUM
Test: {what to check}

### H3: {description}
Likelihood: LOW
Test: {what to check}
```

### Investigation
Test hypotheses one at a time:
1. Start with highest likelihood
2. Record evidence (confirms/refutes)
3. Update hypothesis rankings
4. If confirmed: implement fix
5. If refuted: move to next hypothesis

### Avoid Cognitive Biases
- Confirmation bias: actively look for counter-evidence
- Anchoring: don't get stuck on first hypothesis
- Availability: consider less obvious causes
- Sunk cost: abandon failing approaches

## Step 3: Checkpoint Protocol

At each major finding, create checkpoint in debug file:
```markdown
## Checkpoint: {timestamp}
Status: {investigating|found_root_cause|implementing_fix|verified}
Current hypothesis: H{N}
Evidence so far: {summary}
Next step: {what to do next}
```

Checkpoints enable:
- Context reset recovery (reload session file)
- User verification of findings (checkpoint:human-verify)

## Step 4: Fix and Verify

Once root cause is found:
1. Implement fix
2. Write test that fails without fix, passes with fix
3. Verify fix doesn't break other things
4. Commit with descriptive message

## Step 5: Archive

Move session to `.flow/debug/resolved/{slug}.md`
Add root cause summary for future reference.

Offer: `/flow:compound` to document the solution for reuse.

</process>
