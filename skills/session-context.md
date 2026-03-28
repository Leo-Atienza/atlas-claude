# Session Context Skill

Manages context handoff between Claude sessions to minimize re-explanation and reduce token usage.

## Session Notes Format

Write `.claude/session-notes.md` using this structure (keep under 60 lines, omit empty sections):

```
## Session: YYYY-MM-DD
### Completed
- [concise bullet per finished task]

### State
- [what's working, what's broken, where we paused]

### Next
- [ordered action items for next session]

### Decisions
- [non-obvious choices with 1-line rationale each]

### Gotchas
- [traps, environment quirks, known issues to remember]
```

## Start Protocol

1. `Glob` for `.claude/session-notes.md` in the project root
2. If found: `Read` it silently, then output one line — `"Resuming: [topic summary]"`
3. If found: also check for `.claude/todo.md` and read it silently if present
4. If not found: proceed normally, no comment needed

## End Protocol

Triggered when the user signals the session is ending ("done", "goodbye", "that's all", "wrap up", etc.):

1. Write `.claude/session-notes.md` using the format above
2. If significant architectural decisions were made this session, append them to `.claude/decisions.md`
3. Output: `"Session notes saved to .claude/session-notes.md"`

## Optional Project Files

| File | Purpose | When to Create |
|------|---------|----------------|
| `.claude/session-notes.md` | Latest session summary | Every session end |
| `.claude/decisions.md` | Architecture decision log | When non-obvious choices are made |
| `.claude/todo.md` | Persistent work items | When scope is complex or multi-session |

## Token Efficiency Rules

- Session notes: 60 lines max
- Use bullets, not prose
- One-line rationale max for decisions
- Omit sections that have nothing to record
- Prefer file paths over inline code dumps in notes
