import { assertEquals } from 'jsr:@std/assert@^1.0.19';
import type { ExampleMetadata } from '../../src/core/types.ts';
import { buildGraph, detectCycles, topoSort } from '../../src/core/graph.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ex(name: string, given: string[] = []): ExampleMetadata {
  return { name, method: name, given };
}

// ---------------------------------------------------------------------------
// buildGraph()
// ---------------------------------------------------------------------------

Deno.test('buildGraph: empty input returns empty adjacency map', () => {
  const result = buildGraph([]);
  assertEquals(result.size, 0);
});

Deno.test('buildGraph: single example with no dependencies has empty adjacency list', () => {
  const result = buildGraph([ex('A')]);
  assertEquals(result.get('A'), []);
});

Deno.test('buildGraph: linear chain A->B->C produces correct adjacency', () => {
  // A produces for B; B produces for C
  // given: B depends on A, C depends on B
  const result = buildGraph([ex('A'), ex('B', ['A']), ex('C', ['B'])]);
  // adjacency is consumer-edges: key = producer, value = consumers
  assertEquals(result.get('A'), ['B']);
  assertEquals(result.get('B'), ['C']);
  assertEquals(result.get('C'), []);
});

Deno.test('buildGraph: diamond A->B, A->C, B->D, C->D', () => {
  const result = buildGraph([
    ex('A'),
    ex('B', ['A']),
    ex('C', ['A']),
    ex('D', ['B', 'C']),
  ]);
  // A produces for B and C
  const aConsumers = result.get('A')!;
  assertEquals(aConsumers.sort(), ['B', 'C']);
  // B produces for D
  assertEquals(result.get('B'), ['D']);
  // C produces for D
  assertEquals(result.get('C'), ['D']);
  // D has no consumers
  assertEquals(result.get('D'), []);
});

// ---------------------------------------------------------------------------
// topoSort()
// ---------------------------------------------------------------------------

Deno.test('topoSort: empty graph returns empty array', () => {
  assertEquals(topoSort([]), []);
});

Deno.test('topoSort: single node returns [node]', () => {
  assertEquals(topoSort([ex('A')]), ['A']);
});

Deno.test('topoSort: linear chain returns producers before consumers', () => {
  const sorted = topoSort([ex('A'), ex('B', ['A']), ex('C', ['B'])]);
  assertEquals(sorted, ['A', 'B', 'C']);
});

Deno.test('topoSort: diamond - A appears before B and C, D appears last', () => {
  const sorted = topoSort([
    ex('A'),
    ex('B', ['A']),
    ex('C', ['A']),
    ex('D', ['B', 'C']),
  ]);
  // A must come first, D must come last
  assertEquals(sorted[0], 'A');
  assertEquals(sorted[sorted.length - 1], 'D');
  // B and C must both appear between A and D
  const bIdx = sorted.indexOf('B');
  const cIdx = sorted.indexOf('C');
  const aIdx = sorted.indexOf('A');
  const dIdx = sorted.indexOf('D');
  assertEquals(aIdx < bIdx && aIdx < cIdx, true);
  assertEquals(bIdx < dIdx && cIdx < dIdx, true);
});

Deno.test('topoSort: multiple roots are handled (no single entry point required)', () => {
  // Two independent roots: X and Y, both feed into Z
  const sorted = topoSort([ex('X'), ex('Y'), ex('Z', ['X', 'Y'])]);
  assertEquals(sorted.length, 3);
  // X and Y must appear before Z
  const xIdx = sorted.indexOf('X');
  const yIdx = sorted.indexOf('Y');
  const zIdx = sorted.indexOf('Z');
  assertEquals(xIdx < zIdx, true);
  assertEquals(yIdx < zIdx, true);
});

// ---------------------------------------------------------------------------
// detectCycles()
// ---------------------------------------------------------------------------

Deno.test('detectCycles: acyclic graph returns null', () => {
  const result = detectCycles([ex('A'), ex('B', ['A']), ex('C', ['B'])]);
  assertEquals(result, null);
});

Deno.test('detectCycles: simple cycle A->B->A returns the cycle path', () => {
  // B depends on A, A depends on B => cycle
  const result = detectCycles([ex('A', ['B']), ex('B', ['A'])]);
  assertEquals(result !== null, true);
  assertEquals(Array.isArray(result), true);
  // The cycle path must contain both A and B
  assertEquals(result!.includes('A'), true);
  assertEquals(result!.includes('B'), true);
});

Deno.test('detectCycles: self-referencing example returns cycle', () => {
  const result = detectCycles([ex('A', ['A'])]);
  assertEquals(result !== null, true);
  assertEquals(result!.includes('A'), true);
});
