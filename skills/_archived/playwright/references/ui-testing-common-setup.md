# Common Setup — UI Testing Suite

## URL Parsing

Extract the target URL from `$ARGUMENTS`. If no URL is provided, default to `http://localhost:3000`.

```
URL="${ARGUMENTS:-http://localhost:3000}"
```

If `$ARGUMENTS` contains flags (e.g., `--baseline`), parse the URL as the first positional argument:
```
URL=$(echo "$ARGUMENTS" | awk '{print $1}')
URL="${URL:-http://localhost:3000}"
```

## Session Naming Convention

All sessions follow the pattern: `-s=<skill>-<subtest>`

Examples:
- `-s=forms-happy` — Form happy path agent
- `-s=a11y-keyboard` — Accessibility keyboard agent
- `-s=sec-headers` — Security headers agent
- `-s=resp-320` — Responsive 320px viewport agent

## Output Directory Creation

Each skill creates its output under `test-results/<skill-name>/<timestamp>/`:

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/<skill-name>/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Session Cleanup

**Always close sessions when done.** Each subagent must close its own session:

```bash
playwright-cli -s=<session-name> close
```

If a skill spawns multiple agents, the parent skill should also run cleanup:

```bash
playwright-cli close-all
```

## Credentials

For flows requiring authentication, credentials come from:
1. `$ARGUMENTS` — e.g., `/test-flows https://app.com user@example.com password123`
2. Environment variables — `$TEST_USER` and `$TEST_PASS`
3. Never hardcode credentials in skills

## Playwright CLI Reference

For full command syntax, see: `playwright-cli/skills/playwright-cli/SKILL.md`

Key commands used across all skills:
- `playwright-cli -s=<name> open <url>` — Open browser with named session
- `playwright-cli -s=<name> snapshot --filename=<path>` — Capture accessibility tree
- `playwright-cli -s=<name> screenshot --filename=<path>` — Capture visual screenshot
- `playwright-cli -s=<name> tracing-start` / `tracing-stop` — Record execution trace
- `playwright-cli -s=<name> run-code "async page => { ... }"` — Execute custom Playwright code
- `playwright-cli -s=<name> close` — Close named session
