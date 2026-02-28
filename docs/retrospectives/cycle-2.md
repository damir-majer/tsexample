# 4L Retrospective — Cycle 2 (v0.2.0)

> **Date**: 2026-02-28 | **Tier**: 2 (Light Cycle) | **3X**: Explore
> **Duration**: ~1.5 hours (BUILD through SHIP, continuation session)

---

## Liked

- **All 4 slices shipped including stretch**: Cycle 1 deferred 1 of 4 slices.
  Cycle 2 shipped all 4, including the stretch goal (multi-producer). The
  scoping in NEXT-CYCLE.md was accurate — estimated effort matched reality.
- **Zero new source files**: All 4 features were added by extending existing
  modules. This validates the v0.1 architecture — the FCIS separation and module
  boundaries held up under extension. `types.ts`, `clone.ts`, `graph.ts`, and
  `runner.ts` each grew incrementally.
- **Parallel agent BUILD worked again**: Slices 1 and 2 ran in parallel
  (different files, no overlap). Combined cleanly — 79 tests on first
  integration pass. The pattern from Cycle 1 scales reliably.
- **Multi-producer discovery**: The NEXT-CYCLE.md said "the runner passes only
  the first producer's fixture" — but the v0.1 runner already supported N
  producers via `exMeta.given.map(...)`. Writing tests proved the feature
  existed. This is EDD in practice: tests as a discovery mechanism.
- **Integration tests keep getting better**: `cloneable_suite_test.ts` (Money
  with `instanceof` assertions through the chain) and `multi_producer_test.ts`
  (VectorExample diamond pattern) are excellent copy-paste examples. The test
  suite now has 6 integration patterns covering every major feature.
- **Coverage only went up**: 90.7% → 92.8% line, 83.1% → 86.9% branch. Adding
  features increased coverage rather than degrading it. TDD-first discipline
  maintained.

## Learned

- **NEXT-CYCLE.md can be wrong**: The multi-producer documentation said code
  changes were needed when they weren't. Lesson: always verify assumptions with
  tests before implementing. The "stretch" goal turned out to be the simplest
  slice because it was already done.
- **3-priority dispatch is clean**: The clone priority chain (custom > Cloneable
  > structuredClone) is easy to reason about and test. Each priority level has
  > its own test. No edge cases between priorities because they're mutually
  > exclusive checks (typeof function → has clone() → default).
- **topoSort doesn't guarantee order of independent roots**: The multi-producer
  skip-on-failure test initially assumed `ok` would sort before `fail`. Kahn's
  algorithm processes roots in alphabetical order (due to our `queue.sort()`),
  so `fail` came before `ok`. Fixed by making the test order-independent.
- **Dead code removal is easy during related work**: The `detectCycles()` dead
  guard (flagged in review-1) was trivially removed while working on
  `renderMermaid()` in the same file. Piggybacking tech debt cleanup on feature
  work is efficient.
- **Cloneable<T> generic is the right design**: `clone(): T` returns a typed
  value, so consumers get proper type inference. The alternative
  (`clone():
  unknown`) would have required casts everywhere. The
  `implements Cloneable<Money>` pattern is familiar from Java's `Cloneable` and
  Rust's `Clone` trait.

## Lacked

- **deno-adapter.ts unit tests still at 40%**: Added `deno_adapter_test.ts` but
  it tests the decorator-to-runner pipeline, not the adapter's Deno.test()
  registration directly. The core problem remains: mocking `Deno.test()` and
  `t.step()` is awkward without a proper test context injection point.
- **Decision records still missing**: Three cycles of deferred decision records.
  Key decisions now span both cycles: (1) Cloneable interface over decorator/
  registry alternatives, (2) 3-priority clone dispatch, (3) decorator execution
  timing, (4) single Deno.test per suite. These should be documented before the
  context is lost.
- **No `--watch` verification**: Still haven't confirmed that
  `deno test --watch` works correctly with `registerSuite()` and the new
  features.
- **README could show renderMermaid output visually**: The Mermaid function is
  documented but there's no rendered diagram example in the README. A screenshot
  or embedded Mermaid block would help.

## Long-Term Improvements

- **JSR publication for v0.3**: The API surface is now stable enough. Three
  public symbols (`@Example`, `@Given`, `registerSuite`) plus three utility
  exports (`renderMermaid`, `Cloneable`, `isCloneable`). JSR would make
  TSExample installable via `deno add`.
- **Vitest/Node adapter**: The core is runtime-agnostic. A Vitest adapter would
  expand the audience beyond Deno. Needs research into Vitest's custom runner
  API.
- **Cross-file dependencies**: The single-class limitation is the biggest
  remaining constraint. Would require a file-level coordination mechanism
  (shared registry, import-time registration).
- **Consider Expand 3X for v0.3**: Two cycles at Explore have proven the concept
  and stabilized the API. If JSR publication is the goal, Expand (80% threshold,
  standard rigor) is appropriate.
- **Decision records sprint**: Batch-create decision records for all key
  decisions from both cycles before the context fades.

---

## SMART Check

| Objective                                 | Target                               | Actual                               | Status   | Evidence                                   |
| ----------------------------------------- | ------------------------------------ | ------------------------------------ | -------- | ------------------------------------------ |
| Mermaid visualization (`renderMermaid()`) | Working function                     | Working function                     | PASS     | 6 tests, deterministic alphabetical output |
| Producer validation at registration       | Descriptive error before execution   | Descriptive error before execution   | PASS     | 5 tests (3 runner + 2 adapter)             |
| Clone protocol (`Cloneable<T>`)           | `instanceof` preserved through chain | `instanceof` preserved through chain | PASS     | `cloneable_suite_test.ts` Money class      |
| Multi-producer args (`@Given('a','b')`)   | N producers → N method args          | Already working, tests added         | EXCEEDED | 4 tests + VectorExample integration        |
| Coverage >= 50% (Explore)                 | 50%                                  | 92.8% line, 86.9% branch             | EXCEEDED | `deno task test:coverage`                  |
| All quality gates                         | Pass                                 | Pass                                 | PASS     | fmt, lint, check, test all clean           |
| Documentation                             | Updated README + CHANGELOG           | Updated + ship doc + review doc      | EXCEEDED | 4 doc files updated/created                |

**SMART Score**: 7/7 objectives met, 3 exceeded. Cycle 2 fully achieved its
goals. The stretch goal (Slice 4) required zero code changes — only tests.

---

## Context Hygiene

- [x] CHANGELOG.md updated with v0.2.0 release notes
- [x] README.md updated with Cloneable, multi-producer, renderMermaid
- [x] Coverage report reviewed (92.8% line, 86.9% branch)
- [x] Test count verified (91 tests, 0 failures)
- [x] W-Model Review #2 created (`docs/3-60-9/review-2.md`)
- [x] SHIP documentation created (`docs/3-60-9/ship-2.md`)
- [x] GitHub release v0.2.0 published
- [ ] Decision records not created (Low severity — deferred to v0.3)
- [ ] NEXT-CYCLE.md updated for v0.3

---

## Cycle Metrics

| Metric           | Cycle 1 (v0.1)       | Cycle 2 (v0.2)               | Delta |
| ---------------- | -------------------- | ---------------------------- | ----- |
| Total slices     | 3 (of 4, 1 deferred) | 4 (of 4, stretch included)   | +1    |
| Tests            | 68                   | 91                           | +23   |
| Line coverage    | 90.7%                | 92.8%                        | +2.1% |
| Branch coverage  | 83.1%                | 86.9%                        | +3.8% |
| Source files     | 7 + 1 barrel         | 7 + 1 barrel (unchanged)     | 0     |
| Test files       | 8                    | 11                           | +3    |
| New source LOC   | ~400                 | ~+100 (extensions only)      | —     |
| Commits          | 3                    | 1 (all slices in one commit) | —     |
| Session duration | ~3 hours             | ~1.5 hours                   | -50%  |

---

## Cumulative SMART Trajectory

| Cycle     | Objectives | Met    | Exceeded | Score     |
| --------- | ---------- | ------ | -------- | --------- |
| 1 (v0.1)  | 8          | 6      | 2        | 8/8       |
| 2 (v0.2)  | 7          | 4      | 3        | 7/7       |
| **Total** | **15**     | **10** | **5**    | **15/15** |

---

**End of Cycle 2.**
