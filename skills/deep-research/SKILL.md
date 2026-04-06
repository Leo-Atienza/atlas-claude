---
name: deep-research
description: "Conducts enterprise-grade research with multi-source synthesis, citation tracking, and verification. Produces citation-backed reports through a structured pipeline with source credibility scoring. Triggers on 'deep research', 'comprehensive analysis', 'research report', 'compare X vs Y', 'analyze trends', or 'state of the art'. Not for simple lookups, debugging, or questions answerable with 1-2 searches."
---

# Deep Research

## Core Purpose

Deliver citation-backed, verified research reports through a structured pipeline with source credibility scoring, evidence persistence, and progressive context management.

**Autonomy Principle:** Operate independently. Infer assumptions from context. Only stop for critical errors or incomprehensible queries.

---

## Decision Tree

```
Request Analysis
+-- Simple lookup? --> STOP: Use WebSearch
+-- Debugging? --> STOP: Use standard tools
+-- Complex analysis needed? --> CONTINUE

Mode Selection
+-- Initial exploration --> quick (3 phases, 2-5 min)
+-- Standard research --> standard (6 phases, 5-10 min) [DEFAULT]
+-- Critical decision --> deep (8 phases, 10-20 min)
```

**Default assumptions:** Technical query = technical audience. Comparison = balanced perspective. Trend = recent 1-2 years.

---

## Workflow Overview

| Phase | Name | Quick | Standard | Deep |
|-------|------|-------|----------|------|
| 1 | SCOPE | Y | Y | Y |
| 2 | PLAN | - | Y | Y |
| 3 | RETRIEVE | Y | Y | Y |
| 4 | TRIANGULATE | - | Y | Y |
| 4.5 | OUTLINE REFINEMENT | - | Y | Y |
| 5 | SYNTHESIZE | - | Y | Y |
| 6 | CRITIQUE | - | - | Y |
| 7 | REFINE | - | - | Y |
| 8 | PACKAGE | Y | Y | Y |

---

## Phase Details

### Phase 1: SCOPE
Define the research question precisely. Identify: core question, sub-questions (3-5), key terms, scope boundaries (what's in/out), target audience, and expected output format.

### Phase 2: PLAN (Standard+)
Create a search strategy: 5-10 parallel search queries, 2-3 focused sub-areas. Identify authoritative source types (academic papers, official docs, industry reports, expert blogs). Plan for coverage across multiple perspectives.

### Phase 3: RETRIEVE
Execute searches using the **Source Hierarchy Cascade** — check sources in priority order, stop at the first tier that answers the question:

| Priority | Source | Cost | When to use |
|----------|--------|------|-------------|
| 1 | Local files (Grep + Read) | Zero | Always check first |
| 2 | WebSearch snippets | Minimal | When local insufficient |
| 3 | WebFetch (full page) | Moderate | When snippets ambiguous |
| 4 | Context7 / Scholar | Higher | Academic/framework docs |

**Token Budget per sub-question:** max 5 WebSearch + 3 WebFetch calls. If budget exhausted without answer, flag as under-sourced rather than speculating.

For each source: capture URL, title, date, author/org, key findings, and relevance score (1-5). **Target: 10+ unique sources minimum.**

### Phase 4: TRIANGULATE (Standard+)
Cross-reference claims across sources. For each major claim, require 3+ independent sources.

**Citation Discipline** — every factual claim must be grounded:
- Direct quote from source before any synthesis or analysis
- Tag each assertion with confidence: `[VERIFIED]` (3+ sources agree), `[SUPPORTED]` (1-2 sources), `[INFERRED]` (logical deduction, no direct source)
- If a claim cannot be grounded: state "I don't know" or "insufficient evidence" — never speculate

**Credibility scoring per source:** authority (domain expertise), recency, methodology transparency, potential bias.
**Flag:** conflicting evidence (note both sides), single-source claims (mark `[SUPPORTED]`), outdated info (>2 years for fast-moving topics).

### Phase 4.5: OUTLINE REFINEMENT (Standard+)
Revisit the outline based on what was actually found. Adjust sections, reorder for narrative flow, identify gaps requiring additional retrieval. This prevents the common failure of forcing findings into a pre-determined structure.

### Phase 5: SYNTHESIZE (Standard+)
Write findings as prose (minimum 80% prose, bullets sparingly). Each major claim gets an inline citation [N]. Group findings into 4-8 thematic sections, each 600-2,000 words. Draw connections between sources. Identify patterns, contradictions, and implications.

### Phase 6: CRITIQUE (Deep only)
Apply three reviewer personas:
- **Skeptical Practitioner**: "Would this advice work in production?"
- **Adversarial Reviewer**: "What evidence would disprove this?"
- **Implementation Engineer**: "Can someone act on these recommendations?"
Flag gaps, weak claims, and missing perspectives. If gaps found, loop back to RETRIEVE for additional sources.

### Phase 7: REFINE (Deep only)
Address critique findings. Strengthen weak sections, add nuance, improve recommendations. Ensure all claims have adequate citation support.

### Phase 8: PACKAGE
Assemble the final report. Run the 9-point validation checklist (see reference/quality-gates.md).

---

## Output Contract

**Required sections:**
- Executive Summary (200-400 words)
- Introduction (scope, methodology, assumptions)
- Main Analysis (4-8 findings, 600-2,000 words each, cited)
- Synthesis & Insights (patterns, implications)
- Limitations & Caveats
- Recommendations
- Bibliography (COMPLETE — every citation, no placeholders)
- Methodology Appendix

**Output files (all to project directory or `~/Documents/[Topic]_Research_[YYYYMMDD]/`):**
- Markdown (primary source)
- HTML (McKinsey-style layout, if requested)
- PDF (professional print, if WeasyPrint available)

**Quality standards:**
- 10+ sources, 3+ per major claim
- All claims cited immediately [N]
- No placeholders, no fabricated citations
- Prose-first (>=80%), bullets sparingly
- **Grounding rule:** Every assertion tagged `[VERIFIED]`, `[SUPPORTED]`, or `[INFERRED]`
- **Epistemic honesty:** "I don't know" or "insufficient evidence" when sources unavailable — never speculate
- **Source cascade:** Local → WebSearch → WebFetch → Scholar (stop at first sufficient tier)
- **Budget:** max 5 WebSearch + 3 WebFetch per research query

---

## Reference Files

Load on-demand as needed:
- [methodology.md](reference/methodology.md) — Detailed phase execution instructions
- [quality-gates.md](reference/quality-gates.md) — 9-point validation checklist per mode
- [report-assembly.md](reference/report-assembly.md) — Progressive generation strategy for long reports

---

## When to Use / NOT Use

**Use:** Comprehensive analysis, technology comparisons, state-of-the-art reviews, multi-perspective investigation, market analysis, architecture decision records.

**Do NOT use:** Simple lookups, debugging, 1-2 search answers, quick time-sensitive queries, questions about the current codebase.
