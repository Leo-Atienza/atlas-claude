# /new — Start something new

You are handling: **$ARGUMENTS**

Execute autonomously from start to finish. Do not ask for permission to use tools, run validations, or invoke skills.

---

## Step 1 — Classify scope from the description

| Scope | Indicators | Route |
|---|---|---|
| **Trivial** | Single file, <20 lines, obvious | Do it directly |
| **Small** | 1-3 files, clear requirements | Build directly (brief plan first) |
| **Medium** | 3-10 files, some ambiguity | Present a plan, get approval, execute |
| **Large** | 10+ files, multi-phase, architectural | EnterPlanMode → plan file in `plans/` → execute wave-by-wave |
| **Massive** | Multi-milestone, major product work | Plan file + Workflow-tool fan-out per milestone (CLAUDE.md orchestration lanes) |

If no description provided, ask one question: "What are we building?"

## Step 1b — Generate project CLAUDE.md (if missing)

If no `./CLAUDE.md` exists in the target project directory:
1. Detect the tech stack from project files (package.json, pubspec.yaml, etc.)
2. Use a stack-appropriate CLAUDE.md template (project name, detected stack, key build/test/run commands, conventions)
3. Generate `./CLAUDE.md` from the template
4. Append customization hooks (Docker, CI, Makefile sections) if indicators found
5. Never overwrite an existing project CLAUDE.md

## Step 2 — Execute the workflow completely

- For **large/massive**: write the plan file, then execute it wave-by-wave with verification between waves — do not stop between phases
- For **medium**: present the brief plan, then execute — do not stop between plan and build
- For **small/trivial**: just do it, no ceremony

## Step 3 — Apply quality gates automatically (do not skip)

- TDD: write failing test before any production code
- Security scan: run `skills/trailofbits-security/plugins/sharp-edges/` on changed files
- IaC validation: if any Dockerfile/.tf/.yml generated, run the matching validator
- Tests: run them and confirm passing before claiming done

## Step 4 — Wrap up

- If changes exist, ask: "Commit now? [y/n]"
- If yes, commit per the CLAUDE.md workflow (full build + tests before commit; test count in the body)
- Summarize what was built in 2-3 sentences

---

**Plain English triggers** (Claude recognizes these without the slash command):
"new project", "build", "create", "implement", "start a new", "make a", "I want to build"
