# Cognitive Load Assessment

Cognitive load is the total mental effort required to use an interface. Overloaded users make mistakes, get frustrated, and leave.

## Three Types of Cognitive Load

### Intrinsic Load — The Task Itself
Complexity inherent to what the user is trying to do. You can't eliminate this, but you can structure it.

**Manage by**: Breaking complex tasks into discrete steps, providing scaffolding (templates, defaults, examples), progressive disclosure, grouping related decisions.

### Extraneous Load — Bad Design
Mental effort caused by poor design choices. **Eliminate this ruthlessly** — it's pure waste.

**Common sources**: Confusing navigation, unclear labels, visual clutter, inconsistent patterns, unnecessary steps between intent and result.

### Germane Load — Learning Effort
Mental effort spent building understanding. This is *good* cognitive load — it leads to mastery.

**Support by**: Progressive disclosure, consistent patterns that reward learning, feedback confirming understanding, onboarding through action not walls of text.

## Cognitive Load Checklist

Evaluate the interface against these 8 items:

- [ ] **Single focus**: Can the user complete their primary task without distraction from competing elements?
- [ ] **Chunking**: Is information presented in digestible groups (<=4 items per group)?
- [ ] **Grouping**: Are related items visually grouped together (proximity, borders, shared background)?
- [ ] **Visual hierarchy**: Is it immediately clear what's most important on the screen?
- [ ] **One thing at a time**: Can the user focus on a single decision before moving to the next?
- [ ] **Minimal choices**: Are decisions simplified (<=4 visible options at any decision point)?
- [ ] **Working memory**: Does the user need to remember information from a previous screen to act on the current one?
- [ ] **Progressive disclosure**: Is complexity revealed only when the user needs it?

**Scoring**: Count failed items. 0-1 = low cognitive load (good). 2-3 = moderate (address soon). 4+ = high (critical fix needed).

## The Working Memory Rule

**Humans can hold <=4 items in working memory at once** (Miller's Law revised by Cowan, 2001).

At any decision point, count the number of distinct options, actions, or pieces of information a user must simultaneously consider. If >4, redesign: group into categories, use progressive disclosure, provide defaults, or break into steps.
