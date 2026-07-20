# Testing Rules
> @import into project CLAUDE.md when testing conventions matter.

- TDD for new features: write the failing test first, then implement.
- Test file co-located with source: `foo.ts` -> `foo.test.ts`
- Run targeted tests during dev, full suite only before commits.
- Arrange -> Act -> Assert. One logical assertion cluster per test.
- Test names describe behavior: "returns 404 when user not found"
- No test depends on execution order or shared mutable state.
- Mock ALL external services. Never call live APIs in tests.
- New features: cover happy path + top 3 edge cases minimum.
- Bug fixes: regression test required before fix is merged.
- NEVER modify test assertions to make tests pass -- fix the code. (G-ERR pattern)
- NEVER use `.skip` or `xit` without a TODO referencing an issue.
