import { assertEquals } from 'jsr:@std/assert@^1.0.19';
import type { ExampleMetadata, ExampleResult } from '../../src/core/types.ts';
import { buildReport } from '../../src/core/report.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function meta(
  name: string,
  given: string[] = [],
  description?: string,
): ExampleMetadata {
  return {
    name,
    method: name,
    given,
    ...(description !== undefined ? { description } : {}),
  };
}

function passed(value: unknown = undefined): ExampleResult {
  return { value, status: 'passed', durationMs: 0 };
}

function failed(message: string): ExampleResult {
  return { value: undefined, status: 'failed', error: new Error(message), durationMs: 0 };
}

function skipped(): ExampleResult {
  return { value: undefined, status: 'skipped', durationMs: 0 };
}

// ---------------------------------------------------------------------------
// buildReport() — basic structure
// ---------------------------------------------------------------------------

Deno.test('buildReport: empty suite produces zero-count summary', () => {
  const report = buildReport('EmptySuite', [], []);
  assertEquals(report.suite, 'EmptySuite');
  assertEquals(report.summary, { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 });
  assertEquals(report.examples, []);
  assertEquals(report.graph, 'graph TD\n');
  assertEquals(typeof report.timestamp, 'string');
});

Deno.test('buildReport: single passing example', () => {
  const examples = [meta('root')];
  const results = [passed(42)];
  const report = buildReport('SingleSuite', examples, results);

  assertEquals(report.summary, { total: 1, passed: 1, failed: 0, skipped: 0, durationMs: 0 });
  assertEquals(report.examples.length, 1);
  assertEquals(report.examples[0].name, 'root');
  assertEquals(report.examples[0].status, 'passed');
  assertEquals(report.examples[0].given, []);
  assertEquals(report.examples[0].error, undefined);
});

Deno.test('buildReport: mixed results compute correct summary', () => {
  const examples = [
    meta('a'),
    meta('b', ['a']),
    meta('c', ['b']),
  ];
  const results = [passed(), failed('boom'), skipped()];
  const report = buildReport('MixedSuite', examples, results);

  assertEquals(report.summary, { total: 3, passed: 1, failed: 1, skipped: 1, durationMs: 0 });
});

Deno.test('buildReport: failed example includes error message', () => {
  const examples = [meta('broken')];
  const results = [failed('assertion failed')];
  const report = buildReport('FailSuite', examples, results);

  assertEquals(report.examples[0].status, 'failed');
  assertEquals(report.examples[0].error, 'assertion failed');
});

Deno.test('buildReport: description is included when present', () => {
  const examples = [meta('root', [], 'The root fixture')];
  const results = [passed()];
  const report = buildReport('DescSuite', examples, results);

  assertEquals(report.examples[0].description, 'The root fixture');
});

Deno.test('buildReport: description is undefined when not set', () => {
  const examples = [meta('root')];
  const results = [passed()];
  const report = buildReport('NoDescSuite', examples, results);

  assertEquals(report.examples[0].description, undefined);
});

Deno.test('buildReport: given array is preserved in report entries', () => {
  const examples = [
    meta('a'),
    meta('b', ['a']),
    meta('c', ['a', 'b']),
  ];
  const results = [passed(), passed(), passed()];
  const report = buildReport('GivenSuite', examples, results);

  assertEquals(report.examples[0].given, []);
  assertEquals(report.examples[1].given, ['a']);
  assertEquals(report.examples[2].given, ['a', 'b']);
});

Deno.test('buildReport: graph field contains Mermaid diagram', () => {
  const examples = [meta('a'), meta('b', ['a'])];
  const results = [passed(), passed()];
  const report = buildReport('GraphSuite', examples, results);

  assertEquals(report.graph, 'graph TD\n  a --> b\n');
});

Deno.test('buildReport: timestamp is a valid ISO string', () => {
  const report = buildReport('TimeSuite', [], []);
  // ISO 8601 format: YYYY-MM-DDTHH:MM:SS.sssZ
  const parsed = new Date(report.timestamp);
  assertEquals(isNaN(parsed.getTime()), false);
});

Deno.test('buildReport: mismatched lengths throws', () => {
  let threw = false;
  try {
    buildReport('Bad', [meta('a'), meta('b')], [passed()]);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});
