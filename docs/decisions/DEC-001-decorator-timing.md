# DEC-001: Stage 3 Decorator Timing — addInitializer at Construction Time

> **Date**: 2026-02-28 | **Status**: Accepted

## Context

Stage 3 decorators (TypeScript 5.x, TC39 proposal) have a two-phase execution
model:

1. **Class definition time** — decorator factory expressions are evaluated and
   the decorator function runs, calling `ctx.addInitializer(callback)` to
   enqueue a callback.
2. **Construction time** — when `new SuiteClass()` is called, all enqueued
   `addInitializer` callbacks fire in registration order.

This means `@Example()` cannot register metadata into the global registry at
class definition time. The `addInitializer` callback is the earliest safe point
for registration, and it only runs during construction.

The `@Given()` decorator has no `addInitializer` — it runs synchronously during
class definition and writes into `_pendingGiven`. When `@Example()`'s
initializer fires at construction time, it drains `_pendingGiven` to pick up any
`@Given` dependencies. This is why `@Given()` must always be paired with
`@Example()` on the same method.

See `src/runner/decorators.ts`, lines 94–106 (`addInitializer` callback body)
and the module header comment for the full execution sequence.

## Decision

`registerSuite()` must construct the suite class (`new SuiteClass()`) to trigger
decorator registration. There is no way to populate the registry without this
construction step under Stage 3 decorator semantics.

## Alternatives Considered

| Alternative                                                | Why rejected                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Class-level decorator that registers directly              | Class decorators fire after all method decorators, but still at class definition time — `addInitializer` still fires at construction. Does not eliminate the need for construction. |
| Manual registration API (`register(SuiteClass, metadata)`) | Requires users to maintain a separate metadata structure in parallel with the decorated class. Defeats the declarative intent of `@Example` / `@Given`.                             |

## Consequences

- `registerSuite()` is responsible for calling `new SuiteClass()` as a side
  effect.
- The suite class constructor must be side-effect-free (beyond decorator
  registration) — any setup work should happen in example methods.
- The constructed instance (`suite`) is reused as the `this` context when
  running example methods, so its state is shared across the run. This is
  intentional: examples build on each other's return values, not on instance
  mutation.
- Users do not need to construct the class themselves; `registerSuite()` handles
  it.
