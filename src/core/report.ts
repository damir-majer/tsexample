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

/**
 * Render a SuiteReport as a Markdown document.
 *
 * Includes: heading, summary line, example table, and Mermaid dependency graph.
 * The Tags column is omitted if no examples have tags.
 * The Description column is omitted if no examples have descriptions.
 *
 * @param report  A SuiteReport (from buildReport()).
 * @returns       Markdown string.
 */
export function renderMarkdown(report: SuiteReport): string {
  const lines: string[] = [];

  // Heading
  lines.push(`# ${report.suite}`);
  lines.push('');

  // Summary
  const { total, passed, failed, skipped, durationMs } = report.summary;
  lines.push(
    `> ${total} examples: ${passed} passed, ${failed} failed, ${skipped} skipped (${formatMs(durationMs)})`,
  );
  lines.push('');

  // Table
  if (report.examples.length > 0) {
    const hasTags = report.examples.some((e) => e.tags !== undefined && e.tags.length > 0);
    const hasDescriptions = report.examples.some((e) => e.description !== undefined);

    // Header row
    const headers = ['#', 'Example', 'Status', 'Duration'];
    if (hasTags) headers.push('Tags');
    if (hasDescriptions) headers.push('Description');
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`|${headers.map(() => '---').join('|')}|`);

    // Data rows
    for (let i = 0; i < report.examples.length; i++) {
      const e = report.examples[i];
      const status = e.error ? `${e.status}: ${e.error}` : e.status;
      const cols: string[] = [
        String(i + 1),
        e.name,
        status,
        formatMs(e.durationMs),
      ];
      if (hasTags) {
        cols.push(e.tags ? e.tags.map((t) => `\`${t}\``).join(' ') : '');
      }
      if (hasDescriptions) {
        cols.push(e.description ?? '');
      }
      lines.push(`| ${cols.join(' | ')} |`);
    }
    lines.push('');
  }

  // Dependency graph
  if (report.graph.trim() !== 'graph TD') {
    lines.push('## Dependency Graph');
    lines.push('');
    lines.push('```mermaid');
    lines.push(report.graph.trimEnd());
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/** Format milliseconds for display: "1.2ms" or "0.0ms". */
function formatMs(ms: number): string {
  return `${ms.toFixed(1)}ms`;
}
