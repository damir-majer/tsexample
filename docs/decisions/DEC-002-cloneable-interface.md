# DEC-002: Cloneable Interface to Preserve Prototype Chains

> **Date**: 2026-02-28 | **Status**: Accepted

## Context

When a producer example returns a class instance as its fixture, the framework
must clone that value before passing it to each consumer. The natural choice —
`structuredClone` — has a critical limitation: it strips the prototype chain.
After cloning, `instanceof` checks fail and any methods defined on the class
prototype are gone from the clone.

This is not a limitation of TSExample; it is specified behavior for the
Structured Clone Algorithm (HTML spec). Plain objects, arrays, and primitives
are unaffected. Class instances lose their identity.

For user-defined fixture classes (e.g., a `Money` or `Order` value object), this
would silently break consumer examples that call methods on the fixture.

## Decision

Introduce the `Cloneable<T>` interface in `src/core/types.ts`:

```typescript
export interface Cloneable<T = unknown> {
  clone(): T;
}
```

Users opt in by implementing `clone()` on their fixture class. The clone
dispatch in `src/core/clone.ts` checks for this interface at Priority 2 (after a
custom `CloneStrategy` function, before falling back to `structuredClone`). See
`cloneFixture()` in `src/core/clone.ts`, lines 29–48.

## Alternatives Considered

| Alternative                                                    | Why rejected                                                                                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decorator-based clone registration (`@Cloneable` on the class) | Requires a class decorator; adds a second decorator concern on user fixture classes. More friction than implementing one method.                                                   |
| Global clone registry map (`Map<Constructor, CloneFn>`)        | Requires users to import and call a registration function separate from their class definition. Introduces a global dependency that is hard to test and easy to forget.            |
| Always-custom clone strategy (no `structuredClone` fallback)   | Forces every suite to provide a `CloneStrategy`. Plain-object fixtures are common and work fine with `structuredClone`; requiring custom cloning for them is unnecessary friction. |

## Consequences

- Users with plain-object or primitive fixtures need no changes —
  `structuredClone` handles them automatically (Priority 3).
- Users with class-instance fixtures implement `clone(): T` to preserve
  prototype identity. This is opt-in and explicit.
- The pattern is familiar: Java's `Cloneable`, Rust's `Clone` trait. Developers
  recognize the intent immediately.
- No global state is introduced; `isCloneable()` is a duck-type check on the
  value at call time (`src/core/clone.ts`, lines 12–18).
