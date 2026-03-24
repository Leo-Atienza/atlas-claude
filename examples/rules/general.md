# General Conventions
> @import into project CLAUDE.md for cross-project consistency.

## Platform
- Windows 11 host, use Unix shell syntax in bash (forward slashes, /dev/null not NUL)
- Paths: use forward slashes even on Windows when inside bash

## Code Quality
- Simplest solution that works correctly. No premature abstraction.
- Single responsibility per function. No god functions.
- No unused imports, variables, or dead code.
- Error handling is not optional. Every async operation handles failure.
- No hardcoded URLs, IDs, or environment-specific values -- use env vars.

## Naming
- TypeScript: PascalCase types/components, camelCase functions/vars
- Python: snake_case everywhere, UPPER_SNAKE for constants
- Files: kebab-case for routes/pages, PascalCase for React components

## Workflow
- Always: branch -> work -> PR -> squash merge -> delete branch
- After any file edit: run appropriate linter/formatter
- After any code change: run targeted tests to verify
- Before finishing any task: confirm it builds AND tests pass
