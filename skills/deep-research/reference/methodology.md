# Deep Research Methodology

Detailed execution guidance for each phase. The SKILL.md defines *what* each phase does; this file defines *how*.

---

## Phase 1: SCOPE

**Goal**: Transform a vague question into a precise research brief.

1. **Decompose the question** into 3-5 sub-questions that, if answered, fully address the original.
2. **Identify the knowledge domain**: Is this technical, scientific, business, policy, cultural? This determines source selection.
3. **Define the output contract**: What format does the user need? (executive summary, technical report, comparison table, recommendation memo)
4. **Set boundaries**: What's explicitly out of scope? Stating this prevents scope creep.
5. **Determine the mode**: Quick (1-2 sub-questions, 5 sources) / Standard (3-5 sub-questions, 10 sources) / Deep (5+ sub-questions, 15+ sources).

**Deliverable**: A research brief with: refined question, sub-questions, scope boundaries, mode, expected output format.

---

## Phase 2: PLAN

**Goal**: Design the search strategy before executing it.

1. **Source mapping**: For each sub-question, list 2-3 source types most likely to have authoritative answers.
   - Academic/technical → WebSearch with site-specific queries, Context7 for library docs
   - Business/market → WebSearch for reports, industry publications
   - Current events → WebSearch with date filters
   - Code/implementation → GitHub search, Context7, library docs
2. **Query design**: Write 2-3 search queries per sub-question, varying terminology.
   - Use synonyms and related terms to avoid search bias
   - Include both broad and narrow queries
3. **Priority ordering**: Research the highest-uncertainty sub-questions first — they may reshape the others.

**Deliverable**: Search plan with queries organized by sub-question.

---

## Phase 3: RETRIEVE

**Goal**: Gather raw evidence from diverse, authoritative sources.

1. **Execute searches** systematically — track what you searched and what you found.
2. **Source diversity**: For each claim, seek sources from different authors, organizations, and perspectives.
3. **Recency check**: Flag any source older than 2 years. Note if the information may be outdated.
4. **Authority check**: Prefer primary sources (original research, official docs) over secondary (blog posts, summaries).
5. **Saturation test**: Stop searching a sub-question when new sources repeat what you already have.
6. **Minimum thresholds by mode**:
   - Quick: 5 sources total, 2+ per key claim
   - Standard: 10 sources total, 3+ per key claim
   - Deep: 15+ sources total, 3+ per key claim, multiple perspectives required

**Deliverable**: Raw evidence organized by sub-question, with source metadata (URL, author, date, authority level).

---

## Phase 4: TRIANGULATE

**Goal**: Cross-reference findings to separate facts from opinions.

1. **Claim extraction**: Pull out discrete factual claims from each source.
2. **Cross-reference**: For each claim, check if 2+ independent sources agree.
3. **Conflict resolution**: When sources disagree, document both positions and assess which is better-supported.
4. **Confidence tagging**: Tag each claim:
   - **High**: 3+ independent sources agree, primary source available
   - **Medium**: 2 sources agree, or 1 authoritative primary source
   - **Low**: Single source, secondary, or sources conflict
5. **Gap identification**: What sub-questions remain unanswered? Do you need another retrieval pass?

**Deliverable**: Triangulated claims table with confidence levels and source citations.

---

## Phase 5: OUTLINE REFINEMENT

**Goal**: Structure findings into a coherent narrative before writing.

1. **Organize by insight**, not by source. Group claims that answer the same sub-question.
2. **Identify the narrative arc**: What's the through-line? (comparison, chronology, problem→solution, trade-off analysis)
3. **Highlight surprises**: What did you find that contradicts conventional wisdom or the user's assumptions?
4. **Plan the evidence flow**: Each section should lead with the finding, then support with evidence.

**Deliverable**: Structured outline with section headings, key claims per section, and source assignments.

---

## Phase 6: SYNTHESIZE

**Goal**: Write the report — 80%+ original prose, not a paste-job of quotes.

1. **Lead with insights**: Each section opens with the key finding, not background context.
2. **Cite inline**: Every factual claim gets a citation. Use numbered references `[1]`, `[2]`.
3. **Synthesize, don't summarize**: Connect findings across sources. Show what the evidence *means*, not just what it says.
4. **Hedge appropriately**: Use confidence language that matches your triangulation tags.
   - High confidence: "Research consistently shows..."
   - Medium confidence: "Evidence suggests..."
   - Low confidence: "One study found... though this hasn't been widely replicated."
5. **Tables and comparisons**: Use structured formats when comparing options, features, or trade-offs.

**Deliverable**: Draft report with inline citations and reference list.

---

## Phase 7: CRITIQUE

**Goal**: Stress-test your own work before delivering it.

1. **Completeness check**: Does every sub-question have a clear answer? Are there gaps?
2. **Bias scan**: Did you over-rely on one source type, perspective, or time period?
3. **Logic check**: Do conclusions follow from evidence? Are there unsupported leaps?
4. **Counter-argument**: What's the strongest objection to your main conclusion? Address it.
5. **Recency and relevance**: Is anything potentially outdated or irrelevant to the user's context?

**Deliverable**: Self-critique notes with issues to address in refinement.

---

## Phase 8: REFINE + PACKAGE

**Goal**: Polish and deliver.

1. **Address critique findings**: Fill gaps, add counter-arguments, fix logic issues.
2. **Executive summary**: Write a 3-5 sentence summary that a busy executive could act on.
3. **Key findings**: Bullet list of the 3-5 most important discoveries.
4. **Confidence statement**: Overall assessment of how confident you are in the findings and why.
5. **References**: Full list with URLs, authors, dates. Verify links are real.
6. **Suggested next steps**: What should the user do with this information? What follow-up research would deepen understanding?

**Deliverable**: Final report matching the output contract defined in SCOPE.
