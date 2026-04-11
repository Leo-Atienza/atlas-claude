# /parallel-audit — Parallel system audit with sub-agents

Run a comprehensive system audit using parallel sub-agents. Execute automatically when asked to audit.

---

## Step 1 — Spawn parallel audit agents

Launch 4 sub-agents simultaneously using the Agent tool. Each agent scans the codebase for one domain:

### Agent 1: Orphaned References
- Find every import/require/path that points to a non-existent file
- Check CLAUDE.md, skill directories, knowledge directories for dead references
- Report: `{ file, line, reference, status: "missing" }`

### Agent 2: Version Mismatches
- Find every file referencing a version number (package.json, CLAUDE.md, manifests, changelogs)
- Flag any disagreements between files
- Report: `{ files[], expected_version, actual_versions[] }`

### Agent 3: Dead Exports
- Find exported functions, components, types, and constants
- Check if each export is imported/used anywhere else in the codebase
- Report: `{ file, export_name, type, used: false }`

### Agent 4: Stale Comments
- Find TODO, FIXME, HACK, XXX comments
- Cross-reference with git log to determine if the referenced work is already done
- Report: `{ file, line, comment, likely_resolved: true/false }`

## Step 2 — Deduplicate and present

Merge all agent findings into a unified table:

```
| Category          | File              | Issue                        | Severity |
|-------------------|-------------------|------------------------------|----------|
| Orphaned ref      | CLAUDE.md:42      | References deleted skill     | High     |
| Version mismatch  | package.json vs X | 6.2.0 vs 6.3.0              | Medium   |
| Dead export       | utils.ts:15       | formatDate never imported    | Low      |
| Stale TODO        | scraper.ts:88     | TODO: add retry (done in #42)| Low      |
```

## Step 3 — Wait for approval

Present the table. Do NOT fix anything yet. Ask: "Which categories or specific items should I fix?"

## Step 4 — Fix approved items

Fix items in batches by category. After each batch:
1. Run smoke tests / build
2. Report what was fixed
3. Continue to next batch

## Step 5 — Final summary

```
Audit complete.
| Category          | Found | Fixed | Remaining |
|-------------------|-------|-------|-----------|
| Orphaned refs     | X     | Y     | Z         |
| Version mismatch  | X     | Y     | Z         |
| Dead exports      | X     | Y     | Z         |
| Stale comments    | X     | Y     | Z         |
```

---

**Plain English triggers**: "audit the system", "run an audit", "find dead code",
"check for stale references", "system health check", "cleanup scan"
