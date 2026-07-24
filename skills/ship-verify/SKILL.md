---
name: ship-verify
description: Generalized 'verify before declaring done' workflow. Use whenever about to claim a build/ship/deploy/commit task is complete. Verifies the actual artifact exists, is correct version, and is at the expected path — never trusts UP-TO-DATE messages, success-only outcomes, or "build succeeded" without checking the file. Especially important for APK/IPA builds, Vercel/Netlify deploys, gh-pages, npm publishes, and git push operations. Triggers on /ship-verify, "is it actually deployed?", "verify this shipped", "double-check the build worked", or autonomously before saying "done" on any side-effecting task.
---

# /ship-verify — Verify before declaring done

Execute the relevant section based on what was shipped. Never trust the success message alone.

---

## Why this exists

The Claude Code Insights report (2026-05-13) flagged repeated "shipping" friction:
- APK build reported `UP-TO-DATE` despite the output file being missing
- Wrong APK folder (debug vs release) handed to user
- v1.0.10 APK shipped that didn't match the Stitch design
- Stale debug builds presented as fresh

Root cause: trusting the build tool's exit code without checking the actual artifact. **A green exit code is necessary but not sufficient.** This skill is the structured "did the side effect actually happen?" pass.

---

## Step 1 — Identify what was shipped

Pick the matching section. If multiple apply, run each in order.

| Artifact type | Section |
|---------------|---------|
| Build artifact (APK, IPA, .exe, dist/, .whl) | A |
| Web deploy (Vercel, Netlify, gh-pages, Cloudflare Pages) | B |
| Test suite "passing" claim | C |
| Git operation (commit, push, PR merge) | D |
| Android APK ship (combined A+B+D, project-specific) | E |
| npm/pip/gem package publish | F |

---

## Section A — Build artifacts

For any "I built X" claim:

1. **File exists at expected path?**
   ```bash
   test -f <expected/path> && echo "EXISTS" || echo "MISSING"
   ```
2. **Non-zero size?**
   ```bash
   stat -c %s <expected/path>  # Linux/Mac
   ls -la <expected/path>       # Windows-friendly
   ```
   Flag anything <1KB as suspicious.
3. **Recent mtime?** (built within last 5 minutes)
   ```bash
   find <expected/path> -mmin -5 -print  # empty output = file is older than 5 min
   ```
   If empty, the build was a NO-OP (UP-TO-DATE lie). Re-run with `--no-cache` or equivalent.
4. **Right variant?** Distinguish debug vs release explicitly.
   - Flutter: `build/app/outputs/flutter-apk/app-debug.apk` vs `app-release.apk`
   - iOS: `build/.../Debug-iphoneos/` vs `Release-iphoneos/`
   - Cargo: `target/debug/` vs `target/release/`
5. Report to user:
   ```
   ✅ Built <variant>: <path> (<size>, mtime <ago>)
   ```
   or
   ```
   ❌ Build claim was wrong: <reason>. Re-running.
   ```

---

## Section B — Web deploys

### B0 — Vercel / web deploy pre-flight (run BEFORE the deploy)

The 2026-07 insights sweep caught three deploy blockers late (`5e1fa017`: edge-function over size limit, OG-image overflow) that were all visible locally. Before any `vercel --prod` / `netlify deploy`:

1. **Full local build, and READ the output** — not just the exit code. Check per-function bundle sizes against the platform limits (Vercel edge functions 1–4MB depending on plan, serverless 250MB unzipped). A function over the limit builds fine locally and only fails at deploy.
   ```bash
   <build-cmd> 2>&1 | tee /tmp/build-out.txt
   grep -iE "first load|size|kB|MB" /tmp/build-out.txt | tail -20
   ```
2. **Run the test suite** (Section C discipline — re-run, don't cite).
3. **OG-image route check** — if an OG/social-image route exists (`/api/og`, `opengraph-image.*`), render it once locally with the longest realistic title in the dataset. Text overflow at deploy time was a real blocker.
4. **CSS class rename check** — for any new/renamed CSS class, grep existing selectors AND test files for the old name before renaming (`.index-head` collision class, same sweep):
   ```bash
   grep -rn "<old-class>" --include="*.css" --include="*.scss" --include="*.tsx" --include="*.test.*" .
   ```

Only after B0 passes, deploy — then verify with the post-flight below.

For any "deployed to X" claim:

1. **Resolve the live URL** (don't accept "should be at" — check).
2. **HTTP HEAD probe**:
   ```bash
   curl -sI <url> | head -5
   ```
   Must return `HTTP/2 200` (or 304 with caching). 404, 500, or timeout = NOT deployed.
3. **Content-hash match** (when possible — verifies the right artifact deployed, not just any artifact):
   ```bash
   curl -sL <url> | sha256sum
   sha256sum <local-equivalent-file>
   # both hashes must match
   ```
4. **Deploy ID / commit SHA** match the local commit (Vercel: `vercel ls`; Netlify: `netlify status`).
5. Report:
   ```
   ✅ Deployed: <url> | commit <sha> | hash matches local
   ```

---

## Section C — Test "passing" claims

For any "tests pass" claim:

1. **Re-run the test command** (do not trust prior output):
   ```bash
   <test-cmd> 2>&1 | tail -20
   ```
2. **Exit code is 0**:
   ```bash
   echo "exit=$?"
   ```
3. **Pass count ≥ baseline**: if there's a previous baseline (handoff doc, last commit message), the new count must equal or exceed it. Regression = NOT passing.
4. **No skipped tests masquerading as pass**: grep for `skip`, `pending`, `xit`, `it.skip` and report counts.
5. Report:
   ```
   ✅ Tests: <pass>/<total> passing | exit 0 | baseline <prev> (delta +<N>)
   ```

---

## Section D — Git operations

For any "I pushed/merged/committed" claim:

1. **Local SHA exists**:
   ```bash
   git log -1 --format=%H
   ```
2. **Remote tracks it** (for push claims):
   ```bash
   git rev-parse @{u} 2>&1
   git status -sb | head -3
   ```
   `Your branch is up to date with 'origin/...'` means push landed.
3. **PR is in correct state** (for PR merge claims):
   ```bash
   gh pr view <num> --json state,mergedAt,mergeCommit
   ```
4. **Branch tracking is correct** (for new branch claims):
   ```bash
   git branch -vv | grep "$(git branch --show-current)"
   ```

---

## Section E — Android APK ship (combined)

The full a private project pipeline from `a private project/CLAUDE.md`:

```bash
# 1. Build
flutter build apk --release
# Verify (Section A): file exists at build/app/outputs/flutter-apk/app-release.apk, mtime fresh

# 2. Copy
cp build/app/outputs/flutter-apk/app-release.apk \
   ~/Documents/personal-projects/expense-tracker-landing/public/downloads/a private project.apk
# Verify: target file exists, sha1sum matches source

# 3. Commit + push (in landing repo)
cd ~/Documents/personal-projects/expense-tracker-landing
git add public/downloads/a private project.apk
git commit -m "chore: update APK to $(grep 'version:' ../a private project/pubspec.yaml | head -1 | awk '{print $2}')"
git push
# Verify (Section D): branch up to date with origin

# 4. Deploy to Vercel
vercel --prod --yes
# Verify (Section B): https://the user-a private project.vercel.app/downloads/a private project.apk returns 200

# 5. Final sha1sum verify
LOCAL_SHA=$(sha1sum build/app/outputs/flutter-apk/app-release.apk | awk '{print $1}')
REMOTE_SHA=$(curl -sL https://the user-a private project.vercel.app/downloads/a private project.apk | sha1sum | awk '{print $1}')
[ "$LOCAL_SHA" = "$REMOTE_SHA" ] && echo "✅ SHIPPED: hashes match" || echo "❌ HASH MISMATCH: deploy didn't propagate"
```

If any step fails, **stop and report which step**. Do not say "shipped" until step 5 prints the green checkmark.

---

## Section F — Package publish

For any "published to npm/pip/etc." claim:

1. **Registry returns the new version**:
   ```bash
   npm view <package>@<version>     # npm
   pip index versions <package>     # pip
   gem list <package> --remote      # rubygems
   ```
2. **Version matches what was published** (not a stale cached one).
3. **Install in a clean env succeeds**:
   ```bash
   npx <package>@<version> --version
   ```

---

## Anti-patterns to flag (do not do these)

- ❌ "Build succeeded, file should be at X" — without checking
- ❌ "Tests pass" — citing only the previous run
- ❌ "Deploy triggered" — without curling the URL
- ❌ Trusting `Gradle UP-TO-DATE` after a code change (it's lying about the cache)
- ❌ Saying "done" with no artifact verification at all

## When NOT to use this skill

- The "done" claim is for a research/exploration task with no artifact (just a written answer)
- The user explicitly said "I'll verify it myself, just code"
- The change is mid-development with no shipping intent yet

## Reuse with /handoff

`/handoff` (SK-110) already does build + test + push verification before generating the handoff doc. This skill is the more general / lower-level version that can be invoked any time, not just at session end. Use `/ship-verify` mid-session whenever about to make a "shipped" claim; let `/handoff` handle end-of-session.
