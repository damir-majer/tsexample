# CHANGELOG

All notable changes to the TSExample project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

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
