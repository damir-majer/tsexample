# 4L Retrospective — Cycle 1 (v0.1.0)

> **Date**: 2026-02-28 | **Tier**: 2 (Light Cycle) | **3X**: Explore
> **Duration**: ~3 hours (SHAPE through SHIP in single session)

---

## Liked

- **FCIS separation worked beautifully**: The core/runner split was clean from
  the start. Core modules have zero I/O — tested without any Deno permissions.
  Runner owns all side effects. No leakage in either direction.
- **Stage 3 decorators are production-ready**: `addInitializer` pattern worked
  exactly as designed. No workarounds needed. Deno 2.x supports this natively
  with `"experimentalDecorators": false`.
- **Parallel agent BUILD strategy**: Three core modules (registry, graph, clone)
  built in parallel by independent agents, then verified together — 42 tests all
  passing on first integration. This saved significant time.
- **Integration tests as documentation**: `money_suite_test.ts` is a
  copy-paste-ready example that demonstrates the entire EDD pattern in 47 lines.
  `broken_chain_test.ts` proves the core differentiator (skip-on-failure).
- **Coverage exceeded expectations**: 90.7% line / 83.1% branch for an Explore
  3X project (threshold: 50%). TDD-first naturally produced high coverage.
- **Mini-pitch was a good forcing function**: The breadboard tables and rabbit
  holes in the pitch document directly translated into implementation decisions.
  Every rabbit hole was addressed.
- **Clean API surface**: Three symbols (`@Example`, `@Given`, `registerSuite`)
  are enough for the common case. Advanced users can reach for `ExampleRunner`
  and `ExampleRegistry` directly.

## Learned

- **Stage 3 decorator type constraint is bidirectional**: Using
  `(...args: unknown[]) => unknown` rejects typed method signatures like
  `(money: Money)` because `unknown` is not assignable to `Money`. The fix is
  `(...args: any[]) => any` with targeted lint-ignore. This is a TypeScript
  limitation, not a bug.
- **structuredClone loses prototype chains**: Confirmed experimentally.
  `structuredClone(new Point(3,4))` returns a plain object. This is fundamental
  to the structured clone algorithm (HTML spec), not a Deno limitation. The
  `clone()` protocol deferred to v0.2 is the correct long-term solution.
- **Deno has no native step-skip mechanism**: `t.step()` in `Deno.test()` has no
  `skip` option. The `[SKIPPED]` prefix convention in `deno-adapter.ts` is a
  workaround. Deno may add this in a future version.
- **broken_chain_test.ts required rewrite**: Initial version used
  `registerSuite()` which caused the intentional failure to propagate as an
  actual Deno test failure. Rewriting to use `ExampleRunner` directly and assert
  on result statuses programmatically was the correct approach for testing
  skip-on-failure behavior.
- **EDD is genuinely novel in TypeScript**: Research confirmed no TypeScript/JS
  EDD framework exists. PHPUnit `@depends` is the only active non-Pharo/Java
  implementation. This positions TSExample uniquely.
- **Kahn's algorithm gives cycle detection for free**: If sorted count < total
  nodes, a cycle exists. The separate `detectCycles()` with DFS coloring is only
  needed for the cycle path (user-facing error message).

## Lacked

- **deno-adapter.ts unit tests**: 40% branch coverage. The adapter works (proven
  by 3 integration tests) but lacks direct unit testing. The Deno.test() mocking
  story is unclear — would need to inject a test context mock.
- **Decision records**: No `docs/decisions/` files created despite the pitch
  recommending them. Key decisions (decorator timing, structuredClone
  limitation, single Deno.test per suite) are documented in the pitch and code
  JSDoc but not in standalone decision files.
- **Error messages for missing producers**: If `@Given('nonExistent')`
  references a producer that doesn't exist, the error occurs at runtime during
  `topoSort` (the node appears in the graph but has no metadata). The error
  message is not user-friendly. Should be caught during registration.
- **No `--watch` integration testing**: Didn't verify that `deno test --watch`
  works correctly with `registerSuite()`. It should work (module-level
  registration) but wasn't tested.

## Long-Term Improvements

- **v0.2 Priority: `clone()` protocol**: The structuredClone limitation is the
  single biggest constraint. Implementing a `clone()` method protocol (or
  `@Cloneable` decorator) would unlock class instance fixtures.
- **Producer validation at registration time**: Catch `@Given('nonExistent')`
  during `registerSuite()` before any execution starts. Fail fast with a clear
  message.
- **Consider JSR publication for v0.3**: Once the API stabilizes after v0.2, JSR
  publication would make TSExample installable with `deno add`.
- **AIDW process improvement**: The single-session approach (SHAPE through SHIP)
  worked for this small project but would not scale. For v0.2, split across
  multiple sessions with proper handoff documents.
- **Graph visualization (Mermaid)**: Slice 4 was deferred. Low effort, high
  documentation value. Should be first slice of v0.2.

---

## SMART Check

| Objective                                 | Target            | Actual                         | Status   | Evidence                                 |
| ----------------------------------------- | ----------------- | ------------------------------ | -------- | ---------------------------------------- |
| Core decorator API (`@Example`, `@Given`) | Working           | Working                        | PASS     | 11 decorator tests, 3 integration tests  |
| Dependency chain execution                | Topological order | Topological order              | PASS     | `topoSort` tests + `money_suite_test.ts` |
| Fixture injection with cloning            | Deep clone        | Deep clone (structuredClone)   | PASS     | `runner_test.ts` reference check         |
| Skip-on-failure propagation               | Transitive skip   | Transitive skip                | PASS     | `broken_chain_test.ts`                   |
| Deno.test() integration                   | Seamless          | Seamless                       | PASS     | `registerSuite()` + 3 integration suites |
| Coverage >= 50% (Explore)                 | 50%               | 90.7% line, 83.1% branch       | EXCEEDED | `deno task test:coverage`                |
| All quality gates                         | Pass              | Pass                           | PASS     | fmt, lint, check, test all clean         |
| Documentation                             | README + pitch    | README + pitch + review + ship | EXCEEDED | 4 doc files                              |

**SMART Score**: 8/8 objectives met, 2 exceeded. Cycle 1 fully achieved its
goals.

---

## Context Hygiene

- [x] CHANGELOG.md updated with cycle summary
- [x] Mini-pitch preserved in `docs/pitches/` (not archived — still current)
- [x] README reviewed for accuracy
- [x] Coverage report reviewed (90.7% line, 83.1% branch)
- [x] Test count verified (68 tests, 0 failures)
- [ ] Decision records not created (Low severity — deferred to v0.2)

---

## Cycle Metrics

| Metric           | Value                                   |
| ---------------- | --------------------------------------- |
| Total slices     | 3 (of 4 planned, 1 stretch deferred)    |
| Total PEP cycles | ~8                                      |
| Source files     | 7 + 1 barrel                            |
| Source LOC       | ~400                                    |
| Test files       | 8                                       |
| Tests            | 68                                      |
| Line coverage    | 90.7%                                   |
| Branch coverage  | 83.1%                                   |
| Commits          | 3 (scaffold, implementation, ship docs) |
| Session duration | ~3 hours                                |

---

**End of Cycle 1.**
