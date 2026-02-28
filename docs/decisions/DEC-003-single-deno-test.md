# DEC-003: Single Deno.test per Suite with t.step() per Example

> **Date**: 2026-02-28 | **Status**: Accepted

## Context

TSExample examples form a dependency graph: a consumer example receives the
return value (fixture) of its producer examples via `@Given`. Execution must
follow topological order — producers before consumers. If two examples run in
separate `Deno.test()` calls, Deno controls their execution order and the
framework cannot guarantee producers complete before consumers start.

Additionally, the framework must surface individual example names in Deno's test
output, not just the suite name, for actionable failure reports.

See `src/runner/deno-adapter.ts`, lines 70–95 for the registration pattern.

## Decision

Register one `Deno.test(SuiteClass.name, ...)` per suite. Inside that single
test, all examples run via `ExampleRunner.run()` in topological order up-front,
then one `t.step(exampleName, ...)` is registered per example to report
individual pass/fail status.

```typescript
Deno.test(SuiteClass.name, async (t) => {
  const results = await runner.run(suite); // topological execution
  const order = topoSort(suiteRegistry.all());

  for (let i = 0; i < order.length; i++) {
    await t.step(order[i], () => { // per-example reporting
      if (results[i].status === 'failed') throw results[i].error;
    });
  }
});
```

Skipped examples (whose producer failed) are reported as `[SKIPPED] <name>`
no-op steps — Deno 1.x/2.x has no native step-skip API, so the prefix convention
makes the output self-documenting.

## Alternatives Considered

| Alternative                            | Why rejected                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One `Deno.test()` per example          | Deno runs top-level tests in file-registration order but there is no contract that a previous test completes before the next starts in a concurrent context. Topological ordering within the suite would be unreliable. Each example would also need its own context and fixture-passing mechanism, coupling the adapter deeply into the runner internals. |
| Single `Deno.test()` with no sub-steps | All examples would show as one pass/fail entry. A single failing example causes the entire suite to show as failed with no indication of which example broke.                                                                                                                                                                                              |

## Consequences

- Deno reports each example individually by name; failures pinpoint the exact
  example.
- Topological ordering is fully under the framework's control — the runner sorts
  and executes before any `t.step()` is registered.
- The entire suite is one Deno test entry in `deno test --list`. This is
  intentional: the suite is the unit of discovery, examples are sub-steps within
  it.
- If a producer example fails, all downstream consumers are skipped (handled by
  `ExampleRunner`) and surfaced as `[SKIPPED]` steps rather than false failures.
