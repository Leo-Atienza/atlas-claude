# Verification Before Completion

> Source: [obra/superpowers](https://github.com/obra/superpowers)

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Types pass | Type checker output: 0 errors | "Should pass", previous run |
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, "looks good" |
| Bug fixed | Original symptom resolved | "Code changed, should be fixed" |
| Requirements met | Line-by-line checklist verified | "Tests pass" alone |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit without running type checks and build
- Relying on partial verification
- Thinking "just this once"
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence != evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter != compiler |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Type checking:**
```
Correct:  [Run type checker] [See: 0 errors] "Types pass"
Wrong:    "Should compile fine" / "Looks correct"
```

**Build:**
```
Correct:  [Run build command] [See: exit 0] "Build succeeds"
Wrong:    "Types passed so build should work"
```

**Feature completion:**
```
Correct:  Re-read requirements -> Create checklist -> Verify each -> Report
Wrong:    "Tests pass, feature is complete"
```

## When to Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction about work state
- Committing code
- Creating pull requests
- Moving to next task

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
