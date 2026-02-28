/**
 * Core types for TSExample — Example-Driven Development framework.
 *
 * All types are pure data definitions with no logic or side effects.
 */

/** Interface for fixtures that support proper cloning with prototype preservation. */
export interface Cloneable<T = unknown> {
  clone(): T;
}

/** Status of an example after execution. */
export type ExampleStatus = 'passed' | 'failed' | 'skipped';

/** Strategy for cloning fixtures between producer and consumer. */
export type CloneStrategy = 'structured' | ((value: unknown) => unknown);

/** Options accepted by the @Example() decorator. */
export interface ExampleOptions {
  /** Custom name for this example. Defaults to the method name. */
  readonly name?: string;
  /** Human-readable description of what this example demonstrates. */
  readonly description?: string;
}

/** Metadata for a registered example method. */
export interface ExampleMetadata {
  /** Unique name of this example (defaults to method name). */
  readonly name: string;
  /** Method name on the suite class. */
  readonly method: string;
  /** Names of producer examples this example depends on. */
  readonly given: readonly string[];
  /** Human-readable description of what this example demonstrates. */
  readonly description?: string;
}

/** Result of executing a single example. */
export interface ExampleResult {
  /** The value returned by the example method (the fixture). */
  readonly value: unknown;
  /** Execution status. */
  readonly status: ExampleStatus;
  /** Error if the example failed. */
  readonly error?: Error;
}

/** A directed edge in the example dependency graph. */
export interface DependencyEdge {
  /** Producer example name. */
  readonly from: string;
  /** Consumer example name. */
  readonly to: string;
}

/** Summary counts for a suite report. */
export interface SuiteReportSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
}

/** One example's entry in a suite report. */
export interface SuiteReportEntry {
  readonly name: string;
  readonly description?: string;
  readonly status: ExampleStatus;
  readonly given: readonly string[];
  readonly error?: string;
}

/** Structured report for a completed suite execution. */
export interface SuiteReport {
  readonly suite: string;
  readonly timestamp: string;
  readonly summary: SuiteReportSummary;
  readonly examples: readonly SuiteReportEntry[];
  readonly graph: string;
}
