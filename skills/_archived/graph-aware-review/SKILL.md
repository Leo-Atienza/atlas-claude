---
name: graph-aware-review
description: "Token-efficient code review using structural graph analysis and blast-radius computation. 8.2x average token reduction by reviewing only affected files instead of entire codebase. Use when: reviewing PRs, analyzing change impact, pre-merge checks, or user says 'review this PR', 'what does this change affect', 'blast radius'. Enhances CE-005 Code Review."
---

# Graph-Aware Code Review

Enhance code review with structural dependency analysis. Instead of reading the entire codebase, compute the minimal set of affected files through blast-radius analysis.

## Prerequisites

```bash
pip install code-review-graph
code-review-graph install --platform claude
code-review-graph build  # Initial graph construction
```

## Core Concept: Blast-Radius Analysis

Given a set of changed files, trace the dependency graph to find:
1. **Direct dependents** — files that import/call changed code
2. **Transitive dependents** — files affected through dependency chains
3. **Test coverage** — which tests exercise the changed code
4. **Unaffected files** — everything else (skip these entirely)

**Result:** In a 2,900-file project, typically ~15 files need review instead of scanning the full codebase.

## Workflow

### 1. Build/Update Graph
```bash
code-review-graph build          # First time
code-review-graph build --update # Incremental (SHA256 change detection, <2s)
```

### 2. Compute Impact
Before any code review, compute the blast radius:
```
What changed? → Which files depend on changes? → Review only those files
```

### 3. Review with Context
For each affected file, the graph provides:
- Why it's affected (which dependency chain)
- What functions/classes are impacted
- Related test files that should pass

### 4. Architecture Overview
Use community detection to understand module boundaries and flag cross-module changes that need extra scrutiny.

## Integration with CE-005 Code Review

When reviewing code (local changes or PRs), prepend blast-radius analysis:

**Before (standard review):**
1. Read all changed files
2. Review each file
3. Check for issues

**After (graph-aware review):**
1. Compute blast radius of changes
2. Read changed files + affected dependents (minimal set)
3. Review with dependency context
4. Flag cross-module impacts
5. Verify test coverage for affected paths

## MCP Tools (when installed as MCP server)

| Tool | Purpose |
|------|---------|
| `build_or_update_graph` | Construct/refresh the structural graph |
| `get_impact_radius` | Compute blast radius for changed files |
| `get_review_context` | Token-optimized review summaries |
| `query_graph` | Structural queries (callers, callees, tests) |
| `semantic_search_nodes` | Find entities by name/meaning |
| `detect_changes` | Risk-scored impact analysis |
| `get_architecture_overview` | Community-based architecture maps |

## Performance

| Metric | Value |
|--------|-------|
| Token reduction | 8.2x average (range 0.7x–16.4x) |
| Impact recall | 100% (never misses affected files) |
| Build latency | 95–128ms flow detection |
| Search latency | 0.4–1.5ms |
| Incremental update | <2s for 2,900-file projects |

**Note:** Single-file changes in small packages may show <1x efficiency (structural metadata overhead). Benefits compound on multi-file changes in larger codebases.

## Language Support

19 languages + Jupyter notebooks:
- **Web:** TypeScript/TSX, JavaScript, Vue
- **Backend:** Python, Go, Java, Scala, Rust, PHP
- **Mobile:** Kotlin, Swift, Dart
- **Systems:** C/C++, Ruby
- **Other:** R, Perl, Lua, Solidity

## When to Use vs Standard Review

| Scenario | Use Graph-Aware? |
|----------|-----------------|
| PR in a large codebase (100+ files) | Yes — massive token savings |
| Multi-file refactor | Yes — dependency tracing essential |
| Single-file bug fix in small repo | No — overhead exceeds benefit |
| Architecture review | Yes — community detection helps |
| Security-sensitive changes | Yes — blast radius reveals attack surface |

## Auto-Update Hooks

Keep the graph fresh with git hooks:
```bash
code-review-graph hook install  # Adds post-commit and post-checkout hooks
```

File-save hooks trigger incremental updates, ensuring the graph reflects current code state.
