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
import type { CloneStrategy, ExampleResult } from '../core/types.ts';

// ---------------------------------------------------------------------------
// Pure helpers — no I/O, no Deno.test. Exported for unit testing.
// ---------------------------------------------------------------------------

/**
 * Format the Deno step name for an example.
 *
 * Skipped examples are prefixed with "[SKIPPED]" so their status is
 * self-documenting in test output (Deno has no native skip-step API).
 *
 * @param name    The example name (from topological order).
 * @param skipped Whether the example was skipped.
 * @returns       The display name for the Deno sub-step.
 */
export function formatStepName(name: string, skipped: boolean): string {
  return skipped ? `[SKIPPED] ${name}` : name;
}

/**
 * Resolve the error that a Deno step should throw, if any.
 *
 * Returns null for passed or skipped results (step body is a no-op).
 * Returns the captured Error for failed results, falling back to a
 * generic Error if the failure carried no error object.
 *
 * @param result  The ExampleResult from the runner.
 * @param name    The example name, used in the fallback error message.
 * @returns       An Error to throw inside the step, or null.
 */
export function resolveStepError(
  result: ExampleResult,
  name: string,
): Error | null {
  if (result.status !== 'failed') return null;
  return result.error ?? new Error(`Example "${name}" failed`);
}

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

      const stepName = formatStepName(name, result.status === 'skipped');
      const stepError = resolveStepError(result, name);
      await t.step(stepName, () => {
        if (stepError !== null) throw stepError;
        // 'passed' or 'skipped' — no-op
      });
    }
  });
}
