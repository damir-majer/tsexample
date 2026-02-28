/**
 * Slice 2 integration test: Full EDD dependency chain with fixture injection.
 *
 * Demonstrates the core EDD pattern:
 * - empty() produces a base fixture
 * - addDollars() consumes empty's fixture, extends it, produces a new fixture
 * - convert() consumes addDollars' fixture
 *
 * Dependency chain: empty -> addDollars -> convert
 */
import { Example, Given, registerSuite } from '../../src/mod.ts';
import { assertEquals } from 'jsr:@std/assert@^1.0.19';

interface Money {
  amount: number;
  currency: string;
}

class MoneyExample {
  @Example()
  empty(): Money {
    const money: Money = { amount: 0, currency: 'CHF' };
    assertEquals(money.amount, 0);
    return money;
  }

  @Example()
  @Given('empty')
  addDollars(money: Money): Money {
    const result: Money = { amount: money.amount + 10, currency: 'USD' };
    assertEquals(result.amount, 10);
    return result;
  }

  @Example()
  @Given('addDollars')
  convert(money: Money): Money {
    const result: Money = {
      amount: Math.round(money.amount * 0.92),
      currency: 'EUR',
    };
    assertEquals(result.currency, 'EUR');
    return result;
  }
}

registerSuite(MoneyExample);
