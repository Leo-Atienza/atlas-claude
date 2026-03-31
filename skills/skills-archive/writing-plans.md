# Writing Plans

> Source: [obra/superpowers](https://github.com/obra/superpowers)

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for the codebase. Document everything they need: which files to touch, code samples, how to verify. Give the plan as bite-sized tasks. DRY. YAGNI. Frequent commits.

Assume the reader is a skilled developer but knows almost nothing about the specific toolset or domain.

## When to Use

Use when you have a spec or requirements for a multi-step task, **before touching code**. Especially valuable for:
- New features that touch multiple files
- Complex bug fixes spanning multiple components
- Refactoring or restructuring existing code

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Add the TypeScript interface" — step
- "Create the module/component" — step
- "Run the type checker to verify" — step
- "Commit" — step

## Plan Document Header

Every plan MUST start with:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach, key components involved]

**Key Files:** [List the main files that will be created or modified]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing`

**Step 1: [Action description]**

```
// Exact code to write or modify
```

**Step 2: [Verification]**

Run: `[type check / build / test command]`
Expected: 0 errors

**Step 3: Commit**

```bash
git add [specific files]
git commit -m "feat: add [specific thing]"
```
````

## Plan File Location

Save plans to: `docs/plans/YYYY-MM-DD-<feature-name>.md`

Create the `docs/plans/` directory if it doesn't exist.

## Execution Handoff

After saving the plan, offer execution options:

1. **Immediate execution** — Execute tasks sequentially in this session, following the `executing-plans` skill
2. **Review first** — Present plan for human review before starting

## Remember

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact verification commands with expected output
- DRY, YAGNI, frequent commits
- Reference project-specific patterns from CLAUDE.md when applicable
