/**
 * ExampleRunner — orchestrates execution of all examples in topological order.
 *
 * Imperative shell: coordinates I/O-adjacent concerns (async, error capture,
 * fixture resolution) while delegating pure logic to core modules.
 *
 * Design decisions:
 * - detectCycles() is checked first so the error is thrown synchronously
 *   and before any side effects happen.
 * - topoSort() guarantees every producer runs before its consumers.
 * - Per-example results are cached in the registry so that downstream
 *   consumers can resolve their fixture arguments.
 * - A failed or skipped producer causes all transitive consumers to be
 *   skipped (cascade).
 */

import { ExampleRegistry } from '../core/registry.ts';
import { detectCycles, topoSort } from '../core/graph.ts';
import { cloneFixture } from '../core/clone.ts';
import type {
  CloneStrategy,
  ExampleMetadata,
  ExampleResult,
} from '../core/types.ts';

export class ExampleRunner {
  readonly #registry: ExampleRegistry;
  readonly #cloneStrategy: CloneStrategy;

  constructor(registry: ExampleRegistry, cloneStrategy?: CloneStrategy) {
    this.#registry = registry;
    this.#cloneStrategy = cloneStrategy ?? 'structured';
  }

  /**
   * Execute all registered examples in dependency order.
   *
   * @param suite  The class instance whose methods will be called.
   * @returns      Results in the same topological order.
   * @throws       If a circular dependency is detected.
   */
  async run(suite: object): Promise<ExampleResult[]> {
    const examples = this.#registry.all();

    if (examples.length === 0) return [];

    // Guard: validate that all given references resolve to registered examples.
    const registeredNames = new Set(examples.map((ex) => ex.name));
    for (const ex of examples) {
      for (const producerName of ex.given) {
        if (!registeredNames.has(producerName)) {
          throw new Error(
            `TSExample: Example "${ex.name}" depends on "${producerName}" which is not registered.`,
          );
        }
      }
    }

    // Guard: detect cycles before touching any results.
    const cycle = detectCycles(examples);
    if (cycle !== null) {
      throw new Error(
        `TSExample: Circular dependency detected: ${cycle.join(' -> ')}`,
      );
    }

    const order = topoSort(examples);
    const results: ExampleResult[] = [];

    for (const name of order) {
      const exMeta = this.#registry.get(name);
      if (!exMeta) continue;

      const result = await this.#executeOne(exMeta, suite);
      this.#registry.setCachedResult(name, result);
      results.push(result);
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  async #executeOne(
    exMeta: ExampleMetadata,
    suite: object,
  ): Promise<ExampleResult> {
    // Skip if any producer dependency failed or was itself skipped.
    if (this.#shouldSkip(exMeta)) {
      return { value: undefined, status: 'skipped' };
    }

    try {
      // Resolve and clone fixture arguments from producers.
      const args = exMeta.given.map((producerName) => {
        const cached = this.#registry.getCachedResult(producerName);
        // Passed check was already done in #shouldSkip — safe to use value.
        return cloneFixture(cached!.value, this.#cloneStrategy);
      });

      const method = (
        suite as Record<string, (...args: unknown[]) => unknown>
      )[exMeta.method];

      const value = await method.apply(suite, args);

      return { value, status: 'passed' };
    } catch (error) {
      return {
        value: undefined,
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Return true if this example should be skipped because at least one of its
   * declared producers did not pass.
   */
  #shouldSkip(exMeta: ExampleMetadata): boolean {
    for (const producerName of exMeta.given) {
      const cached = this.#registry.getCachedResult(producerName);
      if (!cached) return true; // Producer hasn't run (should not happen post-topoSort).
      if (cached.status === 'failed' || cached.status === 'skipped') {
        return true;
      }
    }
    return false;
  }
}
