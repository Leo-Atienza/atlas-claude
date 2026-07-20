---
name: codebase-knowledge-graph
description: "Build queryable knowledge graphs from codebases using AST parsing + semantic extraction. 71.5x token reduction vs raw file reading. Use when: onboarding to a new codebase, mapping architecture, tracing dependencies, or user says 'graph this', 'map the codebase', 'show dependencies'. Integrates with Flow map/discover phases."
---

# Codebase Knowledge Graph

Build persistent, queryable knowledge graphs from code repositories. Two-pass processing (deterministic AST + semantic extraction) produces graph structures that replace expensive file-by-file reading.

## Prerequisites

```bash
pip install graphifyy && graphify install
```

## When to Use

- Onboarding to a large/unfamiliar codebase
- Mapping architecture before a refactor
- Tracing dependency chains across modules
- Understanding code communities and clusters
- Pre-loading context for Flow `/flow:map` or `/flow:discover`

## Two-Pass Processing

### Pass 1: Deterministic AST (Local, Zero LLM Cost)
Tree-sitter extracts structural facts from code files:
- Classes, functions, imports, call graphs, docstrings
- Inheritance and implementation relationships
- Module boundaries and export surfaces

**Supported:** .py, .ts, .js, .go, .rs, .java, .c, .cpp, .rb, .cs, .kt, .scala, .php

### Pass 2: Semantic Extraction (LLM-Assisted)
For non-code files (docs, papers, images):
- Concept and relationship identification
- Design rationale extraction (NOTE:, HACK:, WHY: comments)
- Citation mining from papers

**Supported:** .md, .txt, .rst, .pdf, .png, .jpg, .webp, .gif

## Confidence-Scored Relationships

Every edge in the graph gets one of three tags:

| Tag | Meaning | Confidence |
|-----|---------|------------|
| `EXTRACTED` | Found directly in source code (import, call, inheritance) | 1.0 |
| `INFERRED` | Reasonable deduction from patterns | 0.0–1.0 |
| `AMBIGUOUS` | Flagged for human review | N/A |

## Core Commands

```bash
graphify build [path]              # Build graph from directory
graphify build --update            # Incremental (changed files only)
graphify query "question"          # Traverse graph for answer
graphify path "NodeA" "NodeB"      # Trace connection between nodes
graphify explain "Node"            # Detailed node explanation
graphify export --format graphml   # Export for Gephi/yEd
graphify export --format obsidian  # Generate Obsidian vault
```

## Output Artifacts

| File | Purpose |
|------|---------|
| `graph.json` | Persistent queryable graph (reload across sessions) |
| `graph.html` | Interactive visualization (click-through nodes, community filter) |
| `GRAPH_REPORT.md` | Summary: god nodes, surprising connections, suggested questions |
| `cache/` | SHA256-indexed cache for incremental updates |

## Integration with Flow

### With `/flow:map`
Before mapping, build the graph. The GRAPH_REPORT.md provides a structural overview that guides where to focus mapping agents.

### With `/flow:discover`
Use `graphify query` to answer discovery questions with graph traversal instead of expensive file reads. 71.5x token reduction on large codebases.

### Always-On Mode (Optional)
Install a PreToolUse hook that surfaces GRAPH_REPORT.md before file search operations:
```bash
graphify claude install  # Adds hook to settings.json
```

## Performance Characteristics

| Corpus Size | Token Reduction | Build Time |
|-------------|-----------------|------------|
| 50+ files (mixed code + docs) | ~71.5x | Minutes |
| 6 files (single library) | ~1x | Seconds |
| Incremental update | N/A | <2s |

Token savings compound on subsequent queries — the graph avoids re-reading raw content.

## Graph Topology Clustering

Uses Leiden community detection (no embeddings needed) to cluster related code:
- Identifies natural module boundaries
- Surfaces unexpected cross-module dependencies
- Generates architecture diagrams from structure, not annotations

## When NOT to Use

- Single-file tasks (overhead exceeds benefit)
- Already familiar with the codebase
- Quick lookups (use Grep/Glob instead)
- Context Mode MCP already indexed the project (use that for text search)
