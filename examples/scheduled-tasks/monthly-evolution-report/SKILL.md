---
name: monthly-evolution-report
description: Monthly evolution report — knowledge growth, usage analysis, optimization suggestions
---

Monthly Evolution Report — Knowledge System Intelligence

## Tasks

1. **Run /health**: Execute the full health diagnostic command and capture results.

2. **Knowledge Growth Stats**:
   - Count entries by category (PAT/SOL/ERR/PREF/FAIL) in INDEX.md
   - Compare to previous month if data available
   - Calculate growth rate (new topics per week)
   - Identify most active categories

3. **Usage Heat Map** (from session logs):
   - Read all session files from the past 30 days
   - Extract Usage Profile sections
   - Aggregate: which commands, skills, MCP tools, plugins were used most
   - Identify: which capabilities were NEVER used in the past month
   - Recommend: capabilities worth disabling, capabilities worth promoting

4. **Evolution Activity Summary**:
   - Read evolution.md
   - Count: saves, promotions, maturity milestones, refinements
   - Identify patterns approaching "proven" status
   - Highlight any knowledge that hasn't been referenced in 30+ days (candidate for archiving)

5. **Context Efficiency Check**:
   - Verify ENABLE_TOOL_SEARCH is active
   - Check CLAUDE.md line count (target: <160 lines)
   - Count active MCP servers (target: minimize duplicates)
   - Count enabled plugins

6. **Optimization Suggestions**: Based on usage data, suggest:
   - Skills/plugins to disable (unused >30 days)
   - Knowledge entries to promote (local → global)
   - Patterns to mark as "proven" (3+ confirmations)
   - New capabilities to explore based on usage trends

7. **Report**: Write a comprehensive report to the user with sections: Growth, Usage, Evolution, Efficiency, Recommendations.

## Paths
- MEMORY: ~/.claude/projects/<PROJECT_MEMORY_DIR>/memory
- SETTINGS: ~/.claude/settings.json
- CLAUDE_MD: ~/.claude/CLAUDE.md