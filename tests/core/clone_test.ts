import {
  assert,
  assertEquals,
  assertNotStrictEquals,
} from 'jsr:@std/assert@^1.0.19';
import { cloneFixture, isClassInstance } from '../../src/core/clone.ts';

// ── cloneFixture ──────────────────────────────────────────────────────────────

Deno.test('cloneFixture: clones a plain object — mutation of clone does not affect original', () => {
  const original = { a: 1, b: 'hello' };
  const clone = cloneFixture(original) as typeof original;

  assertNotStrictEquals(clone, original);

  clone.a = 99;
  assertEquals(original.a, 1);
});

Deno.test('cloneFixture: clones nested objects — deep clone, not shallow', () => {
  const original = { outer: { inner: { value: 42 } } };
  const clone = cloneFixture(original) as typeof original;

  assertNotStrictEquals(clone, original);
  assertNotStrictEquals(clone.outer, original.outer);
  assertNotStrictEquals(clone.outer.inner, original.outer.inner);

  clone.outer.inner.value = 999;
  assertEquals(original.outer.inner.value, 42);
});

Deno.test('cloneFixture: clones arrays', () => {
  const original = [1, 2, { x: 3 }];
  const clone = cloneFixture(original) as typeof original;

  assertNotStrictEquals(clone, original);
  assertNotStrictEquals(clone[2], original[2]);

  (clone[2] as { x: number }).x = 99;
  assertEquals((original[2] as { x: number }).x, 3);
});

Deno.test('cloneFixture: clones primitives — returned as-is', () => {
  assertEquals(cloneFixture(42), 42);
  assertEquals(cloneFixture('hello'), 'hello');
  assertEquals(cloneFixture(true), true);
});

Deno.test('cloneFixture: clones null and undefined — returned as-is', () => {
  assertEquals(cloneFixture(null), null);
  assertEquals(cloneFixture(undefined), undefined);
});

Deno.test('cloneFixture: class instance — data preserved but prototype is lost (structuredClone limitation)', () => {
  class Point {
    constructor(public x: number, public y: number) {}
    sum(): number {
      return this.x + this.y;
    }
  }

  const original = new Point(3, 4);
  const clone = cloneFixture(original) as { x: number; y: number };

  // Data is preserved
  assertEquals(clone.x, 3);
  assertEquals(clone.y, 4);

  // Prototype is lost — clone is NOT an instance of Point
  assert(!(clone instanceof Point));
});

Deno.test('cloneFixture: custom CloneStrategy function is called instead of structuredClone', () => {
  let strategyCalled = false;
  const customStrategy = (value: unknown): unknown => {
    strategyCalled = true;
    return { ...value as object, cloned: true };
  };

  const original = { a: 1 };
  const clone = cloneFixture(original, customStrategy) as {
    a: number;
    cloned: boolean;
  };

  assert(strategyCalled);
  assertEquals(clone.a, 1);
  assertEquals(clone.cloned, true);
  // Original is untouched
  assert(!('cloned' in original));
});

// ── isClassInstance ───────────────────────────────────────────────────────────

Deno.test('isClassInstance: plain object {} returns false', () => {
  assertEquals(isClassInstance({}), false);
});

Deno.test('isClassInstance: Object.create(null) returns false', () => {
  assertEquals(isClassInstance(Object.create(null)), false);
});

Deno.test('isClassInstance: instance of a class returns true', () => {
  class Foo {}
  assertEquals(isClassInstance(new Foo()), true);
});

Deno.test('isClassInstance: array returns false', () => {
  assertEquals(isClassInstance([1, 2, 3]), false);
});

Deno.test('isClassInstance: null returns false', () => {
  assertEquals(isClassInstance(null), false);
});

Deno.test('isClassInstance: primitives return false', () => {
  assertEquals(isClassInstance(42), false);
  assertEquals(isClassInstance('hello'), false);
  assertEquals(isClassInstance(true), false);
});
