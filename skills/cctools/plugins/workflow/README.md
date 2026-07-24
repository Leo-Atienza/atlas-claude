# workflow

A collection of skills and agents to enhance developer workflow with Claude Code.

## Skills

### 1. code-walk-thru

Walk through code files in your editor to explain how code works or show changes
you've made.

**How it works:**

- Claude opens files in your editor (VSCode, Cursor, etc.) at specific line numbers
- Walks through files one by one, waiting for you to confirm before moving on
- Great for reviewing Claude Code's code changes, or understanding a code-base.

**Example commands:**

```bash
# VSCode
code --goto src/main.py:42

# Cursor
cursor --goto src/main.py:42
```

### 2. log-work

Log work progress to `WORKLOG/YYYYMMDD.md` files.

**How it works:**

- Creates/appends to a daily worklog file
- Each entry has a timestamp and concise topic
- Includes session ID, files created/read, and short description
- Follows progressive disclosure - references detailed docs instead of duplicating

**Example entry:**

```markdown
# 13:45 Added feature xyz

- Session: abc-123
- Created: src/feature.py
- Read: docs/spec.md
- Added new authentication middleware
```

### 3. make-issue-spec

Create task specification documents at `issues/YYYYMMDD-topic.md`.

**How it works:**

- Creates a markdown document describing a specific task
- Includes concise implementation plan
- Claude asks clarifying questions for underspecified parts
- Stages the file in git if permissions allow

## Agents

### ui-tester

A specialized agent for browser-based UI testing and validation using Chrome
DevTools MCP Server.

**When to use:**

- Verify that a new feature renders correctly in the browser
- Check responsive design at different viewport sizes
- Validate CSS changes look correct
- Inspect for console errors or network issues

**How it works:**

- Runs in isolation to prevent context pollution in the main agent
- Uses Chrome DevTools MCP Server for all browser interactions
- Takes screenshots, inspects DOM elements, checks console errors
- Returns structured reports with findings organized by severity

**Capabilities:**

- Navigate to URLs and local dev servers
- Inspect DOM elements and CSS properties
- Capture screenshots at various viewport sizes
- Check for console errors and network issues
- Validate responsive behavior and accessibility

## Installation

No additional dependencies required for skills. The ui-tester agent requires the
Chrome DevTools MCP Server to be configured.
