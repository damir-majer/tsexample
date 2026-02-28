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
  tags?: string[],
): ExampleMetadata {
  return {
    name,
    method: name,
    given,
    ...(description !== undefined ? { description } : {}),
    ...(tags !== undefined ? { tags } : {}),
  };
}

function passed(value: unknown = undefined, durationMs = 0): ExampleResult {
  return { value, status: 'passed', durationMs };
}

function failed(message: string, durationMs = 0): ExampleResult {
  return { value: undefined, status: 'failed', error: new Error(message), durationMs };
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

// ---------------------------------------------------------------------------
// buildReport() — tags
// ---------------------------------------------------------------------------

Deno.test('buildReport: tags are included in report entries', () => {
  const examples = [meta('root', [], undefined, ['setup', 'fast'])];
  const results = [passed()];
  const report = buildReport('TagSuite', examples, results);

  assertEquals(report.examples[0].tags, ['setup', 'fast']);
});

Deno.test('buildReport: tags are undefined when not set on metadata', () => {
  const examples = [meta('root')];
  const results = [passed()];
  const report = buildReport('NoTagSuite', examples, results);

  assertEquals(report.examples[0].tags, undefined);
});

// ---------------------------------------------------------------------------
// buildReport() — durationMs
// ---------------------------------------------------------------------------

Deno.test('buildReport: durationMs is included in report entries', () => {
  const examples = [meta('a'), meta('b', ['a'])];
  const results = [passed(undefined, 1.5), passed(undefined, 2.3)];
  const report = buildReport('DurationSuite', examples, results);

  assertEquals(report.examples[0].durationMs, 1.5);
  assertEquals(report.examples[1].durationMs, 2.3);
});

Deno.test('buildReport: summary durationMs is sum of all examples', () => {
  const examples = [meta('a'), meta('b'), meta('c')];
  const results = [passed(undefined, 1.0), passed(undefined, 2.0), passed(undefined, 3.0)];
  const report = buildReport('SumSuite', examples, results);

  assertEquals(report.summary.durationMs, 6.0);
});

Deno.test('buildReport: skipped examples contribute 0ms to total duration', () => {
  const examples = [meta('a'), meta('b', ['a'])];
  const results = [failed('boom', 1.0), skipped()];
  const report = buildReport('SkipDurationSuite', examples, results);

  assertEquals(report.summary.durationMs, 1.0);
  assertEquals(report.examples[1].durationMs, 0);
});
