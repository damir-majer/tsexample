# TSExample

Example-Driven Development (EDD) framework for TypeScript/Deno.

Inspired by [JExample](https://scg.unibe.ch/research/jexample) research from the
University of Bern, TSExample brings declarative test dependency chains to the
TypeScript ecosystem using Stage 3 decorators.

**Status**: v0.1.0 (Explore)

---

## Why EDD?

Traditional unit tests duplicate setup code across isolated test methods.
Example-Driven Development lets tests **return objects** and form **dependency
chains** — each consumer test receives a deep clone of its producer's return
value. When a producer fails, all transitive consumers are **skipped** (not
failed), improving defect localization.

```
empty() -> addDollars(money) -> convert(money)
  |             |                    |
  v             v                    v
 PASS         PASS                 PASS

If addDollars fails:
  empty() -> addDollars(money) -> convert(money)
    |             |                    |
    v             v                    v
  PASS         FAILED              SKIPPED  <-- not FAILED
```

---

## Quick Start

### 1. Define a suite

```typescript
import { Example, Given, registerSuite } from './src/mod.ts';
import { assertEquals } from 'jsr:@std/assert@^1.0.19';

interface Money {
  amount: number;
  currency: string;
}

class MoneyExample {
  @Example()
  empty(): Money {
    const money: Money = { amount: 0, currency: 'CHF' };
    assertEquals(money.amount, 0);
    return money;
  }

  @Example()
  @Given('empty')
  addDollars(money: Money): Money {
    const result: Money = { amount: money.amount + 10, currency: 'USD' };
    assertEquals(result.amount, 10);
    return result;
  }

  @Example()
  @Given('addDollars')
  convert(money: Money): Money {
    const result: Money = {
      amount: Math.round(money.amount * 0.92),
      currency: 'EUR',
    };
    assertEquals(result.currency, 'EUR');
    return result;
  }
}

registerSuite(MoneyExample);
```

### 2. Run

```bash
deno test --allow-read --allow-env
```

Output:

```
MoneyExample ...
  empty ... ok (0ms)
  addDollars ... ok (0ms)
  convert ... ok (0ms)
MoneyExample ... ok (1ms)
```

---

## API Reference

### Decorators

#### `@Example(name?: string)`

Marks a method as an example. The method's return value becomes a **fixture**
that downstream consumers can depend on.

- `name` — Optional custom name. Defaults to the method name.
- Place `@Example()` above `@Given()` when combining both.

#### `@Given(...producers: string[])`

Declares that this example depends on one or more producer examples. The
producer's return value is deep-cloned and passed as the method argument.

- `producers` — Names of producer examples (must match their `@Example` names).

### Functions

#### `registerSuite(SuiteClass: new () => object, options?: RegisterSuiteOptions)`

Registers a decorated class as a Deno test suite. Creates one `Deno.test()` with
sub-steps for each example in topological (dependency) order.

- `SuiteClass` — A class whose methods are decorated with `@Example` / `@Given`.
- `options.cloneStrategy` — Custom clone function. Default: `structuredClone`.

### Types

| Type              | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `ExampleMetadata` | `{ name, method, given }` — metadata for a registered example |
| `ExampleResult`   | `{ value, status, error? }` — result after execution          |
| `ExampleStatus`   | `'passed' \| 'failed' \| 'skipped'`                           |
| `CloneStrategy`   | `'structured' \| ((value: unknown) => unknown)`               |
| `DependencyEdge`  | `{ from, to }` — edge in the dependency graph                 |

### Advanced: Programmatic API

For custom test harnesses or non-Deno runners:

```typescript
import { ExampleRegistry, ExampleRunner } from './src/mod.ts';

const registry = new ExampleRegistry();
registry.register({ name: 'root', method: 'root', given: [] });

const runner = new ExampleRunner(registry);
const results = await runner.run(suiteInstance);
```

---

## Architecture

TSExample follows the **FCIS pattern** (Functional Core, Imperative Shell):

```
src/
  core/                   # Functional Core (pure, no I/O)
    types.ts              # ExampleMetadata, ExampleResult, CloneStrategy
    registry.ts           # ExampleRegistry — in-memory store
    graph.ts              # buildGraph, topoSort, detectCycles
    clone.ts              # cloneFixture, isClassInstance
  runner/                 # Imperative Shell (Deno integration)
    decorators.ts         # @Example(), @Given() — Stage 3 decorators
    runner.ts             # ExampleRunner — orchestrates execution
    deno-adapter.ts       # registerSuite() — bridges to Deno.test()
  mod.ts                  # Public API barrel
```

**Core** is pure: no I/O, no side effects, testable without any Deno
permissions. **Runner** owns all side effects: `Deno.test()` registration,
global state, async execution.

---

## Known Limitations (v0.1)

- **Plain data fixtures only**: `structuredClone` does not preserve prototype
  chains. Use interfaces/plain objects for fixtures, not class instances with
  methods. A `clone()` protocol for class instances is planned for v0.2.
- **Single-class suites**: Dependencies cannot span across different suite
  classes.
- **Deno only**: No Vitest, Jest, or Node.js adapter in v0.1.
- **Sequential execution**: Examples run sequentially in topological order (no
  parallel execution).

---

## Development

```bash
deno task test           # Run all tests (68 tests)
deno task test:coverage  # Coverage report (90.7% line, 83.1% branch)
deno task check          # Type checking
deno task lint           # Lint
deno task fmt            # Format
```

---

## Research Background

TSExample implements the core ideas from:

- **JExample** (Kuhn & Nierstrasz, 2008) — Example-Driven Development for Java
- **Glamorous Toolkit** (feenk, 2016-present) — Moldable development in Pharo
  Smalltalk

This is the first EDD framework for the TypeScript/JavaScript ecosystem.

---

## License

MIT

---

**Last Updated**: 2026-02-28
