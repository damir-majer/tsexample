/**
 * TSExample — public API barrel.
 *
 * Import from this file for the decorated-class experience:
 *
 *   import { Example, Given, registerSuite } from './mod.ts';
 *
 * Import from core modules directly if you need the lower-level building blocks:
 *   - src/core/registry.ts  — ExampleRegistry
 *   - src/core/graph.ts     — buildGraph, topoSort, detectCycles
 *   - src/core/clone.ts     — cloneFixture
 *   - src/runner/runner.ts  — ExampleRunner
 */

// Decorators
export {
  Example,
  getGlobalRegistry,
  Given,
  resetGlobalRegistry,
} from './runner/decorators.ts';

// Deno adapter
export { registerSuite } from './runner/deno-adapter.ts';
export type { RegisterSuiteOptions } from './runner/deno-adapter.ts';

// Core runner (for programmatic use without decorators)
export { ExampleRunner } from './runner/runner.ts';

// Core registry (for manual test harnesses)
export { ExampleRegistry } from './core/registry.ts';

// Types
export type {
  CloneStrategy,
  ExampleMetadata,
  ExampleResult,
  ExampleStatus,
} from './core/types.ts';
