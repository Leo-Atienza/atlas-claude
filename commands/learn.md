---
name: learn
description: "Transform a mistake into a permanent G-ERR topic in Progressive Learning. The highest-ROI command — run after any Claude mistake or user correction."
argument-hint: "<describe what went wrong — or run with no args to analyze recent session>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

<objective>
Convert a specific mistake (or recent session errors) into a permanent, indexed G-ERR topic file that prevents the same class of mistake from recurring. Integrates with the Progressive Learning system.
</objective>

<process>

## Step 1: Identify the Mistake

**If $ARGUMENTS provided**: Analyze the described mistake directly.

**If no arguments**: Check two sources:
1. Recent conversation: scan last 5-10 exchanges for corrections ("no", "wrong", "don't", "stop", "actually"), failed tool uses, or retries
2. Error patterns: read `~/.claude/logs/error-patterns.json` for recurring failures (count >= 3)

If nothing found, tell the user: "No recent mistakes detected. Describe what went wrong, or run /analyze-mistakes for a broader review."

## Step 2: Abstract the Class

Do NOT write a rule about the specific instance. Write about the CLASS of mistake.

**Bad**: "Don't use `any` in UserCard.tsx line 47"
**Good**: "NEVER use `any` to silence type errors — fix the underlying type"

**Bad**: "Don't run `rm -rf /tmp/project`"
**Good**: "NEVER use `rm -rf` with variable paths — use explicit, validated paths"

## Step 3: Check for Duplicates

Read `~/.claude/projects/<PROJECT_MEMORY_DIR>/memory/INDEX.md` and scan existing G-ERR entries.

- If an EXISTING G-ERR covers the same class: propose UPDATING that topic file instead of creating a new one (add the new instance as evidence, bump the date)
- If RELATED but distinct: create new topic and note the relationship

## Step 4: Determine Next ID

```bash
ls ~/.claude/projects/<PROJECT_MEMORY_DIR>/memory/topics/G-ERR-*.md 2>/dev/null | sort | tail -1
```

Extract the highest G-ERR number, increment by 1.

## Step 5: Show Proposal

Present to the user:

```
Proposed G-ERR Topic:
  ID: G-ERR-{NNN}
  Name: {descriptive name}
  Summary: {one line}
  Tags: {#tag1 #tag2}

  What went wrong: {specific instance}
  Root cause: {why it happened}
  Correct approach: {what to do instead}
  Prevention: {how to catch this automatically — hook? rule? test?}

  Duplicate check: {none found | related to G-ERR-XXX}
```

Ask: **"Add this? (yes / modify / skip)"**

## Step 6: Apply (only after approval)

1. Create topic file at `~/.claude/projects/<PROJECT_MEMORY_DIR>/memory/topics/G-ERR-{NNN}-{slug}.md`:

```markdown
# G-ERR-{NNN}: {Name}

> {One-line summary}

## What Went Wrong
{Description of the mistake class}

## Root Cause
{Why this happens}

## Correct Approach
{What to do instead — be specific, include code examples if helpful}

## Prevention
{Hook, rule, test, or workflow change that would catch this}

## Evidence
- {date}: {specific instance that triggered this entry}

## Tags
{#tag1 #tag2 #tag3}
```

2. Add row to INDEX.md Mistakes table:
```
| G-ERR-{NNN} | {Name} | {Summary} | {tags} | {today's date} |
```

3. If the mistake came from `error-patterns.json`, reset that pattern's count to 0 (it's been addressed).

## One-Phrase Triggers
After any mistake: "Learn from that", "Add that to lessons", "Remember this mistake", or just `/learn`
</process>
