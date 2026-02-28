# DEC-005: Dual-Adapter Barrels for Runtime Portability

> **Date**: 2026-02-28 | **Status**: Accepted

## Context

TSExample's core (types, registry, graph, clone, decorators, runner) is 100%
runtime-agnostic. Only the adapter layer bridges to a specific test runner:
`deno-adapter.ts` calls `Deno.test()`, while a new `vitest-adapter.ts` calls
Vitest's `describe/test/beforeAll`. Both adapters implement the same
`registerSuite()` function with identical signatures.

A spike (`playground/vitest-adapter-spike/`) proved the approach works: 10/10
tests passing, Stage 3 decorators work through esbuild (Vitest's default
transformer), and the two-phase execution model (collection + execution) maps
cleanly to `describe` + `beforeAll`.

The question is how to expose both adapters to consumers without breaking
existing Deno imports or creating conditional-import complexity.

## Decision

Two barrel files with identical public APIs, differing only in their adapter
import:

```
src/mod.ts         — imports deno-adapter.ts (existing, unchanged)
src/mod.vitest.ts  — imports vitest-adapter.ts (new)
```

Consumers choose their barrel based on their runtime:

```typescript
// Deno
import { registerSuite } from './src/mod.ts';

// Vitest / Node.js
import { registerSuite } from './src/mod.vitest.ts';
```

`deno check` runs in entry-point mode (`deno check src/mod.ts`) rather than glob
mode (`deno check src/**/*.ts`). This naturally excludes `vitest-adapter.ts` and
`mod.vitest.ts` from Deno's type checker without needing ignore directives —
Deno cannot resolve the bare `'vitest'` specifier, and it doesn't need to.

## Alternatives Considered

| Alternative                                                                             | Why rejected                                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single barrel with conditional import (`if (typeof Deno !== 'undefined')`)              | Runtime branching adds complexity, breaks tree-shaking, and requires both adapters to type-check in both runtimes. The `'vitest'` bare specifier cannot be resolved by Deno at all. |
| Package exports map (`package.json` `exports` field with `deno` / `default` conditions) | TSExample is not published to npm/JSR. Adding export maps for an internal library is premature indirection.                                                                         |
| Vitest custom runner plugin                                                             | Vitest's custom runner API is experimental and poorly documented. The `describe/test/beforeAll` bridge is simpler, more stable, and proven in the spike.                            |

## Consequences

- **Zero breaking changes**: `mod.ts` is unchanged. Existing Deno consumers are
  unaffected.
- **Two test commands**: `deno task test` runs Deno tests,
  `deno task test:vitest` runs Vitest tests. `deno task test:all` runs both
  sequentially.
- **Vitest tests live in `tests/vitest/`**: Excluded from `deno test` via
  `deno.json`'s `test.exclude` setting.
- **`node_modules/` is gitignored**: Already in `.gitignore` from project
  scaffolding.
- **Minimal `package.json`**: Only `vitest` as a devDependency. No runtime
  dependencies, no build step.
- **`deno check` uses entry-point mode**: `src/mod.ts` instead of `src/**/*.ts`,
  so vitest-specific files are naturally excluded from Deno's type checker.
