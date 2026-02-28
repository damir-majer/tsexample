# Next Cycle — TSExample v0.2

> **Prepared**: 2026-02-28 | **Status**: Ready to scope

---

## What's Ready to Build

### Slice 1 — Mermaid Dependency Graph Visualization

**Effort**: 1 PEP cycle (~1 hour) **Value**: High documentation value, low
implementation effort **Files**: `src/core/graph.ts` (add `renderMermaid()`),
`tests/core/graph_test.ts`

```typescript
// Expected API:
renderMermaid(examples: ExampleMetadata[]): string
// Returns: "graph TD\n  empty --> addDollars\n  addDollars --> convert\n"
```

### Slice 2 — Producer Validation at Registration Time

**Effort**: 1 PEP cycle (~1 hour) **Value**: Better error messages, fail-fast
behavior **Files**: `src/runner/runner.ts` or `src/runner/deno-adapter.ts`

Currently `@Given('nonExistent')` fails at runtime during `topoSort`. Should be
caught during `registerSuite()` with a clear message:
`TSExample: Example "addDollars" depends on "nonExistent" which is not registered.`

### Slice 3 — Clone Protocol for Class Instances

**Effort**: 2-3 PEP cycles (~3 hours) **Value**: Removes the biggest v0.1
limitation **Files**: `src/core/clone.ts`, `src/core/types.ts`, new tests

Design options:

1. **`Cloneable` interface**: `{ clone(): this }` — user implements on their
   fixture class
2. **`@Cloneable` decorator**: Auto-generates a clone method using
   `Object.create`
   - property copy
3. **Registry-based clone map**:
   `registerClone(MyClass, (v) => new MyClass(v.x, v.y))`

Recommendation: Option 1 (simplest, most explicit, follows EDD philosophy).

### Slice 4 (Stretch) — Multi-Producer Arguments

**Effort**: 2 PEP cycles **Value**: Enables diamond dependencies:
`@Given('producerA', 'producerB')`

Currently supported in types (`given: readonly string[]`) but the runner passes
only the first producer's fixture. Should map N producers to N method arguments.

---

## Blocked Items

None. All v0.2 slices can start immediately.

---

## Known Rabbit Holes to Avoid

- **Cross-file dependencies**: Tempting but requires a fundamentally different
  registration model (file-level coordination). Defer to v0.3+.
- **Vitest/Jest adapter**: Would need to understand those frameworks' plugin
  APIs. Not worth the investment until TSExample's API stabilizes.
- **JSR publication**: API should be stable before publishing. Wait for v0.3.
- **Parallel execution**: Would break the sequential guarantee that makes
  skip-on-failure work. Don't attempt.

---

## Suggested 3X Progression

v0.1 shipped at **Explore** (50% threshold, high autonomy). For v0.2:

- If Slices 1-2 only: Stay at **Explore**
- If Slice 3 (clone protocol): Consider **Expand** (80% threshold, standard
  rigor) — this changes a core API contract

---

## Tech Debt to Address

| Item                                    | Severity   | Slice to Fix In                   |
| --------------------------------------- | ---------- | --------------------------------- |
| deno-adapter.ts 40% branch coverage     | Low        | Any slice (add unit tests)        |
| graph.ts defensive dead code (line 148) | Trivial    | Slice 1 (during graph work)       |
| Decision records missing                | Low        | Create during v0.2 SHAPE          |
| `no-explicit-any` in decorators.ts (2x) | Acceptable | Only if TS improves Stage 3 types |
