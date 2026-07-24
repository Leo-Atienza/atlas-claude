---
name: system:new
description: "Scaffold a new Capability System (overlay manifest) — the extensibility recipe"
argument-hint: "<name> (kebab-case, e.g. data-eng)"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
<objective>
Create `systems/<name>/SYSTEM.md` from the template below, grounded in assets that actually exist. A system is an overlay manifest: it REFERENCES skills/MCPs/commands/agents/rules — it never moves or duplicates them.
</objective>

<context>
$ARGUMENTS

Recipe doc: `~/.claude/systems/REGISTRY.md`. Existing manifests to imitate: `systems/full-stack/SYSTEM.md`.
</context>

<process>
1. **Guard.** `systems/<name>/` already exists → stop and say so. Name must be kebab-case.

2. **Ground the roster in real assets** (never invent ids):
   - Skills: scan `skills/ACTIVE-DIRECTORY.md` for domain-relevant SK-### rows; bare names must be top-level dirs under `skills/` or SYMLINKS.md entries.
   - MCP: pick from the validator's known set (`scripts/validate-systems.js` header — user-scope list per ARCHITECTURE.md § MCP, plus root .mcp.json, plugin, session-managed). `preferred_mcp` is ADVISORY only.
   - Knowledge: run `node scripts/knowledge-view.js <domain> --json` — if the domain resolves <5 entries, OMIT `knowledge_domains` (an empty view is ceremony) and note it can be added once entries exist.
   - Detect: literal file paths or bounded `**` globs (leading-`**` is rejected by the validator); packages from package.json-style manifests. Systems without repo-shaped signals (activity-shaped domains like "design") simply omit `detect` — they are activate-only.

3. **Write** `systems/<name>/SYSTEM.md`:
   ```yaml
   ---
   id: SYS-<SHORT>
   name: <name>
   title: <Title> System
   domain: <one-token>          # omit knowledge_domains if <5 vault entries
   when_to_use: <one line>
   status: active
   skills:
     - SK-###   # <title>
   preferred_mcp: [<names>]     # advisory — ATLAS cannot toggle MCP per session
   knowledge_domains: [<domain>]
   commands: [<command-or-skill-slugs>]
   agents: [<agent names>]
   rules: [RULES-GIT]
   companions: []
   detect:
     detect_files: [<literal-or-bounded-globs>]
     detect_packages: [<pkgs>]
     priority: 50
   ---
   # <Title> System
   <IMPERATIVE body, ≤60 lines: which skills to prefer when, check the knowledge
   view before implementing, applicable rules, preferred-MCP guidance.>
   ```

4. **Register + validate:** `node scripts/systems-registry.js` then `node scripts/validate-systems.js` — fix any dangling refs it names before declaring done.

5. Offer `/system:activate <name>`.
</process>
