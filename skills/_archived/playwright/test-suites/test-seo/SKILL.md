---
name: test-seo
description: Run SEO and meta data testing on a URL. Use when user wants to test SEO, meta tags, Open Graph, structured data, sitemap, robots.txt, or crawlability.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# SEO & Meta Data

Run 27 SEO test cases across 3 parallel agents covering meta tags, content structure, and technical SEO.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-seo/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 3 Subagents

### Agent 1: Meta (`-s=seo-meta`)

Tests meta tags and head content.

```bash
playwright-cli -s=seo-meta open "$URL"
playwright-cli -s=seo-meta tracing-start
playwright-cli -s=seo-meta snapshot --filename="$OUTDIR/snapshots/seo-meta-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-SEO1 | `<title>` present, unique, 50-60 chars | `eval "document.title"` — verify non-empty, length in range |
| TC-SEO2 | `<meta name="description">` 150-160 chars | `run-code` to get meta description content, check length |
| TC-SEO3 | Open Graph tags present | `run-code` to check for `og:title`, `og:description`, `og:image`, `og:url` meta tags |
| TC-SEO4 | Twitter Card tags present | `run-code` to check for `twitter:card`, `twitter:title`, `twitter:description` meta tags |
| TC-SEO5 | Canonical URL | `run-code` to find `<link rel="canonical">`, verify href is valid |
| TC-SEO6 | Favicon present | `run-code` to find `<link rel="icon">` or `<link rel="shortcut icon">` |
| TC-SEO7 | Viewport meta tag set correctly | `run-code` to check `<meta name="viewport">` content includes `width=device-width` |
| TC-SEO8 | `<html lang>` attribute | `eval "document.documentElement.lang"` — verify present |
| TC-SEO9 | hreflang tags for multi-language | `run-code` to find `<link rel="alternate" hreflang="...">` tags if multi-language site |

```bash
playwright-cli -s=seo-meta tracing-stop
playwright-cli -s=seo-meta close
```

### Agent 2: Content (`-s=seo-content`)

Tests content structure and semantics for SEO.

```bash
playwright-cli -s=seo-content open "$URL"
playwright-cli -s=seo-content tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-SEO10 | Single `<h1>` per page | `run-code`: `document.querySelectorAll('h1').length === 1` |
| TC-SEO11 | Heading hierarchy (no skips) | `run-code` to get all headings in order, verify no level gaps (h1→h3 without h2) |
| TC-SEO12 | Images have descriptive alt text | `run-code` to find images without alt or with empty/generic alt |
| TC-SEO13 | Internal links use descriptive anchor text | `run-code` to find internal links with generic text ("click here", "here", "read more") |
| TC-SEO14 | No broken internal links | `run-code` to collect internal links, fetch each with HEAD, check for 404s |
| TC-SEO15 | Structured data (JSON-LD) present + valid | `run-code` to find `<script type="application/ld+json">`, parse JSON, check for @context and @type |
| TC-SEO16 | Breadcrumb markup | `run-code` to find breadcrumb elements (nav with aria-label="breadcrumb" or BreadcrumbList schema) |
| TC-SEO17 | Content-to-HTML ratio | `run-code` to measure text content length vs total HTML length, flag if ratio < 10% |

```bash
playwright-cli -s=seo-content tracing-stop
playwright-cli -s=seo-content close
```

### Agent 3: Technical (`-s=seo-technical`)

Tests technical SEO and crawlability.

```bash
playwright-cli -s=seo-technical open "$URL"
playwright-cli -s=seo-technical tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-SEO18 | robots.txt accessible | `run-code` to fetch `{origin}/robots.txt`, check for 200 status and valid content |
| TC-SEO19 | sitemap.xml accessible and valid | `run-code` to fetch `{origin}/sitemap.xml`, check for 200 status and valid XML |
| TC-SEO20 | Correct HTTP status codes | Check current page returns 200, test known pages for proper status codes |
| TC-SEO21 | No noindex on important pages | `run-code` to check for `<meta name="robots" content="noindex">` — flag if found on main pages |
| TC-SEO22 | Clean URLs (no query string mess) | Check URL structure is clean: no excessive query params, no session IDs in URLs |
| TC-SEO23 | Mobile-friendly viewport | Verify viewport meta tag has `width=device-width, initial-scale=1` |
| TC-SEO24 | Page loads under 3 seconds | `run-code` to check `performance.timing.loadEventEnd - performance.timing.navigationStart < 3000` |
| TC-SEO25 | No duplicate content indicators | `run-code` to check canonical tag matches current URL, no duplicate title/description |
| TC-SEO26 | 301 redirects (not 302) for permanent moves | `run-code` to follow redirect chain, verify permanent redirects use 301 |
| TC-SEO27 | HTTPS used throughout | Verify page URL is HTTPS, no mixed content (HTTP resources on HTTPS page) |

```bash
playwright-cli -s=seo-technical tracing-stop
playwright-cli -s=seo-technical close
```

## Report Generation

After all 3 agents complete, merge results into `$OUTDIR/report.md`.

Include an SEO scorecard:

| Category | Score | Issues |
|----------|-------|--------|
| Meta Tags | X/9 | ... |
| Content | X/8 | ... |
| Technical | X/10 | ... |
| **Overall** | **X/27** | ... |

Group results:
1. Meta Tags (TC-SEO1 through TC-SEO9)
2. Content Structure (TC-SEO10 through TC-SEO17)
3. Technical SEO (TC-SEO18 through TC-SEO27)

## Cleanup

```bash
playwright-cli -s=seo-meta close 2>/dev/null
playwright-cli -s=seo-content close 2>/dev/null
playwright-cli -s=seo-technical close 2>/dev/null
```
