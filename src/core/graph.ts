/**
 * Dependency graph utilities for TSExample.
 *
 * All functions are pure — no side effects, no global state.
 */

import type { ExampleMetadata } from './types.ts';

/**
 * Build an adjacency list from example metadata.
 *
 * Key   = producer example name
 * Value = names of all consumers (examples that list this producer in `given`)
 *
 * Every example present in the input gets an entry, even if it has no consumers.
 */
export function buildGraph(examples: ExampleMetadata[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  // Initialise every node with an empty consumer list.
  for (const ex of examples) {
    if (!adjacency.has(ex.name)) {
      adjacency.set(ex.name, []);
    }
  }

  // Wire producer -> consumer edges from the `given` declarations.
  for (const ex of examples) {
    for (const producer of ex.given) {
      // Ensure the producer exists in the map even if it wasn't in the input
      // (handles references to undeclared producers gracefully).
      if (!adjacency.has(producer)) {
        adjacency.set(producer, []);
      }
      adjacency.get(producer)!.push(ex.name);
    }
  }

  return adjacency;
}

/**
 * Topological sort using Kahn's algorithm.
 *
 * Returns example names in execution order so that every producer appears
 * before its consumers.  Throws if the graph contains a cycle.
 *
 * @param examples  Array of example metadata (the full registry).
 * @returns         Ordered list of example names (producers first).
 */
export function topoSort(examples: ExampleMetadata[]): string[] {
  if (examples.length === 0) return [];

  const adjacency = buildGraph(examples);

  // Compute in-degree: number of producers each node depends on.
  const inDegree = new Map<string, number>();
  for (const name of adjacency.keys()) {
    if (!inDegree.has(name)) {
      inDegree.set(name, 0);
    }
  }
  for (const consumers of adjacency.values()) {
    for (const consumer of consumers) {
      inDegree.set(consumer, (inDegree.get(consumer) ?? 0) + 1);
    }
  }

  // Seed the queue with all nodes that have no dependencies.
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }
  // Sort for deterministic output when multiple roots exist.
  queue.sort();

  const sorted: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    const consumers = adjacency.get(node) ?? [];
    // Sort consumers for deterministic ordering.
    for (const consumer of [...consumers].sort()) {
      const newDegree = (inDegree.get(consumer) ?? 1) - 1;
      inDegree.set(consumer, newDegree);
      if (newDegree === 0) {
        queue.push(consumer);
        queue.sort();
      }
    }
  }

  if (sorted.length !== adjacency.size) {
    throw new Error(
      'topoSort: cycle detected — use detectCycles() for the cycle path.',
    );
  }

  return sorted;
}

/**
 * Render a Mermaid `graph TD` diagram from example metadata.
 *
 * - Edges are sorted alphabetically by producer, then by consumer.
 * - Root nodes (no dependencies AND no consumers) appear as standalone entries.
 * - Returns just the header line when the input is empty.
 *
 * @param examples  Array of example metadata.
 * @returns         Mermaid diagram string.
 */
export function renderMermaid(examples: ExampleMetadata[]): string {
  const header = 'graph TD\n';
  if (examples.length === 0) return header;

  const adjacency = buildGraph(examples);

  // Compute the set of nodes that have at least one incoming edge (they are consumers).
  const hasIncoming = new Set<string>();
  for (const consumers of adjacency.values()) {
    for (const consumer of consumers) {
      hasIncoming.add(consumer);
    }
  }

  const lines: string[] = [];

  // Iterate all nodes alphabetically.
  const sortedNodes = [...adjacency.keys()].sort();
  for (const node of sortedNodes) {
    const consumers = adjacency.get(node)!;

    if (consumers.length === 0 && !hasIncoming.has(node)) {
      // Root node: no dependencies, no consumers → standalone.
      lines.push(`  ${node}`);
    } else {
      // Emit one edge per consumer, sorted alphabetically.
      for (const consumer of [...consumers].sort()) {
        lines.push(`  ${node} --> ${consumer}`);
      }
    }
  }

  return header + lines.join('\n') + (lines.length > 0 ? '\n' : '');
}

/**
 * Detect cycles in the dependency graph using DFS with a colouring scheme.
 *
 * Colours:
 *   0 = white (unvisited)
 *   1 = grey  (on current DFS stack)
 *   2 = black (fully processed)
 *
 * @param examples  Array of example metadata.
 * @returns         Cycle path as string[] if a cycle exists, or null if the
 *                  graph is a valid DAG.
 */
export function detectCycles(examples: ExampleMetadata[]): string[] | null {
  if (examples.length === 0) return null;

  // Build a dependency map: node -> list of producers it depends on.
  // (Opposite direction from buildGraph — we follow `given` edges directly.)
  const deps = new Map<string, readonly string[]>();
  for (const ex of examples) {
    deps.set(ex.name, ex.given);
  }

  const color = new Map<string, 0 | 1 | 2>();
  for (const name of deps.keys()) {
    color.set(name, 0);
  }

  const stack: string[] = [];

  function dfs(node: string): string[] | null {
    color.set(node, 1); // grey: on stack
    stack.push(node);

    for (const producer of deps.get(node) ?? []) {
      const c = color.get(producer);

      if (c === 1) {
        // Back edge — found a cycle.  Extract the cycle segment from the stack.
        const cycleStart = stack.indexOf(producer);
        return [...stack.slice(cycleStart), producer];
      }

      if (c === 0) {
        const result = dfs(producer);
        if (result !== null) return result;
      }
      // c === 2 means already fully processed — no cycle through this path.
    }

    stack.pop();
    color.set(node, 2); // black: done
    return null;
  }

  for (const name of deps.keys()) {
    if (color.get(name) === 0) {
      const result = dfs(name);
      if (result !== null) return result;
    }
  }

  return null;
}
