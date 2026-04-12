# /audit — Systematic codebase audit with wave-based fixes

Execute automatically when asked to audit. Present findings before fixing.

---

## Step 1 — Scan (parallel agents)

Launch up to 4 sub-agents simultaneously using the Agent tool. Each agent scans the codebase for one domain:

### Agent 1: Orphaned References & Dead Code
- Find imports/requires/paths pointing to non-existent files
- Find exported functions, components, types never imported anywhere
- Check config files (CLAUDE.md, skill directories) for dead references
- Report: `{ file, line, issue, type: "orphaned_ref" | "dead_export" }`

### Agent 2: Bugs & Type Issues
- Find potential bugs: unchecked nulls, missing error handling, logic errors
- Run `npx tsc --noEmit` if TypeScript project — collect type errors
- Check for hardcoded values that should be env vars
- Report: `{ file, line, issue, type: "bug" | "type_error" | "hardcoded" }`

### Agent 3: Version Mismatches & Stale Comments
- Find version number disagreements between files (package.json, manifests, changelogs)
- Find TODO/FIXME/HACK/XXX comments; cross-reference git log to check if resolved
- Report: `{ file, line, issue, type: "version_mismatch" | "stale_comment" }`

### Agent 4: Documentation Drift & Missing Error Handling
- Compare README/docs claims against actual code behavior
- Find async operations without try/catch or .catch()
- Find API routes without input validation
- Report: `{ file, line, issue, type: "doc_drift" | "missing_error_handling" }`

## Step 2 — Deduplicate, categorize, and present

Merge all agent findings into a unified table. Assign severity:
- **P0 (Critical)**: Bugs, security issues, broken references that cause runtime errors
- **P1 (High)**: Type errors, missing error handling, hardcoded secrets
- **P2 (Medium)**: Version mismatches, documentation drift, dead exports
- **P3 (Low)**: Stale comments, minor dead code, style issues

```
| # | Severity | Category            | File:Line         | Issue                          |
|---|----------|---------------------|-------------------|--------------------------------|
| 1 | P0       | Bug                 | api/scrape.ts:42  | Unchecked null from DB query   |
| 2 | P1       | Missing error handling | lib/fetch.ts:18 | async without try/catch      |
| 3 | P2       | Dead export         | utils.ts:15       | formatDate never imported      |
```

## Step 3 — Wait for approval

Present the table. Do NOT fix anything yet. Ask:
> "Found [N] issues ([P0 count] critical, [P1 count] high, [P2 count] medium, [P3 count] low). Which categories or specific items should I fix?"

## Step 4 — Fix in waves

Group approved fixes into waves of ~5 items, ordered by severity (P0 first). For each wave:

1. Apply the batch of fixes
2. Run full build + tests
3. Report results:
   ```
   Wave [N]: Fixed [count] items. Build: [pass/fail]. Tests: [pass]/[total].
   Remaining: [count] items.
   ```
4. **Only proceed to next wave if build + tests pass.** If something breaks, diagnose and fix before continuing.

## Step 5 — Final summary

```
Audit complete.
| Category               | Found | Fixed | Remaining |
|------------------------|-------|-------|-----------|
| Bugs                   | X     | Y     | Z         |
| Type errors            | X     | Y     | Z         |
| Orphaned refs          | X     | Y     | Z         |
| Dead exports           | X     | Y     | Z         |
| Missing error handling | X     | Y     | Z         |
| Version mismatches     | X     | Y     | Z         |
| Documentation drift    | X     | Y     | Z         |
| Stale comments         | X     | Y     | Z         |

Build: [pass/fail] | Tests: [pass]/[total]
```

---

**Plain English triggers**: "audit the system", "run an audit", "find dead code",
"check for stale references", "system health check", "cleanup scan", "codebase audit"
