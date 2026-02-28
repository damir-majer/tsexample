/**
 * Integration test: @Example() descriptions + buildReport().
 *
 * Verifies the full pipeline: decorated class with descriptions ->
 * registerSuite-style execution -> buildReport() produces correct output.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.19';
import {
  buildReport,
  Example,
  ExampleRegistry,
  ExampleRunner,
  getGlobalRegistry,
  Given,
  resetGlobalRegistry,
} from '../../src/mod.ts';
import { topoSort } from '../../src/core/graph.ts';

Deno.test('descriptions flow through decorator -> registry -> report', async () => {
  resetGlobalRegistry();

  class WalletExample {
    @Example({ description: 'Empty wallet with zero balance' })
    empty() {
      return { amount: 0, currency: 'CHF' };
    }

    @Example({ name: 'deposit', description: 'Deposit 50 CHF' })
    @Given('empty')
    depositMoney(wallet: { amount: number; currency: string }) {
      return { amount: wallet.amount + 50, currency: wallet.currency };
    }

    @Example()
    @Given('deposit')
    withdraw(wallet: { amount: number; currency: string }) {
      return { amount: wallet.amount - 20, currency: wallet.currency };
    }
  }

  const suite = new WalletExample();

  // Snapshot registry
  const registry = new ExampleRegistry();
  for (const meta of getGlobalRegistry().all()) {
    registry.register(meta);
  }

  const runner = new ExampleRunner(registry);
  const allMeta = registry.all();
  const order = topoSort(allMeta);

  // Run examples
  const results = await runner.run(suite);

  // Build report using topological-order metadata
  const orderedMeta = order.map((name) => registry.get(name)!);
  const report = buildReport('WalletExample', orderedMeta, results);

  // Verify structure
  assertEquals(report.suite, 'WalletExample');
  assertEquals(report.summary, { total: 3, passed: 3, failed: 0, skipped: 0 });

  // Verify descriptions
  const emptyEntry = report.examples.find((e) => e.name === 'empty')!;
  assertEquals(emptyEntry.description, 'Empty wallet with zero balance');

  const depositEntry = report.examples.find((e) => e.name === 'deposit')!;
  assertEquals(depositEntry.description, 'Deposit 50 CHF');

  const withdrawEntry = report.examples.find((e) => e.name === 'withdraw')!;
  assertEquals(withdrawEntry.description, undefined);

  // Verify graph
  assertEquals(report.graph.includes('empty --> deposit'), true);
  assertEquals(report.graph.includes('deposit --> withdraw'), true);
});

Deno.test('report captures failure and skip cascade with descriptions', async () => {
  resetGlobalRegistry();

  class FailChain {
    @Example({ description: 'This will fail' })
    breaker(): number {
      throw new Error('intentional failure');
    }

    @Example({ description: 'This should be skipped' })
    @Given('breaker')
    downstream(_v: number) {
      return 2;
    }
  }

  const suite = new FailChain();

  const registry = new ExampleRegistry();
  for (const meta of getGlobalRegistry().all()) {
    registry.register(meta);
  }

  const runner = new ExampleRunner(registry);
  const order = topoSort(registry.all());
  const results = await runner.run(suite);
  const orderedMeta = order.map((name) => registry.get(name)!);
  const report = buildReport('FailChain', orderedMeta, results);

  assertEquals(report.summary, { total: 2, passed: 0, failed: 1, skipped: 1 });

  const breakerEntry = report.examples.find((e) => e.name === 'breaker')!;
  assertEquals(breakerEntry.status, 'failed');
  assertEquals(breakerEntry.error, 'intentional failure');
  assertEquals(breakerEntry.description, 'This will fail');

  const downstreamEntry = report.examples.find((e) => e.name === 'downstream')!;
  assertEquals(downstreamEntry.status, 'skipped');
  assertEquals(downstreamEntry.description, 'This should be skipped');
});
