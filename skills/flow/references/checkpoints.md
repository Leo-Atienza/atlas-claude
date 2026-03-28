# Flow Checkpoint Protocol

## Checkpoint Types

### checkpoint:human-verify (90% of checkpoints)
Claude completes work, human confirms it works visually or functionally.

**Pattern:**
```markdown
<task type="checkpoint:human-verify">
Implement the login form with email/password fields and submit button.

After implementation, start the dev server and present the URL for verification.
</task>
```

**Flow:**
1. Executor completes the task
2. Executor starts dev server (if applicable) BEFORE presenting checkpoint
3. Returns checkpoint to orchestrator: `CHECKPOINT: Please verify {what} at {where}`
4. User verifies and responds (approve / request changes)
5. If approved: executor continues to next task
6. If changes requested: executor implements changes, re-presents

**Golden Rule:** Claude automates everything possible BEFORE the checkpoint. Never present a checkpoint that says "now run the server" — run it first.

### checkpoint:decision (9% of checkpoints)
Human makes a choice that affects implementation direction.

**Pattern:**
```markdown
<task type="checkpoint:decision">
Implement payment processing.

Decision needed: Which payment provider to use?
Options:
  A) Stripe (recommended — best docs, widest adoption)
  B) PayPal (wider consumer reach)
  C) Both (more work, more coverage)
</task>
```

**Flow:**
1. Executor reaches decision point
2. Returns checkpoint with options + recommendation: `DECISION NEEDED: {question}. Options: A) ... B) ... C) ... Recommended: A because {reason}`
3. User selects option
4. Executor continues with selected option
5. Decision recorded in state.yaml and CONTEXT.md

### checkpoint:human-action (1% of checkpoints)
Truly unavoidable manual step — rare.

**Pattern:**
```markdown
<task type="checkpoint:human-action">
Configure OAuth application in Google Cloud Console.

Setup guide:
1. Go to console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Set redirect URI to http://localhost:3000/auth/callback
4. Copy Client ID and Client Secret

Provide: CLIENT_ID and CLIENT_SECRET
</task>
```

**Flow:**
1. Executor provides clear setup guide
2. Returns checkpoint: `HUMAN ACTION NEEDED: {what}. Follow the guide above, then provide {values}`
3. User completes action, provides values
4. Executor continues with provided values

## Auto-Advance Mode

When `config.yaml` has `workflow.auto_advance: true`:

| Checkpoint Type | Behavior |
|---|---|
| `human-verify` | Auto-approved (skip user interaction) |
| `decision` | Auto-selects recommended option (Option A unless otherwise marked) |
| `human-action` | **Still stops** — cannot be automated (auth gates, API keys) |

## Checkpoint Handling in Wave Execution

When executing plans in parallel waves:
- **Autonomous plans** (no checkpoints): Execute fully without stopping
- **Plans with checkpoints**: Pause at checkpoint, return to orchestrator
- **Wave continues**: Other plans in the same wave continue executing while one is paused
- **Resume**: When user responds to checkpoint, a new executor subagent is spawned to continue from the checkpoint

## Checkpoint State Tracking

Checkpoints are tracked in state.yaml:

```yaml
position:
  status: checkpoint  # special status
  checkpoint:
    type: human-verify
    plan: "01-02-PLAN.md"
    task: 3
    message: "Verify login form at http://localhost:3000/login"
    presented_at: "2026-03-16T15:00:00Z"
```

After checkpoint resolution, status returns to `executing`.
