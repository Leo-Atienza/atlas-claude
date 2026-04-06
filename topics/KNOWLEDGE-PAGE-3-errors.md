# Knowledge Store — Page 3: Errors (G-ERR)

> Mistakes to avoid. Each entry includes what went wrong, why, and what to do instead.

---

## G-ERR-001: Grep Path Parameter
**Date**: 2026-02-27 | **Tags**: #tools #grep #api

Grep tool uses `path` param, NOT `file_path`. Mixing them causes silent failures — Grep ignores unknown params and searches the entire working directory. Read tool uses `file_path`, creating muscle memory that bleeds into Grep calls.

---

## G-ERR-002: Glob for Filename Search
**Date**: 2026-02-27 | **Tags**: #tools #glob #search

Use Glob with pattern for filenames (`**/utils.ts`), not Grep. Grep with common names returns every file containing that string as text, not files named that. Glob = find by name, Grep = find content inside files.

---

## G-ERR-003: Windows Path Quoting
**Date**: 2026-02-27 | **Tags**: #windows #bash #paths

Windows paths with spaces need double quotes: `cd "C:/Users/My User/projects"`. Use `~` shorthand when possible to avoid space issues.

---

## G-ERR-004: Unix Syntax on Windows
**Date**: 2026-02-27 | **Tags**: #windows #bash #syntax

Claude Code runs bash (Git Bash/MSYS2) on Windows, not cmd.exe. Use forward slashes, `/dev/null`, `cat`, `ls`, `cp`, `rm`, `grep` — not Windows equivalents. Dedicated tools (Read, Grep, Glob) handle path translation automatically.

---

## G-ERR-005: last: Pseudo-class Trap with Wrappers
**Date**: 2026-03-09 | **Tags**: #tailwind #css #pseudo-class

When items are individually wrapped in components (AnimateIn, Framer Motion), every item is `:last-child` of its own wrapper. `last:mb-0` zeros ALL margins, not just the final item. Fix: remove `last:mb-0` entirely when items are individually wrapped. Same applies to `first:`, `odd:`, `even:`.

**Related**: G-FAIL-001

---

## G-ERR-007: Sequelize toJSON Double Cast Intentional
**Date**: 2026-03-09 | **Tags**: #sequelize #typescript #orm

`as unknown as Record<string, unknown>` after `.toJSON()` is intentional, not a code smell. Model interfaces lack string index signatures. The double cast bridges Sequelize's type system to generic object handling. Don't remove it.

---

## G-ERR-008: Stale .next Cache from Concurrent Build+Dev
**Date**: 2026-03-11 | **Tags**: #nextjs #build #cache

Running `npm run build` while dev server is active corrupts `.next/chunks` → `MODULE_NOT_FOUND`. Fix: `taskkill //F //IM "node.exe"` → `rm -rf .next` → `npm run dev`. Prevention: always stop dev server before building.

---

## G-ERR-009: backdrop-blur on Sticky = Scroll Jank
**Date**: 2026-03-13 | **Tags**: #css #performance #scroll #backdrop-filter

`backdrop-filter: blur()` on `sticky`/`fixed` elements re-composites blur on every scroll frame — most expensive scroll op. Fix: solid background instead. Only use backdrop-filter on static elements (overlays, modals) or elements that don't move on scroll.

**Related**: G-PAT-017

---

## G-ERR-010: Framer Motion whileInView + animate Conflict
**Date**: 2026-03-15 | **Tags**: #framer-motion #animation #react

`animate` prop is silently ignored when `whileInView` is also set. Fix: TWO separate render paths — one with `whileInView` (normal), one with plain `animate` (fallback). Never combine both on the same `motion.div`.

**Related**: G-SOL-014, G-FAIL-006

---

