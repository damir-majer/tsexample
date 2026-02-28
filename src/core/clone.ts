import type { Cloneable, CloneStrategy } from './types.ts';

/** Check if a value is an instance of a user-defined class (not a plain object). */
export function isClassInstance(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto !== null && proto !== Object.prototype;
}

/** Check if a value implements the Cloneable interface. */
export function isCloneable(value: unknown): value is Cloneable {
  return (
    value !== null &&
    typeof value === 'object' &&
    'clone' in value &&
    typeof (value as Record<string, unknown>).clone === 'function'
  );
}

/**
 * Clone a fixture value using the specified strategy.
 *
 * Priority order:
 * 1. If custom CloneStrategy function provided -> use it
 * 2. If value implements Cloneable (has clone() method) -> call value.clone()
 * 3. Otherwise -> structuredClone (default)
 */
export function cloneFixture(
  value: unknown,
  strategy?: CloneStrategy,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  // Priority 1: Custom strategy function takes precedence over everything.
  if (typeof strategy === 'function') {
    return strategy(value);
  }

  // Priority 2: Cloneable interface preserves prototype chains.
  if (isCloneable(value)) {
    return value.clone();
  }

  // Priority 3: Default — structuredClone (loses prototypes on class instances).
  return structuredClone(value);
}
