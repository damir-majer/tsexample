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
  renderMarkdown,
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
  assertEquals(report.summary.total, 3);
  assertEquals(report.summary.passed, 3);
  assertEquals(report.summary.failed, 0);
  assertEquals(report.summary.skipped, 0);
  assertEquals(report.summary.durationMs >= 0, true);

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

  assertEquals(report.summary.total, 2);
  assertEquals(report.summary.passed, 0);
  assertEquals(report.summary.failed, 1);
  assertEquals(report.summary.skipped, 1);
  assertEquals(report.summary.durationMs >= 0, true);

  const breakerEntry = report.examples.find((e) => e.name === 'breaker')!;
  assertEquals(breakerEntry.status, 'failed');
  assertEquals(breakerEntry.error, 'intentional failure');
  assertEquals(breakerEntry.description, 'This will fail');

  const downstreamEntry = report.examples.find((e) => e.name === 'downstream')!;
  assertEquals(downstreamEntry.status, 'skipped');
  assertEquals(downstreamEntry.description, 'This should be skipped');
});

Deno.test('integration: tags + timing + markdown report pipeline', async () => {
  resetGlobalRegistry();

  class TaggedSuite {
    @Example({ description: 'Empty wallet', tags: ['setup'] })
    empty(): { amount: number; currency: string } {
      const money = { amount: 0, currency: 'CHF' };
      assertEquals(money.amount, 0);
      return money;
    }

    @Example({ tags: ['mutation'] })
    @Given('empty')
    addDollars(money: { amount: number; currency: string }): {
      amount: number;
      currency: string;
    } {
      const result = { amount: money.amount + 10, currency: 'USD' };
      assertEquals(result.amount, 10);
      return result;
    }

    @Example({ description: 'Convert to EUR', tags: ['mutation', 'fx'] })
    @Given('addDollars')
    convert(money: { amount: number; currency: string }): {
      amount: number;
      currency: string;
    } {
      const result = {
        amount: Math.round(money.amount * 0.92),
        currency: 'EUR',
      };
      assertEquals(result.currency, 'EUR');
      return result;
    }
  }

  const suite = new TaggedSuite();

  const registry = getGlobalRegistry();
  const runner = new ExampleRunner(registry);
  const results = await runner.run(suite);

  // All pass
  assertEquals(results.length, 3);
  for (const r of results) {
    assertEquals(r.status, 'passed');
    assertEquals(typeof r.durationMs, 'number');
    assertEquals(r.durationMs >= 0, true);
  }

  // Build report
  const report = buildReport('TaggedSuite', registry.all(), results);

  // Tags present in report
  assertEquals(report.examples[0].tags, ['setup']);
  assertEquals(report.examples[1].tags, ['mutation']);
  assertEquals(report.examples[2].tags, ['mutation', 'fx']);

  // Duration present
  assertEquals(report.summary.durationMs >= 0, true);

  // Descriptions present
  assertEquals(report.examples[0].description, 'Empty wallet');
  assertEquals(report.examples[2].description, 'Convert to EUR');

  // Markdown renders without error and includes key content
  const md = renderMarkdown(report);
  assertEquals(md.includes('# TaggedSuite'), true);
  assertEquals(md.includes('3 examples: 3 passed'), true);
  assertEquals(md.includes('| Tags |'), true);
  assertEquals(md.includes('| Description |'), true);
  assertEquals(md.includes('`setup`'), true);
  assertEquals(md.includes('`fx`'), true);
  assertEquals(md.includes('Empty wallet'), true);
  assertEquals(md.includes('```mermaid'), true);
});
