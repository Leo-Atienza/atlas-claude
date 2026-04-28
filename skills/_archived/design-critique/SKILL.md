---
name: design-critique
description: "Evaluate design from a UX perspective — visual hierarchy, information architecture, emotional resonance, cognitive load, and overall quality with quantitative scoring, persona-based testing, and actionable feedback. Use when the user asks to review, critique, evaluate, or give feedback on a design or component."
---

## Preparation

Load the `frontend-design` skill (SK-005) — it contains design principles and anti-patterns this critique evaluates against.

---

Conduct a holistic design critique, evaluating whether the interface actually works — not just technically, but as a designed experience. Think like a design director giving feedback.

## Phase 1: Design Critique

Evaluate the interface across these dimensions:

### 1. AI Slop Detection (CRITICAL)

**This is the most important check.** Does this look like every other AI-generated interface from 2024-2025?

Review against ALL **DON'T** guidelines in the frontend-design skill. Check for: AI color palette, gradient text, dark mode with glowing accents, glassmorphism, hero metric layouts, identical card grids, generic fonts.

**The test**: If you showed this to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

### 2. Visual Hierarchy
- Does the eye flow to the most important element first?
- Is there a clear primary action? Can you spot it in 2 seconds?
- Is there visual competition between elements that should have different weights?

### 3. Information Architecture & Cognitive Load
> *Consult [cognitive-load](reference/cognitive-load.md) for the working memory rule and 8-item checklist*
- Is the structure intuitive? Count visible options at each decision point — if >4, flag it.
- **Run the 8-item cognitive load checklist** from the reference. Report failure count: 0-1 = low (good), 2-3 = moderate, 4+ = critical.

### 4. Emotional Journey
- What emotion does this interface evoke? Is that intentional?
- Does it match the brand personality?
- **Peak-end rule**: Is the most intense moment positive? Does the experience end well?
- **Emotional valleys**: Check for frustration, anxiety spikes at high-stakes moments.

### 5. Discoverability & Affordance
- Are interactive elements obviously interactive?
- Would a user know what to do without instructions?

### 6. Composition & Balance
- Does the layout feel balanced or uncomfortably weighted?
- Is whitespace used intentionally or just leftover?
- Is there visual rhythm in spacing and repetition?

### 7. Typography as Communication
- Does the type hierarchy clearly signal what to read first, second, third?
- Is body text comfortable to read? (line length, spacing, size)

### 8. Color with Purpose
- Is color used to communicate, not just decorate?
- Does the palette feel cohesive?
- Does it work for colorblind users?

### 9. States & Edge Cases
- Empty states: Do they guide users toward action?
- Loading states: Do they reduce perceived wait time?
- Error states: Are they helpful and non-blaming?

### 10. Microcopy & Voice
- Is the writing clear and concise?
- Are labels and buttons unambiguous?

## Phase 2: Present Findings

### Design Health Score
> *Consult [heuristics-scoring](reference/heuristics-scoring.md)*

Score each of Nielsen's 10 heuristics 0-4:

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | ? | |
| 2 | Match System / Real World | ? | |
| 3 | User Control and Freedom | ? | |
| 4 | Consistency and Standards | ? | |
| 5 | Error Prevention | ? | |
| 6 | Recognition Rather Than Recall | ? | |
| 7 | Flexibility and Efficiency | ? | |
| 8 | Aesthetic and Minimalist Design | ? | |
| 9 | Error Recovery | ? | |
| 10 | Help and Documentation | ? | |
| **Total** | | **??/40** | **[Rating band]** |

### Anti-Patterns Verdict
Pass/fail: Does this look AI-generated? List specific tells. Be brutally honest.

### Overall Impression
Brief gut reaction — what works, what doesn't, single biggest opportunity.

### What's Working
2-3 things done well. Be specific about why.

### Priority Issues
3-5 most impactful problems, ordered by importance. Each tagged P0-P3.

### Persona Red Flags
> *Consult [personas](reference/personas.md)*

Select 2-3 personas most relevant. Walk through the primary user action as each persona. List specific red flags:

**Alex (Power User)**: No keyboard shortcuts. Form requires 8 clicks. Forced modal onboarding.

**Jordan (First-Timer)**: Icon-only nav. Technical jargon. No visible help.

Be specific — name exact elements and interactions that fail each persona.

## Phase 3: Recommended Actions

List recommended fixes in priority order:
1. **[P?]** Brief description with specific context from critique findings

End with `design-polish` as the final step if fixes were recommended.

**Remember**: Be direct. Be specific. Prioritize ruthlessly. Celebrate what works.
