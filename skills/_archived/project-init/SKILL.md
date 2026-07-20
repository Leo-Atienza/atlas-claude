---
name: project-init
description: "Auto-generate project-level CLAUDE.md from templates based on detected stack. Adapted from Ruflo's 30+ template system. Invoke from /new after project directory is set up."
---

# Project Init — CLAUDE.md Template Generator

Generates a project-level CLAUDE.md tailored to the detected tech stack.
Eliminates boilerplate setup and ensures consistent project conventions.

## Detection Logic

Scan the project root for stack indicators:

```
package.json + next.config.*     → Next.js template
package.json + expo              → Expo/React Native template
package.json (generic)           → Node.js template
pubspec.yaml                     → Flutter/Dart template
requirements.txt | pyproject.toml → Python template
Cargo.toml                       → Rust template
go.mod                           → Go template
Gemfile                          → Ruby/Rails template
*.sln | *.csproj                 → .NET template
build.gradle*                    → Java/Kotlin template
Dockerfile (no app code)         → DevOps template
No indicators                    → Generic template
```

If multiple indicators exist, use the primary one (first match in order above).

## Template: Next.js

```markdown
# Project Instructions

## Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS for styling

## Conventions
- Use Server Components by default, 'use client' only when needed
- File conventions: page.tsx, layout.tsx, loading.tsx, error.tsx
- Data fetching in Server Components (no useEffect for initial data)
- Route handlers in app/api/ with proper HTTP status codes

## Testing
- Jest + React Testing Library for unit tests
- Playwright for E2E (if configured)
- Run: `npm test` (unit), `npx playwright test` (E2E)

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npx prettier --write .`
```

## Template: Python

```markdown
# Project Instructions

## Stack
- Python 3.11+
- Package manager: uv (preferred) or pip

## Conventions
- Type hints on all function signatures
- snake_case everywhere, UPPER_SNAKE for constants
- Async/await for I/O-bound operations
- Pydantic for data validation

## Testing
- pytest with fixtures
- Run: `pytest` or `uv run pytest`
- Coverage: `pytest --cov`

## Quality
- Formatter: ruff format
- Linter: ruff check
- Type checker: ty or mypy
```

## Template: Flutter/Dart

```markdown
# Project Instructions

## Stack
- Flutter, Dart
- State management: [detect from pubspec.yaml — riverpod/bloc/provider]

## Conventions
- Widgets: small, composable, single-purpose
- File structure: lib/features/{name}/ with models, views, controllers
- const constructors wherever possible
- Named parameters for widget constructors

## Testing
- flutter test for unit/widget tests
- integration_test/ for integration tests
- Run: `flutter test`

## Commands
- Dev: `flutter run`
- Build: `flutter build apk` / `flutter build ios`
- Format: `dart format .`
- Analyze: `dart analyze`
```

## Template: Go

```markdown
# Project Instructions

## Stack
- Go 1.22+

## Conventions
- Error handling: always check returned errors, wrap with fmt.Errorf
- Interfaces: accept interfaces, return structs
- Package names: short, lowercase, no underscores
- Context: pass as first parameter

## Testing
- Table-driven tests with t.Run subtests
- Run: `go test ./...`
- Coverage: `go test -cover ./...`

## Commands
- Build: `go build ./...`
- Lint: `golangci-lint run`
- Format: `gofmt -w .`
```

## Template: Rust

```markdown
# Project Instructions

## Stack
- Rust (latest stable)

## Conventions
- Ownership and borrowing: prefer references over cloning
- Error handling: thiserror for libraries, anyhow for applications
- Use clippy lints: `#![warn(clippy::all)]`

## Testing
- Unit tests in same file: `#[cfg(test)] mod tests`
- Integration tests in tests/
- Run: `cargo test`

## Commands
- Build: `cargo build`
- Check: `cargo clippy`
- Format: `cargo fmt`
```

## Template: Node.js (Generic)

```markdown
# Project Instructions

## Stack
- Node.js, TypeScript (if tsconfig.json exists)

## Conventions
- ES modules (import/export)
- Async/await for all async operations
- Environment variables via .env (never committed)

## Testing
- Run: `npm test`

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
```

## Template: Ruby/Rails

```markdown
# Project Instructions

## Stack
- Ruby on Rails

## Conventions
- Rails conventions: fat models, skinny controllers
- Database: migrations for all schema changes
- ActiveRecord: scopes, validations in models

## Testing
- RSpec or Minitest
- Run: `bundle exec rspec` or `rails test`

## Commands
- Dev: `rails server`
- Console: `rails console`
- Migrate: `rails db:migrate`
```

## Template: Generic (No Stack Detected)

```markdown
# Project Instructions

## Overview
[Describe the project purpose]

## Conventions
- Keep files under 500 lines
- One responsibility per file
- Clear naming: functions describe actions, variables describe data

## Testing
- Write tests for all new functionality
- Run tests before committing
```

## Usage in /new

After Step 1 (scope classification), before Step 2 (workflow execution):

1. Check if `./CLAUDE.md` exists in the target project directory
2. If NO: detect stack → generate from template → write `./CLAUDE.md`
3. If YES: skip (never overwrite existing project CLAUDE.md)
4. **Wiki scaffold**: if no `wiki/` dir exists, auto-scaffold project wiki (wiki-manage SK-101 scaffold mode — creates wiki/index.md, wiki/log.md, wiki/decisions/, wiki/context/, wiki/synthesis/, raw/.gitkeep)

The generated CLAUDE.md is a starting point. The user can customize it.
Any project-level CLAUDE.md automatically overrides global defaults.

## Customization Hooks

After generating, scan for additional indicators and append sections:

| Indicator | Append |
|-----------|--------|
| `.env.example` exists | "## Environment\nCopy `.env.example` to `.env` and fill values" |
| `docker-compose.yml` exists | "## Docker\n`docker compose up` for local dev" |
| `.github/workflows/` exists | "## CI/CD\nGitHub Actions configured. Check workflow status." |
| `Makefile` exists | "## Build\nUse `make` targets — run `make help` for options" |
