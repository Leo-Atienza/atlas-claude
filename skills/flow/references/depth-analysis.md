# Flow Depth Analysis Reference

## Depth Recommendation Algorithm

When `/flow:start` runs without explicit `--depth`, analyze the task and recommend:

### Step 1: Signal Collection

```
1. SCOPE SIGNALS
   - Grep codebase for keywords from task description
   - Count files likely affected (by module/directory match)
   - Check if task mentions "architecture", "refactor", "new module", "migration"

2. RISK SIGNALS (7-dimension scoring, 1-3 each)
   - Security: auth/crypto/permissions/secrets mentioned?
   - External APIs: third-party integrations, webhooks?
   - Data Model: schema changes, migrations, data transformations?
   - Performance: latency-sensitive, bulk operations, caching?
   - UX: user-facing changes, accessibility, responsive?
   - Compliance: privacy, legal, audit requirements?
   - Infrastructure: deployment, CI/CD, environment changes?

3. AMBIGUITY SIGNALS
   - Are requirements specific (acceptance criteria exist)?
   - Are multiple approaches viable (needs brainstorming)?
   - Is this greenfield or modification of existing?

4. HISTORICAL SIGNALS (if state.yaml exists)
   - Previous phase velocity
   - Previous quality scores
   - Similar past tasks and their depth
```

### Step 2: Scoring

```
files_affected < 4 AND risk_score < 8 AND ambiguity = low  → quick
files_affected < 11 AND risk_score < 14                     → standard
files_affected < 25 OR risk_score < 18                      → deep
files_affected >= 25 OR risk_score >= 18 OR multi_milestone  → epic
```

### Step 3: Presentation

```
Depth Analysis:
  Files likely affected: ~{count}
  Architectural scope: {LOW|MEDIUM|HIGH}
  Risk dimensions: {flagged}/{total} flagged ({names})
  Ambiguity: {LOW|MEDIUM|HIGH}
  Historical velocity: {if available}

  Recommended depth: {level}
  Reason: {one-line explanation}

  Accept? [Y/n/override: quick|standard|deep|epic]
```

## Depth Feature Matrix

### quick
```yaml
initialize:
  config: minimal (depth only)
  state: .flow/quick/{slug}-plan.md
  project_docs: false
  roadmap: false

think:
  brainstorm: skip
  research: skip
  discovery: skip
  plan_verify: false
  risk_assess: false

build:
  execution: direct (single agent, no waves)
  commits: per-task
  deviation_rules: true
  system_wide_test: false

verify:
  goal_backward: false
  multi_agent_review: false
  uat: false

ship:
  compound: offer (if non-trivial)
  retro: skip
  quality_score: skip
```

### standard
```yaml
initialize:
  config: full config.yaml
  state: .flow/state.yaml + STATE.md
  project_docs: false
  roadmap: false

think:
  brainstorm: skip (unless user requests)
  research: parallel (repo-analyst + learnings-researcher)
  discovery: skip (unless user requests)
  plan_verify: optional (plan-checker if enabled in config)
  risk_assess: brief (inline, not full agent)

build:
  execution: single plan or simple parallel
  commits: per-task, incremental
  deviation_rules: true
  system_wide_test: true

verify:
  goal_backward: false
  multi_agent_review: true (from config.yaml agents list)
  uat: optional

ship:
  compound: offer
  retro: skip
  quality_score: basic
```

### deep
```yaml
initialize:
  config: full config.yaml
  state: full state.yaml + STATE.md
  project_docs: PROJECT.md, REQUIREMENTS.md, ROADMAP.md
  roadmap: phase-based

think:
  brainstorm: yes (unless requirements crystal clear)
  research: full parallel (all 5 research agents)
  discovery: discuss-phase per phase
  plan_verify: yes (planner -> plan-checker loop, max 3 iterations)
  risk_assess: full (flow-risk-assessor agent)

build:
  execution: wave-based parallel (flow-executor per plan)
  commits: atomic per-task
  deviation_rules: true
  system_wide_test: true

verify:
  goal_backward: yes (flow-verifier after each phase)
  multi_agent_review: yes (full agent pool)
  uat: yes (conversational)

ship:
  compound: yes (after non-trivial phases)
  retro: per-phase
  quality_score: full tracking
```

### epic
```yaml
initialize:
  config: full config.yaml
  state: full state.yaml + STATE.md
  project_docs: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, SYSTEM.md
  roadmap: milestone-based with phase structure

think:
  brainstorm: yes
  research: full parallel + domain research (ecosystem, feasibility, comparison)
  discovery: full discovery documents with hypothesis maps
  plan_verify: yes (max 5 iterations)
  risk_assess: full + tracked in risk register

build:
  execution: wave-based parallel
  commits: atomic per-task
  deviation_rules: true
  system_wide_test: true

verify:
  goal_backward: yes + milestone audit
  multi_agent_review: yes + integration checker
  uat: yes + e2e testing

ship:
  compound: yes (mandatory for solved problems)
  retro: per-phase + per-milestone + sprint retros
  quality_score: full tracking + cross-project learning
  milestone: git tag, archive, new milestone cycle
```

## Depth Override Patterns

Users can override at any point:
- `/flow:start --depth quick` — Force quick regardless of analysis
- `/flow:plan --depth deep` — Use deep planning even if project is standard depth
- Individual features can be deeper than project depth (e.g., standard project, but one feature needs deep planning)
