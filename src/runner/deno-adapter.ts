/**
 * Deno adapter — bridges TSExample's ExampleRunner with Deno.test.
 *
 * registerSuite() is the primary public API:
 *
 *   registerSuite(MySuiteClass);
 *
 * It registers ONE Deno.test for the whole suite, with a sub-step per example.
 * This lets Deno report each example individually in its output while keeping
 * the suite as the top-level grouping unit.
 *
 * Execution model:
 *   1. resetGlobalRegistry() — ensures a fresh slate for this suite.
 *   2. new SuiteClass() — triggers addInitializer callbacks, populating the registry.
 *   3. Snapshot the registry into a local ExampleRegistry (immune to future resets).
 *   4. Register Deno.test(SuiteClass.name, ...) which:
 *        a. Runs ALL examples up-front via ExampleRunner.run().
 *        b. Iterates results and registers a t.step() for each.
 *        c. Skipped examples surface as "[SKIPPED] <name>" steps that pass
 *           (Deno has no built-in step-skip mechanism as of v1.x).
 *        d. Failed examples throw inside their step so Deno marks them red.
 *
 * FCIS compliance:
 *   This module is the imperative shell — it is allowed to call Deno.test,
 *   perform side effects, and interact with the runtime.
 */

import { getGlobalRegistry, resetGlobalRegistry } from './decorators.ts';
import { ExampleRegistry } from '../core/registry.ts';
import { ExampleRunner } from './runner.ts';
import { topoSort } from '../core/graph.ts';
import type { CloneStrategy } from '../core/types.ts';

/** Options accepted by registerSuite(). */
export interface RegisterSuiteOptions {
  /** Clone strategy passed through to ExampleRunner. Defaults to 'structured'. */
  cloneStrategy?: CloneStrategy;
}

/**
 * Register a decorated suite class as a Deno test suite.
 *
 * Call this at module level — Deno.test() calls made at import time are
 * collected and executed when the file is loaded by `deno test`.
 *
 * @param SuiteClass  A class whose methods are decorated with @Example/@Given.
 * @param options     Optional configuration.
 */
export function registerSuite(
  SuiteClass: new () => object,
  options?: RegisterSuiteOptions,
): void {
  // 1. Reset to isolate this suite's decorator registrations from prior state.
  resetGlobalRegistry();

  // 2. Construct the instance — fires all addInitializer callbacks.
  const suite = new SuiteClass();

  // 3. Snapshot the populated registry.
  //    A fresh ExampleRegistry is needed because the next registerSuite() call
  //    will reset the global registry, which must not affect this suite's runner.
  const suiteRegistry = new ExampleRegistry();
  for (const exMeta of getGlobalRegistry().all()) {
    suiteRegistry.register(exMeta);
  }

  const runner = new ExampleRunner(suiteRegistry, options?.cloneStrategy);

  // 4. Register one Deno.test grouping per suite class.
  Deno.test(SuiteClass.name, async (t) => {
    // Execute all examples in topological order.
    const results = await runner.run(suite);
    const order = topoSort(suiteRegistry.all());

    // Create one sub-step per example, in execution order.
    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      const result = results[i];

      if (result.status === 'skipped') {
        // Deno.TestContext has no native skip-step API (as of Deno 1.x/2.x).
        // Convention: prefix with [SKIPPED] so the output is self-documenting.
        await t.step(`[SKIPPED] ${name}`, () => {
          // no-op — step passes but name signals it was skipped
        });
      } else {
        await t.step(name, () => {
          if (result.status === 'failed') {
            throw result.error ?? new Error(`Example "${name}" failed`);
          }
          // 'passed' — no action needed
        });
      }
    }
  });
}
