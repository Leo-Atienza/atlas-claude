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
mkdir -p .claude/memory/sessions .claude/memory/topics
```

## 3. Create INDEX.md

Write `.claude/memory/INDEX.md`:

```markdown
# Local Knowledge Index — {project name from CWD basename}

> Project-specific knowledge. Claude reads this at session start when working in this project.
> Use L- prefix for local IDs. Global learnings use G- prefix and live in the global memory.

---

## Patterns

| ID | Name | Summary | Tags | Date |
|----|------|---------|------|------|

## Solutions

| ID | Name | Summary | Tags | Date |
|----|------|---------|------|------|

## Mistakes

| ID | Name | Summary | Tags | Date |
|----|------|---------|------|------|

## Preferences

| ID | Name | Summary | Tags | Date |
|----|------|---------|------|------|

## Failed Approaches

| ID | Name | Summary | Tags | Date |
|----|------|---------|------|------|
```

## 4. Create sessions-index.md

Write `.claude/memory/sessions/sessions-index.md`:

```markdown
# Local Sessions Index — {project name}

> Session logs specific to this project. Auto-pruned after 30 entries.

| Date | Summary | Learnings |
|------|---------|-----------|
```

## 5. Create conflicts.md

Write `.claude/memory/conflicts.md`:

```markdown
# Local Conflicts — {project name}

> Project-specific contradictions. Resolved at session start.
```

## 6. Report

```
Local memory initialized for: {project name}

Structure created:
  .claude/memory/
  ├── INDEX.md
  ├── conflicts.md
  ├── sessions/
  │   └── sessions-index.md
  └── topics/

Ready to capture local learnings with L- prefix IDs.
```

</process>
