---
name: codebase-knowledge-graph
description: "Router skill for graph-based codebase/corpus queries. Picks the right tool: code-review-graph (CRG, MCP-native, Tree-sitter, 23 langs, auto-update) for code structure; graphify for mixed corpora (docs + papers + images + tweets). Use when: onboarding, mapping architecture, tracing dependencies, blast-radius analysis, user says 'graph this', 'map the codebase', 'show dependencies'."
---

# Codebase Knowledge Graph (Router)

Two graph tools live in this system. They are **complementary, not redundant** — this skill routes tasks to the right one.

## Decision tree

```
Is the corpus code-only (Python, TS, Go, Rust, Java, etc.)?
├── YES → code-review-graph (CRG) — MCP-native, Tree-sitter, 23 langs
└── NO (docs + papers + images + tweets, or research corpus)?
    └── graphify — LLM-assisted semantic extraction

Already have .code-review-graph/graph.db?       → CRG (query via MCP)
Already have graphify-out/graph.json?            → graphify (query via CLI)
```

---

## Tool A — `code-review-graph` (primary for code)

MCP-native. Tree-sitter. 22 tools. Auto-updates on Write/Edit. Registered at user scope via `claude mcp add -s user code-review-graph uvx code-review-graph serve` (stored in `~/.claude.json`).

### When to use
- Onboarding to a codebase (Python, TS, TSX, Go, Rust, Java, Scala, C#, Ruby, Kotlin, Swift, PHP, Solidity, C/C++, Dart, R, Perl, Lua, Zig, PowerShell, Julia, Vue, Svelte, Jupyter `.ipynb`)
- Mapping architecture before a refactor
- Blast-radius analysis: "what breaks if I change `login()`?"
- Risk-scored PR/commit review
- Finding hub nodes, bridges, surprise couplings
- Pre-loading context for Flow `/flow:map` or `/flow:discover`

### Core usage via MCP tools
| Task | Tool |
|---|---|
| "Give me just enough context to start" | `get_minimal_context(task="...")` — ~100 tokens |
| "What calls this function?" | `query_graph(pattern="callers_of", node="...")` |
| "What does this call?" | `query_graph(pattern="callees_of", node="...")` |
| "What's affected if I change X?" | `get_impact_radius(node="...")` |
| "Find classes/functions by name" | `semantic_search_nodes_tool(query="...")` |
| "Full review context for a PR" | `get_review_context(diff="...")` |
| "Architecture overview" | prompt: `architecture_map` |
| "Pre-merge check" | prompt: `pre_merge_check` |

Follow the `next_tool_suggestions` field in every response — it's the optimal next step.

### CLI (when MCP isn't available)
```bash
uvx code-review-graph build           # parse codebase (~10s for 500 files)
uvx code-review-graph update          # incremental (~2s, auto via hook)
uvx code-review-graph status          # graph stats
uvx code-review-graph detect-changes  # risk-scored diff impact
uvx code-review-graph visualize       # D3.js HTML graph
uvx code-review-graph wiki            # export Obsidian vault
uvx code-review-graph register <path> # multi-repo registry
```

### Auto-update
PostToolUse hook fires `code-review-graph update` on Write/Edit/MultiEdit if `.code-review-graph/graph.db` exists. No manual updates needed.

### Output
- `.code-review-graph/graph.db` — SQLite WAL store
- Via `visualize`: interactive D3.js HTML
- Via `wiki`: Obsidian vault with wikilinks
- Via exports: GraphML (Gephi/yEd), Neo4j Cypher, SVG

---

## Tool B — `graphify` (for mixed corpora)

LLM-assisted semantic extraction. Handles docs, papers, images, tweets, code together.

### When to use
- Research corpus (PDFs + tweets + screenshots + notes)
- Karpathy-style `/raw` folder workflow
- Cross-document concept mining
- Any corpus where LLM vision/semantic matters (e.g. chart images, handwritten notes)
- Code corpora where you want `INFERRED`/`AMBIGUOUS` edge tagging and Q&A memory loop

### Core usage (slash command)
```
/graphify                     # current dir → Obsidian vault
/graphify <path>              # specific path
/graphify <path> --update     # incremental
/graphify query "<question>"  # BFS traversal
/graphify path "A" "B"        # shortest path
/graphify explain "Node"      # node explanation
/graphify --mcp               # MCP stdio server
```

### Output
- `graphify-out/graph.json` — persistent graph
- `graphify-out/GRAPH_REPORT.md` — god nodes, surprises, suggested questions
- `graphify-out/graph.html` — interactive viz
- Optional: Obsidian vault, SVG, GraphML, Neo4j push

---

## Confidence-Scored Relationships (graphify only)

| Tag | Meaning | Confidence |
|-----|---------|------------|
| `EXTRACTED` | Found directly in source (import, call, inheritance, citation) | 1.0 |
| `INFERRED` | Reasonable deduction from patterns | 0.4–0.9 |
| `AMBIGUOUS` | Flagged for human review | 0.1–0.3 |

CRG uses a simpler three-tier edge confidence (EXTRACTED / INFERRED / AMBIGUOUS) plus float scores.

---

## Integration with Flow

### With `/flow:map`
For code-heavy repos, build CRG first → use `get_minimal_context` to guide mapping agents.
For mixed corpora, build graphify first → `GRAPH_REPORT.md` guides mapping.

### With `/flow:discover`
Prefer CRG MCP tools for code queries (no LLM extraction cost, auto-updates).
Use graphify for discovery questions that span docs + code + research notes.

---

## When NOT to use graph tools

- Single-file tasks (overhead exceeds benefit)
- Already familiar with the codebase
- Quick lookups where Grep/Glob is faster

---

## Performance

| Tool | Corpus | Reduction | Build time |
|------|--------|-----------|------------|
| CRG | Code-only, 500 files | 8.2× avg, up to 49× monorepo | ~10s |
| CRG | Incremental (auto) | N/A | <2s |
| graphify | Mixed, 50+ files | ~71.5× | Minutes (LLM) |
| graphify | Incremental | N/A | <2s code, minutes docs |

---

## Retired: `graphify install` prerequisite

Previous versions of this skill required `pip install graphifyy && graphify install` as prereq. Now:
- `graphifyy` is already installed (pip).
- `code-review-graph` is installed via `uv tool install code-review-graph`.
- CRG is registered at user scope via `claude mcp add -s user code-review-graph uvx code-review-graph serve` (writes to `~/.claude.json` — the authoritative MCP registry). Graphify is invoked as a CLI (`python -m graphify`) rather than a persistent MCP server.
- No `graphify install` or `code-review-graph install` needed — ATLAS wires them manually to preserve settings harmony. Do NOT use `code-review-graph install` (it injects its own skills/hooks/CLAUDE.md text and clobbers the ATLAS layout).
