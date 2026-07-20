# Report Assembly

Strategy for generating research reports progressively, managing length and quality across different output sizes.

---

## Progressive Generation Strategy

Long reports can't be written in a single pass — they need structured assembly.

### Step 1: Build the Skeleton

Before writing any prose, create the full document structure:

```
# [Title]

## Executive Summary
[placeholder — write LAST]

## Key Findings
[placeholder — write after all sections]

## [Section 1: Sub-question 1]
### [Sub-section if needed]

## [Section 2: Sub-question 2]
...

## Limitations
[placeholder — write during CRITIQUE]

## Recommendations
[placeholder — write during REFINE]

## References
[build incrementally during SYNTHESIZE]
```

### Step 2: Fill Sections Bottom-Up

1. Write body sections first (the evidence-heavy parts)
2. Then write Limitations and Recommendations (require full picture)
3. Then write Key Findings (distill from body)
4. Write Executive Summary last (requires everything else to be done)

**Why bottom-up**: Top-level summaries need to accurately reflect the body. Writing them first creates a commitment bias that distorts the evidence sections.

### Step 3: Cross-Reference Pass

After all sections are filled:
- Verify that Key Findings accurately summarize body content
- Verify that Executive Summary captures the Key Findings
- Check that recommendations follow from findings (no unsupported leaps)
- Ensure reference numbers are sequential and all cited

---

## Section Writing Patterns

### Evidence Section Pattern
```
[Finding statement — what the evidence shows]

[Evidence 1 with citation] [1]. [Evidence 2 with citation] [2].
[Synthesis — what this means when combined].

[Nuance or caveat if applicable].
```

### Comparison Section Pattern
```
[Context — what's being compared and why]

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| ...       | ...      | ...      | ...      |

[Analysis — which option wins under what conditions]
[Trade-off summary]
```

### Chronology Section Pattern
```
[Overview — what changed and why it matters]

**[Period 1]**: [What happened] [citation].
**[Period 2]**: [What changed] [citation].
**[Current state]**: [Where things stand] [citation].

[Trajectory — where this is heading based on the evidence]
```

---

## Length Management by Mode

### Quick Mode (500-1500 words)
- Skip section headers for reports under 800 words — use bold lead-ins instead
- Executive summary = first paragraph (no separate section)
- Key findings = 3 bullet points max
- References inline or as a short list at the end
- No Limitations section (mention caveats inline)

### Standard Mode (1500-4000 words)
- Full section headers
- Executive summary = 3-5 sentences in its own section
- Key findings = 3-5 bullet points
- Body = 2-4 sections (one per major sub-question)
- Limitations = 1 paragraph
- References = numbered list

### Deep Mode (4000-10000 words)
- Hierarchical headers (##, ###)
- Executive summary = 1 paragraph + key findings bullets
- Body = 4-8 sections with sub-sections as needed
- Comparison tables where applicable
- Limitations = dedicated section with specific scope boundaries
- Methodology note = brief section explaining search strategy
- References = full numbered list with author, date, URL
- Appendices for supplementary data if needed

---

## Citation Format

Use numbered inline citations throughout. Build the reference list as you write.

**Inline**: `According to recent analysis [1], the market shifted...`

**Reference list entry**:
```
[1] Author/Org. "Title." Source, Date. URL
```

If author is unknown: `[1] "Title." Source, Date. URL`
If date is unknown: `[1] Author. "Title." Source. URL`

**Rules**:
- Sequential numbering (don't skip numbers)
- First citation of a source gets the number; reuse the same number for subsequent citations
- Group multiple citations: `[1][3][7]` not `[1, 3, 7]`
- Every reference in the list must be cited at least once in the body
- Every citation in the body must appear in the reference list

---

## Quality Signals in the Final Report

A well-assembled report should exhibit:

1. **Pyramid structure**: Most important information first, details deeper
2. **Scannable**: A reader skimming headers and bold text gets the key message
3. **Evidence density**: Every paragraph has at least one citation
4. **Balanced perspective**: Counter-arguments and limitations acknowledged
5. **Actionable ending**: Clear recommendations or next steps
6. **No orphan sections**: Every section connects to the research question
7. **Consistent voice**: Same level of formality throughout
