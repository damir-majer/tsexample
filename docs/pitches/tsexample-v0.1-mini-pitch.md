# Mini-Pitch: TSExample v0.1

> **Tier**: 2 (Light Cycle) | **3X**: Explore | **Appetite**: 2-3 days
> **Created**: 2026-02-28 | **Status**: Draft **Requirements**:
> `docs/requirements.md` (Req-IDs for traceability — to be created in BUILD)

---

## Problem

TypeScript/Deno developers have no native way to express that one test builds on
the verified output of another. Every test suite is forced to either duplicate
setup code or reach for complex fixture infrastructure — neither of which
expresses the actual logical dependency between test scenarios. JExample solved
this elegantly in Java in 2008; the pattern has never existed in the TypeScript
ecosystem.

---

## Solution

TSExample implements the core EDD pattern: tests that return objects and form
dependency chains, where each consumer test receives a deep clone of its
producer's return value. The framework uses Stage 3 TypeScript decorators
(`@Example()`, `@Given()`) to declare these relationships declaratively,
resolves execution order via topological sort (Kahn's algorithm), skips
transitive consumers on producer failure, and integrates cleanly with
`Deno.test()` so that all standard tooling (coverage, filtering, `--watch`)
continues to work.

### Rough Structure

```
src/
  core/
    types.ts          — ExampleMetadata, DependencyEdge, ExampleResult, CloneStrategy
    registry.ts       — ExampleRegistry (name -> metadata + cached result)
    graph.ts          — buildGraph(), topoSort(), detectCycles()
    clone.ts          — cloneFixture() with structuredClone + class-aware fallback
  runner/
    decorators.ts     — @Example() and @Given() Stage 3 method decorators
    runner.ts         — ExampleRunner: resolve order -> execute -> inject -> skip-on-failure
    deno-adapter.ts   — registerSuite(): registers each example as a Deno.test() step
  mod.ts              — Public API: @Example, @Given, registerSuite, ExampleResult

tests/
  core/
    registry_test.ts
    graph_test.ts
    clone_test.ts
  runner/
    decorators_test.ts
    runner_test.ts
  integration/
    money_suite_test.ts   — End-to-end: MoneyExample class demonstrating the full chain
```

---

## Breadboard Tables

### Core Module (`src/core/`)

#### Code Affordances

| Module        | Symbol                              | Kind       | Inputs                                     | Outputs                        | Notes                                                                               |
| ------------- | ----------------------------------- | ---------- | ------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| `types.ts`    | `ExampleMetadata`                   | interface  | —                                          | —                              | `name: string`, `method: string`, `given: string[]`, `cachedResult?: ExampleResult` |
| `types.ts`    | `ExampleResult`                     | interface  | —                                          | —                              | `value: unknown`, `status: 'passed' \| 'failed' \| 'skipped'`, `error?: Error`      |
| `types.ts`    | `DependencyEdge`                    | interface  | —                                          | —                              | `from: string`, `to: string`                                                        |
| `types.ts`    | `CloneStrategy`                     | type alias | —                                          | —                              | `'structured' \| 'manual' \| ((v: unknown) => unknown)`                             |
| `registry.ts` | `ExampleRegistry`                   | class      | —                                          | —                              | Holds `Map<string, ExampleMetadata>`                                                |
| `registry.ts` | `ExampleRegistry.register()`        | method     | `meta: ExampleMetadata`                    | `void`                         | Throws if duplicate name                                                            |
| `registry.ts` | `ExampleRegistry.get()`             | method     | `name: string`                             | `ExampleMetadata \| undefined` | Pure lookup                                                                         |
| `registry.ts` | `ExampleRegistry.all()`             | method     | —                                          | `ExampleMetadata[]`            | Returns all registered examples                                                     |
| `registry.ts` | `ExampleRegistry.setCachedResult()` | method     | `name: string, result: ExampleResult`      | `void`                         | Stores producer output for injection                                                |
| `registry.ts` | `ExampleRegistry.getCachedResult()` | method     | `name: string`                             | `ExampleResult \| undefined`   | Used by runner to inject fixtures                                                   |
| `graph.ts`    | `buildGraph()`                      | function   | `examples: ExampleMetadata[]`              | `Map<string, string[]>`        | Adjacency list: name -> list of dependents                                          |
| `graph.ts`    | `topoSort()`                        | function   | `graph: Map<string, string[]>`             | `string[]`                     | Kahn's BFS algorithm, stable execution order                                        |
| `graph.ts`    | `detectCycles()`                    | function   | `graph: Map<string, string[]>`             | `string[] \| null`             | Returns cycle path or null if DAG is valid                                          |
| `clone.ts`    | `cloneFixture()`                    | function   | `value: unknown, strategy?: CloneStrategy` | `unknown`                      | Default: `structuredClone`; fallback for class instances                            |
| `clone.ts`    | `isClassInstance()`                 | function   | `value: unknown`                           | `boolean`                      | Checks `Object.getPrototypeOf(v) !== Object.prototype`                              |

#### Wiring (Core)

```
registry.register(meta)
    |
    v
[ExampleRegistry Map]
    |
    v
registry.all()
    |
    v
buildGraph(examples)  -->  detectCycles(graph)  -->  [throw if cycle]
    |
    v
topoSort(graph)
    |
    v
[ordered string[]]
    |
    v
runner.ts (consumer — see Runner module)
```

---

### Runner Module (`src/runner/`)

#### Code Affordances

| Module            | Symbol                       | Kind                   | Inputs                                 | Outputs           | Notes                                                                                                                    |
| ----------------- | ---------------------------- | ---------------------- | -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `decorators.ts`   | `@Example()`                 | decorator factory      | `name?: string`                        | `MethodDecorator` | Stage 3: `(value, ctx: ClassMethodDecoratorContext) => value`. Uses `ctx.addInitializer()` to register on class creation |
| `decorators.ts`   | `@Given(...names)`           | decorator factory      | `...names: string[]`                   | `MethodDecorator` | Stage 3: same pattern, also stores `given` list in metadata                                                              |
| `decorators.ts`   | `_globalRegistry`            | module-level           | —                                      | `ExampleRegistry` | Singleton registry populated by decorator `addInitializer` callbacks                                                     |
| `runner.ts`       | `ExampleRunner`              | class                  | —                                      | —                 | Imperative shell: orchestrates the full EDD execution lifecycle                                                          |
| `runner.ts`       | `ExampleRunner.run()`        | async method           | `suite: object`                        | `ExampleResult[]` | Main entry: topoSort -> execute in order -> skip transitive consumers                                                    |
| `runner.ts`       | `ExampleRunner.executeOne()` | async method (private) | `meta: ExampleMetadata, suite: object` | `ExampleResult`   | Calls method, injects cloned fixture from producer, stores result                                                        |
| `runner.ts`       | `ExampleRunner.shouldSkip()` | method (private)       | `meta: ExampleMetadata`                | `boolean`         | Returns true if any transitive producer has status `'failed'`                                                            |
| `deno-adapter.ts` | `registerSuite()`            | function               | `SuiteClass: new() => object`          | `void`            | I/O shell: calls `Deno.test()` with steps for each example in topo order                                                 |

#### Wiring (Runner)

```
@Example() / @Given() decorators
    |  (ctx.addInitializer runs at class construction time)
    v
_globalRegistry.register(meta)
    |
    v
registerSuite(MoneyExample)
    |
    v
Deno.test('MoneyExample', async (t) => {
    runner.run(suite)
        |
        +-- topoSort -> ['empty', 'addDollars', 'convert']
        |
        +-- executeOne('empty')
        |     -> suite.empty()          -> returns Money(0, 'CHF')
        |     -> registry.setCachedResult('empty', { value: Money(0,'CHF'), status:'passed' })
        |
        +-- executeOne('addDollars')
        |     -> shouldSkip? -> NO
        |     -> cloneFixture(cached 'empty')  -> Money-like plain object (see Rabbit Hole #2)
        |     -> suite.addDollars(clone)
        |     -> registry.setCachedResult('addDollars', ...)
        |
        +-- executeOne('convert')
              -> shouldSkip? -> YES if 'addDollars' failed
              -> result: { status: 'skipped' }
    |
    v
t.step() per example (Deno subtests)
})
```

---

### Public API (`src/mod.ts`)

#### Code Affordances

| Export            | Kind              | Description                                                                   |
| ----------------- | ----------------- | ----------------------------------------------------------------------------- |
| `Example`         | decorator factory | `@Example(name?)` — marks a method as a root example producer                 |
| `Given`           | decorator factory | `@Given(...names)` — marks a method as a consumer of named producers          |
| `registerSuite`   | function          | `registerSuite(SuiteClass)` — registers all examples as a `Deno.test()` group |
| `ExampleResult`   | interface         | Return type of the runner; used for typing producer return values             |
| `ExampleRegistry` | class             | Exposed for advanced use (custom registries, testing the framework itself)    |

#### Wiring (Public API)

```
import { Example, Given, registerSuite } from './mod.ts'

class MoneyExample {
  @Example()
  empty(): Money { ... }

  @Given('empty')
  addDollars(m: Money): Money { ... }
}

registerSuite(MoneyExample)
// -> Deno.test('MoneyExample', ...) registered
// -> deno test discovers it automatically
```

---

## Vertical Slices

### Slice 1 — Registry + Basic Example Execution (no dependencies)

**Goal**: Register examples with `@Example()`, execute them in isolation, verify
return values are stored.

**Demo**: A `CurrencyExample` class with two independent `@Example()` methods.
Both execute, both return values, both cached in registry.

**Files touched**:

- `src/core/types.ts`
- `src/core/registry.ts`
- `src/runner/decorators.ts` (only `@Example()`, no `@Given()`)
- `src/runner/runner.ts` (only `executeOne`, no injection)
- `src/runner/deno-adapter.ts`
- `tests/core/registry_test.ts`
- `tests/integration/currency_basic_test.ts`

**Demo-able with**: `deno task test` — two Deno subtests appear, both pass.

**PEP cycles**: 2 (types+registry, then decorator+adapter)

---

### Slice 2 — Dependency Graph + @Given() + Fixture Injection with Cloning

**Goal**: Declare `@Given('empty')`, resolve execution order via topoSort,
inject cloned fixture into consumer.

**Demo**: A `MoneyExample` class — `empty()` runs first, `addDollars(m)`
receives a cloned fixture of `empty()`'s result.

**Files touched**:

- `src/core/graph.ts` (buildGraph, topoSort, detectCycles)
- `src/core/clone.ts` (cloneFixture, isClassInstance)
- `src/runner/decorators.ts` (add `@Given()`)
- `src/runner/runner.ts` (add injection + ordering)
- `tests/core/graph_test.ts`
- `tests/core/clone_test.ts`
- `tests/integration/money_suite_test.ts`

**Demo-able with**: `deno task test` — examples run in correct order,
`addDollars` receives a fixture.

**PEP cycles**: 3 (graph+topoSort, clone strategy, Given decorator+injection)

---

### Slice 3 — Skip-on-Failure Propagation

**Goal**: When a producer fails (throws or assertion error), all transitive
consumers are skipped — not failed.

**Demo**: A `BrokenChainExample` class where the middle example is forced to
fail. Downstream consumers show `skipped` status, not `failed`.

**Files touched**:

- `src/runner/runner.ts` (shouldSkip, transitive failure tracking)
- `tests/runner/runner_test.ts` (skip propagation unit tests)
- `tests/integration/broken_chain_test.ts`

**Demo-able with**: `deno task test` — Deno report shows one failed step, two
skipped steps, no false failures.

**PEP cycles**: 2 (shouldSkip logic, integration test)

---

### Slice 4 (Stretch) — Dependency Graph Visualization (Mermaid)

**Goal**: Given a registered suite, output a Mermaid diagram string showing the
example dependency graph.

**Demo**: `renderMermaid(MoneyExample)` returns a valid Mermaid `graph TD`
string that can be pasted into a markdown file.

**Files touched**:

- `src/core/graph.ts` (add `renderMermaid()`)
- `tests/core/graph_test.ts` (snapshot-style assertion on output string)

**Demo-able with**: Copy the output into any Mermaid renderer.

**PEP cycles**: 1

---

## Rabbit Holes

### Rabbit Hole 1 — Stage 3 Decorator Execution Timing

**Risk**: Stage 3 decorator `addInitializer` callbacks run at **class
construction time** (when `new MoneyExample()` is called), not at class
definition time. This means `registerSuite(MoneyExample)` must construct an
instance before decorators populate the registry — or the registry is empty when
`topoSort` runs.

**Specific problem**: If the user calls `registerSuite(SuiteClass)` before
constructing an instance, `_globalRegistry.all()` returns `[]`.

**Mitigation**: `registerSuite` must itself construct the instance
(`new SuiteClass()`), which triggers `addInitializer` callbacks, which populate
the registry. This is the correct execution model and matches how Lit and
Angular use `addInitializer`. Must be documented and tested explicitly.

**Time box**: 30 minutes to prototype and confirm with a minimal test.

---

### Rabbit Hole 2 — structuredClone Loses Prototype Chain on Class Instances

**Risk**: `structuredClone(new Money(0, 'CHF'))` returns a **plain object** —
not a `Money` instance. The clone passes `instanceof Object` but fails
`instanceof Money`. Consumer methods typed as `(m: Money)` receive a structural
match but not a proper class instance. Method calls on the clone
(`m.add(10, 'USD')`) will throw if `add` is on the prototype.

**Specific problem**: EDD's core value proposition (fixture _reuse_) breaks
silently if the consumer tries to call prototype methods on its injected
fixture.

**Mitigation strategy A** (chosen for v0.1, Explore 3X): Document the limitation
explicitly. EDD fixtures in v0.1 must use plain data objects (interfaces, not
classes with methods). The `Money` demo will use
`{ amount: number, currency: string }` as its fixture type, not a `Money` class
with methods. This is honest and unblocking.

**Mitigation strategy B** (deferred to v0.2): Implement a `@Cloneable` decorator
or a `clone()` protocol — if the fixture has a `clone()` method, use it instead
of `structuredClone`. This restores the prototype chain for class instances.

**Time box**: 20 minutes to confirm the limitation with a quick Deno REPL test,
then document the decision.

---

### Rabbit Hole 3 — Deno.test() Execution Order is Not Guaranteed

**Risk**: `Deno.test()` runs tests in the order they are registered. If
`@Example()` decorators register tests in source-code order (which is class
method declaration order), and `topoSort` produces a different order, we cannot
reorder the already-registered `Deno.test()` calls.

**Specific problem**: Registration order ≠ topological order. We cannot
un-register a `Deno.test()`.

**Resolution** (already decided): All examples within a suite register as
`t.step()` subtests inside a **single**
`Deno.test('SuiteName', async (t) => { ... })` call. `registerSuite()` calls
`topoSort` first, then registers steps in sorted order. Since steps execute in
registration order within their parent test, this gives us full control over
execution order.

**Implication**: The entire suite is one Deno test entry from the outside (one
row in `deno test` output). Individual examples appear as subtests in the
`--reporter=verbose` output.

**Time box**: No further investigation needed — the design decision is clear.

---

### Rabbit Hole 4 — Async Producer Functions

**Risk**: An `@Example()` method may be async, returning `Promise<Money>`
instead of `Money`. The runner must `await` the result before caching it. The
injected fixture for consumers must be the resolved value, not a Promise.

**Specific problem**: If the runner doesn't detect async examples, cached values
will be `Promise<unknown>` objects. `structuredClone(promise)` throws a
`DataCloneError`.

**Mitigation**: The runner always `await`s the result of `executeOne()`. The
method call itself uses `await suite[methodName]()` unconditionally. Both sync
and async methods work transparently because `await syncValue === syncValue`.

**Time box**: Already resolved by design — `async` throughout runner is the
correct pattern. Verify with one async example in the integration test.

---

### Rabbit Hole 5 — Cycle Detection Before Execution

**Risk**: A user accidentally declares `@Given('B')` on `A` and `@Given('A')` on
`B`. `topoSort` on a cyclic graph loops forever or produces an incorrect order.

**Mitigation**: `detectCycles()` runs before `topoSort()`. If a cycle is found,
`ExampleRunner.run()` throws a descriptive error:
`TSExample: Circular dependency detected: A -> B -> A`. This is validated in
`graph_test.ts`.

**Time box**: 20 minutes — standard Kahn's algorithm cycle detection (if sorted
count < total nodes, a cycle exists).

---

## No-Gos

- No Vitest adapter (v0.1 is Deno-native only)
- No cross-file example dependencies (one class = one suite in v0.1)
- No npm/Node.js compatibility or dual-runtime builds
- No VS Code extension or IDE integration of any kind
- No Deno Jupyter notebook integration
- No visual dependency graph viewer in a browser UI
- No public JSR or npm registry publication (local file import only)
- No `emitDecoratorMetadata` / `experimentalDecorators` legacy decorator support
  (Stage 3 only)
- No fixture type coercion or runtime type checking on injected values
- No parallel example execution (sequential only, matching Deno.test step
  semantics)

---

## Acceptance Criteria

- [ ] A class decorated with `@Example()` and `@Given()` can be passed to
      `registerSuite()` and all examples execute via `deno task test` without
      additional configuration
- [ ] Dependency order is correct: producers always execute before their
      consumers
- [ ] A failed producer causes all transitive consumers to show `skipped` (not
      `failed`) in `deno test` output
- [ ] Injected fixtures are deep clones of the producer's return value (mutation
      in a consumer does not affect other consumers sharing the same producer)
- [ ] A cyclic dependency throws a descriptive error at registration time, not
      at runtime
- [ ] All core functions are pure (no I/O in `src/core/`) — verified by testing
      without any Deno permissions flags
- [ ] Test coverage >= 50% (Explore threshold) — verified by
      `deno task test:coverage`
- [ ] `deno task lint`, `deno task fmt:check`, and `deno task check` all pass
      clean

---

## Active Review Lenses

**Core:** CONTEXT, BUSINESS, ARCHITECTURE, DESIGN, CODE QUALITY, SECURITY, INFO
ARCHITECTURE

**Conditional:**

- [ ] **UI/UX + DESIGN QUALITY** — Not applicable (no UI)
- [ ] **ASE LEVEL** — Not applicable (internal tooling)
- [x] **COMPOSABILITY** — Core goal: clean FCIS separation, pure core,
      replaceable runner

---

## Key Research Findings

### Stage 3 Decorators in Deno 2.x

**Status**: Fully supported. Deno 2.x enables Stage 3 decorators by default.
Setting `"experimentalDecorators": false` in `deno.json` is the correct and
current configuration — it activates Stage 3 (not legacy) decorators. The
tsexample `deno.json` is already correctly configured.

**Method decorator signature (Stage 3)**:

```typescript
function Example(name?: string) {
  return function <T extends (this: object, ...args: unknown[]) => unknown>(
    value: T,
    ctx: ClassMethodDecoratorContext<object, T>,
  ): T {
    ctx.addInitializer(function (this: object) {
      _globalRegistry.register({
        name: name ?? String(ctx.name),
        method: String(ctx.name),
        given: [],
      });
    });
    return value;
  };
}
```

**Key constraint**: `addInitializer` runs at instance construction
(`new MyClass()`), not at class definition. `registerSuite(SuiteClass)` must
construct `new SuiteClass()` to trigger registration.

### structuredClone and Class Instances

**Critical finding**: `structuredClone` does **not** preserve the prototype
chain. Class instances become plain objects. `instanceof MyClass` returns
`false` on the clone. Methods on the prototype are lost.

**Decision for v0.1**: EDD fixtures must be plain data objects (interfaces/plain
objects) — not class instances with prototype methods. This is documented
explicitly in README. A `clone()` protocol for class instances is deferred to
v0.2.

**The `isClassInstance()` guard in `clone.ts`**:

```typescript
export function isClassInstance(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  return Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null;
}
```

When `isClassInstance()` returns `true`, `cloneFixture()` emits a console
warning in v0.1 and falls back to `structuredClone` (data is preserved,
prototype is lost). In v0.2, this becomes a hook point for the `clone()`
protocol.

### Deno.test() Step Execution Order

**Finding**: `Deno.test()` steps execute in registration order within a parent
test. By registering all suite examples as steps inside one
`Deno.test('SuiteName', ...)` call — in topological order — we have full
execution order control without fighting the test runner.

### Kahn's Algorithm for Topological Sort

**Confirmed approach**: O(V+E) BFS-based topological sort. Cycle detection is
free: if the number of sorted nodes is less than total nodes, a cycle exists.
Clean TypeScript implementation with no external dependencies.

---

## W-Gate: Shape Validation

- [x] Problem is clear — no EDD framework exists in the TypeScript ecosystem
- [x] Solution is shaped — FCIS architecture, 4 slices, decorator API confirmed
- [x] No-gos are explicit — 10 explicit exclusions
- [x] Appetite is set — 2-3 days, Tier 2 Light Cycle
- [x] Review lenses are activated — core + COMPOSABILITY

---

## Next Steps (BUILD Phase)

Implement in slice order:

1. Start with `src/core/types.ts` — define all interfaces (no logic, pure types)
2. PEP 1: `registry_test.ts` (red) -> `registry.ts` (green) -> refactor
3. PEP 2: `decorators_test.ts` (red, constructor timing) -> `decorators.ts`
   (green) -> refactor
4. PEP 3: `graph_test.ts` (red, topoSort + cycles) -> `graph.ts` (green) ->
   refactor
5. PEP 4: `clone_test.ts` (red, structuredClone + isClassInstance) -> `clone.ts`
   (green) -> refactor
6. PEP 5: Integration test for Slice 1 (`currency_basic_test.ts`)
7. PEP 6: `runner_test.ts` (injection) -> `runner.ts` (green) -> refactor
8. PEP 7: Integration test for Slice 2 (`money_suite_test.ts`)
9. PEP 8: Skip-on-failure unit tests -> implementation -> integration test
   (Slice 3)
10. (Stretch) PEP 9: `renderMermaid()` (Slice 4)
