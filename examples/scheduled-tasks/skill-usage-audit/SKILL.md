---
name: skill-usage-audit
description: Monthly skill-usage audit — classify skills alive/dormant/unused using logs/skill-usage.jsonl (v7.0+), propose archive/refine actions
---

You are running the monthly skill-usage audit. Its purpose is to keep the active-skills set honest: skills that are never invoked are cognitive overhead, not capability.

## 0. Prerequisites

This task depends on `logs/skill-usage.jsonl`, populated by the PreToolUse Skill hook added in ATLAS v7.0. If the file is missing or has < 10 records, stop and report:

"skill-usage.jsonl has <N> records — not enough data to audit. Skipping this month; will resume when instrumentation has collected a representative window."

```bash
test -s ~/.claude/logs/skill-usage.jsonl && wc -l ~/.claude/logs/skill-usage.jsonl || echo "no data yet"
```

## 1. Gather usage

```bash
node ~/.claude/scripts/observability.js --section=skill_usage
```

For raw JSON suitable for scripting:
```bash
node ~/.claude/scripts/observability.js --json | jq '.sections.skill_usage'
```

## 2. Classify every active skill

For each skill listed in `skills/ACTIVE-DIRECTORY.md`:
- Alive   — invoked in the last 30 days
- Dormant — invoked 30–90 days ago
- Unused  — no invocation in skill-usage.jsonl at all

Cap each list at 25 entries. If truncated, append "… +N more".

## 3. Propose actions (do NOT execute automatically)

For each Unused skill, look at:
- The skill's created/modified date on disk (has it had time to be used?).
- Its declared purpose (niche-but-important skills like skill-creator, security-review may warrant keeping).

Recommend one of: Archive (/skill-archive or mv to skills/_archived/), Keep (explain why), or Refine (unclear trigger/rename).

## 4. Summary

Output exactly:

```
Skill-usage audit — <date>
  Alive:   <N>
  Dormant: <N>
  Unused:  <N>
  Recommended archives:    <list>
  Recommended refinements: <list>
```

This sweep is advisory only — never delete skills unattended. The user decides.