<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/atlas-banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/atlas-banner-light.svg">
    <img alt="ATLAS — Autonomous Task, Learning and Agent System" src="assets/atlas-banner-dark.svg" width="880">
  </picture>
</p>

<p align="center">
  <a href="#what-it-is">What it is</a> &nbsp;·&nbsp;
  <a href="#install">Install</a> &nbsp;·&nbsp;
  <a href="#whats-in-here">What's in here</a> &nbsp;·&nbsp;
  <a href="#the-entry-points">Commands</a> &nbsp;·&nbsp;
  <a href="#what-it-does-on-its-own">Behaviors</a> &nbsp;·&nbsp;
  <a href="#under-the-hood">Under the hood</a> &nbsp;·&nbsp;
  <a href="#making-it-yours">Make it yours</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-10.3.1-B07D28?style=flat-square" alt="Version 10.3.1">
  <img src="https://img.shields.io/badge/for-Claude_Code-4A4135?style=flat-square" alt="For Claude Code">
  <img src="https://img.shields.io/badge/skills-45-6B5E4B?style=flat-square" alt="45 skills">
  <img src="https://img.shields.io/badge/hooks-28-6B5E4B?style=flat-square" alt="28 hooks">
  <img src="https://img.shields.io/badge/agents-21-6B5E4B?style=flat-square" alt="21 agents">
  <img src="https://img.shields.io/badge/license-MIT-8F7F67?style=flat-square" alt="MIT license">
</p>

---

## What it is

Most Claude Code setups are a `CLAUDE.md` with some rules in it. **ATLAS is the infrastructure layer underneath** — lifecycle hooks, a skill library, an agent roster, two persistence systems, and a telemetry loop that notices when the system itself is drifting.

The short version: it keeps working when context runs out, picks its own execution depth, and gets a little better every session.

<table>
<tr>
<td width="52%" valign="top">

**You type this**

```
build a REST API for user management
```

**It does this**

1. **Recalls** prior work first — don't re-derive what you already solved
2. **Loads** the matching skills and capability system for the stack
3. **Plans** at the right depth — a sentence, or a plan file for multi-phase work
4. **Executes** wave by wave, verifying between waves
5. **Escalates** only when it pays: a deterministic Workflow for known fan-out, a council of agents for high-stakes calls
6. **Scans** for security issues before saying "done"
7. **Records** anything genuinely new so next time is cheaper

</td>
<td width="48%" valign="top">

```
        ┌───────────────────────────┐
        │  /new  /resume  /task     │  you
        └─────────────┬─────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   ┌─────────────┐         ┌─────────────┐
   │  Workflow   │         │   Council    │
   │  fan-out    │         │  judgment    │
   └──────┬──────┘         └──────┬──────┘
          └───────────┬───────────┘
                      ▼
        ┌───────────────────────────┐
        │  45 skills · 21 agents    │  execution
        │  28 hooks · 4 systems     │
        └─────────────┬─────────────┘
                      ▼
        ┌───────────────────────────┐
        │  observe → propose →      │  growth
        │  you approve → apply      │
        └───────────────────────────┘
```

</td>
</tr>
</table>

> **The one-line pitch** — it continues its own work when context runs out, sizes its own execution depth, proposes its own fixes from telemetry, and learns from mistakes across sessions. You approve; it never rewrites itself behind your back.

---

## Install

```bash
git clone https://github.com/Leo-Atienza/atlas-claude.git
```

```bash
cd atlas-claude && bash install.sh
```

`install.sh` is additive — it never overwrites a file you already have.

Then verify:

```bash
bash ~/.claude/scripts/smoke-test.sh
```

**Before your first real session**, skim three things: `settings.json` (hook wiring and the `enabledPlugins` map), `hooks/cleanup-config.json` (retention rules that delete things on a schedule), and [`RUNTIME-STATE.md`](RUNTIME-STATE.md). See [Making it yours](#making-it-yours).

---

## What's in here

| | Count | Where |
|---|---:|---|
| **Skills** — domain playbooks, loaded on demand | 45 | [`skills/`](skills/) |
| **Hooks** — lifecycle automation across 11 events | 28 | [`hooks/`](hooks/) |
| **Agents** — specialist subagents | 21 | [`agents/AGENTS.md`](agents/AGENTS.md) |
| **Commands** — slash-command entry points | 29 | [`commands/`](commands/) |
| **Scripts** — validators, telemetry, maintenance | 51 | [`scripts/`](scripts/) |
| **Capability systems** — stack-aware presets | 4 | [`systems/`](systems/) |
| **Rule files** — git, security, testing, delegation, scope | 5 | [`skills/RULES-*.md`](skills/) |

`skills/ACTIVE-DIRECTORY.md` indexes 51 entries — the extra six are ecosystem skills you install separately, listed in [`skills/SYMLINKS.md`](skills/SYMLINKS.md). Another 60 archived skill bundles sit in `skills/_archived/`, restorable with a single `mv`.

> **This is a sanitized publication, not a disk copy.** Personal session data, a private engineering journal, and identity-specific skills are excluded — so a few cross-references point at things you won't find here. [`PUBLIC-MIRROR.md`](PUBLIC-MIRROR.md) lists exactly what was held back and why.

---

## The entry points

You never think about 45 skills. Everything funnels through a handful of commands — and most of the time, plain English is enough.

| Command | Say it like | What happens |
|:---|:---|:---|
| `/new` | "build X" | Classifies the task, plans at the right depth, executes |
| `/resume` | "continue" | Restores state in precedence order, picks up mid-thought |
| `/task` | "fix X" | One-off routing, complexity scoring, straight to work |
| `/done` | "wrap up" | Reflects, captures knowledge, saves state, commits |
| `/ship` | "push this" | Commit, push, PR, security scan |
| `/handoff` | "end session" | Build, test, commit, then a handoff block for next time |
| `/health` | "system status" | Validates hooks and counts, updates `SYSTEM_VERSION.md` |
| `/observe` | "how's it doing?" | Seven-panel telemetry dashboard |
| `/review-proposals` | "what's it suggesting?" | The approval queue — the only path to self-modification |

---

## What it does on its own

No prompting required. It watches, decides, and acts.

**Survives context limits.** As context fills, it writes a structured handoff keyed to the working directory. A fresh session reads it and resumes mid-thought instead of mid-guess.

**Sizes its own execution.** Trivial edits happen immediately. Multi-phase work gets a plan file and wave-by-wave execution with validators between waves. You aren't asked to pick a mode.

**Escalates to multiple agents only when it pays.** Two lanes, deliberately:

```
known structure          →   Workflow tool     deterministic pipelines, fan-out,
(migrations, audits,         (you opt in)      judge panels, adversarial verify
 sweeps, fan-out)

high-stakes judgment     →   Council           2–4 agents with deliberately
(architecture, security,     (auto)            different lenses, then synthesis
 one-way doors)
```

Routine work stays single-pass. Orchestration isn't free, and pretending otherwise is how you burn tokens for a worse answer.

**Notices its own drift.** Every tool failure, skill invocation, and rejected suggestion is logged. A weekly pass compares that evidence against the active inventory and files proposals for what's decaying. At session start you get **at most one** advisory — never a wall of nagging.

**Proposes, never applies.** Self-modification has exactly one path: a proposal lands in `proposals/`, and you approve or reject it. Nothing edits its own configuration unsupervised. That constraint is the feature.

**Defends in depth.** Five hook layers: a secrets-and-context gate, shell-command blockers (including enforced `mv`-to-trash over `rm`), a pre-commit build/test check, type diagnostics fed back as context, and a circuit breaker that trips on repeated tool failures.

---

## Under the hood

<details>
<summary><b>Hook lifecycle</b> — what fires, and when</summary>

<br>

Hooks are registered across 11 lifecycle events:

```
SessionStart          session-start.sh     handoff, version, rotation, KG,
                                           action-graph carryover (48h guard)
                      cleanup-runner.js    25 declarative retention rules
                      drift-proposer.js    at most ONE advisory per session

UserPromptSubmit      allow_git_hook.py    session-scoped git approval

PreToolUse            context-guard.js     duplicate-read advisory, secrets,
                                           context budget
                      bash_hook.py         dangerous shell command blocker
                      rm_block_hook.py     enforce "mv to trash" over rm
                      file_length_limit    prevent file bloat
                      read_env_protection  guard env-file reads
                      pre-commit-gate.js   warn if build+test wasn't run
                      skill-usage-log.js   usage telemetry

PostToolUse           auto-formatter       prettier / dart format on save
                      tsc-check.js         TS errors as additionalContext
                      post-tool-monitor.js telemetry + retrieval logging

PostToolUseFailure    tool-failure-handler circuit breaker, MCP classification

PreCompact            precompact-reflect   knowledge preservation + hot-set
                                           digest injection

Stop / SessionEnd     session-stop.sh      handoff, todos, capture, rollup

Notification          desktop notify       optional
StatusLine            statusline.js        context bar, task, call count
```

Four extra safety hooks ship on disk but stay **unregistered by default** — `git_add_block`, `git_checkout_safety`, `git_commit_block`, `env_file_protection`. See [`hooks/README.md`](hooks/README.md) to turn them on.

</details>

<details>
<summary><b>Memory</b> — two stores, one in-session graph</summary>

<br>

Two persistent stores with a hard boundary between them:

| Store | Holds | Notes |
|---|---|---|
| **Knowledge vault** | Durable engineering knowledge — patterns, solutions, errors, preferences, failures | Plain markdown in an Obsidian vault. Point it anywhere; docs call it `<your-vault-path>` |
| **Operational graph** (`atlas-kg/`) | Facts *not* derivable from code or git — architectural truths, component relationships | Temporal triples: facts expire instead of being deleted. Format in [`atlas-kg/SCHEMA.md`](atlas-kg/SCHEMA.md) |

Plus an in-session **action graph** (`atlas-action-graph/`) that logs what got read and searched, warns on duplicate reads, and carries a ranked hot-set across compaction and into the next session.

On resume, state is read in strict precedence:

```
1. handoffs/<cwd-slug>.md              git state + todos from the Stop hook
2. atlas-action-graph/<id>.state.json  previous hot-set (48h carryover guard)
3. atlas-kg/{entities,triples}.json    long-term architectural facts
```

</details>

<details>
<summary><b>Layout</b> — what lives where</summary>

<br>

```
~/.claude/
├── CLAUDE.md              core instructions — the behavioral contract
├── ARCHITECTURE.md        system architecture reference
├── REFERENCE.md           commands, MCP patterns, generators
├── SYSTEM_VERSION.md      component inventory + health (auto-updated)
├── settings.json          hook wiring, permissions, env, enabled plugins
│
├── hooks/                 lifecycle automation
│   ├── lib.js               shared utilities (every Node hook imports this)
│   ├── context-guard.js     PreToolUse — duplicate-read + security gate
│   ├── post-tool-monitor.js PostToolUse — telemetry + retrieval logging
│   ├── cleanup-runner.js    SessionStart — 25 declarative retention rules
│   ├── drift-proposer.js    SessionStart — the one advisory per session
│   ├── atlas-kg.js          temporal knowledge graph
│   ├── atlas-action-graph.js in-session retrieval log + priority queue
│   └── cctools-safety-hooks/ python blockers (bash, rm, env, file length)
│
├── skills/                45 skill directories + the ACTIVE-* index
│   ├── ACTIVE-DIRECTORY.md  the index you actually read
│   ├── SYMLINKS.md          ecosystem skills, installed separately
│   ├── RULES-*.md           git · security · testing · delegation · scope
│   └── _archived/           60 bundles, restorable with one mv
│
├── commands/              slash-command entry points
├── agents/                specialist subagents + AGENTS.md roster
├── systems/               capability systems (stack-aware presets)
├── scripts/               validators, telemetry, maintenance
├── templates/             project scaffolds
├── design-system/         tokens, brand, components
├── local-llm/             zero-cost delegation evals
└── mcp-servers/local-agent/  local-model MCP server (source included)
```

State directories (`atlas-kg/`, `atlas-action-graph/`, `proposals/`, `tasks/`, `logs/`, `cache/`) are created on demand — see [`RUNTIME-STATE.md`](RUNTIME-STATE.md).

</details>

<details>
<summary><b>MCP servers</b> — two registries</summary>

<br>

| Registry | Scope | Managed with |
|---|---|---|
| `~/.claude.json` → `mcpServers` | **User** — every working directory | `claude mcp add\|remove -s user` |
| `~/.claude/.mcp.json` | **Project** — only when cwd is `~/.claude/` | edit the file directly |

Per-server install commands are in [`INSTALLED.md`](INSTALLED.md). The one server original to this repo is `mcp-servers/local-agent/`, which routes cheap sub-tasks (summarizing, classifying, extracting) to a local Ollama model at zero API cost:

```bash
npm install --prefix mcp-servers/local-agent
```

The delegation policy — what should and should not go to a small local model — is in `skills/RULES-LOCAL-LLM.md`.

</details>

<details>
<summary><b>Optional components</b> — all degrade to a silent no-op</summary>

<br>

| Component | Purpose | How to get it |
|---|---|---|
| `cctools-safety-hooks/` | Shell blockers, file limits, `rm` enforcement | Ships with ATLAS |
| `code-review-graph` | Tree-sitter code graph; preferred over grep when present | `uvx code-review-graph build` |
| `graphify` | Mixed-corpus graph (docs + code + images) | `python -m graphify .` |
| Ollama | Local-model delegation via `local-agent` | [ollama.com](https://ollama.com) |
| Desktop notifications | Audio/visual session alerts | Optional binary |

Nothing here is required. A missing component logs nothing and blocks nothing.

</details>

<details>
<summary><b>Validation</b> — proving the system is intact</summary>

<br>

```bash
bash ~/.claude/scripts/smoke-test.sh
```

```bash
node ~/.claude/scripts/system-doctor.js
```

13 validators check hook wiring, registry parity, reference integrity (every script an automation points at actually exists), skill counts, and archive manifests. `scripts/test-validators.js` unit-tests the validators themselves, including must-reject cases — because a validator that silently passes is worse than none.

</details>

---

## What's actually novel

| | What it does | Why it matters |
|---|---|---|
| **Auto-continuation** | Structured handoff written as context fills | Work survives the context limit |
| **Proposal queue** | Telemetry files suggestions; you approve them | Self-improvement without an agent editing its own config |
| **Action graph** | In-session retrieval log with a ranked hot-set | Catches duplicate reads; survives compaction |
| **Temporal knowledge** | Facts carry validity windows | The system can answer "what was true then?" |
| **Evidence-fused usage ledger** | Skill usage measured across six independent signals | Retirement decisions come from data, not vibes |
| **Two-lane orchestration** | Deterministic workflows vs. deliberative councils | Multi-agent cost is paid only where it returns |
| **Circuit breaker** | Failure tracking with MCP-aware classification | One broken tool can't spiral a session |
| **Local-model delegation** | Cheap sub-tasks routed to Ollama | Real token savings on summarize/classify/extract |

---

## Making it yours

This is one person's working system, published so you can take it apart. A few things are worth changing before you lean on it:

1. **`settings.json`** — ships with opinionated defaults: enabled plugins, a hook profile, permissions, and behavioral rules in `CLAUDE.md` (including a terse response register). All of it is meant to be edited.
2. **`hooks/cleanup-config.json`** — 25 retention rules that *delete things on a schedule*. Read these before they run.
3. **The knowledge vault path** — docs reference `<your-vault-path>`. Point it at your own vault, or drop the vault-dependent hooks entirely.
4. **`CLAUDE.md`** — the behavioral contract. Everything else is machinery serving it. Start here if you only read one file.

Lifting a single piece works too — the hooks, the proposal queue, and the action graph are independent. [`RUNTIME-STATE.md`](RUNTIME-STATE.md) explains the state layer; [`PUBLIC-MIRROR.md`](PUBLIC-MIRROR.md) explains what was left out.

---

## License

MIT. Use it, fork it, strip it for parts.

<p align="center">
  <sub>Built with Claude Code · <a href="https://github.com/Leo-Atienza">github.com/Leo-Atienza</a></sub>
</p>
