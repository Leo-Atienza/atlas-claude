---
name: system
description: "Capability Systems — list, show, detect, deactivate domain bundles (activate via /system:activate, scaffold via /system:new)"
argument-hint: "[list|show <name>|detect|deactivate|<name>]"
allowed-tools:
  - Read
  - Bash
  - Glob
---
<objective>
Single entry point for Capability Systems (vertical domain bundles overlaying skills/MCPs/knowledge — see `systems/REGISTRY.md`). Lightweight verbs are handled inline here; `activate` and `new` are real workflows in `commands/system/`.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Parse the argument:

**Bare `/system <name>`** (a registered system name, e.g. `/system full-stack`) → treat as activation: hand off to `/system:activate <name>`.

**`list`** (or no argument):
1. `cat ~/.claude/systems/registry.json` — print a table: name · id · domain · status · when_to_use.
2. Slug the CWD (`node -e "console.log(require(process.env.HOME ? process.env.HOME + '/.claude/hooks/lib/slug' : '~/.claude/hooks/lib/slug').cwdSlug(process.cwd()))"` — on Windows use `os.homedir()`; canonical helper, never hand-compute) and check `~/.claude/cache/active-system-<slug>.json`. Mark the active system in the table.
3. Mention: activate with `/system:activate <name>`, create with `/system:new <name>`.

**`show <name>`:**
1. Read `~/.claude/systems/<name>/SYSTEM.md` — print frontmatter roster (skills with their ACTIVE-DIRECTORY titles, preferred MCP, commands, agents, rules, detect signals) + the body.
2. If `cache/knowledge-view-<domain>.md` exists, report its entry count and path.

**`detect`:**
1. Run `node ~/.claude/hooks/system-detect.js --explain` from the CWD — prints every system's score with matched signals.
2. If a best match exists, offer `/system:activate <name>`. Also surface the persisted last proposal from `cache/system-detect-<slug>.json` if present.

**`deactivate`:**
1. Compute the CWD slug (canonical helper as above).
2. Delete `~/.claude/cache/active-system-<slug>.json` and `~/.claude/cache/active-system-<slug>.md` (move to TRASH per filesystem-safety rule, or plain delete — these are regenerable cache artifacts, plain `rm` via `mv` to `/c/tmp/trash/` if the safety hook complains).
3. Confirm: "Deactivated <name> for this folder. Auto-detect may re-propose it; /system:activate to re-enable."

Never edit `systems/*/SYSTEM.md` from this command — that's `/system:new` (scaffold) or manual editing + `node scripts/systems-registry.js`.
</process>
