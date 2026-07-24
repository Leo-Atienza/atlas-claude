---
name: system:activate
description: "Activate a Capability System for this folder — marker + digest + knowledge view + focused context"
argument-hint: "<name> (e.g. full-stack)"
allowed-tools:
  - Read
  - Write
  - Bash
---
<objective>
Bring a Capability System online for the current CWD: write the per-folder activation marker and a bounded digest, regenerate the domain knowledge view, and load the bundle into this session's context. Overlay-safe — writes ONLY cache artifacts; never touches skills/MCP config/vault.
</objective>

<context>
$ARGUMENTS
</context>

<process>
1. **Resolve.** Read `~/.claude/systems/<name>/SYSTEM.md`. Unknown name → print available systems from `systems/registry.json` and stop.

2. **Soft-validate.** Run `node ~/.claude/scripts/validate-systems.js`; if it reports dangling refs for THIS system, warn (list them) but continue — activation must not hard-fail on a stale roster.

3. **Slug.** Compute the CWD slug with the canonical helper — never hand-compute:
   `node -e "const os=require('os');console.log(require(os.homedir()+'/.claude/hooks/lib/slug').cwdSlug(process.cwd()))"`

4. **Marker.** Write `~/.claude/cache/active-system-<slug>.json`:
   ```json
   {
     "primary": { "system_id": "<id>", "name": "<name>", "domain": "<domain>", "activated_at": "<ISO>", "source": "explicit", "manifest": "systems/<name>/SYSTEM.md" },
     "companions": []
   }
   ```
   (Companion-ready shape — populate `companions` from the manifest's `companions:` key when present.)

5. **Knowledge view.** If the manifest has `knowledge_domains`, run `node ~/.claude/scripts/knowledge-view.js <domain>` (it mtime-short-circuits when fresh) → `cache/knowledge-view-<domain>.md`.

6. **Digest** — write `~/.claude/cache/active-system-<slug>.md`, **hard cap 2,500 chars** (truncate the skill list with "…and N more — see SYSTEM.md" if needed). This file is re-injected by session-start §7m in every later session here, so it must stand alone:
   ```
   ## Active system: <title> (<domain>)
   <when_to_use>
   <the SYSTEM.md body — the imperative guidance>
   Top skills: <up to 8: SK-### name — one-line purpose>
   Rules: <paths only>
   Knowledge view: cache/knowledge-view-<domain>.md (<N> entries)
   Preferred MCP (advisory): <list>
   ```

7. **Echo** the activation block in-session: the digest content + the remaining member skills as one-liners. **≤600 tokens total; rules pages and knowledge view referenced as PATHS, never inlined.**

8. Confirm: "Activated <name> for <cwd>. Persists across sessions here (sliding 14d TTL); `/system deactivate` to turn off."
</process>
