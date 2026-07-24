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

## 0. Automated Validators

**Integrity scoreboard (canonical) — run first.** Registry/hook/skill-count/knowledge/reference integrity is owned by `/system-doctor` (the 11 `validate-*.js` validators it aggregates). Don't re-derive these by hand — run the scoreboard and use its per-validator rows for sections 1–3 below:

```bash
node ~/.claude/scripts/system-doctor.js
```

**Health-only surface — run second.** `health-validator.js` then covers what `system-doctor` does not: version manifest, behavioral compliance, and knowledge staleness:

```bash
node ~/.claude/scripts/health-validator.js --skip-network
```

Parse both outputs and use them throughout the checks below. If the user wants network version-update checks, run:

```bash
node ~/.claude/scripts/health-validator.js --check versions
```

## 1. Hook Integrity

Use the `hooks` row from the §0 `system-doctor` scoreboard (it owns hook-wiring integrity; `health-validator.js` no longer re-checks hooks). All ATLAS hooks are command-type by design — there are no agent/prompt-type hooks to verify (v8.14: removed a stale assertion that expected them and failed against every validator-green config).

## 2. Skills Directory Integrity

Skill-registry integrity is owned by the §0 scoreboard's `skill-counts` validator (row-count + identity reconciliation across all doc surfaces). Do NOT compare a raw ACTIVE-DIRECTORY row count against a flat `skills/*/SKILL.md` count — §14's own note explains why they can never match (pack skills nest deeper; ecosystem symlinks inflate the flat count). Optional disk sanity only:

```bash
# Top-level SKILL.md files (real dirs + symlinks — see SYSTEM_VERSION "Skills counted three ways")
ls -d ~/.claude/skills/*/SKILL.md 2>/dev/null | wc -l
```

For missing skills: check if moved or archived. Report mismatches.

**Cross-source validation** — the `skill-counts` row of the §0 scoreboard already cross-checks the four source-of-truth files (via `validate-skill-counts.js`); read that row rather than re-running it. To see it in isolation:

```bash
node ~/.claude/scripts/validate-skill-counts.js
```

If drift is detected, edit the out-of-sync file(s) to match the authoritative number (usually whatever `ACTIVE-DIRECTORY.md` says).

## 3. Knowledge Consistency

Check engineering vault file presence and entry counts:

```bash
# Vault engineering files (v8.0.0)
ls <your-vault-path>/wiki/engineering/{patterns,solutions,errors,preferences,failures}.md 2>/dev/null
echo ""
# Count KNOWLEDGE-NNN entries per file
grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/*.md 2>/dev/null
```

**Cross-check**: Verify all 5 monolithic engineering files exist; `_index.md` is auto-regenerable by `wiki-manage`.

## 4. Vault Health

```bash
test -f <your-vault-path>/wiki/personal/profile.md && echo "OK: profile.md exists" || echo "MISSING: profile.md"
test -f <your-vault-path>/wiki/personal/system-overview.md && echo "OK: system-overview.md exists" || echo "MISSING: system-overview.md"
test -f ~/.claude/.pending-reflection && echo "PENDING: Reflection missed" || echo "OK: No pending reflections"
# Vault git must be local-only
( cd ~/Documents/Wiki && git remote -v ) | grep -q . && echo "WARN: vault has a remote — must be local-only" || echo "OK: vault has no remote"
```

## 5. Behavioral Audit

Use the validator's `behavior` output:
- **Engineering knowledge health**: Are all 5 engineering files present? Does entry count match expectations?
- **Personal vault health**: Are `profile.md` + `system-overview.md` + the namespace folders intact?
- **Pending flags**: Is there a pending reflection?

## 7. Disk Usage

Run each command as its OWN Bash call with an explicit `timeout` (60000 ms). `~/.claude/projects/` is too large for `du` (observed multi-minute timeout in scheduled runs) — count entries instead. If any size check is slow or times out, report "size check skipped (slow)" for that line and continue — never block the health run on disk stats.

```bash
du -sh ~/.claude/skills/ 2>/dev/null
```
```bash
du -sh ~/.claude/plans/ 2>/dev/null
```
```bash
ls ~/.claude/projects/ 2>/dev/null | wc -l   # project-dir count, not size — du is too slow here
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
echo "Patterns:";          grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/patterns.md 2>/dev/null
echo "Solutions:";         grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/solutions.md 2>/dev/null
echo "Errors:";            grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/errors.md 2>/dev/null
echo "Preferences:";       grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/preferences.md 2>/dev/null
echo "Failures:";          grep -c "^## KNOWLEDGE-" <your-vault-path>/wiki/engineering/failures.md 2>/dev/null
```

For stale entries (>90 days old per the `**Date**` line inside each H2 entry): ask the user if each is still relevant. If yes, update the `**Date**` line in place. If no, delete the H2 entry from its `<type>.md`.

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
# Clone fresh (scratch dir)
gh repo clone <owner>/<repo> /c/tmp/<pack>-latest -- --depth 1
# Swap: old pack goes to trash (NEVER rm — hook-blocked + unrecoverable), fresh copy moves in.
# mv-first also avoids the old bug of cp-ing the clone INSIDE the still-existing pack dir.
mv ~/.claude/skills/<pack> /c/tmp/trash/<pack>-$(date +%s)
mv /c/tmp/<pack>-latest ~/.claude/skills/<pack>
mv ~/.claude/skills/<pack>/.git /c/tmp/trash/<pack>-git-$(date +%s)
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
# Failure count since last rotation (the log is size-rotated at 500KB, NOT time-windowed —
# do not read this as a 7-day figure; for weekly trends use cache/tool-health.json)
wc -l ~/.claude/logs/tool-failures.jsonl 2>/dev/null || echo "0 (no log file)"

# Top failing tools
cat ~/.claude/logs/tool-failures.jsonl 2>/dev/null | python3 -c "
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

If recurring patterns found: recommend running `/remember` for the top pattern.
If total failures > 20 in 7 days: flag as WARNING and recommend `/analyze-mistakes`.

## 14. System Version — Auto-Update (snapshot-driven)

`SYSTEM_VERSION.md` is a living manifest. Its component counts **MUST** come from the canonical snapshot, never from ad-hoc `ls … | wc -l`. Hand-rolled counts silently miscount: skills live inside packs at varying depths and as ecosystem symlinks, so a flat `*/SKILL.md` count never equals the canonical 52 active skills, and the rules files live under `skills/`, not `~/.claude/rules/` (which doesn't exist → returns 0). Writing those raw numbers back would clobber curated, validator-backed values. **As of v8.13 the snapshot→doc writeback is automated by `scripts/sync-counts.js` (Step 3) — you no longer hand-edit the validator-backed count tables.**

**Step 1 — regenerate the snapshot, then read it:**

```bash
node ~/.claude/scripts/system-snapshot.js
```

Read `~/.claude/cache/system-ground-truth.json` and pull each validator-backed count from its exact field:

| SYSTEM_VERSION.md row | Snapshot field |
|-----------------------|----------------|
| Skills (in ACTIVE-DIRECTORY) — **canonical** | `.skills.from_validator.active_directory` |
| Skills (filesystem total incl. packs + symlinks) | `.skills.from_validator.filesystem_unlimited.total` |
| Hooks (active .js) | `.hooks_dir.total` (== `.hooks_validation.counts.hooks`) |
| Commands (with subdirs, excl. `_deprecated`) | `.commands.counts.fs_commands` |
| Knowledge entries (vault `engineering/`) | `.knowledge.counts.actual_total` |
| Knowledge Breakdown (per type) | `.knowledge.counts.by_type.{pattern,solution,error,preference,failure}` |
| Scheduled tasks (filesystem dirs) | `.scheduled_tasks.count` |
| Plugins (enabled — for the §16 report line) | `.plugins.enabled_count` |

> **Guardrail — never overwrite a validator-backed number (any row above) with a raw `ls … | wc -l` count.** If a manual count disagrees with the snapshot, the snapshot wins; investigate the manual count rather than trusting it. The `Skills (in ACTIVE-DIRECTORY)` value (52) is cross-checked by `validate-skill-counts.js` across four files — clobbering it with the flat `*/SKILL.md` count is the specific corruption this section exists to prevent; that flat number belongs only to the separate `Skills (top-level SKILL.md files)` row. `scripts/sync-counts.js` (Step 3) enforces this by construction — it only ever writes snapshot values.

**Step 2 — counts the snapshot does NOT expose** — count these directly, with the *correct* paths:

```bash
TOP_CMDS=$(ls ~/.claude/commands/*.md 2>/dev/null | wc -l)          # top-level only; snapshot's fs_commands is recursive
SH_PY_HOOKS=$(ls ~/.claude/hooks/*.sh ~/.claude/hooks/*.py 2>/dev/null | wc -l)
AGENTS=$(ls ~/.claude/agents/*.md 2>/dev/null | wc -l)             # top-level custom; the "incl. packs" row is hand-maintained
RULES=$(ls ~/.claude/skills/RULES-*.md 2>/dev/null | wc -l)        # rules live in skills/, NOT ~/.claude/rules/
VAULT_PERSONAL=$(find <your-vault-path>/wiki/personal/ -name "*.md" 2>/dev/null | wc -l)
CLI_VER=$(cat ~/.claude/.claude-code-version 2>/dev/null || echo "unknown")
echo "top-cmds: $TOP_CMDS | sh+py hooks: $SH_PY_HOOKS | agents: $AGENTS | rules: $RULES | vault personal: $VAULT_PERSONAL | cli: $CLI_VER"
```

**Step 3 — write back (automated).** Run the writer — it reads the Step-1 snapshot and propagates every validator-backed count into `SYSTEM_VERSION.md`, `README.md`, `ARCHITECTURE.md`, and `REFERENCE.md` by anchored-regex replacement, rewriting only the numbers and bumping the `last_updated:` header + `last_health_check` (Metadata table) to today **only if a count actually changed**. It never touches `version:`, `ACTIVE-DIRECTORY.md`, the `## Skills counted three ways` prose, or any per-row "Last Updated" note (only the count digit moves):

```bash
node ~/.claude/scripts/sync-counts.js
```

Review the printed diff. The script exits non-zero and names the offending anchor if a doc's format drifted so a count could not be written — fix that (the doc text or the anchor) before continuing; it never silently skips. Rows it owns: `Skills (in ACTIVE-DIRECTORY)` (mirrored ×7 across the four files), `Skills (filesystem total …)`, `Hooks (active .js)`, `Commands (with subdirs …)`, `Knowledge entries (vault engineering/)` + the per-type `## Knowledge Breakdown`, and `Scheduled tasks (filesystem dirs)`.

**Then hand-update only the NON-snapshot rows** the script deliberately leaves alone (the script's header comment lists them), using the Step-2 values and only where the value changed — preserving each row's explanatory "Last Updated" note and **not** bumping `version:`: `Commands (top-level active)`, `Hooks (.sh + .py)`, `Agents (incl. plugin-shipped packs)`, `Rules`, `Vault personal/ files`, and the `Skills (top-level SKILL.md files)` row. Disk usage (§7) and installed tool versions / skill-pack status (§12) maintain their own SYSTEM_VERSION tables; this section owns only the count tables.

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
