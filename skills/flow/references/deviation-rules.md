# Flow Deviation Rules

## During Execution

The flow-executor agent follows these deviation rules during plan execution. Deviations are logged in SUMMARY.md.

### Auto-Fix (No Permission Needed)

**Rule 1: Bug Fixes**
If code written during execution has a bug (syntax error, runtime error, failing test), fix it immediately.
- Log: `DEVIATION: Fixed bug — {description}`
- No permission needed because bugs are unambiguously wrong

**Rule 2: Critical Functionality**
If a critical piece of functionality is missing and without it the plan's objective cannot be met, implement it.
- Log: `DEVIATION: Added critical functionality — {description}`
- Examples: missing error handling that would crash, missing validation on user input, missing import

**Rule 3: Blocking Issues**
If an issue blocks plan completion (broken import, missing dependency, incompatible version), resolve it.
- Log: `DEVIATION: Resolved blocking issue — {description}`
- Examples: installing a missing package, fixing a broken path, updating a deprecated API call

### Ask First (Permission Required)

**Rule 4: Architectural Changes**
If the plan requires changes that affect system architecture (new database tables, new services, new API contracts), pause and ask.
- Checkpoint: `DEVIATION REQUEST: Architectural change needed — {description}. Options: A) Proceed, B) Adjust plan, C) Skip this task`
- Examples: adding a new database migration, creating a new microservice, changing API response format

**Rule 5: Scope Expansion**
If completing the plan properly requires work significantly beyond what was planned (3+ additional tasks), pause and ask.
- Checkpoint: `DEVIATION REQUEST: Scope expansion detected — {N} additional tasks needed. Options: A) Proceed with expanded scope, B) Complete minimal version, C) Replan`

## Adaptive Replanning Signals (New)

Beyond deviation rules, the executor monitors for drift signals that indicate the plan itself may be wrong:

### Signal: Assumption Invalidated
- **Trigger:** A core assumption in the plan proves false (e.g., "API supports pagination" but it doesn't)
- **Action:** Pause execution, return `## REPLAN NEEDED: Assumption Invalidated`
- **Resolution:** Orchestrator presents to user with options: replan, adjust, override

### Signal: Repeated Failures
- **Trigger:** Same test or build fails 3+ times after different fix attempts
- **Action:** Pause execution, return `## DEBUG ESCALATION: Repeated failures on {test/build}`
- **Resolution:** Orchestrator offers: switch to `/flow:debug` mode, replan, or continue

### Signal: Missing Dependency
- **Trigger:** A planned dependency (API, service, library) is unavailable
- **Action:** Pause execution, return `## BLOCKER: Missing dependency — {name}`
- **Resolution:** Orchestrator surfaces blocker to user

### Signal: Scope Explosion
- **Trigger:** Task count grows beyond 2x the original plan
- **Action:** Pause execution, return `## REPLAN NEEDED: Scope explosion ({current} vs {planned} tasks)`
- **Resolution:** Orchestrator offers: split into sub-phases, replan, or override

## Deviation Logging in SUMMARY.md

All deviations are recorded in the SUMMARY.md deviations section:

```markdown
## Deviations

| # | Type | Description | Resolution |
|---|---|---|---|
| 1 | Bug Fix | TypeError in auth middleware | Added null check on line 42 |
| 2 | Critical | Missing CSRF protection | Added csrf middleware to all POST routes |
| 3 | Blocker | pg library not installed | Added to package.json, ran npm install |
```
