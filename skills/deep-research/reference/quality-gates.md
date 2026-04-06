# Quality Gates

Validation criteria that must be met before delivering research output. Check these at the CRITIQUE phase — if any gate fails, loop back to fix before packaging.

---

## Universal Gates (All Modes)

These 9 checks apply regardless of research mode:

| # | Gate | Check | Fail Action |
|---|------|-------|-------------|
| 1 | **Source minimum** | Met the mode's source count threshold? | Return to RETRIEVE |
| 2 | **Citation coverage** | Every factual claim has ≥1 citation? | Add citations or remove unsupported claims |
| 3 | **No hallucinated sources** | Every cited URL/paper actually exists? | Verify all references, remove fabricated ones |
| 4 | **Sub-question coverage** | Every SCOPE sub-question addressed? | Return to RETRIEVE for gaps |
| 5 | **Recency check** | Sources within 2 years for time-sensitive topics? | Flag outdated info or find newer sources |
| 6 | **Source diversity** | No single source accounts for >40% of claims? | Diversify with additional sources |
| 7 | **Conflict transparency** | Disagreements between sources noted? | Add conflicting viewpoints |
| 8 | **Confidence honesty** | Low-confidence claims hedged appropriately? | Adjust language to match evidence strength |
| 9 | **Output format match** | Deliverable matches SCOPE output contract? | Restructure to match agreed format |

---

## Mode-Specific Thresholds

### Quick Mode
| Criterion | Threshold |
|-----------|-----------|
| Sources | ≥5 |
| Citations per key claim | ≥2 |
| Sub-questions | 1-2 |
| Report length | 500-1500 words |
| Time budget | Single retrieval pass |
| Triangulation | Optional — note when claims are single-sourced |

**Quick mode relaxations**: Conflict resolution can be brief. Counter-arguments encouraged but not required. Source diversity check relaxed to "no single source >60%."

### Standard Mode
| Criterion | Threshold |
|-----------|-----------|
| Sources | ≥10 |
| Citations per key claim | ≥3 |
| Sub-questions | 3-5 |
| Report length | 1500-4000 words |
| Time budget | 2-3 retrieval passes allowed |
| Triangulation | Required for all key claims |

**Standard mode requirements**: All 9 universal gates enforced strictly. Counter-arguments required for main conclusion. Executive summary mandatory.

### Deep Mode
| Criterion | Threshold |
|-----------|-----------|
| Sources | ≥15 |
| Citations per key claim | ≥3 from independent sources |
| Sub-questions | 5+ |
| Report length | 4000-10000 words |
| Time budget | Multiple retrieval passes, iterative refinement |
| Triangulation | Required, with confidence tags on every claim |

**Deep mode additions**: Source authority assessment required (primary vs secondary). Methodology transparency (explain how you searched and what you didn't find). Limitations section mandatory. Suggested follow-up research required.

---

## Gate Failure Protocol

When a gate fails during CRITIQUE:

1. **Identify the gap** — which specific claims, sections, or sub-questions are affected?
2. **Determine severity**:
   - **Blocking**: Gates 1-4 (source minimum, citation coverage, no hallucination, sub-question coverage) — must fix before delivery
   - **Important**: Gates 5-7 (recency, diversity, conflicts) — fix if possible, disclose if not
   - **Advisory**: Gates 8-9 (confidence language, format) — fix during REFINE
3. **Loop back** to the appropriate phase (usually RETRIEVE or SYNTHESIZE)
4. **Re-check** the failed gate after fixing

---

## Anti-Patterns to Catch

- **Source padding**: Citing 10 sources but 8 are from the same publisher → fails Gate 6
- **Recency bias**: Only using sources from the last 6 months when historical context matters → rebalance
- **Confirmation bias**: All sources support one view, no dissenting perspectives explored → fails Gate 7
- **Authority laundering**: Blog post cites a study, you cite the blog post instead of the study → use primary source
- **Quantity theater**: Meeting source count by adding low-relevance sources → quality over quantity
