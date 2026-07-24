---
name: next-upgrade
description: Upgrade Next.js to the current stable 16.x (security floor 16.2.6 — May 2026 release; head 16.2.10 as of Jul 2026) following the official migration guide and codemods. Surfaces the May 2026 security advisory automatically — any project on next < 16.2.6 has unpatched CVEs.
argument-hint: "[target-version]"
version: 2.0.0
---

# Upgrade Next.js

Upgrade the current project to **the current stable Next.js 16.x** (16.2.10 as of 2026-07-04 — verify with `npm view next dist-tags.latest`). The May 2026 release closed 13 security advisories and set the floor: never leave a production project below **16.2.6** (15.x floor 15.5.18; 15.x backport head 15.5.20). The floor is the minimum, not the target — install the head.

## Current target (verify at execute time)

| Package | Target | Reason |
|---|---|---|
| `next` | `^16.2.6` (floor) — install latest 16.x | **Security floor** from the May 2026 release; head is 16.2.10 (Jul 2026) |
| `react` | `^19.2.7` | Latest stable, paired with Next 16 |
| `react-dom` | `^19.2.7` | Same |
| `@types/react` / `@types/react-dom` | `latest` | Always pin to latest types |

16.2.6 is the *floor*, not the target — run `npm view next dist-tags.latest` first and install that. (Also current as of Jul 2026: Node 20 is EOL upstream even though Next's minimum is still 20.9+ — prefer Node 22/24; 16.3 is in preview via `next@preview`.)

## Step 0 — Security advisory check (DO THIS FIRST)

Read `package.json`. If current `next` version is **< 16.2.6**:

> **This upgrade is security-driven.** The May 2026 release patches CVE-2026-29057 (HTTP-proxy request smuggling in rewrites), middleware/proxy bypass via segment-prefetch routes, dynamic-route parameter injection bypass, DoS via Cache Components connection exhaustion, SSRF, cache poisoning, and XSS — 13 advisories total. Patching is the only complete mitigation; there are no workarounds for several of them.
>
> See [Vercel May 2026 security release notes](https://vercel.com/changelog/next-js-may-2026-security-release).

State this risk explicitly to the user before proceeding so they understand the upgrade is non-optional.

## Step 1 — Detect current state

Read `package.json` for the current `next`, `react`, `react-dom`, and `@types/react*` versions. Note the gap between current and target. If skipping a major version (e.g. 14 → 16), upgrade incrementally — 14 → 15 → 16 — running codemods between each step. The tooling assumes one major hop at a time.

## Step 2 — Fetch the current upgrade guide

Use WebFetch on `https://nextjs.org/docs/app/guides/upgrading/codemods` to confirm the codemod list hasn't changed since this skill was written. Also pull the version-specific guides for the upgrade path:

- v16: <https://nextjs.org/docs/app/guides/upgrading/version-16>
- v15: <https://nextjs.org/docs/app/guides/upgrading/version-15>
- v14: <https://nextjs.org/docs/app/guides/upgrading/version-14>

## Step 3 — Run codemods

```bash
npx @next/codemod@latest <transform> <path>
```

Common transforms (verify list at execute time — Next ships new codemods regularly):

| Transform | Purpose | Introduced |
|---|---|---|
| `next-async-request-api` | Updates `params`/`searchParams`/`cookies()`/`headers()` to async | v15 |
| `next-request-geo-ip` | Migrates `request.geo` and `request.ip` to `geolocation()` / `ipAddress()` | v15 |
| `next-dynamic-access-named-export` | Transforms `next/dynamic` imports for named exports | v15 |
| `next-middleware-to-proxy` | Renames `middleware.ts` → `proxy.ts` and updates exports | v16 |
| `next-cache-components-migration` | Converts `unstable_cache` → `'use cache'` directive (run only if enabling Cache Components) | v16 |

Run each codemod on the relevant directory (typically `./src` or `./app`). Review the diff per codemod — they're not always 100% accurate on edge cases like ternary destructuring of `params`.

## Step 4 — Bump dependencies

```bash
npm install next@latest react@latest react-dom@latest
npm install -D @types/react@latest @types/react-dom@latest
```

If on yarn / pnpm / bun, swap the install command. Don't pin to a single patch version unless the project requires it — `^16.2.6` keeps you on the LTS line.

## Step 5 — Manual config review

Open `next.config.{js,ts}` and check for:

- `experimental.ppr: true` → replace with top-level `cacheComponents: true` (if migrating to Cache Components — this is opt-in)
- Any deprecated `experimental.*` flags called out in the v16 upgrade guide
- `images.domains` (deprecated since v15) → confirm migrated to `images.remotePatterns`

If you have a `middleware.ts` file at the project root and the codemod missed it, rename to `proxy.ts` and update the export. The runtime alias still resolves `middleware.ts` for one major version, but new docs reference `proxy`.

## Step 6 — Build + test

```bash
npm run build
npm run dev   # smoke-test routing, RSC boundaries, dynamic routes
```

Watch for:
- Hydration mismatch warnings (often surface async API misuse the codemod missed)
- "Cannot read properties of undefined" in `app/**/page.tsx` — usually `params` not awaited
- Build errors mentioning `route.ts` exports — runtime/edge config moved in v15+

## Step 7 — Post-upgrade audit

```bash
npm audit
npm audit fix   # only if changes are limited to dev dependencies
```

If `npm audit` flags transitive deps with CVEs (especially in `webpack`, `postcss`, `@swc/*`), open the audit report and decide whether `npm audit fix --force` is safe — it can downgrade major versions.

## Step 8 — Commit and verify deploy

Commit as a single atomic upgrade (don't bundle feature work):

```
chore(deps): upgrade Next.js to 16.2.6 LTS (May 2026 security release)

- next 14.x → 16.2.6
- react 18.x → 19.2.6
- ran codemods: next-async-request-api, next-middleware-to-proxy
- closed 13 advisories incl. CVE-2026-29057
```

Then deploy to a preview environment first. The Cache Components and middleware/proxy changes can surface as 5xx in production if the build looked clean but a runtime path was missed — verify against the live preview URL before promoting.

## Sources

- [Vercel May 2026 security release](https://vercel.com/changelog/next-js-may-2026-security-release)
- [Next.js v16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js codemods](https://nextjs.org/docs/app/guides/upgrading/codemods)
- [endoflife.date / Next.js LTS schedule](https://endoflife.date/nextjs)
