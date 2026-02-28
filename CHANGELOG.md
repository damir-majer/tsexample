# CHANGELOG

All notable changes to the TSExample project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

---

## v0.5.0 (2026-02-28)

- **Example descriptions**: `@Example()` accepts an options object with optional
  `description` field. Backwards-compatible — `@Example()`, `@Example('name')`,
  and `@Example({ name, description })` all work.
- **Suite reports**: New `buildReport()` pure function produces structured
  `SuiteReport` JSON from metadata + results. Includes summary counts,
  per-example entries with descriptions, and a Mermaid dependency graph.
- New types: `ExampleOptions`, `SuiteReport`, `SuiteReportEntry`,
  `SuiteReportSummary`.

---

## [0.4.0] — 2026-02-28

**Cycle 4 complete.** Vitest adapter graduation. The spike
(`playground/vitest-adapter-spike/`) proved the core works on Node.js/Vitest —
now the adapter lives in the TSExample repo with full test coverage and
dual-barrel exports.

### Added

- **Vitest adapter** (`src/runner/vitest-adapter.ts`): Bridges TSExample to
  Vitest's `describe/test/beforeAll`. Same `registerSuite()` API as the Deno
  adapter, identical function signature.
- **Vitest barrel** (`src/mod.vitest.ts`): Public API barrel that re-exports the
  same API as `mod.ts` but swaps the Deno adapter for the Vitest adapter.
- **Vitest test suite** (`tests/vitest/vitest_adapter.test.ts`): 13 tests across
  4 suites:
  - MoneySuite — basic producer-consumer chain (3 examples)
  - DiamondSuite — diamond dependency pattern (4 examples)
  - IsolationSuite — fixture cloning prevents mutation leaks (3 examples)
  - BrokenChainSuite — skip-on-failure propagation (3 tests via direct runner)
- **Decision record**: DEC-005 (dual-adapter barrels)
- New tasks in `deno.json`: `test:vitest`, `test:all`
- `package.json` with Vitest devDependency
- `vitest.config.ts` scoped to `tests/vitest/`

### Changed

- `deno.json` `check` task: `src/**/*.ts` → `src/mod.ts` (entry-point mode,
  naturally excludes vitest-specific files from Deno type-checker)
- `deno.json`: Added `test.exclude`, `fmt.exclude`, `lint.exclude` for
  `tests/vitest/` and `node_modules/`
- README: Added Vitest section, updated architecture tree, removed "Deno only"
  limitation

### Metrics

| Metric       | v0.3 | v0.4 | Delta |
| ------------ | ---- | ---- | ----- |
| Deno tests   | 100  | 100  | +0    |
| Vitest tests | —    | 13   | +13   |
| Total tests  | 100  | 113  | +13   |
| Source files | 7+1  | 8+2  | +2    |
| Adapters     | 1    | 2    | +1    |

---

## [0.3.0] — 2026-02-28

**Cycle 3 complete.** Housekeeping + hardening cycle. Decision records close 3
cycles of deferred documentation debt. Adapter test extraction doubles branch
coverage on the longest-standing tech debt item.

### Added

- **Slice 1 — Decision Records**: 4 ADR files in `docs/decisions/` documenting
  key architecture decisions from Cycles 1-2:
  - DEC-001: Stage 3 decorator timing (`addInitializer` at construction)
  - DEC-002: Cloneable interface (structuredClone prototype loss)
  - DEC-003: Single Deno.test per suite (topological ordering control)
  - DEC-004: 3-priority clone dispatch (custom > Cloneable > structuredClone)
- **Slice 2 — deno-adapter.ts Unit Tests**: Extracted 2 pure helper functions
  (`formatStepName`, `resolveStepError`) from imperative shell. 9 new unit
  tests. Branch coverage 40% → 80%.
- W-Model Review #3: `docs/3-60-9/review-3.md`

### Changed

- `deno-adapter.ts` refactored: step-name formatting and error resolution
  extracted into exported pure helpers (FCIS compliance)
- NEXT-CYCLE.md: removed JSR publication (private library, JSR requires public)

### Metrics

| Metric          | v0.2  | v0.3  | Delta  |
| --------------- | ----- | ----- | ------ |
| Tests           | 91    | 100   | +9     |
| Line coverage   | 92.8% | 94.9% | +2.1%  |
| Branch coverage | 86.9% | 88.5% | +1.6%  |
| deno-adapter.ts | 40%   | 80%   | +40 pp |

---

## [0.2.0] — 2026-02-28

**Cycle 2 complete.** BUILD > REVIEW > SHIP in continuation session. All 4
slices shipped (3 planned + 1 stretch). Full JExample feature parity achieved.

### Added

- **Slice 1 — Mermaid Dependency Graph Visualization**: `renderMermaid()` pure
  function in `graph.ts` generates `graph TD` Mermaid syntax from example
  metadata. Alphabetical sorting for deterministic output. 6 new tests.
- **Slice 2 — Producer Validation at Registration Time**:
  `@Given('nonExistent')` now throws a descriptive error
  (`TSExample: Example "X" depends on "Y" which
  is not registered.`) before
  any execution starts. Fail-fast behavior. 5 new tests (3 runner + 2 adapter).
- **Slice 3 — Clone Protocol for Class Instances**: `Cloneable<T>` interface
  with `clone(): T` method. `isCloneable()` type guard. 3-priority clone
  dispatch: custom strategy > `clone()` > `structuredClone`. Preserves
  `instanceof` and prototype methods through EDD chains. 8 new tests (7 unit + 1
  integration with Money class).
- **Slice 4 — Multi-Producer Arguments (stretch)**: `@Given('a', 'b')` maps N
  producers to N method arguments. Diamond dependency pattern support. Was
  already implemented in v0.1 runner but untested. 4 new tests (3 runner + 1
  integration with VectorExample).
- New exports in `mod.ts`: `renderMermaid`, `isCloneable`, `Cloneable` (type)
- New test files: `deno_adapter_test.ts`, `cloneable_suite_test.ts`,
  `multi_producer_test.ts`
- W-Model Review #2: `docs/3-60-9/review-2.md`

### Changed

- `cloneFixture()` now uses 3-priority dispatch (custom strategy > Cloneable >
  structuredClone) instead of 2-priority (custom strategy > structuredClone)
- Updated README with Cloneable, multi-producer, renderMermaid documentation

### Removed

- Unreachable dead code guard in `detectCycles()` (formerly line 148 in
  `graph.ts`)

### Metrics

| Metric          | v0.1  | v0.2  | Delta |
| --------------- | ----- | ----- | ----- |
| Tests           | 68    | 91    | +23   |
| Line coverage   | 90.7% | 92.8% | +2.1% |
| Branch coverage | 83.1% | 86.9% | +3.8% |
| Test files      | 8     | 11    | +3    |

---

## [0.1.0] — 2026-02-28

**Cycle 1 complete.** SHAPE > BET > BUILD > REVIEW > SHIP > COOL-DOWN in single
session (~3 hours). SMART: 8/8 objectives met, 2 exceeded.

### Added

- **Slice 1 — Registry + Basic Example Execution**: `@Example()` decorator
  registers methods, `registerSuite()` bridges to `Deno.test()` with sub-steps
- **Slice 2 — Dependency Graph + @Given() + Fixture Injection**: `@Given()`
  decorator declares producer dependencies, `topoSort()` (Kahn's algorithm)
  resolves execution order, `cloneFixture()` deep-clones fixtures between
  producer and consumer
- **Slice 3 — Skip-on-Failure Propagation**: When a producer fails, all
  transitive consumers are SKIPPED (not FAILED) — improving defect localization
- Core types: `ExampleMetadata`, `ExampleResult`, `DependencyEdge`,
  `CloneStrategy`, `ExampleStatus`
- Core modules: `registry.ts` (ExampleRegistry), `graph.ts` (buildGraph,
  topoSort, detectCycles), `clone.ts` (cloneFixture, isClassInstance)
- Runner modules: `decorators.ts` (@Example, @Given with Stage 3 decorators),
  `runner.ts` (ExampleRunner), `deno-adapter.ts` (registerSuite)
- Public API barrel: `mod.ts` — exports decorators, adapter, runner, registry,
  types
- 68 tests: 42 core unit tests + 22 runner unit tests + 4 integration tests
- 90.7% line coverage, 83.1% branch coverage
- Integration tests: `basic_suite_test.ts`, `money_suite_test.ts`,
  `broken_chain_test.ts`
- SHAPE phase mini-pitch: `docs/pitches/tsexample-v0.1-mini-pitch.md`
- W-Model Review #1: `docs/3-60-9/review-1.md`

### Infrastructure

- Project scaffolding via ASE-AIDW Init Agent
- Deno 2.x configuration (deno.json with test, check, lint tasks)
- Directory structure: src/core, src/runner, tests, docs
- Five slash commands: shape, build, review, ship, cooldown
- Git initialization and .gitignore
- Project CLAUDE.md with AIDW workflow configuration
- `.gitignore` with Deno defaults
- `deno.json` with tasks: test, test:coverage, check, fmt, fmt:check, lint
- `.claude/commands/` directory with phase-specific workflows
- `docs/` subdirectories: pitches/archive, decisions, 3-60-9, retrospectives
- GitHub private repo: `damir-majer/tsexample`

---

## Vision

TSExample is an Example-Driven Development framework for TypeScript/Deno,
inspired by JExample research from the University of Bern. The goal is to enable
declarative test organization using decorators and example linking, making test
suites more readable and maintainable for Deno developers.

---

**Notes for Contributors**:

- Update this file after each completed vertical slice (PEP cycle)
- Document major decisions in `docs/decisions/`
- Use semantic versioning: MAJOR.MINOR.PATCH
- Reference phase command (e.g., completed `/build Cycle 1`) when applicable
