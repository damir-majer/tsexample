/**
 * Slice 3 integration test: Skip-on-failure propagation.
 *
 * Demonstrates that when a producer fails, all transitive consumers
 * are SKIPPED (not FAILED) — improving defect localization.
 *
 * Uses ExampleRunner directly (not registerSuite) so we can assert
 * on result statuses without Deno's test runner treating the
 * intentional failure as an actual test failure.
 */
import { Example, ExampleRunner, Given } from '../../src/mod.ts';
import {
  getGlobalRegistry,
  resetGlobalRegistry,
} from '../../src/runner/decorators.ts';
import { assertEquals } from 'jsr:@std/assert@^1.0.19';
import { ExampleRegistry } from '../../src/core/registry.ts';

class BrokenChainExample {
  @Example()
  setup(): { value: number } {
    return { value: 42 };
  }

  @Example()
  @Given('setup')
  failingStep(data: { value: number }): { value: number } {
    assertEquals(data.value, 42);
    throw new Error('Intentional failure in producer');
  }

  @Example()
  @Given('failingStep')
  downstream(_data: { value: number }): { value: number } {
    throw new Error('This should not run');
  }
}

Deno.test('skip-on-failure: setup passes, failingStep fails, downstream is skipped', async () => {
  resetGlobalRegistry();
  const suite = new BrokenChainExample();
  const sourceRegistry = getGlobalRegistry();

  // Snapshot registry for isolation
  const registry = new ExampleRegistry();
  for (const meta of sourceRegistry.all()) {
    registry.register(meta);
  }

  const runner = new ExampleRunner(registry);
  const results = await runner.run(suite);

  assertEquals(results.length, 3);

  // setup passes
  assertEquals(results[0].status, 'passed');
  assertEquals((results[0].value as { value: number }).value, 42);

  // failingStep fails
  assertEquals(results[1].status, 'failed');
  assertEquals(results[1].error?.message, 'Intentional failure in producer');

  // downstream is SKIPPED (not failed) — the core EDD value
  assertEquals(results[2].status, 'skipped');
  assertEquals(results[2].value, undefined);
});
