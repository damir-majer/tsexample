# TSExample

Example-Driven Development (EDD) framework for TypeScript. Supports both Deno
and Node.js/Vitest.

Inspired by [JExample](https://scg.unibe.ch/research/jexample) research from the
University of Bern, TSExample brings declarative test dependency chains to the
TypeScript ecosystem using Stage 3 decorators.

**Status**: v0.4.0 (Explore)

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

### 2. Run (Deno)

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

### Using with Vitest

TSExample also works with Vitest on Node.js. Import from `mod.vitest.ts` instead
of `mod.ts`:

```typescript
import { Example, Given, registerSuite } from '../../src/mod.vitest.ts';

class MoneyExample {
  @Example()
  empty(): Money {
    const money: Money = { amount: 0, currency: 'CHF' };
    return money;
  }

  @Example()
  @Given('empty')
  addDollars(money: Money): Money {
    return { amount: money.amount + 10, currency: 'USD' };
  }
}

registerSuite(MoneyExample);
```

```bash
npx vitest run
```

The API is identical — only the import path differs. The Vitest adapter maps
`registerSuite()` to `describe/test/beforeAll` instead of `Deno.test()`.

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

### Interfaces

#### `Cloneable<T>`

Implement this interface on fixture classes to preserve prototype chains through
the EDD dependency chain. Without it, `structuredClone` strips prototypes.

```typescript
import type { Cloneable } from './src/mod.ts';

class Money implements Cloneable<Money> {
  constructor(public amount: number, public currency: string) {}

  add(n: number): Money {
    return new Money(this.amount + n, this.currency);
  }

  clone(): Money {
    return new Money(this.amount, this.currency);
  }
}
```

When a fixture implements `Cloneable`, TSExample calls `clone()` instead of
`structuredClone`, preserving `instanceof` and prototype methods.

### Utilities

#### `renderMermaid(examples: ExampleMetadata[]): string`

Generates a Mermaid `graph TD` diagram from example metadata. Useful for
visualizing dependency chains in documentation.

```typescript
import { ExampleRegistry, renderMermaid } from './src/mod.ts';

const diagram = renderMermaid(registry.all());
// "graph TD\n  empty --> addDollars\n  addDollars --> convert\n"
```

### Types

| Type              | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `ExampleMetadata` | `{ name, method, given }` — metadata for a registered example |
| `ExampleResult`   | `{ value, status, error? }` — result after execution          |
| `ExampleStatus`   | `'passed' \| 'failed' \| 'skipped'`                           |
| `CloneStrategy`   | `'structured' \| ((value: unknown) => unknown)`               |
| `DependencyEdge`  | `{ from, to }` — edge in the dependency graph                 |
| `Cloneable<T>`    | `{ clone(): T }` — implement for prototype-preserving clones  |

### Multi-Producer Arguments

An example can depend on multiple producers. Each producer's fixture is passed
as a separate argument, in the order declared in `@Given()`:

```typescript
class VectorExample {
  @Example()
  origin(): Vec2 {
    return { x: 0, y: 0 };
  }

  @Example()
  @Given('origin')
  moveRight(v: Vec2): Vec2 {
    return { x: v.x + 10, y: v.y };
  }

  @Example()
  @Given('origin')
  moveUp(v: Vec2): Vec2 {
    return { x: v.x, y: v.y + 5 };
  }

  @Example()
  @Given('moveRight', 'moveUp')
  addVectors(right: Vec2, up: Vec2): Vec2 {
    return { x: right.x + up.x, y: right.y + up.y };
  }
}
```

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
    types.ts              # ExampleMetadata, ExampleResult, CloneStrategy, Cloneable
    registry.ts           # ExampleRegistry — in-memory store
    graph.ts              # buildGraph, topoSort, detectCycles, renderMermaid
    clone.ts              # cloneFixture, isClassInstance, isCloneable
  runner/                 # Imperative Shell (runtime integration)
    decorators.ts         # @Example(), @Given() — Stage 3 decorators
    runner.ts             # ExampleRunner — orchestrates execution
    deno-adapter.ts       # registerSuite() — bridges to Deno.test()
    vitest-adapter.ts     # registerSuite() — bridges to Vitest describe/test
  mod.ts                  # Public API barrel (Deno)
  mod.vitest.ts           # Public API barrel (Vitest)
```

**Core** is pure: no I/O, no side effects, testable without any runtime
permissions. **Runner** owns all side effects: test framework registration,
global state, async execution. The two adapter files (`deno-adapter.ts`,
`vitest-adapter.ts`) are the only runtime-specific code — everything else is
shared.

---

## Known Limitations (v0.4)

- **Single-class suites**: Dependencies cannot span across different suite
  classes.
- **Sequential execution**: Examples run sequentially in topological order (no
  parallel execution).

---

## Development

```bash
deno task test           # Run Deno tests (100 tests)
deno task test:vitest    # Run Vitest tests (13 tests)
deno task test:all       # Run both Deno + Vitest tests
deno task test:coverage  # Deno coverage report
deno task check          # Type checking (entry-point mode)
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

**Last Updated**: 2026-02-28 (v0.4.0)
