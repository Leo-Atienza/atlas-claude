Strategically explore the most recent parent session from the session lineage
(shown in the first user message) to extract the full context of the last task.

Use the `session-searcher` sub-agent (if sub-agents are available) so that you do
not bloat your own context. If sub-agents are not available, use the
`aichat:session-search` skill instead.

You may also look at any associated markdown files that were created during that
most recent session (e.g., issue specs, work logs, design docs).

After recovering the context, report back:
1. What was the last task being worked on?
2. What was its current state (completed, in-progress, blocked)?
3. Any relevant files or documents found
4. Ask how the user would like to proceed
