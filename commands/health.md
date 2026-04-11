---
name: health
description: "Global self-diagnostics — check system health, registry integrity, version updates, behavioral audit, and auto-update."
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Edit
---

<objective>
Run a comprehensive health check on the Claude system. Report findings clearly with actionable recommendations. Offer to auto-update outdated resources.
</objective>

<process>

## 0. Automated Validator

Run the health validator script first — it checks registry paths, knowledge staleness, hook integrity, version manifest, and behavioral compliance in one pass:

```bash
node ~/.claude/scripts/health-validator.js --skip-network
```

Parse the JSON output and use it throughout the checks below. If the user wants version update checks (network required), run:

```bash
node ~/.claude/scripts/health-validator.js --check versions
```

## 1. Hook Integrity

Use the validator's `hooks` output. Also verify prompt/agent hooks are configured in settings.json:
- Stop event should have an agent hook for task completion verification
- PreToolUse Write should have a prompt hook for security gating

## 2. Skills Directory Integrity

Verify active skills exist on disk:

```bash
# Count skills listed in ACTIVE-DIRECTORY.md vs actual skill dirs
grep -c "^| " ~/.claude/skills/ACTIVE-DIRECTORY.md 2>/dev/null
ls -d ~/.claude/skills/*/SKILL.md 2>/dev/null | wc -l
```

For missing skills: check if moved or archived. Report mismatches.

## 3. Knowledge Consistency

Check KNOWLEDGE-DIRECTORY.md ↔ Knowledge Pages alignment:

```bash
# Count KNOWLEDGE-DIRECTORY.md entries
grep -c "^| G-" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null

# Count entries across all Knowledge Pages
grep -c "^## G-" ~/.claude/topics/KNOWLEDGE-PAGE-*.md 2>/dev/null
```

**Cross-check**: Verify all 5 Knowledge Pages exist and entry counts match the directory.

## 4. Memory System Health

```bash
test -f ~/.claude/projects/C--Users-leooa--claude/memory/MEMORY.md && echo "OK: MEMORY.md exists" || echo "MISSING: MEMORY.md"
test -f ~/.claude/.pending-reflection && echo "PENDING: Reflection missed" || echo "OK: No pending reflections"
```

## 5. Behavioral Audit

Use the validator's `behavior` output:
- **Knowledge health**: Are all 5 Knowledge Pages present? Does entry count match directory?
- **Memory health**: Does MEMORY.md exist? How many memory entries?
- **Pending flags**: Is there a pending reflection?

## 7. Disk Usage

```bash
du -sh ~/.claude/ 2>/dev/null
du -sh ~/.claude/skills/ 2>/dev/null
du -sh ~/.claude/projects/ 2>/dev/null
du -sh ~/.claude/plans/ 2>/dev/null
```

## 8. Stale Resources

```bash
find ~/.claude/plans/ -name "*.md" -mtime +7 2>/dev/null | wc -l
ls -d ~/.claude/projects/*worktree*/ 2>/dev/null | wc -l
```

## 9. Context Efficiency

```bash
grep -q "ENABLE_TOOL_SEARCH" ~/.claude/settings.json && echo "OK: TOOL_SEARCH configured" || echo "WARN: TOOL_SEARCH not configured"
wc -l ~/.claude/CLAUDE.md
```

## 10. Plugin Status

Read `~/.claude/settings.json` and report enabled vs disabled plugins.

## 11. Knowledge Growth & Staleness

Use the validator's `knowledge` output for staleness. Also count by category:

```bash
echo "Patterns:"; grep -c "^| G-PAT" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null
echo "Solutions:"; grep -c "^| G-SOL" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null
echo "Mistakes:"; grep -c "^| G-ERR" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null
echo "Preferences:"; grep -c "^| G-PREF" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null
echo "Failed Approaches:"; grep -c "^| G-FAIL" ~/.claude/topics/KNOWLEDGE-DIRECTORY.md 2>/dev/null
```

For stale entries (>90 days old): ask the user if each is still relevant. If yes, update the Date column in KNOWLEDGE-DIRECTORY.md to today. If no, remove the entry from the directory and its Knowledge Page.

## 12. Version Updates & Auto-Updater

Run the network version check:

```bash
node ~/.claude/scripts/health-validator.js --check versions
```

Display results as a table:

| Resource | Type | Current | Latest | Action |
|----------|------|---------|--------|--------|
| ... | npm/github/git | ... | ... | Update available |

**Auto-update flow** (ask user for confirmation before each category):

### npm tools
For each outdated npm tool, offer:
```bash
npm install -g <package>@latest
```
After update, update the `installed` version and `last_checked` date in `~/.claude/skills/VERSION-MANIFEST.json`.

### GitHub skill packs
For each skill pack with newer commits:
1. Show the repo and how many days since last check
2. Offer to clone latest and replace:
```bash
# Backup current
cp -r ~/.claude/skills/<pack> /tmp/<pack>-backup-$(date +%Y%m%d)
# Clone fresh
gh repo clone <owner>/<repo> /tmp/<pack>-latest -- --depth 1
# Replace (preserving any local SKILL.md customizations)
rm -rf ~/.claude/skills/<pack>
cp -r /tmp/<pack>-latest ~/.claude/skills/<pack>
rm -rf ~/.claude/skills/<pack>/.git
```
After update, update `last_checked` in VERSION-MANIFEST.json.

**Skip pinned entries** (`"pinned": true` in manifest).

### Git-tracked skills
For each skill that's behind:
```bash
git -C ~/.claude/skills/<skill> pull
```

### After all updates
Update `last_checked` dates in VERSION-MANIFEST.json to today for all checked entries (even if no update was available).

## 13. Operational Logs (failures & error patterns)

```bash
# Failure count (last 7 days)
wc -l ~/.claude/logs/failures.jsonl 2>/dev/null || echo "0 (no log file)"

# Top failing tools
cat ~/.claude/logs/failures.jsonl 2>/dev/null | python3 -c "
import json, sys
from collections import Counter
tools = Counter()
for line in sys.stdin:
    try: tools[json.loads(line.strip())['tool']] += 1
    except: pass
for tool, count in tools.most_common(5):
    print(f'  {tool}: {count} failures')
" 2>/dev/null || echo "  No failures logged"

# Recurring patterns (3+ occurrences)
cat ~/.claude/logs/error-patterns.json 2>/dev/null | python3 -c "
import json, sys
patterns = json.load(sys.stdin)
recurring = [(k,v) for k,v in patterns.items() if v['count'] >= 3]
print(f'{len(recurring)} recurring pattern(s)')
for fp, p in sorted(recurring, key=lambda x: -x[1]['count'])[:5]:
    print(f'  [{p[\"count\"]}x] {p[\"tool\"]}: {p[\"sample\"][:50]}')
" 2>/dev/null || echo "  No patterns tracked yet"
```

If recurring patterns found: recommend running `/learn` for the top pattern.
If total failures > 20 in 7 days: flag as WARNING and recommend `/analyze-mistakes`.

## 14. System Version — Auto-Update

Read `~/.claude/SYSTEM_VERSION.md`. Then recount and update component numbers:

```bash
HOOKS=$(ls ~/.claude/hooks/*.py ~/.claude/hooks/*.sh ~/.claude/hooks/*.js 2>/dev/null | wc -l)
COMMANDS=$(ls ~/.claude/commands/*.md 2>/dev/null | wc -l)
FLOW_COMMANDS=$(ls ~/.claude/commands/flow/*.md 2>/dev/null | wc -l)
SKILLS=$(ls ~/.claude/skills/*/SKILL.md 2>/dev/null | wc -l)
AGENTS=$(find ~/.claude/agents/ -name "*.md" 2>/dev/null | wc -l)
PLUGINS=$(grep -c '"true"' ~/.claude/settings.json 2>/dev/null || echo "0")
RULES=$(ls ~/.claude/rules/*.md 2>/dev/null | wc -l)
CLI_VER=$(cat ~/.claude/.claude-code-version 2>/dev/null || echo "unknown")
echo "hooks: $HOOKS | commands: $((COMMANDS + FLOW_COMMANDS)) | skills: $SKILLS | agents: $AGENTS | plugins: $PLUGINS | rules: $RULES | cli: $CLI_VER"
```

Update `~/.claude/SYSTEM_VERSION.md` with the fresh counts. Update `last_health_check` to today's date.
This makes SYSTEM_VERSION.md a living document that stays accurate automatically.

## 15. Self-Upgrade Recommendations

After all checks, analyze the system holistically and recommend improvements:

1. **Hook gaps**: Are there lifecycle events with no hooks? (e.g., PostToolUseFailure, SubagentStart, SubagentStop)
2. **Underused capabilities**: Are there installed skills/agents that have never been invoked? Consider archiving.
3. **Missing automation**: Are there manual steps in the workflow that could be automated with a new hook or command?
4. **Rule promotion**: Are there G-ERR topics that have appeared 3+ times? They should become rules/ entries.
5. **Stale knowledge**: Any memory topics >90 days old that may no longer apply?

Present recommendations as actionable items the user can approve.

## 16. Report

Format output as:

```
System Health Report — {date}

Hooks:          {X/Y OK} {list any missing}
Registry:       {X} paths verified, {Y} missing
Knowledge:      {N entries} ({orphans} orphans, {stale} stale >90d)
Behavior:       Last 3 reflected: {yes/no}, Pending: {yes/no}, Security gaps: {N}
Conflicts:      {N unresolved}
Sessions:       {N/30} (last: {date})
Disk:           {total} (skills: {X}, projects: {Y})
Stale:          {N plans}, {N worktrees}
Plugins:        {N active}, {N disabled}
Context:        TOOL_SEARCH={status}, CLAUDE.md={lines} lines
Growth:         {PAT}/{SOL}/{ERR}/{PREF}/{FAIL}
Failures:       {N total} ({N recurring patterns}, top: {tool})
Updates:        {N npm}, {N skill-packs}, {N git-skills} available

{Recommendations and auto-update prompts if any issues found}
```

</process>
