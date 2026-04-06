---
name: analyze-mistakes
description: "Analyze recent failures and error patterns for trends. Weekly companion to /reflect — reflect captures learnings, this audits failures."
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

<objective>
Review accumulated failure data and G-ERR topics to surface patterns, recommend consolidation, and propose prevention mechanisms. Run weekly alongside /reflect.
</objective>

<process>

## Step 1: Read Failure Logs

```bash
# Recent failures (last 7 days)
cat ~/.claude/logs/failures.jsonl 2>/dev/null | python3 -c "
import json, sys
from datetime import datetime, timezone, timedelta
cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
entries = []
for line in sys.stdin:
    try:
        e = json.loads(line.strip())
        if e.get('ts', '') >= cutoff:
            entries.append(e)
    except: pass
# Group by tool
from collections import Counter
tools = Counter(e['tool'] for e in entries)
print(f'Total failures (7d): {len(entries)}')
for tool, count in tools.most_common(5):
    print(f'  {tool}: {count}')
" 2>/dev/null || echo "No failure logs found"
```

## Step 2: Read Error Patterns

```bash
cat ~/.claude/logs/error-patterns.json 2>/dev/null | python3 -c "
import json, sys
patterns = json.load(sys.stdin)
recurring = [(k, v) for k, v in patterns.items() if v['count'] >= 3]
recurring.sort(key=lambda x: -x[1]['count'])
if recurring:
    print(f'Recurring patterns (3+ occurrences): {len(recurring)}')
    for fp, p in recurring[:10]:
        print(f'  [{p[\"count\"]}x] {p[\"tool\"]}: {p[\"sample\"][:60]}...')
else:
    print('No recurring patterns found')
" 2>/dev/null || echo "No error patterns file found"
```

## Step 3: Review G-ERR Topics

```bash
# Count and list existing error topics
ls ~/.claude/projects/C--Users-leooa--claude/memory/topics/G-ERR-*.md 2>/dev/null | wc -l
echo "---"
grep "^| G-ERR" ~/.claude/projects/C--Users-leooa--claude/memory/INDEX.md 2>/dev/null
```

Read each G-ERR topic file. Look for:
- **Duplicates**: Topics covering the same root cause with different symptoms
- **Clusters**: Multiple topics sharing the same tags (indicates a systemic issue)
- **Staleness**: Topics older than 90 days — are they still relevant?

## Step 4: Cross-Reference

Check: Were any existing G-ERR rules violated this week?
- For each G-ERR topic, check if `failures.jsonl` contains errors that match the topic's pattern
- If a G-ERR rule exists but the same mistake keeps happening → needs mechanical enforcement (hook or rule file)

## Step 5: Generate Report

```
## Mistake Analysis — {date}

### Summary
- Total failures (7d): {N}
- Recurring patterns: {N}
- G-ERR topics: {N}

### Top 3 Recurring Patterns (need G-ERR topics)
1. [{count}x] {pattern} — Proposed rule: {text}
2. ...

### G-ERR Rules Being Violated (already have rules, still happening)
- G-ERR-{NNN}: {name} — violated {N} times this week
  → Recommendation: Convert to hook / add to rules/ file

### Clusters (systemic issues)
- {tag}: {N} related G-ERR topics — consider a unified prevention strategy

### Duplicate Candidates
- G-ERR-{A} and G-ERR-{B}: similar root cause — merge?

### Stale Topics (>90 days, may no longer apply)
- G-ERR-{NNN}: {name} — last updated {date}
```

## Step 6: Offer Actions

After presenting the report, ask:

1. "Run /learn for the top recurring pattern?"
2. "Merge duplicate G-ERR topics?"
3. "Archive stale topics?"
4. "Create a rules/ entry for violated G-ERR rules?"

Execute only what the user approves.
</process>
