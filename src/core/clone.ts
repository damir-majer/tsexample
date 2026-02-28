import type { CloneStrategy } from './types.ts';

/** Check if a value is an instance of a user-defined class (not a plain object). */
export function isClassInstance(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto !== null && proto !== Object.prototype;
}

/** Clone a fixture value using the specified strategy. Default: structuredClone. */
export function cloneFixture(
  value: unknown,
  strategy?: CloneStrategy,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (typeof strategy === 'function') {
    return strategy(value);
  }

  return structuredClone(value);
}
