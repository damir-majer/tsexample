# Next Cycle — TSExample v0.3

> **Prepared**: 2026-02-28 | **Status**: Ready to scope

---

## What v0.2 Delivered

All 4 slices shipped. Full JExample feature parity achieved:

- `renderMermaid()` — dependency graph visualization
- Producer validation — fail-fast for invalid `@Given` references
- `Cloneable<T>` — clone protocol preserving `instanceof` and prototype methods
- Multi-producer `@Given('a', 'b')` — was already working, tests confirmed

**Current state**: 91 tests, 92.8% line / 86.9% branch coverage, 7 source files

- 1 barrel, zero runtime dependencies.

---

## What's Ready to Build

### Slice 1 — Decision Records

**Effort**: 1 PEP cycle | **Value**: Medium (maintainability, onboarding) |
**Risk**: None

Create `docs/decisions/` files for key decisions deferred from Cycles 1-2:

1. **DEC-001: Stage 3 decorator timing** — `addInitializer` fires at
   construction, not definition. `registerSuite()` must `new` the class.
2. **DEC-002: structuredClone limitation** — loses prototypes. Solved by
   `Cloneable<T>` interface (not decorator, not registry map).
3. **DEC-003: Single Deno.test per suite** — all examples as `t.step()`
   children. Enables topological ordering control.
4. **DEC-004: 3-priority clone dispatch** — custom > Cloneable >
   structuredClone. Backward compatible, each level independently testable.

### Slice 2 — deno-adapter.ts Unit Tests

**Effort**: 1-2 PEP cycles | **Value**: Medium (coverage quality) | **Risk**:
Medium (Deno.test mocking is awkward)

Current 40% branch coverage is the longest-standing tech debt. Options:

1. **Inject test context** — make `registerSuite()` accept a test function
   parameter (default: `Deno.test`). Test with a mock.
2. **Integration-only** — accept that the adapter is tested via integration and
   focus unit tests on the runner instead.
3. **Extract testable logic** — pull step-name formatting and skip-prefix logic
   into pure helpers that can be tested directly.

Recommendation: Option 3 (extract pure helpers) — maintains FCIS, easy to test.

### Slice 3 (Stretch) — Vitest Adapter Spike

**Effort**: 2-3 PEP cycles | **Value**: High (audience expansion) | **Risk**:
High (unknown Vitest plugin API complexity)

Research Vitest's custom runner API (`vitest.config.ts` → `runner: '...'`).
Build a minimal `vitest-adapter.ts` that bridges TSExample to Vitest's test
runner. This is a spike — if the API is too complex, defer to v0.4.

---

## Blocked Items

None. All v0.3 slices can start immediately.

---

## Known Rabbit Holes to Avoid

- **Cross-file dependencies**: Still requires a fundamentally different
  registration model. Defer to v0.4+.
- **Parallel execution**: Breaks the sequential guarantee. Don't attempt.
- **Custom reporter**: Tempting but Deno's built-in reporter is sufficient.
  Would only make sense after a Vitest adapter exists.
- **Async producer dependencies**: Async `@Given` resolution would add
  complexity to the runner's topo-sort execution loop. Not needed — `run()`
  already awaits each example.

---

## Suggested 3X Progression

v0.1 and v0.2 shipped at **Explore** (50% threshold, high autonomy).

For v0.3:

- Decision records + adapter tests (Slices 1-2): Stay at **Explore** — internal
  tool, no public contract.
- If Vitest spike (Slice 3): Stay at **Explore** for the spike, then Expand if
  it succeeds and becomes a maintained adapter.

**Note**: JSR publication was considered but removed — TSExample is a private
library for personal use. JSR does not support private packages. Distribution
via direct GitHub import or Deno workspace is sufficient.

---

## Tech Debt to Address

| Item                                    | Severity   | Slice to Fix In          |
| --------------------------------------- | ---------- | ------------------------ |
| deno-adapter.ts 40% branch coverage     | Low        | Slice 2 (primary target) |
| Decision records missing (3 cycles!)    | Low        | Slice 1 (dedicated)      |
| `no-explicit-any` in decorators.ts (2x) | Acceptable | Only if TS improves      |
| README: no rendered Mermaid diagram     | Trivial    | Any slice (quick add)    |
