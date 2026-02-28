/**
 * TSExample — Vitest public API barrel.
 *
 * Import from this file when using TSExample with Vitest:
 *
 *   import { Example, Given, registerSuite } from '../../src/mod.vitest.ts';
 *
 * This barrel re-exports the same public API as mod.ts but swaps the
 * Deno adapter for the Vitest adapter. The core logic (registry, graph,
 * clone, runner, decorators) is 100% shared — only the adapter differs.
 */

// Decorators
export {
  Example,
  getGlobalRegistry,
  Given,
  resetGlobalRegistry,
} from './runner/decorators.ts';

// Vitest adapter
export { registerSuite } from './runner/vitest-adapter.ts';
export type { RegisterSuiteOptions } from './runner/vitest-adapter.ts';

// Core runner (for programmatic use without decorators)
export { ExampleRunner } from './runner/runner.ts';

// Core registry (for manual test harnesses)
export { ExampleRegistry } from './core/registry.ts';

// Graph utilities
export { renderMermaid } from './core/graph.ts';

// Report utilities
export { buildReport, renderMarkdown } from './core/report.ts';

// Clone utilities
export { isCloneable } from './core/clone.ts';

// Types
export type {
  Cloneable,
  CloneStrategy,
  ExampleMetadata,
  ExampleOptions,
  ExampleResult,
  ExampleStatus,
  SuiteReport,
  SuiteReportEntry,
  SuiteReportSummary,
} from './core/types.ts';
