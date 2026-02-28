/**
 * Vitest adapter integration tests.
 *
 * Validates that TSExample decorators + Vitest adapter work with
 * esbuild's Stage 3 decorator support (Vitest uses esbuild under the hood).
 *
 * Suites:
 * 1. MoneySuite — basic producer-consumer chain (3 examples)
 * 2. DiamondSuite — diamond dependency pattern (4 examples)
 * 3. IsolationSuite — fixture cloning prevents mutation leaks (3 examples)
 * 4. BrokenChainSuite — skip-on-failure propagation (3 examples)
 */

import { expect } from 'vitest';
import {
  Example,
  ExampleRegistry,
  ExampleRunner,
  getGlobalRegistry,
  Given,
  registerSuite,
  resetGlobalRegistry,
} from '../../src/mod.vitest.ts';

// ---------------------------------------------------------------------------
// Suite 1: Basic producer-consumer chain
// ---------------------------------------------------------------------------

class MoneySuite {
  @Example()
  root() {
    return { amount: 0 };
  }

  @Example()
  @Given('root')
  addTen(money: { amount: number }) {
    return { amount: money.amount + 10 };
  }

  @Example()
  @Given('addTen')
  addTwenty(money: { amount: number }) {
    return { amount: money.amount + 10 };
  }
}

registerSuite(MoneySuite);

// ---------------------------------------------------------------------------
// Suite 2: Diamond dependency (two consumers share one producer)
// ---------------------------------------------------------------------------

class DiamondSuite {
  @Example()
  shared() {
    return { value: 42 };
  }

  @Example()
  @Given('shared')
  branchA(data: { value: number }) {
    return { value: data.value * 2 };
  }

  @Example()
  @Given('shared')
  branchB(data: { value: number }) {
    return { value: data.value + 1 };
  }

  @Example()
  @Given('branchA', 'branchB')
  merge(a: { value: number }, b: { value: number }) {
    return { total: a.value + b.value };
  }
}

registerSuite(DiamondSuite);

// ---------------------------------------------------------------------------
// Suite 3: Fixture isolation (mutation should not leak)
// ---------------------------------------------------------------------------

class IsolationSuite {
  @Example()
  mutableRoot() {
    return { items: [1, 2, 3] };
  }

  @Example()
  @Given('mutableRoot')
  mutateA(data: { items: number[] }) {
    data.items.push(99);
    return { items: data.items };
  }

  @Example()
  @Given('mutableRoot')
  mutateB(data: { items: number[] }) {
    // Should receive [1, 2, 3] not [1, 2, 3, 99] — cloning isolates fixtures
    expect(data.items.length).toBe(3);
    return { length: data.items.length };
  }
}

registerSuite(IsolationSuite);

// ---------------------------------------------------------------------------
// Suite 4: Broken chain — skip-on-failure propagation
//
// Uses ExampleRunner directly so we can assert on result statuses
// without Vitest treating the intentional failure as an actual test failure.
// ---------------------------------------------------------------------------

import { beforeAll, describe, test } from 'vitest';

class BrokenChainSuite {
  @Example()
  setup(): { value: number } {
    return { value: 42 };
  }

  @Example()
  @Given('setup')
  failingStep(_data: { value: number }): { value: number } {
    throw new Error('Intentional failure in producer');
  }

  @Example()
  @Given('failingStep')
  downstream(_data: { value: number }): { value: number } {
    throw new Error('This should not run');
  }
}

describe('BrokenChainSuite', () => {
  const results: { value: unknown; status: string; error?: Error }[] = [];

  beforeAll(async () => {
    resetGlobalRegistry();
    const suite = new BrokenChainSuite();

    const suiteRegistry = new ExampleRegistry();
    for (const meta of getGlobalRegistry().all()) {
      suiteRegistry.register(meta);
    }

    const runner = new ExampleRunner(suiteRegistry);
    const r = await runner.run(suite);
    results.push(...r);
  });

  test('setup passes', () => {
    expect(results[0].status).toBe('passed');
    expect((results[0].value as { value: number }).value).toBe(42);
  });

  test('failingStep fails with correct error', () => {
    expect(results[1].status).toBe('failed');
    expect(results[1].error?.message).toBe(
      'Intentional failure in producer',
    );
  });

  test('downstream is skipped (not failed)', () => {
    expect(results[2].status).toBe('skipped');
    expect(results[2].value).toBeUndefined();
  });
});
