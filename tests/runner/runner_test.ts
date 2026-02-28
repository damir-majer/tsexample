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

// ---------------------------------------------------------------------------
// Producer validation — fail fast for missing given references
// ---------------------------------------------------------------------------

Deno.test('run() throws when a given references a non-existent producer', async () => {
  const registry = makeRegistry(
    meta('addDollars', 'addDollars', ['nonExistent']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    addDollars(_money: unknown) {
      return 'should not run';
    },
  };

  await assertRejects(
    () => runner.run(suite),
    Error,
    'TSExample: Example "addDollars" depends on "nonExistent" which is not registered.',
  );
});

Deno.test('run() throws for missing producer even when other examples are valid', async () => {
  const registry = makeRegistry(
    meta('valid', 'valid'),
    meta('alsoValid', 'alsoValid', ['valid']),
    meta('broken', 'broken', ['doesNotExist']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    valid() {
      return 42;
    },
    alsoValid(_v: unknown) {
      return 99;
    },
    broken(_v: unknown) {
      return 'should not run';
    },
  };

  await assertRejects(
    () => runner.run(suite),
    Error,
    'TSExample: Example "broken" depends on "doesNotExist" which is not registered.',
  );
});

Deno.test('run() accepts valid given references without error', async () => {
  const registry = makeRegistry(
    meta('root', 'root'),
    meta('child', 'child', ['root']),
    meta('grandchild', 'grandchild', ['child']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    root() {
      return 1;
    },
    child(v: number) {
      return v + 1;
    },
    grandchild(v: number) {
      return v + 1;
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 3);
  assertEquals(results[0].status, 'passed');
  assertEquals(results[1].status, 'passed');
  assertEquals(results[2].status, 'passed');
  assertEquals(results[0].value, 1);
  assertEquals(results[1].value, 2);
  assertEquals(results[2].value, 3);
});

// ---------------------------------------------------------------------------
// Custom clone strategy
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Multi-producer arguments — N producers → N method arguments
// ---------------------------------------------------------------------------

Deno.test('run() passes multiple producer fixtures as separate arguments', async () => {
  const registry = makeRegistry(
    meta('left', 'left'),
    meta('right', 'right'),
    meta('merge', 'merge', ['left', 'right']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    left() {
      return { side: 'left', value: 10 };
    },
    right() {
      return { side: 'right', value: 20 };
    },
    merge(
      l: { side: string; value: number },
      r: { side: string; value: number },
    ) {
      return { total: l.value + r.value, sources: [l.side, r.side] };
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 3);
  assertEquals(results[2].status, 'passed');
  assertEquals(results[2].value, { total: 30, sources: ['left', 'right'] });
});

Deno.test('run() skips multi-producer consumer when any producer fails', async () => {
  const registry = makeRegistry(
    meta('ok', 'ok'),
    meta('fail', 'fail'),
    meta('both', 'both', ['ok', 'fail']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    ok() {
      return 42;
    },
    fail() {
      throw new Error('broken');
    },
    both(_a: unknown, _b: unknown) {
      return 'should not run';
    },
  };

  const results = await runner.run(suite);

  assertEquals(results.length, 3);

  // Order of independent roots (ok, fail) is not guaranteed by topoSort.
  // Find results by checking values — 'both' is always last (depends on both).
  const statuses = new Map(
    results.map((r) => {
      if (r.status === 'passed' && r.value === 42) return ['ok', r.status];
      if (r.status === 'failed') return ['fail', r.status];
      return ['both', r.status];
    }),
  );
  assertEquals(statuses.get('ok'), 'passed');
  assertEquals(statuses.get('fail'), 'failed');
  assertEquals(statuses.get('both'), 'skipped');
});

Deno.test('run() clones each producer fixture independently for multi-producer', async () => {
  let capturedLeft: unknown;
  let capturedRight: unknown;
  let producedLeft: unknown;
  let producedRight: unknown;

  const registry = makeRegistry(
    meta('a', 'a'),
    meta('b', 'b'),
    meta('c', 'c', ['a', 'b']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    a() {
      producedLeft = { id: 'a' };
      return producedLeft;
    },
    b() {
      producedRight = { id: 'b' };
      return producedRight;
    },
    c(left: unknown, right: unknown) {
      capturedLeft = left;
      capturedRight = right;
      return { left, right };
    },
  };

  await runner.run(suite);

  // Values are structurally equal but not same references (cloned)
  assertEquals(capturedLeft, { id: 'a' });
  assertEquals(capturedRight, { id: 'b' });
  assertEquals(capturedLeft === producedLeft, false);
  assertEquals(capturedRight === producedRight, false);
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

// ---------------------------------------------------------------------------
// Execution timing — durationMs
// ---------------------------------------------------------------------------

Deno.test('run() returns durationMs >= 0 for passing examples', async () => {
  const registry = makeRegistry(meta('timed', 'timed'));
  const runner = new ExampleRunner(registry);

  const suite = {
    timed() {
      return 42;
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[0].status, 'passed');
  assertEquals(typeof results[0].durationMs, 'number');
  assertEquals(results[0].durationMs >= 0, true);
});

Deno.test('run() returns durationMs >= 0 for failing examples', async () => {
  const registry = makeRegistry(meta('fail', 'fail'));
  const runner = new ExampleRunner(registry);

  const suite = {
    fail() {
      throw new Error('boom');
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[0].status, 'failed');
  assertEquals(typeof results[0].durationMs, 'number');
  assertEquals(results[0].durationMs >= 0, true);
});

Deno.test('run() returns durationMs === 0 for skipped examples', async () => {
  const registry = makeRegistry(
    meta('bad', 'bad'),
    meta('skip', 'skip', ['bad']),
  );
  const runner = new ExampleRunner(registry);

  const suite = {
    bad() {
      throw new Error('broken');
    },
    skip() {
      return 'should not run';
    },
  };

  const results = await runner.run(suite);

  assertEquals(results[1].status, 'skipped');
  assertEquals(results[1].durationMs, 0);
});
