# Rules: Session Scope

> Loaded on-demand when starting a session in an unfamiliar folder or when a task spans repos. Core summary lives in CLAUDE.md; full procedure here.

## The Rule

The session's folder — its CWD *and* the nature of what lives there — defines its scope.

## Procedure

1. **At session start**, form a quick understanding of what this folder is about (read CLAUDE.md, README, package.json, or fall back to the directory name). Hold that as the session's identity.
2. **For each task**, check whether its subject matter fits the folder's nature. A task can be out of scope even when no path is mentioned — a finance question in a personal-project repo is out of scope because the *domain* doesn't match.
3. **If a task appears to target files, configs, or project context outside the nature of the current folder** — another project by name, an absolute path elsewhere, a different domain, or files that don't belong here — STOP and warn:
   > "This task looks like it targets `<other-folder-or-domain>`, but this session is running in `<current-cwd>`, which is `<brief-description-of-this-folder>`. Open a session in the correct folder, or explicitly confirm you want me to proceed from here anyway."
4. **Wait for explicit confirmation** before proceeding any further. Do not research, read files, run tools, or act on the mismatched task until the user confirms. "Stop" means stop.
5. **Apply the same check at session start**: if a handoff, action-graph carryover, or scheduled-task prompt points at a folder or domain that doesn't match CWD, flag the mismatch before acting on any carried-over task.

## Project-Context Classification

As part of forming the session's identity, classify the project:

- **Personal / learning** — no production users, no SLA, course assignments, side projects, vault scripts.
- **Production** — real users, real consequences, deployed services.

For personal/learning, default to the **simplest stack** that demonstrates the concept. Do not propose Docker, k8s, message queues, self-hosted infra, or service-grade abstractions unless the user explicitly requests them. When the project type is ambiguous, treat it as personal/learning and ask before adding infrastructure.

## Rationale

Prevents accidental cross-project work when handoffs, pastes, or stale context reference the wrong repo — even when the mismatch isn't a path but a domain. Intent must match the folder's nature, not just live inside its tree. Project-context classification prevents the over-engineering bias where Claude reads "production" framing into personal projects.
