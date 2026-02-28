/**
 * Stage 3 decorators for TSExample — @Example and @Given.
 *
 * Decorator evaluation order (TypeScript Stage 3):
 *   - Decorator expressions are evaluated top-to-bottom during class definition.
 *   - addInitializer callbacks fire at construction time, in registration order.
 *
 * Typical usage:
 *
 *   class MyExamples {
 *     @Example()
 *     root() { return { amount: 0 }; }
 *
 *     @Example()
 *     @Given('root')
 *     addTen(money: { amount: number }) { return { amount: money.amount + 10 }; }
 *   }
 *
 *   new MyExamples();   // ← triggers addInitializer, populates global registry
 *
 * Execution order of the decorators on `addTen`:
 *   1. @Example() decorator function runs — stores addInitializer for 'addTen'.
 *   2. @Given('root') decorator function runs — stores ['root'] in _pendingGiven.
 *   3. At construction: addInitializer fires, reads _pendingGiven['addTen'] = ['root'],
 *      clears it, and registers { name, method, given } in the global registry.
 */

import { ExampleRegistry } from '../core/registry.ts';
import type { ExampleMetadata, ExampleOptions } from '../core/types.ts';

// ---------------------------------------------------------------------------
// Global singleton registry
// ---------------------------------------------------------------------------

let _globalRegistry = new ExampleRegistry();

/** Return the module-level singleton registry. */
export function getGlobalRegistry(): ExampleRegistry {
  return _globalRegistry;
}

/** Replace the singleton with a fresh registry (call before each suite registration). */
export function resetGlobalRegistry(): void {
  _globalRegistry = new ExampleRegistry();
}

// ---------------------------------------------------------------------------
// Pending @Given metadata accumulated before @Example's addInitializer fires
// ---------------------------------------------------------------------------

// Key = method name (string), Value = producer names array
const _pendingGiven = new Map<string, string[]>();

// ---------------------------------------------------------------------------
// @Given decorator
// ---------------------------------------------------------------------------

/**
 * Declare one or more producer examples this method depends on.
 *
 * Must be applied on the same method as @Example().
 * Write @Example() above @Given() (standard convention).
 *
 * @param producers  Names of the producer examples (must match their registered names).
 */
export function Given(
  ...producers: string[]
  // deno-lint-ignore no-explicit-any
): (_value: (...args: any[]) => any, ctx: ClassMethodDecoratorContext) => void {
  // deno-lint-ignore no-explicit-any
  return function <T extends (...args: any[]) => any>(
    _value: T,
    ctx: ClassMethodDecoratorContext,
  ): void {
    const methodName = String(ctx.name);
    _pendingGiven.set(methodName, producers);
  };
}

// ---------------------------------------------------------------------------
// @Example decorator
// ---------------------------------------------------------------------------

/**
 * Register a method as a named example in the global registry.
 *
 * Accepts either a custom name string or an options object:
 *   @Example()                         — name = method name
 *   @Example('custom')                 — name = 'custom'
 *   @Example({ description: '...' })   — name = method name, with description
 *   @Example({ name: 'x', description: '...' }) — both set
 *
 * @param nameOrOptions  Optional custom name or options object.
 */
export function Example(
  nameOrOptions?: string | ExampleOptions,
  // deno-lint-ignore no-explicit-any
): (_value: (...args: any[]) => any, ctx: ClassMethodDecoratorContext) => void {
  // deno-lint-ignore no-explicit-any
  return function <T extends (...args: any[]) => any>(
    _value: T,
    ctx: ClassMethodDecoratorContext,
  ): void {
    const methodName = String(ctx.name);

    // Normalize: string -> { name }, object -> as-is, undefined -> {}
    const opts: ExampleOptions = typeof nameOrOptions === 'string'
      ? { name: nameOrOptions }
      : nameOrOptions ?? {};

    ctx.addInitializer(function () {
      // Drain any @Given metadata recorded for this method.
      const given = _pendingGiven.get(methodName) ?? [];
      _pendingGiven.delete(methodName);

      const meta: ExampleMetadata = {
        name: opts.name ?? methodName,
        method: methodName,
        given,
        ...(opts.description !== undefined
          ? { description: opts.description }
          : {}),
        ...(opts.tags !== undefined ? { tags: opts.tags } : {}),
      };

      _globalRegistry.register(meta);
    });
  };
}
