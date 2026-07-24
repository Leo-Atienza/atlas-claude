# Testing Rules

> On-demand reference. Loaded when writing or reviewing tests.

## Approach

- TDD for new features: write the failing test first, then implement.
- Test file co-located with source: `foo.ts` -> `foo.test.ts`
- Run targeted tests during dev, full suite only before commits.

## Structure

- Arrange -> Act -> Assert. One logical assertion cluster per test.
- Test names describe behavior: "returns 404 when user not found"
- No test depends on execution order or shared mutable state.
- Mock ALL external services. Never call live APIs in tests.

## Coverage & Discipline

- New features: cover happy path + top 3 edge cases minimum.
- Bug fixes: regression test required before fix is merged.
- NEVER modify test assertions to make tests pass -- fix the code.
- NEVER use `.skip` or `xit` without a TODO referencing an issue.
- Run typecheck AND tests after multi-file refactors — both, not just one. A green typecheck with red tests is still red.

## Flutter Widget Tests

- **Avoid `pumpAndSettle` on screens with background processing or timers.** It hangs until ALL animations + microtasks settle, which never happens if there's a periodic Timer, a `Stream` subscription, or an animation controller without an explicit `.stop()`. Symptom: test hangs at default 10-minute timeout. Use `await tester.pump(Duration(milliseconds: N))` with explicit timing instead — pump exactly what the test needs.
- Wrap `MaterialApp` with the actual `Provider`/`Bloc`/`ChangeNotifierProvider` from the screen under test. Mocking the state class but not its parent provider yields false-passing tests.
- `Finder.byType(MyWidget)` over `byKey` for component identity — `byKey` is brittle on refactors. Use `byKey` only for testing the same widget under different states.
- Golden tests: pin the device pixel ratio (`tester.binding.window.devicePixelRatioTestValue = 1.0`) and font (`debugDisableShadows = true` is rarely needed; pinning DPR usually fixes drift).
- After a Flutter test refactor, run `flutter test --reporter expanded` to see hangs vs failures vs passes distinctly. The default reporter buffers and lies about progress.

## Preflight Scripts and Test Regex

- When a preflight/CI script greps test output to compute pass/fail counts, ensure the regex correctly handles **skipped, pending, and xit** entries. Symptom: preflight reports "10/10 passing" when actually "8 passing, 2 skipped" — the regex matched the total but missed that 2 weren't real passes.
- Always verify with two independent counts: `grep -c "PASS"` should equal the number reported by the test runner's own summary. Mismatch = broken regex.
- For Flutter: `flutter test --machine` emits structured JSON. Prefer that over grepping human-readable output when scripting.
- For Jest/Vitest: use `--json` flag + `jq` to read counts authoritatively.

## Verification Hygiene

- After running tests, capture: `(a) exit code`, `(b) pass count`, `(c) baseline from prior run if known`. A regression (pass count below baseline) is failing tests masquerading as success.
- `tests pass` is not a complete claim — `tests pass at count N, baseline was M, delta +K` is. See `/ship-verify` Section C.
