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

## G-ERR-011: firecrawl_scrape Parameter Types
**Date**: 2026-04-12 | **Tags**: #mcp #firecrawl #api #parameters

`firecrawl_scrape` requires `formats` as an actual JSON array (`["markdown"]`), NOT a stringified array (`"[\"markdown\"]"`). Same for `onlyMainContent` — must be boolean `true`, not string `"true"`. Causes MCP error -32602 parameter validation failure. Repeated 3 times in same session before catching it.

**Fix**: Always pass arrays as arrays and booleans as booleans to MCP tools — JSON types, not string representations.

---

## G-ERR-012: create-next-app Rejects Capital Letters in Project Name
**Date**: 2026-04-12 | **Tags**: #nextjs #create-next-app #naming

`create-next-app` refuses names with capital letters — npm naming restriction. "Anniversary" fails with: "name can no longer contain capital letters". Workaround: use lowercase temp name (`anniversary-site`), bootstrap there, then move/rename files. NOTE: `mv` to `/c/tmp/trash/` can fail with "Permission denied" if `/c/tmp/` doesn't exist — create it first with `mkdir -p`.

---

## G-ERR-013: Next.js Edge Runtime Cannot Use Node.js Crypto
**Date**: 2026-04-12 | **Tags**: #nextjs #edge-runtime #middleware #crypto #security

Next.js middleware runs in Edge Runtime, which does NOT have access to the Node.js `crypto` module. Attempting to use `crypto.createHmac()` etc. throws at runtime. Must use the Web Crypto API instead:
```ts
const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign'])
const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
```
`crypto.subtle` is available globally in Edge Runtime.

---

## G-ERR-014: `node -e` with Unix `/c/` Paths Double-Drive-Prefix Bug
**Date**: 2026-04-24 | **Tags**: #windows #node #bash #paths

When running `node -e "..."` in Git Bash on Windows, Node.js does NOT recognize Unix-style absolute paths like `/c/Users/leooa/...` — it treats `/c/` as a relative directory in the current drive, producing `C:\c\Users\leooa\...` (ENOENT). Silent failure because the tool-health log suppresses chronic Bash streaks.

**Symptoms** (from `logs/tool-failures.jsonl`):
```
Error: ENOENT: no such file or directory, open 'C:\c\Users\leooa\.claude\logs\action-graph-stats.jsonl'
```
Triggered by: `node -e "fs.readFileSync('/c/Users/leooa/.claude/...')"`

**Fix — pass paths via env var or `$HOME`, resolved inside Node:**
```bash
# ✓ Correct — use process.env.HOME (Node normalizes it)
node -e "const fs = require('fs'); const path = require('path'); \
         const p = path.join(process.env.HOME || require('os').homedir(), '.claude/logs/action-graph-stats.jsonl'); \
         console.log(fs.readFileSync(p, 'utf8'));"

# ✓ Correct — pass path as argv, shell expands $HOME first
node -e "console.log(require('fs').readFileSync(process.argv[1], 'utf8'))" "$HOME/.claude/logs/action-graph-stats.jsonl"

# ✗ Wrong — literal '/c/...' inside node script string
node -e "require('fs').readFileSync('/c/Users/leooa/.claude/...', 'utf8')"
```

**Also wrong**: hardcoding `C:/Users/...` in a `node -e` string without escaping backslashes on Windows.

**Prevention rule**: Never hardcode absolute paths inside `node -e` strings. Always resolve them through `os.homedir()`, `process.env.HOME`, or pass them as argv.

---

