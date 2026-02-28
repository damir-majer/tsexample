/**
 * Report utilities for TSExample.
 *
 * Pure function: no I/O, no side effects. Takes metadata + results,
 * produces a structured SuiteReport.
 */

import type {
  ExampleMetadata,
  ExampleResult,
  SuiteReport,
  SuiteReportEntry,
  SuiteReportSummary,
} from './types.ts';
import { renderMermaid } from './graph.ts';

/**
 * Build a structured report from suite execution results.
 *
 * @param suite     The suite class name.
 * @param examples  Example metadata in execution (topological) order.
 * @param results   Execution results, same length and order as examples.
 * @returns         A SuiteReport with summary, entries, and Mermaid graph.
 * @throws          If examples and results arrays have different lengths.
 */
export function buildReport(
  suite: string,
  examples: readonly ExampleMetadata[],
  results: readonly ExampleResult[],
): SuiteReport {
  if (examples.length !== results.length) {
    throw new Error(
      `buildReport: examples (${examples.length}) and results (${results.length}) must have the same length.`,
    );
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let totalDuration = 0;

  const entries: SuiteReportEntry[] = [];

  for (let i = 0; i < examples.length; i++) {
    const meta = examples[i];
    const result = results[i];

    if (result.status === 'passed') passed++;
    else if (result.status === 'failed') failed++;
    else skipped++;

    totalDuration += result.durationMs;

    entries.push({
      name: meta.name,
      ...(meta.description !== undefined
        ? { description: meta.description }
        : {}),
      ...(meta.tags !== undefined ? { tags: meta.tags } : {}),
      status: result.status,
      given: meta.given,
      durationMs: result.durationMs,
      ...(result.error !== undefined ? { error: result.error.message } : {}),
    });
  }

  const summary: SuiteReportSummary = {
    total: examples.length,
    passed,
    failed,
    skipped,
    durationMs: totalDuration,
  };

  return {
    suite,
    timestamp: new Date().toISOString(),
    summary,
    examples: entries,
    graph: renderMermaid([...examples]),
  };
}
