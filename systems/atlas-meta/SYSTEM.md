---
id: SYS-META
name: atlas-meta
title: ATLAS Meta (Self-Engineering) System
domain: atlas
when_to_use: Working ON the ATLAS system itself — hooks, skills, validators, MCP wiring, knowledge plumbing, ~/.claude infrastructure.
status: active
skills:
  - SK-101   # Wiki Manager
  - self-evolve            # capability-gap detection → new skills/MCPs
  # v10: SK-011 (mcp-builder → anthropic-skills symlink), SK-039 + SK-077 (→ Workflow tool / council, CLAUDE.md two lanes) archived
preferred_mcp:
  - MCP_DOCKER
  - context-mode
  - obsidian
commands: [observe, system-doctor, recall, health]
agents: []
rules: [RULES-GIT]
companions: []
detect:
  detect_files:
    - SYSTEM_VERSION.md
    - ARCHITECTURE.md
    - hooks/session-start.sh
  detect_packages: []
  priority: 60
---
# ATLAS Meta (Self-Engineering) System

While this system is active:

- **Audit protocol is law** (CLAUDE.md "Auditing the ATLAS system itself"): `node scripts/system-snapshot.js` → read `cache/system-ground-truth.json` → `node scripts/system-doctor.js`. Never re-derive counts via grep when the snapshot is fresh.
- **Before changing hooks/skills/settings**: review the atlas knowledge view — run `node scripts/knowledge-view.js atlas` for the patterns/errors/solutions about THIS system (errors first). Use the live command rather than a cached file so the count never drifts (the old static `cache/knowledge-view-atlas.md` was never generated for this domain).
- **After infrastructure changes** (Auto-System-Docs): update ARCHITECTURE.md + hooks/README.md + INSTALLED.md as part of Deliver, then re-run the snapshot.
- **Hook changes**: fail-open + profile-gated via `isHookEnabled` (hooks/lib.js); slugs via `hooks/lib/slug.js` — never hand-computed.
- `/observe` for telemetry, `/system-doctor` for the validator board, `/recall <topic>` before re-deriving anything, `/health` for self-diagnostics.
- New knowledge here is stamped `**Domain**: atlas` by /remember.
