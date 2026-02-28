# SHIP Documentation — TSExample v0.1.0

> **Date**: 2026-02-28 | **Phase**: SHIP | **Tier**: 2 (Light Cycle)

---

## 3-Sentence Summary

**TSExample** is an Example-Driven Development framework for TypeScript/Deno
that lets test methods return objects and form dependency chains using
`@Example` and `@Given` decorators. It solves the problem of duplicated setup
code and isolated test structure by allowing producers to feed deep-cloned
fixtures to consumers, with automatic skip-on-failure propagation for better
defect localization. Deno developers who want more expressive, maintainable test
suites with declarative dependency relationships should use TSExample.

---

## 60-Second Explainer

### Core API (3 symbols)

```typescript
import { Example, Given, registerSuite } from './src/mod.ts';
```

- `@Example()` — marks a method as a named example that returns a fixture
- `@Given('producerName')` — declares a dependency; receives a deep clone of the
  producer's return value
- `registerSuite(MyClass)` — registers all examples as Deno.test sub-steps in
  topological order

### Installation

Clone the repo and import directly (no package registry in v0.1):

```typescript
import { Example, Given, registerSuite } from './src/mod.ts';
```

### Usage

```typescript
class MoneyExample {
  @Example()
  empty(): Money {
    return { amount: 0, currency: 'CHF' };
  }

  @Example()
  @Given('empty')
  addDollars(money: Money): Money {
    return { amount: money.amount + 10, currency: 'USD' };
  }
}

registerSuite(MoneyExample);
// -> deno test runs: empty -> addDollars in correct order
```

### Key Behavior

When a producer fails, all transitive consumers are **skipped** (not failed):

```
setup     -> PASSED
failingStep -> FAILED (intentional)
downstream  -> SKIPPED (not executed, not marked as failed)
```

This improves defect localization — you see exactly which example broke, not a
cascade of false failures.

---

## 9-Minute Deep Dive

### Architecture: FCIS

TSExample separates concerns into two zones:

**Functional Core** (`src/core/`): Pure functions and types with zero side
effects.

| Module        | Purpose                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `types.ts`    | `ExampleMetadata`, `ExampleResult`, `CloneStrategy`, `DependencyEdge`            |
| `registry.ts` | `ExampleRegistry` — in-memory Map store for metadata + cached results            |
| `graph.ts`    | `buildGraph()`, `topoSort()` (Kahn's algorithm), `detectCycles()` (DFS coloring) |
| `clone.ts`    | `cloneFixture()` (structuredClone default), `isClassInstance()` guard            |

**Imperative Shell** (`src/runner/`): Owns all I/O and runtime interaction.

| Module            | Purpose                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `decorators.ts`   | `@Example()`, `@Given()` — Stage 3 decorators with `addInitializer`                      |
| `runner.ts`       | `ExampleRunner` — orchestrates: detect cycles -> topo sort -> execute -> skip-on-failure |
| `deno-adapter.ts` | `registerSuite()` — bridges to `Deno.test()` with `t.step()` per example                 |

### Why Deno?

- **Stage 3 decorators**: Deno 2.x supports them natively — no
  `experimentalDecorators` flag needed
- **structuredClone**: Available as a global — no polyfill
- **Zero dependencies**: No npm packages. `jsr:@std/assert` is the only external
  import (test-only)
- **Built-in test runner**: `Deno.test()` with steps, coverage, and watch mode

### Key Design Decisions

**1. Decorator execution timing**: Stage 3 `addInitializer` runs at class
construction time (not definition time). `registerSuite()` must construct the
instance to trigger registration. This is correct and matches how Angular and
Lit use `addInitializer`.

**2. structuredClone limitation**: Deep clones lose prototype chains. v0.1
requires plain data objects for fixtures. A `clone()` protocol for class
instances is planned for v0.2.

**3. Single Deno.test per suite**: All examples register as `t.step()` children
inside one `Deno.test()` call. This gives full control over execution order
(topological) while preserving Deno's reporting format.

### Quality Metrics

| Metric                | Value                              |
| --------------------- | ---------------------------------- |
| Source files          | 7 (+ 1 barrel)                     |
| Source LOC            | ~400                               |
| Tests                 | 68                                 |
| Line coverage         | 90.7%                              |
| Branch coverage       | 83.1%                              |
| External dependencies | 0 (runtime), 1 (test: @std/assert) |

### What's Next (v0.2 Roadmap)

- `clone()` protocol for class instance fixtures
- Cross-file example dependencies
- Mermaid dependency graph visualization
- deno-adapter unit test coverage improvement
- Potential JSR publication

---

## Release Checklist

- [x] All quality gates pass (fmt, lint, check, test, coverage)
- [x] W-Model Review #1 passed (`docs/3-60-9/review-1.md`)
- [x] README.md updated with Quick Start, API reference, architecture
- [x] CHANGELOG.md updated with BUILD phase entries
- [x] Ship documentation created (`docs/3-60-9/ship-1.md`)
- [ ] Git tag v0.1.0 created
- [ ] GitHub release published

---

**Shipped**: 2026-02-28
