/**
 * Slice 3 integration test: Cloneable protocol in an EDD dependency chain.
 *
 * Demonstrates that class instances implementing Cloneable are properly cloned
 * between producer and consumer — preserving prototype chains and methods.
 *
 * Dependency chain: createWallet -> deposit -> convert
 *
 * Without Cloneable, structuredClone would strip the prototype, and the consumer
 * would receive a plain object where instanceof fails and methods are missing.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.19';
import { Example, Given, registerSuite } from '../../src/mod.ts';
import type { Cloneable } from '../../src/mod.ts';

// ── Domain class implementing Cloneable ─────────────────────────────────────

class Money implements Cloneable<Money> {
  constructor(public amount: number, public currency: string) {}

  add(amount: number, currency: string): Money {
    return new Money(this.amount + amount, currency);
  }

  clone(): Money {
    return new Money(this.amount, this.currency);
  }
}

// ── Suite using Money as a fixture ──────────────────────────────────────────

class MoneyCloneableExample {
  @Example()
  createWallet(): Money {
    const wallet = new Money(0, 'CHF');
    assertEquals(wallet.amount, 0);
    assert(wallet instanceof Money, 'producer should create a Money instance');
    return wallet;
  }

  @Example()
  @Given('createWallet')
  deposit(wallet: Money): Money {
    // The consumer receives a Money instance — not a plain object.
    assert(wallet instanceof Money, 'consumer should receive a Money instance');
    assertEquals(
      typeof wallet.add,
      'function',
      'prototype methods should be available',
    );

    const result = wallet.add(50, 'CHF');
    assertEquals(result.amount, 50);
    assert(result instanceof Money, 'add() should return a Money instance');
    return result;
  }

  @Example()
  @Given('deposit')
  convert(wallet: Money): Money {
    assert(
      wallet instanceof Money,
      'second consumer should also receive a Money instance',
    );
    assertEquals(wallet.amount, 50);

    // Use prototype method to create a converted wallet.
    const converted = wallet.add(
      Math.round(wallet.amount * 0.92) - wallet.amount,
      'EUR',
    );
    assertEquals(converted.currency, 'EUR');
    assert(converted instanceof Money, 'converted should be a Money instance');
    return converted;
  }
}

// Register — this call creates Deno.test('MoneyCloneableExample', ...) at import time.
registerSuite(MoneyCloneableExample);
