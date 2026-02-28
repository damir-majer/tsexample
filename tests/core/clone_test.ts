import {
  assert,
  assertEquals,
  assertNotStrictEquals,
} from 'jsr:@std/assert@^1.0.19';
import {
  cloneFixture,
  isClassInstance,
  isCloneable,
} from '../../src/core/clone.ts';
import type { Cloneable } from '../../src/core/types.ts';

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

// ── isCloneable ─────────────────────────────────────────────────────────────

Deno.test('isCloneable: returns true for object with clone() method', () => {
  class Point implements Cloneable<Point> {
    constructor(public x: number, public y: number) {}
    clone(): Point {
      return new Point(this.x, this.y);
    }
  }

  assertEquals(isCloneable(new Point(1, 2)), true);
});

Deno.test('isCloneable: returns false for plain object without clone()', () => {
  assertEquals(isCloneable({ a: 1, b: 2 }), false);
});

Deno.test('isCloneable: returns false for null/undefined/primitives', () => {
  assertEquals(isCloneable(null), false);
  assertEquals(isCloneable(undefined), false);
  assertEquals(isCloneable(42), false);
  assertEquals(isCloneable('hello'), false);
  assertEquals(isCloneable(true), false);
});

// ── cloneFixture + Cloneable ────────────────────────────────────────────────

Deno.test('cloneFixture: uses clone() method when value implements Cloneable', () => {
  let cloneCalled = false;

  class Tag implements Cloneable<Tag> {
    constructor(public label: string) {}
    clone(): Tag {
      cloneCalled = true;
      return new Tag(this.label);
    }
  }

  const original = new Tag('important');
  const clone = cloneFixture(original) as Tag;

  assert(cloneCalled, 'clone() method should have been called');
  assertEquals(clone.label, 'important');
  assertNotStrictEquals(clone, original);
});

Deno.test('cloneFixture: clone() preserves instanceof (prototype chain intact)', () => {
  class Point implements Cloneable<Point> {
    constructor(public x: number, public y: number) {}
    sum(): number {
      return this.x + this.y;
    }
    clone(): Point {
      return new Point(this.x, this.y);
    }
  }

  const original = new Point(3, 4);
  const clone = cloneFixture(original) as Point;

  // Prototype chain is preserved — clone IS an instance of Point
  assert(clone instanceof Point, 'clone should be instanceof Point');
  assertEquals(clone.sum(), 7, 'prototype methods should work on the clone');
  assertEquals(clone.x, 3);
  assertEquals(clone.y, 4);
  assertNotStrictEquals(clone, original);
});

Deno.test('cloneFixture: clone() is NOT called when custom CloneStrategy function is provided', () => {
  let cloneCalled = false;
  let strategyCalled = false;

  class Tag implements Cloneable<Tag> {
    constructor(public label: string) {}
    clone(): Tag {
      cloneCalled = true;
      return new Tag(this.label);
    }
  }

  const customStrategy = (value: unknown): unknown => {
    strategyCalled = true;
    return { ...(value as object), custom: true };
  };

  const original = new Tag('priority');
  cloneFixture(original, customStrategy);

  assert(strategyCalled, 'custom strategy should have been called');
  assert(
    !cloneCalled,
    'clone() should NOT have been called when a custom strategy is provided',
  );
});

Deno.test('cloneFixture: falls back to structuredClone when no clone() method exists', () => {
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

  // Prototype is lost — structuredClone behavior (no Cloneable, no custom strategy)
  assert(
    !(clone instanceof Point),
    'without Cloneable, structuredClone loses the prototype',
  );
});
