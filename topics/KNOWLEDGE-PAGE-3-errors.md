# Knowledge Store — Page 3: Errors (type: error)

> Mistakes to avoid. Each entry includes what went wrong, why, and what to do instead.

---

## KNOWLEDGE-047: Grep Path Parameter
**Date**: 2026-02-27 | **Type**: error | **Tags**: #tools #grep #api

Grep tool uses `path` param, NOT `file_path`. Mixing them causes silent failures — Grep ignores unknown params and searches the entire working directory. Read tool uses `file_path`, creating muscle memory that bleeds into Grep calls.

---

## KNOWLEDGE-048: Glob for Filename Search
**Date**: 2026-02-27 | **Type**: error | **Tags**: #tools #glob #search

Use Glob with pattern for filenames (`**/utils.ts`), not Grep. Grep with common names returns every file containing that string as text, not files named that. Glob = find by name, Grep = find content inside files.

---

## KNOWLEDGE-049: Windows Path Quoting
**Date**: 2026-02-27 | **Type**: error | **Tags**: #windows #bash #paths

Windows paths with spaces need double quotes: `cd "C:/Users/My User/projects"`. Use `~` shorthand when possible to avoid space issues.

---

## KNOWLEDGE-050: Unix Syntax on Windows
**Date**: 2026-02-27 | **Type**: error | **Tags**: #windows #bash #syntax

Claude Code runs bash (Git Bash/MSYS2) on Windows, not cmd.exe. Use forward slashes, `/dev/null`, `cat`, `ls`, `cp`, `rm`, `grep` — not Windows equivalents. Dedicated tools (Read, Grep, Glob) handle path translation automatically.

---

## KNOWLEDGE-051: last: Pseudo-class Trap with Wrappers
**Date**: 2026-03-09 | **Type**: error | **Tags**: #tailwind #css #pseudo-class

When items are individually wrapped in components (AnimateIn, Framer Motion), every item is `:last-child` of its own wrapper. `last:mb-0` zeros ALL margins, not just the final item. Fix: remove `last:mb-0` entirely when items are individually wrapped. Same applies to `first:`, `odd:`, `even:`.

**Related**: KNOWLEDGE-068

---

## KNOWLEDGE-052: Sequelize toJSON Double Cast Intentional
**Date**: 2026-03-09 | **Type**: error | **Tags**: #sequelize #typescript #orm

`as unknown as Record<string, unknown>` after `.toJSON()` is intentional, not a code smell. Model interfaces lack string index signatures. The double cast bridges Sequelize's type system to generic object handling. Don't remove it.

---

## KNOWLEDGE-053: Stale .next Cache from Concurrent Build+Dev
**Date**: 2026-03-11 | **Type**: error | **Tags**: #nextjs #build #cache

Running `npm run build` while dev server is active corrupts `.next/chunks` → `MODULE_NOT_FOUND`. Fix: `taskkill //F //IM "node.exe"` → `rm -rf .next` → `npm run dev`. Prevention: always stop dev server before building.

---

## KNOWLEDGE-054: backdrop-blur on Sticky = Scroll Jank
**Date**: 2026-03-13 | **Type**: error | **Tags**: #css #performance #scroll #backdrop-filter

`backdrop-filter: blur()` on `sticky`/`fixed` elements re-composites blur on every scroll frame — most expensive scroll op. Fix: solid background instead. Only use backdrop-filter on static elements (overlays, modals) or elements that don't move on scroll.

**Related**: KNOWLEDGE-015

---

## KNOWLEDGE-055: Framer Motion whileInView + animate Conflict
**Date**: 2026-03-15 | **Type**: error | **Tags**: #framer-motion #animation #react

`animate` prop is silently ignored when `whileInView` is also set. Fix: TWO separate render paths — one with `whileInView` (normal), one with plain `animate` (fallback). Never combine both on the same `motion.div`.

**Related**: KNOWLEDGE-041, KNOWLEDGE-073

---

## KNOWLEDGE-056: firecrawl_scrape Parameter Types
**Date**: 2026-04-12 | **Type**: error | **Tags**: #mcp #firecrawl #api #parameters

`firecrawl_scrape` requires `formats` as an actual JSON array (`["markdown"]`), NOT a stringified array (`"[\"markdown\"]"`). Same for `onlyMainContent` — must be boolean `true`, not string `"true"`. Causes MCP error -32602 parameter validation failure. Repeated 3 times in same session before catching it.

**Fix**: Always pass arrays as arrays and booleans as booleans to MCP tools — JSON types, not string representations.

---

## KNOWLEDGE-057: create-next-app Rejects Capital Letters in Project Name
**Date**: 2026-04-12 | **Type**: error | **Tags**: #nextjs #create-next-app #naming

`create-next-app` refuses names with capital letters — npm naming restriction. "Anniversary" fails with: "name can no longer contain capital letters". Workaround: use lowercase temp name (`anniversary-site`), bootstrap there, then move/rename files. NOTE: `mv` to `/c/tmp/trash/` can fail with "Permission denied" if `/c/tmp/` doesn't exist — create it first with `mkdir -p`.

---

## KNOWLEDGE-058: Next.js Edge Runtime Cannot Use Node.js Crypto
**Date**: 2026-04-12 | **Type**: error | **Tags**: #nextjs #edge-runtime #middleware #crypto #security

Next.js middleware runs in Edge Runtime, which does NOT have access to the Node.js `crypto` module. Attempting to use `crypto.createHmac()` etc. throws at runtime. Must use the Web Crypto API instead:
```ts
const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign'])
const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
```
`crypto.subtle` is available globally in Edge Runtime.

---

## KNOWLEDGE-059: `node -e` with Unix `/c/` Paths Double-Drive-Prefix Bug
**Date**: 2026-04-24 | **Type**: error | **Last audited**: 2026-04-24 | **Tags**: #windows #node #bash #paths

When running `node -e "..."` in Git Bash on Windows, Node.js does NOT recognize Unix-style absolute paths embedded **inside the script string** — e.g. `'/c/Users/leooa/...'` is treated as a relative path, producing `C:\c\Users\leooa\...` (ENOENT). Silent failure because the tool-health log suppresses chronic Bash streaks.

**Symptoms** (from `logs/tool-failures.jsonl`):
```
Error: ENOENT: no such file or directory, open 'C:\c\Users\leooa\.claude\logs\action-graph-stats.jsonl'
```
Triggered by: `node -e "fs.readFileSync('/c/Users/leooa/.claude/...')"`

### Why argv works but string-literals don't

Git Bash (MSYS2) auto-converts `/c/...` → `C:/...` when passing **argv** to native Windows executables like `node.exe`. It does NOT rewrite the contents of `-e` script strings. Verified 2026-04-24:

```bash
$ node -e 'console.log(process.argv[1])' "$HOME/.claude/logs/hook-health.jsonl"
C:/Users/leooa/.claude/logs/hook-health.jsonl    # ← argv mangled, safe
```

### Safe patterns (all three verified in tree)

```bash
# ✓ argv-passed — Git Bash mangles /c/ → C:/ before Node sees it
node -e "console.log(require('fs').readFileSync(process.argv[1], 'utf8'))" "$HOME/.claude/logs/x.json"

# ✓ cygpath + String.raw — explicit Windows path inside template literal
WIN_PATH=$(cygpath -w "$HOME/.claude/settings.json")
node -e "JSON.parse(require('fs').readFileSync(String.raw\`$WIN_PATH\`,'utf8'))"

# ✓ env-resolved inside Node — no path in the script
node -e "const p = require('path').join(require('os').homedir(), '.claude/logs/x.json'); \
         console.log(require('fs').readFileSync(p, 'utf8'))"
```

### Unsafe pattern

```bash
# ✗ Literal /c/... inside single-quoted script — no argv mangling, ENOENT
node -e 'require("fs").readFileSync("/c/Users/leooa/.claude/x.json", "utf8")'

# ✗ Hardcoded C:/... with unescaped backslashes — Node parses weirdly
node -e "require('fs').readFileSync('C:\Users\leooa\...', 'utf8')"
```

**Prevention rule**: Never hardcode absolute paths inside `node -e` script strings. Always (a) pass via argv and read `process.argv[n]`, (b) round-trip through `cygpath -w` + `String.raw\`...\``, or (c) resolve inside Node via `os.homedir()` / `process.env.HOME`.

### 2026-04-24 audit (full sweep)

Scanned all `node -e` call sites in `hooks/` and `scripts/` — **19/19 safe**:
- `hooks/session-start.sh` ×6 (all argv-passed)
- `hooks/session-stop.sh` ×4 (argv or stdin)
- `scripts/auto-continue.sh` ×1 (tmpdir output only, no path)
- `scripts/progressive-learning/precompact-reflect.sh` ×2 (stdin + argv)
- `scripts/smoke-test.sh` ×6 (cygpath + `String.raw`)

Regression guard added to `scripts/smoke-test.sh` (section 10) — fails smoke if any script introduces a `/c/` or literal `C:/` path inside a `node -e` string.

---

