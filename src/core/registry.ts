/**
 * ExampleRegistry — in-memory store for example metadata and cached results.
 *
 * Pure class: no I/O, no side effects beyond internal Map state.
 */

import type { ExampleMetadata, ExampleResult } from './types.ts';

export class ExampleRegistry {
  readonly #metadata = new Map<string, ExampleMetadata>();
  readonly #results = new Map<string, ExampleResult>();

  /**
   * Register an example's metadata.
   *
   * @throws {Error} If an example with the same name has already been registered.
   */
  register(meta: ExampleMetadata): void {
    if (this.#metadata.has(meta.name)) {
      throw new Error(
        `Example "${meta.name}" is already registered. Names must be unique.`,
      );
    }
    this.#metadata.set(meta.name, meta);
  }

  /** Return the metadata for a registered example, or `undefined` if not found. */
  get(name: string): ExampleMetadata | undefined {
    return this.#metadata.get(name);
  }

  /** Return all registered example metadata as an array. Order reflects insertion order. */
  all(): ExampleMetadata[] {
    return Array.from(this.#metadata.values());
  }

  /** Store (or overwrite) the cached result for an example. */
  setCachedResult(name: string, result: ExampleResult): void {
    this.#results.set(name, result);
  }

  /** Return the cached result for an example, or `undefined` if not yet cached. */
  getCachedResult(name: string): ExampleResult | undefined {
    return this.#results.get(name);
  }

  /** Clear both the metadata and cached-result maps. Useful for test isolation. */
  clear(): void {
    this.#metadata.clear();
    this.#results.clear();
  }

  /** Number of registered examples. Cache entries do not contribute to this count. */
  get size(): number {
    return this.#metadata.size;
  }
}
