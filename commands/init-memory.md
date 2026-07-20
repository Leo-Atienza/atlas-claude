---
name: init-memory
description: "Initialize Progressive Learning memory structure for the current project directory"
allowed-tools:
  - Write
  - Bash
  - Glob
---

<objective>
Create the `.claude/memory/` directory structure in the current project so that local learnings can be captured.
This is automatically called by `/reflect` when needed, but can be invoked manually.
</objective>

<process>

## 1. Check if already initialized

```
Glob: <cwd>/.claude/memory/INDEX.md
```

If it exists, report "Local memory already initialized" and stop.

## 2. Create directory structure

```bash
mkdir -p .claude/memory/topics
```

## 3. Create INDEX.md

Write `.claude/memory/INDEX.md`:

```markdown
# Local Knowledge Index — {project name from CWD basename}

> Project-specific knowledge. Claude reads this at session start when working in this project.
> Use L- prefix for local IDs. Global learnings use G- prefix and live in the global memory.

---

## Patterns

| ID | Name | Tags | Date |
|----|------|------|------|

## Solutions

| ID | Name | Tags | Date |
|----|------|------|------|

## Mistakes

| ID | Name | Tags | Date |
|----|------|------|------|

## Preferences

| ID | Name | Tags | Date |
|----|------|------|------|

## Failed Approaches

| ID | Name | Tags | Date |
|----|------|------|------|
```

## 4. Report

```
Local memory initialized for: {project name}

Structure created:
  .claude/memory/
  ├── INDEX.md
  └── topics/

Ready to capture local learnings with L- prefix IDs.
```

</process>
