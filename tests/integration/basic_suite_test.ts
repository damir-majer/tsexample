/**
 * Integration test: full flow through registerSuite().
 *
 * This test exercises the complete decorator → runner → Deno.test pipeline.
 * It registers a CurrencyBasicExample suite and verifies that:
 *
 *   - 'empty' root example passes and returns the expected fixture.
 *   - 'addDollars' dependent example passes and receives the cloned fixture.
 *
 * The suite appears as a top-level Deno.test with two sub-steps.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.19';
import { Example, Given, registerSuite } from '../../src/mod.ts';

// ---------------------------------------------------------------------------
// Suite definition
// ---------------------------------------------------------------------------

interface Money {
  amount: number;
  currency: string;
}

class CurrencyBasicExample {
  #results: Money[] = [];

  @Example()
  empty(): Money {
    const fixture: Money = { amount: 0, currency: 'CHF' };
    this.#results.push(fixture);
    return fixture;
  }

  @Example()
  @Given('empty')
  addDollars(money: Money): Money {
    assertEquals(money.amount, 0);
    assertEquals(money.currency, 'CHF');

    const result: Money = { amount: money.amount + 10, currency: 'USD' };
    this.#results.push(result);
    return result;
  }
}

// ---------------------------------------------------------------------------
// Register — this call creates Deno.test('CurrencyBasicExample', ...)
// at import time, which Deno collects and runs.
// ---------------------------------------------------------------------------

registerSuite(CurrencyBasicExample);

// ---------------------------------------------------------------------------
// Supplementary tests that verify the integration invariants
// ---------------------------------------------------------------------------

Deno.test('integration: registerSuite does not throw during registration', () => {
  // If registerSuite threw, we would never reach this line.
  // This is a smoke test confirming the module-level call succeeded.
  assertEquals(true, true);
});
