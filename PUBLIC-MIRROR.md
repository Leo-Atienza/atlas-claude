# What ships here, and what doesn't

This repository publishes the **ATLAS system** — the doctrine, hooks, scripts,
commands, agents, and skills that make it work — so anyone can read it, copy it, or
run it themselves.

It is deliberately **not** a full mirror of the maintainer's live `~/.claude/`. The
personal layer is stripped: no session history, no knowledge vault, no private or
client project work, and no skills that encode one person's identity. What's left is
the machinery.

Some documentation cross-references point at files that aren't here. That's expected,
and this page explains each case.

## Sanitization

`scripts/sanitize-for-public.js` rewrites every text file before publication.

| Real value | Published as |
|---|---|
| `C:/Users/<name>/.claude/`, `/c/Users/<name>/.claude/` | `~/.claude/` |
| `C:/Users/<name>/.agents/` | `~/.agents/` |
| Personal knowledge vault path | `<your-vault-path>/` |
| Any other home-directory path | `~/` |
| Session/cwd slug (`C--Users-<name>--claude`) | `<your-cwd-slug>` |
| Bare OS username | `<user>` |
| Owner's real name (possessive and hyphenated forms, any case) | `the user` |
| Personal email addresses | `<your-email>` |
| School name | `[school]` |
| Course codes | `[course]` |
| Private/client project names | `[personal-project]` |

The identifier list lives in `scripts/sanitize-identity.json`, which is
**gitignored** — a published scrubber must not carry the very words it removes. Copy
`scripts/sanitize-identity.example.json` to set up your own.

Verify a tree before publishing:

```bash
node scripts/sanitize-for-public.js . --check
```

Exit `0` is clean; `1` lists every offending file. The check also fails on credential
*shapes* (Anthropic/OpenAI keys, GitHub tokens, AWS keys, Slack tokens, PEM private
keys) regardless of identity config.

Two lessons are baked in, both from real misses:

- **List spaced, hyphenated, and glued spellings separately.** A word-boundary match
  on `Some-Name` will not catch `SomeName` or `Some Name`.
- **`.gitignore` is never scrubbed.** Rewriting a path inside an ignore rule silently
  breaks the rule, so its patterns are kept name-free by hand instead
  (`skills/*-style/`, `hooks/_archived/*-ship-guard.js`).

## Excluded: the personal layer

- **`SYSTEM_CHANGELOG.md`** — a 256 KB session-by-session engineering journal. Useful
  to its author, but it is a record *of a person*: client names, private project
  post-mortems, and personal working preferences. Docs here still tell you to log
  changes to `SYSTEM_CHANGELOG.md`, which is the right convention — you just keep
  your own. `examples/SYSTEM_CHANGELOG.md` shows the format.
- **Personal coding-style skills** (`skills/*-style*`, 4 of them) — real name, school,
  course codes, and one person's comment voice. This is why
  `skills/ACTIVE-DIRECTORY.md`, `skills/ACTIVE-PAGE-3-native-crossplatform.md`, and
  `REFERENCE.md` list "Personal Style" skills you won't find in `skills/`. The
  *pattern* is very much worth copying — a skill that encodes your own conventions so
  generated code sounds like you — but the contents were specific to one person.
- **`systems/coursework/`** (`SYS-EDU`) — a capability system for one person's
  university deliverables. The other four capability systems (`full-stack`, `app-dev`,
  `design-ui`, `atlas-meta`) are general and ship intact.
- An archived ship-guard hook under `hooks/_archived/` written for a private project.
- **The contents of the runtime state directories** — session graphs, task lists,
  telemetry, caches, the operational knowledge graph. The directories themselves are
  part of the system and are fully documented in [`RUNTIME-STATE.md`](RUNTIME-STATE.md),
  with format templates (`atlas-kg/SCHEMA.md`, `proposals/TEMPLATE.md`) so you can
  populate your own. They are created on demand, so nothing needs setting up by hand.
- `_archived/` knowledge-consolidation tarballs, and `bin/claudio`, a Windows binary
  with personal paths compiled in.

## Excluded: not ours to redistribute

- `plugins/marketplaces/`, `plugins/cache/` — third-party plugin code. Install these
  through Claude Code's own plugin marketplace instead.
- `skills/_external/` — a third-party repo clone carrying its own `.git`.
- `mcp-servers/**/node_modules/` — vendored dependency trees. The one MCP server
  original to this repo, `mcp-servers/local-agent/`, **does** ship as source; install
  its deps with `npm install --prefix mcp-servers/local-agent`.
- 29 ecosystem skills that are **symlinks** into `~/.agents/skills/` (Expo, Vercel,
  Swift, Android, and similar), listed in `skills/SYMLINKS.md` rather than vendored.
  A naive `cp -r` from a live install **dereferences** those symlinks and silently
  pulls the third-party trees in, so `.gitignore` names each one as a guard.

Third-party attribution inside vendored skills is preserved verbatim — the scrubber
only removes the maintainer's own identifiers, never an upstream author's.

## Counts

Component counts in `SYSTEM_VERSION.md` and the README badges describe the **live**
system, so they read higher than what you can count here. The authoritative live
numbers come from `cache/system-ground-truth.json`, which is not published.
