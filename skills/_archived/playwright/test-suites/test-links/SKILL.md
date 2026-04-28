---
name: test-links
description: Test link integrity, navigation, and semantics. Use when user wants to check for broken links, test navigation, verify external links, or audit link behavior.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Link Integrity & Navigation

Run 23 test cases across 3 parallel agents covering internal links, external links, and link behavior/semantics.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-links/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Pre-check: Discover Links

```bash
playwright-cli -s=links-discovery open "$URL"
playwright-cli -s=links-discovery run-code "async page => {
  const links = await page.locator('a[href]').all();
  const hrefs = await Promise.all(links.map(l => l.getAttribute('href')));
  const origin = new URL(page.url()).origin;
  const internal = hrefs.filter(h => h && (h.startsWith('/') || h.startsWith(origin)));
  const external = hrefs.filter(h => h && h.startsWith('http') && !h.startsWith(origin));
  return { total: hrefs.length, internal: internal.length, external: external.length };
}"
playwright-cli -s=links-discovery snapshot --filename="$OUTDIR/snapshots/links-discovery.yaml"
playwright-cli -s=links-discovery close
```

## Parallel Execution — 3 Subagents

### Agent 1: Internal Links (`-s=links-internal`)

Tests all internal link targets.

```bash
playwright-cli -s=links-internal open "$URL"
playwright-cli -s=links-internal tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-L1 | All internal links resolve (no 404s) | `run-code` to collect all internal hrefs, fetch each with HEAD request, check for 200/301/302 |
| TC-L2 | Internal links use correct paths | `run-code` to verify links are well-formed (no double slashes, no broken relative paths) |
| TC-L3 | Navigation menu links work | Find nav element, click each link, verify page loads (no error) |
| TC-L4 | Footer links work | Find footer element, check all links resolve |
| TC-L5 | Sidebar links work | If sidebar exists: check all links resolve |
| TC-L6 | In-content links work | Find links within main content area, verify they resolve |
| TC-L7 | CTA buttons link to correct targets | Find primary CTA elements (buttons with href or onclick navigation), verify targets exist |
| TC-L8 | Logo links to homepage | Find logo/brand link, verify it links to `/` or homepage URL |

```bash
playwright-cli -s=links-internal tracing-stop
playwright-cli -s=links-internal close
```

### Agent 2: External Links (`-s=links-external`)

Tests external link behavior and security.

```bash
playwright-cli -s=links-external open "$URL"
playwright-cli -s=links-external tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-L9 | External links open in new tab | `run-code` to find external links, verify `target="_blank"` attribute |
| TC-L10 | External links have `rel="noopener noreferrer"` | `run-code` to find external links with `target="_blank"`, verify `rel` includes `noopener` and `noreferrer` |
| TC-L11 | External links not broken (HEAD check) | `run-code` to fetch external URLs with HEAD request, check for non-error status codes |
| TC-L12 | Social media links correct | `run-code` to find links to known social platforms (twitter, facebook, linkedin, etc.), verify they point to valid profiles |
| TC-L13 | No links to HTTP (should be HTTPS) | `run-code` to find any links starting with `http://` (not `https://`), flag as insecure |

```bash
playwright-cli -s=links-external tracing-stop
playwright-cli -s=links-external close
```

### Agent 3: Link Behavior (`-s=links-behavior`)

Tests link semantics, visual states, and special link types.

```bash
playwright-cli -s=links-behavior open "$URL"
playwright-cli -s=links-behavior tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-L14 | Links have descriptive text | `run-code` to find links with generic text: "click here", "here", "read more", "link", "more" |
| TC-L15 | Links visually distinguishable from text | `run-code` to compare link styles (color, underline) vs paragraph text — must be distinct |
| TC-L16 | Visited links have different style | `run-code` to check if `:visited` styles are defined (different color from unvisited) |
| TC-L17 | Links have hover state | `hover` over links, `run-code` to check style changes on hover |
| TC-L18 | Links have focus state | Tab to links, `run-code` to check focus outline/indicator is visible |
| TC-L19 | Anchor links scroll to correct section | Find anchor links (`href="#..."`) , click them, verify scroll position targets correct element |
| TC-L20 | Download links have `download` attribute | `run-code` to find links to downloadable file types (.pdf, .zip, .doc), check for `download` attribute |
| TC-L21 | Email links use `mailto:` | `run-code` to find links containing email addresses, verify they use `mailto:` protocol |
| TC-L22 | Phone links use `tel:` | `run-code` to find links containing phone numbers, verify they use `tel:` protocol |
| TC-L23 | No orphan pages | Navigate all internal links discovered, build a page graph, check all pages are reachable from main nav |

```bash
playwright-cli -s=links-behavior tracing-stop
playwright-cli -s=links-behavior close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include a link inventory:
- Total links found: N
- Internal: N (N broken)
- External: N (N broken)
- Special: N mailto, N tel, N download

Group results by category:
1. Internal Links (TC-L1 through TC-L8)
2. External Links (TC-L9 through TC-L13)
3. Link Behavior (TC-L14 through TC-L23)

## Cleanup

```bash
playwright-cli -s=links-discovery close 2>/dev/null
playwright-cli -s=links-internal close 2>/dev/null
playwright-cli -s=links-external close 2>/dev/null
playwright-cli -s=links-behavior close 2>/dev/null
```
