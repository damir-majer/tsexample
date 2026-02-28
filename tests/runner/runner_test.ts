/**
 * Tests for ExampleRunner.
 *
 * ExampleRunner is tested in isolation — no decorators used.
 * Registries are built manually so tests stay independent of global state.
 */

import {
  assertEquals,
  assertInstanceOf,
  assertRejects,
} from 'jsr:@std/assert@^1.0.19';
import { ExampleRegistry } from '../../src/core/registry.ts';
import type { ExampleMetadata } from '../../src/core/types.ts';
import { ExampleRunner } from '../../src/runner/runner.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(...examples: ExampleMetadata[]): ExampleRegistry {
  const reg = new ExampleRegistry();
  for (const ex of examples) reg.register(ex);
  return reg;
}

function meta(
  name: string,
  method: string,
  given: string[] = [],
): ExampleMetadata {
  return { name, method, given };
}

// ---------------------------------------------------------------------------
// Single example — basic pass
// ---------------------------------------------------------------------------

Deno.test('run() executes a single @Example method and returns passed result', async () => {
  const registry = makeRegistry(meta('root', 'root'));
  const runner = new ExampleRunner(registry);

  const suite = {
    root() {
      return { amount: 0, currency: 'CHF' };
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 1);
  assertEquals(results[0].status, 'passed');
  assertEquals(results[0].value, { amount: 0, currency: 'CHF' });
});

// ---------------------------------------------------------------------------
// Async examples
// ---------------------------------------------------------------------------

Deno.test('run() awaits async example methods and returns their resolved value', async () => {
  const registry = makeRegistry(meta('asyncRoot', 'asyncRoot'));
  const runner = new ExampleRunner(registry);

  const suite = {
    async asyncRoot() {
      return await Promise.resolve(42);
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[0].status, 'passed');
  assertEquals(results[0].value, 42);
});

// ---------------------------------------------------------------------------
// Dependency chain — producer executes first, consumer receives fixture
// ---------------------------------------------------------------------------

Deno.test('run() executes producer before consumer and passes cloned fixture', async () => {
  const registry = makeRegistry(
    meta('empty', 'empty'),
    meta('addDollars', 'addDollars', ['empty']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    empty() {
      return { amount: 0, currency: 'CHF' };
    },
    addDollars(money: { amount: number; currency: string }) {
      return { amount: money.amount + 10, currency: 'USD' };
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 2);

  // Order is guaranteed by topoSort — just verify by index
  assertEquals(results[0].status, 'passed');
  assertEquals(results[0].value, { amount: 0, currency: 'CHF' });

  assertEquals(results[1].status, 'passed');
  assertEquals(results[1].value, { amount: 10, currency: 'USD' });
});

// ---------------------------------------------------------------------------
// Fixture cloning — consumer gets a deep clone, not the same reference
// ---------------------------------------------------------------------------

Deno.test("run() passes a deep clone to the consumer, not the producer's cached reference", async () => {
  let capturedArg: unknown;
  let producedValue: unknown;

  const registry = makeRegistry(
    meta('source', 'source'),
    meta('reader', 'reader', ['source']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    source() {
      producedValue = { nested: { count: 1 } };
      return producedValue;
    },
    reader(fixture: unknown) {
      capturedArg = fixture;
      return fixture;
    },
  };

  await runner.run(suite);

  // The consumer received an object with the same content…
  assertEquals(capturedArg, { nested: { count: 1 } });
  // …but it must not be the same reference as what source() returned.
  assertEquals(capturedArg === producedValue, false);
});

// ---------------------------------------------------------------------------
// Failed producer → consumer is skipped
// ---------------------------------------------------------------------------

Deno.test('run() skips consumer when its producer failed', async () => {
  const registry = makeRegistry(
    meta('failing', 'failing'),
    meta('dependent', 'dependent', ['failing']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    failing() {
      throw new Error('boom');
    },
    dependent() {
      return 'should not run';
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 2);

  const [failingResult, dependentResult] = results;
  assertEquals(failingResult.status, 'failed');
  assertEquals(dependentResult.status, 'skipped');
  assertEquals(dependentResult.value, undefined);
});

// ---------------------------------------------------------------------------
// Transitive failure — A fails → B skipped → C skipped
// ---------------------------------------------------------------------------

Deno.test('run() transitively skips examples when a root producer fails', async () => {
  const registry = makeRegistry(
    meta('A', 'methodA'),
    meta('B', 'methodB', ['A']),
    meta('C', 'methodC', ['B']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    methodA() {
      throw new Error('A fails');
    },
    methodB() {
      return 'B ran (should not happen)';
    },
    methodC() {
      return 'C ran (should not happen)';
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 3);
  assertEquals(results[0].status, 'failed'); // A
  assertEquals(results[1].status, 'skipped'); // B
  assertEquals(results[2].status, 'skipped'); // C
});

// ---------------------------------------------------------------------------
// Cycle detection — throws before execution
// ---------------------------------------------------------------------------

Deno.test('run() throws a descriptive error when the dependency graph contains a cycle', async () => {
  const registry = makeRegistry(
    meta('alpha', 'alpha', ['beta']),
    meta('beta', 'beta', ['alpha']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    alpha() {
      return 1;
    },
    beta() {
      return 2;
    },
  };

  await assertRejects(
    () => runner.run(suite),
    Error,
    'Circular dependency',
  );
});

// ---------------------------------------------------------------------------
// Error captured in result — error field is an Error instance
// ---------------------------------------------------------------------------

Deno.test('run() captures the thrown Error in the result.error field', async () => {
  const registry = makeRegistry(meta('boom', 'boom'));
  const runner = new ExampleRunner(registry);

  const expected = new Error('specific error message');
  const suite = {
    boom() {
      throw expected;
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[0].status, 'failed');
  assertInstanceOf(results[0].error, Error);
  assertEquals(results[0].error?.message, 'specific error message');
});

Deno.test('run() wraps a non-Error throw in an Error instance', async () => {
  const registry = makeRegistry(meta('strThrow', 'strThrow'));
  const runner = new ExampleRunner(registry);

  const suite = {
    strThrow() {
      // deno-lint-ignore no-throw-literal
      throw 'plain string error';
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[0].status, 'failed');
  assertInstanceOf(results[0].error, Error);
  assertEquals(results[0].error?.message, 'plain string error');
});

// ---------------------------------------------------------------------------
// Empty registry
// ---------------------------------------------------------------------------

Deno.test('run() returns an empty array when registry has no examples', async () => {
  const registry = new ExampleRegistry();
  const runner = new ExampleRunner(registry);
  const suite = {};

  const results = await runner.run(suite);
  assertEquals(results, []);
});

// ---------------------------------------------------------------------------
// Custom clone strategy
// ---------------------------------------------------------------------------

Deno.test('run() uses a custom CloneStrategy function when provided', async () => {
  const cloneLog: unknown[] = [];

  const customStrategy = (v: unknown) => {
    cloneLog.push(v);
    return { cloned: true, original: v };
  };

  const registry = makeRegistry(
    meta('producer', 'producer'),
    meta('consumer', 'consumer', ['producer']),
  );
  const runner = new ExampleRunner(registry, customStrategy);

  const suite = {
    producer() {
      return { data: 'hello' };
    },
    consumer(fixture: unknown) {
      return fixture;
    },
  };

  const results = await runner.run(suite);

  assertEquals(cloneLog.length, 1);
  assertEquals(results[1].value, { cloned: true, original: { data: 'hello' } });
});
