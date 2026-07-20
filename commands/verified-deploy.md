# /verified-deploy — Deploy with automatic production verification

Execute a full verified deployment pipeline. Do not stop at push — verify production is healthy.

---

## Step 1 — Pre-flight checks

Run in parallel:
1. **Test suite**: Run the full test suite (`npm test` / `npm run test`). Stop entirely if tests fail.
2. **Code scan**: Check for:
   - `console.log` statements that should be removed (ignore intentional server logs)
   - Hardcoded `localhost` URLs
   - Missing env var references (referenced in code but not in `.env` / `.env.local`)
   - Uncommented debug code

Report any issues. Fix automatically if trivial, ask if ambiguous.

## Step 2 — Commit and push

1. `git status` — verify what's being committed
2. Stage relevant files (never stage .env, credentials, secrets)
3. Write a conventional commit message
4. Push to the current branch

## Step 3 — Wait for deployment

**If Vercel MCP is available** (preferred):
1. Use Vercel MCP to find the latest deployment for the current project
2. Poll deployment status every 15 seconds until state is `READY` or `ERROR` (max 5 minutes)
3. On `READY`: extract the deployment URL from the MCP response
4. On `ERROR`: read build logs via Vercel MCP, report the failure, and stop
5. Curl the deployment URL — verify HTTP 200

**Fallback** (no Vercel MCP):
1. Wait 90 seconds for hosting to deploy
2. Curl the production URL — verify HTTP 200
3. If not 200, wait another 60 seconds and retry once

## Step 4 — Endpoint verification

For each API endpoint the project exposes:
1. Send a lightweight test request (GET for read endpoints, minimal POST for write)
2. Verify response status is 2xx
3. Verify response shape matches expected schema (check key fields exist)
4. Log results:

```
| Endpoint              | Status | Response OK | Notes         |
|-----------------------|--------|-------------|---------------|
| GET /                 | 200    | ✓           |               |
| GET /api/health       | 200    | ✓           |               |
| POST /api/session     | 200    | ✓           | 3 results     |
| GET /api/jobs         | 200    | ✓           |               |
```

## Step 5 — Handle failures

If any endpoint fails:
1. Capture the exact error/response
2. Compare local behavior vs production (curl locally if dev server available)
3. Diagnose the difference
4. Implement a fix
5. Restart from Step 1

If the same endpoint fails 3 times, stop and report with all raw output.

## Step 6 — Quality audit (optional)

**If Lighthouse MCP is available**:
1. Run a Lighthouse audit on the deployed production URL
2. Report scores: Performance, Accessibility, SEO, Best Practices
3. Flag any score below 90 as a warning
4. Flag any critical accessibility violations (axe-core)
5. Include scores in the handoff doc

Skip this step if the deployment was a backend-only change with no frontend impact.

## Step 7 — Post-deploy handoff

Run `/handoff` to create the session handoff doc, including:
- What was deployed
- All endpoints verified
- Lighthouse scores (if audit was run)
- Any anomalies observed during verification

---

**Plain English triggers**: "deploy", "deploy to production", "push and verify",
"ship to prod", "verified deploy", "deploy and check"
