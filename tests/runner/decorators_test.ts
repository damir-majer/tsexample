/**
 * Tests for @Example and @Given decorators.
 *
 * All tests reset the global registry before running to ensure isolation.
 * Decorator-registration happens at class construction time (via addInitializer).
 */

import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.19';
import {
  Example,
  getGlobalRegistry,
  Given,
  resetGlobalRegistry,
} from '../../src/runner/decorators.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reset() {
  resetGlobalRegistry();
}

// ---------------------------------------------------------------------------
// @Example() — basic registration
// ---------------------------------------------------------------------------

Deno.test('@Example() registers method name when no custom name is given', () => {
  reset();

  class Suite {
    @Example()
    myMethod() {
      return 42;
    }
  }

  new Suite();

  const registry = getGlobalRegistry();
  const meta = registry.get('myMethod');
  assertEquals(meta?.name, 'myMethod');
  assertEquals(meta?.method, 'myMethod');
  assertEquals(meta?.given, []);
});

Deno.test('@Example("customName") uses the custom name as the example name', () => {
  reset();

  class Suite {
    @Example('theAnswer')
    myMethod() {
      return 42;
    }
  }

  new Suite();

  const registry = getGlobalRegistry();
  const meta = registry.get('theAnswer');
  assertEquals(meta?.name, 'theAnswer');
  assertEquals(meta?.method, 'myMethod');
});

Deno.test('@Example() stores method name separately from example name', () => {
  reset();

  class Suite {
    @Example('renamed')
    originalMethod() {
      return 1;
    }
  }

  new Suite();

  const meta = getGlobalRegistry().get('renamed');
  assertEquals(meta?.method, 'originalMethod');
});

// ---------------------------------------------------------------------------
// @Given() — dependency metadata
// ---------------------------------------------------------------------------

Deno.test('@Given("producerName") sets the given array on the metadata', () => {
  reset();

  class Suite {
    @Example()
    @Given('empty')
    consumer(_m: unknown) {
      return _m;
    }
  }

  new Suite();

  const meta = getGlobalRegistry().get('consumer');
  assertEquals(meta?.given, ['empty']);
});

Deno.test('@Given("a", "b") supports multiple dependencies', () => {
  reset();

  class Suite {
    @Example()
    @Given('a', 'b')
    consumer(_x: unknown, _y: unknown) {
      return null;
    }
  }

  new Suite();

  const meta = getGlobalRegistry().get('consumer');
  assertEquals(meta?.given, ['a', 'b']);
});

// ---------------------------------------------------------------------------
// @Example + @Given combined — verify both fields populated
// ---------------------------------------------------------------------------

Deno.test('method with @Example() and @Given() has both name and given populated', () => {
  reset();

  class Suite {
    @Example()
    producer() {
      return { amount: 0, currency: 'CHF' };
    }

    @Example('addTenDollars')
    @Given('producer')
    consumer(_m: unknown) {
      return _m;
    }
  }

  new Suite();

  const registry = getGlobalRegistry();

  const producerMeta = registry.get('producer');
  assertEquals(producerMeta?.name, 'producer');
  assertEquals(producerMeta?.given, []);

  const consumerMeta = registry.get('addTenDollars');
  assertEquals(consumerMeta?.name, 'addTenDollars');
  assertEquals(consumerMeta?.method, 'consumer');
  assertEquals(consumerMeta?.given, ['producer']);
});

// ---------------------------------------------------------------------------
// Multiple methods in one class
// ---------------------------------------------------------------------------

Deno.test('multiple @Example() methods in one class all register independently', () => {
  reset();

  class Suite {
    @Example()
    first() {
      return 1;
    }

    @Example()
    second() {
      return 2;
    }

    @Example()
    third() {
      return 3;
    }
  }

  new Suite();

  const registry = getGlobalRegistry();
  assertEquals(registry.size, 3);
  assertEquals(registry.get('first')?.name, 'first');
  assertEquals(registry.get('second')?.name, 'second');
  assertEquals(registry.get('third')?.name, 'third');
});

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

Deno.test('getGlobalRegistry() returns the same singleton on repeated calls', () => {
  reset();

  class Suite {
    @Example()
    probe() {
      return true;
    }
  }

  new Suite();

  const r1 = getGlobalRegistry();
  const r2 = getGlobalRegistry();
  // Same object reference
  assertEquals(r1 === r2, true);
  assertEquals(r1.size, 1);
});

Deno.test('resetGlobalRegistry() clears all registered examples', () => {
  class Suite {
    @Example()
    sample() {
      return 99;
    }
  }

  new Suite();

  // Registry should have at least one entry before reset
  const before = getGlobalRegistry().size;
  assertEquals(before >= 1, true);

  resetGlobalRegistry();
  assertEquals(getGlobalRegistry().size, 0);
});

Deno.test('resetGlobalRegistry() returns a fresh registry (not same reference)', () => {
  reset();

  class Suite {
    @Example()
    x() {
      return 0;
    }
  }

  new Suite();

  const before = getGlobalRegistry();
  resetGlobalRegistry();
  const after = getGlobalRegistry();

  // After reset the registry reference must differ from the previous one
  assertEquals(before === after, false);
});

// ---------------------------------------------------------------------------
// Registration side-effects on construction
// ---------------------------------------------------------------------------

Deno.test('constructing two instances of the same class registers examples twice (throws)', () => {
  reset();

  class Suite {
    @Example()
    item() {
      return 0;
    }
  }

  new Suite();

  // Second construction must throw because the name is already registered
  assertThrows(
    () => new Suite(),
    Error,
    'already registered',
  );
});
