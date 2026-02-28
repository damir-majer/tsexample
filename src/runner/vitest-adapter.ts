/**
 * Vitest adapter — bridges TSExample's ExampleRunner with Vitest's describe/test.
 *
 * registerSuite() is the primary public API:
 *
 *   registerSuite(MySuiteClass);
 *
 * It registers ONE describe block for the whole suite, with a test per example.
 *
 * Execution model:
 *   1. resetGlobalRegistry() — ensures a fresh slate for this suite.
 *   2. new SuiteClass() — triggers addInitializer callbacks, populating the registry.
 *   3. Snapshot the registry into a local ExampleRegistry.
 *   4. Register describe(SuiteClass.name, ...) which:
 *        a. beforeAll: Runs ALL examples up-front via ExampleRunner.run().
 *        b. Iterates order and registers a test() for each example.
 *        c. Each test body reads its result from the pre-computed results array.
 *        d. Skipped examples pass silently.
 *        e. Failed examples throw inside their test so Vitest marks them red.
 *
 * Two-phase compatibility:
 *   Vitest has a collection phase (synchronous test registration) and an
 *   execution phase (running the tests). The describe/test calls happen at
 *   collection time, while beforeAll and test bodies run at execution time.
 *   The results array is populated by beforeAll before any test body executes.
 *
 * FCIS compliance:
 *   This module is the imperative shell — it is allowed to call describe/test,
 *   perform side effects, and interact with the runtime.
 */

import { beforeAll, describe, test } from 'vitest';
import { getGlobalRegistry, resetGlobalRegistry } from './decorators.ts';
import { ExampleRegistry } from '../core/registry.ts';
import { ExampleRunner } from './runner.ts';
import { topoSort } from '../core/graph.ts';
import type { CloneStrategy, ExampleResult } from '../core/types.ts';

/** Options accepted by registerSuite(). */
export interface RegisterSuiteOptions {
  /** Clone strategy passed through to ExampleRunner. Defaults to 'structured'. */
  cloneStrategy?: CloneStrategy;
}

/**
 * Register a decorated suite class as a Vitest test suite.
 *
 * Call this at module level — describe/test calls made at import time are
 * collected and executed when the file is loaded by Vitest.
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
  const suiteRegistry = new ExampleRegistry();
  for (const exMeta of getGlobalRegistry().all()) {
    suiteRegistry.register(exMeta);
  }

  const runner = new ExampleRunner(suiteRegistry, options?.cloneStrategy);
  const order = topoSort(suiteRegistry.all());

  // 4. Register one describe block per suite class.
  describe(SuiteClass.name, () => {
    const results: ExampleResult[] = [];

    // Execute all examples before any individual test body runs.
    beforeAll(async () => {
      const r = await runner.run(suite);
      results.push(...r);
    });

    // Register one test per example, in topological order.
    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      const index = i;

      test(name, () => {
        const result = results[index];
        if (result.status === 'skipped') return;
        if (result.status === 'failed') {
          throw result.error ?? new Error(`Example "${name}" failed`);
        }
      });
    }
  });
}
