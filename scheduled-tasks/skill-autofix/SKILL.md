---
name: skill-autofix
description: Identifies underperforming skills used in the past 5 days, researches improvements, generates candidates for review
schedule: every 5 days
---

You are running the skill auto-improvement cycle for recently-used skills.

## Phase 1: Identify Underperformers
Run the skill improver (filters to skills used in past 5 days):
```bash
SKILL_LOOKBACK_DAYS=5 node ~/.claude/scripts/skill-improver.js
```

If no candidates are generated, the task is complete.

## Phase 2: Research Improvements
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
   - Updated content reflecting current best practices
   - Removed outdated patterns or deprecated APIs
   - Added missing common use cases

## Phase 4: Report
Write a summary to `~/.claude/skills/.candidates/REPORT.md` listing:
- Skills analyzed
- Improvements proposed
- Action needed (review via `/skill-review`)

Do NOT modify any active SKILL.md files. All changes go to `.candidates/` only.
