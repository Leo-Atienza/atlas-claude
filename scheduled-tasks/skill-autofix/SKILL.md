---
name: skill-autofix
description: Weekly AutoResearch — identifies underperforming skills, researches improvements, generates candidates for review
---

You are running the weekly skill auto-improvement cycle (AutoResearch pattern).

## Phase 1: Identify Underperformers
Run the skill improver to generate candidates:
```bash
node ~/.claude/scripts/skill-improver.js
```

If no candidates are generated, the task is complete.

## Phase 2: Research Improvements (for each candidate)
For each `.candidate.md` file in `~/.claude/skills/.candidates/`:

1. Read the candidate file to understand the problem
2. Read the current SKILL.md for that skill
3. Use Context7 to search for updated documentation on the skill's technology
4. Use WebSearch if Context7 doesn't have sufficient information
5. Compare current skill content against latest best practices

## Phase 3: Generate Improved Versions
For each candidate with actionable improvements:

1. Write an improved version to `~/.claude/skills/.candidates/<name>.improved.md`
2. Include a diff summary at the top showing what changed and why
3. Focus on:
   - Updated keywords that match actual usage patterns
   - Revised content reflecting current best practices
   - Removed outdated patterns or deprecated APIs
   - Added missing common use cases

## Phase 4: Report
Write a summary to `~/.claude/skills/.candidates/REPORT.md` listing:
- Skills analyzed
- Candidates generated
- Improvements proposed
- Action needed (human review via `/skill:review`)

Do NOT modify any active SKILL.md files. All changes go to `.candidates/` only.
