# Evidence Capture Patterns

## Tracing

Wrap each test group in a trace for full debugging context:

```bash
# Start trace before test group
playwright-cli -s=<session> tracing-start

# ... perform test actions ...

# Stop trace — saves to .playwright-cli/traces/
playwright-cli -s=<session> tracing-stop
```

Copy trace files to the output directory after stopping:
```bash
cp .playwright-cli/traces/trace-*.trace "$OUTDIR/traces/" 2>/dev/null
cp .playwright-cli/traces/trace-*.network "$OUTDIR/traces/" 2>/dev/null
```

## Screenshots

Take screenshots after significant actions or to capture evidence of issues:

```bash
# Full page screenshot
playwright-cli -s=<session> screenshot --filename="$OUTDIR/screenshots/<descriptive-name>.png"

# Element screenshot
playwright-cli -s=<session> screenshot <ref> --filename="$OUTDIR/screenshots/<element-name>.png"
```

Naming convention: `<test-case-id>-<description>.png`
- `TC-F1-valid-submission.png`
- `TC-A11-tab-order.png`
- `TC-S1-xss-attempt.png`

## Snapshots

Capture accessibility tree snapshots for structural verification:

```bash
playwright-cli -s=<session> snapshot --filename="$OUTDIR/snapshots/<descriptive-name>.yaml"
```

Use snapshots for:
- Baseline comparison (regression testing)
- Structural validation (a11y, SEO)
- Evidence of element presence/absence

## Video Recording

For long flows (authentication, multi-step forms):

```bash
playwright-cli -s=<session> video-start
# ... perform flow ...
playwright-cli -s=<session> video-stop "$OUTDIR/videos/<flow-name>.webm"
```

## Evidence Checklist

Every test group should capture:
1. **Before snapshot** — Initial page state
2. **Action screenshots** — Key interaction moments
3. **After snapshot** — Final page state
4. **Trace** — Full execution trace for debugging
5. **Console logs** — `playwright-cli -s=<session> console` for errors/warnings
