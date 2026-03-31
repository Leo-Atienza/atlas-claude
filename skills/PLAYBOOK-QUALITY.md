# Playbook: Quality, Security & Expertise

> **Auto-loaded when**: Writing code in a specific language/framework, running security scans, generating/validating DevOps artifacts, applying quality processes (TDD, Reflexion, etc.).

---

## 1. Security — Layered Approach

### When Each Security Skill Activates

| Trigger | Skill | Action |
|---------|-------|--------|
| Reviewing any PR/diff | `differential-review` | Risk classification, attack scenarios, blast radius |
| Before marking feature complete | `sharp-edges` | API footguns, dangerous defaults, fail-open patterns |
| Auditing secrets/config | `insecure-defaults` | Hardcoded secrets, weak defaults, fail-open detection |
| Found a vulnerability | `variant-analysis` | Search for similar bugs (ripgrep → Semgrep → CodeQL) |
| Full codebase security scan | `static-analysis` (Semgrep) | Parallel scan + triage → SARIF output |
| Deep data flow analysis | `static-analysis` (CodeQL) | Interprocedural taint tracking |
| Writing tests for security code | `property-based-testing` | Roundtrip, idempotence, invariant properties |
| Writing auth/crypto code | `insecure-defaults` + `sharp-edges` | Both skills, layered |
| Writing Python | `modern-python` | uv, ruff, ty, pytest; secure modern patterns |

### Security Review Checklist (Before Any PR/Feature Completion)

1. Run `sharp-edges` on changed files
2. Run `differential-review` on the diff
3. Check for `insecure-defaults` if config/secrets involved
4. If vulnerability found → `variant-analysis` across codebase
5. For comprehensive audit → `static-analysis` (Semgrep first, CodeQL for depth)

---

## 2. DevOps Skills — Generate + Validate Pattern

### Every generator has a validator. Always run both.

| Generator | Validator | Key Output |
|-----------|-----------|-----------|
| terraform-generator | terraform-validator | Multi-file TF project + Checkov scan |
| dockerfile-generator | dockerfile-validator | Multi-stage Dockerfile + Hadolint |
| github-actions-generator | github-actions-validator | Workflow with pinned SHAs + minimal permissions |
| k8s-yaml-generator | k8s-yaml-validator | Manifests with labels, limits, probes |
| helm-generator | helm-validator | Chart with values, templates |
| bash-script-generator | bash-script-validator | Script with strict mode, logging, traps |
| ansible-generator | ansible-validator | Playbooks with roles |
| makefile-generator | makefile-validator | Makefile with standard targets |

### Generator Workflow Pattern

1. **Read SKILL.md** for the generator (auto-triggered by file type)
2. **Ask clarifying questions** if requirements unclear
3. **Explain approach** before generating (especially bash scripts)
4. **Generate** following skill's mandatory patterns
5. **Auto-invoke validator** on generated output
6. **Fix any validation failures** (iterate until clean)
7. **Security scan** if applicable (Checkov for TF, Hadolint for Docker)

---

## 3. Language/Framework Expertise — Specialist Skill Activation

### Auto-Detection Rules

When working with code in a specific language/framework, read the matching SKILL.md:

| Language/Framework | Skill Path | Key Enforcements |
|-------------------|-----------|------------------|
| Python 3.11+ | FS-001 (`fullstack-dev/python-pro/`) | Type hints, async/await, pytest >90%, pathlib |
| FastAPI | FS-013 (`fullstack-dev/fastapi-expert/`) `[ARCHIVED]` | Pydantic V2, Annotated DI, async SQLAlchemy |
| Django | FS-014 (`fullstack-dev/django-expert/`) `[ARCHIVED]` | Django patterns, ORM, migrations |
| TypeScript | FS-002 (`fullstack-dev/typescript-pro/`) | Strict TS, proper generics, type safety |
| React/Next.js | FS-020 + FS-021 (`nextjs-developer` + `react-expert`) + Context7 | Server components, hooks patterns |
| Angular 17+ | FS-023 (`fullstack-dev/angular-architect/`) `[ARCHIVED]` | Standalone components, signals, OnPush |
| Go | FS-004 (`fullstack-dev/golang-pro/`) `[ARCHIVED]` | Error handling, goroutines, interfaces |
| Rust | FS-005 (`fullstack-dev/rust-engineer/`) `[ARCHIVED]` | Ownership, lifetimes, error handling |
| SQL/Database | FS-027 (`fullstack-dev/database-optimizer/`) `[ARCHIVED]` | EXPLAIN before optimizing, strategic indexes |
| API Design | FS-028 (`fullstack-dev/api-designer/`) | REST principles, OpenAPI 3.1, RFC 7807 errors |
| Kubernetes | FS-030 (`fullstack-dev/kubernetes-specialist/`) `[ARCHIVED]` | Resource management, networking, security |
| Cloud Architecture | FS-029 (`fullstack-dev/cloud-architect/`) `[ARCHIVED]` | Multi-cloud, cost optimization, HA |

### Key Enforcement Patterns

**Python (python-pro):**
- `X | None` not `Optional[X]`; dataclasses over `__init__`; pathlib over os.path
- mypy --strict compliance; async for I/O; >90% test coverage

**FastAPI (fastapi-expert):**
- Pydantic V2 syntax (`@field_validator`, `model_config` not `class Config`)
- `Annotated` for dependency injection; async SQLAlchemy sessions

**Database (database-optimizer):**
- ALWAYS `EXPLAIN ANALYZE` before optimizing
- Measure before/after; test in non-production first
- Strategic indexes (avoid over-indexing); monitor write impact

---

## 4. Context Engineering — Quality & Process Skills

| Skill | When to Apply | What It Does |
|-------|-------------|-------------|
| **TDD** | ALL production code | Red→Green→Refactor. No code without failing test first. |
| **Kaizen** | During implementation | Smallest viable improvement; error-proof via types; YAGNI |
| **Reflexion** | Before shipping | Ruthless quality gate; auto-refine if complexity >10 or nesting >3 |
| **SDD** | Complex features | Spec-first: write spec → generate → verify against spec |
| **PDCA** | Process improvement | Plan→Do→Check→Act cycles with measured results |
| **Critique** | Code review | 3 independent judges (Requirements, Architecture, Quality) |

### TDD Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
If code written before test → DELETE IT. Start over. No exceptions.
Red (failing test) → Green (minimal code) → Refactor (clean up) → Repeat
```

### Reflexion Auto-Refine Triggers
- Cyclomatic complexity > 10
- Nested depth > 3 levels
- Function length > 50 lines
- Duplicate code blocks
- No error handling / no input validation
- Magic numbers/strings
