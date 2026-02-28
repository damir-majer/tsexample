# DEC-004: 3-Priority Clone Dispatch in cloneFixture()

> **Date**: 2026-02-28 | **Status**: Accepted

## Context

TSExample must clone producer fixtures before passing them to consumers, to
prevent mutation in one consumer from affecting another. Three scenarios exist
in practice:

1. The user has a fixture type requiring fully custom cloning logic (deep graph,
   external resources, non-serializable fields).
2. The user has a class-instance fixture that implements `Cloneable<T>` (see
   DEC-002).
3. The user has a plain-object or primitive fixture where `structuredClone` is
   correct and sufficient.

A single fixed strategy cannot serve all three cases. Forcing users to always
provide a custom function (scenario 1) is too much friction for plain-object
suites. Relying solely on `structuredClone` silently breaks class-instance
fixtures (scenario 2). The framework needs an ordered resolution that applies
the right strategy without user action for the common case.

## Decision

`cloneFixture()` in `src/core/clone.ts` implements a 3-priority dispatch:

```
Priority 1: custom CloneStrategy function (explicit opt-in, highest authority)
Priority 2: value.clone()  via Cloneable interface (class-instance opt-in)
Priority 3: structuredClone  (default, works for plain objects and primitives)
```

```typescript
if (typeof strategy === 'function') return strategy(value); // P1
if (isCloneable(value)) return value.clone(); // P2
return structuredClone(value); // P3
```

The `strategy` parameter is optional. When absent (the common case), P1 is
skipped and the dispatch falls through to P2 or P3 based solely on what the
value implements.

## Alternatives Considered

| Alternative                                                                | Why rejected                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single strategy only (always require `CloneStrategy`)                      | Over-constrains users. Plain-object suites — the majority — would need boilerplate for no benefit.                                                                                                                                                            |
| Auto-detect without priority chain (P2 before P1)                          | A user providing a custom `CloneStrategy` explicitly wants it to take precedence over the object's own `clone()` method (e.g., for testing, serialization, or cross-boundary copies). Reversing the order would make the explicit override non-authoritative. |
| Two priorities only (custom function or `structuredClone`, no `Cloneable`) | Drops prototype preservation for class instances without requiring a full custom function. The `Cloneable` interface is the right granularity between "do it for me" and "I'll do it all myself."                                                             |

## Consequences

- Each priority level is independently unit-testable: P1 tests pass a mock
  function, P2 tests pass a `Cloneable` instance, P3 tests pass a plain object.
- Adding a fourth priority in the future (e.g., structured schema-driven
  cloning) is a localized change to `cloneFixture()` only — the interface and
  options type do not need to change.
- The dispatch is backward compatible: suites that worked before `Cloneable`
  existed continue to use P3 unchanged.
- `isCloneable()` is a duck-type check
  (`'clone' in value && typeof value.clone === 'function'`), so no import of the
  `Cloneable` interface is required in user code for the runtime dispatch to
  work.
