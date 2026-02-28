/**
 * Integration test: Multi-producer arguments (@Given with N producers → N args).
 *
 * Demonstrates a diamond dependency pattern:
 *   base → left  ↘
 *                  merge → final
 *   base → right ↗
 *
 * Each consumer receives independently cloned fixtures from its producers.
 */

import { assertEquals, assertNotStrictEquals } from 'jsr:@std/assert@^1.0.19';
import { Example, Given, registerSuite } from '../../src/mod.ts';

interface Vec2 {
  x: number;
  y: number;
}

class VectorExample {
  @Example()
  origin(): Vec2 {
    const v: Vec2 = { x: 0, y: 0 };
    assertEquals(v.x, 0);
    assertEquals(v.y, 0);
    return v;
  }

  @Example()
  @Given('origin')
  moveRight(v: Vec2): Vec2 {
    const result: Vec2 = { x: v.x + 10, y: v.y };
    assertEquals(result.x, 10);
    return result;
  }

  @Example()
  @Given('origin')
  moveUp(v: Vec2): Vec2 {
    const result: Vec2 = { x: v.x, y: v.y + 5 };
    assertEquals(result.y, 5);
    return result;
  }

  @Example()
  @Given('moveRight', 'moveUp')
  addVectors(right: Vec2, up: Vec2): Vec2 {
    const result: Vec2 = { x: right.x + up.x, y: right.y + up.y };
    assertEquals(result.x, 10);
    assertEquals(result.y, 5);
    // Verify we received clones, not the same references
    assertNotStrictEquals(right, up);
    return result;
  }
}

registerSuite(VectorExample);
