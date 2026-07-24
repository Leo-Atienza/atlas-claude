# /task — One-off task

Task: **$ARGUMENTS**

Classify, route, and execute autonomously. Apply all quality gates. Do not ask for permission to use tools.

---

## Step 1 — Classify the task type

| Type | Keywords | Route |
|---|---|---|
| **Bug / Fix** | fix, broken, error, crash, not working, failing, wrong | observe → hypothesize → verify → fix (CLAUDE.md Debugging rule) → offer commit |
| **Feature** | add, implement, feature, build, create | Scope check → plan briefly (or plan file if large) → build |
| **Review** | review, check, audit, look at this, what do you think | `/code-review` (findings only — Review-vs-Implement rule) |
| **Research** | how does, explain, what is, understand, why | `/recall` + Context7 + codebase tools; `/deep-research` for multi-source questions |
| **Refactor** | refactor, clean up, restructure, simplify | Read existing → plan → targeted tests → execute (`/simplify` for the quality pass) |
| **Document** | file types `.docx` `.pdf` `.pptx` `.xlsx` | Auto-activate matching built-in skill |
| **Frontend/UI** | website, landing page, UI, dashboard, component | `frontend-design` skill |
| **Infrastructure** | Dockerfile, terraform, .tf, k8s, CI/CD, ansible | DevOps generator + validator pair |

If no description given, ask: "What's the task?"

## Step 2 — Execute

**Bug fix flow:**
1. observe → hypothesize → verify → fix (CLAUDE.md Debugging rule — capture the actual error first)
2. Write failing test that captures the bug
3. Fix the bug → test goes green
4. Security scan on changed files
5. Run full test suite

**Feature flow:**
1. Assess scope (trivial/small/medium)
2. Trivial → do directly
3. Small → brief plan, then build
4. Medium → present plan, get approval, execute

**Review flow:**
- Run `/code-review:code-review`
- Present findings as P1 (blocks), P2 (should fix), P3 (nice-to-have) — findings only, no implementing

**Research flow:**
- `/recall` first; deep-research skill for multi-source questions
- Context7 for library/framework questions
- Search codebase with Grep/Glob if about their own code

**Infrastructure flow:**
- Read matching generator SKILL.md first
- Generate → immediately validate → fix failures → security scan

## Step 3 — Quality gates (always, automatically)

- TDD: write failing test before any production code
- Tests: run them, confirm passing
- Security scan: `skills/trailofbits-security/plugins/sharp-edges/` on changed files
- IaC: generator → validator (always paired)

## Step 4 — Wrap up

- If changes exist, ask: "Commit? [y/n]"
- If problem was non-trivial, offer: "Document this solution? (`/remember`) [y/n]"

---

**Plain English triggers**: "fix", "add", "implement", "review", "refactor",
"explain", "debug", "build", "optimize", anything task-shaped
