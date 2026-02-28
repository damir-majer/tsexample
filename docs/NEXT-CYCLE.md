# Next Cycle — TSExample v0.5

> **Prepared**: 2026-02-28 | **Status**: On hold — driven by usage needs

---

## What v0.4 Delivered

Vitest adapter graduation. The spike (`playground/vitest-adapter-spike/`) was
validated and graduated into the main repo:

- `vitest-adapter.ts` — bridges `registerSuite()` to Vitest's
  `describe/test/beforeAll`
- `mod.vitest.ts` — Vitest barrel (same API as `mod.ts`, different adapter)
- 13 Vitest tests across 4 suites (MoneySuite, DiamondSuite, IsolationSuite,
  BrokenChainSuite)
- DEC-005: Dual-adapter barrels decision record
- Entry-point type checking (`deno check src/mod.ts`) to exclude vitest files

**Current state**: 100 Deno tests + 13 Vitest tests = 113 total, 8 source
files + 2 barrels, 2 adapters (Deno + Vitest), zero runtime dependencies.

**Full JExample feature parity** achieved at v0.2. v0.3 completed all tech debt.
v0.4 added Node.js/Vitest support. The library supports both major TypeScript
runtimes.

---

## What Could Be Built (If Needed)

### Cross-File Dependencies

**Effort**: 3-5 PEP cycles | **Value**: Medium | **Risk**: High

The single-class limitation is the biggest architectural constraint. Would
require a file-level coordination mechanism (shared registry, import-time
registration). Only pursue if a concrete multi-file use case arises.

### Jest Adapter

**Effort**: 1-2 PEP cycles | **Value**: Low | **Risk**: Low

Same pattern as vitest-adapter.ts. Jest uses `describe/test/beforeAll` with
nearly identical semantics. Only pursue if a Jest project needs TSExample.

---

## Known Rabbit Holes to Avoid

- **JSR publication**: TSExample is a private library. JSR requires public.
- **Parallel execution**: Breaks the sequential guarantee. Don't attempt.
- **Custom reporter**: Deno's built-in reporter is sufficient.
- **Async producer dependencies**: Not needed — `run()` already awaits each
  example.
- **npm publication**: Private library, no external consumers.

---

## Remaining Tech Debt

| Item                                    | Severity   | Note                              |
| --------------------------------------- | ---------- | --------------------------------- |
| `no-explicit-any` in decorators.ts (2x) | Acceptable | Only if TS improves Stage 3 types |
| README: no rendered Mermaid diagram     | Trivial    | Nice-to-have, not blocking        |
| deno-adapter.ts 20% uncovered branches  | Acceptable | Irreducible imperative shell      |

---

## Project Status

Four cycles completed. All objectives met. The library supports both Deno and
Node.js/Vitest runtimes. Future work should be **demand-driven** — build only
what actual usage requires.
