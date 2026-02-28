/**
 * Tests for deno-adapter (registerSuite pathway) — producer validation +
 * pure helper unit tests.
 *
 * registerSuite() delegates to ExampleRunner.run(), so the producer validation
 * implemented in runner.ts also applies to the adapter. These tests exercise
 * the decorator → registry → runner pipeline to confirm invalid @Given
 * references are caught with a descriptive error.
 *
 * Pattern: same as broken_chain_test.ts — use decorators to populate the
 * global registry, snapshot into a local registry, then run via ExampleRunner
 * directly (avoids Deno.test-within-Deno.test issues with registerSuite).
 *
 * Pure helper tests: formatStepName() and resolveStepError() are tested
 * directly as ordinary synchronous functions — no Deno.test mocking needed.
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@^1.0.19';
import { Example, ExampleRunner, Given } from '../../src/mod.ts';
import {
  formatStepName,
  resolveStepError,
} from '../../src/runner/deno-adapter.ts';
import {
  getGlobalRegistry,
  resetGlobalRegistry,
} from '../../src/runner/decorators.ts';
import { ExampleRegistry } from '../../src/core/registry.ts';

// ---------------------------------------------------------------------------
// Suite with an invalid @Given reference
// ---------------------------------------------------------------------------

function buildRegistryFromClass(SuiteClass: new () => object): {
  suite: object;
  registry: ExampleRegistry;
} {
  resetGlobalRegistry();
  const suite = new SuiteClass();
  const sourceRegistry = getGlobalRegistry();

  const registry = new ExampleRegistry();
  for (const meta of sourceRegistry.all()) {
    registry.register(meta);
  }

  return { suite, registry };
}

// ---------------------------------------------------------------------------
// Test: missing producer via decorator pipeline
// ---------------------------------------------------------------------------

Deno.test('adapter path: @Given referencing a non-existent producer throws descriptive error', async () => {
  class InvalidGivenSuite {
    @Example()
    @Given('phantomProducer')
    consumer(_data: unknown): string {
      return 'should not run';
    }
  }

  const { suite, registry } = buildRegistryFromClass(InvalidGivenSuite);
  const runner = new ExampleRunner(registry);

  await assertRejects(
    () => runner.run(suite),
    Error,
    'TSExample: Example "consumer" depends on "phantomProducer" which is not registered.',
  );
});

// ---------------------------------------------------------------------------
// Test: mixed valid and invalid — still throws
// ---------------------------------------------------------------------------

Deno.test('adapter path: mixed valid and invalid @Given references still throw', async () => {
  class MixedSuite {
    @Example()
    root(): number {
      return 1;
    }

    @Example()
    @Given('root')
    validChild(_v: number): number {
      return 2;
    }

    @Example()
    @Given('ghost')
    brokenChild(_v: unknown): number {
      return 3;
    }
  }

  const { suite, registry } = buildRegistryFromClass(MixedSuite);
  const runner = new ExampleRunner(registry);

  await assertRejects(
    () => runner.run(suite),
    Error,
    'TSExample: Example "brokenChild" depends on "ghost" which is not registered.',
  );
});

// ---------------------------------------------------------------------------
// Unit tests: formatStepName()
// ---------------------------------------------------------------------------

Deno.test('formatStepName: returns plain name when not skipped', () => {
  assertEquals(formatStepName('myExample', false), 'myExample');
});

Deno.test('formatStepName: prepends [SKIPPED] when skipped', () => {
  assertEquals(formatStepName('myExample', true), '[SKIPPED] myExample');
});

Deno.test('formatStepName: works with names containing spaces', () => {
  assertEquals(formatStepName('my example name', false), 'my example name');
  assertEquals(
    formatStepName('my example name', true),
    '[SKIPPED] my example name',
  );
});

Deno.test('formatStepName: works with empty name', () => {
  assertEquals(formatStepName('', false), '');
  assertEquals(formatStepName('', true), '[SKIPPED] ');
});

// ---------------------------------------------------------------------------
// Unit tests: resolveStepError()
// ---------------------------------------------------------------------------

Deno.test('resolveStepError: returns null for passed result', () => {
  assertEquals(resolveStepError({ value: 42, status: 'passed' }, 'ex'), null);
});

Deno.test('resolveStepError: returns null for skipped result', () => {
  assertEquals(
    resolveStepError({ value: undefined, status: 'skipped' }, 'ex'),
    null,
  );
});

Deno.test('resolveStepError: returns the captured error for failed result with error', () => {
  const err = new Error('boom');
  const result = resolveStepError(
    { value: undefined, status: 'failed', error: err },
    'ex',
  );
  assertEquals(result, err);
});

Deno.test('resolveStepError: generates a fallback error when failed result has no error', () => {
  const result = resolveStepError(
    { value: undefined, status: 'failed' },
    'myEx',
  );
  assertEquals(result instanceof Error, true);
  assertEquals((result as Error).message, 'Example "myEx" failed');
});

Deno.test('resolveStepError: fallback error message includes the example name', () => {
  const result = resolveStepError(
    { value: undefined, status: 'failed' },
    'computeTotal',
  );
  assertEquals((result as Error).message, 'Example "computeTotal" failed');
});
