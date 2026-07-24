---
name: memory-capture-router
description: >-
  Routes coding outcomes into the Obsidian vault second brain (%USERPROFILE%\Documents\Wiki):
  inbox, decisions, failures, fixes, patterns, playbooks. Use after debugging wins,
  tool decisions, regressions, or when preserving prompts/runbooks shared across repos.
disable-model-invocation: true
---

# Memory capture router

## Triggers

- User says `/remember`, add to wiki, capture this lesson, playbook, regression, friction.
- After closing a nasty bug/build failure with a repeatable fix.

## Placement rules

| Signal | Folder |
|---------|--------|
| Raw dumps / chat snippets | `inbox/` |
| Irreversible tool/architecture commitments | `decisions/` |
| Postmorts, flake evidence | `failures/` |
| Verified remediation | `fixes/` |
| Tiny reusable snippets | `patterns/` or `snippets/` |
| Procedures with ordered steps | `playbooks/` |
| Repo quirks / owners | `projects/<slug>/` |

## Required note hygiene

Must include YAML described in `%USERPROFILE%\Documents\Wiki\CLAUDE.md` (**Coding-agent second brain** section): `project_slug`, `confidence`, dates, optional `related` wikilinks.

## MCP usage

With global MCP `obsidian-pro` (`~/.cursor/mcp.json`), prefer MCP tools over manual pasting **when editing many notes**. Never write into `raw/` except via formal ingest workflows.

## Promotion

If the same playbook triggers ≥3 sessions, scaffold or update `~/.cursor/skills/<new-skill>/SKILL.md`.
