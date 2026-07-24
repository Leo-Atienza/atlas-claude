# Runtime state and third-party components

ATLAS keeps a fair amount of state on disk: session graphs, task lists, telemetry,
caches, and a small operational knowledge graph. Those **directories are part of the
system** — hooks and scripts read and write them — but their **contents are specific
to one machine and one person**, so the contents aren't published.

This page tells you what each one is for and what a fresh install looks like, so you
can adopt the system and make the state your own.

Short version: **you don't need to create any of it by hand.** Every directory below
is created on demand on first use. A clone plus `install.sh` is a valid starting
state; the system fills in the rest as you work.

## State directories

| Directory | What lives there | Written by |
|---|---|---|
| `atlas-kg/` | Operational knowledge graph — components, integrations, sessions, as temporal triples. Format: [`atlas-kg/SCHEMA.md`](atlas-kg/SCHEMA.md) | `atlas-kg-sync` (weekly) |
| `atlas-action-graph/` | Per-session action graph: one `<session-id>.jsonl` event log plus a `.state.json` working set. Drives the "files you touched, ranked by relevance" digest at session start | session hooks |
| `proposals/` | The self-modification queue — the only sanctioned path for the system to change itself. Format: [`proposals/TEMPLATE.md`](proposals/TEMPLATE.md) | drift proposer; reviewed via `/review-proposals` |
| `tasks/` | Per-session task lists, one numbered JSON file per task | task tooling |
| `teams/` | Config for multi-agent team sessions, scoped per session | agent-team runs |
| `context-mode/` | Content index and per-process session stats for context tooling | context-mode MCP server |
| `cache/` | Derived data, including the ground-truth system snapshot the audit rules treat as authoritative | `system-snapshot.js`, session hooks |
| `logs/` | Telemetry: tool failures, skill usage, rejections. This is what makes drift proposals evidence-based rather than speculative | hooks |
| `handoffs/`, `sessions/`, `session-env/` | Session continuity — what `/resume` reads to pick up where you left off | session hooks |
| `plans/`, `todos/`, `backups/`, `shell-snapshots/`, `usage-data/`, `ide/` | Working files, rotated by the cleanup engine | various |

The cleanup engine (`hooks/cleanup-runner.js`, driven by declarative rules in
`hooks/cleanup-config.json`) prunes most of these on a schedule. If you adopt the
system, review those retention rules before they start deleting things you wanted.

### A note on the action graph

`atlas-action-graph/` is the piece people most often want to copy. Each session
appends events to a JSONL file and maintains a ranked working set in `.state.json`.
At the next session start, the top entries are surfaced as "you were working on
these" — priority decays over time, so stale files fall out on their own. The
contents are just your file paths, which is exactly why they aren't published.

## Third-party components

None of these are vendored here — redistributing other people's code is not this
repo's job — but all of them are reproducible from what *is* published.

**Plugins.** `settings.json` carries an `enabledPlugins` map naming every plugin and
its marketplace, with `true`/`false` for each. That map is the manifest: Claude Code
installs from the official marketplace, so the set is reproducible without copying
anyone's plugin code. Turn off what you don't want before first run.

**Ecosystem skills.** 29 skills are symlinks into `~/.agents/skills/` rather than
real directories — Anthropic-maintained and community skills installed through the
agents ecosystem. [`skills/SYMLINKS.md`](skills/SYMLINKS.md) lists every one and the
link target.

> Watch out: copying a live install with `cp -r` **dereferences** these symlinks and
> silently turns 29 links into 29 vendored third-party trees. `.gitignore` names each
> one specifically as a guard. If you sync from a live install, verify the file count
> afterwards.

**MCP servers.** `.mcp.json` holds project-scope server registration; user-scope
servers are added with `claude mcp add -s user`. `INSTALLED.md` documents each server
and its one-command re-add.

The one MCP server that *is* published is `mcp-servers/local-agent/` — it's original
to this repo. It delegates cheap sub-tasks (summarizing, classifying, extracting) to
a local Ollama model at zero API cost, and the delegation policy is in
`skills/RULES-LOCAL-LLM.md`. Its dependencies are not vendored:

```bash
npm install --prefix mcp-servers/local-agent
```

## First run

1. `bash install.sh` — never overwrites existing files.
2. Review `settings.json`: `enabledPlugins`, hook profile, and permissions.
3. Review `hooks/cleanup-config.json` retention windows.
4. Point the knowledge-vault paths at your own vault, or drop the vault-dependent
   hooks. Published docs refer to it as `<your-vault-path>`.
5. Start a session. The state directories above appear as they're needed.
