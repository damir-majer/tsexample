import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.19';
import type { ExampleMetadata, ExampleResult } from '../../src/core/types.ts';
import { ExampleRegistry } from '../../src/core/registry.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(): ExampleRegistry {
  return new ExampleRegistry();
}

function makeMeta(
  name: string,
  method?: string,
  given?: string[],
): ExampleMetadata {
  return { name, method: method ?? name, given: given ?? [] };
}

function makeResult(
  value: unknown,
  status: 'passed' | 'failed' | 'skipped' = 'passed',
): ExampleResult {
  return { value, status, durationMs: 0 };
}

// ---------------------------------------------------------------------------
// register()
// ---------------------------------------------------------------------------

Deno.test('register() adds metadata to the registry', () => {
  const reg = makeRegistry();
  const meta = makeMeta('creates_user');
  reg.register(meta);
  assertEquals(reg.get('creates_user'), meta);
});

Deno.test('register() adds multiple distinct entries', () => {
  const reg = makeRegistry();
  const a = makeMeta('example_a');
  const b = makeMeta('example_b');
  reg.register(a);
  reg.register(b);
  assertEquals(reg.size, 2);
  assertEquals(reg.get('example_a'), a);
  assertEquals(reg.get('example_b'), b);
});

Deno.test('register() throws on duplicate name', () => {
  const reg = makeRegistry();
  reg.register(makeMeta('duplicate'));
  assertThrows(
    () => reg.register(makeMeta('duplicate')),
    Error,
    'duplicate',
  );
});

// ---------------------------------------------------------------------------
// get()
// ---------------------------------------------------------------------------

Deno.test('get() returns metadata for a known name', () => {
  const reg = makeRegistry();
  const meta = makeMeta('finds_me', 'finds_me', ['dep_a']);
  reg.register(meta);
  assertEquals(reg.get('finds_me'), meta);
});

Deno.test('get() returns undefined for an unknown name', () => {
  const reg = makeRegistry();
  assertEquals(reg.get('no_such_example'), undefined);
});

// ---------------------------------------------------------------------------
// all()
// ---------------------------------------------------------------------------

Deno.test('all() returns empty array when registry is empty', () => {
  const reg = makeRegistry();
  assertEquals(reg.all(), []);
});

Deno.test('all() returns all registered examples', () => {
  const reg = makeRegistry();
  const a = makeMeta('a');
  const b = makeMeta('b');
  const c = makeMeta('c');
  reg.register(a);
  reg.register(b);
  reg.register(c);
  const result = reg.all();
  assertEquals(result.length, 3);
  assertEquals(result.includes(a), true);
  assertEquals(result.includes(b), true);
  assertEquals(result.includes(c), true);
});

// ---------------------------------------------------------------------------
// setCachedResult() / getCachedResult()
// ---------------------------------------------------------------------------

Deno.test('setCachedResult() stores a result for an example name', () => {
  const reg = makeRegistry();
  const result = makeResult({ id: 42 });
  reg.setCachedResult('some_example', result);
  assertEquals(reg.getCachedResult('some_example'), result);
});

Deno.test('getCachedResult() returns undefined for an uncached name', () => {
  const reg = makeRegistry();
  assertEquals(reg.getCachedResult('not_cached'), undefined);
});

Deno.test('setCachedResult() overwrites an existing cached result', () => {
  const reg = makeRegistry();
  const first = makeResult('first value');
  const second = makeResult('second value');
  reg.setCachedResult('example', first);
  reg.setCachedResult('example', second);
  assertEquals(reg.getCachedResult('example'), second);
});

Deno.test('setCachedResult() does not require prior register()', () => {
  const reg = makeRegistry();
  const result = makeResult(null, 'skipped');
  reg.setCachedResult('unregistered_but_cached', result);
  assertEquals(reg.getCachedResult('unregistered_but_cached'), result);
});

// ---------------------------------------------------------------------------
// clear()
// ---------------------------------------------------------------------------

Deno.test('clear() resets metadata map', () => {
  const reg = makeRegistry();
  reg.register(makeMeta('will_be_cleared'));
  reg.clear();
  assertEquals(reg.get('will_be_cleared'), undefined);
  assertEquals(reg.size, 0);
});

Deno.test('clear() resets cached results map', () => {
  const reg = makeRegistry();
  reg.setCachedResult('cached', makeResult(99));
  reg.clear();
  assertEquals(reg.getCachedResult('cached'), undefined);
});

Deno.test('clear() allows re-registering a previously registered name', () => {
  const reg = makeRegistry();
  reg.register(makeMeta('name'));
  reg.clear();
  // Should not throw after clear.
  reg.register(makeMeta('name'));
  assertEquals(reg.size, 1);
});

// ---------------------------------------------------------------------------
// size property
// ---------------------------------------------------------------------------

Deno.test('size returns 0 for a new registry', () => {
  const reg = makeRegistry();
  assertEquals(reg.size, 0);
});

Deno.test('size increments with each register() call', () => {
  const reg = makeRegistry();
  assertEquals(reg.size, 0);
  reg.register(makeMeta('one'));
  assertEquals(reg.size, 1);
  reg.register(makeMeta('two'));
  assertEquals(reg.size, 2);
});

Deno.test('size is unaffected by setCachedResult()', () => {
  const reg = makeRegistry();
  reg.register(makeMeta('tracked'));
  reg.setCachedResult('tracked', makeResult('x'));
  assertEquals(reg.size, 1);
});
