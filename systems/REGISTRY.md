# Capability Systems

> Vertical domain bundles over the ATLAS capability layer. Each system is a
> non-destructive **overlay manifest** that *references* existing skills, MCP
> servers, knowledge, commands, agents, and RULES pages — nothing is moved.
> One asset can belong to many systems. Deleting a system touches none of them.
>
> **Roster:** run `/system list` — it reads `registry.json` (derived, do not
> hand-edit). There is intentionally no hand-mirrored table here.
> **Note:** `/system` (this framework) ≠ `/system-doctor` (the validator board).

## How activation works

- `/system activate <name>` writes `cache/active-system-<cwd_slug>.json` (marker)
  + `cache/active-system-<cwd_slug>.md` (≤2,500-char digest), regenerates
  `cache/knowledge-view-<domain>.md`, and echoes the bundle in-session.
- Every later session in that CWD re-injects the digest and touches the marker
  (sliding TTL — expires only after 14 days with no sessions in that folder).
- `hooks/system-detect.js` (SessionStart) *proposes* a system when project
  signals match (`SYSTEM:` prefix line); it never auto-activates.
- `preferred_mcp` is **advisory** — ATLAS cannot toggle MCP registration per
  session; the list is "prefer these tools" guidance surfaced in the digest.

## Add a system (the recipe)

1. `/system new <name>` — scaffolds `systems/<name>/SYSTEM.md` from the template.
2. Fill the frontmatter: `id` (SYS-SHORT), `name`, `title`, `domain` (one token,
   must have real vault knowledge — check `node scripts/knowledge-view.js <domain> --json`),
   `when_to_use`, `skills` (SK-### from `skills/ACTIVE-DIRECTORY.md` or bare
   skill-dir names), `preferred_mcp`, `commands`, `agents`, `rules`,
   `detect.detect_files` + `detect.detect_packages` (literal paths or bounded
   `**` globs — leading-`**` is rejected by the validator), `detect.priority`.
3. Write a SHORT body (≤60 lines — it is echoed on activation): imperative
   guidance, not just a roster.
4. `node scripts/systems-registry.js` — regenerate `registry.json`.
5. `node scripts/validate-systems.js` — must exit 0.
6. Done. Auto-detect picks it up at the next session start.

Retire a system: set `status: archived` (reversible) or delete its directory.
