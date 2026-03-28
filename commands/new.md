# /new — Start something new

You are handling: **$ARGUMENTS**

Execute autonomously from start to finish. Do not ask for permission to use tools, run validations, or invoke skills.

---

## Step 1 — Classify scope from the description

| Scope | Indicators | Route |
|---|---|---|
| **Trivial** | Single file, <20 lines, obvious | Do it directly |
| **Small** | 1-3 files, clear requirements | `/flow:quick` |
| **Medium** | 3-10 files, some ambiguity | `/flow:plan` → `/flow:go` |
| **Large** | 10+ files, multi-phase, architectural | `/flow:start --depth deep` |
| **Massive** | Multi-milestone, major product work | `/flow:start --depth epic` |

If no description provided, ask one question: "What are we building?"

## Step 1b — Generate project CLAUDE.md (if missing)

If no `./CLAUDE.md` exists in the target project directory:
1. Detect the tech stack from project files (package.json, pubspec.yaml, etc.)
2. Read `skills/project-init/SKILL.md` for the matching template
3. Generate `./CLAUDE.md` from the template
4. Append customization hooks (Docker, CI, Makefile sections) if indicators found
5. Never overwrite an existing project CLAUDE.md

## Step 2 — Execute the workflow completely

- For **large/massive**: `/flow:start` handles everything (depth analysis, init, plan, execute)
- For **medium**: run `/flow:plan` then `/flow:go` — do not stop between them
- For **small**: run `/flow:quick`
- For **trivial**: just do it, no ceremony

## Step 3 — Apply quality gates automatically (do not skip)

- TDD: write failing test before any production code
- Security scan: run `trailofbits-security/sharp-edges/` on changed files
- IaC validation: if any Dockerfile/.tf/.yml generated, run the matching validator
- Tests: run them and confirm passing before claiming done

## Step 4 — Wrap up

- If changes exist, ask: "Commit now? [y/n]"
- If yes, run `/flow:ship --commit-only`
- Summarize what was built in 2-3 sentences

---

**Plain English triggers** (Claude recognizes these without the slash command):
"new project", "build", "create", "implement", "start a new", "make a", "I want to build"
