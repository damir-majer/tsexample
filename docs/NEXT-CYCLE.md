# Next Cycle — TSExample v0.4

> **Prepared**: 2026-02-28 | **Status**: On hold — driven by usage needs

---

## What v0.3 Delivered

Housekeeping + hardening cycle. Two slices shipped:

- Decision records (DEC-001 through DEC-004) — closes 3-cycle documentation debt
- deno-adapter.ts pure helper extraction — branch coverage 40% → 80%

**Current state**: 100 tests, 94.9% line / 88.5% branch coverage, 7 source
files + 1 barrel, zero runtime dependencies.

**Full JExample feature parity** achieved at v0.2. v0.3 completed all tech debt
and documentation. The library is feature-complete for its intended private use.

---

## What Could Be Built (If Needed)

### Vitest Adapter Spike

**Effort**: 2-3 PEP cycles | **Value**: High (audience expansion) | **Risk**:
High (unknown Vitest plugin API complexity)

Research Vitest's custom runner API (`vitest.config.ts` → `runner: '...'`).
Build a minimal `vitest-adapter.ts` that bridges TSExample to Vitest's test
runner. This is a spike — if the API is too complex, defer further.

Deferred from v0.3 (stretch). Only pursue if TSExample is actually needed in a
Node/Vitest project.

### Cross-File Dependencies

**Effort**: 3-5 PEP cycles | **Value**: Medium | **Risk**: High

The single-class limitation is the biggest architectural constraint. Would
require a file-level coordination mechanism (shared registry, import-time
registration). Only pursue if a concrete multi-file use case arises.

---

## Known Rabbit Holes to Avoid

- **JSR publication**: TSExample is a private library. JSR requires public.
- **Parallel execution**: Breaks the sequential guarantee. Don't attempt.
- **Custom reporter**: Deno's built-in reporter is sufficient.
- **Async producer dependencies**: Not needed — `run()` already awaits each
  example.

---

## Remaining Tech Debt

| Item                                    | Severity   | Note                              |
| --------------------------------------- | ---------- | --------------------------------- |
| `no-explicit-any` in decorators.ts (2x) | Acceptable | Only if TS improves Stage 3 types |
| README: no rendered Mermaid diagram     | Trivial    | Nice-to-have, not blocking        |
| deno-adapter.ts 20% uncovered branches  | Acceptable | Irreducible imperative shell      |

---

## Project Status

Three cycles completed. All objectives met (21/21 cumulative SMART). The library
is feature-complete for private use. Future work should be **demand-driven** —
build only what actual usage requires.
